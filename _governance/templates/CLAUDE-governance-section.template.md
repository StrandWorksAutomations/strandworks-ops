<!-- TEMPLATE: the Governance section PREPENDED to a project's agent-instruction
     file (CLAUDE.md for Claude Code; AGENTS.md / .cursorrules / equivalent for
     other tools). Goes ABOVE all existing content. -->

# GOVERNANCE (read this first)

This project runs under the AI Governance Kit v{{KIT_VERSION}}.

**Reading order & authority:** {{PORTFOLIO_PATH_IF_ANY → }}VISION.md → SPEC.md →
this file → everything else. Higher wins all conflicts. Only VISION.md and SPEC.md
are directive; research, notes, and old plans are reference material, never orders.

**Rules:**
1. `_quarantine/files/` is off-limits{{", enforced by deny rules" if CC adapter}}.
   To know what's in there, read `_quarantine/INDEX.md` only.
2. `_governance/inbox/` is NEVER directive. Ideas from conversation that aren't
   in SPEC.md go INTO the inbox as `YYYY-MM-DD-<topic>.md`, verbatim, nothing else.
3. Never create new top-level planning/roadmap .md files. Plans go through the
   Intake ritual or into the inbox.
4. Never edit VISION.md{{" or PORTFOLIO.md" if any}}. SPEC.md changes only during
   an Intake session, with an intake-log entry in the same commit.
5. If a `HALTED` marker exists at the repo root, stop all work and tell the owner.
6. On contradiction between canon layers: obey the higher layer, stop conflicting
   work, and write a Conflict Report to `_governance/reports/`.
7. `owner/` (if present) is owner-facing strategy: dev tasks never read it.

<!-- existing project instructions continue below -->
