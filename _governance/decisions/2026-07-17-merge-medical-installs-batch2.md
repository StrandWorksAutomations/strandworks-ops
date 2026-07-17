---
id: 2026-07-17-merge-medical-installs-batch2
filed: 2026-07-17
filed-by: orchestrator (medical-repos governance fan-out, wave 2)
question: Merge the governance-install branches for medcapture, pocus-ultrasound, and the-kinetic-medic?
ruling: PENDING
---

**Context:** Three more medical repos discovered + governed on
`governance/install-vaio` branches (all verified additive-only, main
untouched, VISION/SPEC unblessed drafts):
- **medcapture** (HEAD 24a99f7) — real Expo/RN iPad app ~80% built; audit
  proposed 1 quarantine (stale `.claude-agent-init.md`) + 1 owner route
  (an out-of-portfolio robotics side-dataset proposal). CAUTIONS: no real
  patient captures before IRB approval; needs a dedicated Supabase project +
  BAA before clinical data. Merging governance docs does NOT affect any of
  that.
- **pocus-ultrasound** (HEAD 6f2d02a) — clean (0 quarantine). Is a digital
  PROP inside MedSim-Game, not a standalone pillar — may INHERIT MedSim's
  canon rather than need its own vision. OWNER Q: own vision, or inherit?
- **the-kinetic-medic** (HEAD 40d36ad) — clean EMS-news blog (0 quarantine).
  NOT in PORTFOLIO. OWNER Q: in-portfolio media pillar, independent personal
  brand, or orphan?

**Options:** APPROVE (merge all three governance branches) / REVISE (pick a
subset) / PARK. (Vision dictations + the two placement questions are separate
owner steps, tackled per-repo when you bless.)
