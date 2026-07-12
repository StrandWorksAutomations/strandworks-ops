---
id: 2026-07-12-spec-intake-tenetrix-intervention
filed: 2026-07-12
filed-by: orchestrator (VAIO session)
question: APPROVE SPEC v1.0.0 for Tenetrix Intervention (MedSim-Game repo, game mode), translated from the VISION blessed 2026-07-12?
ruling: APPROVE
ruled: 2026-07-12T15:32:44.503Z
source: cockpit
---

**Proposed SPEC v1.0.0 — workstreams** (full text written into the repo +
intake-log entry on APPROVE):

1. **RPG shell:** character creation, progression, and the reward loop —
   leveling through acquisition of equipment, protocols, and skills.
   Gamification is core identity, not garnish.
2. **Scenario play loop:** one complete scenario (e.g. airway) playable
   end-to-end against the existing physiology engine, with honest
   consequences. **First slice together with workstream 1.**
3. **Settings library:** the region/setting framework (hospital, ambulance,
   SAR, street, clinic, helicopter, radiology, surgery, offshore) — schema
   first, content by later intakes.
4. **CME/licensure engine:** licensure-level tracking, per-scenario credit,
   auditable completion records. Structural rule enforced in code: ad
   surfaces CANNOT exist inside credit-bearing content. Accreditation
   integrations later by intake.
5. **ePCR trainer:** documentation practice at scale (familiarization and
   hard-test modes).
6. **Enterprise insertion:** client-owned facilities, units, and protocols
   loaded into the game world (later slice).
7. **Photoreal asset pipeline:** replaces the retired clay/stylized
   pipeline; hyper-realism is canon.

**Sprint 0 (runs first, no product code):** reality-map — audit the
existing Nx/medsim engine against these workstreams, report what exists,
what's reusable, what's missing.

**Non-goals carried from VISION:** no ads in CME/accredited content ever;
not a boring checkbox CME site; never real patients/PHI; no return to
stylized rendering; no codebase merge with haptic-mirror without intake;
platform choices stay SPEC-level decisions via intake.

**Note:** approving this only helps cloud/Mac dev instances if the
push-medsim-game-governance decision is ALSO approved (repo is currently
local-only on the VAIO).

**Options:** APPROVE / REVISE (say what to change) / PARK.
