// Autonomous-spend picture for the cockpit (SPEC WS-E, spend headroom).
//
// This SURFACES the WS-B ledger (registers/autonomous-spend.csv) — it does NOT
// gate. The gate lives in fabric/spend-gate and is the only thing that decides.
// Here we only compute a read-only month-to-date-vs-ceiling view for the owner.
//
// Semantics mirror the fabric ledger EXACTLY (fabric/spend-gate/ledger.ts):
//   - only ALLOWED rows count toward the total (refused rows never spent);
//   - only rows scoped to the target month count (month rollover);
//   - the ceiling is the SAME $200/mo figure the gate enforces (Autonomy
//     Floor #1). We read it here only to display headroom; adjusting it is an
//     owner act on fabric/spend-gate/ceiling.json.
// Cents arithmetic avoids float drift at the boundary, same as the gate.

import { parseCsv } from "./csv";

export const AUTONOMOUS_SPEND_HEADER =
  "date,month,amount_usd,project,purpose,status,requested_by";

export type LedgerRow = {
  date: string;
  month: string;
  amount_usd: string;
  project: string;
  purpose: string;
  status: string;
  requested_by: string;
};

export function dollarsToCents(amount: string): number {
  const n = Number((amount ?? "").trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToDollarString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${(abs % 100).toString().padStart(2, "0")}`;
}

export function currentMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7); // YYYY-MM
}

export function parseLedger(csvText: string): LedgerRow[] {
  const table = parseCsv(csvText);
  return table.rows.map((r) => ({
    date: r["date"] ?? "",
    month: r["month"] ?? "",
    amount_usd: r["amount_usd"] ?? "",
    project: r["project"] ?? "",
    purpose: r["purpose"] ?? "",
    status: r["status"] ?? "",
    requested_by: r["requested_by"] ?? "",
  }));
}

export type SpendView = {
  month: string;
  ceilingUsd: number;
  spentUsd: number; // month-to-date ALLOWED spend
  headroomUsd: number; // ceiling - spent (can be negative if the ledger is over)
  pctUsed: number; // 0..100+, spent/ceiling
  over: boolean; // spent > ceiling
  allowedThisMonth: LedgerRow[]; // month-scoped allowed rows (newest last)
  refusedThisMonth: LedgerRow[]; // month-scoped refused attempts (owner alerts)
  entryCount: number; // total ledger rows (any month/status)
};

// Build the month-to-date view. `ceilingUsd` comes from
// fabric/spend-gate/ceiling.json (read by the page); default 200 if unreadable.
export function buildSpendView(
  csvText: string | null,
  ceilingUsd: number,
  month: string = currentMonth(),
): SpendView {
  const rows = csvText ? parseLedger(csvText) : [];
  const allowedThisMonth = rows.filter((r) => r.status === "allowed" && r.month === month);
  const refusedThisMonth = rows.filter((r) => r.status === "refused" && r.month === month);

  let cents = 0;
  for (const r of allowedThisMonth) cents += dollarsToCents(r.amount_usd);
  const ceilingCents = Math.round(ceilingUsd * 100);

  const spentUsd = cents / 100;
  const headroomUsd = (ceilingCents - cents) / 100;
  const pctUsed = ceilingCents > 0 ? Math.round((cents / ceilingCents) * 1000) / 10 : 0;

  return {
    month,
    ceilingUsd,
    spentUsd,
    headroomUsd,
    pctUsed,
    over: cents > ceilingCents,
    allowedThisMonth,
    refusedThisMonth,
    entryCount: rows.length,
  };
}
