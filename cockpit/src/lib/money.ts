// Money view — a classified picture of registers/subscriptions.csv.
//
// Reads ONLY the subscriptions register and shapes it for the /money page and
// the Overview burn gauge. It invents nothing: every dollar figure shown is a
// figure already in the register; unknown costs stay unknown and are surfaced
// as "uncosted" counts, never guessed. The known total is therefore a FLOOR.

import { parseCsv } from "./csv";

// Spend classes, in display order. Derived mechanically from the register's
// own `status` vocabulary (active / active-HIDDEN / review / refund-requested /
// do-not-renew / paused-but-billing / cancelled-expiring / presumed-dead /
// owned / fyi / UNSWEPT / owner-review).
export type SpendClass =
  | "core" // active, deliberately kept
  | "hidden" // found in the bank sweep, was never in a register
  | "flagged" // owner action pending: refunds, do-not-renew, paused-but-billing
  | "review" // single/unclear charges + unswept surfaces awaiting a verdict
  | "ending" // cancelled, expiring, or presumed dead — no action needed
  | "owned" // one-time licenses, not recurring burn
  | "personal"; // out of business scope (fyi rows)

export const SPEND_CLASSES: { cls: SpendClass; label: string; blurb: string }[] = [
  { cls: "core", label: "Core", blurb: "active, deliberately kept" },
  { cls: "hidden", label: "Hidden", blurb: "found in the bank sweep" },
  { cls: "flagged", label: "Flagged", blurb: "owner action pending" },
  { cls: "review", label: "Review", blurb: "unclear — needs a verdict" },
  { cls: "ending", label: "Winding down", blurb: "cancelled or lapsing" },
  { cls: "owned", label: "Owned", blurb: "one-time licenses" },
  { cls: "personal", label: "Personal", blurb: "out of business scope" },
];

export function classifyStatus(status: string): SpendClass {
  const s = (status ?? "").toLowerCase();
  if (s.includes("hidden")) return "hidden";
  if (/refund|do-not-renew|paused-but-billing/.test(s)) return "flagged";
  if (/dead|cancelled|expiring/.test(s)) return "ending";
  if (s.includes("owned")) return "owned";
  if (s === "fyi") return "personal";
  if (/unswept|owner-review|review/.test(s)) return "review";
  if (/active|keep/.test(s)) return "core";
  return "review";
}

export type MoneyItem = {
  service: string;
  plan: string;
  costUsd: number | null; // parsed cost; null = unknown (never guessed)
  costRaw: string; // the register's own cost text ("5.99+", "~12", "")
  costApprox: boolean; // register marked the figure approximate (~, +)
  cadence: string;
  renewalIso: string | null; // first YYYY-MM-DD found in renewal_date
  renewalRaw: string;
  status: string;
  cls: SpendClass;
  notes: string;
};

export type MoneyView = {
  items: MoneyItem[];
  // Known recurring burn = costed core+hidden+flagged+review (a floor).
  knownMonthlyUsd: number;
  uncostedCount: number; // recurring rows with no usable figure
  approxCount: number; // rows counted from an approximate figure
  byClass: Record<SpendClass, { totalUsd: number; count: number; uncosted: number }>;
  topBurns: MoneyItem[]; // costed recurring items, largest first
  renewals: MoneyItem[]; // items with a parseable renewal date, soonest first
};

// Classes whose costs count toward the recurring-burn floor. Ending/owned are
// excluded (not ongoing); personal is out of business scope.
const BURN_CLASSES: SpendClass[] = ["core", "hidden", "flagged", "review"];

function parseCost(raw: string): { n: number | null; approx: boolean } {
  const text = (raw ?? "").trim();
  if (text === "") return { n: null, approx: false };
  const n = parseFloat(text.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return { n: null, approx: false };
  return { n, approx: /[~+]/.test(text) };
}

function parseRenewal(raw: string): string | null {
  const m = (raw ?? "").match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

export function buildMoneyView(csvText: string | null): MoneyView {
  const rows = csvText ? parseCsv(csvText).rows : [];

  const items: MoneyItem[] = rows.map((r) => {
    const { n, approx } = parseCost(r["cost_monthly_usd"] ?? "");
    return {
      service: r["service"] || "(unnamed)",
      plan: r["plan"] ?? "",
      costUsd: n,
      costRaw: (r["cost_monthly_usd"] ?? "").trim(),
      costApprox: approx,
      cadence: r["billing_cadence"] ?? "",
      renewalIso: parseRenewal(r["renewal_date"] ?? ""),
      renewalRaw: r["renewal_date"] ?? "",
      status: r["status"] ?? "",
      cls: classifyStatus(r["status"] ?? ""),
      notes: r["notes"] ?? "",
    };
  });

  const byClass = {} as MoneyView["byClass"];
  for (const { cls } of SPEND_CLASSES) byClass[cls] = { totalUsd: 0, count: 0, uncosted: 0 };

  let known = 0;
  let uncosted = 0;
  let approxCount = 0;
  for (const it of items) {
    const bucket = byClass[it.cls];
    bucket.count++;
    if (it.costUsd !== null) {
      bucket.totalUsd = Math.round((bucket.totalUsd + it.costUsd) * 100) / 100;
    } else {
      bucket.uncosted++;
    }
    if (BURN_CLASSES.includes(it.cls)) {
      if (it.costUsd !== null) {
        known += it.costUsd;
        if (it.costApprox) approxCount++;
      } else {
        uncosted++;
      }
    }
  }

  const topBurns = items
    .filter((it) => it.costUsd !== null && BURN_CLASSES.includes(it.cls))
    .sort((a, b) => (b.costUsd ?? 0) - (a.costUsd ?? 0));

  const renewals = items
    .filter((it) => it.renewalIso !== null)
    .sort((a, b) => (a.renewalIso ?? "").localeCompare(b.renewalIso ?? ""));

  return {
    items,
    knownMonthlyUsd: Math.round(known * 100) / 100,
    uncostedCount: uncosted,
    approxCount,
    byClass,
    topBurns,
    renewals,
  };
}

// Renewals falling on/after `todayIso` and within `days` — the near horizon.
export function upcomingRenewals(view: MoneyView, todayIso: string, days: number): MoneyItem[] {
  const end = addDays(todayIso, days);
  return view.renewals.filter(
    (it) => it.renewalIso !== null && it.renewalIso >= todayIso && it.renewalIso <= end,
  );
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
