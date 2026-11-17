// Kinetic Clinician engagement inbox (/engagement): comments from every network in
// one list. tools/engagement/sync.mjs reads each connected network into
// kc_engagement_items and applies the owner's queued actions from
// kc_engagement_actions. The cockpit never posts to any network: Approve only
// queues an action, and the sync job sends it where the saved sign-in allows.

export const NETWORKS = ["facebook", "instagram", "youtube", "linkedin", "tiktok"] as const;
export type EngagementNetwork = (typeof NETWORKS)[number];
export const NETWORK_LABEL: Record<EngagementNetwork, string> = {
  facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", tiktok: "TikTok",
};

export const ENGAGEMENT_STATUSES = ["open", "approved", "sent", "dismissed", "snoozed", "failed"] as const;
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];
export const ENGAGEMENT_ACTIONS = ["save", "approve", "dismiss", "snooze"] as const;
export type EngagementActionKind = (typeof ENGAGEMENT_ACTIONS)[number];
export const SNOOZE_HOURS = [24, 72] as const;
/** One limit for every network, so an approved reply never has to be cut at send time. */
export const REPLY_MAX = 1250;
/** The sync job can post an approved reply on these networks when their sign-in is connected. */
export const SENDING_NETWORKS: readonly EngagementNetwork[] = ["facebook", "instagram", "linkedin"];

export type EngagementItem = {
  id: string;
  network: EngagementNetwork;
  external_id: string;
  post_url: string | null;
  post_excerpt: string | null;
  author_name: string | null;
  text: string;
  commented_at: string | null;
  status: EngagementStatus;
  reply_draft: string | null;
  approved_reply: string | null;
  snoozed_until: string | null;
  delivery_result: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
  revision: number;
};

export type EngagementAction = {
  id: number;
  item_id: string;
  action: EngagementActionKind;
  draft: string | null;
  snooze_until: string | null;
  base_revision: number;
  created_at: string;
  applied_at: string | null;
  result: string | null;
};

export type EngagementSync = {
  network: EngagementNetwork;
  connected: boolean;
  last_synced_at: string | null;
  last_error: string | null;
  note: string | null;
};

export const ITEM_COLUMNS =
  "id,network,external_id,post_url,post_excerpt,author_name,text,commented_at,status,reply_draft,approved_reply,snoozed_until,delivery_result,synced_at,created_at,updated_at,revision";
export const ACTION_COLUMNS = "id,item_id,action,draft,snooze_until,base_revision,created_at,applied_at,result";

/** Raised when the item changed or closed since the page was loaded; shown to the owner as-is. */
export class EngagementConflictError extends Error {}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type EngagementActionInput = { id: string; action: EngagementActionKind; revision: number; draft?: string; snooze_until?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isNetwork(value: unknown): value is EngagementNetwork {
  return NETWORKS.includes(value as EngagementNetwork);
}

export function validateEngagementAction(raw: unknown, now = Date.now()): Result<EngagementActionInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== "string" || !UUID.test(r.id)) return { ok: false, error: "Unknown comment." };
  if (!ENGAGEMENT_ACTIONS.includes(r.action as EngagementActionKind)) return { ok: false, error: "Unknown action." };
  if (!Number.isInteger(r.revision) || (r.revision as number) < 1) return { ok: false, error: "Missing revision; refresh the page." };
  const action = r.action as EngagementActionKind;
  const value = { id: r.id, action, revision: r.revision as number };
  if (action === "dismiss") return { ok: true, value };
  if (action === "snooze") {
    if (!SNOOZE_HOURS.includes(r.hours as (typeof SNOOZE_HOURS)[number])) return { ok: false, error: "Unknown snooze length." };
    return { ok: true, value: { ...value, snooze_until: new Date(now + (r.hours as number) * 3600_000).toISOString() } };
  }
  const draft = typeof r.draft === "string" ? r.draft.trim() : "";
  if (!draft) return { ok: false, error: "The reply is empty." };
  if (draft.length > REPLY_MAX) return { ok: false, error: `The reply is too long (${REPLY_MAX} characters).` };
  return { ok: true, value: { ...value, draft } };
}

/** Only https links are rendered; anything else in a synced row is dropped. */
export function safeUrl(url: unknown): string | null {
  return typeof url === "string" && /^https:\/\/[^\s]+$/.test(url) ? url : null;
}

type PendingAction = Pick<EngagementAction, "item_id" | "action" | "applied_at">;

/**
 * What the owner already decided for a comment whose action the sync job has not applied yet,
 * so the page shows that decision at once instead of waiting for the next run.
 */
export function pendingDecision(actions: PendingAction[], id: string): "dismissed" | "snoozed" | "approved" | null {
  const open = actions.filter((a) => a.item_id === id && !a.applied_at).map((a) => a.action);
  if (open.includes("dismiss")) return "dismissed";
  if (open.includes("snooze")) return "snoozed";
  return open.includes("approve") ? "approved" : null;
}

/** Labels of the queued actions for one comment, oldest first; null when nothing is waiting. */
export function waitingLabel(actions: Pick<EngagementAction, "id" | "item_id" | "action" | "applied_at">[], id: string): string | null {
  const label: Record<EngagementActionKind, string> = { save: "save edit", approve: "approve", dismiss: "dismiss", snooze: "snooze" };
  return actions.filter((a) => a.item_id === id && !a.applied_at).sort((a, b) => a.id - b.id).map((a) => label[a.action]).join(", ") || null;
}

/** Snoozed until a later time, by the synced row or by an action the sync job has not applied yet. */
export function snoozedUntil(item: Pick<EngagementItem, "id" | "status" | "snoozed_until">,
  actions: Pick<EngagementAction, "item_id" | "action" | "applied_at" | "snooze_until">[], now = Date.now()): string | null {
  const queued = actions.find((a) => a.item_id === item.id && !a.applied_at && a.action === "snooze")?.snooze_until;
  const until = queued ?? (item.status === "snoozed" ? item.snoozed_until : null);
  return until && Date.parse(until) > now ? until : null;
}

export type EngagementBucket = "open" | "approved" | "snoozed" | "done";

/** Where a comment belongs on the page once queued, not yet applied, decisions are counted. */
export function bucketOf(item: Pick<EngagementItem, "id" | "status" | "snoozed_until">,
  actions: Pick<EngagementAction, "item_id" | "action" | "applied_at" | "snooze_until">[], now = Date.now()): EngagementBucket {
  if (item.status === "sent" || item.status === "dismissed") return "done";
  const decided = pendingDecision(actions, item.id);
  if (decided === "dismissed") return "done";
  if (snoozedUntil(item, actions, now)) return "snoozed";
  // A failed send returns to the owner; an elapsed snooze is open again.
  if (item.status === "approved" || (decided === "approved" && item.status !== "failed")) return "approved";
  return "open";
}

function commentTime(item: Pick<EngagementItem, "commented_at" | "created_at">): number {
  const at = Date.parse(item.commented_at ?? item.created_at);
  return Number.isFinite(at) ? at : 0;
}

/** Newest comment first; a row without a comment time falls back to when it was first synced. */
export function sortNewestFirst<T extends Pick<EngagementItem, "id" | "commented_at" | "created_at">>(items: T[]): T[] {
  return [...items].sort((a, b) => commentTime(b) - commentTime(a) || a.id.localeCompare(b.id));
}

export type NetworkFilter = EngagementNetwork | "all";

export function parseNetworkFilter(raw: unknown): NetworkFilter {
  return isNetwork(raw) ? raw : "all";
}

export function filterByNetwork<T extends Pick<EngagementItem, "network">>(items: T[], network: NetworkFilter): T[] {
  return network === "all" ? items : items.filter((item) => item.network === network);
}

export function networkCounts(items: Pick<EngagementItem, "network">[]): Record<NetworkFilter, number> {
  const counts: Record<NetworkFilter, number> = { all: items.length, facebook: 0, instagram: 0, youtube: 0, linkedin: 0, tiktok: 0 };
  for (const item of items) if (isNetwork(item.network)) counts[item.network] += 1;
  return counts;
}

/** True when an approved reply on this network is posted by the sync job rather than by hand. */
export function sendsAutomatically(network: EngagementNetwork, sync: Pick<EngagementSync, "network" | "connected">[]): boolean {
  return SENDING_NETWORKS.includes(network) && sync.some((row) => row.network === network && row.connected);
}

export type SyncStripEntry = { network: EngagementNetwork; label: string; state: "connected" | "not_connected" | "never"; last_synced_at: string | null; detail: string };

const NEVER_CHECKED = "Not checked yet. Run the engagement sync job.";

/** One entry per network in a fixed order, including networks the sync job has never reported on. */
export function syncStrip(rows: EngagementSync[]): SyncStripEntry[] {
  return NETWORKS.map((network) => {
    const row = rows.find((r) => r.network === network);
    const label = NETWORK_LABEL[network];
    if (!row) return { network, label, state: "never", last_synced_at: null, detail: NEVER_CHECKED };
    if (!row.connected) {
      return { network, label, state: "not_connected", last_synced_at: row.last_synced_at, detail: row.note?.trim() || row.last_error?.trim() || "Not connected. Run the engagement sync job for the next step." };
    }
    const problem = row.last_error?.trim() ? `Last read failed: ${row.last_error.trim()}` : "";
    return { network, label, state: "connected", last_synced_at: row.last_synced_at, detail: [problem, row.note?.trim()].filter(Boolean).join(" ") };
  });
}
