# VISION — Strandworks Dashboard + Orchestration Fabric (repo: strandworks-ops)

> Status: BLESSED 2026-07-12 (re-bless; owner token received in dictation
> session). Supersedes the earlier 2026-07-12 cockpit bless (preserved below
> as "Layer 2").
> Owner: Jonathan Bouren. Only the owner changes this document; re-blessing is
> the only change path. Agents read, never write, never reinterpret.
> Governs this repo under AI Governance Kit v1.0.1; PORTFOLIO.md wins any
> conflict.

## What strandworks-ops is (two layers of one system)

**Layer 1 — the Orchestration Fabric** does the work.
**Layer 2 — the Cockpit** is where the owner verifies and steers it.
The registers are the shared source of truth beneath both.

---

## LAYER 1 — the Orchestration Fabric

A standing, multi-agent system that runs the company's build work. It runs on
the always-on worker VM (Shadow), reads all canon, and dispatches work to
specialized sub-agents.

### The orchestrator is a ROLE, not a vendor (failover is a first-class invariant)
The top-tier orchestrator LLM holds the macro view: the grand company vision,
every project's vision, and all cross-project state. **Fable 5 fills this role
now — but the role is defined as a contract any capable top-tier LLM can step
into.** The company is never hard-coded onto one vendor; if Anthropic access
is restricted, another top-tier model takes the seat with no architectural
change. One top-tier ("Max/Pro/Ultra") seat is sufficient — the orchestrator
plans and reviews at the macro level and parses issues to the right sub.

### The layers beneath
Research, coding, front-end, back-end management, content/social, and
business/numbers. **GLM 5.2 is the standing coder**, running constantly on
Shadow. Delegation is capability-matched: high-skill and especially "hero"
(client-facing) tasks go to the most capable model — or are framed by a
lighter model and polished by a higher one. The orchestrator may spin up the
heavy systems (RunPod, render/asset/model/scene jobs) as work requires,
subject to the Autonomy Floor below.

### Autonomy inside blessed scope
Once a project's VISION and SPEC are locked, the orchestrator dispatches and
monitors sub-agents and runs the build → adversarial-review → revise → merge
loop **without the owner's per-item approval**, provided version control and
branches are managed correctly. The adversarial review gate is NOT optional at
speed — it is the thing that makes autonomous output trustworthy, and it
stands whether the coder is Claude or GLM.

### Graduated oversight (pre-sprint alerts)
Before a sprint begins the owner receives an alert of upcoming work. He opens
it and sets **his oversight level for that item**. Default levels follow the
hero axis: human- or client-facing work defaults HIGH (eyes-on / hands-on
testing); internal, reversible plumbing defaults LOW and simply runs. The
owner can raise or lower any item from its alert.

### The Autonomy Floor (hard limits the fabric never crosses on its own)
Even at full autonomy, three things ALWAYS require an owner token:

1. **Spend above the ceiling — enforced mechanically, never by judgment.**
   The orchestrator does NOT assess "is this under budget?" itself. It reads
   the actual committed monthly total from the registers/ledger, ADDS the
   proposed new spend, and compares the **cumulative sum** against the ceiling.
   Over the line → alert and wait. Per-item "this one's cheap" reasoning is
   forbidden by construction — the failure mode where each charge is judged
   alone and the total silently balloons must be impossible. Ceiling:
   **$200/mo of new autonomous spend** as the default starting point,
   adjustable case-by-case by the owner (existing blessed
   subscriptions are outside this figure — this governs NEW spend the fabric
   incurs on its own).
2. **Anything the outside world sees or that bills externally** — production
   deploys, client-facing surfaces, social/content publishing, outbound
   email, and purchases. Reviewed, always.
3. **Any canon change** — VISION / PORTFOLIO / SPEC. Reviewed, always.

---

## LAYER 2 — the Cockpit (owner-only control + verification surface)

An **owner-only, 24/7 web cockpit** at `dashboard.strandautomationworks.com`
(existing Vercel account). One user: Jonathan, phone first. The seat of
government made portable, and the owner's window into Layer 1.

Powers:

1. **Launch and command AI work sessions.** Start AI terminals on Strandworks
   machines from the web, communicate from the phone, see live status.
2. **Decide.** A pending-decisions queue as owner-token buttons — APPROVE /
   REVISE / PARK / BLESSED / HALT / CLEAR. A tap is recorded exactly like a
   typed token: logged, attributed, committed. This is also where pre-sprint
   alerts land and where oversight levels are set.
3. **See — and richer than today.** Beyond decision pages: interactive
   examples, visual representations, mockups, reports, and live status of the
   fabric's work. Always-current views of the registers: workflows,
   subscriptions and spend (with the cumulative-vs-ceiling picture explicit),
   services, assets, access (key *locations*, never keys), model lanes,
   sprints and branches, business dates, documents.
4. **Track every project's real footprint.** Per project: what infrastructure
   runs it (Supabase, Vercel, Namecheap, CGTrader, RunPod, …), where it lives,
   where its assets are, and when/where it was last touched. Issues via Linear.
   Scope spans the whole business — LLC, assets, content/social, the numbers —
   the full-scope operations picture prior attempts (e.g. media_manager) never
   reached.

## Data truth

The git registers in this repo are the **single source of truth** for both
layers. The dashboard renders them and writes through them; a decision or
update becomes a commit, so the audit trail and the UI can never disagree, and
the spend ledger the Autonomy Floor reads is the same one the owner sees. No
second database of record.

## Security floor (vision-level, non-negotiable)

- Owner-only strong authentication on everything, always.
- The terminal-launch power is the crown jewels: reachable only behind the
  owner's private network layer or equally strong protection — "open on the
  internet with a password" does not meet the floor.
- Register content rules apply on every screen: credentials, keys, full card
  or account numbers NEVER appear — last-4 only, locations of keys not keys.

## Non-goals

- **No second user, no public face.** A presentable outside-facing view is a
  separate product needing its own vision.
- **Never a credentials store or viewer.** Register rules are absolute.
- **Agents never press the owner's buttons, and never self-approve past the
  Autonomy Floor.** Owner tokens come only from the authenticated owner; no
  automation approves, blesses, halts, authorizes over-ceiling spend, ships
  external output, or changes canon on his behalf.
- **The review gate is never traded for speed.** Autonomy accelerates how work
  moves through the gate; it never removes the gate.
- **24/7 means the cockpit and fabric are always reachable/running** — it does
  not require every machine online; work targets whichever are, and says so
  honestly when one isn't.

## Change policy

Only Jonathan changes this vision. Plain-English paraphrases never count as
approval; owner tokens are BLESSED / APPROVE / REVISE / PARK / HALT / CLEAR. A
SPEC change with no intake-log entry is, by definition, contamination.
