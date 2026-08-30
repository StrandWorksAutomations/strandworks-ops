# Tech Scout Report — 2026-08-28

**Window:** 2026-08-26 → 2026-08-28 (2 days; normal daily cadence — no gap backfill).

**Major events swept in window:** none in-window. Next on calendar: RayNeo iO launch Sep 4, IFA Berlin Sep 4–8 (Boox Picco/Palma 3 expected), Snap Specs event Sep 16, Meta Connect Sep 23–24.

**Headline:** The cyber-gating test-case resolved: **Z.ai shipped the full GLM-5.3 (743B-A40B) open weights to HuggingFace on Aug 28, on the promised Day 14** — 141 safetensors shards, permissive MIT-style "GLM-5.3 License". The two-week safety hold did not become a permanent gate. Also caught one miss from the prior window: **Qwen3.8-Flash-Next (125B-A6B + 51B n-gram embedding) landed Aug 24**, a new efficiency-architecture open model. Otherwise thin.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing shipped in-window. Jetpack Compose for XR still not in beta (SceneCore/ARCore-for-XR/XR Runtime beta was covered Aug 22). Watchlist unchanged.

### Spatial Computing / 3D
- **DeepMind D4RT — still no official code.** Week 16+. [Project page](https://d4rt-paper.github.io/) unchanged.
- No Genie 3 API opening — still Ultra-only via [Project Genie](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/).
- Nothing new with released code in 3DGS/world-model space in-window (FastGS, Mobile-GS, GaussianWM surfaced in search but are all pre-window).

### AI / ML
- **GLM-5.3 full open weights — SHIPPED Aug 28.** [HF: zai-org/GLM-5.3](https://huggingface.co/zai-org/GLM-5.3) (created Aug 25 as placeholder, weights pushed Aug 28 15:22 UTC; 141 shards BF16/FP8) · [Z.ai announcement on X](https://x.com/Zai_org/status/2093354097122455713) · [Kingy AI on the delay + 2,436-vuln claim](https://kingy.ai/blog/glm-5-3-open-weight-cybersecurity-vulnerability-claim/). 743B total / ~40B active MoE, same base as GLM-5.2, gains from post-training. License: custom "GLM-5.3 License" — MIT-form text (use/modify/sell/sublicense; attribution + comply-with-law). Terminal-Bench 3.0 28.3 (open-source SOTA), CyberGym 84.5%. ~1.5 TB BF16 / ~750 GB FP8 — multi-node only; not a self-host candidate for this portfolio. **Why it matters:** the "cyber-capable model held for review" norm resolved as a two-week delay, not a withholding. Precedent for how the other labs (Meta Muse Spark 1.2, Qwen3.8-Max) are likely to behave.
- **Qwen3.8-Flash-Next — SHIPPED Aug 24 (missed last window).** [HF: Qwen/Qwen3.8-Flash-Next](https://huggingface.co/Qwen/Qwen3.8-Flash-Next) (+ FP8). 125B params / 6B active, plus 51B n-gram embedding + 4B MTP; hybrid Gated DeltaNet + Qwen Sparse Attention (micro-block sparse). Research/base release — the production "Qwen3.8-Flash" (1M ctx, built-in tools) is API-only. Why it matters: 6B-active with offloadable n-gram embeddings is explicitly designed for memory-constrained accelerators — a plausible on-box NPC model class alongside GLM-5.3-Flash.
- **Muse Spark 1.2 weights — still not on HF** (Day 15). `meta-llama` org last modified Nov 2025; no `facebook/Muse*` repos.
- **Qwen3.8-Max (2.4T-A95B) — on HF since Aug 8** as `Qwen/Qwen3.8-2.4T-A95B` (already logged). No change.
- **Apple Foundation Models framework open-source — not shipped.** `apple` GitHub org newest repo Aug 14 (ads API). 10 days to Labor Day.
- **Gemini 3.5 Pro API / OpenAI Astra — no change.**

### Hardware
- Nothing shipped in-window. Jetson Orin Nano 2 remains H1 2027. Boox: IFA Sep 4–8.

### Medical / Clinical AI
- No new FDA GenAI/CDS clearances in-window. FDA-2026-N-7874 comment window still open (due Oct 19).

---

## Nothing New (Watchlist)
- ~~GLM-5.3 full open weights~~ — **RESOLVED Aug 28 (shipped).**
- Muse Spark 1.2 weights — Day 15.
- Apple Foundation Models framework open-source — Labor Day Sep 7.
- DeepMind D4RT official code — week 16+.
- Gemini 3.5 Pro GA — no API entry.
- Genie 3 developer API — Ultra-only.
- OpenAI Astra — paused Day 21.
- Jetpack Compose for XR beta — "soon."
- RayNeo iO — Sep 4. Snap Specs — Sep 16 event. Meta Ray-Ban Gen 3 — Connect Sep 23–24.
- Jetson Orin Nano 2 — H1 2027.
- Boox Picco / Palma 3 — IFA Sep 4–8.

## Project Impact
- **MedSim-Game (flagship):** GLM-5.3 full is too large to self-host; it changes nothing operationally. The Aug 26 recommendation stands — bake off **GLM-5.3-Flash** (320B-A18B, MIT) and now **Qwen3.8-Flash-Next** (125B-A6B) against the current sim-llm-npc model on 5 scenarios before the Sep 9 GLM promo ends. Both are API-reachable today.
- **MedCapture / SmartBadge / 3rdrider / haptic-mirror:** no movement.

## Parked Idea Unblocks
- **Idea:** Resume haptic-mirror when D4RT or equivalent worldbuilder ships — **File:** `_ops/idea-vault/haptic-mirror-d4rt.md` — **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling…" — **What changed:** nothing. — **Action: WAIT.**
- **Idea:** 3rdrider — **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md` — **Blocker was:** "<$800 consumer AR glasses w/ prescription + camera+mic+display + SDK" — **What changed:** nothing in-window; three launch dates now inside 4 weeks (RayNeo iO Sep 4, Specs Sep 16, Connect Sep 23). — **Action: WAIT.**
- **Idea:** AI multiview video generator — **File:** `_ops/idea-vault/ai-multiview-video-generator.md` — **Blocker was:** Genie 3 multi-view API — **What changed:** none. — **Action: WAIT.**
- All other parked ideas: no in-window developments touch their blockers.
