---
id: 2026-07-13-ws-d-glm-data-governance
filed: 2026-07-13
filed-by: orchestrator (SPEC WS-D — GLM-on-Shadow coder tier)
question: Which repos may a hosted GLM coder see? (code + context leave the machine to Z.ai, a China-based vendor)
ruling: PENDING
---

**Context:** using GLM-5.2 as a coder means repo code and task context are sent
to Z.ai's hosted API on every model turn. The WS-D research spike flagged this
as needing an explicit owner ruling per repo scope — some repos may be fine,
others not (e.g. anything with medical data pipelines, client work, or
credentials-adjacent tooling). Registers/canon never contain secrets by rule,
but source code itself is the asset being shared. This ruling gates which
work-orders the dispatch loop may route to the GLM occupant; everything else
stays on the current coder.

**Options:**
- **A — Open-source-safe only:** GLM may see repos that are (or could be)
  public — generators, tooling, experiments. Flagship + client-facing +
  business repos stay off GLM.
- **B — Everything except named exclusions:** GLM may see all repos except an
  owner-named exclusion list (name them in REVISE).
- **C — PARK:** no GLM data ruling now; WS-D provisioning waits on this even
  if a plan tier is approved.

Reply A / B / C (or REVISE with your own rule).
