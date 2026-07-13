// gate.ts — the mechanical cumulative spend gate (SPEC WS-B / VISION Autonomy
// Floor #1).
//
// THE ONE INVARIANT: this is a hard computed gate, never an LLM judgment. The
// only decision operation is arithmetic on the ledger:
//
//     sum(this month's ALLOWED autonomous charges) + amount  <=  ceiling
//
// There is deliberately NO function anywhere in this module that takes a single
// amount and returns "allowed" without consulting the running month-to-date
// sum. The per-item "this one is cheap" failure mode is impossible by
// construction — the comparison operand is ALWAYS (runningSum + amount).
//
// Every attempt — allowed or refused — is appended to the ledger. A refusal
// additionally files an owner decision card.

import { join } from "node:path";
import { dollarsToCents, centsToDollarString } from "./money.ts";
import {
  readLedger,
  appendLedger,
  monthAllowedTotalCents,
  type LedgerEntry,
} from "./ledger.ts";
import { loadCeilingCents } from "./config.ts";
import { fileOverCeilingCard } from "./decision-card.ts";

export interface CheckSpendRequest {
  amount: number | string; // proposed NEW autonomous charge, in USD dollars
  project: string;
  purpose: string;
  requestedBy?: string;
}

export interface SpendGatePaths {
  /** registers/autonomous-spend.csv */
  ledgerPath: string;
  /** fabric/spend-gate/ceiling.json */
  ceilingPath: string;
  /** _governance/decisions/ */
  decisionsDir: string;
}

export interface CheckSpendResult {
  status: "allowed" | "refused";
  amountCents: number;
  /** allowed month-to-date total BEFORE this charge */
  priorMonthTotalCents: number;
  /** what the allowed month-to-date total would be WITH this charge */
  projectedMonthTotalCents: number;
  ceilingCents: number;
  month: string;
  /** decision-card id, only present on refusal */
  decisionCardId?: string;
  decisionCardPath?: string;
}

/** Resolve the standard repo-relative paths from a repo root. */
export function defaultPaths(repoRoot: string): SpendGatePaths {
  return {
    ledgerPath: join(repoRoot, "registers", "autonomous-spend.csv"),
    ceilingPath: join(repoRoot, "fabric", "spend-gate", "ceiling.json"),
    decisionsDir: join(repoRoot, "_governance", "decisions"),
  };
}

/** YYYY-MM for a Date (UTC). */
export function monthOf(d: Date): string {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

/** YYYY-MM-DD for a Date (UTC). */
export function dateOf(d: Date): string {
  return `${monthOf(d)}-${d.getUTCDate().toString().padStart(2, "0")}`;
}

/**
 * THE gate. Reads the ceiling and the ledger, computes the cumulative sum for
 * the current month, and decides purely by comparing (sum + amount) to the
 * ceiling. Records the attempt; files an owner card on refusal.
 *
 * `now` is injectable so month-rollover behavior is testable and deterministic.
 */
export function checkSpend(
  req: CheckSpendRequest,
  paths: SpendGatePaths,
  now: Date = new Date(),
): CheckSpendResult {
  const amountCents = dollarsToCents(req.amount);
  const month = monthOf(now);
  const date = dateOf(now);

  const ceilingCents = loadCeilingCents(paths.ceilingPath);
  const entries: LedgerEntry[] = readLedger(paths.ledgerPath);

  // The cumulative sum — the ONLY input to the decision besides the amount.
  const priorMonthTotalCents = monthAllowedTotalCents(entries, month);
  const projectedMonthTotalCents = priorMonthTotalCents + amountCents;

  // The entire decision. No per-item branch exists.
  const status: "allowed" | "refused" =
    projectedMonthTotalCents <= ceilingCents ? "allowed" : "refused";

  const requestedBy = req.requestedBy ?? "fabric";

  // Log EVERY attempt (allowed or refused).
  appendLedger(paths.ledgerPath, {
    date,
    month,
    amount_usd: centsToDollarString(amountCents),
    project: req.project,
    purpose: req.purpose,
    status,
    requested_by: requestedBy,
  });

  const result: CheckSpendResult = {
    status,
    amountCents,
    priorMonthTotalCents,
    projectedMonthTotalCents,
    ceilingCents,
    month,
  };

  if (status === "refused") {
    const card = fileOverCeilingCard({
      decisionsDir: paths.decisionsDir,
      date,
      month,
      amountCents,
      monthToDateCents: priorMonthTotalCents,
      ceilingCents,
      project: req.project,
      purpose: req.purpose,
      requestedBy,
    });
    result.decisionCardId = card.id;
    result.decisionCardPath = card.path;
  }

  return result;
}
