# Tech Scout Report — 2026-08-20

**Window:** 2026-08-18 → 2026-08-20 (normal daily cadence; prior report 2026-08-18). No major
industry event in-window (next: Snap SPECS launch Sep 16, Meta Connect Sep 23–24).

**Verdict: NOT a thin day — the strongest spatial-computing window since the 08-17 backfill.** Five
Gaussian-splatting platform items shipped Aug 18–20, two of which change what is cheaply possible:
**PlayCanvas opened a REST publishing API for SuperSplat** (with a first-party **LichtFeld Studio**
integration), and **Scantic** put **sub-minute, fully on-device splat training on an iPhone, free**.
Together those close the capture → train → host loop with no cloud, no GPU box, and no cost. One
model-distribution item (Grok 4.6 GA on Bedrock). **One serious backfill catch: SimX shipped
instructor-free autonomous VR clinical simulation on Aug 12 and has never appeared in any scout
report** — that is a flagship-competitive miss with a config cause, logged below.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- **Nothing shipped in-window. All three per-run checks flat:**
  - **Snap Newsroom — flat.** Newest post still **07.31.26** ("Rewarding Authentic Creativity on
    Spotlight"); SPECS launch post 07.30.26 unchanged. **Zero August posts, 20 days running.**
    [newsroom.snap.com](https://newsroom.snap.com/)
  - **Lens Studio — 5.23.2, unchanged** (Aug 17, logged 08-18). [ar.snap.com/download](https://ar.snap.com/download)
  - **Android XR / XREAL Project Aura / Catalyst — no update.** Aura still "before end of 2026";
    Catalyst still closed (cohort 1 notified Jul 15). No second-cohort page change.
- **Samsung Galaxy Glasses — still fall 2026, display-less**, Snapdragon AR1 Gen 1 + Gemini, revealed
  at Unpacked Jul 22. ⛔ **The 08-18 note holds: the "August 2026 release" claim on retail calendar
  pages is wrong. Do not re-chase.**

### Spatial Computing / 3D — the substantive section today
1. 🔥 **PlayCanvas ships a REST Publishing API for SuperSplat — 2026-08-18, live.**
   [Official announcement (PlayCanvas forum)](https://forum.playcanvas.com/t/supersplat-publishing-api-is-live-with-three-partner-integrations/42526)
   - Third-party scanners/trainers upload splats **directly to superspl.at hosting** — no
     multi-GB PLY export-then-reupload round trip.
   - **Auth:** PlayCanvas access token as a bearer token (same token as the existing REST API,
     generated from the account API Tokens page). **Uploads are resumable multipart.**
   - **Endpoints:** `POST /v1/splats/uploads` → `POST /v1/splats/uploads/{uploadId}/part-upload-urls`
     → `POST /v1/splats/uploads/{uploadId}/complete`; plus `GET /v1/splats/uploads/{uploadId}`,
     `GET /v1/me`, `GET /v1/splats`, `GET /v1/splats/{splatId}`.
   - **Three launch partner integrations: LichtFeld Studio** (pick splats to upload, exports PLY or
     SOG with live progress + resume), **XGRIDS LCC Studio** (publish from My Models in Lixel
     CyberColor), **Teleport by Varjo** (publish per capture from phone images / 360° video / drone).
   - ⚠️ **Pricing/plan requirement is NOT stated in the announcement — unverified.** Assume a free
     PlayCanvas account works until proven otherwise; confirm before designing around it.
   - 📌 **Method note for the config:** SuperSplat's **release tags stop at v2.32.3 (Jul 26)**. This
     API launch cut **no tag**. Same failure shape as the MCP-spec and Snap-SPECS misses — the
     artifact feed cannot see a server-side launch. **Add the PlayCanvas forum Announcements
     category + blog to the per-run diff.**
2. 🔥 **Scantic — on-device iPhone Gaussian-splat training, under a minute.**
   [CG Channel, Aug 19](https://www.cgchannel.com/2026/08/scantic-trains-gaussian-splats-entirely-on-your-phone/) ·
   [Digital Production, Aug 20](https://digitalproduction.com/2026/08/20/gaussian-splats-on-the-iphone/) ·
   dev write-up covered as ["I Tried to Make Gaussian Splatting 1,000× Faster", Radiance Fields, Aug 18](https://radiancefields.com/)
   - By **Sebastian Beyer**. **Capture, training, and viewing are 100% local — no cloud, no account,
     works offline.** Trains a splat in roughly the time other apps take just to *upload*.
   - **Requirements: iOS 17+, A12 Bionic or better (iPhone XS, 2018, and newer).**
   - **Price: base app free** with standard-quality export. Full-quality export = **€29.99/yr
     (~$35) or €4.99 per scan.**
   - **Export: PLY today; SPZ planned.**
   - ⚠️ **Verified from two independent trade publications, not from the App Store listing** — I
     could not resolve the store URL. Confirm the listing before installing.
3. **Streamed Reality — generates 3DGS inside the Unity Editor** (Aug 19). Trains in-editor,
   optimizes at runtime, exports PLY. **Windows + CUDA GPU only.** [radiancefields.com](https://radiancefields.com/)
4. **LocalMesh opens beta** (Aug 19) — one photo → splat via **TripoSplat** → textured mesh by
   running **60 gsplat depth maps through a 768³ TSDF volume**, on a local GPU. [radiancefields.com](https://radiancefields.com/)
5. **NavVis adds splats to IVION 12** (Aug 19) — third visualization mode beside point clouds and
   panoramas. **Beta, NavVis MLX customers only** — i.e. gated behind six-figure survey hardware.
   Log, ignore.
6. **Foundry ships Nuke 17.1v1** (Aug 20) — dynamic Gaussian-splat + relighting support, fractional
   density masks in `GeoDeletePoints`, `SplatRender` overscan, eight splat bug fixes. VFX-pipeline
   scope; no portfolio path.
7. **`nerficg-project/faster-gaussian-splatting` — genuine commit Aug 20:** #11 **"Warp-level culling
   inside blending kernels"**, first push since Aug 14. Still **zero releases** — commit-monitored
   per config. [github](https://github.com/nerficg-project/faster-gaussian-splatting)
8. **`MrNeRF/LichtFeld-Studio` — heavy Aug 20 run, no release** (last tag v0.5.3, Jun 24). Six
   commits, all **project/dataset lifecycle hardening**: #1726 prompt-to-save before a dataset
   replaces the open project, #1723 keep loading/training when dataset images are missing, #1722
   keep autosave alive after first checkpoint, #1719 prompt-to-stop-training on project switch,
   #1724 histogram icon fix. **Read together with item 1, this is a tool being made
   pipeline-safe right as it gains a one-click publish target.** [github](https://github.com/MrNeRF/LichtFeld-Studio)
9. **DeepMind D4RT — flat, week 15.** [OpenD4RT](https://github.com/Lijiaxin0111/Open-d4rt) last
   commit **Aug 12** (PR #18 aspect-ratio fix). Official code: still none.
10. **World Labs / Marble release notes — flat** (newest 2026-04-02, Marble 1.1/1.1 Plus).
    **SpAItial blog — flat** (newest Echo-2, 2026-04-28).
    📌 **Method correction: `spaitial.ai/blog` now returns 403 to WebFetch.** `curl` with a browser
    User-Agent returns HTTP 200 / 31.5 KB and parses fine. Use curl+UA on this row from now on.

### AI / ML
- **Grok 4.6 generally available on Amazon Bedrock — Aug 19.**
  [xAI](https://x.ai/news/grok-4-6-amazon-bedrock) ·
  [AWS What's New](https://aws.amazon.com/about-aws/whats-new/2026/08/amazon-bedrock-grok-4-6/) ·
  [Bedrock model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-xai-grok-4-6.html).
  500K context, configurable reasoning effort (low/medium/high/xhigh), **$2 / $6 per 1M tokens** —
  same price as direct. **Distribution event, not a capability event**; the model itself launched
  Aug 12 and was backfilled in the 08-17 report. Matters only if MedSim ends up inside an AWS
  boundary for procurement reasons.
- **OpenAI — Prompt Caching dashboard, Aug 20.**
  [changelog](https://developers.openai.com/api/docs/changelog). Cache-efficiency monitoring on the
  API platform. Housekeeping. Also on the changelog: **DevDay Exchange 2026 announced Aug 18** —
  eight developer events, October–November, global tour.
- **HF author sweeps — all flat vs. 08-18, verified via `?author=&sort=lastModified`:**
  - `zai-org` newest = **GLM-5 (Aug 11)**. 🔴 **GLM-5.3 weights still NOT published** — `?search=GLM-5.3`
    returns 2 non-`zai-org` repos. Safety hold holding; **target ≈Aug 28, 8 days out.**
  - `Qwen` newest = Qwen3.8-27B / -FP8 (Aug 14). **No Qwen3.8-Max full-feature drop.**
  - `deepseek-ai` newest = V4-Pro-0813 (Aug 13). `meta-models` newest = Muse-Glimmer-30B-GGUF (Aug 18).
    All previously logged.
- **Anthropic news — flat** (newest Aug 14, watermark post). **Google Developers Blog — flat**
  (newest Aug 17, zero-trust ADK). **MCP blog — flat** (newest 2026-07-28 spec).
  **`agentplugins/agent-plugins-spec` — still ZERO release tags and ZERO git tags** despite the
  v1.0.0 announcement. Watch for a client shipping a reader, per config.

### Hardware
- **Nothing shipped in-window.** Boox: **Palma 3 / Note Air6 C / Note Mini C / Tab Elite still
  unreleased**; a new **BOOX Picco** (3.97" B&W, first of a "Tile" line) is **teased, not shipped** —
  do not report as available. A 15%-off site promo runs to **Aug 23**; that is a sale, not a launch.
  Jetson T-series still Q1 2027. No Unitree / Figure / Optimus SKU or price move.

### Medical / Clinical AI
- **No FDA clearances in-window.** UpDoc **K253281** (Dec 23, 2025) remains the sole patient-facing-LLM
  510(k). NVIDIA `isaac-for-healthcare`: newest push `i4h-workflows` **Aug 11**, no release;
  `Cosmos-H-Dreams` Jul 27. **MONAI latest still 1.6.0 (Jun 11, 2026).**

---

## ⚠️ Backfill Catches — real, dated, never logged in ANY prior report

#### 🔴 SimX "Autonomous Simulation" — launched 2026-08-12 — **direct flagship competitor**
[Announcement coverage](https://aijourn.com/simxs-autonomous-simulation-a-powerful-new-tool-for-instructors-to-scale-on-demand-healthcare-training/) · [simxvr.com](https://www.simxvr.com/)

`grep -il "simx" scout-*.md` → **zero hits across every report this scout has ever written.** Same
for `vrpatients`. This is the most consequential miss on the board today.

- **What shipped:** learners complete **expert-validated immersive clinical encounters entirely
  alone** — no instructor setup, no moderation, no additional staffing, outside scheduled lab hours.
- **The AI layer:** learners **speak naturally** to patients, family, and care-team characters.
  Character responses are generated by AI but **"clinician-validated through a tightly controlled AI
  layer to eliminate the risk of hallucinated or inaccurate clinical content."** Critical actions are
  **automatically tracked**, producing accreditation/competency documentation without an observer.
- **Deployment:** runs on **headsets customers already own** — no new hardware. Targeted at nursing
  and allied-health programs, health systems, and clinical training orgs. **Pricing undisclosed.**
- **Why this matters more than anything else in this report:** it is MedSim-Game's thesis —
  instructor-free, scalable, LLM-driven clinical scenarios with a clinical-accuracy gate and
  automatic competency capture — shipped commercially, into the exact buyer segment
  (`/Users/jonathanbouren/PROJECTS/_ops/idea-vault/medsim-school-employer-custom-content.md`, and the
  segment-tuned nursing/EMS enterprise tiers in the MedSim monetization model). Their "tightly controlled AI layer" is structurally the same bet as the MedSim **clinical-review
  gate**. **This is validation of the thesis and compression of the differentiation window at the
  same time.** It is *not* an emergency: SimX is VR-headset-bound and sim-lab-institution-shaped;
  MedSim is mobile-first, freemium-for-individuals, and MMO-framed. That gap is the moat — but it is
  now the *only* moat, and it should be stated explicitly rather than assumed.
- 🔧 **Config cause + fix.** `TECH_SCOUT_CONFIG.md` §D "Medical Simulation Vendors" lists **NVIDIA
  Isaac for Healthcare, MONAI, Siemens/GE** — imaging and robotics infrastructure. **The actual
  competitive set — VR/AR clinical-sim software vendors — is not monitored at all.**
  **Add to §D as a named weekly row: SimX, VRpatients, Oxford Medical Simulation, UbiSim, Laerdal,
  CAE Healthcare, Body Interact, plus [healthysimulation.com](https://www.healthysimulation.com/) as
  the trade announcement surface.** Same lesson as Snap SPECS and the MCP spec: the announcement
  surface was never watched.

#### `GaussianSplatting.jl v2.0.0` — tag published **2026-08-09** (Apache-2.0, 69★)
[JuliaNeuralGraphics/GaussianSplatting.jl](https://github.com/JuliaNeuralGraphics/GaussianSplatting.jl) ·
[author write-up](https://pxl-th.github.io/blog/better-gs-julia/)
- ⚠️ **Date correction:** search summaries assert "released August 19." **The actual GitHub release
  tag is 2026-08-09.** Aug 17 is only when Radiance Fields covered it. Do not carry the Aug-19 date.
- **One kernel across AMD (AMDGPU.jl), NVIDIA (CUDA.jl), and Apple Silicon (Metal.jl)** via
  KernelAbstractions.jl. Adds **MCMC densification** (precise Gaussian-count control, far less
  sensitive to initialization), **depth supervision + normal-consistency**, and a **Sky Dome** pass —
  a frozen ~32K-Gaussian shell at large radius, rendered separately and composited behind the scene
  to kill floaters and disentangle distant background, at negligible cost against a
  millions-of-Gaussians scene. Also: split frontend/backend threads so the UI survives kernel
  compilation, auto-checkpointing, hyperparameter config files, saved camera paths.
- **Why it matters:** an **Apache-2.0, Metal-backed** trainer that runs on the Mac in this portfolio,
  with the floater problem addressed head-on. That is the open-source half of today's capture story.

---

## Nothing New (Watchlist)
- **Snap SPECS launch** — **Sep 16, Los Angeles (27 days).** Only dated AR hardware event.
- **Meta Connect** — **Sep 23–24 (34 days)**; Ray-Ban Gen 3 expected.
- **Z.ai GLM-5.3 open weights** — **≈Aug 28 (8 days).** Model shipped Aug 14 via API; weights on
  safety hold. HF `zai-org` still shows GLM-5 as newest. **Probe Aug 28; if it slips, log the
  extension explicitly — do not slide the date silently.**
- **Meta Muse Spark 1.2 open weights** — committed, no date.
- **Alibaba Qwen3.8-Max full weights** (vision + 1M ctx) — partial only. 🔴 License prohibition
  (USA/EU/UK/KR) still unclarified — **read the LICENSE before any work.**
- **Apple Foundation Models framework open-source** — WWDC promise, week 11; "summer" nearly gone.
- **DeepMind D4RT official code** — **week 15.**
- **Genie 3 developer API** — Ultra-only. **Gemini 3.5 Pro GA** — retired from watch (5th slip).
- **OpenAI Ultrafast tier GA** — limited preview since Aug 13.
- **Radiance Fields newsletter** — July issue landed Aug 14 (cadence restored); next ~Sept 1.
- **SuperSplat Publishing API pricing/plan tier** — 🆕 unstated in the announcement.
- **Onyx Boox Palma 3 / Note Air6 C / Note Mini C / Tab Elite / Picco** — all still unshipped.
- **Cursor Origin GA**, **NVIDIA GR00T N2**, **Mayo + Microsoft healthcare model**, **ARPA-H
  simulation workshop report**, **Android XR Catalyst second cohort**, **agent-plugins client
  reader** — unchanged.

---

## Project Impact

**MedSim-Game (flagship) — two live items, one strategic.**
1. **A free, zero-cloud capture→host pipeline now exists end to end.** `?clinic` today is a
   SketchUp interior converted by hand (normalize → double-side → draco, 4.74 MB). As of this window
   the alternative is: **Scantic on the iPhone (free, <1 min, on-device, PLY)** → optional
   **LichtFeld Studio** refinement on the Mac → **one-click publish to SuperSplat via the new REST
   API**, or **GaussianSplatting.jl v2.0.0 (Apache-2.0, Metal)** if an open-source trainer is
   preferred. Every leg is free or already owned; nothing requires a cloud GPU. **Concrete next
   action: capture one real clinical space (an ambulance box, a treatment bay, a sim lab) with
   Scantic and push it through to a SuperSplat URL.** That is an afternoon and it answers whether
   splat interiors beat hand-authored GLB for MedSim — a question that has been theoretical since
   the `?clinic` work. It does **not** replace the R2 asset CDN or the placement pipeline; it is a
   source-of-geometry experiment.
2. ⚠️ **SimX Autonomous Simulation is the competitive signal of the month, and it is 8 days old.**
   Read the strategic note above. **Recommendation: no roadmap change, but the differentiation
   should be written down explicitly** — mobile-first vs. headset-bound, freemium-for-individuals
   vs. institutional seat licensing, career-simulation/MMO framing vs. discrete encounter drills.
   That belongs in a Linear issue against the MedSim MMO project, not in a new `.md` (Rule 0).
3. Grok 4.6 on Bedrock: noted, no action. Prompt Caching dashboard: no action.

**haptic-mirror (parked):** see Parked Idea Unblocks — the capture leg of its blocker moved today.

**3rdrider (parked):** nothing. Lens Studio flat, no <$800 glasses, Snap silent for 20 days.
Next real checkpoint is **Sep 16**.

**MedCapture / BadgeMedia / SW_Billing:** no impact this window.

---

## Parked Idea Unblocks

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world
    reconstruction tooling that lets you generate training scenarios from short video captures"*
  - **What changed:** The **capture → reconstruct → host** leg became free, local, and fast in a
    single window. **Scantic** trains a splat from a short handheld capture **on an iPhone in under a
    minute, entirely on-device, free** (full-quality export €4.99/scan). **GaussianSplatting.jl
    v2.0.0** (Aug 9, **Apache-2.0**) supplies the literal *open-source* trainer the blocker names,
    running on **Apple Silicon via Metal**, with MCMC densification and a Sky Dome pass that
    addresses the floater problem that made earlier casual captures unusable. **PlayCanvas's new REST
    publishing API** (Aug 18) removes the hosting/serving step. **D4RT itself is still absent —
    week 15.**
  - **Recommended action: REVISIT — not PROMOTE.** Be precise about what did and did not move. The
    blocker has two halves: *reconstruct a space from short video* and *generate training scenarios*.
    **The first half is now solved, cheaply and offline.** The second is not: a splat of a real room
    is a static reconstruction, not a scenario — it has no events, no state, no physics. That is
    exactly what D4RT (or Marble/Echo-2 world generation) was wanted for, and none of it shipped
    today. **The right move is the same $0 spike recommended for MedSim above** — one Scantic capture
    of a real space, published to SuperSplat — which serves both projects and settles the capture
    question before any worldbuilding decision is made. If the capture holds up, the remaining
    blocker narrows honestly to "scenario generation," which is a cleaner thing to watch for.
- **All other 26 `_ops/idea-vault/*.md` `blocked_on:` fields checked — none satisfied.** No <$800
  consumer AR glasses with SDK (`3rdrider-snap-spectacles.md`); no Genie multi-view export API
  (`ai-multiview-video-generator.md`); no Unitree Go2 →~$1K or G1 →~$10K price move
  (`ems-event-robot-fleet.md`); no change to any MedCapture-pilot-gated blocker
  (`medcapture-*`, `sim-lab-*`, `military-parallel-pipeline.md`); no change to the
  barad-dûr-v2-gated maker ideas (`display-cube-six-screens.md`, `swappable-shells-animated-screens.md`).

---

## Config Amendments Recommended (do not apply without authorization)
1. **§D — add the actual competitive set**, weekly, by name: **SimX, VRpatients, Oxford Medical
   Simulation, UbiSim, Laerdal, CAE Healthcare, Body Interact**, + **healthysimulation.com** as the
   announcement surface. §D currently monitors imaging/robotics infrastructure only, which is why
   SimX went unseen for 8 days.
2. **§B — add PlayCanvas forum Announcements + blog to the per-run diff.** The SuperSplat publishing
   API cut **no release tag**; the tag feed stops at v2.32.3 (Jul 26).
3. **§B SpAItial row — method fix:** WebFetch now returns **403**; use `curl` with a browser
   User-Agent (verified HTTP 200, 31.5 KB, today).
4. **Standing note:** search-result summaries misdated GaussianSplatting.jl v2.0.0 by 10 days
   (Aug 19 vs. the real tag Aug 9). **Always confirm a release date against the GitHub tag.**
