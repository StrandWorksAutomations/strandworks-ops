---
name: drift-check
description: Daily governance drift check — canon modified without authorization, enforcement tampering, inbox masquerade, stray planning docs. Weekly variant adds the full audit, quarantine integrity, inbox aging, log rotation. Report-only.
---

Execute the ritual at `_governance/rituals/drift-check.md` exactly as written.
Daily by default; run the weekly additions if the last `audit-*.md` report is
older than 7 days.

Claude Code specifics:
- Tamper check is `git diff HEAD -- .claude/settings.json` — any divergence is a
  FLAG, including "helpful" additions.
- Report to `_governance/reports/drift-YYYY-MM-DD.md`. FLAGs are proposals for the
  owner; fix nothing.
- Log rotation (weekly, intake-log >500 lines) is the single permitted mechanical
  action, in its own commit.
- If a `HALTED` marker exists: report that and stop.
