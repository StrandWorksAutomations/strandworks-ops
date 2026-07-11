<!-- TEMPLATE: _governance/intake-log.md — append-only record of every approved
     SPEC change. This file is the proof layer: a SPEC edit not referenced here
     is contamination. Never edit past rows. Rotation: when this file exceeds
     ~500 lines, the weekly Drift Check archives it to
     _governance/archive/logs/intake-log-{{RANGE}}.md leaving a stub pointer
     plus the last 10 entries. -->

# Intake log — {{PROJECT_NAME}}

Append-only. Every row = one Intake session that ended in APPROVE.
PARKed and REVISEd asks do not get rows; they live in the inbox.

| # | Date | Source (inbox file or "live") | Owner's ask (verbatim quote) | SPEC version produced | Token |
|---|---|---|---|---|---|
| 1 | {{DATE}} | live | "{{VERBATIM}}" | 1.0.0 | APPROVE |
