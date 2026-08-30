# Tech Scout Report — 2026-08-18

**Window:** 2026-08-17 → 2026-08-18 (normal daily cadence; prior report 2026-08-17 covered the Aug 10–17 backfill). No major industry event in-window (next: Snap SPECS launch Sep 16, Meta Connect Sep 23–24).

**Verdict: thin day, as expected.** One version-diff hit (Lens Studio 5.23.2, bugfix), one Google ADK security post, commit-level activity on LichtFeld-Studio. **Two items surfaced that were inside last week's window but never logged** — OpenAI Ultrafast mode (Aug 13) and the Muse Glimmer ExecuTorch on-device export (Aug 10/15) — logged below as backfill catches, not as today's news. No AR hardware, no world-model release, no FDA clearance, no new open weights.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- **Lens Studio 5.23.2 — released August 17, 2026** (version-diff hit; prior baseline 5.23.1 / Aug 5). [ar.snap.com/download](https://ar.snap.com/download). Bugfix only: Image components using an instanced material with mipmaps rendered correctly for a few frames then dropped every instance except the first. Still the SPECS-27 developer track; Spectacles (2024) stays on 5.15.x. **Why it matters:** none beyond keeping the 3rdrider toolchain current — log, don't act.
- **Snap Newsroom — flat.** Newest post remains **07.31.26** ("Rewarding Authentic Creativity on Spotlight"); SPECS launch post 07.30.26 unchanged. Zero August posts. [newsroom.snap.com](https://newsroom.snap.com/)
- **Samsung Galaxy Glasses (Jinju) — no announcement in-window.** A retail "release calendar" page ([Dymesty](https://dymesty.com/blogs/articles/smart-glasses-release-calendar-2026)) asserts an "August 2026 release"; every primary-adjacent source ([VR.org](https://vr.org/articles/samsung-galaxy-glasses-leak-jinju-haean-one-ui-android-xr), [Android Headlines](https://www.androidheadlines.com/samsung-galaxy-glasses)) still says late 2026 / fall, $379–$499, display-less. **Treat "August" as summary specificity, not a date. Do not re-chase.**
- Android XR / Catalyst — no update in-window.

### Spatial Computing / 3D
- **LichtFeld-Studio — genuine master pushes Aug 18, no release** (last tag v0.5.3, Jun 24; `model-moge2-v1` Jul 5). Verified via `/commits` + `/events`, not `pushed_at`:
  - #1658 **Persistent MCP server management + privacy-safe diagnostics** — MCP config now lives in `preferences.json` (enabled state, loopback vs local-network binding, port, request logging), editable from Preferences/status bar without restart; loopback-on by default, network exposure opt-in. Incremental to the MCP hooks already logged 08-05/08-09.
  - #1673 **FastGS forward blend speed-up** (dual-pixel threads + `__expf`).
  - #1670/#1671 Sequencer camera-path JSON Windows fixes; #1668 Wayland window fix.
  [github.com/MrNeRF/LichtFeld-Studio](https://github.com/MrNeRF/LichtFeld-Studio). **Why it matters:** the MCP surface is now durable/config-driven — the "scriptable from this workstation" note from 08-05 gets stronger, not new.
- **DeepMind D4RT — flat.** [OpenD4RT](https://github.com/Lijiaxin0111/Open-d4rt) last commit Aug 12 (PR #18, evaluation aspect-ratio fix — maintenance, not a capability). Official code: still none. Watchlist week 15.
- **faster-gaussian-splatting** — no pushes (events: 1 fork, 3 watches). **SpAItial blog** — newest still Echo-2, 2026-04-28. **World Labs release notes** — not re-fetched today (baseline 2026-04-02; weekly cadence).
- **Zero-hit-name verdict — "Splat Analyzer"** ([nigelhartman/splat_analyzer](https://github.com/nigelhartman/splat_analyzer)): ✅ **Real, but NOT new** — created 2026-06-07, last push 2026-07-20, MIT, ~100 stars. Renders density-sampled RGB+depth views of a splat (gsplat / gsplat-metal), runs OWLv2 open-vocabulary detection, emits labeled 3D bounding boxes to `interactions.json`; ships a REST/upload server. **Relevance:** auto-tagging objects in a captured room splat (the `?clinic` scene, or any haptic-mirror capture) into interaction anchors — a one-afternoon spike, not a blocker-mover. Surfaced only because it was in a search summary; logged so the next run doesn't re-chase it.

### AI / ML
- **Google — "Build zero-trust AI agents with Google's Agent Development Kit" (Aug 17).** [developers.googleblog.com](https://developers.googleblog.com/). Hardware-backed cryptographic signatures for DB writes, gVisor kernel-level sandboxing for dynamic code. Pattern piece for the MedSim LLM-NPC / scenario-agent boundary; nothing to adopt today.
- **Backfill catch — OpenAI Ultrafast mode for GPT-5.6 Sol (changelog dated Aug 13; never logged in any prior report).** [developers.openai.com/api/docs/changelog](https://developers.openai.com/api/docs/changelog): new API service tier, "up to 14× faster than Standard," **limited preview, sign-up required.** Third-party coverage attributes it to Cerebras at ~750 output tok/s — **that attribution is not on the OpenAI changelog; treat as unverified.** Same changelog also confirms Aug 7 Daybreak Blue/Red tiers and Aug 5 Fast-mode >272K context — both already logged. **Why it matters:** if the preview opens, a 14× tier changes the latency budget for real-time NPC dialogue in MedSim; today it is waitlist-only.
- **Backfill catch — Muse Glimmer 30B ExecuTorch export** ([meta-models/Muse-Glimmer-30B-ExecuTorch-PTE](https://huggingface.co/meta-models/Muse-Glimmer-30B-ExecuTorch-PTE), created Aug 10, updated Aug 15, Apache 2.0, ~7.2k downloads). Verified via HF blob listing: `.pte` bundles for **Metal** and **sm80+ptx**, text and text+image variants, "k-quant-17G-128K", solo and dflash (draft-model) builds; **files are 18–21 GB** (+ separate `.ptd` weight files up to 28.6 GB on CUDA). **This is workstation/Mac-class ExecuTorch, not phone-class** — do not read "ExecuTorch" as "runs on the MedSim mobile client." It does confirm a supported Apple-Silicon local path for the scenario-generation spike recommended 08-17.
- **Muse-Glimmer-30B-GGUF** repo touched Aug 18 (already logged). Contents for reference: `Q4_K_M` 16.8 GB, `Dynamic-Q4_K_XL` 19.7 GB, `dflash` draft 1.6 GB, `mmproj` 1.4 GB.
- **HF author sweeps (flat vs. yesterday):** `Qwen` newest = Qwen3.8-27B / -FP8 (Aug 14) + Qwen3.8-2.4T-A95B (Aug 12) — all logged; **no Qwen3.8-Max full-feature drop.** `zai-org` newest = GLM-5 (Aug 11) — **GLM-5.3 weights not up** (target Aug 28). `deepseek-ai` newest = V4-Pro-0813 (logged). Anthropic news newest = Aug 14 watermark post (logged). MCP blog newest = 2026-07-28 spec (logged).

### Hardware
- **Nothing shipped in-window.** Boox (Palma 3 / Note Air6 C / Note Mini C / Tab Elite still "soon"), Jetson T-series (Q1 2027), Unitree/Figure/Optimus — no SKU or price moves.

### Medical / Clinical AI
- **No FDA clearances in-window.** UpDoc K253281 remains the sole patient-facing-LLM 510(k). NVIDIA `isaac-for-healthcare` — last push `i4h-workflows` Aug 11, no release; `Cosmos-H-Dreams` last push Jul 27. MONAI latest still 1.6.0 (Jun 11).

---

## Nothing New (Watchlist)
- **Snap SPECS launch** — Sep 16, Los Angeles (**29 days**). Only dated AR hardware event.
- **Meta Connect** — Sep 23–24 (Ray-Ban Gen 3 expected).
- **Z.ai GLM-5.3 open weights** — target Aug 28 (10 days); `zai-org` HF empty of it as of today.
- **Meta Muse Spark 1.2 open weights** — committed, no date.
- **Alibaba Qwen3.8-Max full weights** (vision + 1M ctx, permissive license) — partial only.
- **Apple Foundation Models framework open-source** — WWDC promise, ~3 weeks of "summer" left. Week 10.
- **DeepMind D4RT official code** — week 15.
- **Gemini 3.5 Pro GA** — fifth slip; 3.7 Flash shipped ahead of it.
- **Genie 3 developer API** — Ultra-only.
- **OpenAI Ultrafast tier GA** — new watchlist item (limited preview since Aug 13).
- **Cursor Origin GA**, **NVIDIA GR00T N2**, **Onyx Boox Palma 3 / Note X6**, **Mayo + Microsoft healthcare model**, **ARPA-H simulation workshop report**, **Android XR Catalyst second cohort** — unchanged.

---

## Project Impact
- **MedSim-Game (flagship):** nothing actionable today. Two footnotes to yesterday's Muse Glimmer recommendation: (1) the ExecuTorch Metal export is a legitimate second local-run path on the Mac for the offline scenario-generation spike, and (2) it is 18–21 GB — irrelevant to the mobile client. Ultrafast tier is a latency lever to re-check when the preview opens.
- **3rdrider (parked):** Lens Studio 5.23.2 is a bugfix; nothing to do until Sep 16.
- **haptic-mirror (parked):** Splat Analyzer is a cheap object-tagging step downstream of any capture→splat pipeline (Marble/SpAItial/WorldExplorer); note for the eventual spike, not a trigger.
- **MedCapture / BadgeMedia:** no impact.

## Parked Idea Unblocks
No parked ideas unblocked. Checked all 27 `_ops/idea-vault/*.md` `blocked_on:` fields against today's items — nothing in-window touches a blocker (D4RT still absent; no <$800 AR glasses with SDK; no Genie multi-view API; no robot price moves; no MedCapture-pilot / commercial gates changed by external news).
