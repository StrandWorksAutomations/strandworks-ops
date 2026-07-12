# Pure Review — cockpit slice 1 (branch cockpit-slice-1-fable, commit fd63f84)

Date: 2026-07-12. Two fresh reviewers (zero history), inputs: VISION.md,
SPEC.md, the sprint diff only. Independent verification on a second machine:
20/20 tests pass, `tsc --noEmit` clean.

## Verdicts
- Reviewer A (vision advocate): **FLAGS** — scope fidelity 4/5, zero slice-2
  material, security floor met in code.
- Reviewer B (adversarial residue hunter): **FLAGS** — secrets clean (incl.
  lockfile), canon untouched (38/38 files new), no residue, no second-user
  pathway, no database, token never logged/rendered, traversal blocked.

## Flags requiring change (owner ruled REVISE, 2026-07-12)
1. **Enrollment race:** between deploy and the owner's first `/setup` visit,
   anyone finding the URL can enroll as owner (middleware.ts PUBLIC_PATHS +
   register-options gate is only "no credential yet"). Fix: enrollment
   additionally requires a one-time SETUP_CODE from env. Also close the
   TOCTOU on check-then-save.
2. **Silent dry-run in production:** missing GITHUB_TOKEN degrades rulings
   to a non-commit write channel (rule-writer.ts mode selection), violating
   "all cockpit writes are commits." Fix: production refuses rulings
   without the token; dry-run allowed only outside production.
3. **SESSION_SECRET guard is Vercel-conditional** (session.ts): non-Vercel
   production silently uses a committed dev string → forgeable owner
   cookies. Fix: hard-fail any production start without SESSION_SECRET.

## Resolved without change (owner confirmations, same ruling)
- "Decision sheets" view: they live in `_governance/reports/`, which the
  cockpit renders — SPEC item 3 mandate met.
- Rulings commit direct to main: **CONFIRMED intended** — the commit is the
  audit trail (inbox Q3 answered).
- Signature counter not persisted; single-credential recovery = clear
  OWNER_PASSKEY env + re-enroll: **ACCEPTED** as documented limits of the
  no-database design (inbox Q2/Q4 answered).

## Noted, no action required this sprint
- Rule route relies on middleware alone for auth (single layer); Next.js
  version in lockfile (15.5.20) patches the known middleware-bypass CVE.
- 60s revalidate window makes the "already ruled" 409 non-airtight (single
  owner: harmless).
- Sibling-repo governance reports appear only via DASHBOARD.md rendering —
  candidate for a v1.x intake, not a slice-1 gap.
