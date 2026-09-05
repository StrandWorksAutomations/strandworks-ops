# Tech Scout Report — 2026-09-05

**Window:** 2026-09-03 → 2026-09-05 (2 days; normal cadence — no gap backfill).

**Major events swept:** **IFA Berlin show floor (Sep 4–8, in-window)**. Next: **Apple event Sep 9**, **Snap Specs Sep 16**, **Meta Connect Sep 23–24**.

**Headline:** **OpenAI shipped GPT-6 Astra on Sep 3** (`gpt-6-astra`, $10/$50, 1.05M context — a same-price peer to Fable 5.1, not a reason to move), and **World Labs published Atlas on Sep 1 — an omni world model that reconstructs 3DGS scenes from ordinary cell-phone video and was missed by the last two runs** because the blog is not on the per-run diff list. On the medical-sim side, `physiotwin4d` was **renamed MONAI Physio** two days after the 09-03 report flagged it, and NVIDIA published **14 signed agent skills** for Isaac for Healthcare. Microsoft quietly open-weighted a **streaming speaker-attributed ASR** (MIT) that is the first concrete voice-input candidate for a hands-free sim. RayNeo iO is in stock at a **lower price than the press reported** and still has no camera.

**Method notes (log, don't repeat):** (1) **Atlas was a two-run miss.** §2B diffs `docs.worldlabs.ai/marble/release-notes` (still 2026-04-02) — a *research* model announcement lands on `worldlabs.ai/blog`, which no run has diffed. Config updated: blog added as a per-run diff. (2) **Techmeme per-run diff (adopted 09-01) earned its keep:** it surfaced the NVIDIA–Hugging Face confirmation and Project Zenith, neither of which any focus-area query returned. (3) **The GS Newsletter completeness audit worked as designed:** its August issue exposed three primary-source misses (three.js native splat renderer, Insta360 X6 splat output, SuperSplat REST API) — all August events, all zero hits in prior reports. (4) **Read the storefront, not the press release, for price:** Engadget/Softonic said iO = $479; rayneo.com's cart says **$449 (list $499)**. (5) The MONAI rename and the Isaac skills both came from **org enumeration by push date**, the §D rule.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **RayNeo iO — on sale Sep 4, confirmed In Stock on [rayneo.com](https://www.rayneo.com/products/rayneo-io-ai-glasses).** **$449 (list $499, "save $50")**, both colourways; **ships on or after Sep 18** "due to high order volume." Product page confirms *"Designed without a camera,"* live captions in 55 languages, on-board models "RayNeo AI and Gemini 3.1 Flash Lite," 2-day battery. A prescription SKU (`rayneo-io-ai-glasses-prescription`) is listed separately. The page links a **Developer Portal at `open.rayneo.com`** and a "RayNeo Innovator Program," but nothing on the page or in the Sep 4 press ties either to the iO. Both iO and GT Max were named IFA Innovation Award honorees ([PR Newswire via Manila Times](https://www.manilatimes.net/2026/09/04/tmt-newswire/pr-newswire/rayneo-showcases-next-generation-cinematic-ar-and-ai-smart-glasses-at-ifa-2026-with-dolby-and-bang-olufsen/2418808)). **3rdrider verdict unchanged: struck (no camera).** New: the on-sale price is $30 below what the 09-03 report recorded.
- **INMO GO3 — IFA Innovation Award honoree ([PR Newswire](https://www.prnewswire.com/news-releases/inmo-go3-named-ifa-innovation-award-honoree-for-advancing-everyday-ai-eyewear-302870307.html)); shipping since June 2026, zero prior scout hits.** [Specs](https://www.arcompare.com/ar-glasses/inmo-go3/): **$599 MSRP**, 58 g, **binocular 640×480 monochrome green MicroLED waveguide**, hot-swap batteries (~3 h), prescription ✅, **camera ❌**, no published SDK. Threshold check for `3rdrider-snap-spectacles.md`: price ✅, display ✅, prescription ✅, **camera ❌** — fails on the same axis as RayNeo iO. The sub-$800 display-glasses class is converging on *camera-free by design*; the camera requirement is what keeps the 3rdrider blocker unsatisfied, not price.
- **Snap — no AR news.** Newsroom newest is a Sep 1 HBO Max / Harry Potter lens post (consumer content, not hardware); "SPECS Launch on September 16" (Jul 30) still the newest AR item. **Lens Studio still 5.23.2 (Aug 17)** per the download-page diff. `Snapchat` GitHub org: only `GiGL`, `Valdi`, `ts-inject` pushed — none AR.
- **Android XR:** nothing in-window. Rokid "Style Pack" seen on IFA floor lists is a CES 2026 item, not new.

### Spatial Computing / 3D

- ⭐ **World Labs Atlas — published Sep 1; MISSED by the 09-01 and 09-03 runs.** [Blog](https://www.worldlabs.ai/blog/atlas) · [Radiance Fields write-up](https://radiancefields.com/world-labs-announces-new-world-model-atlas) · [early-access request form](https://form.typeform.com/to/zHFR4r3A). "Omni world model for spatial intelligence" — a multimodal autoregressive diffusion transformer (rectified flow).
  - **Inputs, per the vendor page:** text, one-to-many images, **video ("represented as sequences of images")**, **precise camera geometry as a native input**, and **3D depth maps**. The reconstruction examples were *"filmed by a few engineers and researchers with ordinary cell phones on tripods,"* using 24 frames each. Works from *"as few as two or three images"* up to "over a hundred."
  - **Outputs:** images, **video up to 1 minute at 1440p**, 360 panoramas, **point clouds, 3D Gaussian splats (same format as Marble)**, and RGB + depth predictions "for robotics simulation."
  - **Numbers:** 3D reconstruction error **25.3 AbsRel×10⁻³ average vs Pi3X 28.7 and π³ 34.7** (best on ScanNet 8.6, DTU 9.3). Camera-controlled generation human preference: **75% vs MiniMax H3, 81% vs Gemini Omni Flash, 93% vs FLUX 3, 94% vs Seedance 2.5.** Single-image → complete scene shown.
  - **Availability: early access "with select partners"** via the Typeform; **no API, no pricing, no date.** *"Atlas will power future versions of Marble"* — it does not replace the Marble API today.
  - **Why it matters:** this is the first vendor statement that **cell-phone video → 3DGS scene** is a first-class path in a *reconstruction-grade* (not generative-only) model with published recon error — the exact premise of `haptic-mirror-d4rt.md`. It is gated, so the recommendation is to **file the free early-access request** (reversible, zero cost) and keep the $5 Marble test as the shipped-today path. See Parked Idea Unblocks.
- **Gaussian Splatting Newsletter — August issue posted Sep 2** ([issue](https://radiancefields.substack.com/p/gaussian-splatting-in-august-2026)); the broken 1st-of-month cadence has resumed on a mid-month footing (Jul 1 → Aug 14 → Sep 2). **Completeness audit — three primary-source misses, all confirmed:**
  1. **three.js merged a native Gaussian-splat renderer to `dev`** — [`examples/jsm/objects/GaussianSplat.js`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/GaussianSplat.js); PRs **#33950** (TSL renderer/loader, WebGPU+WebGL, glTF import, Aug 8), **#34205** (load optimisation), **#34215** (view-dependent SH, Aug 12), **#34254** (per-mesh bounds + frustum culling, Aug 15). PLY / SPLAT / SPZ / KSPLAT / glTF loaders. **Not in any tagged release — `r185` (Jul 1) is still latest; lands in r186.** Zero prior hits for "r186"; the only "three.js" hit was 05-25. **MedSim pins `three ^0.184.0`** (both `medsim/` and `medsim-game-prototype/`) — see Project Impact.
  2. **Insta360 X6 now outputs Gaussian splats** — zero prior hits. A consumer 360 camera with native splat capture is the cheapest capture device yet for the video→scene premise.
  3. **PlayCanvas SuperSplat exposed a REST publishing API** for third-party tools — zero prior hits.
  - Also in the issue and already covered: Splat.js / Arrival.Space (08-22), Nuke 17.1 splat toolset (08-20), luma.gl `@luma.gl/splats` (new, minor), Maya 2026 splat snapping, three Houdini tools, four free Blender splat add-ons.
- **LichtFeld-Studio** — new tag **`model-lpips-v1` (Sep 3)**: LPIPS v0.1 VGG16 weights in native `.lfw`, marked pre-release "to keep it out of the Latest badge" — a *model asset*, caught by the 09-01 "read every tag" rule. Commits Sep 4–5: headless training from an untrained `.licht` with embedded dataset via `--data-path` (#2001), VkSplat scratch recovery after training pause (#2041), viewport/Edit-Mode invalidation (#2039/#2040). App tag still **v0.5.3 (Jun 24)**.
- **XGrids at IFA** ([Yanko](https://www.yankodesign.com/2026/09/04/smart-glasses-robot-dogs-ai-tamagotchis-and-desk-sized-supercomputers-how-ifa-2026-redefined-robots/)): PortalCam (856k pts/s LiDAR + 4 cameras, on-device SLAM → native 3DGS; **$4,999 standard / $6,499 premium**, shipping — covered 07-28/08-20) plus an **LCC Scan iOS app** announcement (photos/video → 3DGS, "90% compression"). No ship date on the iOS app; watchlist.
- **Flat, by direct diff:** Marble release notes newest **2026-04-02**; SpAItial blog newest **Echo-2, 2026-04-28**; `faster-gaussian-splatting` last commit Aug 20; VGGT-Ω unchanged (gated + contamination notice); **D4RT official code — none (week 19)**; Genie 3 still Project-Genie-only, no developer API.

### AI / ML

1. ⭐ **OpenAI GPT-6 Astra — shipped Sep 3.** [API changelog](https://developers.openai.com/api/docs/changelog) · [model page](https://developers.openai.com/api/docs/models/gpt-6-astra) · [pricing](https://developers.openai.com/api/docs/pricing) · [Simon Willison](https://simonwillison.net/2026/Sep/3/gpt6-astra/). **Resolves the watchlist item** (ship date + branding): it is GPT-6-branded, model id **`gpt-6-astra`**.
   - **Price: $10 / $50 per MTok** (cached input $1, **cache writes $12.50**); **long-context tier (>~256K) $20 / $75.** Batch and Flex 50%; Fast mode 2×. **1,050,000 context / 922,000 max input / 128,000 max output; knowledge cutoff Apr 30, 2026.** Text+image in, text out.
   - **Breaking-change checks for any OpenAI-side code:** reasoning effort `low/medium/high/xhigh/max` — **`none` is not supported**; **no custom `temperature`, `top_p`, or logprobs**; **tool calling requires the Responses API** (Chat Completions works without tools). Realtime / fine-tuning / embeddings / audio endpoints not supported.
   - **Numbers:** ARC-AGI 3 **99.9% with OpenAI's "Provider Adapter" harness vs 62.7% on the default harness** (Willison flags the gap); long-context 100% at 256–512K, 96.3% at 512K–1M; ExploitBench 100%, SRE-Bench 99.2%; Artificial Analysis Intelligence Index **61 — five points below Fable 5.1**. Rolling to Plus/Pro/Business/Enterprise "over the coming days"; cyber capabilities remain gated to the Daybreak cohort per the Sep 1 post.
   - Same day: **Responses API gained async tool calling, mid-turn steering over WebSockets, and mid-conversation reasoning-effort changes that preserve cached prefixes.**
2. **Microsoft VibeVoice-ASR-Streaming 1.5B / 7B — open weights, MIT, HF Sep 2, announced Sep 3 in the repo News.** [GitHub](https://github.com/microsoft/VibeVoice) · [HF 7B](https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B) (card lists 9B params) · [report arXiv 2609.02812](https://arxiv.org/abs/2609.02812) · [demo](https://aka.ms/vibeasr). **Streaming speaker-attributed transcription ("who said what" as speech arrives), customised hotwords, 10 languages** (EN/ZH/FR/DE/IT/JA/KO/PT/RU/ES). Zero prior scout hits. This is the **open-weight counterpart to Meta Muse Voice Transcribe (Sep 1, API-only, weights explicitly withheld)**. Sibling **VibeVoice-ASR-BitNet + `VibeASR.cpp`** (Jul 23) already runs the non-streaming model on 3+ CPU threads with no GPU. No WER table on the card yet; the report has it.
3. **NVIDIA to acquire Hugging Face — $12.93B, confirmed Sep 3** ([NVIDIA blog](https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/) · [TechCrunch](https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/)). **Not closed — expected H1 2027 pending regulatory approval.** Huang: HF "will remain an open platform." Zero prior hits (the 07-30 mention was a rumor line). Logged because the HF API is this scout's primary weights-verification path and the portfolio's open-weights supply chain; watch for API/ToS changes at close, not now.
4. **Microsoft Project Zenith — announced Sep 4** ([Windows Developer Blog](https://blogs.windows.com/windowsdeveloper/2026/09/04/announcing-project-zenith-the-ready-to-code-windows-experience/) · [Engadget](https://www.engadget.com/2251018/microsoft-announces-project-zenith-clutter-free-windows-experience/)). A stripped, dev-configured Windows 11 profile for a hardware class of **≥64 GB unified memory / >250 GB/s bandwidth**, pitched at running **30B+ models locally, unmetered**. First on AMD Ryzen AI Halo mini-desktops; a Lenovo unit arrives **Nov 2026 from $3,699**. Announcement, not a download — the hardware-class definition is the reportable part (it maps onto the Shadow VM / local-inference tier decisions already made).
5. **Apple `coreai-models`:** *DFlash speculative-decoding drafter for Muse Glimmer* (#228, Sep 5), InputLayout descriptor analysis (#227). **The `CoreAILanguageModel` / `MLXLanguageModel` packages are still absent** (GitHub-wide search: one third-party 0-star repo). New `apple` org repo Sep 4 is a dataset (`ml-fine-grained-error-slice-discovery-dataset`), not Foundation Models. **Labor Day Sep 7 is in 2 days — decide on the Sep 7–8 run.**
6. **Flat / minor:** Anthropic newsroom newest still Sep 1 (Enterprise Frontier Safeguards). Google Developers Blog: two program posts, nothing shipped. **MCP blog unchanged** (newest "The New MCP Roadmap"); `modelcontextprotocol/servers` still 2026.8.31; **Agent Plugins still 0 tags.** `Qwen` org newest still Qwen-Drive-1.0-4B; NVIDIA posted NVFP4 quants of Qwen3.8-Max and Flash-Next (Sep 3–4). `zai-org/GLM-5.3` and `-Flash` got a HF re-upload Sep 4 (open since Aug 26 — not new). Muse Spark weights: absent. DLSS 5 went live Sep 3 as pre-announced.

### Medical Simulation (§D)

7. 🔧 **`Project-MONAI/physiotwin4d` → `Project-MONAI/monai-physio` — renamed Sep 5** (#133 "Rename the project from PhysioTwin4D to MONAI Physio"). [Repo](https://github.com/Project-MONAI/monai-physio) · [docs](https://project-monai.github.io/monai-physio/). **Corrects the 09-03 report's links and name** (old URLs redirect). README now: *"A collection of methods, workflows, tutorials, and CLI tools for creating personalized physiological digital twins."* Same scope (CT/MRI → anatomy → AI surrogates for cardiac + respiratory motion, expanding to electrophysiology / blood flow / perfusion), same Apache-2.0, same non-clinical disclaimer. **PyPI `monai-physio` does not exist yet** — `physiotwin4d 2026.8.0` (Aug 14) is still the installable artifact; expect a renamed release. Other in-window work: **reconstruction using Mean/Max over time** (#132), doc/tutorial refresh (#131), install-procedure rewrite (#134, open, under review tonight). Promotion to the MONAI brand two days after this scout found it is a signal the project is being elevated, not sunset.
8. **Isaac for Healthcare — 14 NVIDIA-signed agent skills published Sep 4** ([PR #240](https://github.com/isaac-for-healthcare/i4h-workflows/pull/240), `skills/` tree). Each skill ships **`SKILL.md` + `skill-card.md` + `BENCHMARK.md` + an OMS signature file (`skill.oms.sig`)** with "NVIDIA content-integrity verification." Skills: `i4h-workflow-create`, `-e2e`, `-train-rl`, `-dataset-annotate/-convert/-mimic/-replay/-teleop`, `i4h-lerobot-viz`, and more. **Two firsts:** (a) a vendor shipping *signed* Agent Skills with benchmark cards — a trust layer the `agent-plugins.org` spec explicitly excludes; (b) the v0.8.0 runtime is now agent-driveable end-to-end. Second Agent-Skills adoption datapoint in three days (after Apple's tri-client bundle, 09-03).
- MONAI core pushed Sep 4 (routine). Siemens / GE newsrooms: nothing.

### Hardware

- **IFA floor (Sep 4–5), per [Yanko](https://www.yankodesign.com/2026/09/04/smart-glasses-robot-dogs-ai-tamagotchis-and-desk-sized-supercomputers-how-ifa-2026-redefined-robots/):** **ACEMAGIC F9A** mini workstations (F9A-395 128 GB, F9A-PRO 495 192 GB; "200B–300B local LLMs") and **GEEKOM A9 Mega** (Ryzen AI 9 HX 370, 50 TOPS) — the same ≥64 GB class Project Zenith targets, no prices; **Hengbot Sirius** 1 kg robot dog (Python/C++/ROS 2, Kickstarter). **No e-ink, dev-board, or LiDAR sensor releases**; Onyx Boox still no dates. Trusted Reviews' IFA roundup returned 530 — not verified via that path.

---

## Nothing New (Watchlist)

- **OpenAI Astra** — ✅ **RESOLVED → shipped as GPT-6 Astra Sep 3.** Removed.
- **World Labs Atlas API / pricing** — ➕ **new**: early-access only; watch `worldlabs.ai/blog` + Marble release notes for "powered by Atlas."
- **three.js r186** — ➕ **new**: first tagged release carrying the native `GaussianSplat` renderer.
- **Apple `CoreAILanguageModel` / `MLXLanguageModel` + Foundation Models open-source** — week 13; **Labor Day Sep 7 in 2 days.** Escalate or strike next run.
- **Meta Muse Spark open weights** — undated "soon" (Sep 2); nothing on HF.
- **DeepMind D4RT official code** — week 19, nothing.
- **Genie 3 developer API** — still Project Genie only ($200/mo AI Ultra).
- **VGGT-Ω open access / retrained checkpoint** — no change.
- **Gemini 3.5 Pro GA** — still absent.
- **RayNeo iO SDK** — `open.rayneo.com` exists; no iO coverage published. Low priority (no camera).
- **INMO GO3 SDK** — ➕ none published; low priority (no camera).
- **XGrids LCC Scan iOS app** — ➕ announced at IFA, no date.
- **Snap Specs** — Sep 16, $2,195. Newsroom flat.
- **Ray-Ban Meta Gen 3** — Connect Sep 23–24.
- **Pico Space Pro** — Q4 2026.
- **Jetpack Compose for XR beta** — no movement.
- **Agent Plugins spec** — 0 tags; adoption is happening around it (Apple manifests, NVIDIA signed skills), not through it.
- **NVIDIA–Hugging Face close** — ➕ H1 2027; watch API/ToS.
- **Cursor Origin GA**, **GR00T N2 / Jetson T3000**, **Onyx Boox 2026 line**, **Mayo + Microsoft frontier model** (15 wk), **ARPA-H workshop report** (8 wk) — nothing.
- **Gaussian Splatting Newsletter** — cadence resumed (Sep 2); next expected early October.
- **$5 World Labs video→world test** — still the cheapest open action item; **now paired with a free Atlas early-access request.**

---

## Project Impact

- **MedSim-Game (flagship):**
  1. **GPT-6 Astra changes nothing operationally.** Same $10/$50 as Fable 5.1, AA Index five points lower, and hard constraints (no temperature, Responses-API-only tools) that would cost integration work. No OpenAI-side code exists in the flagship to break. Logged as a peer, not a migration.
  2. **VibeVoice-ASR-Streaming is the first credible open-weight voice-input path for a hands-free sim** — gloved learners talking to an LLM-NPC or calling out orders, with **hotword biasing for drug names and protocol terms** and speaker attribution for team scenarios. MIT, self-hostable, streaming. Concrete cheap step: run the 1.5B on a 60-second scripted mock-code recording with a hotword list drawn from the RxNorm-reconciled catalog and measure drug-name accuracy. Not a sprint item; a one-session spike.
  3. **three.js native splat renderer (r186 pending).** MedSim is on `three ^0.184`. Once r186 tags, splat scenes — Marble/Atlas exports, PortalCam or Insta360 X6 captures of a real sim lab — render in the existing scene stack with no third-party splat library. Nothing to do until the tag; do not add Spark or GaussianSplats3D in the meantime.
  4. **MONAI Physio (renamed):** the 09-03 doc-read recommendation stands; update the pointer to `Project-MONAI/monai-physio`. The rename to a MONAI-branded package raises the odds it becomes the community's reference "physiological twin" — the vocabulary MedSim's physiological-clone docs should be able to map onto.
  5. **NVIDIA signed skills** are a pattern worth copying when MedSim ships its own agent skills for scenario authoring: skill card + benchmark + signature per skill.
- **MedCapture (Tier-2):** VibeVoice streaming ASR + speaker attribution is also the open path to voice-annotating captures at the bedside; no customer signal in-window.
- **3rdrider (parked):** two more sub-$800 display glasses (RayNeo iO, INMO GO3) shipped **without cameras**. The market is splitting camera-free/display vs camera/no-display; the blocker's "camera+mic+display <$800" combination has no shipping instance. See below.
- **haptic-mirror (parked):** Atlas is the largest move on its blocker in 19 weeks. See below.
- **BadgeMedia / Tenetrix, SW_Billing, wobble-ward:** no impact.

---

## Parked Idea Unblocks

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"
  - **What changed:** **World Labs Atlas (Sep 1)** — vendor-documented **cell-phone video → 3DGS reconstruction** with published reconstruction error (25.3 AbsRel×10⁻³, better than Pi3X/π³), depth + camera geometry as native inputs, PLY/SPZ-compatible splat output, and single-image scene completion for filling unscanned areas. **It is not open-source and not public** — early access with select partners via a free request form. D4RT itself: still absent.
  - **Recommended action:** **WAIT, with one zero-cost action: submit the Atlas early-access form** (`form.typeform.com/to/zHFR4r3A`) — reversible, no spend, and it converts a partner-gated capability into a possible in-hand tool. The blocker's "open-source" clause is still unmet; the "equivalent tooling from short video" clause now has a named, benchmarked instance. The $5 Marble test remains the shipped-today check of the premise.

- **Idea:** AI video / scene generator with synchronized 6-direction output
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a public API … (b) build from 3D primitives, requires display-cube-six-screens first"
  - **What changed:** Atlas is a *competitor* that takes **explicit camera geometry as input** and generates camera-controlled 1440p video plus a consistent 3DGS scene from as little as one image — i.e. six fixed camera poses from one scene is the documented mode of operation, not a workaround. **Still not a public API.** Path (b) unchanged. The 08-06 PROMOTE (Marble PLY/GLB export → render six views yourself) still stands as the available route.
  - **Recommended action:** **WAIT** on (a) until Atlas is in the World Labs API; the same early-access request covers this idea. No new spend.

- **Idea:** Resume 3rdrider when consumer-grade AR glasses ship at viable price/form
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"
  - **What changed:** RayNeo iO shipping ($449, no camera, no iO SDK); INMO GO3 shipping ($599, prescription ✅, binocular display, **no camera**, no SDK). Both fail on the camera axis.
  - **Recommended action:** **WAIT.** Strike INMO GO3 alongside RayNeo iO. Remaining candidates: Snap Specs (Sep 16, over threshold), Ray-Ban Meta Gen 3 (Sep 23–24, display unknown).

- **Idea:** MedSim — Learner Analytics & Psychometric Instrumentation / Ultrasound sim trainer / Print-bank — **no change**; blockers are internal traction or customer validation, untouched by this window's tooling news (VibeVoice, MONAI Physio are technical tailwind only, per the 09-03 distinction).

- **All other parked ideas** (`ai-augmented-field-sales-scaling`, `display-cube-six-screens`, `ems-event-robot-fleet`, `group-matchmaking-cascading-tinder`, `instrumented-task-marketplace-for-ai-training`, `longplay-monument`, `medcapture-hand-kinematics-robotics`, `medcapture-humanoid-robot-extension`, `medcapture-stereo-second-camera`, `medical-mmo-open-world`, `medsim-marketing-gtm`, `medsim-revenue-angles-expansion`, `medsim-school-employer-custom-content`, `military-parallel-pipeline`, `painting-wars-pixel-rts`, `regional-ems-ecosystem-simulator`, `runway-dev-portal-exploration`, `swappable-shells-animated-screens`, `zoll-stryker-bracket`) — **no in-window developments touch their blockers.** `telegram-inline-keyboard-question-protocol`: the owner call flagged 09-01 (transport muted 08-30) is still open and unactioned.
