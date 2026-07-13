import { describe, it, expect } from "vitest";
import { applySubscriptionEdit, EditError } from "../src/lib/money-edit";
import { parseCsv, stringifyCsv } from "../src/lib/csv";
import { buildMoneyView } from "../src/lib/money";

const HEADER =
  "service,plan,cost_monthly_usd,billing_cadence,renewal_date,payment_last4,status,notes";
const CSV = [
  HEADER,
  'Claude,Max 20x,212.00,monthly,2026-08-07,8774,active,"primary, orchestrator"',
  "Suno,,31.80,monthly (7th),2026-08-07,ACH,active-HIDDEN,music gen",
  "CC5,perpetual,,one-time,,,owned,license",
].join("\n");

describe("stringifyCsv", () => {
  it("round-trips quoted fields", () => {
    const t = parseCsv(CSV);
    const out = stringifyCsv(t);
    expect(parseCsv(out)).toEqual(t);
    expect(out).toContain('"primary, orchestrator"');
  });
});

describe("applySubscriptionEdit — verdict", () => {
  it("adds owner columns on first edit and sets the verdict", () => {
    const { csv, summary } = applySubscriptionEdit(CSV, {
      action: "verdict",
      service: "Suno",
      verdict: "pending-cancel",
    });
    const t = parseCsv(csv);
    expect(t.headers).toContain("verdict");
    expect(t.headers).toContain("trial_end");
    expect(t.headers).toContain("discount");
    expect(t.rows.find((r) => r.service === "Suno")?.verdict).toBe("pending-cancel");
    expect(t.rows.find((r) => r.service === "Claude")?.verdict).toBe("");
    expect(summary).toContain("pending-cancel");
  });

  it("clears a verdict with blank, rejects invalid verdicts", () => {
    const once = applySubscriptionEdit(CSV, { action: "verdict", service: "Suno", verdict: "cancel" }).csv;
    const cleared = applySubscriptionEdit(once, { action: "verdict", service: "Suno", verdict: "" }).csv;
    expect(parseCsv(cleared).rows.find((r) => r.service === "Suno")?.verdict).toBe("");
    expect(() =>
      applySubscriptionEdit(CSV, { action: "verdict", service: "Suno", verdict: "maybe" as never })
    ).toThrow(EditError);
  });
});

describe("applySubscriptionEdit — update", () => {
  it("updates editable fields with validation", () => {
    const { csv } = applySubscriptionEdit(CSV, {
      action: "update",
      service: "Suno",
      fields: {
        cost_monthly_usd: "10.00",
        billing_cadence: "annually",
        trial_end: "2026-08-01",
        discount: "student",
      },
    });
    const row = parseCsv(csv).rows.find((r) => r.service === "Suno");
    expect(row?.cost_monthly_usd).toBe("10.00");
    expect(row?.billing_cadence).toBe("annually");
    expect(row?.trial_end).toBe("2026-08-01");
    expect(row?.discount).toBe("student");
    // sweep truth untouched
    expect(row?.status).toBe("active-HIDDEN");
    expect(row?.notes).toBe("music gen");
  });

  it("rejects bad cost, bad dates, non-editable fields, unknown service", () => {
    expect(() =>
      applySubscriptionEdit(CSV, { action: "update", service: "Suno", fields: { cost_monthly_usd: "lots" } })
    ).toThrow(/not a number/);
    expect(() =>
      applySubscriptionEdit(CSV, { action: "update", service: "Suno", fields: { trial_end: "next tuesday" } })
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      applySubscriptionEdit(CSV, {
        action: "update",
        service: "Suno",
        fields: { status: "active" } as never,
      })
    ).toThrow(/not editable/);
    expect(() =>
      applySubscriptionEdit(CSV, { action: "update", service: "Nope", fields: { discount: "x" } })
    ).toThrow(/no subscription named/);
  });

  it("allows blanking a cost (unknown stays unknown, never zero)", () => {
    const { csv } = applySubscriptionEdit(CSV, {
      action: "update",
      service: "Claude",
      fields: { cost_monthly_usd: "" },
    });
    expect(parseCsv(csv).rows.find((r) => r.service === "Claude")?.cost_monthly_usd).toBe("");
  });
});

describe("applySubscriptionEdit — delete", () => {
  it("removes the row, which drops the monthly total", () => {
    const before = buildMoneyView(CSV).knownMonthlyUsd;
    const { csv } = applySubscriptionEdit(CSV, { action: "delete", service: "Suno" });
    const after = buildMoneyView(csv).knownMonthlyUsd;
    expect(parseCsv(csv).rows.map((r) => r.service)).toEqual(["Claude", "CC5"]);
    expect(Math.round((before - after) * 100) / 100).toBe(31.8);
  });
});

describe("money view — new columns", () => {
  it("excludes one-time cadence from monthly burn, tracks cancel-marked and trials", () => {
    const csv = [
      HEADER + ",verdict,trial_end,discount",
      "A,,100,monthly,,,active,,cancel,,",
      "B,,50,one-time,,,active,,,,",
      "C,,20,monthly,,,active,,,2026-07-20,student",
    ].join("\n");
    const v = buildMoneyView(csv);
    expect(v.knownMonthlyUsd).toBe(120); // one-time B excluded
    expect(v.cancelMarkedUsd).toBe(100);
    expect(v.trials.map((t) => t.service)).toEqual(["C"]);
    expect(v.items.find((i) => i.service === "C")?.discount).toBe("student");
  });
});
