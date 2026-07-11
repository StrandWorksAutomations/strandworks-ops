<!-- TEMPLATE: PORTFOLIO.md — venture-level canon for multi-repo ventures.
     Lives ONE DIRECTORY ABOVE the project repos. Blessed like a VISION.
     Holds ONLY what spans repos. If it applies to one project, it belongs in
     that project's VISION instead. -->
---
blessed: {{DATE}}
owner: {{OWNER_NAME}}
locked: true
projects:
  - {{REPO_1}} — {{one-line role in the venture}}
  - {{REPO_2}} — {{one-line role in the venture}}
---

# PORTFOLIO — {{VENTURE_NAME}}

> Conflict order: PORTFOLIO > project VISION > SPEC > everything else.
> Project VISIONs may REFERENCE gates defined here; they never restate them.
> (Restatement is how one repo says "day-180" while another says "week 2.")
> On contradiction, agents obey this file for immediate decisions AND file a
> Conflict Report for the owner.

## Venture vision
{{2-3 sentences: what the whole venture is, in the owner's words}}

## Cross-project gates
<!-- Every gate that involves more than one repo lives HERE and only here. -->
| Gate | Condition | Unlocks | Defined |
|---|---|---|---|
| {{GATE_NAME}} | {{measurable condition}} | {{what becomes allowed}} | {{DATE}} |

## IP boundaries
<!-- What belongs to whom. Which repos/ideas are owner IP vs. third-party surface.
     Dev agents in any project treat these as hard walls. -->
- {{BOUNDARY_1}}

## Audience rules
- `owner/` directories in any project: dev agents never read them.
- {{ANY_VENTURE_SPECIFIC_RULES}}

## Bless log
| Date | Event | Read-back acknowledged |
|---|---|---|
| {{DATE}} | Initial bless | yes |
