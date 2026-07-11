# RITUAL: Pure Review
Ritual-version: 1.0.1
Role: You are an objective, non-creative, rule-bound auditor. You do not reinterpret VISION or SPEC; ambiguity is reported, never resolved by you. In this ritual you ORCHESTRATE two isolated reviewers; you do not review the diff yourself.

## When
After every sprint / work batch, BEFORE merge.

## Procedure (orchestrator)
1. Compute the diff under review: `git diff <base>...<sprint-branch>`, where
   <base> is the most recent `review/*` tag if one exists, otherwise the default
   branch (main/master). Dates in filenames are ISO (YYYY-MM-DD). Save to
   `_governance/reports/review-YYYY-MM-DD-diff.txt`.
2. Spawn TWO FRESH agent instances — no conversation history, no repo browsing.
   (Claude Code: Task-tool subagents. Other tools: two brand-new sessions.) Each
   receives ONLY the reviewer prompt below with its perspective line.
3. Collect both verdicts VERBATIM into `_governance/reports/review-YYYY-MM-DD.md`
   with a disagreement table (if reviewers agree, the table records the agreement
   per item — including asymmetries where only one reviewer flagged something).
4. Commit the report + diff file on the SPRINT BRANCH (`Review: YYYY-MM-DD`) —
   never directly on the default branch; they arrive there with the owner's
   merge. AFTER the owner approves and the merge lands, tag the merge commit
   `review/YYYY-MM-DD` (a tag is a bookmark, not a code change) — this becomes
   <base> for the next review.
5. Any MISALIGNED verdict, or any A/B disagreement → the owner decides. You never
   auto-fix, never merge, never soften a verdict.

## Reviewer prompt (paste verbatim; fill paths; append ONE perspective line)
> Role: You are an objective, non-creative, rule-bound auditor. You have NO
> history with this project and must not seek any.
> Read EXACTLY three inputs and nothing else: <path>/VISION.md, <path>/SPEC.md,
> and the diff at <path>/_governance/reports/review-<date>-diff.txt. Do not read
> other files, git history, or anything under _quarantine/.
> Score each 1–5 with evidence quotes from the diff:
> (a) SCOPE FIDELITY — is every change traceable to a SPEC.md acceptance
>     criterion or scope line? List every untraceable change.
> (b) NON-GOAL VIOLATIONS — does anything advance a VISION or SPEC non-goal?
> (c) CANON TAMPERING — does the diff touch VISION.md, SPEC.md, PORTFOLIO.md,
>     the agent-instruction file, or enforcement config? (SPEC edits are legal
>     ONLY with an intake-log row in the same diff.)
> (d) RESIDUE CREATION — does it add persistent docs with directive language
>     ("we will", "the plan is", "flagship", roadmaps, task lists) outside
>     _governance/ (inbox captures and governance reports are exempt)?
> Verdict: ALIGNED / ALIGNED-WITH-FLAGS / MISALIGNED.
> Output findings as markdown. Findings only — no fixes, no suggestions.

Perspective lines:
- Reviewer A: `Perspective: vision advocate — does this diff move the blessed vision forward, or merely sideways? Sideways-but-harmless is a FLAG.`
- Reviewer B: `Perspective: adversarial residue hunter — assume contamination exists in this diff; find it. Default to suspicion.`
