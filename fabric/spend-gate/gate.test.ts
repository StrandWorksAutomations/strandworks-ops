// gate.test.ts — run with:  node --test fabric/spend-gate/
//
// These tests exercise the gate against throwaway temp files so the real
// registers/autonomous-spend.csv is never touched.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkSpend, monthOf } from "./gate.ts";
import type { SpendGatePaths } from "./gate.ts";
import { readLedger, monthAllowedTotalCents } from "./ledger.ts";
import { dollarsToCents, centsToDollarString } from "./money.ts";
import * as gateModule from "./gate.ts";
import * as indexModule from "./index.ts";

function sandbox(ceilingUsd = 200): SpendGatePaths {
  const dir = mkdtempSync(join(tmpdir(), "spend-gate-"));
  const ceilingPath = join(dir, "ceiling.json");
  writeFileSync(ceilingPath, JSON.stringify({ ceiling_usd: ceilingUsd }));
  return {
    ledgerPath: join(dir, "autonomous-spend.csv"),
    ceilingPath,
    decisionsDir: join(dir, "decisions"),
  };
}

const AUG = new Date(Date.UTC(2026, 7, 15)); // 2026-08-15
const SEP = new Date(Date.UTC(2026, 8, 3));  // 2026-09-03

// --- money helpers ---

test("dollarsToCents avoids float drift", () => {
  assert.equal(dollarsToCents(0.1 + 0.2), 30); // classic 0.30000000000000004
  assert.equal(dollarsToCents(70), 7000);
  assert.equal(dollarsToCents("90.00"), 9000);
  assert.equal(dollarsToCents(199.99), 19999);
});

test("centsToDollarString formats fixed 2dp", () => {
  assert.equal(centsToDollarString(20000), "200.00");
  assert.equal(centsToDollarString(19999), "199.99");
  assert.equal(centsToDollarString(5), "0.05");
  assert.equal(centsToDollarString(0), "0.00");
});

test("dollarsToCents rejects negative and non-finite", () => {
  assert.throws(() => dollarsToCents(-1));
  assert.throws(() => dollarsToCents("nope"));
});

// --- sum logic ---

test("monthAllowedTotalCents sums only ALLOWED rows of the month", () => {
  const p = sandbox();
  checkSpend({ amount: 50, project: "x", purpose: "a" }, p, AUG); // allowed
  checkSpend({ amount: 30, project: "x", purpose: "b" }, p, AUG); // allowed
  const entries = readLedger(p.ledgerPath);
  assert.equal(monthAllowedTotalCents(entries, monthOf(AUG)), 8000);
});

test("refused rows never count toward the sum", () => {
  const p = sandbox(100);
  checkSpend({ amount: 80, project: "x", purpose: "a" }, p, AUG);  // allowed -> 80
  const r = checkSpend({ amount: 40, project: "x", purpose: "b" }, p, AUG); // 120 > 100 refused
  assert.equal(r.status, "refused");
  const entries = readLedger(p.ledgerPath);
  // Sum stays at 80 because the refused 40 was never spent.
  assert.equal(monthAllowedTotalCents(entries, monthOf(AUG)), 8000);
  // A later small charge that fits still passes on the 80 base.
  const r2 = checkSpend({ amount: 20, project: "x", purpose: "c" }, p, AUG); // 100 == ceiling
  assert.equal(r2.status, "allowed");
});

// --- ceiling boundary ---

test("exactly at ceiling is ALLOWED", () => {
  const p = sandbox(200);
  const r = checkSpend({ amount: 200, project: "x", purpose: "exact" }, p, AUG);
  assert.equal(r.status, "allowed");
  assert.equal(r.projectedMonthTotalCents, 20000);
  assert.equal(r.ceilingCents, 20000);
});

test("one cent over the ceiling is REFUSED", () => {
  const p = sandbox(200);
  const r = checkSpend({ amount: 200.01, project: "x", purpose: "over" }, p, AUG);
  assert.equal(r.status, "refused");
  assert.equal(r.projectedMonthTotalCents, 20001);
});

test("boundary reached cumulatively: last cent allowed, next cent refused", () => {
  const p = sandbox(200);
  assert.equal(checkSpend({ amount: 199.99, project: "x", purpose: "a" }, p, AUG).status, "allowed");
  assert.equal(checkSpend({ amount: 0.01, project: "x", purpose: "b" }, p, AUG).status, "allowed"); // hits 200.00 exactly
  assert.equal(checkSpend({ amount: 0.01, project: "x", purpose: "c" }, p, AUG).status, "refused"); // 200.01
});

// --- month rollover ---

test("only the current month's allowed charges count", () => {
  const p = sandbox(200);
  // August spends 150.
  checkSpend({ amount: 150, project: "x", purpose: "aug" }, p, AUG);
  // September starts fresh: a 150 charge is fine again despite August's 150.
  const r = checkSpend({ amount: 150, project: "x", purpose: "sep" }, p, SEP);
  assert.equal(r.status, "allowed");
  assert.equal(r.priorMonthTotalCents, 0);
  const entries = readLedger(p.ledgerPath);
  assert.equal(monthAllowedTotalCents(entries, monthOf(AUG)), 15000);
  assert.equal(monthAllowedTotalCents(entries, monthOf(SEP)), 15000);
});

// --- config-driven ceiling ---

test("ceiling is read from config, not hardcoded", () => {
  const p = sandbox(50); // custom low ceiling
  assert.equal(checkSpend({ amount: 50, project: "x", purpose: "a" }, p, AUG).status, "allowed");
  assert.equal(checkSpend({ amount: 0.01, project: "x", purpose: "b" }, p, AUG).status, "refused");
});

test("raising the ceiling in config lets a previously-refused charge pass", () => {
  const p = sandbox(100);
  assert.equal(checkSpend({ amount: 120, project: "x", purpose: "a" }, p, AUG).status, "refused");
  // Owner raises the ceiling (edits ceiling.json), then re-runs.
  writeFileSync(p.ceilingPath, JSON.stringify({ ceiling_usd: 200 }));
  assert.equal(checkSpend({ amount: 120, project: "x", purpose: "a2" }, p, AUG).status, "allowed");
});

// --- every attempt logged ---

test("every attempt is logged, allowed and refused", () => {
  const p = sandbox(100);
  checkSpend({ amount: 60, project: "x", purpose: "a" }, p, AUG); // allowed
  checkSpend({ amount: 60, project: "x", purpose: "b" }, p, AUG); // refused (120)
  const entries = readLedger(p.ledgerPath);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].status, "allowed");
  assert.equal(entries[1].status, "refused");
  assert.equal(entries[1].amount_usd, "60.00");
});

// --- decision card on refusal ---

test("refusal files exactly one owner decision card naming the numbers", () => {
  const p = sandbox(100);
  checkSpend({ amount: 80, project: "3rdrider", purpose: "render burst" }, p, AUG);
  const r = checkSpend({ amount: 40, project: "3rdrider", purpose: "extra render" }, p, AUG);
  assert.equal(r.status, "refused");
  assert.ok(r.decisionCardPath && existsSync(r.decisionCardPath));
  const files = readdirSync(p.decisionsDir);
  assert.equal(files.length, 1);
  assert.match(files[0], /^2026-08-15-spend-over-ceiling-/);
  const card = readFileSync(r.decisionCardPath, "utf8");
  assert.match(card, /40\.00/);      // the amount
  assert.match(card, /80\.00/);      // month-to-date so far
  assert.match(card, /100\.00/);     // ceiling
  assert.match(card, /render burst|extra render/); // purpose
  assert.match(card, /APPROVE/);
  assert.match(card, /ruling: PENDING/);
});

test("an allowed charge files NO decision card", () => {
  const p = sandbox(200);
  const r = checkSpend({ amount: 50, project: "x", purpose: "ok" }, p, AUG);
  assert.equal(r.status, "allowed");
  assert.ok(!r.decisionCardPath);
  assert.ok(!existsSync(p.decisionsDir) || readdirSync(p.decisionsDir).length === 0);
});

// ============================================================================
// THE ADVERSARIAL ACCEPTANCE TEST
// ============================================================================

test("ADVERSARIAL: individually-cheap charges that cumulatively cross the ceiling are BLOCKED at the crossing charge", () => {
  const p = sandbox(200);
  // $70, then $90, then $60. Each alone < $200. Sum 70+90 = 160 (ok);
  // +60 = 220 > 200 (must block).
  const r1 = checkSpend({ amount: 70, project: "fabric", purpose: "cheap-1" }, p, AUG);
  const r2 = checkSpend({ amount: 90, project: "fabric", purpose: "cheap-2" }, p, AUG);
  const r3 = checkSpend({ amount: 60, project: "fabric", purpose: "cheap-3" }, p, AUG);

  assert.equal(r1.status, "allowed", "first $70 must be allowed");
  assert.equal(r2.status, "allowed", "second $90 must be allowed (running 160)");
  assert.equal(r3.status, "refused", "third $60 must be REFUSED (running would be 220)");

  // The crossing charge saw the full running sum, not itself in isolation.
  assert.equal(r3.priorMonthTotalCents, 16000);
  assert.equal(r3.projectedMonthTotalCents, 22000);
  assert.equal(r3.ceilingCents, 20000);

  // The blocked charge did NOT add to the spendable total.
  const entries = readLedger(p.ledgerPath);
  assert.equal(monthAllowedTotalCents(entries, monthOf(AUG)), 16000);

  // And it filed an owner alert.
  assert.ok(r3.decisionCardPath && existsSync(r3.decisionCardPath));
});

test("ADVERSARIAL: no exported function accepts a single amount and returns allowed without the running sum", () => {
  // Structural guard. checkSpend's signature requires project + purpose and
  // internally always reads the ledger sum; there is no exported per-item
  // predicate. Assert the public surface contains no such bypass.
  const surface = { ...gateModule, ...indexModule };
  const fnNames = Object.keys(surface).filter(
    (k) => typeof (surface as Record<string, unknown>)[k] === "function",
  );

  // Names that would smell like a single-amount "is this cheap?" bypass.
  const forbidden = /^(isunder|isallowed|allow|approve|isaffordable|ischeap|checkamount|checkcharge|withinbudget)/i;
  for (const name of fnNames) {
    assert.ok(
      !forbidden.test(name),
      `unexpected per-item predicate on public surface: ${name}`,
    );
  }

  // The only decision entry point is checkSpend, and it CANNOT be called with
  // just an amount — project and purpose are required and it always consults
  // the ledger. Prove the ledger is consulted: two identical amounts give
  // different verdicts purely because the running sum differs.
  const p = sandbox(100);
  const first = checkSpend({ amount: 60, project: "x", purpose: "a" }, p, AUG);
  const second = checkSpend({ amount: 60, project: "x", purpose: "b" }, p, AUG);
  assert.equal(first.status, "allowed");
  assert.equal(second.status, "refused");
  assert.notEqual(
    first.status,
    second.status,
    "same amount must yield different verdicts based on the running sum — proving no per-item shortcut",
  );
});
