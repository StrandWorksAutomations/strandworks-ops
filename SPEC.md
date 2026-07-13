---
version: 2.0.0
derived-from: VISION.md re-blessed 2026-07-12 (Orchestration Fabric + Cockpit)
---

# SPEC — Strandworks Dashboard + Orchestration Fabric

> A change to this file is valid ONLY if referenced in `_governance/intake-log.md`.
> A SPEC change with no intake-log entry is, by definition, contamination — flag it.
> Where any referenced document conflicts with this SPEC, this SPEC wins
> (VISION.md and PORTFOLIO.md win over this SPEC).

## Changelog
| Version | Date | Intake-log ref | Summary |
|---|---|---|---|
| 1.0.0 | 2026-07-12 | #1 | Initial translation of blessed VISION: two delivery slices — See+Decide first, Launch behind the security floor |
| 2.0.0 | 2026-07-12 | #2 | Layer-1 Orchestration Fabric added: orchestrator-as-contract, mechanical cumulative spend gate, pre-sprint alerts + oversight levels, GLM-on-Shadow coder tier, expanded dashboard. Slices 1-2 (cockpit) unchanged and already shipped. |

## Layer-1 workstreams — Orchestration Fabric (ACTIVE)

Order reflects dependency: the spend gate (WS-B) and the orchestrator
contract (WS-A) are the safety spine and are built + verified before any
autonomous run is enabled. GLM (WS-D) and the expanded dashboard (WS-E) follow.

**WS-A — Orchestrator contract + sub-agent map.** Specify the orchestrator as
a role interface any top-tier LLM can fill (inputs: all canon + registers +
project state; outputs: dispatch decisions, review verdicts, alerts, ledger
reads), so failover is a config swap, not a rewrite. Define the sub-agent
layers (research / code / front-end / back-end / content / business) and the
dispatch + monitor loop. Fable 5 is the current occupant; the contract names
no vendor. First slice: the contract doc + a runnable dispatch loop driving
the EXISTING proven pattern (spawn sub-agent → adversarial review → revise →
merge) that shipped 9 sprints on 2026-07-12.

**WS-B — Mechanical cumulative spend gate (safety-critical, built first).**
A hard gate, NOT an LLM judgment: reads the committed monthly total from the
registers/ledger, adds the proposed new charge, compares the CUMULATIVE sum
against the ceiling (default $200/mo new autonomous spend, owner-adjustable
case-by-case). Over the line → the action is refused and an owner alert is
filed. Per-item "this one is cheap" evaluation is structurally impossible —
the gate only ever compares sums. Every gated attempt (allowed or refused) is
logged. Acceptance: a scripted sequence of individually-cheap charges that sum
past the ceiling is BLOCKED at the crossing charge, with an adversarial test
proving no per-item path bypasses the sum.

**WS-C — Pre-sprint alerts + oversight levels.** Before a sprint the
orchestrator files a pre-sprint alert (what/why/scope/risk, hero-vs-internal
classification) into the decisions/alerts queue. The cockpit renders it; the
owner sets an oversight level (e.g. HIGH eyes-on / LOW autorun); default
follows the hero axis (human/client-facing → HIGH, internal/reversible → LOW).
The chosen level governs whether that sprint pauses for owner checkpoints or
runs to completion under autonomy. Silence handling: an un-set alert on
human/client-facing work HOLDS; internal/reversible work proceeds at its LOW
default (documented, owner-overridable).

**WS-D — GLM-on-Shadow coder tier.** Provision GLM 5.2 as a standing coder on
the Shadow VM (launch Shadow as the worker tier). Precede provisioning with a
research spike answering the owner's named unknowns (compaction? context-window
clearing? session/workflow shape?) and documenting the sub-agent adapter so
GLM plugs into WS-A's coder slot. The adversarial review gate is applied to
GLM output identically to Claude output — non-negotiable.

**WS-E — Expanded dashboard.** Beyond decision/alert pages: interactive
examples, visual representations, mockups, reports, and live fabric status;
plus per-project footprint tracking (infra: Supabase/Vercel/Namecheap/CGTrader/
RunPod/…; where it lives; asset locations; last-touched; Linear issue link).
Renders from registers (extend the register schema as needed via this SPEC).

## Layer-2 workstreams — Cockpit (shipped 2026-07-12)

Slice 1 (See + Decide) and Slice 2 (tailnet Launch broker) are BUILT and
merged (tags review/2026-07-12-cockpit-slice-1, review/2026-07-12-broker-slice-2).

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
  Intake when wanted.

## Non-goals (engineering)
- No second user, no public/investor view (VISION non-goal — wall).
- No database of record besides this git repo.
- No automation that presses token buttons or self-approves past the Autonomy
  Floor; over-ceiling spend, external/public output, and canon changes require
  an owner token from the authenticated owner session.
- The adversarial review gate is never removed or downgraded for speed — it
  applies to every coder (Claude, GLM, or successor) identically.
- No new top-level planning documents — plans go through Intake or
  `_governance/inbox/`.

## Acceptance criteria
- **Slice 1 (met):** owner opens the cockpit on his phone, authenticates via
  passkey, sees register data current within a minute of the latest push, taps
  a token on a queued decision, and the ruling lands as a commit attributed
  `source: cockpit` — zero secrets rendered.
- **Slice 2 (met):** owner launches an AI session from his phone, exchanges
  messages in a tailnet-served terminal, and closes it — a device outside the
  tailnet reaches nothing but status.
- **WS-B:** a scripted run of individually-cheap charges that cumulatively
  exceed the ceiling is blocked at the crossing charge; an adversarial test
  finds no per-item bypass; every attempt is logged.
- **WS-A + WS-C:** the orchestrator files a pre-sprint alert, the owner sets an
  oversight level from the cockpit, and the fabric honors it — HIGH pauses for
  checkpoints, LOW runs to completion — all under the swappable contract with
  no vendor name in the loop.
