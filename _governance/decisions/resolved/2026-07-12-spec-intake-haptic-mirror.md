---
id: 2026-07-12-spec-intake-haptic-mirror
filed: 2026-07-12
filed-by: orchestrator (VAIO session)
question: APPROVE SPEC v1.0.0 for haptic-mirror (field mode), translated from the VISION blessed 2026-07-12?
ruling: APPROVE
ruled: 2026-07-12T15:32:36.892Z
source: cockpit
---

**Proposed SPEC v1.0.0 — workstreams** (full text written into the repo +
intake-log entry on APPROVE):

1. **Scenario Builder** (the dashboard, vision's front door): concept +
   target concepts + real location + provider skill level in → structured
   scenario spec out (patients, conditions, physiology seeds, supplies,
   victory conditions). **First slice**, with a web preview — no AR needed
   to make it real.
2. **Patient assembly:** builder pulls patient LLMs + physiology configs
   from the platform's existing engine (voice AI, PK/PD, vitals).
3. **Skill & certification matching:** scenario auto-scoping by provider
   level; agency/cert-requirement mapping as a schema now, accreditation
   integrations later by intake.
4. **AR scene runtime:** execute a scenario spec in the real environment on
   the existing WebXR/Quest-3 platform (second slice).
5. **Consequence engine:** physiology-honest deterioration wired to
   scenario events (missed airway → crash; failed splint → recoverable).
6. **ML capture:** every run recorded as structured patient/provider
   interaction data (the 3rdrider flywheel). Trainee-consent terms are an
   enterprise-contract matter, flagged not built.

**Sprint 0 (runs first, no product code):** reality-map — audit what the
existing engine already provides for each workstream, report gaps. Keeps
the SPEC honest before building.

**Non-goals carried from VISION:** never real patients/PHI; spatial-safety
app stays PARKED; no codebase merge with MedSim-Game without intake;
hardware-agnostic.

**Note:** approving this only helps cloud/Mac dev instances if the
push-haptic-mirror-governance decision is ALSO approved (repo is currently
local-only on the VAIO).

**Options:** APPROVE / REVISE (say what to change) / PARK.
