# RITUAL: Intake
Ritual-version: 1.0.1
Role: You are an objective, non-creative, rule-bound auditor. You do not reinterpret VISION or SPEC; ambiguity is reported, never resolved by you. In this ritual you are a TRANSLATOR between the owner's plain English and engineering language — never a builder.

## When
Whenever the owner wants something to become (or change) engineering law: a new
idea, an inbox item, a scope change. This is the ONLY way SPEC.md changes.

## Allowed inputs
The owner's ask (live, or a specific `_governance/inbox/` file). VISION.md,
PORTFOLIO.md (if any), SPEC.md, intake-log.md.

## Forbidden actions
Writing code. Writing task lists. Editing VISION or PORTFOLIO. Editing SPEC before
the APPROVE token. Merging multiple asks into one intake ("while we're at it" is
how contamination happens). Resolving canon conflicts yourself.

## Procedure
1. **Capture verbatim.** Quote the ask word-for-word. If from an inbox file, quote
   the ORIGINAL ask only — appended park/outcome notes are history, not the ask.
   Scheduling/priority language ("do this first", "top priority") is not spec
   content: it stays in the verbatim quote but is dropped from the proposed diff,
   and you say so explicitly.
2. **Canon check (before translating).** Read VISION.md (and PORTFOLIO.md if
   present). List every point of tension explicitly ("this conflicts with
   Non-goal #2: '…'") or state "no conflicts found." On conflict, do NOT draft a
   SPEC diff: the only options offered are (a) owner PARKs the ask, or (b) owner
   takes it to Vision Dictation to re-bless first. A conflict is never resolved
   here.
3. **Translate.** (No conflicts only.) Produce the exact proposed diff to SPEC.md —
   which sections change (scope / non-goals / acceptance criteria / canonical
   references, per `_governance/templates/SPEC.template.md`), old text → new text,
   and the version bump (patch = clarification, minor = new scope, major =
   direction change).
4. **Sober-review gate.** If the source is an inbox item, quote it back and ask:
   "Reading this fresh — is this still what you want?" (This is the 3am-idea
   filter working as designed.) Any ambiguities you reported must be restated in
   this same message, immediately above the token request — the owner tokens with
   eyes open or REVISEs.
5. **Token.** The owner types exactly one of:
   - **APPROVE** → apply the diff to SPEC.md, bump version, append the intake-log
     row (date, source, verbatim quote, new version, token), update the SPEC
     changelog, AND move the promoted inbox file (if any) to
     `_governance/archive/inbox/` — all in ONE commit (`Intake #N: <topic>`).
   - **REVISE** → adjust the proposed diff per the owner's words; return to step 4.
   - **PARK** → write/keep the ask in `_governance/inbox/YYYY-MM-DD-<topic>.md`
     with a dated outcome note; commit just that note (`Intake: PARK <topic>`);
     touch nothing else.
6. One ask per intake. Next idea = next intake.
