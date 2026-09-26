---
date: 2026-09-26
time: 13:27 EDT
host: laptop
source: tech-scout
title: Tech Scout — 2026-09-26
attachment: briefings/attachments/2026-09-26-172752-laptop-tech-scout.md
attachment_name: scout-2026-09-26.md
---

Tech Scout — 2026-09-26

The tracked three.js item shipped. r186 tagged Sep 24 (npm three@0.186.1) with the native Gaussian Splat renderer — raycasting and frustum culling included, so a splat scene is hit-testable, not just a backdrop. Paired with a correction found this run: KHR_gaussian_splatting is ratified, not the 'Feb 2026 RC' the last two reports recorded (search still repeats February's press release; the spec README says Ratified). MedSim now has an end-to-end standards-based splat path inside the renderer it already ships — but note ^0.184 will never resolve to 0.186, so the bump is explicit.

Three backfills, all misses of tracked checks: Lens Studio 5.24.0 shipped Sep 10 and was missed by six consecutive runs despite a mandated per-run version diff; monai-physio cut its first releases (PyPI monai-physio 2026.9.1) after the 09-05 report predicted exactly that; i4h-digital-twin v0.8.0 (Sep 2). Four Sep 23–24 model releases the last report skipped (Aion 3.5, Fireworks Ember-1, FLUX 3 Action open weights, Gemini 3.8 Live). AR and hardware: nothing new.

1 parked idea moves: haptic-mirror-d4rt → REVISIT, and its blocker should be rewritten — D4RT was never actually required and the remaining gate is demand, not tooling. ai-multiview-video-generator stays WAIT (its real blocker is a project slot, which better tooling can't clear). FDA GenAI docket T-23.
