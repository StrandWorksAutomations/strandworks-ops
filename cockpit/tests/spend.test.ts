import { describe, it, expect } from "vitest";
import { buildSpendView, parseLedger, dollarsToCents, currentMonth } from "@/lib/spend";

const HEADER = "date,month,amount_usd,project,purpose,status,requested_by";

describe("dollarsToCents (float-safe, mirrors the gate)", () => {
  it("rounds to integer cents and rejects negatives to 0", () => {
    expect(dollarsToCents("70.00")).toBe(7000);
    expect(dollarsToCents("0.1")).toBe(10);
    expect(dollarsToCents("")).toBe(0);
    expect(dollarsToCents("-5")).toBe(0);
  });
});

describe("buildSpendView — month-to-date vs ceiling", () => {
  const M = "2026-07";

  it("sums only ALLOWED rows in the target month", () => {
    const csv = [
      HEADER,
      `2026-07-02,${M},70.00,3rdrider,gpu,allowed,orchestrator`,
      `2026-07-03,${M},25.00,medsim,api,allowed,orchestrator`,
      `2026-07-04,${M},999.00,x,over,refused,orchestrator`, // refused → never counts
      `2026-06-30,2026-06,50.00,y,prev month,allowed,orchestrator`, // other month → never counts
    ].join("\n");
    const v = buildSpendView(csv, 200, M);
    expect(v.spentUsd).toBeCloseTo(95.0, 2);
    expect(v.headroomUsd).toBeCloseTo(105.0, 2);
    expect(v.over).toBe(false);
    expect(v.allowedThisMonth).toHaveLength(2);
    expect(v.refusedThisMonth).toHaveLength(1);
  });

  it("flags OVER when allowed spend exceeds the ceiling", () => {
    const csv = [
      HEADER,
      `2026-07-01,${M},150.00,a,x,allowed,o`,
      `2026-07-02,${M},75.00,b,y,allowed,o`,
    ].join("\n");
    const v = buildSpendView(csv, 200, M);
    expect(v.spentUsd).toBeCloseTo(225.0, 2);
    expect(v.over).toBe(true);
    expect(v.headroomUsd).toBeCloseTo(-25.0, 2);
    expect(v.pctUsed).toBeGreaterThan(100);
  });

  it("treats exactly-at-ceiling as NOT over (boundary)", () => {
    const csv = [HEADER, `2026-07-01,${M},200.00,a,x,allowed,o`].join("\n");
    const v = buildSpendView(csv, 200, M);
    expect(v.over).toBe(false);
    expect(v.headroomUsd).toBe(0);
    expect(v.pctUsed).toBe(100);
  });

  it("an empty ledger is $0 spent, full headroom", () => {
    const v = buildSpendView(HEADER + "\n", 200, M);
    expect(v.spentUsd).toBe(0);
    expect(v.headroomUsd).toBe(200);
    expect(v.entryCount).toBe(0);
  });

  it("a null ledger (missing file) is $0 spent, does not throw", () => {
    const v = buildSpendView(null, 200, M);
    expect(v.spentUsd).toBe(0);
    expect(v.over).toBe(false);
  });

  it("reads the ceiling as passed (owner-adjustable), not hardcoded", () => {
    const csv = [HEADER, `2026-07-01,${M},60.00,a,x,allowed,o`].join("\n");
    expect(buildSpendView(csv, 50, M).over).toBe(true);
    expect(buildSpendView(csv, 100, M).over).toBe(false);
  });

  it("carries no card/account numbers (ledger has none by construction)", () => {
    const csv = [HEADER, `2026-07-01,${M},60.00,a,x,allowed,o`].join("\n");
    const v = buildSpendView(csv, 200, M);
    const all = v.allowedThisMonth.flatMap((r) => Object.values(r)).join(" ");
    expect(all).not.toMatch(/\b\d{12,19}\b/);
  });
});

describe("parseLedger / currentMonth", () => {
  it("parses rows into typed ledger records", () => {
    const rows = parseLedger([HEADER, "2026-07-01,2026-07,10.00,p,why,allowed,o"].join("\n"));
    expect(rows).toHaveLength(1);
    expect(rows[0].amount_usd).toBe("10.00");
    expect(rows[0].status).toBe("allowed");
  });
  it("currentMonth is YYYY-MM", () => {
    expect(currentMonth(new Date("2026-07-13T12:00:00Z"))).toBe("2026-07");
  });
});
