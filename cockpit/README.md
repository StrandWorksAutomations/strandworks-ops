# Strandworks Cockpit — Slice 1 (See + Decide)

Owner-only, phone-first web cockpit for this repo, per SPEC v1.0.0.
Git is the only data store; every cockpit write is a commit.

## What it does

- **Auth** — WebAuthn passkey, single owner identity. No passwords, no
  third-party IdP, no database: the credential's PUBLIC key lives in the
  `OWNER_PASSKEY` env var (or a gitignored local file in dev); sessions are
  stateless HMAC-signed cookies, 1-hour TTL. Every route is gated by
  middleware; only `/login`, `/setup`, and `/api/auth/*` are reachable
  without a session.
- **See** — `registers/*.csv` as mobile card views, `DASHBOARD.md` and
  `_governance/reports/*.md` rendered (HTML in markdown is escaped). Pages
  are ISR'd with `revalidate: 60`; in production the data source is the
  GitHub contents API, so views are current within a minute of any push.
- **Decide** — pending files in `_governance/decisions/` as cards with the
  six owner-token buttons (APPROVE / REVISE / PARK / BLESSED / HALT /
  CLEAR). A tap (plus an explicit confirm) writes `ruling`, `ruled`,
  `source: cockpit` into the file and moves it to
  `_governance/decisions/resolved/` — as ONE commit via the GitHub trees
  API, direct to `main` (owner-confirmed intent: the commit IS the audit
  trail). Outside production, with no token configured, the app runs in
  **dry-run mode** and applies the move to the local checkout instead.
  Production never runs dry-run: a ruling without `GITHUB_TOKEN` refuses
  with a clear error.

## Env vars (all optional in local dev)

| var | purpose |
|---|---|
| `SESSION_SECRET` | HMAC key for session/challenge cookies. REQUIRED in ANY production run (≥16 chars), regardless of platform — production hard-fails without it, no fallback. |
| `SETUP_CODE` | one-time enrollment code. `/setup` requires it in addition to "no credential exists"; unset → enrollment disabled. Set it just before enrolling, remove it right after. |
| `OWNER_PASSKEY` | base64url JSON of the enrolled credential (public key). Prod only; dev uses `data/owner-passkey.json`. |
| `GITHUB_TOKEN` | fine-grained token, THIS repo only, contents read/write. Never committed, logged, or rendered. Absent → dry-run in dev; in production, rulings REFUSE without it. |
| `COCKPIT_RP_ID` / `COCKPIT_ORIGIN` | WebAuthn relying party (prod: `dashboard.strandautomationworks.com` / its https URL). Dev defaults: `localhost` / `http://localhost:3111`. |
| `COCKPIT_REPO` | `owner/repo` (default `StrandWorksAutomations/strandworks-ops`). |
| `COCKPIT_BRANCH` / `COCKPIT_WRITE_BRANCH` | read/write branch (default `main`). |
| `COCKPIT_DATA_BACKEND` | force `fs` or `github` (default: `github` on Vercel, `fs` locally). |
| `COCKPIT_WRITE_MODE` | force `dry-run` or `github` (default: `github` iff `GITHUB_TOKEN` set). |
| `COCKPIT_REPO_ROOT` | fs-backend repo root override (default: parent of `cockpit/`). |

## Local dev

```
cd cockpit
npm install
npm run dev        # http://localhost:3111
npm test           # parser/writer + register renderer tests
npm run typecheck
npm run build
```

First visit: start dev with a setup code (`SETUP_CODE=pick-something npm run
dev`), open `/setup`, enter the code and enroll a passkey (works only while
no credential exists), then use `/login`. With no `GITHUB_TOKEN`, dev rulings
run in dry-run mode against the local checkout — inspect the moved file, then
`git checkout` to undo. (Dry-run is dev-only; production refuses rulings
without the token.)

## Owner steps after review (NOT done by agents)

1. Create the fine-grained GitHub token (this repo only, Contents: R/W);
   record its LOCATION in `registers/access.csv` — never the token.
2. Create the Vercel project (root directory `cockpit/`), set env vars
   (`SESSION_SECRET`, `GITHUB_TOKEN`, `COCKPIT_RP_ID`, `COCKPIT_ORIGIN`),
   point `dashboard.strandautomationworks.com` at it. `SESSION_SECRET` and
   `GITHUB_TOKEN` are hard requirements in production: the app refuses to
   serve sessions / commit rulings without them.
3. Enroll the phone passkey on the deployed domain: set `SETUP_CODE` to a
   fresh random value and redeploy, visit `/setup` ONCE, enter the code and
   enroll (the route requires the code AND self-disables after a credential
   exists). Copy the `envValue` it prints into `OWNER_PASSKEY`, REMOVE
   `SETUP_CODE`, and redeploy.

## Known limits (honest — owner-ruled 2026-07-12)

- Passkey `counter` is not persisted across logins (no DB); clone-detection
  via signature counters is therefore not enforced. Most platform
  authenticators (iCloud Keychain) always report 0 anyway. **Owner ACCEPTED**
  as a documented limit of the no-database design.
- One credential = one passkey; recovery from a lost credential = clear
  `OWNER_PASSKEY`, set a fresh `SETUP_CODE`, re-enroll. iCloud Keychain syncs
  the passkey across the owner's Apple devices, which covers the phone+Mac
  case. **Owner ACCEPTED** as a documented limit of the no-database design.
- Rulings commit direct to `main`. **Owner CONFIRMED intended** — the commit
  is the audit trail.
- Decision list pages use `force-dynamic` + GitHub API; heavy traffic could
  hit rate limits — irrelevant at one user.

(The former "anyone who finds the URL can enroll first" limit is fixed:
enrollment now requires the one-time `SETUP_CODE`, and the save is an
exclusive-create write, so concurrent enrollments cannot both pass.)
