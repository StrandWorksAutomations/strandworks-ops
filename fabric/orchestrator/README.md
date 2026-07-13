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
2. Checks out the work-order's branch (creating it from `main` if new).
3. Invokes the **coder** occupant (from config) with the work-order as its prompt.
4. Invokes the **reviewer** occupant with the branch diff + canon pointers
   (PORTFOLIO → VISION → SPEC), and parses one mechanical verdict line:
   `VERDICT: ALIGNED` or `VERDICT: FLAGS` + findings.
5. On `FLAGS`: feeds the findings back to the coder and re-reviews, bounded by
   `maxReviseCycles` (config, default 3). Exhausted → file a decision card in
   `_governance/decisions/`, exit 3, **never merge.**
6. On `ALIGNED`: merge the branch into `main` **locally** (`--no-ff`, no push —
   pushing/deploying stays a human-or-higher step), exit 0.
7. Appends a JSONL audit line per step to `runs/<date>-<slug>.jsonl` (timestamps,
   role, exact command argv, exit code, verdict). No secrets are ever logged;
   run logs are local and gitignored (they must not enter a feature-branch diff
   or dirty the tree across the merge's branch switch).

## How to run

```
node fabric/orchestrator/dispatch.ts <work-order.md> [--dry-run]
     [--repo-root <dir>] [--config <file>] [--runs <dir>]
     [--decisions <dir>] [--branch <name>]
```

`--dry-run` prints the exact commands (occupant argv, with placeholders
substituted) without executing anything. Exit codes: `0` merged, `3`
flags-exhausted (card filed), `2` HALTED refusal, `1` usage/error.

A work-order declares its branch with a `branch:` line or `**Branch:** <name>`
(or pass `--branch`).

### Config (`config.json`)

Role occupants are data. Each role has a `provider` label and a `command` argv
template; the loop substitutes `{REPO} {BRANCH} {BASE} {PROMPT_FILE} {DIFF_FILE}`
and pipes the prompt on stdin. Current occupants: orchestrator/reviewer/coder =
the Anthropic Claude CLI (`claude -p …`). The GLM coder slot (WS-D) is documented,
disabled, under `alternates.coder`. **No secrets in this file** — credentials
live outside the repo; the access register records only where they live.

## How to test

```
node --test "fabric/orchestrator/dispatch.test.ts"
```

Zero dependencies — TypeScript runs directly under Node's native type stripping,
no build step, exactly like `fabric/spend-gate`. Coverage: verdict parsing
(ALIGNED / FLAGS / malformed / ambiguous → fail closed), HALTED refusal, the
revise bound + decision-card filing on exhaustion, no-merge-on-flags, coder-crash
fail-closed, config-driven command construction, the adversarial **no-vendor-string**
grep of the loop source, dry-run shape, audit-log append, and a regression lock
for the in-repo run-log branch-switch bug. Filesystem tests use temp git repos;
they never touch the real `_governance/decisions` or `runs/`.
