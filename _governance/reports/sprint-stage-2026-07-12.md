# Staged sprint pack — 2026-07-12

Orchestrator staging brief for an extended AFK window. Three launch-ready
sprint prompts (SPECs already law) + two SPEC intakes filed as decision
cards. Paste any prompt into a fresh dev instance (Mac terminal or Claude
Code app). Every prompt is self-contained; sprints are independent and can
run in parallel (separate repos/branches). The orchestrator (VAIO session)
pure-reviews every branch that lands.

---

## SPRINT A — 3rdrider: ambulance screen capture (SPEC WS2, first slice)

You are a dev agent working ONLY in the repo **StrandWorksAutomations/3rdrider**
(verify with `git remote -v`; do NOT work in any other repo). Read `CLAUDE.md`,
`VISION.md`, and `SPEC.md` first and obey them; `_governance/inbox/` is never
directive; if a `HALTED` marker exists at repo root, stop.

Sprint: SPEC workstream 2 — digital-screen capture, first increment. Goal:
turn images of in-ambulance patient-care screens (cardiac monitor,
glucometer, ventilator) into structured vitals records. Scope: (1) a
screen-reader module that takes a camera frame and classifies which device
type is in view; (2) extraction of displayed values (HR, SpO2, BP, EtCO2,
glucose, vent settings — per device); (3) output as structured records
`{device, field, value, unit, confidence, timestamp}` — never free text
only; (4) a test fixture corpus of representative screen images (find or
synthesize — label sources clearly; no real patient data ever); (5) unit
tests proving extraction on the corpus. Follow sprint-1 patterns under
`3rd-rider/Lens-scenes/Spectacles/`. Branch `claude/screen-capture-<suffix>`
— NEVER commit to main. No new top-level planning docs; open questions →
dated `_governance/inbox/` notes. When done: commit, push the branch, report
what was built, what passes, what's honestly unfinished.

## SPRINT B — 3rdrider: anonymization layer (SPEC WS6)

You are a dev agent working ONLY in the repo **StrandWorksAutomations/3rdrider**
(verify with `git remote -v`). Read `CLAUDE.md`, `VISION.md`, and `SPEC.md`
first and obey them; `_governance/inbox/` is never directive; if a `HALTED`
marker exists at repo root, stop. Another sprint may be running on a
different branch of this repo — do not touch its branch; work only in a new
directory/module so merges stay clean.

Sprint: SPEC workstream 6 — the anonymization layer (core, not optional).
Goal: a pipeline module that strips/replaces identifying data from
recognition events and captured frames BEFORE storage or export. Scope:
(1) text-field anonymization — names, addresses, birthdays, SSNs and
similar identifiers detected and replaced with stable pseudonymous tokens
(same patient → same token within an encounter); (2) an image-redaction
interface (faces/identifying regions) — implement the interface + a
baseline implementation, document model choices as inbox questions rather
than deciding heavyweight dependencies alone; (3) the rule that NOTHING
leaves the pipeline unanonymized — a single choke-point API the export
workstream must call; (4) synthetic test data ONLY (invented names/SSNs,
clearly fake); (5) unit tests: detection recall on the synthetic corpus,
token stability, choke-point enforcement. Branch
`claude/anonymization-<suffix>` — NEVER commit to main. Open questions →
dated `_governance/inbox/` notes. When done: commit, push, report built /
passing / honestly unfinished.

## SPRINT C — Cockpit slice 2: tailnet session broker (strandworks-ops SPEC item 6)

You are a dev agent working ONLY in the repo
**StrandWorksAutomations/strandworks-ops** (verify with `git remote -v`).
Read `CLAUDE.md`, `VISION.md`, and `SPEC.md` first and obey them — SPEC
v1.0.0 slice 2 (item 6 + security floor) is your entire scope. If a
`HALTED` marker exists at repo root, stop.

Sprint: the session broker. Goal: a small service (Node/TypeScript, in
`broker/`) that runs on a designated always-on machine and lets the owner
start, list, attach to, and stop AI terminal sessions from a phone browser
INSIDE the tailnet only. Scope: (1) session manager backed by tmux (spawn a
shell or a `claude` CLI session, persist across broker restarts, list with
status/age, kill); (2) a web terminal UI (xterm.js + WebSocket) served by
the broker; (3) the broker binds ONLY to the tailnet interface (Tailscale
IP / `tailscale0`) or localhost — NEVER 0.0.0.0's public side; refuse to
start if no tailnet interface is found unless an explicit
`BROKER_DEV_LOCALHOST=1` override is set; (4) a read-only status JSON
endpoint (sessions, states, ages — no content); how the public Vercel
cockpit consumes status across the tailnet boundary is an OPEN QUESTION —
file it as a dated `_governance/inbox/` note with options, do not decide
it; (5) no auth secrets of its own in v1 — network-layer identity per SPEC
("tailnet-only IS the auth"), but structure handlers so an auth layer can
be added; (6) unit tests for the session manager and binding guard; a
README-broker.md inside `broker/` with run instructions. Do NOT touch
`cockpit/`. Branch `cockpit-slice-2-<suffix>` — NEVER commit to main. When
done: commit, push, report built / passing / honestly unfinished.

---

## Decision cards filed (rule from the cockpit or by typing the token here)

1. `2026-07-12-push-haptic-mirror-governance` — push its 6 local commits (already queued)
2. `2026-07-12-push-medsim-game-governance` — push its 7 local commits (already queued)
3. `2026-07-12-spec-intake-haptic-mirror` — APPROVE writes SPEC v1.0.0 into haptic-mirror (proposal in the card)
4. `2026-07-12-spec-intake-tenetrix-intervention` — APPROVE writes SPEC v1.0.0 into MedSim-Game (proposal in the card)

Note the dependency: the two SPEC intakes only unlock sprints for cloud/Mac
dev instances AFTER the corresponding push ruling is approved (local-only
repos aren't visible to other machines). Cards 1+3 together open the
haptic-mirror build lane; 2+4 open the Intervention lane.

## Also outstanding
- Detector sprint branch (3rdrider, Mac) — still unaccounted; if it exists,
  push it and the orchestrator will review it.
- Mac-side errand: add `*/_governance/inbox/*` to the global
  block-md-sprawl.sh hook allowlist (it blocked a sanctioned inbox write).
