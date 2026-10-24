import { describe, it, expect } from "vitest";
import { buildAttentionQueue } from "../src/lib/attention";
import type { OwnerLoopItem } from "../src/lib/owner-loop";

const TODAY = "2026-07-13";

const CAL_HEADER = "date,item,type,action_needed";
const SUB_HEADER =
  "service,plan,cost_monthly_usd,billing_cadence,renewal_date,payment_last4,status,notes";
const ASSET_HEADER = "asset,type,location,size,hash,project,canonical,notes";

function loopItem(over: Partial<OwnerLoopItem> = {}): OwnerLoopItem {
  return {
    id: "item-1", ref: "D-0001", kind: "decision", project: "portfolio",
    title: "Choose the next step", body: null, options: [], recommended: null,
    origin_agent: "codex", due_at: null, status: "open", ruling: null,
    ruling_note: null, ruled_via: null, ruled_at: null, picked_up_at: null,
    picked_up_by: null, outcome_note: null, done_at: null, repeat_count: 1,
    created_at: "2026-07-10T12:00:00Z", updated_at: "2026-07-10T12:00:00Z",
    ...over,
  };
}

describe("buildAttentionQueue", () => {
  it("turns open calendar actions into items and skips DONE rows", () => {
    const q = buildAttentionQueue({
      calendarCsv: [
        CAL_HEADER,
        "2026-07-18,Cascadeur refund escalation,deadline-watch,escalate if no reply",
        "2026-07-12,Supabase bill review,billing,DONE 2026-07-11 — resolved",
        "2026-08-29,Namecheap renewal cluster,billing,review speculative domains",
        ",LLC filing dates,business,owner to supply",
      ].join("\n"),
      todayIso: TODAY,
    });
    expect(q.map((i) => i.title)).toEqual([
      "Cascadeur refund escalation", // within 7 days → now
      "Namecheap renewal cluster", // ~6 weeks out → watch? no: >30d → watch
      "LLC filing dates",
    ]);
    expect(q[0].severity).toBe("now");
    expect(q[1].severity).toBe("watch");
    expect(q[2].severity).toBe("watch");
  });

  it("treats overdue dated actions as now", () => {
    const q = buildAttentionQueue({
      calendarCsv: [CAL_HEADER, "2026-07-01,Old task,billing,still open"].join("\n"),
      todayIso: TODAY,
    });
    expect(q[0].severity).toBe("now");
    expect(q[0].dateIso).toBe("2026-07-01");
  });

  it("surfaces flagged subscriptions, hidden aggregate, and uncosted watch", () => {
    const q = buildAttentionQueue({
      subscriptionsCsv: [
        SUB_HEADER,
        "Cascadeur,Yearly,26.20,annual,2027-07-08,,refund-requested,refund email sent",
        "Watchful,annual,3.33,annual,2027-04-29,,do-not-renew,cancel in settings",
        "ElevenLabs,,23.32,monthly,2026-08-08,8774,active-HIDDEN,voice",
        "Linear,,,unknown,,8774,active-HIDDEN,uncosted",
        "Fine,,10,monthly,,,active,",
      ].join("\n"),
      todayIso: TODAY,
    });
    const titles = q.map((i) => i.title);
    expect(titles).toContain("Cascadeur — refund-requested");
    expect(titles).toContain("Watchful — do-not-renew");
    expect(titles).toContain("2 hidden subscriptions from the bank sweep");
    expect(titles).toContain("1 recurring services with no cost on record");
    // far-future renewal dates don't make a flag urgent
    const casc = q.find((i) => i.title.startsWith("Cascadeur"));
    expect(casc?.severity).toBe("watch");
  });

  it("ranks decisions first, then dated deadlines by date", () => {
    const q = buildAttentionQueue({
      pendingDecisions: [{ title: "Approve worker VM", file: "x.md" }],
      calendarCsv: [
        CAL_HEADER,
        "2026-07-15,Sooner,billing,act",
        "2026-07-14,Soonest,billing,act",
      ].join("\n"),
      todayIso: TODAY,
    });
    expect(q.map((i) => i.title)).toEqual(["Approve worker VM", "Soonest", "Sooner"]);
    expect(q[0].kind).toBe("decision");
  });

  it("flags single-copy assets", () => {
    const q = buildAttentionQueue({
      assetsCsv: [
        ASSET_HEADER,
        "Lens-scenes,scenes,Mac JB-1272,156MB,,3rdrider,yes-only-copy,not in git",
        "MedSim assets,art,repo,700MB,,MedSim-Game,yes,in git",
      ].join("\n"),
      todayIso: TODAY,
    });
    expect(q).toHaveLength(1);
    expect(q[0].title).toBe("Single copy: Lens-scenes");
    expect(q[0].severity).toBe("soon");
  });

  it("is empty with no inputs", () => {
    expect(buildAttentionQueue({ todayIso: TODAY })).toEqual([]);
  });

  it("counts open owner-loop decisions and stalled rulings alongside governance decisions", () => {
    const q = buildAttentionQueue({
      todayIso: TODAY,
      now: new Date("2026-07-13T12:00:00Z"),
      pendingDecisions: [{ title: "Governance ruling", file: "ruling.md" }],
      ownerLoopItems: [
        loopItem({ due_at: "2026-07-14T12:00:00Z" }),
        loopItem({ ref: "D-0002", title: "Follow up", status: "ruled", ruled_at: "2026-07-12T11:59:59Z", origin_agent: "claude", project: "medical" }),
        loopItem({ ref: "D-0003", status: "ruled", ruled_at: "2026-07-13T10:00:00Z" }),
        loopItem({ ref: "D-0004", status: "picked_up", ruled_at: "2026-07-10T10:00:00Z" }),
        loopItem({ ref: "D-0005", status: "done" }),
        loopItem({ ref: "D-0006", status: "dropped" }),
        loopItem({ ref: "D-0007", kind: "alert" }),
        loopItem({ ref: "D-0008", kind: "deadline" }),
      ],
    });
    expect(q).toHaveLength(3);
    expect(q.every((item) => item.severity === "now" && item.kind === "decision" && item.href === "/decisions")).toBe(true);
    expect(q.find((item) => item.title === "Choose the next step")?.detail).toBe("D-0001 · portfolio · codex · waiting for your ruling");
    expect(q.find((item) => item.title === "Follow up")?.detail).toBe("D-0002 · medical · claude · STALLED — no agent picked it up");
  });

  it("uses the supplied clock for stalled handoffs and falls back to today at midnight", () => {
    const ownerLoopItems = [loopItem({ status: "ruled", ruled_at: "2026-07-12T00:00:00Z" })];
    expect(buildAttentionQueue({ todayIso: TODAY, ownerLoopItems })).toHaveLength(0);
    expect(buildAttentionQueue({ todayIso: TODAY, ownerLoopItems, now: new Date("2026-07-13T00:00:01Z") })).toHaveLength(1);
  });

  it("keeps known actions when owner-loop data is unavailable", () => {
    const q = buildAttentionQueue({
      todayIso: TODAY,
      ownerLoopItems: null,
      pendingDecisions: [{ title: "Governance ruling", file: "ruling.md" }],
    });
    expect(q.map((item) => item.title)).toEqual(["Governance ruling"]);
  });
});

describe("business dates (compliance register) in the attention queue", () => {
  const due = (over: Partial<import("../src/lib/due-items").DueItem>) => ({
    entity: "Strandworks Medical Resources", kind: "obligation", item: "x", jurisdiction: "KY",
    dueOn: "2026-09-09", daysLeft: 11, status: "open", feeUsd: 40, alertDaysBefore: 30, ...over,
  });
  it("adds items inside their own alert window, skips the rest", () => {
    const q = buildAttentionQueue({
      todayIso: "2026-08-29",
      dueItems: [
        due({ item: "File Articles", daysLeft: 11 }),
        due({ item: "KY annual report", dueOn: "2027-06-30", daysLeft: 305, alertDaysBefore: 45 }),
        due({ item: "Late thing", dueOn: "2026-08-01", daysLeft: -28 }),
      ],
    });
    expect(q.map((i) => i.title)).toEqual(["Late thing", "File Articles"]);
    expect(q[0].severity).toBe("now");
    expect(q[1].severity).toBe("soon");
    expect(q[1].kind).toBe("business");
    expect(q[1].href).toBe("/business");
    expect(q[1].detail).toContain("$40.00");
  });
  it("tolerates a null (unreachable) register", () => {
    expect(buildAttentionQueue({ todayIso: "2026-08-29", dueItems: null })).toEqual([]);
  });
});
