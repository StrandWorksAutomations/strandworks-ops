---
name: pure-review
description: Post-sprint canon-alignment review by two fresh, history-free reviewers (vision advocate + adversarial residue hunter) reading only VISION, SPEC, and the diff. Run before every merge. Never auto-fixes, never merges.
---

Execute the ritual at `_governance/rituals/pure-review.md` exactly as written.

Claude Code specifics:
- Save the diff to `_governance/reports/review-YYYY-MM-DD-diff.txt` first.
- Spawn the two reviewers as **Task-tool subagents** (subagents receive only their
  prompt — exactly the isolation the ritual requires). Paste the reviewer prompt
  from the ritual verbatim, filling absolute paths, plus each reviewer's
  perspective line.
- Write both verdicts + a disagreement table to
  `_governance/reports/review-YYYY-MM-DD.md`.
- Any MISALIGNED or A/B disagreement → present to the owner and stop. You never
  soften verdicts, never fix findings, never merge.
