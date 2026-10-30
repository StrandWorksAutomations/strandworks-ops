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
};

export type KcReplyAction = { id: number; item_id: string; action: ReplyActionKind; created_at: string; applied_at: string | null; result: string | null };

export const REPLY_COLUMNS =
  "id,revision,status,source_kind,source_name,source_url,title,post_text,context,topic,draft,approved_draft,promotion,job_links,evidence,delivery_state,created_at,synced_at";

export const REPLY_ACTIONS = ["save", "approve", "posted", "dismiss"] as const;
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

export function validateReplyAction(raw: unknown): Result<{ id: string; action: ReplyActionKind; revision: number; draft?: string }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== "string" || !/^[0-9a-f]{24}$/.test(r.id)) return { ok: false, error: "Unknown reply." };
  if (!REPLY_ACTIONS.includes(r.action as ReplyActionKind)) return { ok: false, error: "Unknown action." };
  if (!Number.isInteger(r.revision)) return { ok: false, error: "Missing revision; refresh the page." };
  const action = r.action as ReplyActionKind;
  const value = { id: r.id, action, revision: r.revision as number };
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

export function isManual(reply: Pick<KcReply, "source_kind">): boolean {
  return reply.source_kind !== "owned_page";
}
