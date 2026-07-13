# fabric/spend-gate — mechanical cumulative spend gate (SPEC WS-B)

The hard limit that lets the orchestration fabric spend autonomously without the
"each item looks cheap" failure. This is the safety spine referenced by VISION's
Autonomy Floor #1 and SPEC WS-B.

## The one invariant

It is a **hard computed gate, never an LLM judgment.** The only decision
operation is arithmetic on the ledger:

```
sum(this month's ALLOWED autonomous charges) + amount  <=  ceiling
```

There is no code path that evaluates a single charge in isolation. The
comparison operand is always `(runningMonthSum + amount)`, so the failure mode
where each charge is judged alone and the total silently balloons is impossible
by construction. (`gate.test.ts` proves this: same amount, different verdict,
purely because the running sum differs.)

## What it tracks

`registers/autonomous-spend.csv` — an append-only ledger of NEW spend the fabric
incurs on its own, scoped per calendar month. Columns:
`date, month, amount_usd, project, purpose, status[allowed|refused], requested_by`.

This is **separate** from `registers/subscriptions.csv`. Existing blessed
subscriptions are OUTSIDE the ceiling (VISION); this gate governs only new
autonomous spend. No card/account numbers ever — amounts and purposes only.

## The ceiling

Read from `fabric/spend-gate/ceiling.json` on every run — never hardcoded.
Default **$200.00/mo**. Owner-adjustable case-by-case by editing that file (an
owner act). All money math is done in integer cents to avoid float rounding at
the boundary (exactly at ceiling = allowed; one cent over = refused).

## On refusal

The charge is NOT spent, it is logged as `refused`, and an owner alert is filed
as a decision card in `_governance/decisions/`
(`YYYY-MM-DD-spend-over-ceiling-<slug>.md`, options APPROVE / REVISE / PARK) so
the owner sees it in the cockpit queue. Every attempt (allowed or refused) is
logged.

## Concurrency & fail-closed guarantees

- **Serialized decisions.** The read-sum → decide → append critical section is
  guarded by an exclusive lockfile (`<ledger>.lock`, created with
  `openSync(..., "wx")`) with bounded retry/backoff. Two overlapping charges
  that individually fit but jointly exceed the ceiling can never both pass —
  exactly one wins. If the lock cannot be acquired within the timeout the gate
  **fails closed** (throws / refuses; never allows). A stale lock left by a
  crashed process therefore refuses spend (the safe direction) until removed.
- **Fail closed on every error.** A corrupt/missing/negative/non-finite ceiling,
  an unreadable ledger, a bad header, an invalid `status` row, or a
  NaN/negative/non-finite/non-numeric amount all make the gate THROW and the CLI
  exit non-zero — never `0`/allowed, and never recording an `allowed` charge.
  This is regression-locked by tests.
- **CSV integrity.** Newlines and other control characters are rejected in
  ledger fields on WRITE, so a rogue newline can never wedge the append-only
  ledger. Ordinary commas and quotes round-trip via RFC-4180 quoting.

## Library API

```ts
import { checkSpend, defaultPaths } from "./fabric/spend-gate/index.ts";

const paths = defaultPaths(repoRoot); // ledger + ceiling + decisions dir
const res = checkSpend(
  { amount: 60, project: "3rdrider", purpose: "RunPod render burst", requestedBy: "orchestrator" },
  paths,
);
// res.status === "allowed" | "refused"; res carries the running-sum numbers
// and, on refusal, the filed decision-card id/path.
```

`checkSpend` requires `project` and `purpose` and always consults the ledger —
there is intentionally no single-amount "is this cheap?" entry point to import.

## CLI

```
node fabric/spend-gate/cli.ts check --amount 60 --project 3rdrider \
     --purpose "RunPod render burst" [--requested-by orchestrator] [--json]
node fabric/spend-gate/cli.ts status [--json]
```

Exit codes: `0` allowed, `3` refused (over ceiling), `1` usage/error — so a
shell orchestrator can branch on the outcome. Paths default to the repo root
inferred from the CLI's location; override with `--repo-root` or the individual
`--ledger` / `--ceiling` / `--decisions` flags.

## Tests

Point `node --test` at the test FILE (or a glob of files), not the bare
directory — Node 24 tries to *execute* a bare directory as a module and fails:

```
node --test fabric/spend-gate/gate.test.ts
# or, to match every test file:
node --test "fabric/spend-gate/**/*.test.ts"
```

Zero dependencies: TypeScript runs directly under Node 24's native type
stripping — no build step, no `node_modules`. Covers sum logic, ceiling
boundary (exact vs one-cent-over), month rollover, config-driven ceiling,
every-attempt logging, decision-card filing, the two adversarial tests
(cumulative-crossing block; no per-item bypass on the public surface), the
**fail-closed regression lock** (every corrupt ceiling/ledger/amount path throws
and exits non-zero, never allowing spend), the **concurrent-write race** (two
overlapping charges that jointly exceed the ceiling — exactly one is allowed via
an exclusive lockfile; lock-acquisition failure fails closed), and **CSV
control-character integrity** (commas/quotes round-trip; newline/CR/tab in a
field is rejected on write).
