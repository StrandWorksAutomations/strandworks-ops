begin;

create function public.kc_normalized_reply_wording(p_text text)
returns text language sql immutable strict security invoker set search_path = '' as $$
  select nullif(btrim(replace(p_text,E'\r\n',E'\n'),E' \t\r\n'),'');
$$;
revoke all on function public.kc_normalized_reply_wording(text) from public, anon, authenticated;
grant execute on function public.kc_normalized_reply_wording(text) to service_role;

alter table public.kc_fb_reply_voice_examples add column correction_reason text
  check (correction_reason is null or (
    item_id !~ '^manual-' and correction_reason in ('voice','job_match','job_details','link','other')
    and coalesce(public.kc_normalized_reply_wording(prepared_reply) <> public.kc_normalized_reply_wording(posted_reply),false)
  ));

-- A client using the original four-argument writer preserves an existing label while
-- the pair remains edited. Restoring the original wording also clears its old label.
create function public.kc_clear_unedited_reply_reason() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.correction_reason := null;
  return new;
end;
$$;
revoke all on function public.kc_clear_unedited_reply_reason() from public, anon, authenticated;
create trigger kc_clear_unedited_reply_reason before update of prepared_reply,posted_reply on public.kc_fb_reply_voice_examples
for each row when (old.correction_reason is not null and new.correction_reason is not null
  and not coalesce(public.kc_normalized_reply_wording(new.prepared_reply) <> public.kc_normalized_reply_wording(new.posted_reply),false))
execute function public.kc_clear_unedited_reply_reason();

create function public.kc_save_fb_posted_reply_with_reason(
  p_item_id text, p_prepared_reply text, p_posted_reply text, p_expected_updated_at timestamptz, p_correction_reason text
) returns setof public.kc_fb_reply_voice_examples
language plpgsql security invoker set search_path = '' as $$
declare
  prior public.kc_fb_reply_voice_examples;
  saved public.kc_fb_reply_voice_examples;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_item_id,813));
  if exists (select 1 from public.kc_fb_reply_delivery_leases where item_id = p_item_id and expires_at > clock_timestamp()) then
    raise sqlstate 'PT409' using message='reply_delivery_in_progress';
  end if;
  select * into prior from public.kc_fb_reply_voice_examples where item_id = p_item_id for update;
  if found and prior.updated_at is distinct from p_expected_updated_at
     and prior.correction_reason is distinct from p_correction_reason then return; end if;

  select * into saved from public.kc_save_fb_posted_reply(p_item_id,p_prepared_reply,p_posted_reply,p_expected_updated_at);
  if not found then return; end if;
  if p_correction_reason is not null and (p_correction_reason not in ('voice','job_match','job_details','link','other')
     or not coalesce(public.kc_normalized_reply_wording(saved.prepared_reply) <> public.kc_normalized_reply_wording(saved.posted_reply),false)) then
    raise sqlstate 'PT400' using message='invalid_reply_correction_reason';
  end if;
  if saved.prepared_reply is not null and saved.correction_reason is distinct from p_correction_reason then
    update public.kc_fb_reply_voice_examples set correction_reason=p_correction_reason, updated_at=clock_timestamp()
    where item_id=p_item_id returning * into saved;
  end if;
  return next saved;
end;
$$;
revoke all on function public.kc_save_fb_posted_reply_with_reason(text,text,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.kc_save_fb_posted_reply_with_reason(text,text,text,timestamptz,text) to service_role;

-- Counts use the actual posting date, even when the owner labels the edit later.
create view public.kc_fb_reply_correction_reason_days with (security_invoker = true) as
with pairs as (
  select (o.posted_at at time zone 'America/New_York')::date as day,
    public.kc_normalized_reply_wording(o.posted_reply) as posted,
    public.kc_normalized_reply_wording(coalesce(b.prepared_reply,v.prepared_reply)) as original,
    public.kc_normalized_reply_wording(v.prepared_reply) as example_original,
    public.kc_normalized_reply_wording(v.posted_reply) as example_posted, v.correction_reason
  from public.kc_reply_outcomes o
  left join public.kc_reply_draft_baselines b on b.item_id=o.item_id
  left join public.kc_fb_reply_voice_examples v on v.item_id=o.item_id
  where o.posted_at is not null
)
select day, coalesce(case when example_original=original and example_posted=posted then correction_reason end,'unlabeled') as reason,
  count(*) as count from pairs where original <> posted group by 1,2;
revoke all on public.kc_fb_reply_correction_reason_days from public, anon, authenticated;
grant select on public.kc_fb_reply_correction_reason_days to service_role;

create table public.kc_fb_reply_dismissals (
  item_id text not null check (item_id ~ '^[0-9a-f]{24}$'),
  dismissed_at timestamptz not null,
  reason text not null check (reason in ('No real match','Wrong facts','Already answered','Bad tone','Not worth it')),
  primary key (item_id,dismissed_at)
);
alter table public.kc_fb_reply_dismissals enable row level security;
revoke all on public.kc_fb_reply_dismissals from public, anon, authenticated;
grant select, insert on public.kc_fb_reply_dismissals to service_role;
create view public.kc_fb_dismissal_reason_days with (security_invoker = true) as
select to_char(dismissed_at at time zone 'America/New_York','YYYY-MM-DD') as day, reason, count(*) as count
from public.kc_fb_reply_dismissals group by 1,2;
revoke all on public.kc_fb_dismissal_reason_days from public, anon, authenticated;
grant select on public.kc_fb_dismissal_reason_days to service_role;

commit;
