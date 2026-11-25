begin;

create table public.kc_fb_reply_voice_settings (
  id text primary key check (id = 'global'),
  instructions text not null check (length(instructions) <= 2000),
  updated_at timestamptz not null default clock_timestamp()
);
alter table public.kc_fb_reply_voice_settings enable row level security;
revoke all on public.kc_fb_reply_voice_settings from public, anon, authenticated;
grant select, insert, update on public.kc_fb_reply_voice_settings to service_role;

-- Empty text clears the instructions while retaining the revision for other open editors.
create function public.kc_save_fb_reply_voice_settings(p_instructions text, p_expected_updated_at timestamptz)
returns setof public.kc_fb_reply_voice_settings
language sql security invoker set search_path = '' as $$
  insert into public.kc_fb_reply_voice_settings as s (id, instructions)
  select 'global', p_instructions
  where p_expected_updated_at is null or exists (select 1 from public.kc_fb_reply_voice_settings where id = 'global')
  on conflict (id) do update
    set instructions = excluded.instructions,
        updated_at = case when s.instructions = excluded.instructions then s.updated_at else clock_timestamp() end
    where s.updated_at = p_expected_updated_at or s.instructions = excluded.instructions
  returning s.*;
$$;
revoke all on function public.kc_save_fb_reply_voice_settings(text, timestamptz) from public, anon, authenticated;
grant execute on function public.kc_save_fb_reply_voice_settings(text, timestamptz) to service_role;

-- A confirmed original must survive the worker pruning the queue after 14 days.
-- Capture only the separately identified prepared text for an actual posting receipt.
create table public.kc_reply_draft_baselines (
  item_id text primary key references public.kc_reply_outcomes(item_id) on delete cascade,
  prepared_reply text not null check (length(btrim(prepared_reply)) > 0)
);
alter table public.kc_reply_draft_baselines enable row level security;
revoke all on public.kc_reply_draft_baselines from public, anon, authenticated;
grant select, insert on public.kc_reply_draft_baselines to service_role;

create function public.kc_retain_posted_draft() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  reply_id text;
begin
  if tg_table_name = 'kc_reply_outcomes' then reply_id := new.item_id;
  else reply_id := new.id; end if;
  insert into public.kc_reply_draft_baselines (item_id, prepared_reply)
  select o.item_id, r.results->>'prepared_reply'
  from public.kc_reply_outcomes o join public.kc_fb_replies r on r.id = o.item_id
  where o.item_id = reply_id and jsonb_typeof(r.results->'prepared_reply') = 'string'
    and btrim(r.results->>'prepared_reply') <> ''
  on conflict (item_id) do nothing;
  return null;
end;
$$;
revoke all on function public.kc_retain_posted_draft() from public, anon, authenticated;
create trigger kc_retain_posted_draft after insert or update on public.kc_fb_replies
for each row when (new.status = 'posted' and jsonb_typeof(new.results->'prepared_reply') = 'string'
                    and btrim(new.results->>'prepared_reply') <> '')
execute function public.kc_retain_posted_draft();
create trigger kc_retain_receipt_draft after insert or update on public.kc_reply_outcomes
for each row execute function public.kc_retain_posted_draft();

insert into public.kc_reply_draft_baselines (item_id, prepared_reply)
select o.item_id, r.results->>'prepared_reply' from public.kc_reply_outcomes o
join public.kc_fb_replies r on r.id = o.item_id
where jsonb_typeof(r.results->'prepared_reply') = 'string' and btrim(r.results->>'prepared_reply') <> ''
on conflict (item_id) do nothing;

create view public.kc_reply_draft_edit_days with (security_invoker = true) as
with pairs as (
  select coalesce(to_char(o.posted_at at time zone 'America/New_York', 'YYYY-MM-DD'), 'undated') as day,
    btrim(replace(coalesce(b.prepared_reply, v.prepared_reply), E'\r\n', E'\n'), E' \t\n\r') as prepared,
    btrim(replace(o.posted_reply, E'\r\n', E'\n'), E' \t\n\r') as posted
  from public.kc_reply_outcomes o
  left join public.kc_reply_draft_baselines b on b.item_id = o.item_id
  left join public.kc_fb_reply_voice_examples v on v.item_id = o.item_id
)
select day, count(*) filter (where prepared = posted and posted <> '') as as_drafted,
       count(*) filter (where prepared <> posted and prepared <> '' and posted <> '') as edited,
       count(*) filter (where nullif(prepared, '') is null or nullif(posted, '') is null) as missing
from pairs group by day;
revoke all on public.kc_reply_draft_edit_days from public, anon, authenticated;
grant select on public.kc_reply_draft_edit_days to service_role;

commit;
