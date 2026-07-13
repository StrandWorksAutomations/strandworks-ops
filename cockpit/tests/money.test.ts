import { describe, it, expect } from "vitest";
import {
  buildMoneyView,
  classifyStatus,
  upcomingRenewals,
  addDays,
} from "../src/lib/money";

const HEADER =
  "service,plan,cost_monthly_usd,billing_cadence,renewal_date,payment_last4,status,notes";

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

describe("classifyStatus", () => {
  it("maps the register's status vocabulary to spend classes", () => {
    expect(classifyStatus("active")).toBe("core");
    expect(classifyStatus("active-keep")).toBe("core");
    expect(classifyStatus("active-HIDDEN")).toBe("hidden");
    expect(classifyStatus("refund-requested")).toBe("flagged");
    expect(classifyStatus("do-not-renew")).toBe("flagged");
    expect(classifyStatus("paused-but-billing")).toBe("flagged");
    expect(classifyStatus("cancelled-expiring")).toBe("ending");
    expect(classifyStatus("presumed-dead")).toBe("ending");
    expect(classifyStatus("owned")).toBe("owned");
    expect(classifyStatus("owned-CONFIRMED")).toBe("owned");
    expect(classifyStatus("fyi")).toBe("personal");
    expect(classifyStatus("review")).toBe("review");
    expect(classifyStatus("owner-review")).toBe("review");
    expect(classifyStatus("UNSWEPT")).toBe("review");
  });

  it("defaults unknown statuses to review, never to core", () => {
    expect(classifyStatus("")).toBe("review");
    expect(classifyStatus("mystery")).toBe("review");
  });
});

describe("buildMoneyView", () => {
  it("sums only recurring burn classes and never invents costs", () => {
    const view = buildMoneyView(
      csv(
        "Claude,Max,212.00,monthly,2026-08-07,8774,active,primary",
        "ElevenLabs,,23.32,monthly,2026-08-08,8774,active-HIDDEN,voice",
        "Linear,,,unknown,,8774,active-HIDDEN,uncosted",
        "CC5,perpetual,,one-time,,,owned,license",
        "Personal,grouped,,monthly,,mixed,fyi,out of scope",
        "Old thing,,9.99,monthly,,,presumed-dead,gone",
      ),
    );
    expect(view.knownMonthlyUsd).toBe(235.32); // 212 + 23.32; dead 9.99 excluded
    expect(view.uncostedCount).toBe(1); // Linear only — owned/personal don't count
    expect(view.byClass.core.totalUsd).toBe(212);
    expect(view.byClass.hidden.count).toBe(2);
    expect(view.byClass.hidden.uncosted).toBe(1);
    expect(view.byClass.ending.totalUsd).toBe(9.99);
  });

  it("parses approximate costs and marks them approximate", () => {
    const view = buildMoneyView(
      csv(
        "Meshy,base,5.99+,monthly,,8774,active-HIDDEN,tops up",
        "GCP,payg,~12,monthly,,8774,active-HIDDEN,growing",
      ),
    );
    expect(view.knownMonthlyUsd).toBe(17.99);
    expect(view.approxCount).toBe(2);
    expect(view.items[0].costApprox).toBe(true);
  });

  it("extracts a renewal date even from prose renewal fields", () => {
    const view = buildMoneyView(
      csv(
        "Namecheap,34 domains,,annual,staggered — 10 renew 2026-08-29/30,,active,domains",
        "Supabase,Pro,67.18,monthly,2026-08-11,8774,active,db",
        "NoDate,,5,monthly,,,active,",
      ),
    );
    expect(view.renewals.map((r) => r.service)).toEqual(["Supabase", "Namecheap"]);
    expect(view.renewals[1].renewalIso).toBe("2026-08-29");
  });

  it("orders top burns largest first, excluding non-recurring classes", () => {
    const view = buildMoneyView(
      csv(
        "Small,,5,monthly,,,active,",
        "Big,,80,monthly,,,active-HIDDEN,",
        "Dead,,500,monthly,,,presumed-dead,",
      ),
    );
    expect(view.topBurns.map((t) => t.service)).toEqual(["Big", "Small"]);
  });

  it("handles a missing register", () => {
    const view = buildMoneyView(null);
    expect(view.items).toEqual([]);
    expect(view.knownMonthlyUsd).toBe(0);
  });
});

describe("upcomingRenewals", () => {
  it("returns only renewals inside the horizon, soonest first", () => {
    const view = buildMoneyView(
      csv(
        "A,,1,monthly,2026-07-15,,active,",
        "B,,2,monthly,2026-08-20,,active,",
        "C,,3,monthly,2026-07-01,,active,", // already past
      ),
    );
    const up = upcomingRenewals(view, "2026-07-13", 30);
    expect(up.map((u) => u.service)).toEqual(["A"]);
    const wide = upcomingRenewals(view, "2026-07-13", 60);
    expect(wide.map((u) => u.service)).toEqual(["A", "B"]);
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    expect(addDays("2026-07-28", 7)).toBe("2026-08-04");
  });
});
