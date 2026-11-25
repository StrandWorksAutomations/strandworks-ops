begin;

-- Keep owner examples after completed replies age out of the mirrored queue.
create table public.kc_fb_reply_voice_examples (
  item_id text primary key check (item_id ~ '^([0-9a-f]{24}|manual-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12})$'),
  prepared_reply text not null check (length(btrim(prepared_reply)) between 1 and 4000),
  posted_reply text not null check (length(btrim(posted_reply)) between 1 and 4000),
  updated_at timestamptz not null default now()
);

alter table public.kc_fb_reply_voice_examples enable row level security;
revoke all on public.kc_fb_reply_voice_examples from public, anon, authenticated;
grant select, insert, update on public.kc_fb_reply_voice_examples to service_role;

-- A retried save returns its existing version. A stale editor receives no row
-- and can reopen the newer example before replacing it.
create function public.kc_save_fb_reply_voice_example(
  p_item_id text, p_prepared_reply text, p_posted_reply text, p_expected_updated_at timestamptz
) returns setof public.kc_fb_reply_voice_examples
language sql security invoker set search_path = '' as $$
  insert into public.kc_fb_reply_voice_examples as e (item_id, prepared_reply, posted_reply)
  values (p_item_id, p_prepared_reply, p_posted_reply)
  on conflict (item_id) do update
    set prepared_reply = excluded.prepared_reply, posted_reply = excluded.posted_reply,
        updated_at = case when (e.prepared_reply, e.posted_reply) = (excluded.prepared_reply, excluded.posted_reply)
                          then e.updated_at else clock_timestamp() end
    where e.updated_at = p_expected_updated_at
       or (e.prepared_reply, e.posted_reply) = (excluded.prepared_reply, excluded.posted_reply)
  returning e.*;
$$;
revoke all on function public.kc_save_fb_reply_voice_example(text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.kc_save_fb_reply_voice_example(text, text, text, timestamptz) to service_role;

commit;
