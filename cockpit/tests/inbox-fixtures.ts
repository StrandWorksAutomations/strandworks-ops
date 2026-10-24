import type { IntakeItem } from "../src/lib/intake";
import type { OwnerLoopItem } from "../src/lib/owner-loop";
import type { DueItem } from "../src/lib/due-items";

export const NOW = new Date("2026-10-24T12:00:00Z");
export const EMAIL_ID = "12345678-1234-1234-1234-123456789abc";
export function email(over: Partial<IntakeItem> = {}): IntakeItem {
  return { id: EMAIL_ID, account: "owner@example.com", received_at: "2026-10-24T10:00:00Z",
    from_addr: "client@example.com", from_name: "Client", subject: "Review the agreement", snippet: "Please review",
    body_text: "Original text", status: "review", category: "client", business: "strandworks", priority: "normal",
    summary: "The client needs an answer", action_needed: "Review the agreement", due_at: null,
    draft_reply: "Thank you. I will review it.", reply_status: "drafted", reply_error: null,
    archive_requested: false, archived_at: null, ...over };
}
export function loopItem(over: Partial<OwnerLoopItem> = {}): OwnerLoopItem {
  return { id: "loop-1", ref: "D-0001", kind: "decision", project: "strandworks-ops", title: "Choose the offer",
    body: null, options: [], recommended: null, origin_agent: "claude", due_at: null, status: "open", ruling: null,
    ruling_note: null, ruled_via: null, ruled_at: null, picked_up_at: null, picked_up_by: null, outcome_note: null,
    done_at: null, repeat_count: 1, created_at: "2026-10-22T12:00:00Z", updated_at: "2026-10-22T12:00:00Z", ...over };
}
export function dueItem(over: Partial<DueItem> = {}): DueItem {
  return { entity: "Strandworks LLC", kind: "obligation", item: "Annual report", jurisdiction: "KY", dueOn: "2026-10-28",
    daysLeft: 4, status: "open", feeUsd: null, alertDaysBefore: 30, ...over };
}
