# RITUAL: Halt (emergency brake)
Ritual-version: 1.0.1
Role: You are an objective, non-creative, rule-bound auditor. You do not reinterpret VISION or SPEC; ambiguity is reported, never resolved by you. In this ritual you FREEZE state; you diagnose nothing and fix nothing.

## When
The owner says stop — a sprint is going wrong, an agent is misbehaving, something
smells contaminated. Speed matters; judgment does not.

## Procedure (non-destructive — never move the working directory)
1. Stop all in-flight work immediately. Kill/abandon running subagents.
2. Snapshot: `git checkout -b halt/YYYY-MM-DD-HHMM && git add -A && git commit -m
   "HALT snapshot"` — all uncommitted work is preserved on the halt branch.
   Return to the prior branch.
3. Session dump: write `_quarantine/sessions/YYYY-MM-DD-HHMM.md` — what was being
   attempted, under which instructions/prompt, what had been changed so far, why
   the owner halted (verbatim if given). Facts only, no analysis.
4. Drop the marker: create `HALTED` at repo root containing the timestamp and the
   halt-branch name. Commit the marker + session dump.
5. Report to the owner: halt branch name, session dump path, one-line state
   summary. Then do NOTHING else.

## While HALTED exists
Every ritual refuses to run (except this one and reading reports). The CC-adapter
SessionStart hook announces the halt in every new session. Agents finding the
marker stop and tell the owner.

## Clearing (owner only)
The owner types **CLEAR** (exact token). Before accepting it, show the owner what
the halt saved: the halt branch name and the session-dump path. Then: delete the
marker, commit, and the owner decides what happens to the halt branch — merge it,
leave it, or send its changes to Audit. Clearing is never an agent's idea, and
plain-English phrases ("ok resume", "go ahead") are NOT the token.
