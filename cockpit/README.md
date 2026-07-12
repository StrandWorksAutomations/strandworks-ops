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
  API. Without a token configured the app runs in **dry-run mode** and
  applies the move to the local checkout instead.

## Env vars (all optional in local dev)

| var | purpose |
|---|---|
| `SESSION_SECRET` | HMAC key for session/challenge cookies. REQUIRED in prod (≥16 chars). |
| `OWNER_PASSKEY` | base64url JSON of the enrolled credential (public key). Prod only; dev uses `data/owner-passkey.json`. |
| `GITHUB_TOKEN` | fine-grained token, THIS repo only, contents read/write. Never committed, logged, or rendered. Absent → dry-run. |
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

First visit: open `/setup`, enroll a passkey (works only while no credential
exists), then use `/login`. With no `GITHUB_TOKEN`, rulings run in dry-run
mode against the local checkout — inspect the moved file, then `git checkout`
to undo.

## Owner steps after review (NOT done by agents)

1. Create the fine-grained GitHub token (this repo only, Contents: R/W);
   record its LOCATION in `registers/access.csv` — never the token.
2. Create the Vercel project (root directory `cockpit/`), set env vars
   (`SESSION_SECRET`, `GITHUB_TOKEN`, `OWNER_PASSKEY`, `COCKPIT_RP_ID`,
   `COCKPIT_ORIGIN`), point `dashboard.strandautomationworks.com` at it.
3. Enroll the phone passkey: run the app locally once with the prod
   `COCKPIT_RP_ID`? No — simplest supported path: enroll locally (dev RP),
   then re-run `/setup` ONCE on the deployed domain before setting
   `OWNER_PASSKEY` (the enroll route self-disables after a credential
   exists). Copy the `envValue` it prints into `OWNER_PASSKEY` and redeploy.

## Known limits (honest)

- Passkey `counter` is not persisted across logins (no DB); clone-detection
  via signature counters is therefore not enforced. Most platform
  authenticators (iCloud Keychain) always report 0 anyway.
- One credential = one passkey. iCloud Keychain syncs it across the owner's
  Apple devices, which covers the phone+Mac case; enrolling a second
  independent credential would need a small store extension.
- On the deployed domain, between `/setup` being available and the owner
  enrolling, anyone who found the URL could enroll first. Mitigation:
  enrollment is part of the owner's deploy checklist (do it immediately),
  and the route hard-disables once `OWNER_PASSKEY` is set.
- Decision list pages use `force-dynamic` + GitHub API; heavy traffic could
  hit rate limits — irrelevant at one user.
