# Tech Scout Report — 2026-07-28

**Window:** 2026-07-20 → 2026-07-28 (prior report 2026-07-20).

## Gap Backfill

Last report was **8 days ago** (2026-07-20), exceeding the 2-day daily cadence. This report widens
the window to cover the full gap, and explicitly sweeps the two calendar events flagged last week
as falling inside it:

- **SIGGRAPH 2026** (July 19–23, Gaussian Splatting BoF July 21) — swept below.
- **Samsung Galaxy Unpacked London** (July 22) — swept below. **This was the 3rdrider parked-idea
  trigger event.** It fired, and it did **not** unblock the idea. Detail in Parked Idea Unblocks.

Three watchlist items cleared in-window (**Cosmos 3 Edge weights**, **Kimi K3 weights**,
**Cerebras Sol**), and one carried a **material license correction** to last week's report.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Samsung "Intelligent Eyewear" revealed at Unpacked London, July 22 — name only, no price, no
  date, no SDK.** [VR.org post-event analysis](https://vr.org/articles/samsung-intelligent-eyewear-unpacked-reveal-no-price-2026) · [VR.org developer preview](https://vr.org/articles/galaxy-unpacked-july-22-galaxy-glasses-android-xr-developer-watch-2026) · [Gadget Hacks](https://samsung.gadgethacks.com/news/samsung-galaxy-glasses-launch-july-2026-features-privacy-and-tradeoffs/) · [Road to VR](https://roadtovr.com/samsung-reveals-smart-glasses-unpacked-gentle-monster/). Samsung unveiled its first AI glasses — branded **Intelligent Eyewear**, built with **Gentle Monster and Warby Parker**, running an always-available **Gemini** voice assistant with camera-fed context. Confirmed: audio-only (no display), 12MP camera, speakers + mics, all processing offloaded to a paired Galaxy phone, ~9h mixed-use battery with a case good for ~7 recharges, **retail fall 2026 in select markets**. **What Samsung declined to state: price, exact ship date, weight, camera detail, and — critically — anything for developers. No Android XR SDK, no developer guidance, no dev-kit program.** The leaked $379–$499 figure was neither confirmed nor denied. This is a tease, not a launch.
- **xMEMS XMC-1200 solid-state micro fan announced July 21.** [Glass Almanac AR device roundup](https://glassalmanac.com/7-ar-devices-revealed-in-july-2026-that-show-what-changes-next/). ~10 °C reduction at a 1 W thermal load in a chip-scale, no-moving-parts package. Relevant because thermal headroom is the binding constraint on how long camera-plus-inference glasses can run before throttling — this is the class of component that lets an always-on wearable stay always-on.
- **Science Corporation PRIMA received EU approval July 22.** [Glass Almanac](https://glassalmanac.com/7-ar-devices-revealed-in-july-2026-that-show-what-changes-next/). Retinal implant + camera-glasses system cleared for commercial rollout in Europe. Not portfolio-actionable, but it is the first regulated **medical** device whose delivery surface is a pair of glasses — a precedent worth having on file for any future clinical-wearable regulatory question.
- **XREAL a01+ ($299, shipped July 17)** — pre-window but the price floor that matters. [VR.org](https://vr.org/articles/xreal-a01-plus-299-display-glasses-ar-that-sells-2026). 1,600-nit micro-OLED, 50° FoV. Notable in contrast with Samsung: the display-equipped, actually-purchasable device this month costs $299 and it is not from a platform vendor.
- **Snap Specs — unchanged.** $2,195 preorder, "fall 2026" ship. No sharper date in-window.

### Spatial Computing / 3D

- **NVIDIA Cosmos 3 Edge (4B) weights SHIPPED — July 20/21, Hugging Face, OpenMDW-1.1.**
  [HF model card `nvidia/Cosmos3-Edge`](https://huggingface.co/nvidia/Cosmos3-Edge) · [NVIDIA HF blog](https://huggingface.co/blog/nvidia/cosmos3edge) · [MarkTechPost](https://www.marktechpost.com/2026/07/21/nvidia-releases-cosmos-3-edge-a-4b-parameter-open-world-model-that-reasons-and-generates-robot-actions-on-device/) · [GitHub NVIDIA/cosmos](https://github.com/nvidia/cosmos) · [buildfastwithai guide](https://www.buildfastwithai.com/blogs/nvidia-cosmos-3-edge-complete-guide-2026). **The July 15 announcement converted to a real download within 5 days.** 4B open world model (2B dense reasoner), on-device vision reasoning + robot action generation, runs on RTX GPUs and Jetson. Weights, inference code, and post-training recipes all public under **OpenMDW-1.1 — commercial use and fine-tuning permitted.** Watchlist item closed (was 8 weeks overdue as of last week).
- **SIGGRAPH 2026 3DGS paper code is landing.** [Kesen paper index](https://kesen.realtimerendering.com/sig2026.html) · [Gaussian Point Splatting official impl](https://github.com/JorisAR/gaussian-point-splatting) · [Moments in Graphics writeup](https://momentsingraphics.de/Siggraph2026.html) · [SADGS repo](https://github.com/LinjieLyu/SADGS) · [Graphics Programming Weekly #447](https://www.jendrikillner.com/post/graphics-programming-weekly-issue-447/). Confirmed with code: **Gaussian Point Splatting** (stochastic pixel-sized-point rendering, scales to very large Gaussian counts) and **SADGS** (structure-aware densification for faster convergence). Also in the volume, code status not yet confirmed: **CoherentRaster** (3DGS for light-field displays) and **SHARP-GS** (ultra-high-resolution 3DGS pipeline).
- **LichtFeld Studio v0.5.3 — CUDA renderer retired for a full Vulkan viewer + rasterizer.**
  [Radiance Fields v0.5 coverage](https://radiancefields.com/lichtfeld-studio-releases-v0.5) · [v0.5.2](https://radiancefields.com/lichtfeld-studio-releases-v0.5.2) · [lichtfeld.io](https://lichtfeld.io/). Adds Asset Manager, RAD export, **8K splat training**, full undo/redo, ImprovedGS+, and NVIDIA **PPISP** (models real camera behavior — exposure drift, vignetting, white balance, response curves). Also gaining Python plugins and **MCP-based automation** inside the native app. The Vulkan move matters: it removes the hard CUDA dependency from the viewer path.
- **PlayCanvas SuperSplat v2.7 — SOGs support + selective per-layer export.** [Radiance Fields](https://radiancefields.com/supersplat-releases-v2-7-with-sogs-support) · [superspl.at](https://superspl.at/). You can now choose which splats across which layers get exported rather than dumping the whole scene — meaningful friction removal when iterating on one region of a large capture.
- **SketchUp Gaussian Splats extension (SketchUp Labs, June 20; picked up in coverage July 28).**
  [Radiance Fields](https://radiancefields.com/sketchup-adds-native-gaussian-splatting-support) · [SketchUp help: getting started](https://help.sketchup.com/en/getting-started-gaussian-splats) · [extension docs](https://help.sketchup.com/en/gaussian-splats-extension). Import/view/manipulate splats natively in SketchUp; formats `.ply`, `.splat`, `.spz`, `.lcc` (XGRIDS), plus a native `.sklat` edit format. **Caveats that kill it for this workstation: Windows only (no macOS), and requires an active SketchUp Pro/Studio subscription.** Logged rather than recommended.
- **AlayaWorld — correction and status.** [GitHub](https://github.com/AlayaLab/AlayaWorld) · [HF AlayaLab/AlayaWorld](https://huggingface.co/AlayaLab/AlayaWorld) · [full technical report arXiv 2607.18367](https://arxiv.org/html/2607.18367) · [arXiv 2607.06291](https://arxiv.org/abs/2607.06291). Inference code + pretrained weights actually landed **July 16** (last week's report framed the full-stack drop as still pending "this week"). Architecture confirmed as a **15B video diffusion transformer** generating short latent chunks autoregressively under camera trajectories with switchable text prompts. Full technical report is now on arXiv. No new drop inside this window — the spike recommendation stands with the repo in its current, usable state.
- **DeepMind D4RT — nothing. Week 12.** [OpenD4RT](https://github.com/Lijiaxin0111/Open-d4rt) unchanged since June 4.
- **Genie 3 — still no developer API.** [DeepMind Genie](https://deepmind.google/models/genie/). Access remains Project Genie via Google AI Ultra subscription ($250/mo, above the standing $200/mo infra autonomy gate). No change.

### AI / ML

- **Claude Opus 5 — released July 24.** [Anthropic newsroom](https://www.anthropic.com/news) · [platform release notes](https://platform.claude.com/docs/en/release-notes/overview) · [developer guide](https://essamamdani.com/blog/claude-opus-5-launch-developer-guide-july-2026) · [Requesty model page](https://www.requesty.ai/models/anthropic/claude-opus-5) · [OpenRouter](https://openrouter.ai/anthropic/claude-opus-5). **$5 input / $25 output per M tokens — same as Opus 4.8, no increase.** 1M-token context, 128K max output, **no long-context premium** (a 900K-token request bills at the same per-token rate as a 9K one), adaptive thinking on by default, and a **five-level effort setting** (low → max) that stays effective at the low end for latency-sensitive work. New default on Claude Max, strongest model on Pro. Related: **`agent-memory-2026-07-22` beta header** (stable server-defined ordering when listing memories), and **Opus 4.7 fast mode was removed July 24** — `claude-opus-4-7` with `speed: "fast"` now errors.
- **Kimi K3 open weights shipped July 27 — but the license is NOT Modified MIT.** [Moonshot HF `moonshotai/Kimi-K3-MXFP4`](https://huggingface.co/blog/ResterChed/kimi-k3-model-overview-mxfp4-quantization-open-wei) · [license analysis](https://www.digitalapplied.com/blog/kimi-k3-open-weights-shipped-license-restrictions-2026) · [TechTimes self-hosting angle](https://www.techtimes.com/articles/321551/20260725/kimi-k3-open-weights-arrive-sunday-self-hosting-cuts-china-data-risk-api-never-can.htm) · [OfficeChai](https://officechai.com/ai/moonshot-ai-releases-kimi-k3s-weights-sees-fastest-release-growth-ever-on-hugging-face/) · [self-hosting guide](https://dev.to/lola_lin_a1be8395c517b081/kimi-k3-open-weights-are-here-how-to-self-host-the-28t-parameter-model-hardware-vllm-and-data-4b0n). Weights live at 00:00 UTC July 27. 2.8T MoE, MXFP4 quantized, **~594 GB download**, native text/image/video, 1M context. Technical report plus three training-infrastructure tools released alongside. **CORRECTION to last week's report:** the license is not Modified MIT. It is a bespoke **"Kimi K3 License"** (tagged `license:other` on HF) carrying a **revenue-triggered separate-agreement clause** and a **user-interface attribution mandate**. See Project Impact — this materially weakens last week's "self-host an Opus-class model for PHI-constrained workloads" recommendation.
- **Thinking Machines Lab "Inkling" — 975B MoE, Apache 2.0.** [July open-weight wave tracker](https://www.digitalapplied.com/blog/open-weight-model-wave-july-2026-momentum-tracker) · [seven-releases roundup](https://www.digitalapplied.com/blog/seven-days-seven-releases-july-2026-model-wave). First model TML trained from scratch: 975B total / 41B active, pretrained on 45T multimodal tokens, **released under Apache 2.0**. Genuinely permissive licensing at near-frontier scale — a cleaner self-hosting story than Kimi K3 on the license axis, at roughly a third the parameter count.
- **Gemini 3.6 Flash launched July 21 — $1.50 / $7.50 per M.** [AIToolsRecap launch specs](https://aitoolsrecap.com/Blog/gemini-3-6-flash-launch-specs-pricing-2026) · [DataNorth](https://datanorth.ai/news/google-releases-gemini-3-6-flash) · [Coursiv](https://coursiv.io/blog/gemini-3-6-flash) · [digitalapplied analysis](https://www.digitalapplied.com/blog/gemini-3-6-flash-launch-analysis-google-workhorse-2026). Day-one availability across AI Studio, Gemini API, the app, Android Studio, Antigravity, and Vertex/Gemini Enterprise. 1,048,576-token context / 65,536 output, multimodal in (text, image, video, audio, PDF), **computer use built in**, and **17% fewer output tokens to complete equivalent work** vs 3.5 Flash — output rate also dropped from $9.00 to $7.50. Shipped alongside **3.5 Flash-Lite** and **3.5 Flash Cyber**.
- **Gemini 3.5 Pro — still not GA. Fourth missed window.** [CroeAi status tracker](https://croeai.com/is-gemini-3-5-pro-out-yet-july-2026/) · [CometAPI](https://www.cometapi.com/gemini-3-5-pro-release-date-rumored-specifications-all-we-know-in-2026-updated-july-2026/). Announced at I/O May 19, promised June, retargeted July 17, missed. Public API pages still list `gemini-3.5-flash` and `gemini-3.1-pro-preview` with no GA `gemini-3.5-pro` ID. Prediction markets now favor late July / early August. **Google shipped a Flash-tier model on July 21 while the Pro-tier remains vapor** — that ordering is itself the signal.
- **Cerebras Sol — resolved: launched July 10, limited customers.** [OpenAI preview page](https://openai.com/index/previewing-gpt-5-6-sol/) · [Value Add Pulse](https://valueaddvc.com/pulse/cerebras-openai-gpt-5-6-sol-750-tokens-2026) · [BigGo](https://finance.biggo.com/news/8891f78a-c330-4652-bf49-ee1c3204e108). 750 tok/s on wafer-scale hardware (~10× a GPU cluster's 40–120 tok/s for a frontier model). Access still "select customers as we expand capacity." Watchlist item closed as launched-but-gated.
- **Rest of the July 19–23 model wave:** Alibaba **Qwen3.8-Max-Preview** (7/19), **Qwen-Audio-3.0-TTS** (7/20), **Qwen-Image-3.0** (7/21); **poolside Laguna S 2.1** (7/21); Ant Group **Ling-3.0-flash** (7/23). [Roundup](https://www.digitalapplied.com/blog/seven-days-seven-releases-july-2026-model-wave). Seven models from five vendors in seven days. None individually portfolio-changing; logged for completeness.

### Medical / Clinical AI

- **Inner Logic raised $11.5M seed (July 22) to build simulation infrastructure for procedural
  devices and autonomous surgery.** [TechTimes](https://www.techtimes.com/articles/321346/20260723/inner-logic-raises-115m-build-simulation-platform-autonomous-surgery-has-been-missing.htm) · [HIT Consultant](https://hitconsultant.net/2026/07/27/inner-logic-simulation-infrastructure-procedural-devices/) · [Tech Startups](https://techstartups.com/2026/07/22/inner-logic-raises-11-5m-seed-to-build-ai-infrastructure-for-autonomous-surgery/) · [citybiz](https://www.citybiz.co/article/878109/inner-logic-raises-11-5m-to-build-testing-platform-for-surgical-devices/) · [FinSMEs](https://www.finsmes.com/2026/07/inner-logic-raises-11-5m-in-seed-funding/). Co-led by **General Catalyst and Bison Ventures**. The pitch, nearly verbatim: **replace cadaver labs with overnight virtual-patient experiments grounded in real procedural data.** Device manufacturers test heart valves, catheters, and surgical tools across thousands of virtual patients built from clinical data, using foundation perception models, computer vision, and **3D digital twins**. **This is the physiological-clone thesis, funded, aimed at device makers rather than learners.** See Project Impact.
- **The regulatory pathway underneath it is now explicit.** Coverage of the raise names the enabling
  chain: FDA's **2023 final guidance on computational modeling and simulation in device
  submissions**, plus the **January 2025 draft guidance on AI-enabled device software functions**,
  together establish that **simulation-based and digital-twin evidence can support device
  clearance.** [FDA AI-enabled medical devices](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices) · [McGuireWoods on the first patient-facing-LLM SaMD clearance](https://www.mcguirewoods.com/client-resources/alerts/2026/7/a-pathway-for-clinical-ai-developers-opens-fda-clears-first-software-as-a-medical-device-with-patient-facing-llm/). Read alongside the **ARPA-H July 16 workshop** from last report, this is now two independent federal signals in two weeks that simulation is being treated as legitimate evaluation infrastructure for clinical AI.

### Hardware

- **STMicroelectronics VL53L9 dToF 3D LiDAR — in volume production and shipping, with eval
  hardware orderable now.** [ST newsroom](https://newsroom.st.com/media-center/press-item.html/p4783.html) · [All About Circuits](https://www.allaboutcircuits.com/news/st-unveils-2.3k-zone-dtof-3d-lidar-module-for-resource-limited-edge-ai/) · [New Electronics](https://www.newelectronics.co.uk/content/product-launches/stmicroelectronics-compact-vl53l9-3d-lidar-module-targets-edge-ai-applications). **2.3K zones, 100 fps, 5 cm – 9 m range, on-chip processing**, outputs AI-ready depth for MCU-class edge inference. Global volume production was slated for **early July 2026**. Dev kits: **STEVAL-VL53L9** eval board and **X-NUCLEO-53L9A1** STM32 Nucleo expansion board. This upgrades the standing MedCapture depth-sensing recommendation from "watch" to "orderable."
- **NVIDIA Jetson T2000 / T3000** — no change. Q1 2027 hardware; JetPack 7.2.1 emulation available now.
- **E-ink / Onyx Boox** — nothing in-window.

### Governance / Standards

- Nothing new in-window. Colorado AI Act unchanged (SB 26-189 + HB 26-1139, both effective Jan 1, 2027).

---

## Nothing New (Watchlist)

- **Apple Foundation Models framework open-source** — [WWDC26 session](https://developer.apple.com/videos/play/wwdc2026/241/) · [DEV writeup](https://dev.to/arshtechpro/wwdc-2026-apple-just-opened-the-foundation-models-framework-to-any-llm-provider-5ejn). Still a commitment with a "later this summer" timeline, not a release. Companion pieces (CoreAILanguageModel, MLXLanguageModel) also pending. Summer clock: ~5 weeks left.
- **Google Gemini 3.5 Pro GA** — fourth missed window.
- **DeepMind D4RT official code** — week 12.
- **Genie 3 developer API** — no change; Ultra-subscriber-only.
- **Mayo × Microsoft healthcare frontier model** — week 8, nothing surfaced.
- **Cursor Origin GA** — waitlist, fall 2026, no date.
- **Snap Specs specific ship date** — still "fall 2026."
- **Samsung Intelligent Eyewear price / ship date / Android XR SDK** — *new watchlist entry.* The reveal happened and disclosed none of the three.
- **CLEARED this window:** Cosmos 3 Edge weights (shipped 7/20–21), Kimi K3 weights (shipped 7/27), Cerebras Sol (launched 7/10, gated access).

---

## Project Impact

### MedSim-Game (flagship)

1. **Inner Logic's $11.5M seed is the most consequential item in this report for MedSim — as
   validation, and as a map of who is not competing with you.** [TechTimes](https://www.techtimes.com/articles/321346/20260723/inner-logic-raises-115m-build-simulation-platform-autonomous-surgery-has-been-missing.htm) · [HIT Consultant](https://hitconsultant.net/2026/07/27/inner-logic-simulation-infrastructure-procedural-devices/). General Catalyst funded "virtual patients grounded in real clinical data, replacing cadaver labs" — the physiological-clone thesis in `master-design-2026-05-24.md`, pointed at **device manufacturers as the buyer** and **regulatory evidence as the product**. MedSim points the same substrate at **learners**, with teaching content as the product. Two conclusions: (a) the underlying bet is now externally priced and the buyer set is broader than the education channel; (b) the near-term competitive lane is clear — nobody in this raise is building learner-facing clinical simulation. **Recommended action:** log Inner Logic in the MedSim external-alignment file next to the ARPA-H workshop. No product change. If the monetization thesis ever needs a second revenue leg beyond the freemium/enterprise-tier model, "physiology substrate as validation infrastructure" now has a funded comparable to point at.
2. **The FDA simulation-evidence pathway is the second federal signal in two weeks.** [FDA AI-enabled devices](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices). The 2023 CM&S guidance plus the Jan 2025 AI-device draft guidance are what made Inner Logic fundable. Combined with ARPA-H's July 16 workshop framing, the regulatory environment is actively moving toward accepting simulation as evaluation infrastructure. **Recommended action:** none this week — but when MedSim's positioning language gets written for any grant, partner, or enterprise conversation, these two guidances are the citations that make "simulation as evaluation" a regulatory fact rather than a claim.
3. **Claude Opus 5 at unchanged $5/$25 with 1M context and no long-context premium changes the
   MedSim model-tier calculus.** [Opus 5 developer guide](https://essamamdani.com/blog/claude-opus-5-launch-developer-guide-july-2026). Prior guidance was Sonnet 5 for agent workloads / Opus 4.8 for planning / Fable 5 only for narrow expensive reasoning. Opus 5's **five-level effort setting** is the operative change: the same model serves latency-sensitive calls at low effort and hard planning at high effort, which collapses part of the tier-juggling. The **flat 1M-context rate** additionally makes whole-scenario-in-context patterns (full physiology graph + patient state + transcript) affordable in a way per-token long-context surcharges previously discouraged. **Recommended action:** when the model-eval matrix gets run, add Opus 5 at low/medium effort as a direct challenger to Sonnet 5 for the agent tier — the cost gap may no longer justify the split.
4. **Kimi K3's license correction retracts last week's self-hosting recommendation.**
   [License analysis](https://www.digitalapplied.com/blog/kimi-k3-open-weights-shipped-license-restrictions-2026). Last week's report said "Modified MIT" and recommended flagging self-hostable Opus-class weights as a differentiator for data-residency-constrained enterprise and DoD-adjacent scenarios (`military-parallel-pipeline.md`, `medsim-school-employer-custom-content.md`). **The actual license is a bespoke "Kimi K3 License" with a revenue-triggered separate-agreement clause and a mandatory UI attribution requirement.** For a commercial clinical-education product, a revenue trigger that forces a negotiation with a Beijing lab, plus a forced attribution in the learner-facing UI, is disqualifying for exactly the enterprise buyers the differentiator was aimed at. The 594 GB MXFP4 footprint is a separate practical problem. **Recommended action:** drop the Kimi K3 self-hosting angle. **Substitute Thinking Machines' Inkling** (975B MoE / 41B active, **Apache 2.0**) as the open-weights candidate if a self-hosted tier is ever genuinely needed — cleaner license, one-third the size, no attribution mandate.
5. **Cosmos 3 Edge weights are downloadable under a commercial-use license.** [HF nvidia/Cosmos3-Edge](https://huggingface.co/nvidia/Cosmos3-Edge). OpenMDW-1.1 permits commercial use and fine-tuning. Still a physical-AI world model rather than a clinical one, so no direct MedSim use — but it is now a real artifact rather than an announcement, which matters for the sim-lab hardware-agent tier (`sim-lab-mockup-print-bank.md`). Log only.
6. **3DGS tooling improved meaningfully for the walkable-scene pipeline.** LichtFeld Studio v0.5.3's move to **Vulkan** (drops the hard CUDA dependency on the viewer path) plus **8K training** and **MCP automation**, and SuperSplat v2.7's **selective per-layer export**, both reduce friction on the capture→scene workflow that produced the `?clinic` and `?placement` scenes. **Recommended action:** none urgent. If a future scene pass uses splats rather than meshes, LichtFeld's MCP hooks make it scriptable from this workstation. The SketchUp splat extension is **not** usable here — Windows-only plus a Pro/Studio subscription.
7. **Gemini 3.6 Flash at $1.50/$7.50 with computer-use built in** is now the cheapest credible
   1M-context multimodal tier. [Launch specs](https://aitoolsrecap.com/Blog/gemini-3-6-flash-launch-specs-pricing-2026). Worth a slot in the same eval matrix for high-volume, low-stakes MedSim calls (content classification, transcript tagging) where Sonnet 5 is over-specified.

### MedCapture / Sim-Lab

- **ST VL53L9 is orderable with dev kits.** [ST newsroom](https://newsroom.st.com/media-center/press-item.html/p4783.html). **STEVAL-VL53L9** eval board / **X-NUCLEO-53L9A1** Nucleo expansion. 2.3K zones at 100 fps, 5 cm–9 m. This has been the standing depth-sensing recommendation for weeks and has now moved from announced to shipping. Cost is well inside the ≤$200/mo infra autonomy gate. **This is the one concrete purchasable action in this report.**
- **Jetson T2000/T3000** — unchanged, Q1 2027.

### 3rdrider (parked)

- **The trigger event fired and produced no unblock.** Samsung named the product and disclosed nothing developers need. No price, no ship date, no Android XR SDK, no dev program. Gen 1 is display-less as expected. See Parked Idea Unblocks.

### haptic-mirror-d4rt (parked)

- No unblock. D4RT week 12; OpenD4RT unchanged since June 4. The 3DGS tooling improvements (LichtFeld, SuperSplat) are *editing/rendering* advances, not the video-to-3D-world *reconstruction* capability the blocker names.

### ai-multiview-video-generator (parked)

- No unblock. Cosmos 3 Edge and AlayaWorld are both single-view. Genie 3 API still not public.

### ems-event-robot-fleet (parked)

- No unblock. No humanoid pricing movement in-window.

---

## Parked Idea Unblocks

Re-read every `_ops/idea-vault/*.md` `blocked_on:` field and cross-referenced against this window.

- **Idea:** 3rdrider / Snap Spectacles AR
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** *"Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"*
  - **What changed:** The July 22 Samsung Unpacked trigger event fired. Samsung revealed **Intelligent Eyewear** (Gentle Monster / Warby Parker, Gemini assistant, 12MP camera, mics, speakers, fall 2026 select markets). **Three of the four blocker criteria are unmet or unknown:** no **display** (gen 1 is audio-only by design; the display variant is the 2027 "Haean"), no **developer SDK** (Samsung released no Android XR SDK and gave no developer guidance at the event), and no **price** (the $379–499 leak was neither confirmed nor denied, so the <$800 criterion is unconfirmed rather than satisfied). Camera + mic are confirmed. Prescription compatibility is implied by the eyewear-brand partnerships but not stated. Separately, **XREAL a01+ ships today at $299 with a display** — but no camera, so it fails the blocker from the opposite direction.
  - **Recommended action:** **WAIT.** This is a downgrade in expectation, not just a hold: last week's report framed July 22 as a likely PROMOTE moment. The event resolved to less information than the pre-event leaks contained. The binding gate is now the **Android XR SDK / developer program**, not the hardware. Re-evaluate if Samsung opens a developer track, or at **Meta Connect (Sep 23–24)**, where Ray-Ban Gen 3 (Scriber / Blazer) is confirmed to launch against an SDK that already exists (Wearables Device Access Toolkit).

- **Idea:** haptic-mirror-d4rt
  - **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"*
  - **What changed:** Nothing that satisfies it. LichtFeld v0.5.3 and SuperSplat v2.7 improve splat *editing and rendering*; Cosmos 3 Edge and AlayaWorld are *generation*, not *reconstruction from capture*. D4RT week 12 with no official code; OpenD4RT static since June 4.
  - **Recommended action:** **WAIT.**

- **Idea:** ai-multiview-video-generator
  - **File:** `_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** Genie 3 (or competitor) exposing multi-view export as a public API, **OR** `display-cube-six-screens` existing first
  - **What changed:** Nothing. Genie 3 remains Ultra-subscriber-only via Project Genie with no developer API. AlayaWorld's confirmed architecture (15B video DiT, autoregressive latent chunks under a **single** camera trajectory) is explicitly single-view. `display-cube-six-screens` is still blocked behind barad-dûr v2.
  - **Recommended action:** **WAIT.**

- **Idea:** medcapture-hand-kinematics-robotics
  - **File:** `_ops/idea-vault/medcapture-hand-kinematics-robotics.md`
  - **Blocker was:** MedCapture v1 first paying pilot **AND** a humanoid/medical-robotics company signaling concrete procurement intent for clinical hand-motion datasets
  - **What changed:** Partial movement on the *second* condition only, and indirectly. Inner Logic raised $11.5M explicitly to build perception + digital-twin infrastructure for **autonomous surgery** — a company whose product requires exactly the kind of clinical procedural motion data this idea proposes to sell. That is a funded buyer profile appearing where none existed. It is **not** procurement intent: no RFP, no dataset purchase, no stated need for third-party hand-motion capture. And the first condition (MedCapture paying pilot) is untouched.
  - **Recommended action:** **WAIT** — but this is the first external movement on this blocker in months. Add Inner Logic to the watch list of companies to re-check when MedCapture v1 does land a pilot; they are a plausible first conversation.

- All other parked ideas (`sim-lab-mockup-print-bank`, `sim-lab-rfid-ultrasound-trainer`, `zoll-stryker-bracket`, `medsim-data-gathering-analytics`, `longplay-monument`, `instrumented-task-marketplace-for-ai-training`, `medsim-marketing-gtm`, `medcapture-stereo-second-camera`, `medcapture-humanoid-robot-extension`, `runway-dev-portal-exploration`, `medsim-revenue-angles-expansion`, `painting-wars-pixel-rts`, `swappable-shells-animated-screens`, `display-cube-six-screens`, `medsim-school-employer-custom-content`, `military-parallel-pipeline`, `medical-mmo-open-world`, `regional-ems-ecosystem-simulator`, `group-matchmaking-cascading-tinder`, `telegram-inline-keyboard-question-protocol`, `ai-augmented-field-sales-scaling`, `ems-event-robot-fleet`) — blockers are internal-milestone, money, time, or market-validation gated. Nothing in this window moved any of them.

**Summary:** No parked idea promoted. The 3rdrider trigger event fired and **downgraded** — the gate moved from hardware to the missing Android XR developer program. One blocker (`medcapture-hand-kinematics-robotics`) saw its first external movement in months via Inner Logic, but not enough to promote.

---

## Corrections to the 2026-07-20 report

1. **Kimi K3 license is not Modified MIT.** It is a bespoke "Kimi K3 License" (`license:other`) with a revenue-triggered separate-agreement clause and a UI attribution mandate. The self-hosting recommendation built on the MIT assumption is withdrawn — see Project Impact #4.
2. **AlayaWorld inference code + weights landed July 16**, not "landing this week." The full technical report is now on arXiv (2607.18367).
3. **Cerebras Sol launched July 10**, not "any day in July." Access remains limited to select customers.

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24** (Ray-Ban Gen 3 Scriber/Blazer launch, confirmed). Nothing between now and then on the AR calendar with equivalent weight.
- Apple's "later this summer" Foundation Models open-source commitment has roughly five weeks of summer left — worth a specific check each week through early September.
