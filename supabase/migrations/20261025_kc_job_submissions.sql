-- Kinetic Clinician: recruiter job submissions with an owner review queue.
-- Recruiters submit on kineticclinician.com/recruiters/post/ -> Vercel function
-- api/submit-job.mjs -> rpc kc_job_submit (the only write path for anon).
-- The owner reviews in the cockpit (/jobs-review, service role) and approves
-- with kc_job_submission_review, which inserts the job into kc_posted_jobs:
-- the same table /admin/ publishes into, so it gets the same ranking and /j/ page.
-- Applied to bniuiwbwumpymxiesyyt on 2026-10-25 via the Supabase MCP.

create table if not exists public.kc_job_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  title text not null check (length(title) between 2 and 200),
  role text not null check (role in ('rn', 'lpn', 'cna', 'emt', 'paramedic')),
  roles text[] not null default '{}' check (roles <@ array['rn', 'lpn', 'cna', 'emt', 'paramedic']::text[]),
  employer text not null check (length(employer) between 2 and 160),
  location text not null check (length(location) between 2 and 160),
  region text check (region ~ '^[A-Z]{2}$'),
  employment_type text check (length(employment_type) <= 60),
  salary jsonb not null check (
    (salary->>'min')::numeric > 0 and (salary->>'max')::numeric >= (salary->>'min')::numeric
    and salary->>'period' in ('hour', 'day', 'shift', 'week', 'month', 'year')),
  apply_url text not null check (apply_url ~ '^https://' and length(apply_url) <= 600),
  description text check (length(description) <= 600),
  recruiter_name text not null check (length(recruiter_name) between 2 and 120),
  work_email text not null check (work_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(work_email) <= 200),
  agency_name text not null check (length(agency_name) between 2 and 160),
  flags text[] not null default '{}',
  ip_hash text check (length(ip_hash) <= 128),
  reviewed_at timestamptz,
  reviewed_by text,
  reject_reason text check (length(reject_reason) <= 500),
  posted_job_id text references public.kc_posted_jobs(id) on delete set null
);

create index if not exists kc_job_submissions_pending on public.kc_job_submissions (created_at) where status = 'pending';
create index if not exists kc_job_submissions_email_day on public.kc_job_submissions (lower(work_email), created_at);
create index if not exists kc_job_submissions_ip_day on public.kc_job_submissions (ip_hash, created_at);

-- No policies: anon and authenticated cannot touch the table directly.
alter table public.kc_job_submissions enable row level security;
revoke all on public.kc_job_submissions from anon, authenticated;

-- The submit path. Re-checks the shape (the function validates first) and
-- enforces 5 a day per IP and per work email, plus a site-wide daily ceiling.
create or replace function public.kc_job_submit(p_sub jsonb, p_ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email text := lower(trim(coalesce(p_sub->>'work_email', '')));
  v_id uuid;
  v_roles text[];
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{16,128}$' then raise exception 'kc: bad request'; end if;
  if (select count(*) from public.kc_job_submissions where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= 5
     or (select count(*) from public.kc_job_submissions where lower(work_email) = v_email and created_at > now() - interval '1 day') >= 5 then
    raise exception 'kc: rate limit';
  end if;
  if (select count(*) from public.kc_job_submissions where created_at > now() - interval '1 day') >= 300 then
    raise exception 'kc: rate limit';
  end if;
  v_roles := array(select distinct r from jsonb_array_elements_text(coalesce(p_sub->'roles', '[]'::jsonb)) r
                   where r in ('rn', 'lpn', 'cna', 'emt', 'paramedic'));
  insert into public.kc_job_submissions (title, role, roles, employer, location, region, employment_type, salary,
    apply_url, description, recruiter_name, work_email, agency_name, flags, ip_hash)
  values (
    p_sub->>'title', p_sub->>'role', v_roles, p_sub->>'employer', p_sub->>'location', nullif(p_sub->>'region', ''),
    nullif(p_sub->>'employment_type', ''),
    jsonb_build_object('min', (p_sub->'salary'->>'min')::numeric, 'max', (p_sub->'salary'->>'max')::numeric,
      'period', p_sub->'salary'->>'period', 'currency', 'USD', 'currency_symbol', '$'),
    p_sub->>'apply_url', nullif(p_sub->>'description', ''), p_sub->>'recruiter_name', v_email, p_sub->>'agency_name',
    array(select left(f, 40) from jsonb_array_elements_text(coalesce(p_sub->'flags', '[]'::jsonb)) f limit 12),
    p_ip_hash)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'status', 'pending');
end $function$;

revoke all on function public.kc_job_submit(jsonb, text) from public;
grant execute on function public.kc_job_submit(jsonb, text) to anon, authenticated, service_role;

-- Owner decision (cockpit, service role only). Approve publishes the job into
-- kc_posted_jobs with a fresh 30-day expiry; reject records the reason.
create or replace function public.kc_job_submission_review(p_id uuid, p_action text, p_reason text default null, p_reviewer text default 'owner')
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  s public.kc_job_submissions;
  v_job_id text;
begin
  if p_action not in ('approve', 'reject') then raise exception 'kc: action must be approve or reject'; end if;
  select * into s from public.kc_job_submissions where id = p_id for update;
  if not found or s.status <> 'pending' then raise exception 'kc: submission is not pending'; end if;
  if p_action = 'reject' then
    if coalesce(trim(p_reason), '') = '' then raise exception 'kc: a reject needs a reason'; end if;
    update public.kc_job_submissions set status = 'rejected', reject_reason = left(trim(p_reason), 500),
      reviewed_at = now(), reviewed_by = left(p_reviewer, 120) where id = p_id returning * into s;
    return to_jsonb(s);
  end if;
  if exists (select 1 from public.kc_posted_jobs where source_url = s.apply_url) then
    raise exception 'kc: that job link is already posted';
  end if;
  v_job_id := substr(md5(random()::text || clock_timestamp()::text || s.id::text), 1, 8);
  insert into public.kc_posted_jobs (id, source_url, title, role, roles, employer, location, region, employment_type,
    salary, pay_evidence, pay_source, description, expires_at, status, posted_by)
  values (v_job_id, s.apply_url, s.title, s.role, case when cardinality(s.roles) > 0 then s.roles else array[s.role] end,
    s.employer, s.location, s.region, s.employment_type, s.salary, 'Pay range entered by the employer when posting.',
    'owner_entered', s.description, now() + interval '30 days', 'live', 'recruiter-submission');
  update public.kc_job_submissions set status = 'approved', posted_job_id = v_job_id, reviewed_at = now(),
    reviewed_by = left(p_reviewer, 120) where id = p_id returning * into s;
  return to_jsonb(s);
end $function$;

revoke all on function public.kc_job_submission_review(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.kc_job_submission_review(uuid, text, text, text) to service_role;
