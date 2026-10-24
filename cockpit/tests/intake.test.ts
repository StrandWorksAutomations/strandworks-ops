import { describe, expect, it } from "vitest";
import { groupIntake, reviewEmails, validateIntakeAction, replyStatusLabel, intakeDate, INTAKE_ACTIONS } from "../src/lib/intake";
import { buildAttentionQueue } from "../src/lib/attention";
import { email, EMAIL_ID, NOW } from "./inbox-fixtures";

describe("email review grouping", () => {
  it("sorts all reviews by priority, then newest, without mutating input", () => {
    const input = [email({ id: "low", priority: "low" }), email({ id: "high-old", priority: "high", received_at: "2026-10-01T12:00:00Z" }),
      email({ id: "normal" }), email({ id: "high-new", priority: "high" }), email({ id: "done", status: "done" })];
    expect(reviewEmails(input).map((item) => item.id)).toEqual(["high-new", "high-old", "normal", "low"]);
    expect(input[0].id).toBe("low");
  });
  it("limits scanned alerts and noise to seven days while keeping older reviews", () => {
    const groups = groupIntake([
      email({ id: "old-review", received_at: "2026-09-01T12:00:00Z" }),
      email({ id: "job", status: "done", category: "job_alert", received_at: "2026-10-17T12:00:00Z" }),
      email({ id: "old-job", status: "done", category: "job_alert", received_at: "2026-10-17T11:59:59Z" }),
      email({ id: "noise", status: "noise" }), email({ id: "old-noise", status: "noise", received_at: "2026-10-16T12:00:00Z" }),
      email({ id: "future", status: "noise", received_at: "2026-10-25T12:00:00Z" }),
    ], NOW);
    expect(groups.needsYou.map((item) => item.id)).toEqual(["old-review"]);
    expect(groups.jobAlerts.map((item) => item.id)).toEqual(["job"]);
    expect(groups.noise.map((item) => item.id)).toEqual(["noise"]);
  });
  it("filters every section by business and includes recently closed reply outcomes", () => {
    const groups = groupIntake([email(), email({ id: "other", business: "sag" }),
      email({ id: "sent", status: "done", reply_status: "sent" }),
      email({ id: "job", status: "done", category: "job_alert" }), email({ id: "noise", status: "noise" })], NOW, "strandworks");
    expect(groups.needsYou.map((item) => item.id)).toEqual([EMAIL_ID]);
    expect(groups.replies.map((item) => item.id)).toEqual(["sent"]);
    expect(groups.jobAlerts).toHaveLength(1);
    expect(groups.noise).toHaveLength(1);
    expect(groupIntake([email()], NOW, "unknown").needsYou).toEqual([]);
  });
  it("reports sent, failed and approved states explicitly", () => {
    expect(replyStatusLabel(email({ reply_status: "sent" }))).toBe("Sent");
    expect(replyStatusLabel(email({ reply_status: "approved" }))).toBe("Waiting to send");
    expect(replyStatusLabel(email({ reply_status: "failed", reply_error: "Mailbox unavailable" }))).toBe("Failed: Mailbox unavailable");
    expect(replyStatusLabel(email({ reply_status: "none" }))).toBeNull();
  });
  it("formats timestamps in Eastern across daylight saving changes", () => {
    expect(intakeDate("2026-10-24T12:00:00Z")).toContain("8:00 AM ET");
    expect(intakeDate("2026-11-24T12:00:00Z")).toContain("7:00 AM ET");
  });
});

describe("email action validation", () => {
  it.each(INTAKE_ACTIONS)("accepts %s and preserves the exact approved reply", (action) => {
    expect(validateIntakeAction({ id: EMAIL_ID, action, reply: " First line\nSecond line " })).toEqual({ ok: true,
      value: { id: EMAIL_ID, action, reply: " First line\nSecond line " } });
  });
  it.each([null, [], 1, "done", {}, { id: "bad", action: "done" }, { id: `${EMAIL_ID}x`, action: "done" },
    { id: EMAIL_ID, action: "move_to_review" }, { id: EMAIL_ID, action: "send" }, { id: EMAIL_ID, action: null },
    { id: EMAIL_ID, action: "approve_reply" }, { id: EMAIL_ID, action: "save_draft", reply: "  " },
    { id: EMAIL_ID, action: "done", reply: null }, { id: EMAIL_ID, action: "done", reply: 1 },
    { id: EMAIL_ID, action: "approve_reply", reply: "x".repeat(6001) },
  ])("rejects invalid input %#", (input) => { expect(validateIntakeAction(input).ok).toBe(false); });
  it("accepts exactly 6000 characters and actions without replies", () => {
    expect(validateIntakeAction({ id: EMAIL_ID, action: "approve_reply", reply: "x".repeat(6000) }).ok).toBe(true);
    expect(validateIntakeAction({ id: EMAIL_ID, action: "done" })).toEqual({ ok: true, value: { id: EMAIL_ID, action: "done" } });
  });
});

describe("Today email attention", () => {
  it("includes reviews with direct filtered links and excludes other statuses", () => {
    const queue = buildAttentionQueue({ todayIso: "2026-10-24", now: NOW, intakeItems: [email({ priority: "high" }), email({ status: "done" })] });
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ severity: "now", kind: "email", title: "Review the agreement",
      href: `/inbox?business=strandworks#${EMAIL_ID}` });
    expect(queue[0].detail).toContain("High priority");
  });
});
