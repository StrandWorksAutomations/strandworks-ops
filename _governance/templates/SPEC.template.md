<!-- TEMPLATE: SPEC.md — the engineering translation of VISION.md.
     Changes ONLY via the Intake ritual. Every change gets an intake-log entry. -->
---
version: 1.0.0
derived-from: VISION.md blessed {{DATE}}
---

# SPEC — {{PROJECT_NAME}}

> A change to this file is valid ONLY if referenced in `_governance/intake-log.md`.
> A SPEC change with no intake-log entry is, by definition, contamination — flag it.

## Changelog
| Version | Date | Intake-log ref | Summary |
|---|---|---|---|
| 1.0.0 | {{DATE}} | #1 | Initial translation of blessed VISION |

## Current scope
<!-- Per workstream: what is ACTIVE, what is PARKED (with the gate that unparks it).
     Parked means parked: no purchases, no SDKs, no schemas, no "preparatory" work. -->
{{WORKSTREAM_1}}: ACTIVE — {{one-line definition}}
{{WORKSTREAM_2}}: PARKED — unparks only when {{GATE, by reference not restatement}}

## Non-goals (engineering)
<!-- Mirrors VISION Non-goals, plus engineering-specific exclusions
     (e.g. "no new persistent planning docs outside _governance/"). -->
- {{ENGINEERING_NON_GOAL_1}}

## Acceptance criteria — active workstreams
<!-- Testable statements. A sprint diff is ALIGNED only if every change traces
     to one of these. -->
- {{CRITERION_1}}
- {{CRITERION_2}}

## Canonical references
<!-- Reference material the SPEC points at. Pointers confer READ authority only:
     if a referenced doc disagrees with this SPEC, this SPEC wins. -->
- {{PATH}} — {{what it's authoritative about}}
