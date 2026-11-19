import { OWNER_TIME_ZONE } from "./owner-loop";

export type IntakeItem = {
  id: string;
  account: string;
  received_at: string;
  from_addr: string;
  from_name: string | null;
  subject: string | null;
  snippet: string | null;
  body_text: string | null;
  status: "new" | "review" | "done" | "dismissed" | "noise";
  category: string;
  business: string;
  priority: "high" | "normal" | "low";
  summary: string | null;
  action_needed: string | null;
  due_at: string | null;
  draft_reply: string | null;
  reply_status: "none" | "drafted" | "approved" | "sent" | "failed";
  reply_error: string | null;
  archive_requested: boolean;
  archived_at: string | null;
};
export type IntakeReview = Pick<IntakeItem, "id" | "business" | "status" | "priority" | "received_at" | "subject" | "from_name" | "from_addr" | "summary" | "action_needed" | "due_at">;

export const INTAKE_ACTIONS = ["approve_reply", "save_draft", "done", "dismiss", "keep_in_inbox"] as const;
export type IntakeAction = typeof INTAKE_ACTIONS[number];
export type IntakeActionInput = { id: string; action: IntakeAction; reply?: string };

export function validateIntakeAction(raw: unknown):
  { ok: true; value: IntakeActionInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "Expected an action object." };
  const input = raw as Record<string, unknown>;
  if (typeof input.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)) {
    return { ok: false, error: "A valid email ID is required." };
  }
  if (!INTAKE_ACTIONS.includes(input.action as IntakeAction)) return { ok: false, error: "Unknown email action." };
  if (input.reply !== undefined && (typeof input.reply !== "string" || input.reply.length > 6000)) {
    return { ok: false, error: "Reply must be text of at most 6000 characters." };
  }
  const action = input.action as IntakeAction;
  if ((action === "approve_reply" || action === "save_draft") && (typeof input.reply !== "string" || !input.reply.trim())) {
    return { ok: false, error: "Enter a reply before saving or approving." };
  }
  return { ok: true, value: { id: input.id, action, ...(typeof input.reply === "string" ? { reply: input.reply } : {}) } };
}

export function reviewEmails<T extends IntakeReview>(items: T[]): T[] {
  const priority = { high: 0, normal: 1, low: 2 };
  return items.filter((item) => item.status === "review")
    .sort((a, b) => priority[a.priority] - priority[b.priority] || Date.parse(b.received_at) - Date.parse(a.received_at) || a.id.localeCompare(b.id));
}

// A review email stays in "Needs you" for a week, or longer while its deadline
// is still ahead. After that it moves to "Older" so the queue shows what is
// current instead of everything ever received.
export const REVIEW_CURRENT_DAYS = 7;
export function isCurrentReview(item: Pick<IntakeReview, "received_at" | "due_at">, now: Date): boolean {
  const received = Date.parse(item.received_at);
  if (!Number.isFinite(received) || now.getTime() - received <= REVIEW_CURRENT_DAYS * 86400_000) return true;
  const due = item.due_at ? Date.parse(item.due_at) : NaN;
  return Number.isFinite(due) && due >= now.getTime();
}
export function currentReviewEmails<T extends IntakeReview>(items: T[], now: Date): T[] {
  return reviewEmails(items).filter((item) => isCurrentReview(item, now));
}

export function groupIntake(items: IntakeItem[], now: Date, business = "") {
  const scoped = business ? items.filter((item) => item.business === business) : items;
  const recent = scoped.filter((item) => {
    const age = now.getTime() - Date.parse(item.received_at);
    return age >= 0 && age <= 7 * 86400_000;
  }).sort((a, b) => Date.parse(b.received_at) - Date.parse(a.received_at));
  const review = reviewEmails(scoped);
  return {
    needsYou: review.filter((item) => isCurrentReview(item, now)),
    older: review.filter((item) => !isCurrentReview(item, now)).sort((a, b) => Date.parse(b.received_at) - Date.parse(a.received_at)),
    jobAlerts: recent.filter((item) => item.category === "job_alert"),
    noise: recent.filter((item) => item.status === "noise"),
    // Keep approval/send outcomes visible even if the RPC closes the review.
    replies: scoped.filter((item) => item.status !== "review" && ["approved", "sent", "failed"].includes(item.reply_status)),
  };
}

export const CLEAR_OLDER_MAX = 500;
export function validateClearOlder(raw: unknown): { ok: true; ids: string[] } | { ok: false; error: string } {
  const ids = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as { ids?: unknown }).ids : null;
  if (!Array.isArray(ids) || !ids.length || ids.length > CLEAR_OLDER_MAX
    || !ids.every((id) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    return { ok: false, error: `Expected 1 to ${CLEAR_OLDER_MAX} email IDs.` };
  }
  return { ok: true, ids: [...new Set(ids as string[])] };
}

export function replyStatusLabel(item: Pick<IntakeItem, "reply_status" | "reply_error">): string | null {
  switch (item.reply_status) {
    case "sent": return "Sent";
    case "failed": return `Failed: ${item.reply_error || "Send failed. Refresh for details."}`;
    case "approved": return "Waiting to send";
    case "drafted": return "Draft ready for your approval";
    default: return null;
  }
}

export function intakeDate(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: OWNER_TIME_ZONE }) + " ET";
}
