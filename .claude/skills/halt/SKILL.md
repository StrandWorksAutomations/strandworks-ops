---
name: halt
description: Emergency brake — freeze all work NOW. Snapshots uncommitted changes to a halt/ branch, dumps session state to _quarantine/sessions/, drops a HALTED marker that blocks every ritual until the owner clears it. Use the moment the owner says stop.
---

Execute the ritual at `_governance/rituals/halt.md` exactly as written, immediately,
before any discussion:

1. Stop/abandon all in-flight work and subagents.
2. `git checkout -b halt/YYYY-MM-DD-HHMM && git add -A && git commit -m "HALT snapshot"`,
   then return to the prior branch.
3. Write `_quarantine/sessions/YYYY-MM-DD-HHMM.md` — what was being attempted,
   under which instructions, what changed, the owner's words. Facts only.
4. Create `HALTED` at repo root (timestamp + halt branch name); commit marker + dump.
5. Tell the owner: halt branch, dump path, one-line state. Then do nothing.

Clearing HALTED requires the owner to type **CLEAR** (exact token — paraphrases
don't count), after being shown the halt branch + dump path. Never suggest
clearing proactively in the same session that was halted.
