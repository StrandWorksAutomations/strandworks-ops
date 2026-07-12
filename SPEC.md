---
version: 1.0.0
derived-from: VISION.md blessed 2026-07-12
---

# SPEC — Strandworks Dashboard (cockpit)

> A change to this file is valid ONLY if referenced in `_governance/intake-log.md`.
> A SPEC change with no intake-log entry is, by definition, contamination — flag it.
> Where any referenced document conflicts with this SPEC, this SPEC wins
> (VISION.md and PORTFOLIO.md win over this SPEC).

## Changelog
| Version | Date | Intake-log ref | Summary |
|---|---|---|---|
| 1.0.0 | 2026-07-12 | #1 | Initial translation of blessed VISION: two delivery slices — See+Decide first, Launch behind the security floor |

## Delivery slices (owner-approved order)

**Slice 1 — See + Decide.** Ships first: the cockpit is useful the day auth
works. **Slice 2 — Launch.** The terminal power, gated on the security floor
being demonstrably met. SPEC changes between slices go through Intake.

## Current scope — ACTIVE workstreams

### Slice 1
1. **App shell.** Next.js application in `cockpit/` in this repo, deployed on
   the existing Vercel account at `dashboard.strandautomationworks.com`.
   Phone-first layout. No new paid services.
2. **Auth.** Passkey (WebAuthn) for a single owner identity — Face ID /
   fingerprint from the phone. No passwords, no third-party identity
   provider, no self-registration; enrollment of the owner's devices is an
   owner-performed setup step. Every route authenticated; short-lived
   sessions.
3. **See — register views.** Render the registers and reports of this repo
   (subscriptions, services, assets, access *locations*, models, calendar,
   DASHBOARD.md, decision sheets, per-repo governance reports), refreshed
   automatically on every push (webhook/ISR). Git is the only data store;
   the app holds no database of record.
4. **Decide — the decisions queue.** Pending decisions live in
   `_governance/decisions/` as one file per decision (id, date filed,
   filed-by, question, context links, options). The cockpit renders each as
   a card with the owner-token buttons (APPROVE / REVISE / PARK / BLESSED /
   HALT / CLEAR). A tap commits the ruling into the decision file (ruling,
   timestamp, `source: cockpit`) — agents obey rulings from this queue
   exactly like typed tokens. Decided files move to
   `_governance/decisions/resolved/`.
5. **Write path.** One fine-grained GitHub token scoped to ONLY this repo,
   held in Vercel env vars. The access register records where it lives —
   never the token. All cockpit writes are commits; no other write channel.

### Slice 2
6. **Launch — AI work sessions.** A session broker on a designated
   always-on machine (target: Shadow VM once launched; VAIO until then)
   that can start, list, attach, and stop AI terminal sessions. Web
   terminals are served ONLY inside the owner's tailnet (Tailscale) — never
   on the public internet. The public cockpit shows live session status and
   deep-links into tailnet-served terminals; without the owner's Tailscale
   identity, terminals are unreachable at the network layer. Phone
   communication with sessions happens through those tailnet terminals.

## Security floor (from VISION — engineering restatement)
- Terminal access: tailnet-only. "Password on the open internet" fails the
  floor by definition. The Vercel-hosted cockpit never proxies terminal
  input/output through public infrastructure.
- No credentials, keys, or full card/account numbers rendered on any
  screen or stored in the app; register content rules apply everywhere.
- The GitHub write token is the app's only secret; scoped to this repo,
  rotatable, its location (not value) recorded in the access register.

## PARKED (unpark = owner intake only)
- Any additional cockpit function not listed above (documents viewer,
  trend charts, inbox dictation, workflow boards, …) — owner adds via
  Intake as v1.x when wanted.

## Non-goals (engineering)
- No second user, no public/investor view (VISION non-goal — wall).
- No database of record besides this git repo.
- No automation that presses token buttons; the queue API accepts rulings
  only from the authenticated owner session.
- No new top-level planning documents — plans go through Intake or
  `_governance/inbox/`.

## Acceptance criteria
- **Slice 1:** owner opens `dashboard.strandautomationworks.com` on his
  phone, authenticates via passkey, sees register data current within one
  minute of the latest push, taps a token on a queued decision, and the
  ruling lands as a commit attributed `source: cockpit` — with zero secrets
  rendered anywhere in the app.
- **Slice 2:** owner launches an AI session from his phone, exchanges
  messages with it in a tailnet-served terminal, and closes it — while a
  device outside the tailnet can reach nothing but the status view.
