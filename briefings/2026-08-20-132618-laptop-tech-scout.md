---
date: 2026-08-20
time: 13:26
host: laptop
source: Tech Scout
title: Tech Scout — 2026-08-20
attachment: briefings/attachments/2026-08-20-132618-laptop-tech-scout.md
attachment_name: scout-2026-08-20.md
---

Tech Scout — 2026-08-20

Not a thin day. Gaussian splatting had its biggest window in weeks: PlayCanvas opened a REST publishing API for SuperSplat (Aug 18) with a first-party LichtFeld Studio integration, and Scantic put sub-minute, fully on-device splat training on the iPhone — free, no cloud, no account. Together with Apache-2.0 GaussianSplatting.jl v2.0.0 (Metal), the capture→train→host loop is now free and entirely local. Concrete next action: capture one real clinical space and push it to a SuperSplat URL — an afternoon, and it settles the splat-vs-hand-authored-GLB question for ?clinic.

Backfill catch that matters more: SimX shipped instructor-free autonomous VR clinical simulation on Aug 12 — LLM characters behind a clinician-validation gate, automatic competency tracking, runs on headsets customers already own. That is MedSim's thesis, shipped commercially, and it has never appeared in any scout report. Cause is a config gap: §D monitors imaging/robotics vendors, not VR clinical-sim vendors. Fix…
