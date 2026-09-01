# Tech Scout Report — 2026-08-26

**Window:** 2026-08-24 → 2026-08-26 (2 days; normal daily cadence — no gap backfill).

**Major events swept in window:** none in-window. Next on calendar: IFA Berlin Sep 4–8 (Boox Picco expected), Meta Connect Sep 23–24, SIGGRAPH Asia Dec 1–4.

**Headline:** Two real drops. (1) **Z.ai shipped GLM-5.3-Flash open weights (MIT) to HuggingFace on Aug 26** — the stealth "Ox Alpha" model, now named — 320B-A18B, natively multimodal, 1M context, $0.15/$0.50 per 1M tokens. This is a *different, smaller* model than the 744B GLM-5.3 whose weights are still gated until ~Aug 28; the cyber-gating test-case remains open. (2) **NVIDIA announced Jetson Orin Nano 2 (Aug 25)** — 78 TOPS, 8 GB, 2× Orin Nano Super at 40% less power — but it does **not ship until H1 2027**, so it is a roadmap item, not an available part. Otherwise a thin window, as expected.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing shipped in-window. Watchlist unchanged (Samsung Jinju fall 2026 / $400 audio-only; XREAL Aura fall 2026 ≤$1,500, >10K reservations as of Aug 20; Snap Specs $2,195 fall preorders; Meta Ray-Ban Gen 3 at Connect Sep 23–24; Pixel Buds Sight Nov / $299 audio-only). No Meta Ray-Ban Display v128. No Jetpack Compose for XR beta yet.

### Spatial Computing / 3D
- **DeepMind D4RT — still no official code.** Watchlist week 16+. [Project page](https://d4rt-paper.github.io/) unchanged; [OpenD4RT](https://github.com/Lijiaxin0111/Open-d4rt) unchanged since Jun 4.
- **GaussianDWM++ (arXiv 2608.16234, submitted Aug 17)** — language-grounded 3D-Gaussian driving world model with instruction-controllable 4D generation. [alphaXiv](https://www.alphaxiv.org/abs/2608.16234) · repo `dtc111111/GaussianDWM` — **code "will be released"; not yet public.** Driving-domain; logged for the 3DGS-world-model pattern, no direct MedSim use.
- No Genie 3 API opening. Still Ultra-only research preview.

### AI / ML
- **GLM-5.3-Flash open weights — SHIPPED Aug 26.** [HF: zai-org/GLM-5.3-Flash](https://huggingface.co/zai-org/GLM-5.3-Flash) (+ BF16 variant) · [Artificial Analysis](https://artificialanalysis.ai/models/glm-5-3-flash) · [orcarouter write-up](https://www.orcarouter.ai/blog/glm-5-3-flash-release) · [NVIDIA forum: runs on DGX Spark](https://forums.developer.nvidia.com/t/glm-5-3-flash-weights-released-ox-alpha/381345). 320B total / 18B active MoE, natively multimodal (text+image in), 1M context, MIT license, sparse+linear attention with mHC. Terminal-Bench 2.1 84.3, DeepSWE 63.4; AA Intelligence Index 57. API $0.15/$0.50 per 1M (promo through Sep 9). **This is "Ox Alpha" (stealth-tested early Aug) with a name.** Why it matters: the strongest MIT-licensed multimodal agent model that fits on a single DGX-Spark/GB10-class box; a credible self-hostable candidate for MedSim NPC / scenario-authoring backends where per-token cost and data locality matter.
- **Full GLM-5.3 (744B) open weights — still NOT on HF.** Promised ~Aug 28 (Day 12 of 14). The cyber-gating deadline test is still live; log outcome in the next report.
- **Muse Spark 1.2 weights — still not on HF** (Day 13). [Meta HF org](https://huggingface.co/meta-llama) shows Glimmer only.
- **Gemini 3.5 Pro — still no API entry.** [status tracker](https://tech-insider.org/au/gemini-3-5-pro-67-days-delay-2026/).
- **Apple Foundation Models open-source — not shipped.** Only [foundation-models-utilities](https://github.com/apple/foundation-models-utilities) exists. 12 days to Labor Day.
- **OpenAI Astra — still paused** (Day 19).

### Hardware
- **NVIDIA Jetson Orin Nano 2 — ANNOUNCED Aug 25, ships H1 2027.** [NVIDIA newsroom](https://nvidianews.nvidia.com/news/nvidia-announces-jetson-orin-nano-2-robotics-computer-to-redefine-entry-level-edge-ai) · [Hackster](https://www.hackster.io/news/say-hello-to-the-nvidia-jetson-orin-nano-2-68cf1241460f) · [LinuxGizmos](https://linuxgizmos.com/upcoming-jetson-orin-nano-2-boosts-edge-ai-performance-to-78-tops/). 78 TOPS, 8 GB, 8-core Arm, same footprint as Orin Nano; 2× Orin Nano Super inference at 40% less power in 15 W mode; runs Cosmos/Nemotron/Gemma 4/Qwen 3. **No price, no ship date beyond "H1 2027."** Per the rules this is a roadmap item — recorded because it sets the entry-level edge floor for any SmartBadge/MedCapture-adjacent edge-inference thinking; do not plan hardware around it until orderable.
- **Boox Picco** (3.97" Tile-line pocket e-reader, announced ~mid-July, covered Aug 20) — no price/date; IFA Sep 4–8 debut expected. No other Boox movement.

### Medical / Clinical AI
- No new FDA GenAI clearances in-window. FDA-2026-N-7874 comment window still open (due Oct 19) — decision on submitting comments still pending with Jonathan.
- SNUH + Harvard **Clinical Environment Simulator** (Nature Medicine, Jun 2) resurfaced in search — already logged 2026-07-30; no code release since. Not new.

---

## Nothing New (Watchlist)
- GLM-5.3 full 744B open weights — **due ~Aug 28; test-case for cyber-gating norm.**
- Muse Spark 1.2 weights — Day 13.
- Apple Foundation Models framework open-source — Labor Day Sep 7 is the implicit deadline.
- DeepMind D4RT official code — week 16+.
- Gemini 3.5 Pro GA — no API entry.
- Genie 3 developer API — Ultra-only.
- OpenAI Astra — paused Day 19.
- Jetpack Compose for XR beta — "soon."
- Meta Ray-Ban Gen 3 — Connect Sep 23–24.
- Jetson Orin Nano 2 — H1 2027; T3000/T2000 — Q1 2027.
- Boox Picco / Palma 3 / Note X6 — IFA Sep 4–8 likely.
- Mayo+Microsoft healthcare model; ARPA-H sim workshop report — nothing.

## Project Impact
- **MedSim-Game (flagship):** GLM-5.3-Flash is the first MIT-licensed, multimodal, 1M-context model cheap enough ($0.15/$0.50) and small enough (18B active) to be a serious self-host candidate for the sim-llm-npc edge function backend or bulk scenario-synthesis passes. Worth a 1-hour API bake-off against the current NPC model on 5 existing scenarios before Sep 9 promo ends — not a change to the doctrine, an option check.
- **MedCapture / SmartBadge:** Orin Nano 2 is roadmap only; no action.
- **3rdrider / haptic-mirror:** no movement.

## Parked Idea Unblocks
- **Idea:** Resume haptic-mirror when D4RT or equivalent worldbuilder ships — **File:** `_ops/idea-vault/haptic-mirror-d4rt.md` — **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling…" — **What changed:** nothing shipped; GaussianDWM++ is driving-domain and code-pending. — **Action: WAIT.**
- **Idea:** 3rdrider — **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md` — **Blocker was:** "<$800 consumer AR glasses w/ prescription + camera+mic+display + SDK" — **What changed:** nothing in-window. — **Action: WAIT** (watch Connect Sep 23–24).
- **Idea:** AI multiview video generator — **File:** `_ops/idea-vault/ai-multiview-video-generator.md` — **Blocker was:** Genie 3 multi-view API / display-cube exists — **What changed:** no Genie API. — **Action: WAIT.**
- **Idea:** EMS event robot fleet — **File:** `_ops/idea-vault/ems-event-robot-fleet.md` — **Blocker was:** Go2 ~$1K / G1 ~$10K + MedCapture milestones — **What changed:** Orin Nano 2 lowers future entry-level robot BOM but ships 2027; no Unitree price move. — **Action: WAIT.**
- All other parked ideas: no in-window developments touch their blockers.
