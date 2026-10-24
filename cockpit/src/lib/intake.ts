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

export function groupIntake(items: IntakeItem[], now: Date, business = "") {
  const scoped = business ? items.filter((item) => item.business === business) : items;
  const recent = scoped.filter((item) => {
    const age = now.getTime() - Date.parse(item.received_at);
    return age >= 0 && age <= 7 * 86400_000;
  }).sort((a, b) => Date.parse(b.received_at) - Date.parse(a.received_at));
  return {
    needsYou: reviewEmails(scoped),
    jobAlerts: recent.filter((item) => item.category === "job_alert"),
    noise: recent.filter((item) => item.status === "noise"),
    // Keep approval/send outcomes visible even if the RPC closes the review.
    replies: scoped.filter((item) => item.status !== "review" && ["approved", "sent", "failed"].includes(item.reply_status)),
  };
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
