begin;

-- Durable posting facts outlive the rotating Facebook review queue.
create table public.kc_reply_outcomes (
  item_id text primary key check (item_id ~ '^[0-9a-f]{24}$'),
  platform text not null check (platform = 'facebook'),
  source_kind text not null check (source_kind in ('public_group','owned_page','owner_supplied')),
  source_name text not null,
  source_url text not null,
  posted_reply text not null check (length(btrim(posted_reply)) between 1 and 12000),
  posted_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  recorded_via text not null check (recorded_via in ('owner_voice','manual','page_api'))
);
create index kc_reply_outcomes_date on public.kc_reply_outcomes(posted_at);

-- Serialize a worker's final Page send with a report that the owner already
-- posted. An interrupted process releases its reservation by timeout.
create table public.kc_fb_reply_delivery_leases (
  item_id text primary key check (item_id ~ '^[0-9a-f]{24}$'),
  lease_token text not null check (length(lease_token) between 1 and 200),
  expires_at timestamptz not null
);
alter table public.kc_reply_outcomes enable row level security;
alter table public.kc_fb_reply_delivery_leases enable row level security;
revoke all on public.kc_reply_outcomes, public.kc_fb_reply_delivery_leases from public, anon, authenticated;
grant select, insert, update on public.kc_reply_outcomes to service_role;
grant select, insert, update, delete on public.kc_fb_reply_delivery_leases to service_role;

create function public.kc_begin_fb_reply_delivery(p_item_id text, p_lease_token text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_item_id, 813));
  if exists (select 1 from public.kc_reply_outcomes where item_id = p_item_id) then return false; end if;
  insert into public.kc_fb_reply_delivery_leases as l values (p_item_id,p_lease_token,clock_timestamp() + interval '5 minutes')
  on conflict (item_id) do update set lease_token=excluded.lease_token, expires_at=excluded.expires_at
    where l.expires_at <= clock_timestamp();
  return found;
end;
$$;

create function public.kc_end_fb_reply_delivery(p_item_id text, p_lease_token text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.kc_fb_reply_delivery_leases where item_id=p_item_id and lease_token=p_lease_token;
  return found;
end;
$$;

-- All queue mirrors pass through here, including old or retried syncs.
create function public.kc_keep_posted_reply() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  o public.kc_reply_outcomes;
  original text;
begin
  select * into o from public.kc_reply_outcomes where item_id=new.id;
  if found then
    new.status := 'posted';
    new.draft := o.posted_reply;
    new.approved_draft := o.posted_reply;
    new.snoozed_until := null;
    if new.delivery_state is distinct from 'sent' then new.delivery_state := null; end if;
    new.results := coalesce(new.results,'{}'::jsonb) || jsonb_build_object('posted_at',o.posted_at);
    select v.prepared_reply into original from public.kc_fb_reply_voice_examples v where v.item_id=new.id;
    if original is not null then
      new.results := new.results || jsonb_build_object('prepared_reply',original);
    end if;
  end if;
  return new;
end;
$$;
create trigger kc_keep_posted_reply before insert or update on public.kc_fb_replies
for each row execute function public.kc_keep_posted_reply();

-- The worker can publish delivery receipts concurrently with an owner save.
-- Both writers take the item lock before touching the ledger or queue row.
create function public.kc_lock_reply_outcome() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.item_id,813));
  return new;
end;
$$;
create trigger kc_lock_reply_outcome before insert on public.kc_reply_outcomes
for each row execute function public.kc_lock_reply_outcome();

create function public.kc_close_answered_reply() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.kc_fb_replies set status='posted' where id=new.item_id;
  update public.kc_fb_reply_actions set applied_at=clock_timestamp(), result='Already posted.'
    where item_id=new.item_id and applied_at is null;
  return null;
end;
$$;
create trigger kc_close_answered_reply after insert or update on public.kc_reply_outcomes
for each row execute function public.kc_close_answered_reply();

create function public.kc_guard_answered_reply_action() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.item_id,813));
  if exists (select 1 from public.kc_reply_outcomes where item_id=new.item_id) then
    raise sqlstate 'PT409' using message='reply_already_posted';
  end if;
  return new;
end;
$$;
create trigger kc_guard_answered_reply_action before insert on public.kc_fb_reply_actions
for each row execute function public.kc_guard_answered_reply_action();

create function public.kc_save_fb_posted_reply(
  p_item_id text, p_prepared_reply text, p_posted_reply text, p_expected_updated_at timestamptz
) returns setof public.kc_fb_reply_voice_examples
language plpgsql security invoker set search_path = '' as $$
declare
  r public.kc_fb_replies;
  previous public.kc_reply_outcomes;
  prior_example public.kc_fb_reply_voice_examples;
  saved public.kc_fb_reply_voice_examples;
  original text;
  written_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_item_id,813));
  if exists (select 1 from public.kc_fb_reply_delivery_leases where item_id=p_item_id and expires_at > clock_timestamp()) then
    raise sqlstate 'PT409' using message='reply_delivery_in_progress';
  end if;
  select * into r from public.kc_fb_replies where id=p_item_id for update;
  select * into previous from public.kc_reply_outcomes where item_id=p_item_id;
  if r.id is null and previous.item_id is null then
    raise sqlstate 'PT404' using message='reply_missing';
  end if;
  select * into prior_example from public.kc_fb_reply_voice_examples where item_id=p_item_id;
  original := case
    when btrim(p_prepared_reply) <> '' then p_prepared_reply
    when prior_example.item_id is not null then prior_example.prepared_reply
    when jsonb_typeof(r.results->'prepared_reply')='string' and length(r.results->>'prepared_reply') <= 4000
      and btrim(r.results->>'prepared_reply') <> '' then r.results->>'prepared_reply' end;
  -- Match the version the editor read, whether it came from a pair or a posting receipt.
  -- A retry of the exact same values can use the earlier version.
  if p_expected_updated_at is distinct from coalesce(prior_example.updated_at,previous.updated_at)
     and (prior_example.prepared_reply is distinct from original
          or coalesce(prior_example.posted_reply,previous.posted_reply) is distinct from p_posted_reply) then return; end if;
  if original is not null then
    select * into saved from public.kc_save_fb_reply_voice_example(p_item_id,original,p_posted_reply,prior_example.updated_at);
    if not found then return; end if;
  end if;
  insert into public.kc_reply_outcomes as o (item_id,platform,source_kind,source_name,source_url,posted_at,posted_reply,recorded_via)
    values (p_item_id,'facebook',coalesce(r.source_kind,previous.source_kind),coalesce(r.source_name,previous.source_name),
            coalesce(r.source_url,previous.source_url),coalesce(prior_example.updated_at,statement_timestamp()),p_posted_reply,'owner_voice')
    on conflict (item_id) do update set posted_reply=excluded.posted_reply, recorded_via='owner_voice', updated_at=clock_timestamp()
      where o.posted_reply is distinct from excluded.posted_reply or o.recorded_via <> 'owner_voice'
    returning o.updated_at into written_at;
  if original is null then
    -- Return the receipt to the editor without adding an incomplete pair to the voice examples.
    saved.item_id := p_item_id;
    saved.posted_reply := p_posted_reply;
    saved.updated_at := coalesce(written_at,previous.updated_at);
  end if;
  return next saved;
end;
$$;

revoke all on function public.kc_begin_fb_reply_delivery(text,text), public.kc_end_fb_reply_delivery(text,text),
  public.kc_save_fb_posted_reply(text,text,text,timestamptz), public.kc_keep_posted_reply(),
  public.kc_lock_reply_outcome(), public.kc_close_answered_reply(), public.kc_guard_answered_reply_action() from public, anon, authenticated;
grant execute on function public.kc_begin_fb_reply_delivery(text,text), public.kc_end_fb_reply_delivery(text,text),
  public.kc_save_fb_posted_reply(text,text,text,timestamptz) to service_role;
commit;
