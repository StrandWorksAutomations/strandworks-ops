# fabric/orchestrator — config-driven dispatch loop (SPEC WS-A slice 1)

The orchestrator that runs the build loop for the Orchestration Fabric. It drives
the proven pattern that shipped 9 sprints on 2026-07-12:

```
spawn coder on a branch → adversarial review → revise (bounded) → merge
```

## The one invariant

**The review gate is never skippable, and the occupant is config, not code.**

- Every branch passes an adversarial review before it can merge. A missing or
  malformed verdict is fail-closed to `FLAGS` — never a pass. When the revise
  budget is exhausted the loop files an owner decision card and exits non-zero
  **without merging.**
- The LLM filling each role (orchestrator / coder / reviewer / the six layers)
  is named ONLY in `config.json`. Swapping a vendor is a config edit — no change
  to the loop, the contract, or any prompt. A test greps the loop source for
  vendor strings and requires it clean.

See `CONTRACT.md` for the full role interface (inputs, outputs, sub-agent map,
failover, and the Autonomy Floor).

## What it does

Given a work-order markdown file (goal, scope, branch, acceptance):

1. **Refuses to run if a `HALTED` marker exists at repo root** (fail closed, exit 2).
2. **Resolves the pre-sprint oversight gate (WS-C, see below) before creating
   any branch** — silence on hero work HOLDS; HALT refuses; HIGH checkpoints.
4. Checks out the work-order's branch (creating it from `main` if new).
5. Invokes the **coder** occupant (from config) with the work-order as its prompt.
6. Invokes the **reviewer** occupant with the branch diff + canon pointers
   (PORTFOLIO → VISION → SPEC), and parses one mechanical verdict line:
   `VERDICT: ALIGNED` or `VERDICT: FLAGS` + findings.
7. On `FLAGS`: feeds the findings back to the coder and re-reviews, bounded by
   `maxReviseCycles` (config, default 3). Exhausted → file a decision card in
   `_governance/decisions/`, exit 3, **never merge.**
8. On `ALIGNED`: merge the branch into `main` **locally** (`--no-ff`, no push —
   pushing/deploying stays a human-or-higher step), exit 0.
9. Appends a JSONL audit line per step to `runs/<date>-<slug>.jsonl` (timestamps,
   role, exact command argv, exit code, verdict). No secrets are ever logged;
   run logs are local and gitignored (they must not enter a feature-branch diff
   or dirty the tree across the merge's branch switch).

### Pre-sprint alerts + oversight levels (WS-C)

Before a sprint runs, the orchestrator files a **pre-sprint alert** as a decision
card (`YYYY-MM-DD-presprint-<slug>.md`): what / why / scope / risk, a mechanical
hero-vs-internal classification, and a proposed oversight level. The owner rules
it; the dispatch loop gates on the ruling.

- **Classification** comes from the work-order's `audience:` field and is
  mechanical: internal only when the field explicitly names a known internal
  value; **missing or unrecognized → HERO** (fail toward more oversight, never
  less). Proposed level: hero → **HIGH**, internal → **LOW**.
- **The invariant: silence on hero work HOLDS.** An un-set alert on hero work
  refuses to start (exit 4, logged). An un-set alert on internal work proceeds at
  its LOW default — that proceed-on-silence event is logged in the audit JSONL
  and noted on the card (documented, owner-overridable).
- **Rulings:** `HIGH` pauses for owner checkpoints (after the coder, after the
  review), exiting 6 each time; resume each stage with `--resume-stage
  after-coder|after-review`. `LOW` runs to completion under the unchanged review
  gate. `HALT` refuses to run (exit 5). The owner sets the level with a direct
  `HIGH`/`LOW`/`HALT` token or the cockpit's existing card buttons (lettered
  options A=HIGH / B=LOW / C=HALT, plus the native HALT token).
- `--file-alert-only` files the alert and exits (so alerts precede sprints in
  time). The cockpit renders these cards through its existing generic decision
  renderer — no cockpit change was needed.

## How to run

```
node fabric/orchestrator/dispatch.ts <work-order.md> [--dry-run]
     [--repo-root <dir>] [--config <file>] [--runs <dir>]
     [--decisions <dir>] [--branch <name>]
     [--file-alert-only] [--resume-stage after-coder|after-review]
```

`--dry-run` prints the exact commands (occupant argv, with placeholders
substituted) without executing anything. Exit codes: `0` merged / dry-run /
alert-filed, `3` flags-exhausted (card filed), `2` HALTED marker refusal,
`4` pre-sprint hold (hero silence / non-level ruling), `5` owner ruled HALT,
`6` checkpoint pause (HIGH — resume to continue), `1` usage/error.

A work-order declares its branch with a `branch:` line or `**Branch:** <name>`
(or pass `--branch`). It may also declare an `audience:` line (`hero` /
`internal`) that drives the WS-C classification; **a missing audience classifies
HERO** (fail toward more oversight).

### Config (`config.json`)

Role occupants are data. Each role has a `provider` label and a `command` argv
template; the loop substitutes `{REPO} {BRANCH} {BASE} {PROMPT_FILE} {DIFF_FILE}`
and pipes the prompt on stdin. Current occupants: orchestrator/reviewer/coder =
the Anthropic Claude CLI (`claude -p …`). The GLM coder slot (WS-D) is documented,
disabled, under `alternates.coder`. **No secrets in this file** — credentials
live outside the repo; the access register records only where they live.

## How to test

```
node --test "fabric/orchestrator/*.test.ts"
```

Zero dependencies — TypeScript runs directly under Node's native type stripping,
no build step, exactly like `fabric/spend-gate`. Coverage: verdict parsing
(ALIGNED / FLAGS / malformed / ambiguous → fail closed), HALTED refusal, the
revise bound + decision-card filing on exhaustion, no-merge-on-flags, coder-crash
fail-closed, config-driven command construction, the adversarial **no-vendor-string**
grep of the loop source, dry-run shape, audit-log append, and a regression lock
for the in-repo run-log branch-switch bug. `presprint.test.ts` covers WS-C:
audience classification (incl. MISSING → HERO), alert-card shape, ruling parsing
(HIGH/LOW/HALT/PENDING + the cockpit APPROVE+answer path), silence handling both
branches (hero → hold, internal → proceed-logged), HALT refusal, and the HIGH
checkpoint pause/resume machine. Filesystem tests use temp git repos; they never
touch the real `_governance/decisions` or `runs/`.
