---
name: audit
description: Weekly contamination audit — inventory and classify every instruction-bearing doc, build the contradiction matrix, propose (never execute) a quarantine list. Use when the owner asks for an audit or the SessionStart nag says one is overdue.
---

Execute the ritual at `_governance/rituals/audit.md` exactly as written — version
check first, then inventory, classify, contradiction matrix, integrity checks,
report to `_governance/reports/audit-YYYY-MM-DD.md`.

Claude Code notes:
- If the repo has a `HALTED` marker: stop and tell the owner. Do not audit.
- You may parallelize inventory with Explore subagents, but classification
  reasons and quotes must be verified in the primary session.
- The proposed quarantine list is a proposal. Do not run /cleanse yourself.
