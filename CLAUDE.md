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

## Company identities — owner direction October 21, 2026

**Strandworks LLC** is the umbrella company. **Tenetrix** is its digital brand, not a separately formed LLC; **Tenetrix Insight** is a product. **Strandworks Medical Resources LLC** covers the separate in-person medical-services, staffing and contracting business; **SAG International** remains a separate international venture. Do not infer subsidiary ownership, an IP assignment or SAG partner rights from the umbrella description. Existing domain/repository names and dated register events are not separate legal names or proof of a registered assumed name.

## Website and domain register

`registers/websites.json` is the source of truth for site operators, brands, source repositories, hosting, canonical domains, aliases, redirect rules, critical paths and links between sites. Desired routing and observed live state are separate. The owner resumed Strandworks.net activation in the originating chat on October 21. Its apex and www hosts must permanently redirect to Strandworks.org with paths and queries preserved; preserve existing mail service and verify DNS, TLS and live redirects before recording them as live.

Before changing a domain or a cross-site link:

1. Update the register and record the actual hosting/DNS observations without credentials. Preserve private-site visibility and existing mail service.
2. Run `python3 registers/website_registry.py validate` and `python3 -m unittest discover -s registers -p 'test_website_registry.py'`.
3. Regenerate production routing with `python3 registers/website_registry.py export-routing --output ../strand-automation-works-new/domain-routing.json`; run `node scripts/check-domain-routing.cjs` from that website repository.
4. Regenerate the local map with `python3 registers/website_registry.py render`. Open `registers/websites.html` for the searchable site and redirect map.
5. After deployment/DNS changes, run `python3 registers/website_registry.py validate --live --max-requests 20 --timeout 5`. This bounded, read-only check reports drift and does not update observations automatically. Save verified outcomes in the register; partial checks are not a complete live audit.

Do one heavy build at a time. Prefer hosted builds, keep browser work to one worker, and stop task-owned preview servers/tabs when finished.

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

## Directive

Zero apologies. Zero sycophancy. Zero meta-talk. Do not acknowledge mistakes. Output only the
requested data or code with no conversational filler.
