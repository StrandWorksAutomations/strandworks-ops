# Pure Review — WS-E expanded dashboard (cockpit-wse-vaio, 6fd78db → bf8744b → ccf6065)
Date: 2026-07-13. Two reviewers + two delta re-reviews; independent 105/105, tsc + next build clean.
- Reviewer A (advocate): ALIGNED 5/5 — additive to cockpit; per-project
  footprint/status/spend all read from git registers (single source of truth),
  nothing invented, blanks honest; /spend only SURFACES the ledger, gate stays
  sole enforcer; no new DB.
- Reviewer B (adversarial, secrets/auth): FLAGS — auth/scope/traversal clean,
  spend non-enforcing; found the security floor was CONVENTION not code
  (per-project views rendered access/subscriptions cells verbatim; a secret in
  a cell would leak) and the safety test was cosmetic.
- REVISE 1 (bf8744b): added a render-time redactor — but delta review found it
  BOTH leaky (dot/slash cards, short keys, split tokens) AND over-masking
  (destroyed commit SHAs/UUIDs the dashboard must show). Orchestrator ruling:
  the universal free-text secret regex is the wrong approach.
- REVISE 2 (ccf6065): render-time reduced to DISPLAY HYGIENE — structural
  digit-run→last-4 (separator-agnostic for space/dash/dot/slash/paren) +
  known-key-prefix masking; entropy/hex/keyish-wholesale over-maskers deleted.
  The REAL secret-floor guarantee moved to a proposed source-side register
  scanner (inbox 2026-07-13-register-secret-scanner.md, non-directive) —
  achievable because the register set is finite/owner-controlled. 105/105.
- Final delta: FLAGS (2 LOW) — over-masking GONE (SHAs/UUIDs/env/price/date/
  plan/path/URL/last-4 all render in full); number truncation robust for the
  mandated separators. Lows: (1) UUID "never touched" comment over-claims vs a
  UUID with a long digit sub-run; (2) underscore/comma/tab separators evade
  truncation. No real risk (registers verified clean; this is defense-in-depth,
  not the guarantee).
Orchestrator ruling: merge. Carry-overs (bundle with the source-scanner slice):
widen truncation separator class (_ , tab/whitespace); correct the UUID
comment; the register-content scanner is the real secret-floor guarantee and
the next dashboard slice. Also carry: models.csv/access.csv could gain a
`project` column for precise per-project attribution.
