-- Shared portfolio outcomes and evidence. Linear remains the task/status owner.
-- Agents use the existing owner-loop token; direct browser/table access is denied.

create table public.portfolio_objectives (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{2,79}$'),
  project text not null check (length(trim(project)) > 0),
  title text not null check (length(trim(title)) > 0),
  outcome text not null check (length(trim(outcome)) > 0),
  priority integer not null default 1 check (priority between 1 and 9),
  target_at timestamptz,
  review_at timestamptz,
  accountable_owner text not null default 'Jonathan',
  linear_project_id text,
  linear_milestone_id text,
  issue_ids jsonb not null default '[]' check (jsonb_typeof(issue_ids) = 'array'),
  metric_definitions jsonb not null default '[]' check (jsonb_typeof(metric_definitions) = 'array'),
  status text not null default 'active' check (status in ('active','paused','complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_metrics (
  id bigint generated always as identity primary key,
  objective_id text not null references public.portfolio_objectives(id),
  metric_id text not null check (length(trim(metric_id)) > 0),
  value jsonb not null,
  observed_at timestamptz not null,
  source text not null check (length(trim(source)) > 0),
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  idempotency_key text not null unique check (length(idempotency_key) between 8 and 200),
  payload_hash text not null,
  created_at timestamptz not null default now()
);
create index portfolio_metrics_objective_time on public.portfolio_metrics(objective_id, observed_at desc, id desc);

create table public.portfolio_work_leases (
  issue_id text primary key check (issue_id ~ '^[A-Z][A-Z0-9]*-[0-9]+$'),
  objective_id text not null references public.portfolio_objectives(id),
  project text not null,
  agent text not null,
  session_id text not null check (length(trim(session_id)) > 0),
  branch text,
  worktree text,
  claimed_at timestamptz not null default now(),
  renewed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 minutes'),
  released_at timestamptz,
  checkpoint text,
  next_action text,
  recovery_note text
);

create table public.portfolio_work_reports (
  id bigint generated always as identity primary key,
  issue_id text not null check (issue_id ~ '^[A-Z][A-Z0-9]*-[0-9]+$'),
  objective_id text not null references public.portfolio_objectives(id),
  session_id text not null check (length(trim(session_id)) > 0),
  agent text not null,
  result text not null check (length(trim(result)) > 0),
  evidence jsonb not null default '[]' check (jsonb_typeof(evidence) = 'array'),
  validation text,
  remaining text,
  next_action text,
  idempotency_key text not null unique check (length(idempotency_key) between 8 and 200),
  payload_hash text not null,
  created_at timestamptz not null default now()
);
create index portfolio_work_reports_objective_time on public.portfolio_work_reports(objective_id, created_at desc, id desc);

alter table public.portfolio_objectives enable row level security;
alter table public.portfolio_metrics enable row level security;
alter table public.portfolio_work_leases enable row level security;
alter table public.portfolio_work_reports enable row level security;
revoke all on public.portfolio_objectives, public.portfolio_metrics, public.portfolio_work_leases, public.portfolio_work_reports from public, anon, authenticated;
grant select on public.portfolio_objectives, public.portfolio_metrics, public.portfolio_work_leases, public.portfolio_work_reports to service_role;
revoke all on sequence public.portfolio_metrics_id_seq, public.portfolio_work_reports_id_seq from public, anon, authenticated;

-- Even a future privileged table writer cannot silently rewrite evidence.
create function public.portfolio_append_only() returns trigger language plpgsql set search_path = public as $$
begin raise exception 'portfolio: evidence is append-only'; end $$;
create trigger portfolio_metrics_append_only before update or delete on public.portfolio_metrics for each row execute function public.portfolio_append_only();
create trigger portfolio_reports_append_only before update or delete on public.portfolio_work_reports for each row execute function public.portfolio_append_only();

create function public.portfolio_objective_upsert(p_token text, p_objective jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.portfolio_objectives;
begin
  perform public.owner_loop_check_token(p_token);
  if jsonb_typeof(p_objective) <> 'object' then raise exception 'portfolio: objective object required'; end if;
  insert into public.portfolio_objectives(id,project,title,outcome,priority,target_at,review_at,accountable_owner,
      linear_project_id,linear_milestone_id,issue_ids,metric_definitions,status)
  values (p_objective->>'id', p_objective->>'project',p_objective->>'title',p_objective->>'outcome',
      coalesce((p_objective->>'priority')::integer,1),nullif(p_objective->>'target_at','')::timestamptz,
      nullif(p_objective->>'review_at','')::timestamptz,coalesce(nullif(p_objective->>'accountable_owner',''),'Jonathan'),
      p_objective->>'linear_project_id',p_objective->>'linear_milestone_id',coalesce(p_objective->'issue_ids','[]'),
      coalesce(p_objective->'metric_definitions','[]'),coalesce(p_objective->>'status','active'))
  on conflict (id) do update set project=excluded.project,title=excluded.title,outcome=excluded.outcome,
      priority=excluded.priority,target_at=excluded.target_at,review_at=excluded.review_at,
      accountable_owner=excluded.accountable_owner,linear_project_id=excluded.linear_project_id,
      linear_milestone_id=excluded.linear_milestone_id,issue_ids=excluded.issue_ids,
      metric_definitions=excluded.metric_definitions,status=excluded.status,updated_at=now()
  returning * into v_row;
  return to_jsonb(v_row);
end $$;

create function public.portfolio_focus(p_token text, p_project text default 'portfolio') returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.owner_loop_check_token(p_token);
  return jsonb_build_object('checked_at',now(),'owner_loop',public.owner_loop_inbox(p_token,p_project),
    'objectives',coalesce((select jsonb_agg(to_jsonb(o) order by o.priority,o.target_at nulls last,o.id)
      from public.portfolio_objectives o where p_project is null or p_project='portfolio' or o.project=p_project),'[]'),
    'metrics',coalesce((select jsonb_agg(to_jsonb(m)-'payload_hash' order by m.observed_at desc,m.id desc)
      from public.portfolio_metrics m join public.portfolio_objectives o on o.id=m.objective_id
      where p_project is null or p_project='portfolio' or o.project=p_project),'[]'),
    'leases',coalesce((select jsonb_agg(to_jsonb(l) order by l.renewed_at desc)
      from public.portfolio_work_leases l where p_project is null or p_project='portfolio' or l.project=p_project),'[]'),
    'reports',coalesce((select jsonb_agg(to_jsonb(r)-'payload_hash' order by r.created_at desc,r.id desc)
      from public.portfolio_work_reports r join public.portfolio_objectives o on o.id=r.objective_id
      where p_project is null or p_project='portfolio' or o.project=p_project),'[]'));
end $$;

create function public.portfolio_claim(p_token text, p_work jsonb, p_recovery_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.portfolio_work_leases; v_project text; v_issue text := upper(trim(p_work->>'issue_id'));
begin
  perform public.owner_loop_check_token(p_token);
  if coalesce(trim(p_work->>'session_id'),'')='' or coalesce(trim(p_work->>'agent'),'')='' then
    raise exception 'portfolio: session_id and agent required';
  end if;
  select project into v_project from public.portfolio_objectives where id=p_work->>'objective_id';
  if not found then raise exception 'portfolio: objective not found'; end if;
  -- Lock the key before the first INSERT too: concurrent first claims serialize.
  perform pg_advisory_xact_lock(hashtextextended('portfolio-work:' || coalesce(v_issue,''),0));
  select * into v_row from public.portfolio_work_leases where issue_id=v_issue for update;
  if found and v_row.released_at is null then
    if v_row.expires_at <= now() then
      if coalesce(trim(p_recovery_note),'')='' then
        raise exception 'portfolio: expired lease requires a recovery acknowledgment after inspecting Linear, branch and checkpoint';
      end if;
    elsif v_row.session_id=p_work->>'session_id' and v_row.agent=p_work->>'agent' then
      if v_row.objective_id <> p_work->>'objective_id' then raise exception 'portfolio: active claim belongs to another objective'; end if;
      return to_jsonb(v_row);
    else
      raise exception 'portfolio: issue % already claimed by % session % until %',v_issue,v_row.agent,v_row.session_id,v_row.expires_at;
    end if;
  end if;
  insert into public.portfolio_work_leases(issue_id,objective_id,project,agent,session_id,branch,worktree,checkpoint,next_action,recovery_note)
  values(v_issue,p_work->>'objective_id',v_project,p_work->>'agent',p_work->>'session_id',p_work->>'branch',p_work->>'worktree',
    v_row.checkpoint,v_row.next_action,nullif(trim(p_recovery_note),''))
  on conflict(issue_id) do update set objective_id=excluded.objective_id,project=excluded.project,agent=excluded.agent,
    session_id=excluded.session_id,branch=excluded.branch,worktree=excluded.worktree,claimed_at=now(),renewed_at=now(),
    expires_at=now()+interval '60 minutes',released_at=null,recovery_note=excluded.recovery_note
  returning * into v_row;
  return to_jsonb(v_row);
end $$;

create function public.portfolio_checkpoint(p_token text,p_issue_id text,p_session_id text,p_checkpoint text,p_next_action text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.portfolio_work_leases;
begin
  perform public.owner_loop_check_token(p_token);
  if coalesce(trim(p_checkpoint),'')='' then raise exception 'portfolio: checkpoint required'; end if;
  select * into v_row from public.portfolio_work_leases where issue_id=upper(p_issue_id) for update;
  if not found or v_row.released_at is not null or v_row.session_id is distinct from p_session_id then raise exception 'portfolio: current session does not own this lease'; end if;
  if v_row.expires_at <= now() then raise exception 'portfolio: lease expired; claim with recovery acknowledgment before continuing'; end if;
  update public.portfolio_work_leases set checkpoint=p_checkpoint,next_action=p_next_action,renewed_at=now(),expires_at=now()+interval '60 minutes'
    where issue_id=v_row.issue_id returning * into v_row;
  return to_jsonb(v_row);
end $$;

create function public.portfolio_release(p_token text,p_issue_id text,p_session_id text,p_note text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.portfolio_work_leases;
begin
  perform public.owner_loop_check_token(p_token);
  if coalesce(trim(p_note),'')='' then raise exception 'portfolio: release note required'; end if;
  select * into v_row from public.portfolio_work_leases where issue_id=upper(p_issue_id) for update;
  if not found or v_row.session_id is distinct from p_session_id then raise exception 'portfolio: current session does not own this lease'; end if;
  if v_row.released_at is not null then return to_jsonb(v_row); end if;
  update public.portfolio_work_leases set released_at=now(),checkpoint=p_note where issue_id=v_row.issue_id returning * into v_row;
  return to_jsonb(v_row);
end $$;

create function public.portfolio_report(p_token text,p_report jsonb) returns jsonb
language plpgsql security definer set search_path = public,extensions as $$
declare v_row public.portfolio_work_reports; v_hash text := encode(extensions.digest(p_report::text,'sha256'),'hex');
begin
  perform public.owner_loop_check_token(p_token);
  insert into public.portfolio_work_reports(issue_id,objective_id,session_id,agent,result,evidence,validation,remaining,next_action,idempotency_key,payload_hash)
  values(upper(p_report->>'issue_id'),p_report->>'objective_id',p_report->>'session_id',p_report->>'agent',p_report->>'result',
    coalesce(p_report->'evidence','[]'),p_report->>'validation',p_report->>'remaining',p_report->>'next_action',p_report->>'idempotency_key',v_hash)
  on conflict(idempotency_key) do nothing returning * into v_row;
  if not found then
    select * into v_row from public.portfolio_work_reports where idempotency_key=p_report->>'idempotency_key';
    if v_row.payload_hash<>v_hash then raise exception 'portfolio: idempotency key already used with different report'; end if;
  end if;
  return to_jsonb(v_row)-'payload_hash';
end $$;

create function public.portfolio_metric(p_token text,p_observation jsonb) returns jsonb
language plpgsql security definer set search_path = public,extensions as $$
declare v_row public.portfolio_metrics; v_hash text := encode(extensions.digest(p_observation::text,'sha256'),'hex');
begin
  perform public.owner_loop_check_token(p_token);
  if not (p_observation ? 'value') then raise exception 'portfolio: value required (use JSON null for unknown)'; end if;
  if nullif(p_observation->>'observed_at','')::timestamptz > now()+interval '5 minutes' then raise exception 'portfolio: observation time is in the future'; end if;
  insert into public.portfolio_metrics(objective_id,metric_id,value,observed_at,source,evidence,idempotency_key,payload_hash)
  values(p_observation->>'objective_id',p_observation->>'metric_id',p_observation->'value',
    nullif(p_observation->>'observed_at','')::timestamptz,p_observation->>'source',coalesce(p_observation->'evidence','[]'),
    p_observation->>'idempotency_key',v_hash)
  on conflict(idempotency_key) do nothing returning * into v_row;
  if not found then
    select * into v_row from public.portfolio_metrics where idempotency_key=p_observation->>'idempotency_key';
    if v_row.payload_hash<>v_hash then raise exception 'portfolio: idempotency key already used with different observation'; end if;
  end if;
  return to_jsonb(v_row)-'payload_hash';
end $$;

revoke all on function public.portfolio_append_only() from public,anon,authenticated;
revoke all on function public.portfolio_focus(text,text), public.portfolio_objective_upsert(text,jsonb),
  public.portfolio_claim(text,jsonb,text),public.portfolio_checkpoint(text,text,text,text,text),
  public.portfolio_release(text,text,text,text),public.portfolio_report(text,jsonb),public.portfolio_metric(text,jsonb) from public,anon,authenticated;
grant execute on function public.portfolio_focus(text,text),public.portfolio_objective_upsert(text,jsonb),
  public.portfolio_claim(text,jsonb,text),public.portfolio_checkpoint(text,text,text,text,text),
  public.portfolio_release(text,text,text,text),public.portfolio_report(text,jsonb),public.portfolio_metric(text,jsonb) to anon,authenticated,service_role;
