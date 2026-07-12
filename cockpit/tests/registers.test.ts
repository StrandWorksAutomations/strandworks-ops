import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/csv";
import { buildRegisterView, isRegisterName, REGISTERS } from "@/lib/registers";

describe("parseCsv", () => {
  it("parses simple rows into header-keyed records", () => {
    const t = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
    expect(t.headers).toEqual(["a", "b", "c"]);
    expect(t.rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });

  it("handles quoted fields with commas, quotes, and newlines", () => {
    const t = parseCsv('name,notes\nx,"has, comma and ""quote"" and\nnewline"\n');
    expect(t.rows[0].notes).toBe('has, comma and "quote" and\nnewline');
  });

  it("pads short rows with empty strings and skips blank lines", () => {
    const t = parseCsv("a,b,c\n1,2\n\n3,4,5\n");
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0]).toEqual({ a: "1", b: "2", c: "" });
  });
});

describe("buildRegisterView", () => {
  const SUBS = [
    "service,plan,cost_monthly_usd,billing_cadence,renewal_date,payment_last4,status,notes",
    "Vercel,Pro,20.00,monthly,2026-07-28,8774,active,usage near zero",
    'Meshy,base+usage,5.99+,monthly,,8774,active-HIDDEN,"top-ups, ~$100/mo real"',
    "Character Creator 5,,,one-time?,,,owned,license type unknown",
  ].join("\n");

  it("shapes subscription rows into cards with title/status/cost", () => {
    const v = buildRegisterView("subscriptions", SUBS);
    expect(v.cards).toHaveLength(3);
    expect(v.cards[0].title).toBe("Vercel");
    expect(v.cards[0].status).toBe("active");
    expect(v.cards[0].cost).toBe("$20.00/mo");
    // blank fields are dropped from the card
    expect(v.cards[2].fields.map((f) => f.label)).not.toContain("plan");
  });

  it("renders register content AS-IS — adds no derived payment data", () => {
    const v = buildRegisterView("subscriptions", SUBS);
    const vercel = v.cards[0];
    const last4 = vercel.fields.find((f) => f.label === "payment last4");
    expect(last4?.value).toBe("8774"); // exactly what the register says, nothing more
    const allValues = v.cards.flatMap((c) => c.fields.map((f) => f.value)).join(" ");
    expect(allValues).not.toMatch(/\b\d{12,19}\b/); // never a full card/account number
  });

  it("totals known monthly costs and counts uncosted actives", () => {
    const v = buildRegisterView("subscriptions", SUBS);
    expect(v.totalMonthlyUsd).toBeCloseTo(25.99, 2);
    // "owned" status is excluded from the uncosted count
    expect(v.incompleteCosts).toBe(0);
  });

  it("counts an active row with no cost as uncosted", () => {
    const v = buildRegisterView(
      "subscriptions",
      "service,cost_monthly_usd,status\nLinear,,active-HIDDEN\n"
    );
    expect(v.incompleteCosts).toBe(1);
    expect(v.totalMonthlyUsd).toBe(0);
  });

  it("uses the right title field per register", () => {
    const access = buildRegisterView(
      "access",
      "system,account,machines_with_access,key_location,notes\nGitHub,Org,VAIO,~/.ssh/key on each,\n"
    );
    expect(access.cards[0].title).toBe("GitHub");
    const cal = buildRegisterView("calendar", "date,item,type,action_needed\n2026-07-18,Refund deadline,deadline-watch,escalate\n");
    expect(cal.cards[0].title).toBe("Refund deadline");
  });
});

describe("register names", () => {
  it("recognizes exactly the six repo registers", () => {
    expect(REGISTERS.map((r) => r.name).sort()).toEqual(
      ["access", "assets", "calendar", "models", "services", "subscriptions"].sort()
    );
    expect(isRegisterName("subscriptions")).toBe(true);
    expect(isRegisterName("../secrets")).toBe(false);
    expect(isRegisterName("payments")).toBe(false);
  });
});
