-- Owner loop v2 — applied to bniuiwbwumpymxiesyyt on 2026-10-24 as `owner_loop_v2_review_fixes`.
-- Fixes from Codex's review of v1: agents cannot override or rewrite owner rulings, single pickup,
-- re-ruling invalidates a claim, validated options, race-safe dedupe keyed by kind, refs past D-9999.

create or replace function public.owner_loop_next_ref() returns text
language plpgsql volatile set search_path = public as $$
declare n text := nextval('public.owner_loop_ref_seq')::text;
begin
  return 'D-' || case when length(n) < 4 then lpad(n, 4, '0') else n end;
end $$;
alter table public.owner_loop_items alter column ref set default public.owner_loop_next_ref();

create or replace function public.owner_loop_valid_options(p jsonb) returns boolean
language sql immutable set search_path = public as $$
  select jsonb_typeof(coalesce(p,'[]'::jsonb)) = 'array'
     and not exists (select 1 from jsonb_array_elements(case when jsonb_typeof(coalesce(p,'[]'::jsonb)) = 'array' then p else '[]'::jsonb end) e
                      where jsonb_typeof(e) <> 'object'
                         or coalesce(trim(e->>'key'),'') = '' or coalesce(trim(e->>'label'),'') = ''
                         or length(e->>'key') > 20 or length(e->>'label') > 300);
$$;

create or replace function public.owner_loop_ask(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_label text; v_row public.owner_loop_items; v_key text; v_kind text;
begin
  v_label := public.owner_loop_check_token(p_token);
  if coalesce(trim(p_item->>'title'),'') = '' then raise exception 'owner_loop: title required'; end if;
  v_kind := coalesce(nullif(p_item->>'kind',''),'decision');
  if not public.owner_loop_valid_options(p_item->'options') then
    raise exception 'owner_loop: options must be [{"key":..,"label":..}]';
  end if;
  if v_kind = 'decision' and jsonb_array_length(coalesce(p_item->'options','[]'::jsonb)) < 2 then
    raise exception 'owner_loop: a decision needs at least two options';
  end if;
  v_key := coalesce(nullif(p_item->>'dedupe_key',''),
                    encode(extensions.digest(v_kind || '|' || lower(coalesce(nullif(p_item->>'project',''),'portfolio')) || '|' || lower(trim(p_item->>'title')), 'sha256'), 'hex'));
  for attempt in 1..3 loop
    update public.owner_loop_items
       set repeat_count = repeat_count + 1, updated_at = now(),
           body = case when status = 'open' then coalesce(p_item->>'body', body) else body end
     where dedupe_key = v_key and status in ('open','ruled','picked_up')
    returning * into v_row;
    if found then
      insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, coalesce(p_item->>'origin_agent','agent'), 'repeated', null);
      return public.owner_loop_item_json(v_row) || jsonb_build_object('deduped', true);
    end if;
    insert into public.owner_loop_items(kind, project, title, body, options, recommended, origin_agent, origin_host,
                                        origin_session, origin_cwd, due_at, dedupe_key)
    values (v_kind, coalesce(nullif(p_item->>'project',''),'portfolio'),
            trim(p_item->>'title'), p_item->>'body', coalesce(p_item->'options','[]'::jsonb), nullif(p_item->>'recommended',''),
            coalesce(nullif(p_item->>'origin_agent',''),'claude'), p_item->>'origin_host', p_item->>'origin_session',
            p_item->>'origin_cwd', nullif(p_item->>'due_at','')::timestamptz, v_key)
    on conflict (dedupe_key) where status in ('open','ruled','picked_up') and dedupe_key is not null do nothing
    returning * into v_row;
    if found then
      insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, v_row.origin_agent, 'filed', v_label);
      return public.owner_loop_item_json(v_row) || jsonb_build_object('deduped', false);
    end if;
  end loop;
  raise exception 'owner_loop: could not file item (concurrent update), retry';
end $$;

create or replace function public.owner_loop_transition(p_token text, p_ref text, p_action text, p_actor text, p_note text default null, p_ruling text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.owner_loop_items;
begin
  perform public.owner_loop_check_token(p_token);
  select * into v_row from public.owner_loop_items where ref = upper(p_ref) for update;
  if not found then raise exception 'owner_loop: % not found', p_ref; end if;
  if v_row.status in ('done','dropped') then raise exception 'owner_loop: % is already %', v_row.ref, v_row.status; end if;
  if p_action = 'pickup' then
    if v_row.status = 'picked_up' then
      raise exception 'owner_loop: % already picked up by % at % — coordinate before acting', v_row.ref, v_row.picked_up_by, v_row.picked_up_at;
    end if;
    if v_row.kind = 'decision' and v_row.status <> 'ruled' then raise exception 'owner_loop: % is % — owner has not ruled', v_row.ref, v_row.status; end if;
    update public.owner_loop_items set status = 'picked_up', picked_up_at = now(), picked_up_by = p_actor, updated_at = now() where id = v_row.id returning * into v_row;
  elsif p_action = 'done' then
    if v_row.kind = 'decision' and v_row.status <> 'picked_up' then
      raise exception 'owner_loop: % is % — run pickup on the current ruling first', v_row.ref, v_row.status;
    end if;
    update public.owner_loop_items set status = 'done', done_at = now(), outcome_note = coalesce(p_note, outcome_note),
           picked_up_at = coalesce(picked_up_at, now()), picked_up_by = coalesce(picked_up_by, p_actor), updated_at = now()
     where id = v_row.id returning * into v_row;
  elsif p_action = 'drop' then
    if v_row.kind = 'decision' then raise exception 'owner_loop: only Jonathan can drop a decision (dashboard DROP)'; end if;
    update public.owner_loop_items set status = 'dropped', outcome_note = coalesce(p_note, outcome_note), updated_at = now() where id = v_row.id returning * into v_row;
  elsif p_action = 'resolve' then
    if v_row.status <> 'open' or v_row.kind <> 'decision' then
      raise exception 'owner_loop: % is % — resolve only records a chat answer to an open decision', v_row.ref, v_row.status;
    end if;
    if coalesce(trim(p_ruling),'') = '' or length(p_ruling) > 500 then raise exception 'owner_loop: resolve needs the owner''s ruling'; end if;
    update public.owner_loop_items set status = 'ruled', ruling = p_ruling, ruling_note = p_note, ruled_via = 'chat:' || p_actor, ruled_at = now(), updated_at = now()
     where id = v_row.id returning * into v_row;
  else
    raise exception 'owner_loop: unknown action %', p_action;
  end if;
  insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, p_actor, p_action, coalesce(p_note, p_ruling));
  return public.owner_loop_item_json(v_row);
end $$;

create or replace function public.owner_loop_rule(p_ref text, p_ruling text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.owner_loop_items;
begin
  if coalesce(trim(p_ruling),'') = '' then raise exception 'owner_loop: ruling required'; end if;
  update public.owner_loop_items set status = case when p_ruling in ('DROP','PARK') then 'dropped' else 'ruled' end,
         ruling = p_ruling, ruling_note = p_note, ruled_via = 'dashboard', ruled_at = now(),
         picked_up_at = null, picked_up_by = null, updated_at = now()
   where ref = upper(p_ref) returning * into v_row;
  if not found then raise exception 'owner_loop: % not found', p_ref; end if;
  insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, 'owner', 'ruled', p_ruling || coalesce(' — ' || p_note, ''));
  return public.owner_loop_item_json(v_row);
end $$;

revoke all on function public.owner_loop_next_ref() from public, anon, authenticated;
revoke all on function public.owner_loop_valid_options(jsonb) from public, anon, authenticated;
revoke all on function public.owner_loop_rule(text,text,text) from public, anon, authenticated;
grant execute on function public.owner_loop_rule(text,text,text) to service_role;
