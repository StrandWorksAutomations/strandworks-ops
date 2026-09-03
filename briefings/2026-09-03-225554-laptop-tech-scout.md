---
date: 2026-09-03
time: 15:55 PDT
host: laptop
source: tech-scout
title: Tech Scout — 2026-09-03
attachment: briefings/attachments/2026-09-03-225554-laptop-tech-scout.md
attachment_name: scout-2026-09-03.md
---

Tech Scout — 2026-09-03

Best medical-sim day this scout has produced, and neither item came from a news feed. NVIDIA Isaac for Healthcare v0.8.0 shipped Sep 2 (full runtime rewrite on Isaac Sim 6.0.1; new ultrasound_liver_scan + ultrasound_probe_reach workflows, CT-derived patient-twin pipeline). And an org sweep surfaced Project-MONAI/physiotwin4d — Apache-2.0 personalized physiological digital twins, cardiac + respiratory motion from medical images, expanding to electrophysiology/perfusion — which has never appeared in any prior scout report. Closest open-source analogue to MedSim's physiological clone; suggested next step is a doc-read against master-design, not an integration.

Models: Gemini 3.8 Flash GA ($0.75/$3.75 intro, Terminal-Bench 90.8%); Meta Muse Spark 1.3 closed-weights again, and the 1.2 open-weights promise was quietly re-based to an undated 'soon'.

Two corrections to prior reports: (1) VGGT-Omega checkpoints are access-GATED and carry an Aug 18 benchmark-contamination notice — this weakens the fallback recommendation haptic-mirror has been carrying since 08-10; (2) apple/coreai-models is not empty, it's a 2,045-star active repo — only the two LanguageModel Swift packages are missing.

Parked ideas: 1 blocker definitively closed off — RayNeo iO is $479/33g with a display but NO camera, so it fails the 3rdrider threshold outright; strike it from the candidate list. haptic-mirror moved backwards. Full report attached.
