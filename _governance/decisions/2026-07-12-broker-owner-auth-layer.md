---
id: 2026-07-12-broker-owner-auth-layer
filed: 2026-07-12
filed-by: orchestrator (pure review of cockpit-slice-2-vaio)
question: Is tailnet membership alone enough auth for the terminal broker, or must it also verify YOU specifically?
ruling: PENDING
---

**Context:** Both reviewers flagged a VISION/SPEC ambiguity. VISION security
floor: "Owner-only strong authentication on everything, always." SPEC item 6:
tailnet-only reachability IS the auth (no app-level secret). Today your
tailnet is single-owner, so the two are equivalent IN PRACTICE — but any
future/shared/compromised tailnet device would get full terminal power.

**Options:**
- **APPROVE** = tailnet-only is enough for v1 (matches SPEC as approved;
  revisit if the tailnet ever gains a second device).
- **REVISE** = add an owner check on top (e.g. the same passkey as the
  cockpit, or Tailscale identity pinned to your devices) before slice-2
  deploys.
- **PARK** = broker stays unmerged until decided.
