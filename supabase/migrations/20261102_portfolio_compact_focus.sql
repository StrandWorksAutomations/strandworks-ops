-- Keep append-only evidence in storage; bootstrap only bounded current state.
-- Derived health ages its retained source time after selection by publication.
create index portfolio_metrics_latest_lookup on public.portfolio_metrics
  (objective_id, metric_id,
   (case when jsonb_typeof(value)='object' and value ? 'source_observed_at'
         then created_at else observed_at end) desc, id desc);
create index portfolio_metrics_history_lookup on public.portfolio_metrics (objective_id,id desc);
create index portfolio_reports_history_lookup on public.portfolio_work_reports (objective_id,id desc);

-- The view is migration-owner-backed and explicitly unavailable to public JWT
-- roles. This also supports PostgreSQL 14, before security_invoker views.
create view public.portfolio_latest_metrics with (security_barrier=true) as
  select distinct on (objective_id,metric_id)
    id,objective_id,metric_id,value,observed_at,source,evidence,idempotency_key,created_at
  from public.portfolio_metrics
  order by objective_id,metric_id,
    case when jsonb_typeof(value)='object' and value ? 'source_observed_at'
         then created_at else observed_at end desc,id desc;
revoke all on public.portfolio_latest_metrics from public,anon,authenticated;
grant select on public.portfolio_latest_metrics to service_role;

create or replace function public.portfolio_focus(p_token text,p_project text default 'portfolio') returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.owner_loop_check_token(p_token);
  return jsonb_build_object('checked_at',now(),'owner_loop',public.owner_loop_inbox(p_token,p_project),
    'objectives',coalesce((select jsonb_agg(to_jsonb(o) order by o.priority,o.target_at nulls last,o.id)
      from public.portfolio_objectives o where p_project is null or p_project='portfolio'
        or public.portfolio_project_key(o.project)=public.portfolio_project_key(p_project)),'[]'),
    'metrics',coalesce((select jsonb_agg(to_jsonb(m) order by m.objective_id,m.metric_id)
      from public.portfolio_latest_metrics m join public.portfolio_objectives o on o.id=m.objective_id
      where p_project is null or p_project='portfolio'
        or public.portfolio_project_key(o.project)=public.portfolio_project_key(p_project)),'[]'),
    'leases',coalesce((select jsonb_agg(to_jsonb(l) order by l.renewed_at desc,l.issue_id)
      from public.portfolio_work_leases l where l.released_at is null
        and (p_project is null or p_project='portfolio'
          or public.portfolio_project_key(l.project)=public.portfolio_project_key(p_project))),'[]'),
    'reports',coalesce((select jsonb_agg(to_jsonb(r)-'payload_hash' order by r.created_at desc,r.id desc)
      from public.portfolio_objectives o cross join lateral
        (select * from public.portfolio_work_reports r0 where r0.objective_id=o.id
         order by r0.created_at desc,r0.id desc limit 3) r
      where p_project is null or p_project='portfolio'
        or public.portfolio_project_key(o.project)=public.portfolio_project_key(p_project)),'[]'),
    'history',jsonb_build_object('rpc','portfolio_history','default_limit',20,'max_limit',100,'reports_per_objective',3));
end $$;

-- Immutable ID keysets avoid offset duplication/skips when new evidence arrives.
-- History is publication order; metric observed_at retains original source time.
create function public.portfolio_history(p_token text,p_objective_id text,
  p_kind text default 'reports',p_limit integer default 20,p_before_id bigint default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_items jsonb; v_more boolean; v_last bigint; v_limit integer := coalesce(p_limit,20);
begin
  perform public.owner_loop_check_token(p_token);
  if v_limit < 1 or v_limit > 100 then raise exception 'portfolio: history limit must be 1..100'; end if;
  if p_before_id is not null and p_before_id <= 0 then raise exception 'portfolio: positive history cursor required'; end if;
  if not exists(select 1 from public.portfolio_objectives where id=p_objective_id) then
    raise exception 'portfolio: objective not found';
  end if;
  if p_kind='metrics' then
    with page as (select * from public.portfolio_metrics
      where objective_id=p_objective_id and (p_before_id is null or id<p_before_id)
      order by id desc limit v_limit+1),
    numbered as (select page.*,row_number() over(order by id desc) as page_row from page)
    select coalesce(jsonb_agg(to_jsonb(n)-'payload_hash'-'page_row' order by id desc)
             filter(where page_row<=v_limit),'[]'),
      count(*)>v_limit,min(id) filter(where page_row<=v_limit)
      into v_items,v_more,v_last from numbered n;
  elsif p_kind='reports' then
    with page as (select * from public.portfolio_work_reports
      where objective_id=p_objective_id and (p_before_id is null or id<p_before_id)
      order by id desc limit v_limit+1),
    numbered as (select page.*,row_number() over(order by id desc) as page_row from page)
    select coalesce(jsonb_agg(to_jsonb(n)-'payload_hash'-'page_row' order by id desc)
             filter(where page_row<=v_limit),'[]'),
      count(*)>v_limit,min(id) filter(where page_row<=v_limit)
      into v_items,v_more,v_last from numbered n;
  else raise exception 'portfolio: history kind must be reports or metrics';
  end if;
  return jsonb_build_object('objective_id',p_objective_id,'kind',p_kind,'items',v_items,
    'next_before_id',case when v_more then v_last else null end,'limit',v_limit);
end $$;
revoke all on function public.portfolio_history(text,text,text,integer,bigint) from public,anon,authenticated;
grant execute on function public.portfolio_history(text,text,text,integer,bigint) to anon,authenticated,service_role;
-- CREATE OR REPLACE preserves token-gated focus grants and historical aliases.
