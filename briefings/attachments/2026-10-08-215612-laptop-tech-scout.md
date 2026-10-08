# Tech Scout Report — 2026-10-08

**Window:** 2026-10-06 → 2026-10-08 (2 days; normal daily cadence, no gap backfill). No major industry event in window (AUSA Oct 12–14 is next).

**Verdict: not a thin day.** Three real releases in window: one changes MedSim's cost model, one is an AR hardware price point, and one is an edge decision-model drop that fits a family already being tracked.

1. 🟢 **Claude Haiku 5.5 shipped (Oct 7)**: `claude-haiku-5-5`, **$0.10 / $0.50 per MTok** (≤100k prompt), 10× cheaper input than Haiku 4.5. **This is the biggest lever for the MedSim NPC/scenario bill this quarter.**
2. 🟡 **XREAL Aura priced at $1,279 (Oct 7)**: Android XR, 70° FOV, Snapdragon Reality Elite puck. Pre-orders are limited to reservation-holders; the general public gets access "in the coming weeks." It does **not** unblock 3rdrider (>$800, no Rx stated).
3. 🟡 **Liquid AI open d1 (Oct 7 blog; HF repos created Oct 5)**: `d1-3B` + `d1-omni-600M` typed-decision models. **The 600M takes vision AND 30 s audio** at edge size. LFM 1.0 license: free under $10M revenue.

Per-run fetch targets turned up **two more changes**: **Lens Studio 5.24.1** (Oct 7) and **i4h v0.9 release candidates** (Oct 6–7). Both are minor.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **XREAL Aura: price + pre-orders (Oct 7)**: [PRNewswire, dateline Sunnyvale Oct 7](https://prnewswire.com/news-releases/xreal-aura-starts-at-1-279--bringing-wired-xr-glasses-with-android-xr-to-customers-this-year-302900445.html) · [The Shortcut](https://theshortcut.com/p/xreal-aura-xr-smart-glasses-cost-1279-dollars-and-are-now-available-for-pre-order)
  - **$1,279** (12 GB / 256 GB puck) and **$1,499** (16 GB / 512 GB).
  - Optical see-through, <95 g, **70° FOV**, hand tracking, Bose audio, tethered **Snapdragon Reality Elite** puck running **Android XR + Google Play**.
  - Ordering is open now **only to people who paid a reservation deposit before Oct 7**. The general public gets access "in the coming weeks." Shipping is "soon" in the US, CA, JP and KR.
  - The release does **not** state display resolution, camera spec, Rx support or SDK details.
  - **Why it matters:** first priced Android XR glasses. That makes Android XR a real deploy target alongside SPECS and Meta DAT. It is 1.6× the 3rdrider $800 threshold. Ray-Ban Meta Display (~$990) is still the closest product. `grep -F "1,279"` → first report.
- **Lens Studio 5.24.1 (Oct 7)**: [ar.snap.com/download](https://ar.snap.com/download)
  - Patch release. Adds SPECS `CursorVisualMode` translate/rotate modes. ⚠️ Existing scale-mode numeric values changed, so refer to modes by name.
  - Batched-shader CPU cut, plus fixes for batched shaders that never batched on device.
  - Nothing that changes a 3rdrider decision. Baseline advanced.
- **ENGO Titanium (sport AR HUD)**: [Auganix](https://www.auganix.org/ar-news-engo-titanium-smart-glasses/). 28.9 g. No camera, audio or AI by design, and no ship date in the source. Not relevant to any portfolio blocker; listed for dedupe only.
- **Snap newsroom:** newest post is still 09.30 ("Spend Smarter on Snapchat"). No SPECS ship date.
- **Meta DAT:** both repos still at `1.0.0` (2026-09-24). Unchanged.
- **Vuzix:** nothing new since Shrike (09-29). Next likely specifics at AUSA, Oct 12–14.

### Spatial Computing / 3D

- **NVIDIA Isaac for Healthcare v0.9 release candidates (Oct 6–7)**: [i4h-digital-twin v0.9.0-rc1](https://github.com/isaac-for-healthcare/i4h-digital-twin/releases) · [i4h-workflows v0.9-rc1](https://github.com/isaac-for-healthcare/i4h-workflows/releases) · `i4h-sensor-simulation v0.9.0-rc1`
  - These are **pre-releases**, the first tags since `v0.8.0` (09-02).
  - **digital-twin:** packages the already-reported Blackwell CUDA fix and the unified patient-digital-twin package (NV-Segment/NV-Generate import).
  - **workflows:** **signed i4h skills published + verified-artifact refresh for 12 skills**, plus a ported catheter-navigation RL stack with a dense shaped reward.
  - No new top-level directories in either repo.
  - **Why it matters:** low. The content is what 10-04/10-06 already covered, now cut as an RC. Watch for `v0.9.0` final.
- **Unchanged, all checked:**
  - `faster-gaussian-splatting`: only Watch/Fork events since 09-30.
  - `LichtFeld-Studio`: active commits on 10-08 (MCP sequencer tool error reporting, MP4-only export). Newest release is still `model-moge3-v1` (09-23).
  - three.js: `r186`.
  - `instant-nurec`: last commit 09-30.
  - World Labs blog: newest post is still 09-28.
  - `monai-physio`: PyPI still `2026.9.1`, even though the repo was pushed 10-08.
  - Marble notes and SpAItial: not re-fetched (both static since April; weekly cadence).

### AI / ML

- 🟢 **Claude Haiku 5.5: GA (Oct 7)**: [anthropic.com/claude-haiku-5-5](https://www.anthropic.com/claude-haiku-5-5)
  - Model ID `claude-haiku-5-5`. Available on the Claude Platform, Bedrock, Vertex and Azure.
  - **Pricing (≤100k / >100k prompt):** input $0.10 / $0.50, output $0.50 / $2.50, cache read $0.01 / $0.05. For comparison, Haiku 4.5 is $1 / $5.
  - **First Haiku with an effort setting.** Anthropic calls it its fastest model at standard speed.
  - Computer and browser use are in beta via the SDKs.
  - Benchmarks vs Haiku 4.5: OSWorld 2.1 offline **72.4% vs 15.7%**, Terminal-Bench 4.0 39.2% vs 0, HLE 45.9% / 57.4% with tools.
  - ⚠️ The new tokenizer uses slightly more tokens per task. The page states no context window.
  - **Why it matters:** closes the "Sonnet 5.5 / Haiku 5.5 within weeks" watch item from 09-24. See Project Impact.
- **Liquid AI open d1: `d1-3B` + `d1-omni-600M` (blog Oct 7; HF `createdAt` Oct 5)**: [liquid.ai/blog/open-d1](https://www.liquid.ai/blog/open-d1) · [HF d1-omni-600M](https://huggingface.co/LiquidAI/d1-omni-600M)
  - Typed **decision models**: you give a state plus named questions, and answers are read from the option distribution. There are **zero output tokens** and no parsing.
  - **d1-omni-600M** (587M params) takes **text + images + ≤30 s speech** in one forward pass and runs the same trunk weights for every modality.
  - d1-3B latency: **30 ms on M5 Pro**, 50 ms on Jetson Orin Nano. llama.cpp support covers Apple, AMD, Qualcomm and NVIDIA.
  - **License `lfm1.0`**: free commercial use below **$10M annual revenue** (the "Threshold"). The blog's "without restrictions" overstates it.
  - Verified on the HF API: public, `gated: false`.
  - ⚠️ The HF repos are dated **Oct 5**, which falls in the prior window. The 10-06 run missed them (`grep -F "d1-3B"` → zero hits). The announcement is Oct 7.
  - **Why it matters:** same family as Cloudflare Clef (27B) and Strands decider (2B), but this is the first one that is **audio-capable and laptop/edge-sized**. Evaluate all three together per the §2C rule.
- **Mistral Large 4: announced Oct 6, ⚠️ WEIGHTS NOT RELEASED**: [letsdatascience](https://letsdatascience.com/news/mistral-debuts-large-4-open-weight-model-preview-cbf9e0b5) · [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/21196/mistral-large-4-launches-open-weights-late-october)
  - 1.05T MoE, ~49B active, text + image input, 1M context.
  - Hosted API preview only. Weights are due "late October" (Oct 27 is reported but unconfirmed), with **no license stated**.
  - Checked the HF API: newest `mistralai` repo is from **2026-07-16**.
  - Watchlist item, same treatment as Reflection Beam.
- **Anthropic, Oct 8:**
  - [Anthropic Cyber Mission](https://www.anthropic.com/news/anthropic-cyber-mission): free OSS Scanner and a Critical Infrastructure Defense Program. Not a portfolio lever.
  - [2026 Usage Policy update](https://www.anthropic.com/news/2026-usage-policy-update), effective **Nov 12**. The healthcare high-risk requirements are **unchanged**: a qualified human reviews health-affecting recommendations, and the individual is told AI was used. MedSim is training, not care delivery, so no action.
- **Reflection Beam:** HF author search (`reflection-ai`, `ReflectionAI`, `reflectionai`, `Reflection-AI`) returns empty. **Still no weights.**
- **blog.google** (full list read): one new headline, "Making it easier to identify AI-generated content" (DeepMind; it carries no date on the index, so this run could not confirm whether it is in window). Argon is still second and still Fairwind-gated, with no API.
- **Cloudflare:** Oct 7–8 entries are One Client, Organizations GA, and Workflows batches. **No new Workers AI models.**
- **MCP blog:** unchanged (newest 08-22).
- **Android Developers blog:** unchanged (newest Oct 2). No XR posts.

### Hardware

- **XREAL Aura** (above) is the only in-window hardware price event.
- **Boox P6 Pro** announcement is tomorrow (Oct 9, China). Not reported until it ships.

### Medical / Clinical AI

Nothing shipped in window. The FDA CDRH FY2027 comment window (closes 11-30) is unchanged.

---

## Config corrections this run

- **Lens Studio baseline:** `5.24.0` → **`5.24.1` (2026-10-07)**.
- **Agent Plugins row is stale.** The config says "ZERO release tags and ZERO git tags." In fact an annotated tag **`v1.0.0` exists, tagger date 2026-09-28**. There are still 0 GitHub releases, and a v1.1.0 working draft started 08-12. That is a backfill, not news. The row's watch posture ("watch for a client shipping a reader") stands.
- **i4h baseline:** add `v0.9.0-rc1` / `v0.9-rc1` as pre-release baselines. The exit condition is `v0.9.0` final.
- **Typed-decision family row (§2C second-tier):** add **Liquid AI d1** next to Clef and Strands decider.

---

## Nothing New (Watchlist)

- **Mistral Large 4 weights**: ➕ NEW. Due late October. Exit condition: public weights + a license file.
- **Reflection AI Beam weights**: still absent from HF (re-checked 10-08). Promised "this month."
- **Gemini 4 Argon API**: still Fairwind-gated. No model ID, no AI Studio, no Vertex.
- **Genie 3 public API**: none. Still Labs/Ultra.
- **Apple Foundation Models open-source**: no repo. Week 18+.
- **D4RT code/weights**: nothing (no longer a blocker).
- **Qwen 4**: roadmap-only. The newest Qwen HF repo is still 09-20.
- **World Labs Atlas API**: early access only. The AMD deal is pending.
- **Snap Specs ship date**: still "fall." No date.
- **XREAL Aura general-public ordering + ship date**: ➕ NEW. "Coming weeks" / "soon."
- **Ray-Ban Meta Audio first ship**: **Oct 13** (5 days).
- **Vuzix Shrike price/SDK**: none. AUSA is Oct 12–14.
- **Meta VR Start competition**: closes 11-18.
- **FDA CDRH FY2027 comments**: close 11-30 (53 days).
- **i4h v0.9.0 final**: ➕ NEW.
- **Boox P6 Pro (Oct 9) / new generation (Oct 19)**: pre-announcement.
- ✅ **Closed: Haiku 5.5** shipped Oct 7.

---

## Project Impact

**MedSim-Game (flagship)**
- **Haiku 5.5 changes the LLM-NPC cost model.** At $0.10 / $0.50 with $0.01 cache reads, high-volume NPC dialogue is priced 10× below Haiku 4.5 on input.
  - It also has an effort knob and computer use, at an OSWorld score that Haiku 4.5 could not approach.
  - **Action:** route NPC turns, scenario-variation generation and telemetry/eval classification through `claude-haiku-5-5`. Keep Sonnet/Opus for authoring and the clinical-review path.
  - ⚠️ Re-measure tokens per turn, because the new tokenizer runs slightly heavier.
- **Decision-model family (Clef / Strands decider / d1):** typed, parse-free answers are the right shape for **scoring player actions against protocol checkpoints**, for example "did they check the airway before…".
  - A local d1-3B at ~30 ms on Apple silicon could do that with no API cost.
  - This is worth one evaluation spike, not a build.

**MedCapture / SmartBadge**
- **d1-omni-600M is the first edge-sized model that takes speech + image + text and returns typed decisions.** That is the shape of on-device capture triage, for example "is this utterance a med administration? which drug?", with no PHI leaving the device.
  - It complements DAT 1.0.0's `TranscriptionResult`.
  - Note the $10M revenue license threshold, which is irrelevant at the current stage.

**3rdrider / wearables**
- XREAL Aura at $1,279 is a **second priced platform** (Android XR) and does not cross the $800 threshold.
- Android XR now has hardware with a price, which matters for "which SDK to bet on." It does not change the parked status.

**Haptic Mirror:** no change. **BadgeMedia:** no signals (third consecutive run).

---

## Parked Idea Unblocks

- **Idea:** Resume 3rdrider when consumer-grade AR glasses ship at viable price/form
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"
  - **What changed:** **XREAL Aura is priced at $1,279** (Android XR, Google Play, 70° FOV, hand tracking). It is reservation-holders only for now, and the release does not state Rx support.
  - **Recommended action:** **WAIT.** It is 1.6× the price threshold and Rx is unconfirmed. Record Android XR as a third SDK route next to SPECS and Meta DAT.

**No other parked ideas were unblocked.**
- `ai-multiview-video-generator.md`: Genie 3 still has no public API.
- `haptic-mirror-d4rt.md`: the blocker is market, not tech.
- `medcapture-hand-kinematics-robotics.md`: the blocker is a pilot plus procurement intent, which no external release here touches.
- `ems-event-robot-fleet.md`: no Unitree pricing news.
- All other entries gate on internal milestones and are unchanged.

---

## Per-Run Fetch Targets

| Target | Result 2026-10-08 |
|---|---|
| Lens Studio | ⬆️ **5.24.1 (Oct 7)** |
| Snap Newsroom | ✅ Newest 09.30. Unchanged |
| Meta DAT Android / iOS | ✅ 1.0.0. Unchanged |
| World Labs blog | ✅ Newest 09-28. Unchanged |
| MCP blog | ✅ Newest 08-22. Unchanged |
| blog.google (full list) | ⬆️ New DeepMind AI-content-ID headline (date not confirmable); Argon still gated |
| Cloudflare changelog | ✅ No new Workers AI models |
| Anthropic news | ⬆️ **Haiku 5.5 (Oct 7)**, Cyber Mission + Usage Policy (Oct 8) |
| Android Developers blog | ✅ Newest Oct 2. No XR |
| faster-gaussian-splatting `/events` | ✅ Watch/Fork only |
| LichtFeld-Studio | ✅ Commits, no new release |
| three.js | ✅ r186 |
| instant-nurec | ✅ 09-30 |
| isaac-for-healthcare | ⬆️ **v0.9 RCs** (pre-release) |
| Project-MONAI / PyPI | ✅ 2026.9.1 |
| HF: Reflection / Mistral / Qwen | ✅ No Beam, no Large 4 weights, no new Qwen |
| HF: LiquidAI | ⬆️ **d1-3B / d1-omni-600M** (created 10-05) |
| agent-plugins-spec | ⚠️ `v1.0.0` tag exists (09-28). Config row was stale |
