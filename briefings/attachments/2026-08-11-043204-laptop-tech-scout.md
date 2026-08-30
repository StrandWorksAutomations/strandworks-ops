# Tech Scout Report — 2026-08-11

**Window:** 2026-08-10 12:30 EDT → 2026-08-11 (normal daily cadence; prior report [scout-2026-08-10-run2.md](scout-2026-08-10-run2.md)).

**Verdict: thin day.** Nothing new shipped in AR/smart glasses, spatial computing, hardware, or medical AI in the window. Per the daily cadence rule that is the expected result, not a failure.

Two things did move, both follow-ups the last run explicitly asked this run to check:

1. **Muse Glimmer quantized weights landed** (~1h after run 2 closed) — and empirical sizing says **it will not run on Jonathan's Mac** at usable quality. This corrects the deployment assumption in yesterday's recommendation.
2. **Gemini 3.5 Pro's "August 12" rumor now has a confirmed mechanism** — Google has an on-the-record hardware event tomorrow.

---

## Breakthroughs & Releases Since Last Report

### AI / ML

- **Muse Glimmer 30B — GGUF quants shipped, and the "runs on a laptop" claim does not survive contact with this laptop.**
  [unsloth/Muse-Glimmer-30B-GGUF](https://huggingface.co/unsloth/Muse-Glimmer-30B-GGUF) · [meta-models/Muse-Glimmer-30B](https://huggingface.co/meta-models/Muse-Glimmer-30B) · [VentureBeat](https://venturebeat.com/technology/meta-returns-to-open-source-with-muse-glimmer-an-apache-2-0-licensed-30b-parameter-ai-model-optimized-for-agents-available-now)

  Yesterday's run flagged a contradiction: Bloomberg said "run on their laptop," the model card said 1×80GB H100. The quantized path now exists — repo `lastModified` **2026-08-10T17:24 UTC**, i.e. ~1 hour after run 2 closed at 12:30 EDT. **20 GGUF files**, including separate `mmproj-*` vision projectors (so the multimodal path survives quantization, not just text).

  Sizes pulled directly off HF (`content-length`, not from a blog):

  | Quant | Size | + mmproj Q8 (1.9 GB) | Fits 16 GB Mac? |
  |---|---|---|---|
  | UD-Q2_K_XL | 11.6 GB | 13.5 GB | marginal, quality-degraded |
  | UD-Q3_K_XL | 12.4 GB | 14.3 GB | no headroom |
  | UD-IQ3_M | 13.2 GB | 15.1 GB | **no** |
  | UD-Q4_K_XL | 14.8 GB | 16.7 GB | **no** |
  | UD-Q5_K_M | 17.9 GB | 19.8 GB | no |
  | UD-Q6_K_XL | 24.5 GB | 26.4 GB | no |
  | Q8_0 | 27.6 GB | 29.5 GB | no |

  This machine has **16 GB unified memory** (`hw.memsize`, verified). Q4_K_XL — the lowest quant most people consider honest for agentic tool-use — needs 16.7 GB *before* KV cache, OS, or anything else running. **It does not fit.** The only quants that fit are Q2/Q3-class, which is exactly where tool-calling reliability degrades first, which is the one thing this model was picked for.

  **Correction to yesterday's action item:** the Muse Glimmer eval belongs on the **Shadow VM** (wake-on-demand heavy-worker tier) or a spot GPU hour, not on the Mac. Still zero-spend-ish and reversible; still below the autonomy gate. The recommendation stands, the venue changes.

- **Muse Glimmer independent evals — partially resolved, still not clean.**
  [Wavect benchmark guide](https://wavect.io/blog/muse-glimmer-30b-local-agent-guide/) · [kingy.ai](https://kingy.ai/blog/muse-glimmer-30b-benchmarks-hardware-run/) · [Medium/Mehul Gupta](https://medium.com/data-science-in-your-pocket/meta-muse-glimmer-30b-the-new-mid-sized-llm-king-c7aae687783a)

  Fuller numbers now circulating: **94.7 AIME 2026**, **51.2 SWE-Bench Pro**, 75.5 MCP Atlas, 74.6 DeepSearch QA, 23.5 τ3-Banking, 47.6 WildClawBench. Two caveats that matter more than the headline:
  - Meta's own methodology note says it **selected the more favorable of a competitor's self-reported score or Meta's reproduction**. That is a thumb on the scale, disclosed.
  - Glimmer **leads** Gemma 4 31B / Qwen 3.6 27B on MCP-Atlas, DeepSearch QA, SWE-Bench Pro but **trails Qwen on Terminal-Bench 2.1 and OSWorld-Verified**.

  Read: it is credible in the 30B class for *tool-call* agentic work, weaker on *environment-driving* agentic work. That maps cleanly onto the two MedSim workloads proposed yesterday — LLM-as-judge and narrative-continuity are both tool-call-shaped, not environment-driving. Thesis intact.

### AR / Smart Glasses

- **Nothing shipped.** No change on Samsung Jinju pricing, Snap Specs date, Ray-Ban Gen 3, or XREAL. Google's **Pixel Buds Sight** remain confirmed for **November 2026** — unchanged, already logged.

### Spatial Computing / 3D

- **Nothing shipped.** No D4RT code. No new 3DGS release in-window; the FastGS / OpenUSD 26.03 / World Labs Spark 2.0 `.rad` items surfacing in search are all previously-dated, not new today.

### Hardware / Medical

- **Nothing new.** No new FDA AI clearance in-window (most recent remain UpDoc, cleared Dec 2025 / announced June 2026, and Aidoc's foundation-model triage clearance from January 2026 — both long-logged).

---

## Nothing New (Watchlist)

| Item | Status |
|---|---|
| **Qwen3.8-Max / Qwen3.8-27B weights** | ❌ **STILL ABSENT — verified empirically today.** `Qwen/Qwen3.8-27B`, `Qwen/Qwen3.8-Max`, `Qwen/Qwen3.8-Max-Instruct` all return **401** from the HF API — byte-identical to the control probe `Qwen/Qwen-DoesNotExist-9999`. The promised "week of Aug 10" has now elapsed with no artifact and **no new date from Alibaba**. [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) · [TestingCatalog](https://www.testingcatalog.com/qwen-released-qwen3-8-max-with-open-weights-coming-soon/) · [Developers Digest](https://www.developersdigest.tech/blog/qwen-3-8-max-release-2026). The alleged USA/EU/UK/Korea license prohibition ([latent.space, Aug 4](https://www.latent.space/p/ainews-qwen-38-max24t-and-27b-new)) is **still unaddressed by Alibaba** — logged 08-05, not re-counted. **Recommendation: downgrade Qwen3.8 from active-watch to periodic-watch.** Two missed self-imposed dates plus an unresolved license cloud is enough. |
| **Gemini 3.5 Pro GA** | ⏳ **Still preview-only — but the Aug 12 rumor now has a real mechanism.** See below. Fourth slip (June → July → July 17 → August). [NPowerUser Aug 12 leak](https://nokiapoweruser.com/gemini-3-5-pro-launch-date-leaked-august-12/) · [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog) |
| **Meta "even bigger models coming soon"** | 📋 **Roadmap only — watchlist, not a release.** Zuckerberg's 14-page essay *"The Future is for Everyone"* accompanied the Glimmer drop and promises larger open-weight models. [SRN](https://srnnews.com/meta-launches-new-ai-model-as-zuckerberg-champions-open-weight-push/) · [American Bazaar](https://americanbazaaronline.com/2026/08/10/meta-to-release-new-ai-models-weights-486101/). No date, no artifact — reported under the no-roadmap rule only because it sets an expectation the next scout should test. |
| D4RT code, Genie 3 dev API, Snap Specs date, NVIDIA T2000/T3000, Ray-Ban Gen 3, Apple Foundation Models open-source, Mayo/Microsoft model, ARPA-H report | Unchanged from 08-10. |

---

## Event Sweep — Made by Google, **tomorrow**

Per the standing rule to sweep the nearest major industry event: **Made by Google 2026 is confirmed for Wednesday 2026-08-12, 6:00 PM ET, in New York**, in person + YouTube livestream. Confirmed on **Google's own store page** ("The next generation. Google Pixel 11. August 12.") and by press invites.
[store.google.com](https://store.google.com/magazine/google_pixel_11?hl=en-US) · [9to5Google, invite](https://9to5google.com/2026/07/07/made-by-google-2026-invite/) · [Android Central](https://www.androidcentral.com/phones/google-pixel/pixel-11-event-announced)

Expected: Pixel 11 / 11 Pro / 11 Pro XL / 11 Pro Fold, Pixel Watch 5.

**Why this is in the report and not filed as rumor noise:** the free-floating "Gemini 3.5 Pro launches August 12" leak has been treated here as low-weight because four prior dates missed with no mechanism behind them. This one has a mechanism — Google has a confirmed stage on that exact date, and a flagship Gemini GA is exactly the kind of thing that gets attached to a hardware keynote. That does not make the leak true. It makes it **testable tomorrow**, which the previous four were not.

Also worth watching at the same event: any Android XR / **Pixel Buds Sight** hardware detail (currently Nov 2026), which is the live thread for `3rdrider-snap-spectacles`.

---

## Project Impact

### MedSim-Game (flagship)

- **One correction, no new direction.** Yesterday's "add Muse Glimmer to the on-prem eval matrix as a floor candidate" stands — Q4-class quants exist, vision projector survives quantization, Apache 2.0, and the benchmark shape (strong tool-call, weak environment-driving) matches the two proposed workloads. **What changes is where it runs:** not the 16 GB Mac. Route to Shadow VM or a spot GPU hour.
- **The 32K context ceiling remains the hard line.** Clinical-decision arbitration and anything needing full-scenario or full-physiology-graph context stays on Opus 5.
- **Qwen3.8-27B should stop being counted as a pending option** in the self-hosted matrix. Two missed dates + unresolved geographic license prohibition. Muse Glimmer now occupies that slot on the merits, with a license that is actually legible.

### MedCapture / Sim-Lab / 3rdrider / haptic-mirror

- No change. The only thread with a near-term test is `3rdrider` against tomorrow's Google event.

---

## Parked Idea Unblocks

Re-ran the `_ops/idea-vault/*.md` `blocked_on:` cross-reference against this window.

**No parked ideas unblocked.**

Explicitly checked and not moved:
- `haptic-mirror-d4rt` — blocker is D4RT code release *or* equivalent open 3D-world-reconstruction tooling. Nothing shipped. Quantized Glimmer is video-**in**, not 3D-**out**. No movement.
- `ai-multiview-video-generator` — blocker is multi-view export from Genie-class models, or a Blender/3DGS pipeline gated behind `display-cube-six-screens`. Neither moved.
- `3rdrider-snap-spectacles` — blocker (<$800 consumer AR glasses w/ SDK) was already partial-satisfied on 08-10. No new hardware today. Tomorrow's Google event is the next real test.
- `military-parallel-pipeline`, `medsim-school-employer-custom-content` — blocked on market/customer milestones, not on weight availability. Glimmer's quantized release improves eventual economics; it does not fire either blocker.
- `runway-dev-portal-exploration` — `active`, blocked only on ~$25 of credits. Unrelated to this window, but flagging that it is the one vault item whose blocker is a decision, not an external event.

---

## Notes for the next scout (2026-08-12)

1. **Sweep Made by Google** (Aug 12, 6 PM ET) in full — Pixel 11 line, Watch 5, any Android XR / Pixel Buds Sight detail, and specifically whether **Gemini 3.5 Pro GA** is announced there. This is the falsifiable test of a rumor that has missed four times.
2. Qwen3.8 → **periodic-watch**. Do not re-probe HF daily; check weekly unless Alibaba names a date.
3. Do not re-log as new: Muse Glimmer (08-10), the GGUF quants (this report), Kimi K3, Opus 5, MiniMax H3 (07-28), Unitree R1/IPO, Cosmos 3 Edge, the SIGGRAPH paper batch, FastGS / OpenUSD 26.03 / World Labs Spark 2.0.
