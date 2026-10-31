// Kinetic Clinician Facebook reply review (/replies). The Mac's reply inbox
// (highest-paying/tools/facebook-review) pushes its queue to kc_fb_replies and
// applies the owner's actions from kc_fb_reply_actions every 15 minutes
// (dashboard_sync.py via page_api.py run). The cockpit never posts to Facebook: Page replies send
// from the Mac after approval; group replies are posted by hand.

export type KcJobLink = { label: string; url: string };
export type KcEvidence = { claim: string; source_url: string; checked_at: string; note: string };

export type KcReply = {
  id: string;
  revision: number;
  status: string;
  source_kind: "public_group" | "owned_page" | "owner_supplied";
  source_name: string;
  source_url: string;
  title: string;
  post_text: string;
  context: string;
  topic: string;
  draft: string;
  approved_draft: string | null;
  promotion: string;
  job_links: KcJobLink[];
  evidence: KcEvidence[];
  delivery_state: string | null;
  created_at: string | null;
  synced_at: string;
  kind: "reply" | "follow_up";
  snoozed_until: string | null;
  results: KcResults | null;
  summary: string;
};

/** What happened after a group reply was posted, from the scan's read-only rechecks. */
export type KcResults = { checks: number; checked_at: string; found: boolean; gone: boolean; reactions: number; replies: number };

export type KcGroup = {
  id: string; name: string; meta: string; lane: string; status: "joined" | "to_join"; url: string;
  stats: { queued?: number; posted?: number; dismissed?: number; replies_back?: number; reactions?: number; quiet?: boolean };
};

export type KcPagePost = { id: string; draft: string; links: KcJobLink[]; status: "draft" | "approved" | "posted" | "dismissed"; created_at: string };

export type KcReplyAction = { id: number; item_id: string; action: ReplyActionKind; created_at: string; applied_at: string | null; result: string | null; snooze_until?: string | null };

export const REPLY_COLUMNS =
  "id,revision,status,source_kind,source_name,source_url,title,post_text,context,topic,draft,approved_draft,promotion,job_links,evidence,delivery_state,created_at,synced_at,kind,snoozed_until,results,summary";

export const REPLY_ACTIONS = ["save", "approve", "posted", "dismiss", "snooze"] as const;
/** One-tap dismiss reasons; the drafter is told which ones keep coming up. */
export const DISMISS_REASONS = ["No real match", "Wrong facts", "Already answered", "Bad tone", "Not worth it"] as const;
export const SNOOZE_HOURS = [24, 72] as const;
/** The Kinetic Clinician Page, where the weekly post is pasted by hand. */
export const PAGE_URL = "https://www.facebook.com/61595378964295";
export type ReplyActionKind = (typeof REPLY_ACTIONS)[number];
export const DRAFT_MAX = 4000;

export const STATUS_LABEL: Record<string, string> = {
  needs_review: "to review",
  needs_context: "check context",
  approved: "approved",
  posted: "posted",
  dismissed: "dismissed",
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type ReplyActionInput = { id: string; action: ReplyActionKind; revision: number; draft?: string; reason?: string; snooze_until?: string };

export function validateReplyAction(raw: unknown, now = Date.now()): Result<ReplyActionInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== "string" || !/^[0-9a-f]{24}$/.test(r.id)) return { ok: false, error: "Unknown reply." };
  if (!REPLY_ACTIONS.includes(r.action as ReplyActionKind)) return { ok: false, error: "Unknown action." };
  if (!Number.isInteger(r.revision)) return { ok: false, error: "Missing revision; refresh the page." };
  const action = r.action as ReplyActionKind;
  const value = { id: r.id, action, revision: r.revision as number };
  if (action === "dismiss") {
    if (r.reason === undefined) return { ok: true, value };
    if (!DISMISS_REASONS.includes(r.reason as (typeof DISMISS_REASONS)[number])) return { ok: false, error: "Unknown reason." };
    return { ok: true, value: { ...value, reason: r.reason as string } };
  }
  if (action === "snooze") {
    if (!SNOOZE_HOURS.includes(r.hours as (typeof SNOOZE_HOURS)[number])) return { ok: false, error: "Unknown snooze length." };
    return { ok: true, value: { ...value, snooze_until: new Date(now + (r.hours as number) * 3600_000).toISOString() } };
  }
  if (action !== "save" && action !== "approve") return { ok: true, value };
  const draft = typeof r.draft === "string" ? r.draft.trim() : "";
  if (!draft) return { ok: false, error: "The reply is empty." };
  if (draft.length > DRAFT_MAX) return { ok: false, error: `The reply is too long (${DRAFT_MAX} characters).` };
  return { ok: true, value: { ...value, draft } };
}

/** Only https links are rendered; anything else in a synced row is dropped. */
export function safeLinks(links: unknown): KcJobLink[] {
  if (!Array.isArray(links)) return [];
  return links.filter((l): l is KcJobLink =>
    !!l && typeof l.label === "string" && typeof l.url === "string" && /^https:\/\/[^\s]+$/.test(l.url)).slice(0, 12);
}

/**
 * What the owner already decided for a reply whose action the Mac has not applied yet:
 * "closed" (dismissed or posted), "approved", or null. The page shows that decision at once
 * instead of waiting up to 15 minutes for the sync.
 */
export function pendingDecision(actions: Pick<KcReplyAction, "item_id" | "action" | "applied_at">[], id: string): "closed" | "approved" | "snoozed" | null {
  const open = actions.filter((a) => a.item_id === id && !a.applied_at).map((a) => a.action);
  if (open.includes("dismiss") || open.includes("posted")) return "closed";
  if (open.includes("snooze")) return "snoozed";
  return open.includes("approve") ? "approved" : null;
}

export function isManual(reply: Pick<KcReply, "source_kind">): boolean {
  return reply.source_kind !== "owned_page";
}

/** Snoozed until a later time, by the synced row or an action the Mac has not applied yet. */
export function snoozedUntil(reply: Pick<KcReply, "id" | "snoozed_until">, actions: Pick<KcReplyAction, "item_id" | "action" | "applied_at" | "snooze_until">[], now = Date.now()): string | null {
  const queued = actions.find((a) => a.item_id === reply.id && !a.applied_at && a.action === "snooze")?.snooze_until;
  const until = queued ?? reply.snoozed_until;
  return until && Date.parse(until) > now ? until : null;
}

/** "3 replies · 2 reactions", or why there is nothing to show yet. */
export function resultLine(results: KcResults | null): string | null {
  if (!results || !results.checks) return null;
  if (results.gone) return "post removed";
  if (!results.found) return "your comment wasn't found";
  const part = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return `${part(results.replies, "reply", "replies")} · ${part(results.reactions, "reaction", "reactions")}`;
}

export const PAGE_POST_ACTIONS = ["save", "approve", "posted", "dismiss"] as const;
export type PagePostAction = (typeof PAGE_POST_ACTIONS)[number];

export function validatePagePostAction(raw: unknown): Result<{ id: string; action: PagePostAction; draft?: string }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== "string" || !/^\d{4}-W\d{2}$/.test(r.id)) return { ok: false, error: "Unknown post." };
  if (!PAGE_POST_ACTIONS.includes(r.action as PagePostAction)) return { ok: false, error: "Unknown action." };
  const action = r.action as PagePostAction;
  if (action !== "save" && action !== "approve") return { ok: true, value: { id: r.id, action } };
  const draft = typeof r.draft === "string" ? r.draft.trim() : "";
  if (!draft) return { ok: false, error: "The post is empty." };
  if (draft.length > DRAFT_MAX) return { ok: false, error: `The post is too long (${DRAFT_MAX} characters).` };
  return { ok: true, value: { id: r.id, action, draft } };
}

export function validateGroupJoined(raw: unknown): Result<{ group_id: string }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  return typeof r.group_id === "string" && /^[0-9A-Za-z._-]{1,80}$/.test(r.group_id)
    ? { ok: true, value: { group_id: r.group_id } } : { ok: false, error: "Unknown group." };
}
