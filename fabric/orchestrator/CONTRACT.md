# fabric/orchestrator — the Orchestrator Role Contract (SPEC WS-A)

The orchestrator is a **role**, not a vendor. This document specifies that role
as an interface any capable top-tier LLM can fill. The occupant of the seat is
recorded only in `config.json`; nothing in this contract, in the dispatch loop
(`dispatch.ts` and its modules), or in any prompt names a vendor. Swapping the
occupant — because access is restricted, or a better model appears — is a
`config.json` edit, not an architectural change. (Factual note, per SPEC WS-A:
Fable 5 is the current occupant. That fact lives here as prose and in
`config.json` as data; it is never hard-coded into the loop.)

This contract governs Layer 1 of `strandworks-ops` (the Orchestration Fabric)
under VISION.md, which is itself under PORTFOLIO.md. Where they conflict, the
higher layer wins: **PORTFOLIO.md → VISION.md → SPEC.md → this contract.**

---

## 1. Inputs (what the role-holder reads)

The occupant reads, never rewrites, all of the following. Authority descends in
this order; a lower layer never overrides a higher one.

1. **Canon, in authority order:**
   - `~/work/PORTFOLIO.md` — company canon; wins all conflicts.
   - `VISION.md` — this repo's blessed vision (Orchestration Fabric + Cockpit).
   - `SPEC.md` — the engineering law derived from VISION; changes only via the
     Intake skill with an `_governance/intake-log.md` entry.
2. **The registers** (`registers/`) — the single source of truth for spend,
   subscriptions, services, assets, access *locations* (never keys), models,
   and per-project footprint. The orchestrator reads these; it never reasons
   about spend by eye (see §6).
3. **Per-project state:**
   - **git** — branches, diffs, last-touched, merge state, the `HALTED` marker.
   - **Linear** — team `Strandautomationworks` (`STR`); the project-status
     tracker of record. Issues, milestones, status.

The occupant holds the macro view: the grand company vision, every project's
vision, and cross-project state. It plans and reviews at that level and parses
work out to the sub-agent layer (§3).

## 2. Outputs (what the role-holder produces)

1. **Dispatch decisions** — which sub-agent layer a unit of work goes to, on
   which branch, under what acceptance criteria (the work-order).
2. **Review verdicts** — the mechanical `VERDICT: ALIGNED` / `VERDICT: FLAGS`
   line the dispatch loop parses (§5). The orchestrator commissions the review;
   the reviewer occupant emits the verdict.
3. **Pre-sprint alerts / decision cards** — written into
   `_governance/decisions/` as one file per decision, same card conventions as
   the spend gate's over-ceiling cards (frontmatter `id / filed / filed-by /
   question / ruling: PENDING`, then context + owner-token options). These are
   the only way the fabric asks the owner for something.
4. **Ledger reads** — the orchestrator reads the committed spend total **through
   the WS-B spend gate** (`fabric/spend-gate`). It performs **no per-item spend
   judgment of its own**; all spend questions are answered by the gate's
   mechanical cumulative sum (§6).

## 3. The sub-agent layer map

The orchestrator delegates to six standing layers. Each is a role slot in
`config.json`; each is filled by capability-matched delegation.

| Layer | Handles |
|---|---|
| **research** | fact-finding, spikes, source-gathering, unknowns |
| **code** | implementation on a branch (the standing coder tier) |
| **front-end** | UI / client surfaces |
| **back-end** | services, data, infra management |
| **content** | social / content / copy |
| **business** | numbers, LLC/ops, register upkeep |

**Capability-matched delegation — the hero axis.** Work that a human or a
client will see or touch ("hero" work) goes to the most capable available
occupant, or is *framed by a lighter occupant and polished by a higher one*.
Internal, reversible plumbing may use a lighter occupant. The axis is a
property of the *work*, set per item; it is not tied to any vendor's name.

## 4. The dispatch + monitor loop

For every unit of work the role runs the same proven loop that shipped 9
sprints on 2026-07-12:

```
spawn coder on a branch  →  adversarial review  →  revise (bounded)  →  merge
```

- **Spawn.** The CODER occupant is invoked with the work-order as its prompt,
  on the work-order's branch.
- **Adversarial review.** The REVIEWER occupant is invoked with the branch diff
  and pointers to canon (PORTFOLIO → VISION → SPEC) and must emit a machine-
  parseable verdict line.
- **Revise.** On `FLAGS`, the findings are fed back to the coder, bounded by
  `maxReviseCycles` (config, default 3). Exhausting the budget stops the loop,
  files a decision card, and exits non-zero. **The branch is never merged on
  exhausted revisions.**
- **Merge.** On `ALIGNED`, the branch is merged into `main` **locally only**.
  Pushing and deploying are out of the loop — they stay a human-or-higher step
  (Autonomy Floor #2).

### The review gate is NON-OPTIONAL — for every coder, identically
There is no code path that merges without a passing review. The gate applies to
**every** coder occupant the same way — Claude, GLM, or any successor — because
the review gate is the thing that makes autonomous output trustworthy (VISION:
"The review gate is never traded for speed"). A missing or malformed verdict is
**fail-closed**: treated as `FLAGS`, never as a pass.

## 5. Failover (the occupant is config, never contract)

- The role-holder is named **only in `config.json`**. This contract, the loop
  code, and every generated prompt are vendor-neutral by construction.
- Swapping occupants = editing `config.json` (a provider label + an argv command
  template). No module changes, no contract change.
- One top-tier ("Max/Pro/Ultra") seat is sufficient for the orchestrator +
  reviewer roles; the coder slot is a standing tier that can be a different
  (lighter, constantly-running) occupant — WS-D fills it with GLM 5.2, documented
  as the `alternates.coder` shape in `config.json`.
- An adversarial invariant is regression-locked in the tests: the loop source
  (`*.ts`, excluding tests) contains **no vendor string**. Occupants come only
  from config.

## 6. Hard limits — the Autonomy Floor (restated, never crossed on its own)

Even at full autonomy inside blessed scope, three things ALWAYS require an owner
token from the authenticated owner. The orchestrator never presses the owner's
buttons and never self-approves past this floor.

1. **Spend above the ceiling — mechanical, never judgment.** The orchestrator
   does not assess "is this under budget?" It routes every proposed charge
   through `fabric/spend-gate`, which reads the committed month-to-date total
   from the ledger, adds the proposed charge, and compares the **cumulative
   sum** against the ceiling. Over the line → the gate refuses and files an
   owner card. Per-item "this one's cheap" reasoning is structurally impossible.
2. **Anything the outside world sees or that bills externally** — production
   deploys, client-facing surfaces, social/content publishing, outbound email,
   purchases. The loop merges locally and stops; it never pushes or deploys.
3. **Any canon change** — PORTFOLIO / VISION / SPEC. Only the owner, only via
   the sanctioned skills (vision-update / intake), only with an owner token.

Owner tokens are BLESSED / APPROVE / REVISE / PARK / HALT / CLEAR, and come only
from the authenticated owner (a typed token or a cockpit button tap). No plain-
English paraphrase is approval. If the `HALTED` marker exists at repo root, the
loop refuses to run at all (fail closed).
