---
id: 2026-07-17-billing-repo-create
filed: 2026-07-17
filed-by: orchestrator (medical-repos governance fan-out)
question: The billing app has no repo — create one (and under what name), or does it live elsewhere?
ruling: APPROVE
ruled: 2026-07-23T16:58:25.524Z
source: cockpit
---

**Context:** The goal named `sw-billing-solutions` as a medical-side repo to
make ready. No repo exists on GitHub under `sw-billing-solutions`,
`sw-billing-integrations`, or `tenetrix-insight` (SSH-probed 2026-07-17).
PORTFOLIO calls it "SW Billing Integrations (working title)". So there is
nothing to govern yet — the repo must be created (an external, owner-gated
action) or pointed to under its real name.

**Options:**
- **CREATE as `sw-billing-integrations`** (matches PORTFOLIO working title) —
  orchestrator creates the empty repo + installs governance + audits.
- **CREATE as `sw-billing-solutions`** (matches the goal wording).
- **EXISTS elsewhere** — reply with the real repo name and it gets governed.
- **PARK** — not ready to create yet.
