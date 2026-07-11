---
name: vision-update
description: The only sanctioned way to create or change VISION.md — owner dictation interview, implications read-back, BLESSED token, atomic lock cycle. Use when the owner wants to state or change the project vision.
---

Execute the ritual at `_governance/rituals/vision-dictation.md` exactly as written.
The words are the owner's; you are scribe and interviewer only.

Claude Code lock cycle (re-bless of an existing VISION.md):
1. After (and only after) the owner types **BLESSED**:
2. Remove the two VISION deny lines from `.claude/settings.json`
3. Write VISION.md (new bless date + bless-log row)
4. Restore the deny lines exactly
5. Commit settings.json + VISION.md + any dictation draft in ONE commit:
   `Bless: VISION.md (<date>)`
A VISION.md change in git history not shaped like this single-commit cycle is
contamination — the weekly /audit flags it.

Initial bless (no VISION.md yet): write the file, then add the deny lines to
`.claude/settings.json`, same single-commit rule.
