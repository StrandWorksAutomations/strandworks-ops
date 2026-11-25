begin;

-- Each row in kc_job_clicks is one recorded outbound click to an employer.
-- Only daily totals cross into the cockpit. Dates with no records are omitted.
create view public.kc_reply_site_job_click_days with (security_invoker = true) as
select (at at time zone 'America/New_York')::date as day, count(*) as job_clicks
from public.kc_job_clicks
group by 1;

revoke all on public.kc_reply_site_job_click_days from public, anon, authenticated;
grant select on public.kc_reply_site_job_click_days to service_role;

commit;
