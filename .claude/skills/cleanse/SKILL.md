---
name: cleanse
description: Quarantine residue files per an owner-approved audit list — git mv into _quarantine/files/, write INDEX.md manifest entries, sweep references, single reviewable commit. Never deletes. Use only after the owner approves an audit's proposed quarantine list.
---

Execute the ritual at `_governance/rituals/cleanse.md` exactly as written.

Hard gates before any action:
1. `git status --short` must be empty — refuse otherwise.
2. No `HALTED` marker.
3. The owner must have explicitly approved the specific list of files (point to
   the audit report and their approval in this conversation). A list you compiled
   yourself this session does not qualify.

Never delete. Never edit content while moving. End by showing the owner
`git show --stat HEAD` and wait for their word before merging.
