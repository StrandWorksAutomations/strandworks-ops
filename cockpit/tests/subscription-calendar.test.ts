import { describe, expect, it } from "vitest";
import { buildMoneyView } from "../src/lib/money";
import { calendarEvents, calendarSubscriptions, nextPayments } from "../src/lib/subscription-calendar";
import { ownerDay } from "../src/lib/owner-loop";

const header = "service,plan,cost_monthly_usd,billing_cadence,renewal_date,status,verdict,charge_usd";
const read = (...rows: string[]) => calendarSubscriptions(buildMoneyView([header, ...rows].join("\n")));

describe("subscription payments", () => {
  it("keeps the original day through short months and leap years", () => {
    const subs = read(
      "Monthly,Pro,8,monthly,2024-01-31,active,,",
      "Quarter,Pro,10,quarterly,2023-11-30,active,,30",
      "Annual,Pro,5,annual,2020-02-29,active,,60",
    );
    const feb = calendarEvents(subs, "2024-02-01", "2024-02-29");
    expect(feb.map((e) => [e.date, e.subscription.service])).toEqual([
      ["2024-02-29", "Annual"], ["2024-02-29", "Monthly"], ["2024-02-29", "Quarter"],
    ]);
    expect(nextPayments(subs.slice(0, 1), "2024-03-01")[0].date).toBe("2024-03-31");
    expect(nextPayments(subs.slice(1, 2), "2024-03-01")[0].date).toBe("2024-05-30");
    expect(nextPayments(subs.slice(2), "2025-02-01")[0].date).toBe("2025-02-28");
  });

  it("rolls confirmed weekly and monthly charges and includes payments due today in Eastern time", () => {
    const subs = read(
      "Weekly,,3,weekly,2026-03-02,active,,",
      "Monthly,,3,monthly (9th),2025-09-09,active-HIDDEN,,",
      "Unpriced,,,monthly,2026-03-09,active,,",
      "Second,,1,monthly,2026-03-10,active,,",
    );
    const today = ownerDay("2026-03-10T02:00:00Z");
    expect(today).toBe("2026-03-09");
    expect(nextPayments(subs, today).map((e) => [e.date, e.subscription.service])).toEqual([
      [today, "Monthly"], [today, "Unpriced"], [today, "Weekly"],
    ]);
    expect(calendarEvents(subs.slice(0, 1), "2026-03-03", "2026-03-17").map((e) => e.date)).toEqual(["2026-03-09", "2026-03-16"]);
  });

  it("shows recorded dates once for unclear cadence and rejects impossible or unstructured dates", () => {
    const subs = read(
      "Unknown,,5,annual?,2026-08-02,active,,",
      "Conflicting,,5,monthly (7th),2026-08-02,active,,",
      "Staggered,,4,annual,staggered 2026-08-02/03,active,,",
      "Bad,,4,monthly,2026-02-30,active,,",
      "Blank,,3,monthly,,active,,",
    );
    expect(calendarEvents(subs, "2026-08-01", "2027-08-01").map((e) => [e.subscription.service, e.subscription.recurrence])).toEqual([
      ["Conflicting", null], ["Unknown", null],
    ]);
    expect(nextPayments(subs, "2026-09-01")).toEqual([]);
    expect(calendarEvents(subs, "2026-02-30", "2026-09-01")).toEqual([]);
  });

  it("excludes paused, cancelled, one-time and unconfirmed subscriptions", () => {
    const subs = read(
      "Cancelled,,3,monthly,2026-12-01,cancelled-expiring,,",
      "Paused,,3,monthly,2026-12-01,paused,,",
      "One off,,3,one-time?,2026-12-01,active,,",
      "Inactive,,3,monthly,2026-12-01,inactive,,",
      "Review,,3,monthly,2026-12-01,review,,",
    );
    expect(subs.every((s) => !s.active)).toBe(true);
    expect(nextPayments(subs, "2026-12-01")).toEqual([]);
  });

  it("retains billable and flagged renewals and stops projecting dates after a cancellation request", () => {
    const subs = read(
      "Refund,,8,annual,2026-12-01,refund-requested,,",
      "Still billing,,3,monthly,2026-12-01,paused-but-billing,,",
      "Do not renew,,4,annual,2026-12-01,do-not-renew,,",
      "Pending,,5,monthly,2026-12-01,active,pending-cancel,",
      "Cancel intent,,5,monthly,2026-12-01,active,cancel,",
    );
    expect(nextPayments(subs, "2026-11-24")).toHaveLength(5);
    expect(subs.map((s) => [s.billingNote, s.recurrence])).toEqual([
      ["Refund requested", "annually"], ["Paused, still billing", "monthly"],
      ["Do not renew", null], ["Cancellation pending", null], ["Marked for cancellation", null],
    ]);
    expect(calendarEvents(subs, "2026-12-02", "2027-01-31").map((e) => e.subscription.service)).toEqual(["Still billing"]);
    expect(nextPayments([subs[0]], "2027-01-01")[0].subscription.chargeUsd).toBeNull();
  });

  it("keeps the actual charge separate from the monthly equivalent and preserves unknown amounts", () => {
    const rows = [
      "Explicit,,9.99,annually,2026-12-01,active,,119.95",
      "Unpriced annual,,9.99,annually,2026-12-01,active,,",
      "Approx,,~5.99,monthly,2026-12-01,active,,",
      "Free,,5,monthly,2026-12-01,active,,0",
      "Malformed,,5,monthly,2026-12-01,active,,n/a",
      "Uncertain,,15-25,monthly,2026-12-01,active,,",
    ];
    const view = buildMoneyView([header, ...rows].join("\n"));
    expect(view.items[0]).toMatchObject({ costUsd: 9.99, chargeRaw: "119.95", chargeUsd: 119.95 });
    expect(calendarSubscriptions(view).map((s) => [s.chargeUsd, s.approximate])).toEqual([
      [119.95, false], [null, false], [5.99, true], [0, false], [null, false], [null, false],
    ]);
    expect(nextPayments(calendarSubscriptions(view), "2026-01-01")).toHaveLength(6);
  });
});
