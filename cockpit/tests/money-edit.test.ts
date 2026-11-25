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

describe("subscription billing prices", () => {
  const add = { action: "add", service: "Lab", fields: {
    charge_usd: "19.99", renewal_date: "2028-02-29", billing_cadence: "annually",
  } } as const;

  it.each([["weekly", "86.62"], ["monthly", "19.99"], ["quarterly", "6.66"], ["annually", "1.67"]])(
    "keeps the exact %s payment separately from the monthly equivalent", (billing_cadence, expected) => {
      const { csv } = applySubscriptionEdit(CSV, { ...add, fields: { ...add.fields, billing_cadence } });
      expect(parseCsv(csv).rows.at(-1)).toMatchObject({ service: "Lab", status: "active", charge_usd: "19.99",
        cost_monthly_usd: expected, billing_cadence, renewal_date: "2028-02-29" });
    });

  it("recalculates the monthly equivalent on cadence changes and distinguishes free from unknown", () => {
    let csv = applySubscriptionEdit(CSV, add).csv;
    const edit = (fields: Record<string, string>) => {
      csv = applySubscriptionEdit(csv, { action: "update", service: "Lab", fields }).csv;
      return parseCsv(csv).rows.at(-1);
    };
    expect(edit({ billing_cadence: "quarterly" })).toMatchObject({ charge_usd: "19.99", cost_monthly_usd: "6.66" });
    expect(edit({ charge_usd: "9.9" })).toMatchObject({ charge_usd: "9.90", cost_monthly_usd: "3.30" });
    expect(edit({ charge_usd: "0" })).toMatchObject({ charge_usd: "0.00", cost_monthly_usd: "0.00" });
    expect(edit({ charge_usd: "" })).toMatchObject({ charge_usd: "", cost_monthly_usd: "" });
  });

  it("rejects duplicates, invalid price/date, or missing add fields", () => {
    expect(() => applySubscriptionEdit(CSV, { ...add, service: " cLAUde " })).toThrow(/already exists/);
    for (const changes of [{ charge_usd: "" }, { charge_usd: "-1" }, { charge_usd: "2.001" },
      { renewal_date: "2027-02-29" }, { renewal_date: "0000-01-01" }, { renewal_date: "" }, { billing_cadence: "once" }]) {
      expect(() => applySubscriptionEdit(CSV, { ...add, fields: { ...add.fields, ...changes } })).toThrow(EditError);
    }
  });
  it("preserves independent edits and rejects stale field updates", () => {
    const first = applySubscriptionEdit(CSV, { action: "update", service: "Suno", fields: { discount: "student" } }).csv;
    const next = applySubscriptionEdit(first, { action: "update", service: "Suno", fields: { plan: "Basic" }, expected: { plan: "" } }).csv;
    expect(parseCsv(next).rows[1]).toMatchObject({ plan: "Basic", discount: "student", billing_cadence: "monthly (7th)" });
    expect(() => applySubscriptionEdit(next, { action: "update", service: "Suno", fields: { discount: "annual" },
      expected: { discount: "" } })).toThrow(/changed/);
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
