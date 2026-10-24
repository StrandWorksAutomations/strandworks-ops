-- Owner loop v1 — applied to bniuiwbwumpymxiesyyt on 2026-10-24 as migration `owner_loop_v1`.
-- Decisions/deadlines between the owner dashboard and agents. See loop/README.md.

create extension if not exists pgcrypto with schema extensions;

create sequence if not exists public.owner_loop_ref_seq start 1;

create table public.owner_loop_items (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('D-' || lpad(nextval('public.owner_loop_ref_seq')::text, 4, '0')),
  kind text not null default 'decision' check (kind in ('decision','deadline','milestone','alert')),
  project text not null default 'portfolio',
  title text not null,
  body text,
  options jsonb not null default '[]'::jsonb,
  recommended text,
  origin_agent text not null default 'claude',
  origin_host text,
  origin_session text,
  origin_cwd text,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','ruled','picked_up','done','dropped')),
  ruling text,
  ruling_note text,
  ruled_via text,
  ruled_at timestamptz,
  picked_up_at timestamptz,
  picked_up_by text,
  outcome_note text,
  done_at timestamptz,
  dedupe_key text,
  repeat_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index owner_loop_items_dedupe_open on public.owner_loop_items(dedupe_key) where status in ('open','ruled','picked_up') and dedupe_key is not null;
create index owner_loop_items_status_project on public.owner_loop_items(status, project);
create index owner_loop_items_due on public.owner_loop_items(due_at) where due_at is not null;

create table public.owner_loop_events (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.owner_loop_items(id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null,
  type text not null,
  note text
);
create index owner_loop_events_item on public.owner_loop_events(item_id, at);
create index owner_loop_events_at on public.owner_loop_events(at desc);

create table public.owner_loop_agent_tokens (
  token_sha256 text primary key,
  label text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.owner_loop_items enable row level security;
alter table public.owner_loop_events enable row level security;
alter table public.owner_loop_agent_tokens enable row level security;

create or replace function public.owner_loop_check_token(p_token text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_label text;
begin
  select label into v_label from public.owner_loop_agent_tokens
   where token_sha256 = encode(extensions.digest(coalesce(p_token,''), 'sha256'), 'hex') and revoked_at is null;
  if v_label is null then raise exception 'owner_loop: invalid agent token' using errcode = '28000'; end if;
  return v_label;
end $$;

create or replace function public.owner_loop_item_json(i public.owner_loop_items) returns jsonb
language sql stable set search_path = public as $$
  select to_jsonb(i) - 'dedupe_key';
$$;

-- Agent: file a decision / deadline / milestone / alert. Open duplicates (same dedupe_key) bump repeat_count.
create or replace function public.owner_loop_ask(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_label text; v_row public.owner_loop_items; v_key text;
begin
  v_label := public.owner_loop_check_token(p_token);
  if coalesce(trim(p_item->>'title'),'') = '' then raise exception 'owner_loop: title required'; end if;
  v_key := coalesce(nullif(p_item->>'dedupe_key',''),
                    encode(extensions.digest(lower(coalesce(p_item->>'project','portfolio')) || '|' || lower(trim(p_item->>'title')), 'sha256'), 'hex'));
  update public.owner_loop_items set repeat_count = repeat_count + 1, updated_at = now(),
         body = coalesce(p_item->>'body', body)
   where dedupe_key = v_key and status in ('open','ruled','picked_up')
  returning * into v_row;
  if found then
    insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, coalesce(p_item->>'origin_agent','agent'), 'repeated', null);
    return public.owner_loop_item_json(v_row) || jsonb_build_object('deduped', true);
  end if;
  insert into public.owner_loop_items(kind, project, title, body, options, recommended, origin_agent, origin_host,
                                      origin_session, origin_cwd, due_at, dedupe_key)
  values (coalesce(nullif(p_item->>'kind',''),'decision'), coalesce(nullif(p_item->>'project',''),'portfolio'),
          trim(p_item->>'title'), p_item->>'body', coalesce(p_item->'options','[]'::jsonb), nullif(p_item->>'recommended',''),
          coalesce(nullif(p_item->>'origin_agent',''),'claude'), p_item->>'origin_host', p_item->>'origin_session',
          p_item->>'origin_cwd', nullif(p_item->>'due_at','')::timestamptz, v_key)
  returning * into v_row;
  insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, v_row.origin_agent, 'filed', v_label);
  return public.owner_loop_item_json(v_row) || jsonb_build_object('deduped', false);
end $$;

-- Agent: what needs attention in this project (rulings to act on + open asks + upcoming deadlines).
create or replace function public.owner_loop_inbox(p_token text, p_project text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.owner_loop_check_token(p_token);
  return coalesce((
    select jsonb_agg(public.owner_loop_item_json(i) order by i.status = 'ruled' desc, i.ruled_at desc nulls last, i.due_at nulls last, i.created_at desc)
      from public.owner_loop_items i
     where (p_project is null or p_project = 'portfolio' or i.project = p_project or i.project = 'portfolio')
       and (i.status in ('ruled','picked_up')
            or (i.status = 'open' and i.kind = 'decision')
            or (i.kind in ('deadline','milestone') and i.status not in ('done','dropped') and i.due_at < now() + interval '14 days'))
  ), '[]'::jsonb);
end $$;

create or replace function public.owner_loop_get(p_token text, p_ref text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.owner_loop_items;
begin
  perform public.owner_loop_check_token(p_token);
  select * into v_row from public.owner_loop_items where ref = upper(p_ref);
  if not found then raise exception 'owner_loop: % not found', p_ref; end if;
  return public.owner_loop_item_json(v_row) || jsonb_build_object('events',
    (select coalesce(jsonb_agg(to_jsonb(e) - 'item_id' order by e.at), '[]'::jsonb) from public.owner_loop_events e where e.item_id = v_row.id));
end $$;

-- Agent lifecycle: pickup (acting on a ruling), done (with outcome), drop, resolve (owner answered in chat; agent records it).
create or replace function public.owner_loop_transition(p_token text, p_ref text, p_action text, p_actor text, p_note text default null, p_ruling text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.owner_loop_items;
begin
  perform public.owner_loop_check_token(p_token);
  select * into v_row from public.owner_loop_items where ref = upper(p_ref) for update;
  if not found then raise exception 'owner_loop: % not found', p_ref; end if;
  if p_action = 'pickup' then
    if v_row.status not in ('ruled','picked_up') and v_row.kind = 'decision' then raise exception 'owner_loop: % is % — owner has not ruled', v_row.ref, v_row.status; end if;
    update public.owner_loop_items set status = 'picked_up', picked_up_at = now(), picked_up_by = p_actor, updated_at = now() where id = v_row.id returning * into v_row;
  elsif p_action = 'done' then
    if v_row.kind = 'decision' and v_row.status = 'open' then raise exception 'owner_loop: % has no ruling yet', v_row.ref; end if;
    update public.owner_loop_items set status = 'done', done_at = now(), outcome_note = coalesce(p_note, outcome_note),
           picked_up_at = coalesce(picked_up_at, now()), picked_up_by = coalesce(picked_up_by, p_actor), updated_at = now()
     where id = v_row.id returning * into v_row;
  elsif p_action = 'drop' then
    update public.owner_loop_items set status = 'dropped', outcome_note = coalesce(p_note, outcome_note), updated_at = now() where id = v_row.id returning * into v_row;
  elsif p_action = 'resolve' then
    if coalesce(p_ruling,'') = '' then raise exception 'owner_loop: resolve needs the owner''s ruling'; end if;
    update public.owner_loop_items set status = 'ruled', ruling = p_ruling, ruling_note = p_note, ruled_via = 'chat:' || p_actor, ruled_at = now(), updated_at = now()
     where id = v_row.id returning * into v_row;
  else
    raise exception 'owner_loop: unknown action %', p_action;
  end if;
  insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, p_actor, p_action, coalesce(p_note, p_ruling));
  return public.owner_loop_item_json(v_row);
end $$;

-- Owner (cockpit, service_role only): rule on an item.
create or replace function public.owner_loop_rule(p_ref text, p_ruling text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.owner_loop_items;
begin
  if coalesce(p_ruling,'') = '' then raise exception 'owner_loop: ruling required'; end if;
  update public.owner_loop_items set status = case when p_ruling in ('DROP','PARK') then 'dropped' else 'ruled' end,
         ruling = p_ruling, ruling_note = p_note, ruled_via = 'dashboard', ruled_at = now(), updated_at = now()
   where ref = upper(p_ref) returning * into v_row;
  if not found then raise exception 'owner_loop: % not found', p_ref; end if;
  insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, 'owner', 'ruled', p_ruling || coalesce(' — ' || p_note, ''));
  return public.owner_loop_item_json(v_row);
end $$;

revoke all on function public.owner_loop_check_token(text) from public, anon, authenticated;
revoke all on function public.owner_loop_item_json(public.owner_loop_items) from public, anon, authenticated;
revoke all on function public.owner_loop_rule(text,text,text) from public, anon, authenticated;
grant execute on function public.owner_loop_rule(text,text,text) to service_role;
grant execute on function public.owner_loop_ask(text,jsonb), public.owner_loop_inbox(text,text), public.owner_loop_get(text,text),
  public.owner_loop_transition(text,text,text,text,text,text) to anon, authenticated, service_role;

-- owner_loop_v1_revoke_table_grants (same day): tables reachable only via RPCs / service role.
revoke all on public.owner_loop_items, public.owner_loop_events, public.owner_loop_agent_tokens from anon, authenticated;
revoke all on sequence public.owner_loop_ref_seq from anon, authenticated;
