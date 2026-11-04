-- owner_loop_v3_actions (STR-1133): owner can open, respond to, save, archive,
-- delete and edit any item. Each response is an outbox row: the relay posts it
-- to Linear and, when urgent, hands it to the requesting agent or a new one.
alter table public.owner_loop_items
  add column if not exists saved_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists brief_slug text;

create table if not exists public.owner_loop_responses (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.owner_loop_items(id) on delete cascade,
  option_key text,
  body text,
  urgent boolean not null default false,
  created_at timestamptz not null default now(),
  linear_issue_id text,
  linear_issue_key text,
  linear_issue_url text,
  linear_synced_at timestamptz,
  linear_error text,
  dispatch_state text not null default 'none'
    check (dispatch_state in ('none','queued','delivering','delivered','spawned','failed')),
  dispatch_target text,
  dispatch_note text,
  dispatch_at timestamptz,
  check (option_key is not null or coalesce(trim(body),'') <> '')
);
create index if not exists owner_loop_responses_item on public.owner_loop_responses(item_id, created_at desc);
create index if not exists owner_loop_responses_linear on public.owner_loop_responses(created_at) where linear_synced_at is null;
create index if not exists owner_loop_responses_dispatch on public.owner_loop_responses(dispatch_state) where dispatch_state in ('queued','delivering');
alter table public.owner_loop_responses enable row level security;
revoke all on public.owner_loop_responses from anon, authenticated;

create or replace function public.owner_loop_respond(p_ref text, p_option text, p_text text, p_urgent boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_option text := nullif(trim(coalesce(p_option,'')),''); v_text text := nullif(trim(coalesce(p_text,'')),'');
        v_item jsonb; v_id uuid; v_response public.owner_loop_responses;
begin
  if v_option is null and v_text is null then raise exception 'owner_loop: a response needs an option or text'; end if;
  v_item := public.owner_loop_rule(p_ref, coalesce(v_option, v_text), case when v_option is not null then v_text end);
  v_id := (v_item->>'id')::uuid;
  insert into public.owner_loop_responses(item_id, option_key, body, urgent, dispatch_state)
  values (v_id, v_option, v_text, coalesce(p_urgent,false), case when coalesce(p_urgent,false) then 'queued' else 'none' end)
  returning * into v_response;
  return v_item || jsonb_build_object('response', to_jsonb(v_response));
end $$;

-- An instruction about something that has no owner-loop item (an objective or a
-- business date) becomes a new item, so it follows the same path as any response.
create or replace function public.owner_loop_note(p_project text, p_title text, p_body text, p_cwd text, p_text text, p_urgent boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_row public.owner_loop_items;
begin
  if coalesce(trim(p_title),'') = '' then raise exception 'owner_loop: title required'; end if;
  insert into public.owner_loop_items(kind, project, title, body, options, origin_agent, origin_cwd)
  values ('milestone', coalesce(nullif(p_project,''),'portfolio'), trim(p_title), p_body, '[]'::jsonb, 'owner', p_cwd)
  returning * into v_row;
  insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, 'owner', 'filed', 'dashboard');
  return public.owner_loop_respond(v_row.ref, null, p_text, p_urgent);
end $$;

create or replace function public.owner_loop_owner_action(p_ref text, p_action text, p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_row public.owner_loop_items; v_ref text := upper(p_ref); v_note text;
begin
  select * into v_row from public.owner_loop_items where ref = v_ref;
  if not found then raise exception 'owner_loop: % not found', p_ref; end if;
  case p_action
    when 'save' then update public.owner_loop_items set saved_at = now(), updated_at = now() where id = v_row.id;
    when 'unsave' then update public.owner_loop_items set saved_at = null, updated_at = now() where id = v_row.id;
    when 'archive' then update public.owner_loop_items set archived_at = now(), updated_at = now() where id = v_row.id;
    when 'unarchive' then update public.owner_loop_items set archived_at = null, updated_at = now() where id = v_row.id;
    -- Delete drops the item for agents and hides it. The row stays so restore works.
    when 'delete' then
      update public.owner_loop_items set deleted_at = now(), status = 'dropped', done_at = now(), updated_at = now() where id = v_row.id;
    when 'restore' then
      update public.owner_loop_items set deleted_at = null, archived_at = null, done_at = null, updated_at = now(),
             status = case when ruling is not null and ruling not in ('DROP','PARK') then 'ruled' else 'open' end
       where id = v_row.id;
    when 'done' then
      update public.owner_loop_items set status = 'done', done_at = now(), updated_at = now(),
             outcome_note = coalesce(nullif(p_args->>'note',''), outcome_note, 'Closed by Jonathan on the dashboard.')
       where id = v_row.id;
    when 'edit' then
      if p_args ? 'title' and coalesce(trim(p_args->>'title'),'') = '' then raise exception 'owner_loop: title required'; end if;
      update public.owner_loop_items set
             title = case when p_args ? 'title' then trim(p_args->>'title') else title end,
             due_at = case when p_args ? 'due_at' then nullif(p_args->>'due_at','')::timestamptz else due_at end,
             updated_at = now()
       where id = v_row.id;
    when 'urgent' then
      update public.owner_loop_responses set urgent = true, dispatch_state = 'queued'
       where id = (select id from public.owner_loop_responses where item_id = v_row.id order by created_at desc limit 1)
         and dispatch_state = 'none';
      if not found then raise exception 'owner_loop: % has no response to mark urgent', p_ref; end if;
    else raise exception 'owner_loop: unknown action %', p_action;
  end case;
  v_note := case when p_action = 'edit' then p_args::text end;
  insert into public.owner_loop_events(item_id, actor, type, note) values (v_row.id, 'owner', p_action, v_note);
  select * into v_row from public.owner_loop_items where id = v_row.id;
  return public.owner_loop_item_json(v_row);
end $$;

-- Relay queue. mode: 'linear' (unposted), 'watch' (posted, not urgent, could be
-- marked urgent in Linear), 'dispatch' (urgent and not finished).
create or replace function public.owner_loop_outbox(p_token text, p_mode text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.owner_loop_check_token(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(r) || jsonb_build_object('item', public.owner_loop_item_json(i),
             'prior_issue', (select jsonb_build_object('id', p.linear_issue_id, 'key', p.linear_issue_key, 'url', p.linear_issue_url)
                               from public.owner_loop_responses p
                              where p.item_id = r.item_id and p.id <> r.id and p.linear_issue_id is not null
                              order by p.created_at desc limit 1)) order by r.created_at)
      from public.owner_loop_responses r join public.owner_loop_items i on i.id = r.item_id
     where case p_mode
             when 'linear' then r.linear_synced_at is null and r.created_at > now() - interval '14 days'
             when 'watch' then r.linear_issue_id is not null and not r.urgent and r.created_at > now() - interval '14 days'
             when 'dispatch' then r.dispatch_state in ('queued','delivering')
             else false end
  ), '[]'::jsonb);
end $$;

create or replace function public.owner_loop_outbox_mark(p_token text, p_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_label text; v_row public.owner_loop_responses;
begin
  v_label := public.owner_loop_check_token(p_token);
  update public.owner_loop_responses set
    linear_issue_id = coalesce(p_patch->>'linear_issue_id', linear_issue_id),
    linear_issue_key = coalesce(p_patch->>'linear_issue_key', linear_issue_key),
    linear_issue_url = coalesce(p_patch->>'linear_issue_url', linear_issue_url),
    linear_error = case when p_patch ? 'linear_error' then p_patch->>'linear_error' else linear_error end,
    linear_synced_at = case when (p_patch->>'linear_synced')::boolean then now() else linear_synced_at end,
    urgent = case when (p_patch->>'urgent')::boolean then true else urgent end,
    dispatch_state = case when (p_patch->>'urgent')::boolean and dispatch_state = 'none' then 'queued'
                          else coalesce(p_patch->>'dispatch_state', dispatch_state) end,
    dispatch_target = coalesce(p_patch->>'dispatch_target', dispatch_target),
    dispatch_note = coalesce(p_patch->>'dispatch_note', dispatch_note),
    dispatch_at = case when p_patch ? 'dispatch_state' then now() else dispatch_at end
  where id = p_id returning * into v_row;
  if not found then raise exception 'owner_loop: response % not found', p_id; end if;
  if p_patch ? 'dispatch_state' then
    insert into public.owner_loop_events(item_id, actor, type, note)
    values (v_row.item_id, v_label, 'dispatch', concat_ws(' · ', p_patch->>'dispatch_state', p_patch->>'dispatch_target', p_patch->>'dispatch_note'));
  end if;
  return to_jsonb(v_row);
end $$;

revoke all on function public.owner_loop_respond(text,text,text,boolean), public.owner_loop_note(text,text,text,text,text,boolean),
  public.owner_loop_owner_action(text,text,jsonb), public.owner_loop_outbox(text,text), public.owner_loop_outbox_mark(text,uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.owner_loop_respond(text,text,text,boolean), public.owner_loop_note(text,text,text,text,text,boolean),
  public.owner_loop_owner_action(text,text,jsonb) to service_role;
grant execute on function public.owner_loop_outbox(text,text), public.owner_loop_outbox_mark(text,uuid,jsonb) to anon, authenticated, service_role;

-- Agents can attach a brief when filing: swd ask --brief <slug>.
create or replace function public.owner_loop_attach_brief(p_token text, p_ref text, p_slug text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_row public.owner_loop_items;
begin
  perform public.owner_loop_check_token(p_token);
  if p_slug !~ '^[A-Za-z0-9._-]+$' then raise exception 'owner_loop: invalid brief slug'; end if;
  update public.owner_loop_items set brief_slug = p_slug, updated_at = now() where ref = upper(p_ref) returning * into v_row;
  if not found then raise exception 'owner_loop: % not found', p_ref; end if;
  return public.owner_loop_item_json(v_row);
end $$;
revoke all on function public.owner_loop_attach_brief(text,text,text) from public, anon, authenticated;
grant execute on function public.owner_loop_attach_brief(text,text,text) to anon, authenticated, service_role;
