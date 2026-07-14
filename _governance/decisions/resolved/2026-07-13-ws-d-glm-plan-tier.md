---
id: 2026-07-13-ws-d-glm-plan-tier
filed: 2026-07-13
filed-by: orchestrator (SPEC WS-D — GLM-on-Shadow coder tier)
question: Purchase a GLM Coding Plan subscription for the standing coder, and at which tier?
ruling: CLEAR
ruled: 2026-07-14T23:22:24.056Z
source: cockpit
---

**Context:** the WS-D research spike (`_governance/inbox/2026-07-12-glm-coder-research.md`)
found that self-hosting GLM-5.2 on Shadow is infeasible (744B MoE needs ~372GB+
VRAM vs Shadow's 16–20GB). The realistic shape is coordinator-pattern: Shadow
runs the harness; model turns go to the hosted z.ai API. Metered per-token API
is ceiling-risky (~$480/mo estimated for a constant coder); the flat Coding
Plan bounds spend. This is an external purchase, so it requires an owner token
regardless of the spend gate (Autonomy Floor #2). WS-A/WS-C are merged — the
dispatch loop's coder slot (`fabric/orchestrator/config.json` →
`alternates.coder`) is ready to accept the GLM occupant once provisioned.

**Options:**
- **A — Pro, $72/mo** (~400 prompts/5h). More headroom under the $200 ceiling;
  may throttle a saturating always-on coder.
- **B — Max, $160/mo** (~1,600 prompts/5h). Fits under the ceiling with ~$40
  headroom; fixed cost regardless of throughput.
- **C — PARK.** No purchase now; coder slot stays Claude; WS-D waits.

Note: intro 30% promo was observed (Pro ~$50.40 / Max ~$112); prices are
July-2026 figures, re-verify at purchase. Purchase itself is an owner act or
an owner-token-authorized agent act.

Reply A / B / C (or REVISE with your own rule).
