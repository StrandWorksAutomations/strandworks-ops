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

import { openSync, closeSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
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

// --- exclusive lock around the read-sum -> decide -> append critical section ---
//
// appendFileSync is not atomic against a concurrent reader: two overlapping
// checkSpend calls could each read the SAME prior month sum, each decide the
// charge fits, and each append — jointly blowing past the ceiling. That is the
// exact failure mode the gate exists to prevent, so the critical section must be
// serialized.
//
// We use an exclusive lockfile: fs.openSync(lockPath, "wx") fails with EEXIST if
// the lock is held, so only one holder wins. On contention we retry with a short
// backoff for a bounded time. If the lock CANNOT be acquired we FAIL CLOSED —
// throw, never allow — because a gate that cannot guarantee serialization must
// refuse rather than risk a double-spend.

/** Max total time (ms) to wait for the lock before failing closed. */
export const LOCK_TIMEOUT_MS = 5000;

/** Busy-wait synchronously for `ms` (checkSpend is synchronous by contract). */
function sleepSyncMs(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // spin — waits are tiny (single-digit ms) and rare (only under contention)
  }
}

/**
 * Acquire an exclusive lock for `ledgerPath`. Returns the lock path (to release).
 * Retries with backoff up to LOCK_TIMEOUT_MS; throws (FAIL CLOSED) if it cannot
 * be acquired in time. Only EEXIST is retried; any other error is fatal.
 */
export function acquireLedgerLock(ledgerPath: string): string {
  const lockPath = `${ledgerPath}.lock`;
  mkdirSync(dirname(lockPath), { recursive: true });
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let backoff = 5;
  for (;;) {
    try {
      const fd = openSync(lockPath, "wx");
      closeSync(fd);
      return lockPath;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        // Unexpected FS error — fail closed rather than proceed unlocked.
        throw new Error(
          `spend gate could not acquire ledger lock ${lockPath}: ${String(err)}`,
        );
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `spend gate could not acquire ledger lock ${lockPath} within ` +
            `${LOCK_TIMEOUT_MS}ms (held by a concurrent checkSpend); ` +
            `refusing to proceed unlocked (fail closed)`,
        );
      }
      sleepSyncMs(backoff);
      backoff = Math.min(backoff * 2, 100);
    }
  }
}

/** Release a previously-acquired ledger lock. Safe if the file is already gone. */
export function releaseLedgerLock(lockPath: string): void {
  try {
    unlinkSync(lockPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
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
  // Validate the amount BEFORE taking the lock — a bad amount throws (fail
  // closed) without ever holding the lock or touching the ledger.
  const amountCents = dollarsToCents(req.amount);
  const month = monthOf(now);
  const date = dateOf(now);
  const requestedBy = req.requestedBy ?? "fabric";

  // Serialize the entire read-sum -> decide -> append critical section so two
  // overlapping calls can never both read the same prior sum and both pass.
  // Failure to acquire the lock throws (FAIL CLOSED) — no spend is permitted.
  const lockPath = acquireLedgerLock(paths.ledgerPath);
  try {
    const ceilingCents = loadCeilingCents(paths.ceilingPath);
    const entries: LedgerEntry[] = readLedger(paths.ledgerPath);

    // The cumulative sum — the ONLY input to the decision besides the amount.
    const priorMonthTotalCents = monthAllowedTotalCents(entries, month);
    const projectedMonthTotalCents = priorMonthTotalCents + amountCents;

    // The entire decision. No per-item branch exists.
    const status: "allowed" | "refused" =
      projectedMonthTotalCents <= ceilingCents ? "allowed" : "refused";

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
  } finally {
    releaseLedgerLock(lockPath);
  }
}
