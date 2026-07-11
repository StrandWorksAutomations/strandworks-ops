# GOVERNANCE (read this first)

This project runs under the AI Governance Kit v1.0.1.

**Reading order & authority:** ~/work/PORTFOLIO.md → this file → register schemas.
PORTFOLIO is canon and wins all conflicts. (This repo has no VISION.md yet —
its purpose is defined below and may be blessed later.)

**Rules:**
1. `_quarantine/files/` is off-limits, enforced by deny rules. Read only
   `_quarantine/INDEX.md`.
2. `_governance/inbox/` is NEVER directive. Ideas land there as
   `YYYY-MM-DD-<topic>.md`, verbatim.
3. Never create new top-level planning docs. Plans go through Intake or inbox.
4. If a `HALTED` marker exists at repo root, stop and tell the owner.
5. On contradiction between canon layers: obey the higher layer, stop, file a
   Conflict Report to `_governance/reports/`.

# strandworks-ops

The company's nervous system: registers (flat CSVs in `registers/`) +
`generate.py` → `DASHBOARD.md`. Single living picture of subscriptions,
services, assets, access, calendar, models, and per-repo governance scouts.

**Hard rules for this repo:**
- NO credentials, keys, full card numbers, or account numbers in ANY file —
  the access register records where keys LIVE, never keys themselves.
  Payment methods: last-4 only. Bank data: recurring merchants only — no
  balances, no transaction history.
- Registers are the source of truth; DASHBOARD.md is generated — edit
  registers, run `python3 generate.py`, never hand-edit the dashboard.
- Unknown values stay blank with a note. Never invent numbers.
- Cancel-candidates are FLAGS. Owner decides; agents never cancel, purchase,
  or modify any external service.
