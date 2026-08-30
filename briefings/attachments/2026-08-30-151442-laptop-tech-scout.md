# Tech Scout Report — 2026-08-30

**Window:** 2026-08-28 → 2026-08-30 (2 days; normal daily cadence — no gap backfill).

**Major events swept in window:** none in-window. Next on calendar: RayNeo iO + GT/GT Max launch Sep 4, IFA Berlin Sep 4–8 (Boox Picco/Palma 3 expected), Snap SPECS launch event Sep 16 (LA), Meta Connect Sep 23–24, XREAL AURA "fall" (price ≤$1,500, not yet named).

**Headline:** Two open-weight drops, both verified against the HF API. **Tencent shipped Hy4 preview (770B-A49B MoE, Apache-2.0, 1M ctx) on Aug 27–28** — the second Apache-licensed frontier-class open model in a week after GLM-5.3, and API-priced at $0.83/$2.50 per MTok. Separately, **Meta quietly published nine `facebook/MobileMoE-*` repos (S/M/L × Base/SFT/QAT, 0.3–0.9B active)** — no announcement, gated, **FAIR Noncommercial Research License** → not usable in a shipping product. Anthropic's Model Hardware Standard (Aug 27) is a closed research preview — watchlist only.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing shipped in-window.
  - Snap newsroom headline diff: newest post still **07.31.26** ("Rewarding Authentic Creativity on Spotlight"); SPECS launch post (07.30) unchanged. No new Specs/Snap OS news.
  - Lens Studio version diff: **5.23.2, released Aug 17** — unchanged from the 08-18 report.
  - Android Developers Blog: no XR post since the Aug 18 Jetpack XR core-libraries beta. Jetpack Compose for XR still not in beta.
  - XREAL AURA: still reservation phase; 2,000 Founder Passes sold in 36h, 10k+ reservations by Aug 20 (pre-window); price still unnamed. Catalyst-cohort dev kits going out by email to selected devs only — no open path.
  - Apple glasses roundup (9to5Mac Aug 29) is rumor/roadmap — excluded per rules.

### Spatial Computing / 3D
- **DeepMind D4RT — still no official code.** Week 16+. `google-deepmind` org: nothing. Community re-implementations only (`Lijiaxin0111/Open-d4rt`, `MasahiroOgawa/D4RT_MasImpl`) — already known.
- **Genie 3 — no developer API.** Still Ultra-only Project Genie. Google Developers Blog Aug 26–30: only a TPU/vLLM embeddings post and an ADK voice-agent eval post; no Gemini 3.5 / Genie / Veo entries.
- World Labs Marble release notes: newest entry still **2026-04-02** (baseline unchanged). SpAItial blog: newest still **Echo-2, 2026-04-28** (baseline unchanged).
- LichtFeld-Studio: genuine feature activity per `/events` (Aug 30: `feat/modernize-ui` merged to `dev`, push to `master`, `fix/sequencer-ruler-time-accuracy` branch Aug 28) — but **no release since v0.5.3 (Jun 24)**. Not a report item; noted for the next tag.
- faster-gaussian-splatting: `/events` shows only WatchEvents in-window; last real pushes were Aug 20 (`FasterGS4D`, `FasterGSBasis` branches — covered 08-22). No release (never has one).
- SuperSplat: v2.32.5 (Aug 25) is pre-window; patch-level only.
- NVIDIA Isaac for Healthcare org: newest push still `i4h-workflows` Aug 11. MONAI still 1.6.0 (Jun 11). No movement.

### AI / ML
- **Tencent Hy4 preview — open weights SHIPPED Aug 27–28.** [HF: tencent/Hy4-preview](https://huggingface.co/tencent/Hy4-preview) (created Aug 27 08:52 UTC, 170 files, ~1.56 TB BF16; `Hy4-preview-FP8` also published) · [GitHub: Tencent-Hunyuan/Hy4-preview](https://github.com/Tencent-Hunyuan/Hy4-preview) · [Tencent announcement](https://www.tencent.com/tencent-releases-and-open-sources-tencent-hy4-preview/) · [TechNode Aug 28](https://technode.com/2026/08/28/tencent-open-sources-hy4-preview-with-770b-parameters-and-a-1m-token-context/). **770B total / 49B active MoE** (78 layers, 256 routed + 1 shared expert, top-8; +10B native MTP layer for speculative decoding); Gated DeepSeek Sparse Attention + IndexCache; >1M-token context. **License: Apache-2.0** (HF card; GitHub shows `NOASSERTION` — same composite-file classifier artifact seen on Cosmos-H-Dreams; the HF LICENSE file governs, read it before any use). Self-reported Terminal-Bench 2.1 85.4, DeepSWE 64.3. Card's own "Known Limitations": over-long reasoning, over-verification — "early version." **API:** Tencent Cloud TokenHub + OpenRouter, **$0.834 / $2.501 per MTok in/out**; free 2-week window inside WorkBuddy/CodeBuddy. vLLM + SGLang deployment recipes in the card. **Why it matters:** too large to self-host (same class as GLM-5.3 full), but it is now the cheapest Apache-licensed frontier-class API option and a third bake-off candidate for sim-llm-npc via OpenRouter alongside GLM-5.3-Flash and Qwen3.8-Flash-Next. Note: **Tencent Hy was never a named row in `TECH_SCOUT_CONFIG.md` §2C** — caught only via the HF trending scan. Same "query by name" gap that missed Qwen3.8-Max on 08-03.
- **Meta MobileMoE — nine repos surfaced on `facebook`, unannounced.** [facebook/MobileMoE-S/M/L-{Base,SFT,QAT}](https://huggingface.co/api/models?search=MobileMoE) — Base modified Aug 25, SFT Aug 27, **QAT Aug 30 01:56 UTC** (repos created Jun 11; staged rollout, downloads=2 on the QAT repos at check time → visibility is hours old). Paper: [arXiv 2605.27358](https://arxiv.org/abs/2605.27358) (May 26). **0.3–0.9B active / 1.3–5.3B total**, INT4 QAT variants ~1.6 GB (M) / ~3.0 GB (L) `model.safetensors`, `custom_code` (own `modeling_mobilemoe.py`), ExecuTorch fused-MoE kernel; paper claims 3.8× prefill speedup on iPhone 16 Pro and parity with OLMoE-1B-7B at 60% fewer params. **Gated (`auto` — click-through) and licensed FAIR Noncommercial Research License.** No `facebookresearch/MobileMoE` GitHub repo (404); no Meta blog post; no press coverage of the weights. **Why it matters:** this is exactly the on-device NPC-model class MedSim mobile would want — and the license forecloses it for a commercial product. Useful only as a research baseline / architecture reference for what a phone-resident MoE should look like. Do not plan on it.
- **Anthropic Model Hardware Standard (MHS) — research preview only, Aug 27.** [Announcement](https://www.anthropic.com/news/model-hardware-standard-research-preview) · [modelhardwarestandard.com](https://modelhardwarestandard.com) (application form). A standardized driver layer (read/write commands + device physical-characteristics metadata: weight, safety limits, adjustable params) so agents can operate lab/manufacturing equipment; exposed to harnesses via MCP. Partners: Genentech, UW Baker/Pinglay labs, CMU, HHMI Janelia, QuEra, Tetsuwan; vendors AWS/Strands Robots, Automata, Danaher, Doosan, MBF Bioscience, QIAGEN, Tecan, Universal Robots; Hugging Face LeRobot + Raspberry Pi adding support. **No public spec, repo, or SDK**; open-source "after safety evaluations," no date. → Watchlist. Relevance if/when public: the SmartBadge/sim-lab hardware ideas (RFID ultrasound trainer, mock-up print bank) and haptic-mirror would be natural MHS device targets; a sim-lab manikin/monitor exposing an MHS driver is a plausible future integration seam.
- **Muse Spark 1.2 weights — still not on HF** (Day 17). `facebook` org's only new activity is MobileMoE above; `meta-llama` last modified Nov 2025; `MuseSparkAI/musespark-video` (created Aug 30) is an empty 2-file squat, not Meta.
- **Qwen** — `?author=Qwen` newest is `Qwen3.8-Flash-Next` (+FP8) modified Aug 27 (card edits; release covered 08-28). `Qwen3.8-27B` + FP8 on HF since Aug 14 (already logged). Nothing new.
- **Apple Foundation Models framework open-source — not shipped.** `apple` GitHub org newest repo still Aug 14; `apple` HF org newest Apr 24. 8 days to Labor Day.
- **OpenAI** — changelog newest entry Aug 21; o3 retired from ChatGPT Aug 26, DALL·E GPT retired Aug 30 (retirements, not releases). Astra paused Day 23.
- **MCP** — blog newest post still "The New MCP Roadmap" (Aug 22, covered 08-22). `modelcontextprotocol/servers` latest release 2026.8.18. `agent-plugins-spec` still **0 tags**.
- Derivatives seen but not report items: `unsloth/GLM-5.3-Flash-GGUF`, `unsloth/Qwen3.8-Flash-Next-GGUF` (quant repackages); `FastVideo/FastH3-4-step-Preview` (MiniMax H3 distill).

### Hardware
- Nothing shipped in-window. Boox: IFA Sep 4–8. Jetson Orin Nano 2 remains H1 2027.

### Medical / Clinical AI
- No new FDA GenAI/CDS clearances in-window. FDA-2026-N-7874 comment window still open (due Oct 19). MedGemma refresh (Google, Aug 25) is pre-window and was a model-card update, not a new capability.

---

## Nothing New (Watchlist)
- Muse Spark 1.2 weights — Day 17.
- Apple Foundation Models framework open-source — Labor Day Sep 7.
- DeepMind D4RT official code — week 16+.
- Gemini 3.5 Pro GA — no API entry.
- Genie 3 developer API — Ultra-only.
- OpenAI Astra — paused Day 23.
- Jetpack Compose for XR beta — "soon."
- **Anthropic MHS public spec / open-source — NEW watch item** (preview partners only; no date).
- LichtFeld-Studio next release (v0.5.3 since Jun 24; active dev on `dev`/`master`).
- RayNeo iO / GT / GT Max — Sep 4. Snap SPECS — Sep 16 event. Meta Ray-Ban Gen 3 — Connect Sep 23–24. XREAL AURA — fall, price TBD (≤$1,500).
- Jetson Orin Nano 2 — H1 2027.
- Boox Picco / Palma 3 — IFA Sep 4–8.

## Project Impact
- **MedSim-Game (flagship):** Hy4 preview adds a third API-reachable candidate to the sim-llm-npc bake-off (GLM-5.3-Flash MIT, Qwen3.8-Flash-Next, now Hy4 Apache at $0.83/$2.50 via OpenRouter). Its own card flags over-long reasoning — for short NPC turns that is a latency/cost risk, so it belongs in the bake-off as a quality ceiling, not a default. **MobileMoE is the right shape for on-phone NPCs and the wrong license** — treat as a reference architecture only. GLM promo still ends Sep 9.
- **SmartBadge / sim-lab ideas / haptic-mirror:** MHS is the first vendor-backed "agent ↔ physical instrument" standard; nothing to build on until the spec is public, but any future sim-lab hardware prop should expect to expose an MHS-style driver. No action now.
- **MedCapture / 3rdrider:** no movement.

## Parked Idea Unblocks
- **Idea:** Resume haptic-mirror when D4RT or equivalent worldbuilder ships — **File:** `_ops/idea-vault/haptic-mirror-d4rt.md` — **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling…" — **What changed:** nothing in-window (Marble video→world path remains the standing $5 test; still unspent). — **Action: WAIT.**
- **Idea:** 3rdrider — **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md` — **Blocker was:** "<$800 consumer AR glasses w/ prescription + camera+mic+display + SDK" — **What changed:** nothing shipped; XREAL AURA confirmed ≤$1,500 (above the blocker's ceiling regardless). Three launch dates inside 4 weeks (Sep 4 / Sep 16 / Sep 23). — **Action: WAIT.**
- **Idea:** AI multiview video generator — **File:** `_ops/idea-vault/ai-multiview-video-generator.md` — **Blocker was:** Genie 3 multi-view API — **What changed:** none. — **Action: WAIT.**
- **Idea:** Ultrasound / doppler sim trainer with positional tracking — **File:** `_ops/idea-vault/sim-lab-rfid-ultrasound-trainer.md` — **Blocker was:** MedCapture sim-lab pilot + ≥3 director validations (market) — **What changed:** MHS is a tangential technical enabler (standard driver surface for a tracked wand/trainer), but the blocker is market, not tech, and MHS is not public. — **Action: WAIT** (note only).
- All other parked ideas: no in-window developments touch their blockers.
