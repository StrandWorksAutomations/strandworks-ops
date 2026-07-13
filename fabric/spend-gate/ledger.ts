// ledger.ts — append-only autonomous-spend ledger (registers/autonomous-spend.csv).
//
// This tracks ONLY new spend the fabric incurs on its own. It is SEPARATE from
// the blessed subscriptions in registers/subscriptions.csv, which are OUTSIDE
// the ceiling (VISION Autonomy Floor #1). Nothing in this file ever reads
// subscriptions.csv.
//
// Columns: date, month, amount_usd, project, purpose, status, requested_by
//   date         ISO date (YYYY-MM-DD) the attempt was recorded
//   month        YYYY-MM — the calendar month the charge is scoped to
//   amount_usd   the charge amount as a 2-decimal dollar string
//   project      free text
//   purpose      free text
//   status       "allowed" | "refused"
//   requested_by free text (which agent/orchestrator asked)
//
// NO card numbers, account numbers, or credentials ever go in this file —
// amounts and purposes only (repo hard rule).

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { dollarsToCents } from "./money.ts";

export type LedgerStatus = "allowed" | "refused";

export interface LedgerEntry {
  date: string;        // YYYY-MM-DD
  month: string;       // YYYY-MM
  amount_usd: string;  // dollar string, e.g. "70.00"
  project: string;
  purpose: string;
  status: LedgerStatus;
  requested_by: string;
}

export const LEDGER_HEADER =
  "date,month,amount_usd,project,purpose,status,requested_by";

// --- minimal RFC-4180-ish CSV helpers (no dependency) ---

/** Quote a field if it contains comma, quote, or newline; escape embedded quotes. */
export function csvQuote(field: string): string {
  if (/[",\n\r]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Parse a single CSV line into fields (handles quotes + escaped quotes). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function entryToRow(e: LedgerEntry): string {
  return [
    e.date,
    e.month,
    e.amount_usd,
    e.project,
    e.purpose,
    e.status,
    e.requested_by,
  ]
    .map((f) => csvQuote(String(f)))
    .join(",");
}

/** Ensure the ledger file exists with a header. */
export function ensureLedger(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, LEDGER_HEADER + "\n");
  }
}

/** Read all ledger entries. Missing file → empty list. */
export function readLedger(path: string): LedgerEntry[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const [header, ...rows] = lines;
  // Tolerate the exact header only; anything else is a schema mismatch.
  if (header.trim() !== LEDGER_HEADER) {
    throw new Error(
      `ledger header mismatch at ${path}: expected "${LEDGER_HEADER}"`,
    );
  }
  return rows.map((line) => {
    const f = parseCsvLine(line);
    const status = f[5];
    if (status !== "allowed" && status !== "refused") {
      throw new Error(`ledger row has invalid status "${status}": ${line}`);
    }
    return {
      date: f[0],
      month: f[1],
      amount_usd: f[2],
      project: f[3] ?? "",
      purpose: f[4] ?? "",
      status,
      requested_by: f[6] ?? "",
    };
  });
}

/** Append one entry (append-only; never rewrites existing rows). */
export function appendLedger(path: string, entry: LedgerEntry): void {
  ensureLedger(path);
  appendFileSync(path, entryToRow(entry) + "\n");
}

/**
 * Sum, in integer cents, of ALLOWED charges scoped to a given month.
 *
 * This is the ONLY thing that feeds the gate's comparison. Refused rows never
 * count (they never actually spent). Other months never count (month rollover).
 * There is intentionally no variant that sums a single row in isolation.
 */
export function monthAllowedTotalCents(
  entries: LedgerEntry[],
  month: string,
): number {
  let total = 0;
  for (const e of entries) {
    if (e.status === "allowed" && e.month === month) {
      total += dollarsToCents(e.amount_usd);
    }
  }
  return total;
}
