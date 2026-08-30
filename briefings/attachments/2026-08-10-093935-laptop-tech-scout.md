# Tech Scout Report — 2026-08-10 (run 2)

**Window:** 2026-08-10 10:07 → 2026-08-10 12:30 EDT (~2h delta pass on top of [scout-2026-08-10.md](scout-2026-08-10.md), which was a 22-day gap backfill).

**Purpose of this run:** the morning report closed with four explicit "next scout should verify" items. This pass resolves them. **One shipped; three unchanged.** Thin day by design — see the daily cadence rule.

---

## Breakthroughs & Releases Since Last Report

### AI / ML

- **Meta Muse Glimmer — SHIPPED TODAY, and it is bigger news than the morning report's one-line placeholder suggested.** [HuggingFace model card](https://huggingface.co/meta-models/Muse-Glimmer-30B) · [HF announcement blog](https://huggingface.co/blog/muse-glimmer) · [Bloomberg](https://www.bloomberg.com/news/articles/2026-08-10/meta-releases-muse-glimmer-ai-model-people-can-run-on-their-laptop) · [Phoronix](https://www.phoronix.com/news/Meta-Muse-Glimmer) · [MarkTechPost](https://www.marktechpost.com/2026/08/10/meta-ai-releases-muse-glimmer/) · [Open Source For You](https://www.opensourceforu.com/2026/08/meta-open-sources-muse-glimmer/).
  The morning report logged Muse Glimmer as "a new SKU, details not yet in circulation." Details are now in circulation:
  - **30B dense multimodal, Apache 2.0**, distilled from Muse Spark 1.2.
  - Architecture: 2B ViT-style vision encoder + 28B text decoder; hybrid attention (alternating sliding-window and full-attention layers), gated GQA, Q-K norm.
  - **32,768-token context** (8,192 max generation) — short context is the real constraint, not size.
  - Text + image + **video** in (no audio).
  - Inference: **1×80GB H100**. LoRA fine-tune: 1×80GB H100 @ microbatch 1. Full fine-tune: 8×80GB H100, FSDP/ZeRO-3.
  - Day-0 support in transformers, **llama.cpp**, vLLM, Inference Endpoints.
  - Agentic benchmark claims: **75.5 MCP Atlas**, **74.6 DeepSearch QA**.
  - Positioning: "local agentic use cases" — local coding agents, LLM-as-judge, document analysis, privacy-aware assistants.
  - **Signal-quality flag:** Bloomberg's headline ("run on their laptop") and the model card (80GB H100) do not agree. The laptop path is quantized GGUF via llama.cpp, not the released bf16 weights. **Do not size a MedSim deployment off the press framing.** Verify VRAM empirically before committing.

### AR / Smart Glasses

- **No change.** Samsung has still given no official price for Intelligent Eyewear ("Jinju"). [TechCabal](https://techcabal.com/2026/06/19/samsung-galaxy-glasses/) · [Android Headlines: $299 floor claim](https://www.androidheadlines.com/2026/07/samsungs-intelligent-eyewear-could-start-at-299-and-already-has-a-big-advantage-over-meta.html). Post-Unpacked leak consensus has drifted **downward** from the morning report's $379–$499 band to **$299–$399**. Still leak, not confirmation. Fall 2026 launch unchanged. This does not change the `3rdrider-snap-spectacles` partial-promote call from the morning report — a lower price only strengthens the already-satisfied <$800 criterion.

### Spatial Computing / 3D

- **Nothing shipped in-window.** No D4RT code. No new papers-with-code beyond the SIGGRAPH batch already logged this morning.
- *Not-new but previously unlogged, flagging for the record:* **`KHR_gaussian_splatting` glTF extension** — ratification tracked for Q2 2026, will become the universal 3DGS interchange format. [CG Channel](https://www.cgchannel.com/2026/02/3d-gaussian-splats-are-being-added-to-the-gltf-standard/) · [The Future 3D: state of 3DGS 2026](https://www.thefuture3d.com/blog/state-of-gaussian-splatting-2026/). Relevant to MedSim only if splat capture ever enters the asset pipeline (R2 CDN already serves glTF/GLB). Log-only, no action.

### Hardware / Medical / Governance

- **Nothing new since 10:07.**

---

## Nothing New (Watchlist) — morning follow-ups resolved

| Morning follow-up | Status at 12:30 EDT |
|---|---|
| Meta Muse Glimmer specs | ✅ **RESOLVED** — shipped, specs above |
| Qwen3.8-Max weights ("week of Aug 10") | ⏳ **NOT YET** — no repo on the Qwen HF org as of today. Commitment stands for this week. [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) · [Developers Digest](https://www.developersdigest.tech/blog/qwen-3-8-max-release-2026) · [byteiota](https://byteiota.com/qwen3-8-open-weights-drop-this-week-read-before-you-download/). A **Qwen3.8-27B** is slated to drop alongside Max — that is the more practically deployable of the two. |
| Apple Foundation Models open-source ("later this summer") | ⏳ **NOT YET** — commitment with a timeline, no artifact. [WWDC26 session 241](https://developer.apple.com/videos/play/wwdc2026/241/) · [Blake Crosley](https://blakecrosley.com/blog/foundation-models-open-source). Companion `CoreAILanguageModel` + `MLXLanguageModel` also pending. ~5 weeks of summer left. |
| Gemini 3.5 Pro GA | ⏳ **STILL SLIPPED** — limited Vertex preview only; Google's own July 21 line is "currently testing with partners," no date. New unconfirmed rumor points at **August 12**. [Coursiv](https://coursiv.io/blog/gemini-3-5-pro) · [NPowerUser Aug 12 leak](https://nokiapoweruser.com/gemini-3-5-pro-launch-date-leaked-august-12/) · [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog). Treat the Aug 12 rumor with the same weight as the four rumors that already missed. Periodic-watch, per the morning report's own downgrade. |

All other watchlist items (D4RT code, Genie 3 dev API, Snap Specs date, NVIDIA T2000/T3000 ship, Ray-Ban Gen 3, Mayo/Microsoft model, ARPA-H report) — unchanged from this morning.

---

## Project Impact

### MedSim-Game (flagship)

**Muse Glimmer changes the on-prem inference shortlist, and it changes it in MedSim's favor.**

This morning's recommendation #3 was to add **Kimi K3** (2.8T MoE, 104B active) to the self-hosted eval matrix for the on-prem/DoD-adjacent tenancy question (`military-parallel-pipeline`, `medsim-school-employer-custom-content`). That recommendation stands, but Kimi K3 at 2.8T is a *serious* hosting commitment. Muse Glimmer is the other end of the same axis:

| | Kimi K3 | Muse Glimmer |
|---|---|---|
| Params | 2.8T MoE / 104B active | 30B dense |
| License | Modified MIT | **Apache 2.0** |
| Context | 1M | **32K** ← the disqualifier for long scenarios |
| Multimodal | text/image/video | text/image/video |
| Hosting | cluster | **1 GPU** |

**Recommended action:** add Muse Glimmer to the same eval matrix as a **floor** candidate, not a replacement for K3. Specifically test it on the two MedSim workloads where 32K context is *not* binding:
1. **LLM-as-judge / scenario grading** — short input, structured verdict. Glimmer's 74.6 DeepSearch QA and 75.5 MCP Atlas say it can hold a tool-use loop. If it grades competently, this workload leaves the paid API entirely.
2. **Narrative-continuity nodes** — the exact calls the morning report recommended dropping to `effort: low` on Opus 5. A local 30B may be cheaper still at acceptable quality.

Keep clinical-decision arbitration on Opus 5. **32K context is the hard line** — anything that needs full-scenario or full-physiology-graph context stays on Opus 5 or K3.

Cost: reversible, zero spend (Apache 2.0 weights, existing hardware or a spot GPU hour). Below the autonomy gate.

### MedCapture / Sim-Lab / 3rdrider / haptic-mirror

- No change since 10:07. The Jinju price drift ($379–$499 → $299–$399 in leaks) is directionally favorable to the 3rdrider partial-promote but is not new confirmation.

---

## Parked Idea Unblocks

Re-ran the `_ops/idea-vault/*.md` `blocked_on:` cross-reference against this run's single new item (Muse Glimmer).

**No parked ideas unblocked in this delta window.**

Muse Glimmer is an inference-tier improvement, not a capability unlock — it does not satisfy any parked blocker. Specifically checked and not moved:
- `haptic-mirror-d4rt` — needs video-to-3D-world reconstruction; Glimmer is video-*in*, not 3D-out. No.
- `ai-multiview-video-generator` — needs multi-view generative export. Glimmer does not generate video. No.
- `military-parallel-pipeline` / `medsim-school-employer-custom-content` — these are blocked on *market/customer* conditions, not on the availability of self-hostable weights. Glimmer improves the eventual economics but does not fire the blocker.

The two ideas that **did** move today (`3rdrider-snap-spectacles` → partial-promote, `ems-event-robot-fleet` → blocker composition 3→2) moved in the **morning** run. See [scout-2026-08-10.md](scout-2026-08-10.md) for those; they are not re-counted here.

---

## Notes on scope

- This is a same-day second pass, not a full daily cycle. It exists because the morning report's 22-day backfill closed with four dated follow-ups, one of which (Muse Glimmer) fired hours later.
- **Next scout (2026-08-11) should check:** Qwen3.8-Max + Qwen3.8-27B weights on HF/ModelScope (commitment is *this week*); Gemini 3.5 Pro against the Aug 12 rumor; Muse Glimmer first-week independent evals (the agentic benchmark numbers are vendor-reported).
- Do not re-log Muse Glimmer, Opus 5, Kimi K3, Unitree R1/IPO, Cosmos 3 Edge, or the SIGGRAPH paper batch as new — all captured 2026-08-10.
