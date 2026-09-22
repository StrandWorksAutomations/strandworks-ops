# Tech Scout Report - 2026-09-22

**Window:** 2026-09-21 → 2026-09-22 (1 day; daily cadence, no gap backfill).
**Major event swept:** Alibaba Apsara Conference day 1 (Sep 22, Hangzhou). Meta Connect is Sep 23–24, so it falls in the next window.

**Bottom line: nothing shipped in the focus areas today.** Apsara day 1 was announcements and roadmaps only. None of it is available as an API, weights, or hardware yet.

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing shipped. Meta Connect reveals (Ray-Ban Meta Gen 3, Celeste/Hypernova HUD, camera-less "Luna", premium "Phoenix") are all tomorrow. Pre-Connect report: [Engadget — camera-less Luna](https://www.engadget.com/2259838/meta-smart-glasses-without-a-camera/).

### Spatial Computing / 3D
- Nothing material. Routine maintenance release only: [nvpro-samples/vk_gaussian_splatting 2026.2.9](https://github.com/nvpro-samples/vk_gaussian_splatting) (material/asset-path fixes). Not significant.

### AI / ML
- **Qwen 4 (Max / Plus / Flash / 27B) was previewed at Apsara, but it has not shipped.** No model card, weights, API ID, pricing, or context window yet ([OrcaRouter breakdown](https://www.orcarouter.ai/blog/qwen-4-max-lineup-announced-apsara-2026), [AiBattle](https://x.com/AiBattle_/status/2102246552475439118)). Alibaba also put Qwen 4.5 / Qwen 5 on the roadmap at 5–10T params ([Alizila keynote](https://www.alizila.com/aliviews-eddie-wu-shares-alibabas-strategic-full-stack-ai-roadmap-at-the-2026-apsara-conference/)). Moved to Watchlist.
- Qwen Intelligence is a B2B agent platform sold to phone makers. It isn't relevant to the portfolio. Qwen-Image 3.1 is "later this year," so it hasn't shipped either.

### Hardware
- The T-Head Zhenwu V900 AI chip was unveiled, but mass production and sales are Q1 2027 ([TechNode](https://technode.com/2026/09/22/t-head-unveils-zhenwu-v900-ai-chip-in-alibabas-push-to-expand-its-ai-infrastructure-stack/)). The Yitian 720/730 CPUs are also 2027. Roadmap only.

## Nothing New (Watchlist)
- **Alibaba Qwen 4.** Previewed Sep 22 but not shipped. Watch for an API ID or weights on Apsara days 2–3.
- **Meta Connect.** Sep 23–24 (T-1), and it decides the 3rdrider blocker. Ray-Ban Meta Gen 3 (Aperol/Bellini), Meta Celeste $800 (October), Luna (camera-less), Phoenix ($1–2K).
- **Sora 2 API shutdown.** Sep 24 (T-2).
- **DeepMind D4RT code.** Week 20+; no drop.
- **Gemini 3.5 Pro GA.** Week 19+; no endpoint.
- **Genie 3 developer API.** Still Ultra-only ($250/mo, above the autonomy gate).
- **Apple Foundation Models open-source.** Week 15; no drop.
- **Meta Muse Spark 1.2 open weights.** Day 50+.
- **Tencent WorldClaw code.** Still README-only.
- **World Labs Atlas public API.** No change.
- **xAI Grok 4.7/4.8.** Not shipped.
- **Jetpack Compose for XR beta.** Not announced.
- **Cursor Origin GA.** Waitlist; 51 days to the Nov 12 OpenAI cutoff.
- **NVIDIA GR00T N2 / Jetson T3000/T2000.** End-of-year and Q1 2027 respectively.
- **Mayo + Microsoft healthcare model.** 16+ weeks with no delivery.
- **FDA GenAI docket FDA-2026-N-7874.** T-27 (Oct 19).

## Project Impact
- **MedSim-Game:** no change today. The standing recommendation carries forward: file the FDA GenAI docket comment (T-27).
- **MedCapture / BadgeMedia / haptic-mirror:** no change.
- **3rdrider:** re-evaluate in the Sep 23–24 scout after Connect pricing is known.

## Parked Idea Unblocks
No parked ideas unblocked. All blocker statuses from the 2026-09-21 report stand:
- `3rdrider-snap-spectacles.md`: WAIT, re-evaluate after Meta Connect (Sep 24).
- `ems-event-robot-fleet.md`: WAIT (G1 $13,500 vs the ~$10K trigger).
- `haptic-mirror-d4rt.md`, `ai-multiview-video-generator.md`: WAIT (no D4RT / Genie API / WorldClaw movement).
- All others: no in-window developments.
