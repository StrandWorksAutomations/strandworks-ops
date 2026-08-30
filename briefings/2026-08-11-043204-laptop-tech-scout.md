---
date: 2026-08-11
time: 04:32
host: laptop
source: Tech Scout
title: Tech Scout — 2026-08-11
attachment: briefings/attachments/2026-08-11-043204-laptop-tech-scout.md
attachment_name: scout-2026-08-11.md
---

Tech Scout — 2026-08-11

Thin day: nothing shipped in AR, spatial, hardware, or medical AI. Two follow-ups moved.

1) Muse Glimmer GGUF quants landed (unsloth, ~1h after yesterday's run closed) — 20 files incl. vision projector. But I sized them off HF directly: Q4_K_XL is 14.8GB + 1.9GB mmproj = 16.7GB, and this Mac has 16GB. It does NOT fit. Only Q2/Q3 fit, which is exactly where tool-calling degrades. Yesterday's eval recommendation stands, but it runs on Shadow VM or a spot GPU, not the laptop.

2) Gemini 3.5 Pro's 'Aug 12' rumor finally has a mechanism: Made by Google is confirmed for tomorrow, Aug 12, 6PM ET, NYC (Google's own store page). Fifth attempt at this date, first one that's actually testable. Also the venue to watch for Android XR / Pixel Buds Sight.

Qwen3.8 weights still absent — verified 401, identical to a control probe. Two missed dates + unresolved USA/EU/UK/Korea license cloud. Downgrading to periodic-watch.

Parked ideas unblocked: 0.
