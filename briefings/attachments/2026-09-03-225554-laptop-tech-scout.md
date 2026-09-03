# Tech Scout Report — 2026-09-03

**Window:** 2026-09-01 → 2026-09-03 (2 days; normal cadence — no gap backfill).

**Major events swept:** **IFA Berlin Media Days Sep 2–3** (in-window; show floor Sep 4–8) and **CrowdStrike Fal.Con 2026**. Next: IFA floor + RayNeo on-sale **Sep 4**, **Apple event Sep 9**, **Snap Specs Sep 16**, **Meta Connect Sep 23–24**.

**Headline:** two medical-simulation drops — the highest-value category for this portfolio — landed on the same day and neither came from an AI-news feed. **NVIDIA Isaac for Healthcare v0.8.0** shipped a full runtime rewrite with ultrasound + patient-twin workflows, and a source sweep surfaced **`Project-MONAI/physiotwin4d`**, an Apache-2.0 personalized-physiology digital-twin toolkit that has **never appeared in any scout report**. On the model side Google shipped **Gemini 3.8 Flash** GA and Meta shipped **Muse Spark 1.3** (closed weights again — the 1.2 open-weights promise is now formally re-based with no date). Two prior-report claims are corrected below, one of which weakens a standing recommendation.

**Method notes (log, don't repeat):** (1) Both medical-sim items came from **direct org/repo API sweeps** (`isaac-for-healthcare`, `Project-MONAI`) — the §D "query these by name" rule earned its keep again; neither surfaced in any news query this run. (2) `physiotwin4d` was missed by **every prior run** because §D lists `github.com/Project-MONAI` as a target but past runs checked the flagship `MONAI` repo rather than enumerating the **org's repo list sorted by push date** — enumerate the org, don't check the headline repo. (3) `WebFetch` on the Isaac v0.8.0 release page returned the date as "September 2, **2021**"; the GitHub API gave `2026-09-02T21:00:34Z`. **Do not take dates from WebFetch summaries — confirm against the API.** (4) The `physiotwin4d` `pushed_at` today was a `nightly-status` branch push (housekeeping); `/events` correctly separated it from the real Aug 26–31 feature work, per the §2B push-monitoring warning.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **RayNeo iO / GT / GT Max fully specced and priced at IFA Media Days (Sep 2–3); on sale Sep 4** — [Engadget](https://www.engadget.com/2241335/rayneo-ar-smart-glasses-io-gt-series/) · [Notebookcheck](https://www.notebookcheck.net/RayNeo-unveils-iO-Smart-Glasses-with-display-cinematic-RayNeo-GT-Series-with-up-to-307-inch-screen.1374359.0.html) · [IFA event page](https://www.ifa-berlin.com/programme/rayneo-new-smart-glasses-launch-event). This resolves the pricing unknown the 09-01 report deferred to the Sep 4 run.
  - **iO — $479 ($529 with charging case), 33 g.** Monochrome **green** waveguide (Firefly Nano engine, Blue Lake waveguide, 97% transparency, up to 1,300 nits), **4 microphones**, bone-conduction sensor, magnesium-aluminium + titanium frame. **No camera. No speakers.**
  - **GT Max** — 267" virtual display, 59° FOV, Peacock Optical Engine 3.0 Max, Dolby Vision, quad racetrack speakers tuned with Bang & Olufsen.
  - **3rdrider threshold verdict: FAILS.** Price ✅ (<$800), display ✅, mic ✅, **camera ❌**, SDK ❓ (RayNeo has published no developer program for iO). The iO is deliberately a camera-free privacy-first design — it cannot run a "look at a thing, ask about it" loop. See Parked Idea Unblocks.
- **Snap — nothing new.** Newsroom headline list unchanged (newest still "SPECS Launch on September 16," posted Jul 30). **Lens Studio still 5.23.2** (Aug 17) per the download-page version diff.
- No Android XR / Compose for XR movement in-window.

### Spatial Computing / 3D

- 🔧 **CORRECTION — VGGT-Ω checkpoints are GATED, and the released 1B model carries a benchmark-contamination notice.** This corrects the standing recommendation carried in the 08-10 and 08-17 reports ("run VGGT-Omega on a short capture as the pragmatic substitute"), which described it as an open-source option without either caveat. Verified today at [facebook/VGGT-Omega](https://huggingface.co/facebook/VGGT-Omega) and [facebookresearch/vggt-omega](https://github.com/facebookresearch/vggt-omega):
  - **Weights return HTTP 401.** `LICENSE.txt`, `README.md`, and every `.pt` file are access-restricted; the repo README states access must be requested and *"requests are reviewed by an automated process based on the information provided in the request,"* and that the paper authors cannot approve or reject applications. The [HF Space demo](https://huggingface.co/spaces/facebook/vggt-omega) is ungated — the demo is public, the checkpoints are not.
  - **Contamination notice, committed Aug 18** (commit message literally `notice`): *"We recently became aware of an issue that may have caused benchmark contamination in an ancestor checkpoint of the released 1B model. As a result, the performance of the released 1B model as reported in Table 1 and 2 (1B row) may be inflated."* The headline **77% Sintel camera-accuracy improvement** should be treated as unconfirmed. `grep -il "contaminat" scout-*.md` → **0 hits**; missed by all nine runs since Aug 18.
  - No release tags on the repo; only three commits total (Initial + two `notice` commits).
- **LichtFeld-Studio — heavy in-window commit activity, still no app tag.** Sep 3: v2 theme families + adaptive viewport chrome (#1956), deferred splat loads no longer collide with the async import slot (#2015), autosave no longer collides with its own geometry capture (#2013), viewport rail re-flow (#2012), two Windows compile/test-link regression fixes (#2007, #2009) — [repo](https://github.com/MrNeRF/LichtFeld-Studio). Last app tag still **v0.5.3 (Jun 24)**.
- **Flat, confirmed by direct diff:** Marble release notes newest still **2026-04-02**; SpAItial blog newest still **Echo-2, 2026-04-28**; `nerficg-project/faster-gaussian-splatting` last commit **Aug 20**; **D4RT official code — still none (week 19)**; Genie 3 still Project-Genie-only at AI Ultra $200/mo, **no developer API**.

### AI / ML

1. **Google Gemini 3.8 Flash — GA Sep 2.** [The Register](https://www.theregister.com/ai-and-ml/2026/09/02/with_gemini_38_flash_google_reminds_everyone_its_still_in_the_race/5294049) · [9to5Google](https://9to5google.com/2026/09/02/gemini-3-8-flash-launch/) · [DataCamp](https://www.datacamp.com/blog/gemini-3-8-flash-cyber). Model id **`gemini-3.8-flash`**, generally available for production. **Intro pricing $0.75 / $3.75 per MTok through 2026-12-31.** **Terminal-Bench 2.1 90.8%** (3.7 Flash: 81.6%); beats most larger frontier models on DeepSWE v1.1 long-horizon coding. Third Flash update in six weeks; arrived three weeks after 3.7 Flash. Ships alongside a restricted **Gemini 3.8 Flash Cyber** variant — a **fourth on-record instance of the cyber-gating norm** (with GLM-5.3, GPT-5.6-Cyber, Astra), and again the outcome is graduated access, not cancellation.
2. **Meta Muse Spark 1.3 — Sep 2, closed weights; the open-weights promise is re-based, not delivered.** [Meta AI Research](https://research.meta.ai/blog/introducing-muse-spark-1-3) · [MarkTechPost](https://www.marktechpost.com/2026/09/03/meta-ai-released-muse-spark-1-3-an-agentic-coding-model-that-uses-20-fewer-tool-calls-and-25-fewer-tokens-than-muse-spark-1-2/) · [The Register](https://www.theregister.com/ai-and-ml/2026/09/02/zucks-muse-to-spark_joy_with_open_weights_release_soon/5294093). ~**20% fewer tool calls, ~25% fewer tokens** than 1.2; **DeepSWE 1.1 75.4%**, 98.5% long-context retrieval, 1M context. Same-day in Muse Code + Meta Model API, paid API Sep 3. **Watchlist resolution:** Zuckerberg posted on X (Sep 2) that open weights for Muse Spark are coming **"soon"** — no date. The specific **Muse Spark 1.2 open-weights commitment (Day 23) is now superseded by a fresh undated promise on a newer model.** Confirmed absent from HF: `facebook` org newest is `VGGT-Omega` (Sep 2 touch) then `MobileMoE-*-QAT` (Aug 30); the only `Muse-Spark` search hit remains the third-party `MuseSparkAI/musespark-video`. This is the **fourth consecutive week** of the credibility asymmetry logged on 08-31.
3. 🔧 **CORRECTION — `apple/coreai-models` is NOT empty.** The 08-31 report stated *"the `apple/coreai-models` GitHub org exists but has not been populated."* It is a **repository**, not an org, and it is substantial: [apple/coreai-models](https://github.com/apple/coreai-models), **BSD-3-Clause, 2,045 stars, created 2026-06-08**, "Model export recipes, Python primitives, and Swift runtime utilities for on-device AI." It carries export recipes for **~24 model families** including `sam3`, `depth-anything`, `gemma3n`, `flux2`, `qwen3_moe`, `muse_glimmer`, `parakeet`, `stable-diffusion`. **In-window commits:** *Gemma 3n support (E2B + E4B, macOS)* (#198, Sep 3) and *Mistral-7B iOS export preset, INT4 palettized group-8* (#215, Sep 2). Sibling repos `apple/coreai-torch` (PyTorch→Core AI IR bridge, inline Metal kernels) and `apple/coreai-optimization` (compression) both also committed Sep 2–3.
   - **What is genuinely still missing** is narrower than the watchlist implied: the promised **`CoreAILanguageModel` + `MLXLanguageModel` Swift companion packages**. A GitHub-wide search returns exactly one repo by that name — `WostGit/MLXLanguageModel`, third-party, 0 stars. **Watchlist week 13; Labor Day Sep 7 is in 4 days.** Restate the item as "the two LanguageModel packages," not "the org is empty."
   - **Agent-Skills adoption datapoint:** `coreai-models` ships `.claude-plugin/marketplace.json`, `.codex-plugin/`, and `gemini-extension.json` alongside a `skills/` tree — Apple is publishing one skills bundle addressed at three agent clients. This is the closest thing yet to the shipping *reader* the Agent Plugins watchlist has been waiting for, though it targets vendor-specific manifests rather than the `agent-plugins.org` spec.
4. **Qwen-Drive-1.0-4B — Sep 2**, [`Qwen/Qwen-Drive-1.0-4B`](https://huggingface.co/Qwen/Qwen-Drive-1.0-4B). New autonomous-driving VLM; newest thing in the `Qwen` org. No portfolio relevance — logged so the next run's author sweep has a baseline.
5. **Minor / no action:** CrowdStrike **SafeMind** at Fal.Con — dual-model Red Tempest (offensive) / Blue Solano (remediation) closed loop on an NVIDIA digital twin, built on Nemotron, shipping inside Falcon. Perplexity **Hybrid Compute** with a local PPLX Qwen3.8-27B (Sep 1). `modelcontextprotocol/servers` newest release still **2026.8.31**; **MCP blog unchanged** (newest "The New MCP Roadmap," Aug 22).

### Medical Simulation (§D) — the two items that matter this run

6. **NVIDIA Isaac for Healthcare v0.8.0 — released Sep 2** (`2026-09-02T21:00:34Z`) — [release](https://github.com/isaac-for-healthcare/i4h-workflows/releases/tag/v0.8.0) · [org](https://github.com/isaac-for-healthcare). First release since v0.7.1 (Jul 23). **Complete runtime rewrite on Isaac Sim 6.0.1**, replacing separate per-specialty workflow trees with a unified **Scene / Task / Workflow / Engine** stack.
   - **New workflows:** laparoscopic (`surgical_lift_block`, `surgical_lift_needle`, `surgical_reach_psm`, `surgical_reach_dual_psm`, `surgical_reach_star`); **ultrasound (`ultrasound_liver_scan`, `ultrasound_probe_reach` with RSL-RL training)**; `endoluminal_navigation` (replaces catheter navigation); hospital automation (`assemble_trocar`, `locomanip_push_cart`, `locomanip_tray_pick_and_place`, `scissor_pick_and_place`).
   - **New patient-twin pipeline for CT-derived vasculature models** used in endoluminal fluoroscopy.
   - Local AI agent is now **Nemotron 3.5 Lightning (BF16)**; PhysX default with optional **Newton** physics; online RL (RSL-RL, RLinf PPO) is a first-class training path; incompatible policies isolated over Zenoh.
7. ⭐ **`Project-MONAI/physiotwin4d` — SOURCE MISS, backfilled today. Zero hits across every scout report ever written.** [Repo](https://github.com/Project-MONAI/physiotwin4d) · [docs](https://project-monai.github.io/physiotwin4d/) · [PyPI](https://pypi.org/project/physiotwin4d/). **Apache-2.0**, created 2025-12-05, current release **2026.8.0 (Aug 14)**.
   - **What it is:** *"Generate anatomic models in Omniverse with physiological motion derived from medical images."* It starts from a 3D medical image of a subject, extracts anatomic models, then uses **AI surrogates to estimate that subject's physiological processes** — cardiac and respiratory motion today, **expanding to electrophysiology, blood flow, and organ perfusion.**
   - **Stack:** ICON + Greedy (registration), MONAI + TotalSegmentator + Simpleware (segmentation), scikit-learn statistical shape models, ITK, PyVista, **OpenUSD / Omniverse** for geometry, CuPy, **PhysicsNeMo** for the AI surrogates. CLI + Python API, extensible class hierarchy for new organs and physiological processes.
   - **Stated end goal:** Omniverse as a simulation-information hub bridging to Ansys solvers, **Isaac Sim / Newton**, **AR/VR visualization devices**, and ROS robots — i.e. it is designed to hand off to exactly the runtime in item 6.
   - **Recent real work** (via `/events`, not `pushed_at`): *physics-informed cardiac motion with a neo-Hookean loss, tutorials 16–18* (#126, Aug 31); tutorial data/output dir configurability (#125); an explicit API-compatibility + migration-guide policy (#124). Today's push was the `nightly-status` branch — housekeeping.
   - **Explicit non-clinical disclaimer in the README:** *"not validated for clinical use… a research and visualization toolkit, not a medical device."* That framing is the same posture MedSim occupies.
   - **Why this is the find of the run:** this is the closest thing in open source to MedSim-Game's **"physiological clone"** throughline — a per-subject anatomy + physiology model with real motion, Apache-2.0, from the medical-imaging community rather than a game engine. See Project Impact.
- **MONAI core** last pushed Sep 3 (routine). Siemens/GE newsrooms: nothing in-window.

### Hardware

- **Nothing shipped in-window.** NVIDIA **DLSS 5** goes live tonight (Sep 3, 21:00 PT, NBA 2K27) as announced in the 09-01 report — no new information, not re-reported. No e-ink, dev-board, or LiDAR releases. No Onyx Boox dates.

---

## Nothing New (Watchlist)

- **Apple `CoreAILanguageModel` / `MLXLanguageModel` Swift packages** — 🔧 **item restated** (the parent repo is populated and active; only these two packages are missing). **Week 13; Labor Day Sep 7 in 4 days.** Escalate or strike on the Sep 7–8 run.
- **Meta Muse Spark open weights** — 🔧 **re-based to an undated "soon" on 1.3** (Zuckerberg, Sep 2). The dated 1.2 commitment is dead. Stop counting days against 1.2; count credibility instead.
- **DeepMind D4RT official code** — week 19, nothing.
- **Genie 3 developer API** — still Project Genie only (AI Ultra, $200/mo).
- **VGGT-Ω open access** — ➕ **new watchlist item**: watch for the gate to open or the contamination notice to be resolved with a re-trained checkpoint.
- **OpenAI Astra public release** — graduated-release announced Sep 1; ship date and branding still unknown.
- **Gemini 3.5 Pro GA** — still absent (Gemini shipped 3.8 Flash instead; the 3.5 Pro line has now been passed twice over).
- **Snap Specs** — Sep 16, $2,195, $200 deposit, ships "this fall." Newsroom unchanged.
- **RayNeo iO SDK / developer program** — ➕ **new**: hardware fully specced and priced, no developer story published. Check on the Sep 4 on-sale date.
- **Ray-Ban Meta Gen 3** — Connect Sep 23–24; no FCC filings under Aperol/Bellini.
- **Pico Space Pro** — Q4 2026 (corrected 09-01).
- **Jetpack Compose for XR beta** — no movement.
- **Alibaba Qwen3.8-Max vision weights** — org newest is Qwen-Drive-1.0-4B; no Max-vision.
- **Agent Plugins spec** — still zero release tags; Apple's tri-client skills bundle (item 3) is adoption of *vendor* manifests, not the spec.
- **Cursor Origin GA** — waitlist unchanged.
- **NVIDIA GR00T N2 / Jetson T3000-T2000** — EOY / Q1 2027.
- **Onyx Boox Palma 3 / Note Air6 C / Note Mini C / Tab Elite** — no dates.
- **Mayo Clinic + Microsoft frontier healthcare model** — 15 weeks, nothing.
- **ARPA-H simulation + causal models workshop report** — 8 weeks, nothing.
- **Gaussian Splatting Newsletter** — cadence broken; no September issue.
- **Marble / SpAItial** — both flat; **the $5 World Labs video→world test is still the cheapest open action item** in the 3D category and is now *more* attractive given the VGGT-Ω gate.

---

## Project Impact

- **MedSim-Game (flagship) — the strongest medical-sim day this scout has produced.**
  1. **`physiotwin4d` is a directly relevant reference implementation for the physiological clone.** It is not a drop-in — it is CT/MRI-derived, Omniverse/USD-based, and Python/desktop, while MedSim is a mobile-first web target driven by a hand-built physiology graph. But it answers questions MedSim is actively working: how to represent **subject-specific** anatomy that *moves* with cardiac and respiratory cycles, and how to structure an extensible hierarchy so electrophysiology, perfusion, and blood flow can be added to the same model later. **Concrete, cheap next step:** read its architecture + extension-point docs against `MedSim-Game/docs/master-design-2026-05-24.md` and the `medsim-physio` engine's coupling model — a doc-read, not an integration. Apache-2.0 means anything borrowed is usable. **Do not treat this as a dependency or a rewrite prompt** — doctrine says honor the master design, and the physiology engine is already its own repo with its own tests.
  2. **Isaac for Healthcare v0.8.0's `ultrasound_liver_scan` + `ultrasound_probe_reach`** is the closest published prior art to the **POCUS ultrasound digital prop**, and its **CT-derived patient-twin pipeline** is prior art for the wounded-patient / organ-mesh work. Relevant as reference and as a source of anatomy-to-image reasoning; it is a robot-learning stack on Isaac Sim, so it is **not** a path for the web prop. Worth noting that the memory-logged plan for POCUS v2 is **Z-Anatomy voxelization** — that plan is unaffected and remains the right one for a browser target.
  3. **Gemini 3.8 Flash at $0.75/$3.75** is now the cheapest credible frontier-tier coding/agentic model in the intro window (through Dec 31). Relevant to any **cost-sensitive, high-volume, non-clinical** path — bulk scenario-content drafting, asset-pipeline tooling — where Fable 5.1 at $10/$50 is overkill. **Not** for clinical content, which stays on the authoritative-source + review-gate rule. No code change today; logged as a cost option.
  4. **`apple/coreai-models` Gemma 3n E2B/E4B + Mistral-7B INT4 iOS presets** are the on-device path for an **offline LLM-NPC** on a mobile-first product — the scenario where a sim lab has no reliable network. Still speculative; MedSim has no on-device model path today.
  5. **No action required from the model releases.** Nothing in-window touches the Fable 5.1 breaking-change checks closed out on 09-01.
- **MedCapture (Tier-2):** Isaac's patient-twin pipeline reinforces that CT/MRI-derived anatomy is the industry's twin substrate, while MedCapture captures 2D procedure imagery. No convergence action, no customer signal in-window.
- **3rdrider / haptic-mirror (parked):** both moved — in opposite directions. See below.
- **BadgeMedia / Tenetrix, SW_Billing, wobble-ward:** no impact.

---

## Parked Idea Unblocks

- **Idea:** Resume 3rdrider when consumer-grade AR glasses ship at viable price/form
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device **camera**+mic+display, and developer SDK shipping at <$800"
  - **What changed:** The 09-01 report asked for an explicit RayNeo iO threshold check on the Sep 4 run; IFA Media Days published the specs two days early, so it is answered now. **iO = $479, 33 g, monochrome green waveguide display, 4 mics — and deliberately NO camera** (RayNeo removed it as a privacy/weight choice), no published SDK. **Price and display clear the bar; the camera requirement fails outright**, and camera absence is a design decision, not a spec gap a later SKU of the same model closes. GT Max is a media-viewing device, not a sensing one.
  - **Recommended action:** **WAIT** — and **strike RayNeo iO from the candidate list permanently** rather than rolling it forward. Remaining live candidates: Snap Specs (Sep 16, $2,195 — over threshold), Ray-Ban Meta Gen 3 (Connect Sep 23–24).

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"
  - **What changed:** **Negative drift — the substitute got worse, not better.** D4RT is still absent (week 19). The fallback this scout has recommended twice, **VGGT-Ω, turns out to be access-gated behind an automated approval process and carries an Aug 18 benchmark-contamination notice on the released 1B checkpoint** (details in Spatial Computing above). LichtFeld-Studio's continued hardening is real but is training/editing, not capture-to-scene.
  - **Recommended action:** **WAIT**, with one correction and one substitution. **Correct the standing advice**: "run VGGT-Ω on a short capture" is no longer a zero-friction spike — it requires an access request that the authors do not control, and its headline numbers are self-flagged as possibly inflated. **The $5.00 World Labs video→world test (§4 action item) is now the cheapest and least-encumbered way to answer this idea's core premise** — documented video→world path, published 100 MB capture ceiling, open PLY/GLB export. Still low priority behind the flagship.

- **Idea:** AI video / scene generator with synchronized 6-direction output
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "(a) Genie 3 (or competitor) exposes multi-view export as a public API … (b) build from 3D primitives, requires display-cube-six-screens first"
  - **What changed:** No Genie 3 API (still AI-Ultra-only Project Genie). No change to path (b).
  - **Recommended action:** **WAIT.**

- **Idea:** Ultrasound / doppler / echo sim trainer with bed-mounted positional tracking
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/sim-lab-rfid-ultrasound-trainer.md`
  - **Blocker was:** "MedCapture must land first sim-lab pilot AND ≥3 sim-center directors validate demand"
  - **What changed:** **Nothing that touches the blocker.** Isaac for Healthcare v0.8.0 shipped two ultrasound workflows and `physiotwin4d` shipped cardiac-motion surrogates, which is meaningful *technical* tailwind for the eventual build — but this idea is gated on **customer validation, not tooling**, and no sim-center demand signal appeared in-window. Flagging the distinction so a future run does not misread tooling progress as an unblock.
  - **Recommended action:** **WAIT.**

- **Idea:** MedSim — Learner Analytics & Psychometric Instrumentation
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/medsim-data-gathering-analytics.md`
  - **Blocker was:** "Scenario count too low; need ≥10 scenarios live with ≥100 completions each"
  - **What changed:** Nothing. Blocker is internal traction, immune to external releases. Noted only because Gemini 3.8 Flash's price cut makes bulk scenario *authoring* cheaper, which touches the numerator — indirectly, and not enough to change the call.
  - **Recommended action:** **WAIT.**

- **All other parked ideas** (`ai-augmented-field-sales-scaling`, `display-cube-six-screens`, `ems-event-robot-fleet`, `group-matchmaking-cascading-tinder`, `instrumented-task-marketplace-for-ai-training`, `longplay-monument`, `medcapture-hand-kinematics-robotics`, `medcapture-humanoid-robot-extension`, `medcapture-stereo-second-camera`, `medical-mmo-open-world`, `medsim-marketing-gtm`, `medsim-revenue-angles-expansion`, `medsim-school-employer-custom-content`, `military-parallel-pipeline`, `painting-wars-pixel-rts`, `regional-ems-ecosystem-simulator`, `runway-dev-portal-exploration`, `sim-lab-mockup-print-bank`, `swappable-shells-animated-screens`, `telegram-inline-keyboard-question-protocol`, `zoll-stryker-bracket`) — **no in-window developments touch their blockers.** The `telegram-inline-keyboard-question-protocol` owner call flagged on 09-01 (transport was muted 08-30) is still open and unactioned.
