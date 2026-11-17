-- Kinetic Clinician: all-network engagement inbox (cockpit /engagement).
-- tools/engagement/sync.mjs reads comments from each connected network into
-- kc_engagement_items and records per-network connection state in
-- kc_engagement_sync. The owner decides in the cockpit, which only inserts rows
-- into kc_engagement_actions; the sync job applies them and sends an approved
-- reply on the networks whose credential allows it. The cockpit never posts.
-- NOT APPLIED: this file was written on 2026-11-17 and has not been run on any project.

create table if not exists public.kc_engagement_items (
  id uuid primary key default gen_random_uuid(),
  network text not null check (network in ('facebook', 'instagram', 'youtube', 'linkedin', 'tiktok')),
  external_id text not null check (length(external_id) between 1 and 400),
  -- The post, media, video or share the comment sits on; the sender needs it on some networks.
  post_external_id text check (length(post_external_id) <= 400),
  post_url text check (post_url ~ '^https://' and length(post_url) <= 1000),
  post_excerpt text check (length(post_excerpt) <= 1500),
  author_name text check (length(author_name) <= 200),
  text text not null check (length(text) between 1 and 12000),
  commented_at timestamptz,
  status text not null default 'open' check (status in ('open', 'approved', 'sent', 'dismissed', 'snoozed', 'failed')),
  reply_draft text check (length(reply_draft) <= 4000),
  approved_reply text check (length(approved_reply) <= 4000),
  snoozed_until timestamptz,
  delivery_result text check (length(delivery_result) <= 1000),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision >= 1),
  constraint kc_engagement_items_network_external unique (network, external_id)
);

create index if not exists kc_engagement_items_live on public.kc_engagement_items (commented_at desc)
  where status in ('open', 'approved', 'snoozed', 'failed');
create index if not exists kc_engagement_items_updated on public.kc_engagement_items (updated_at desc);

-- Owner action queue. Rows are inserted by the cockpit and applied by the sync job.
create table if not exists public.kc_engagement_actions (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.kc_engagement_items(id) on delete cascade,
  action text not null check (action in ('save', 'approve', 'dismiss', 'snooze')),
  draft text check (length(draft) <= 4000),
  snooze_until timestamptz,
  base_revision integer not null,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  result text check (length(result) <= 1000),
  constraint kc_engagement_actions_shape check (
    (action in ('save', 'approve') and length(trim(coalesce(draft, ''))) > 0)
    or (action = 'snooze' and snooze_until is not null)
    or action = 'dismiss')
);

create index if not exists kc_engagement_actions_pending on public.kc_engagement_actions (id) where applied_at is null;
create index if not exists kc_engagement_actions_item on public.kc_engagement_actions (item_id, id desc);

-- One row per network: is it connected, when was it last read, and what the owner must do.
create table if not exists public.kc_engagement_sync (
  network text primary key check (network in ('facebook', 'instagram', 'youtube', 'linkedin', 'tiktok')),
  connected boolean not null default false,
  last_synced_at timestamptz,
  last_error text check (length(last_error) <= 1000),
  note text check (length(note) <= 1000)
);

-- No policies: anon and authenticated cannot touch these tables. The cockpit and
-- the sync job use the service role, which bypasses row level security.
alter table public.kc_engagement_items enable row level security;
alter table public.kc_engagement_actions enable row level security;
alter table public.kc_engagement_sync enable row level security;
revoke all on public.kc_engagement_items from anon, authenticated;
revoke all on public.kc_engagement_actions from anon, authenticated;
revoke all on public.kc_engagement_sync from anon, authenticated;
