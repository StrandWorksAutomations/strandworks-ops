# Tech Scout Report — 2026-10-19

**Window:** 2026-10-13 → 2026-10-19 (7 days; normal weekly cadence — previous report dated 2026-10-12).

**Major events swept in window:** No large industry conference landed inside the window. OpenAI DevDay Exchange Bengaluru was Oct 16 and DevDay Tokyo is Oct 20 (tomorrow — next week). The week was moderate: no single earth-shaking release, but several deliberate steppings-forward on previously-tracked threads.

**Headline shifts of the week:**

1. **NVIDIA Nemotron 3.5 family dropped on Hugging Face Oct 15 under OpenMDW license** — multiple open-weight variants: Super VL 120B-A12B (MoE vision-language, GPQA-Diamond 89.52% / MMLU-ProX 76.91%), Lightning 30B-A3B (MMLU Pro 81.94%, SWE-bench Verified 51.56%), Parse (document understanding; 75.20 mean on ParseBench, 84.67% on tables / 64.40% on charts), Content Safety (fine-tuned Gemma-3-4B), and ASR Streaming 0.6B. [HF — Super VL 120B NVFP4](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4) · [HF — Lightning 30B BF16](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16) · [HF — Parse](https://huggingface.co/nvidia/Nemotron-3.5-Parse) · [HF — Content Safety](https://huggingface.co/nvidia/Nemotron-3.5-Content-Safety) · [HF — ASR Streaming 0.6B](https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b). **Why it matters — directly MedSim/MedCapture-relevant open weights:** Nemotron 3.5 Parse is a serious document-ingestion option for clinical PDF/chart ingestion that we don't have to send off-premises. Content Safety is a PHI/safety filter at 4B that fits an edge box. ASR Streaming 0.6B is an on-device transcription candidate for any clinician-side voice capture surface. Super VL 120B is a vision-language ceiling we can self-host if we ever need to score video clinical scenarios without Anthropic-API spend.

2. **Android XR SDK 1.0.0 RC02 shipped Oct 7, 8 bug fixes only, 28 days after RC01 — GA proximity narrowing but still not shipped.** [mixed-news — RC02 analysis](https://mixed-news.com/en/android-xr-sdk-1-0-0-rc02-memory-leak-race-condition-fixes/). Memory leaks / context leaks / race conditions, no new APIs. **However:** `androidx.xr.compose` remains at 1.0.0-beta01 — the UI toolkit library has not reached RC. **Why it matters — correction to a loose reading of last week's news:** some third-party outlets (`vr.org`) wrote up "Android XR SDK 1.0 Went GA" posts; those appear to be either incorrect or forward-looking. The reality is RC-grade pre-GA, with the Compose layer still beta. For the 3rdrider parked blocker, "developer SDK shipping" is substantially closer than a week ago but not yet landed. Samsung Galaxy Glasses are supposed to ship in November on this SDK, so GA is weeks-to-couple-months away at most.

3. **FDA GenAI medical device comment docket (FDA-2026-N-7874) closes TODAY (Oct 19).** [MDDI — comment-period overview](https://www.mddionline.com/artificial-intelligence/fda-seeks-input-on-regulatory-framework-for-genai-medical-devices) · [Innolitics — discussion paper breakdown](https://innolitics.com/articles/fda-generative-ai-medical-devices-discussion-paper/) · [TechJack — Oct 19 deadline](https://techjacksolutions.com/ai-brief/fda-genai-medical-device-discussion-paper-comment-2026/). The paper is a discussion paper, not draft/final guidance — no policy change proposed. **Why it matters — this is informational for us, not actionable.** MedCapture collects clinical hand-motion data; if any downstream model ever leaves "research dataset" territory and enters "clinical decision support" classification, this docket's eventual framework is the one it would be regulated under. The comment window closing today means no filing of our own (we have nothing to say that isn't already in incumbent manufacturers' comments), but the next watch item is: **when does FDA issue the follow-up draft guidance?** That's the moment the regulatory shape becomes concrete.

4. **Spirula Studio v2026.10.16 added spherical beta lobes from Deformable Beta Splatting plus RoMa v2 dense initialization through Vulkan.** [Radiance Fields coverage](https://radiancefields.com/). Oct 16 release. **Why it matters — small but real step for the "capture → navigable 3D" tooling path** that `ai-multiview-video-generator.md` path (b) and `haptic-mirror-d4rt.md` both ride on. View-dependent color via spherical beta lobes is a quality improvement over spherical harmonics for reflective/translucent surfaces (relevant to any clinical/body/organ capture work). RoMa v2 Vulkan dense init is a feature-matching improvement — faster, more robust camera estimation from unordered image sets.

5. **Voxel51 FiftyOne 3.0 relaunched Oct 17 as a "physical AI" platform with native Gaussian splat rendering.** [Radiance Fields coverage](https://radiancefields.com/). Not a this-week MedSim need but a signal: **the mainstream vision-dataset tooling stack is now treating 3DGS as a first-class data primitive**, not a research artifact. For any future MedCapture dataset browser / curation tool, Voxel51 is a strong first-call vs. rolling our own.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Android XR SDK 1.0.0 RC02 — Oct 7 (last week; corrective note this week)** — [mixed-news — RC02 analysis](https://mixed-news.com/en/android-xr-sdk-1-0-0-rc02-memory-leak-race-condition-fixes/). Second release candidate, 28 days after RC01. **8 bug fixes, 0 new APIs** — stability-only pass. Memory leaks, context leaks, race conditions. `androidx.xr.compose` still at `1.0.0-beta01` — UI toolkit lags core libraries. **Correction to loose coverage:** last week's `vr.org` article headline implied "Android XR SDK 1.0 Went GA." That is not correct per the article's own correction notice; current state is RC02, GA is "close but unannounced." Samsung Galaxy Glasses launch in November is the proximate forcing function. **Why it matters:** developer-SDK piece of the 3rdrider blocker is substantially closer but not landed. Any build-against-GA plan is weeks-to-months out, not days. See Parked Idea Unblocks.

- **XREAL AURA — final payment deadline Oct 17 for Founder Priority Pass holders; ships "mid-November."** [mixed-news — Oct 17 payment deadlines](https://mixed-news.com/en/xreal-aura-1279-payment-deadlines-october-17/) · [AndroidCentral — AURA official pricing + Priority Deposit active](https://www.androidcentral.com/gaming/virtual-reality/xreal-aura-official-pricing-revealed-priority-deposit-remains-active-as-we-look-to-the-holidays). $1,279 start. No new specs since last week; this is a shipping-timeline tightening only. **Why it matters:** confirms AURA is actually arriving in November (not slipping). Second Android XR SKU after Samsung Galaxy Glasses. We are not buying this at $1,279; the Samsung at $379–$499 remains the one that moves the 3rdrider blocker.

- **Samsung Galaxy Glasses — still November 2026, no new confirmation date in window.** [Tempo — Samsung AI smart glasses Nov 2026](https://en.tempo.co/read/2120958/samsung-to-launch-ai-powered-smart-glasses-in-november-2026) · [Sammy Fans — Samsung prepares Nov launch](https://www.sammyfans.com/2026/10/01/samsung-prepares-to-launch-ai-smart-glasses-in-november-2026/) · [Streamline — Samsung Nov launch confirmation roll-up](https://streamlinefeed.co.ke/news/samsung-confirms-november-launch-for-ai-powered-galaxy-glasses). All coverage this week is roll-forward of the Oct 1 Korea Herald statement. No specific day announced yet. Still $379–$499, Warby Parker + Gentle Monster frames, Gemini on Android XR, 9hr battery, charging case +7 charges, 12MP camera.

- **Meta Adventurer — ships Oct 23 (next week).** [Meta.com — Adventurer page](https://www.meta.com/ai-glasses/meta-glasses/adventurer/) · [mixed-news — $249 Adventurer Oct 23](https://mixed-news.com/en/meta-adventurer-249-ai-glasses-october-23/) · [Geeky Gadgets — real-world test](https://www.geeky-gadgets.com/meta-adventurer-ai-glasses-review/) · [Geeky Gadgets — hands-on review](https://www.geeky-gadgets.com/meta-adventurer-hands-on-review/) · [OXIVUE — Adventurer guide](https://oxivue.com/guides/meta-adventurer-glasses). $249. 12MP, 3K@30fps video, open-ear audio, 8+hr battery (+40hr case). **No display.** Hands-on previews are positive. **Why it matters:** cheapest camera-equipped mainstream AI glasses yet. Still fails the 3rdrider blocker (no display). Reference ceiling-breaker for "price floor on AI eyewear with camera + audio + voice assistant." Watch early-adopter return rate and software-support longevity.

- **Ray-Ban Meta Audio — shipped Oct 13 (last Monday).** [Meta blog — Ray-Ban Meta Audio](https://www.meta.com/blog/ray-ban-meta-audio-and-deepest-ai-glasses-lineup/). Camera-free $349 SKU is now in customer hands. No incident / policy / review coverage in window worth flagging. **Why it matters:** rolling forward; no issues observed in the first week of general availability.

- **Snap Spectacles — still "fall 2026" with no narrower date.** [iDevice tracker](https://idevice.com/smart-glasses/snap-spectacles/roadmap). No material movement in window.

### Spatial Computing / 3D

- **Spirula Studio v2026.10.16 — Oct 16** — [Radiance Fields coverage](https://radiancefields.com/). Spherical beta lobes from Deformable Beta Splatting for view-dependent color, plus RoMa v2 dense initialization through Vulkan. **Why it matters:** quality + capture-pipeline step on the generative-3D stack. Spherical beta lobes handle reflections/translucence better than spherical harmonics — more faithful rendering of surfaces that matter in a MedCapture-type context (wet tissue, instruments, specular surfaces). RoMa v2 dense init through Vulkan improves camera-pose estimation on unordered image sets, which is the step most likely to fail on a casual capture.

- **Voxel51 FiftyOne 3.0 — Oct 17** — [Radiance Fields coverage](https://radiancefields.com/). Platform relaunch targeting "physical AI" with native Gaussian splat rendering. **Why it matters:** the mainstream dataset-tooling stack now treats 3DGS as a first-class data primitive. For any MedCapture dataset browser / curation UI, Voxel51 becomes a strong default rather than rolling custom tooling.

- **Eclipse RealitySync — Oct 17** — [Radiance Fields coverage](https://radiancefields.com/). Free public preview on iPhone, iPad, and Apple Vision Pro. Spatial sync / capture pipeline. **Why it matters:** another consumer-grade capture → viewer flow. Nothing to spend on immediately, but notable that iOS/visionOS spatial capture tooling is proliferating fast.

- **SplatGen for Blender 5.3 Alpha — Oct 7 (last week)** — [Radiance Fields coverage](https://radiancefields.com/). Builds camera datasets, trains Gaussian splats with new V2 trainer, relights in EEVEE and Cycles. Rolling forward from last week's listing; the Blender integration path matters for any future MedSim-adjacent 3D content pipeline that wants artist-controlled lighting on a captured splat.

- **nerfstudio Gaussian Splatting merged to main — rolling** — [Radiance Fields coverage](https://radiancefields.com/). The long-requested merge happened; now native in nerfstudio main. Not a this-week release but worth noting as the de-facto open-source splatting training stack consolidates.

- **No world-model news in window.** Odyssey-3's Oct 8 free public preview and Genie 3's existing Ultra-tier access remain the frontier. SIMA 2 (Nov 2025 release) continues to be the ambient best-in-class agent-in-world benchmark. No new Marble / World API / SpAItial / Decart release in window. See `haptic-mirror-d4rt.md` supplier-diversification note — the AMD/World Labs acquisition still has not produced any Marble pricing/ToS statement.

### AI / ML

- **NVIDIA Nemotron 3.5 family — Oct 15 — Hugging Face, OpenMDW license** — [HF — Super VL 120B NVFP4](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4) · [HF — Super VL 120B BF16](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16) · [HF — Super VL 120B Base BF16](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-Base-BF16) · [HF — Lightning 30B BF16](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16) · [HF — Lightning 30B NVFP4](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-NVFP4) · [HF — Lightning 30B GGUF (Unsloth)](https://huggingface.co/unsloth/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-GGUF) · [HF — Parse](https://huggingface.co/nvidia/Nemotron-3.5-Parse) · [HF — Content Safety](https://huggingface.co/nvidia/Nemotron-3.5-Content-Safety) · [HF — ASR Streaming 0.6B](https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b). **Benchmarks (NVIDIA-run in NeMo Gym / Nemo Evaluator SDK):**
  - **Super VL 120B-A12B** (MoE VL): GPQA-Diamond 89.52, MMLU-ProX 76.91, AA-Omniscience 26.20, AA-LCR v1.1 68.62. Multilingual + vision + reasoning.
  - **Lightning 30B-A3B** (fast MoE): MMLU Pro 81.94, GPQA Diamond 75.44, SWE-bench Verified 51.56.
  - **Parse**: 75.20 mean on ParseBench (84.67 tables, 64.40 charts). Dynamic rectangular NaViT preprocessing.
  - **Content Safety**: fine-tune of Gemma-3-4B-it for safety classification.
  - **ASR Streaming 0.6B**: streaming automatic speech recognition at edge size.
  - **Why it matters — this is the week's single biggest MedSim/MedCapture-adjacent open-weights drop.** Open weights (OpenMDW), vision-language, document-parse, PHI-filtering, and ASR, all from one vendor, all in one week. If MedCapture ever needs an on-prem / self-hosted ingest pipeline for clinical video + ASR + chart/table extraction, Nemotron 3.5 Parse + ASR Streaming + Content Safety is a credible full-stack option that avoids per-call Anthropic/OpenAI fees for the batch work. Super VL 120B is a reasoning-grade reference for scoring long-form clinical scenarios. **Action: file the Parse and Content Safety models in the MedCapture tech-radar for the ingest pipeline when it exists; no immediate replacement of our Claude usage.**

- **Qwen3 VL 4B + Qwen3 VL 8B Instruct — Oct 14** — [opper.ai release tracker](https://opper.ai/model-releases). Smaller open-weight vision-language instruct variants in the existing Qwen3 VL line (parent family dates to Sept-Oct 2025; these are new SKU additions at edge/consumer sizes). Apache 2.0. **Why it matters:** small-VL continues to proliferate. For any MedSim side-task that wants edge-size image-scoring (e.g. "is this screenshot of the patient monitor showing the expected waveform?"), the 4B/8B class is now well-covered across multiple vendors (Qwen, NVIDIA Nemotron 3.5 Content Safety at Gemma-3-4B base, Liquid AI d1-3B/d1-omni-600M flagged last week).

- **Muse Spark Open — Oct 15 (Microsoft)** — [opper.ai release tracker](https://opper.ai/model-releases). Open-weight follow-up in the Microsoft Muse line. Thin coverage; watchlist for next week on scope/benchmarks.

- **No material OpenAI release in window.** DevDay Exchange Bengaluru landed Oct 16 inside the window but produced no new model/API drop that affects MedSim/MedCapture; DevDay Tokyo is Oct 20 (next window). GPT-6 Intelligent UI rollout from Oct 7 continues to percolate but nothing new this week.

- **No material Anthropic release in window.** Claude Haiku 5.5 pricing from Oct 7 remains the active story; see last week's report for the ~10× cost cut on batch-fanout workflows. **The one false flag to kill:** search results surfaced a line about "Claude 4.5 Haiku released October 15" — this is a reference to **last year** (Oct 15, 2025 was 4.5 Haiku); do not confuse with Haiku 5.5 (Oct 7, 2026).

- **Anthropic eval-isolation incident policy continuing — rolling** — No new coverage in window beyond last week's note that internet was pulled from internal evaluations after a Haiku 4.5 fabricated-tip incident. The lesson stands: any MedSim playtest/eval fleet must run with explicit outbound allowlist, not open internet.

### Hardware

- **No material humanoid price movement in window.** [Unitree R1 Basic $8,990 as of Oct 5](https://botinfo.ai/articles/unitree-r1-humanoid-robot) · [Unitree G1 Basic $17,990](https://theresarobotforthat.com/blog/unitree-g1-price/) · [Figure 03 / Atlas / Digit / Apollo quote-only enterprise](https://blog.robozaps.com/b/humanoid-robot-price) · 1X NEO $20,000 or $499/mo. **Why it matters:** the `ems-event-robot-fleet.md` blocker (Go2 at ~$1K, G1 at ~$10K) remains unmoved. G1 at $17,990 is 1.8× over the blocker's $10K target; R1 Basic at $8,990 is close to the quadruped target but is a different form factor. Weekly check: no movement.

- **No new AR dev-kit or dev-board hardware release in window.** The Catalyst Program app window closed June 30, 2026; no new windows announced. Snap Spectacles dev program unchanged. Meta Wearables Device Access Toolkit unchanged.

- **No new LiDAR / RF-sensing hardware release in window.**

### Medical / Clinical AI

- **FDA generative-AI medical device discussion-paper comment deadline — closes TODAY Oct 19.** Docket **FDA-2026-N-7874**. [MDDI overview](https://www.mddionline.com/artificial-intelligence/fda-seeks-input-on-regulatory-framework-for-genai-medical-devices) · [Innolitics breakdown](https://innolitics.com/articles/fda-generative-ai-medical-devices-discussion-paper/) · [Katten quickread](https://quickreads.ext.katten.com/post/102nqr7/fda-seeks-public-feedback-on-regulatory-approach-for-generative-ai-enabled-medica) · [TechJack deadline note](https://techjacksolutions.com/ai-brief/fda-genai-medical-device-discussion-paper-comment-2026/) · [NovaPharma coverage](https://novapharmanews.com/us/news/fda-generative-ai-medical-devices-discussion-paper-august-2026) · [AllSci coverage](https://allsci.com/news/policy/fda-generative-ai-medical-devices-seeks-public/) · [FolkFox — 6 steps before Oct 19](https://folkfox.com/ai-medical-devices-generative-ai-claims-fda-mhra/). Discussion paper only (not draft/final guidance); FDA explicitly notes it proposes no policy change and does not address whether its approaches fit within existing legal authority. **Why it matters — no filing need from us today, but the next watch item is the follow-up draft guidance** that will materialize sometime after FDA digests the comments. Any eventual MedCapture-derived model that leaves "research dataset" territory and crosses into clinical decision support classification would be regulated under whatever framework emerges. Flag the next FDA announcement in this docket when it drops.

- **SimX webinar Oct 7 "Immersive Simulation in Healthcare Education"** — [HealthySimulation listing](https://www.healthysimulation.com/webinars/immersive-simulation-healthcare-education-outcomes-simx/) · [SimX homepage](https://www.simxvr.com/). SimX launched Autonomous Simulation in June 2026 (learner completes expert-validated scenario without instructor), continuing to roll out CME/CE content. **Why it matters:** SimX's "autonomous VR clinical encounter with CME/CE credit" offering is the single closest direct neighbor to MedSim-Game. Track for pricing + accreditation signals; see Project Impact.

- **Mayo Clinic Healthcare Simulation Conference Oct 1-2 (slightly before window; context only)** — [Mayo conference page](https://ce.mayo.edu/simulation-training/content/mayo-clinic-healthcare-simulation-conference-2026). Program included "Expanding Clinical Learning Through Virtual Reality: Integrating VR Simulation into Healthcare Education" session. Not an announcement; a venue indicator — Mayo is still actively programming VR-sim track content.

- **No other material medical-AI release in window** — Wolters Kluwer / Laerdal, Oxford Medical Sim, and other sim vendors unchanged from last week.

---

## Nothing New (Watchlist)

- **Apple Foundation Models framework open-source** — [WWDC 2026 session 241](https://developer.apple.com/videos/play/wwdc2026/241/) — WWDC committed to "later this summer 2026." **Watchlist Week 19.** Still no repo, no official Apple announcement. Treat NYU-adjacent blog claims as unverified.

- **Android XR SDK stable GA release** — RC02 Oct 7 was bug-fix pass only. Watch for GA announcement, which must land before Samsung Galaxy Glasses ship in November. Watching the [Android Developers Blog](https://android-developers.googleblog.com/) and `androidx.xr.*` artifact feeds.

- **Samsung Galaxy Glasses specific launch date** — "November 2026" per Oct 1 Korea Herald statement. Still no day. Watch for Samsung press event announcement.

- **XREAL AURA actual ship date** — "mid-November" per customer-facing comms; final payment Oct 17 came and went. Watch for first-unit reviews in Nov.

- **Snap Spectacles consumer SKU launch date** — "fall 2026." No narrower window.

- **URXR One Kickstarter backer shipments** — expected mid-October; no confirmation this week. Rolling to next week's watchlist.

- **World Labs Marble ToS / pricing / support status post-AMD acquisition** — AMD-World Labs $8.2B all-stock deal (Sept 28) closes by end of 2026; neither party has addressed Marble product continuity. Haptic-mirror supplier-diversification note stands: prefer NVIDIA NuRec (self-hosted) or SpAItial Echo-2 (independent) over Marble for any new spend.

- **FDA follow-up draft guidance in docket FDA-2026-N-7874** — docket closes today; follow-up guidance timing unknown. Watch quarterly for next FDA notice.

- **OpenAI DevDay Tokyo Oct 20 (tomorrow)** — explicitly outside this window; next report will cover any announcements.

- **xAI Grok Imagine Video 1.5 Lite deeper coverage** — flagged last week with thin reporting; no follow-up this week.

- **Microsoft Decision-1 weight-availability** — flagged last week as unknown; still unknown.

- **Reka Edge 2603 deeper coverage** — flagged last week; still thin.

- **FDA Oct 19 deadline** — now expired; move to "monitoring FDA for next action."

---

## Project Impact

- **MedSim-Game (flagship):**
  - **Nemotron 3.5 Super VL 120B-A12B** is a self-hostable VL ceiling with GPQA-Diamond at 89.52 — if we ever need to score long-form clinical scenario trajectories off-API, this is now a credible open-weights option. **Action: file in MedSim tech-radar, no immediate adoption.**
  - **Spirula / Voxel51 / Eclipse / nerfstudio GSplat updates** collectively tighten the generative-3D stack. No immediate flagship need, but if MedSim-Game ever ships a 3D clinical-environment asset pipeline, these are now the default toolchain to reach for over rolling custom.
  - **SimX Autonomous Simulation + VR CME continues to be the closest neighbor product.** Watch SimX pricing + accreditation; direct competitive signal for the MedSim-Game MMO revenue thesis.

- **MedCapture:**
  - **Nemotron 3.5 Parse** is the week's most-relevant item. 75% ParseBench / 85% on tables / 64% on charts, with dynamic rectangular NaViT preprocessing — a strong candidate for any clinical PDF / chart / lab-report ingestion when a self-hosted pipeline is needed. **Action: file in MedCapture tech-radar for pipeline design.**
  - **Nemotron 3.5 Content Safety (Gemma-3-4B fine-tune)** is a plausible on-device PHI classifier for the ingest pipeline. **Action: file alongside Parse.**
  - **Nemotron 3.5 ASR Streaming 0.6B** is edge-size ASR; a credible component for any clinician-side voice-dictation accessory concept (reference: Ray-Ban Meta Audio $349 as the "camera-free glasses that get through hospital policy" form factor).
  - **FDA GenAI docket closes today** — no action required now; set a quarterly reminder to check for the follow-up draft guidance that will eventually define classification criteria for CDS-flavored MedCapture-derived models.

- **BadgeMedia / Tenetrix Insight:** No relevant news this week.

- **3rdrider (parked):** Android XR SDK moved from RC01 → RC02. Samsung Galaxy Glasses November launch remains the specific trigger event. See Parked Idea Unblocks.

- **Haptic-mirror-D4RT (parked):** No new world-model news. Marble/AMD status unchanged — the supplier-diversification note stands.

---

## Parked Idea Unblocks

- **Idea:** 3rdrider — Snap Spectacles consumer AR glasses venture
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800."
  - **What changed:** Android XR SDK moved to RC02 on Oct 7 (second release candidate, 8 bug fixes, stability-focused). This is the "developer SDK" leg of the blocker tightening further — RC-grade is substantially closer to "shipping" than beta, and GA must land before the November Samsung Galaxy Glasses launch. The Samsung-at-$379–$499 side of the blocker was already satisfied last week.
  - **Recommended action:** **WAIT** — the full blocker still requires GA (not RC) AND an actual retail Samsung Galaxy Glasses date. Both are expected in November. **Re-evaluate the week Samsung Galaxy Glasses ship**, which should be the week the 3rdrider blocker crosses from "satisfied in principle" to "ready to actually prototype against hardware you can buy." Do not re-promote the idea yet; the three gating conditions should land together.

- **Idea:** AI Multi-view Video Generator
  - **File:** `_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "Two paths, both blocked: (a) wait for Google Genie 3 (or competitor) to expose multi-view export as a public API feature... (b) build it from existing 3D primitives (Blender / Gaussian Splatting / NeRF) plus an AI scene-generation front-end — feasible today but requires the display-cube-six-screens project to exist first..."
  - **What changed:** Path (b) tooling got incrementally better this week: Spirula Studio v2026.10.16 added better view-dependent color + Vulkan dense init; Voxel51 3.0 added native Gaussian-splat rendering as a mainstream data-platform primitive; Eclipse RealitySync opened a free iOS/visionOS spatial-capture preview; SplatGen for Blender 5.3 Alpha landed last week. The practical 3D-primitives path is cheaper and more polished than it was two weeks ago. Path (a) is unchanged — no new multi-view export API from Genie 3 / Odyssey / Marble this week.
  - **Recommended action:** **WAIT** — the technical path (b) is improving but the *actual* blocker for this idea is the `display-cube-six-screens.md` parent project not existing. The 3D-primitive tooling getting better doesn't change that gating. Keep in watchlist; revisit when display-cube actually gets scheduled.

- **Idea:** Haptic Mirror — D4RT / world-model body sim
  - **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** (long form; see file) — essentially gated on MedSim flagship progress + a reliable supplier for scene-gen capture.
  - **What changed:** Nothing material this week for the direct blocker. The supplier-diversification note (prefer NuRec or SpAItial Echo-2 over Marble post-AMD-acquisition) is unchanged — no Marble ToS/pricing statement in window.
  - **Recommended action:** **WAIT** — same as last week.

- All other parked ideas (`medcapture-stereo-second-camera.md`, `medcapture-hand-kinematics-robotics.md`, `medcapture-humanoid-robot-extension.md`, `sim-lab-mockup-print-bank.md`, `sim-lab-rfid-ultrasound-trainer.md`, `ems-event-robot-fleet.md`, `regional-ems-ecosystem-simulator.md`, `medical-mmo-open-world.md`, `medsim-marketing-gtm.md`, `medsim-data-gathering-analytics.md`, `medsim-revenue-angles-expansion.md`, `medsim-school-employer-custom-content.md`, `military-parallel-pipeline.md`, `zoll-stryker-bracket.md`, `group-matchmaking-cascading-tinder.md`, `instrumented-task-marketplace-for-ai-training.md`, `painting-wars-pixel-rts.md`, `longplay-monument.md`, `display-cube-six-screens.md`, `swappable-shells-animated-screens.md`, `runway-dev-portal-exploration.md`, `telegram-inline-keyboard-question-protocol.md`, `ai-augmented-field-sales-scaling.md`) — **blockers unchanged by this week's releases.** No action.
