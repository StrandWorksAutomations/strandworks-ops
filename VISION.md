# VISION — Strandworks Dashboard (repo: strandworks-ops)

> Status: BLESSED 2026-07-12 (owner token received in dictation session).
> Owner: Jonathan Bouren. Only the owner changes this document; re-blessing is
> the only change path. Agents read, never write, never reinterpret.
> Dictated 2026-07-12. Governs this repo under AI Governance Kit v1.0.1;
> PORTFOLIO.md (one directory above ~/work repos) wins any conflict.

## What the Strandworks Dashboard is

An **owner-only, 24/7 web cockpit** for the entire venture, living at a
Strandworks address (target: `dashboard.strandautomationworks.com`, riding
the existing Vercel account — no new services). One user: Jonathan, from any
device, phone first. It is the seat of government made portable.

Not a window — a **cockpit**. Three powers, in the owner's priority order:

1. **Launch and command AI work sessions.** Start AI terminals on Strandworks
   machines from the web, communicate with them from the phone, and see
   their live status. The owner can open, direct, and close work from
   anywhere.
2. **Decide.** A pending-decisions queue rendered as owner-token buttons —
   APPROVE / REVISE / PARK / BLESSED / HALT / CLEAR. A decision tapped on
   the phone is recorded exactly like one typed in a session: logged,
   attributed, committed.
3. **See.** Always-current views of the company registers: workflows,
   subscriptions and spend, services, assets, access (key *locations*,
   never keys), model lanes, sprints and branches, business dates and
   deadlines, documents.

## Data truth

The git registers in this repo remain the **single source of truth**. The
dashboard renders them and writes through them — a decision or update made
in the cockpit becomes a commit in this repo, so the audit trail and the
UI can never disagree. No second database of record.

## Security floor (vision-level, non-negotiable)

- Owner-only strong authentication on everything, always.
- The terminal-launch power is the crown jewels: it is reachable only
  behind the owner's private network layer or equally strong protection —
  the exact mechanism is SPEC's to choose, but "open on the internet with
  a password" does not meet the floor.
- Register content rules apply on every screen: credentials, keys, full
  card or account numbers NEVER appear — last-4 only, locations of keys
  rather than keys.

## Non-goals

- **No second user, no public face.** Not for investors, partners, or
  clients — a presentable company view would be a separate product needing
  its own vision. Adding any other user requires a re-bless.
- **Never a credentials store or viewer.** The register rules are absolute.
- **Not a canon side-channel.** Conversation with launched work sessions is
  never directive; canon still changes only through the rituals with owner
  tokens. The token buttons ARE the rituals' owner step, not a bypass.
- **Agents never press the buttons.** Owner tokens come only from the
  authenticated owner; no automation approves, blesses, or halts on his
  behalf.
- **24/7 means the cockpit is always reachable** — it does not require
  every machine to run 24/7. Session launch targets whichever machines are
  online, and says so honestly when one isn't.

## Change policy

Only Jonathan changes this vision. Plain-English paraphrases never count as
approval; the owner tokens are BLESSED / APPROVE / REVISE / PARK / HALT /
CLEAR. A SPEC change with no intake-log entry is, by definition,
contamination.
