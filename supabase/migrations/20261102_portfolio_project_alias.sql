-- The nested application's Git name is 3rd-rider; portfolio identity is 3rdrider.
-- Read both historical spellings without rewriting history or changing other projects.
create function public.portfolio_project_key(p_project text) returns text
language sql immutable set search_path = public as $$
  select case when p_project in ('3rd-rider','3rdrider') then '3rdrider' else p_project end;
$$;

create or replace function public.owner_loop_inbox(p_token text, p_project text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.owner_loop_check_token(p_token);
  return coalesce((
    select jsonb_agg(public.owner_loop_item_json(i) order by i.status = 'ruled' desc, i.ruled_at desc nulls last, i.due_at nulls last, i.created_at desc)
      from public.owner_loop_items i
     where (p_project is null or p_project = 'portfolio'
            or public.portfolio_project_key(i.project) = public.portfolio_project_key(p_project) or i.project = 'portfolio')
       and (i.status in ('ruled','picked_up')
            or (i.status = 'open' and i.kind = 'decision')
            or (i.kind in ('deadline','milestone') and i.status not in ('done','dropped') and i.due_at < now() + interval '14 days'))
  ), '[]'::jsonb);
end $$;

create or replace function public.portfolio_focus(p_token text, p_project text default 'portfolio') returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.owner_loop_check_token(p_token);
  return jsonb_build_object('checked_at',now(),'owner_loop',public.owner_loop_inbox(p_token,p_project),
    'objectives',coalesce((select jsonb_agg(to_jsonb(o) order by o.priority,o.target_at nulls last,o.id)
      from public.portfolio_objectives o where p_project is null or p_project='portfolio'
        or public.portfolio_project_key(o.project)=public.portfolio_project_key(p_project)),'[]'),
    'metrics',coalesce((select jsonb_agg(to_jsonb(m)-'payload_hash' order by m.observed_at desc,m.id desc)
      from public.portfolio_metrics m join public.portfolio_objectives o on o.id=m.objective_id
      where p_project is null or p_project='portfolio'
        or public.portfolio_project_key(o.project)=public.portfolio_project_key(p_project)),'[]'),
    'leases',coalesce((select jsonb_agg(to_jsonb(l) order by l.renewed_at desc)
      from public.portfolio_work_leases l where p_project is null or p_project='portfolio'
        or public.portfolio_project_key(l.project)=public.portfolio_project_key(p_project)),'[]'),
    'reports',coalesce((select jsonb_agg(to_jsonb(r)-'payload_hash' order by r.created_at desc,r.id desc)
      from public.portfolio_work_reports r join public.portfolio_objectives o on o.id=r.objective_id
      where p_project is null or p_project='portfolio'
        or public.portfolio_project_key(o.project)=public.portfolio_project_key(p_project)),'[]'));
end $$;

revoke all on function public.portfolio_project_key(text) from public,anon,authenticated;
grant execute on function public.portfolio_project_key(text) to service_role;
-- CREATE OR REPLACE preserves the existing token-gated grants on focus/inbox.
