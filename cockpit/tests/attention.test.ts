import { describe, it, expect } from "vitest";
import { buildAttentionQueue } from "../src/lib/attention";

const TODAY = "2026-07-13";

const CAL_HEADER = "date,item,type,action_needed";
const SUB_HEADER =
  "service,plan,cost_monthly_usd,billing_cadence,renewal_date,payment_last4,status,notes";
const ASSET_HEADER = "asset,type,location,size,hash,project,canonical,notes";

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
});
