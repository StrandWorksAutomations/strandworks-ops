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

```
node --test "fabric/spend-gate/**/*.test.ts"
```

Zero dependencies: TypeScript runs directly under Node 24's native type
stripping — no build step, no `node_modules`. Covers sum logic, ceiling
boundary (exact vs one-cent-over), month rollover, config-driven ceiling,
every-attempt logging, decision-card filing, and the two adversarial tests
(cumulative-crossing block; no per-item bypass on the public surface).
