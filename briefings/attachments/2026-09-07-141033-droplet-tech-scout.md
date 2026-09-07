# Tech Scout Report — 2026-09-07

**Window:** 2026-09-01 → 2026-09-07 (7 days; normal weekly cadence — no gap backfill).

**Major events swept in window:** **IFA 2026 Berlin (Sep 4–8)** — the first mainstream industry event in-window since Aug 31; sweep produced RayNeo iO/GT/GT Max, HTC Vive Eagle US launch, Blackview BV200, XREAL Aura demo continuation. **Pico Space Pro Sep 2 event canceled** (moved to Q4). **Labor Day Sep 7** — the "coming this summer" runway for Apple Foundation Models framework open-source has now expired. Meta Connect Sep 23–24 and Snap Specs Sep 16 remain the next inflection points outside window.

**Headline shifts of the week — this was not a thin week:**

1. **OpenAI shipped GPT-6 Astra on Sep 3** — the first model to reach the **Critical** cybersecurity threshold under the Preparedness Framework. [OpenAI safety overview](https://openai.com/index/safety-overview-gpt-6-astra/) · [OpenAI GPT-6 Astra system card](https://deploymentsafety.openai.com/gpt-6-astra) · [Axios coverage — Brockman calls it "a taste of AGI"](https://www.axios.com/2026/09/03/openai-astra-gpt-6-agi-brockman) · [Yotta Labs launch recap](https://www.yottalabs.ai/post/gpt-6-release-date-rumors-what-is-known-2026) · [9to5Mac ChatGPT/Codex upgrade coverage](https://9to5mac.com/2026/09/04/openai-releasing-major-upgrade-to-chatgpt-and-codex-with-gpt-6-astra-details-here/). Ends the 28-day cyber-review pause (which ran Aug 7 → Sep 3). Pricing: $10 input / $50 output per 1M tokens. Rollout is phased: cybersecurity program partners first, then ChatGPT Plus/Pro/Business/Enterprise, then API + AWS. **This is a new resolution mode for the cyber-gating norm** — where GLM-5.3 shipped on-time with a tighter license, GPT-6 Astra shipped *with* the Critical rating and phased-partner-first rollout rather than waiting for a lower rating. Three distinct resolutions now on record (GLM-5.3 on-time-with-license-ratchet, Astra ship-with-Critical-and-phased-rollout, historically GPT-5.6-Cyber Daybreak Red graduated release). The norm exists but produces different outcomes per release.

2. **Anthropic shipped Claude Fable 5.1 + Mythos 5.1 on Sep 1** with a **75% cache-read price cut**. [MacRumors coverage](https://www.macrumors.com/2026/09/01/anthropic-claude-fable-5-1/) · [Vellum benchmarks](https://www.vellum.ai/blog/claude-fable-5-1-mythos-5-1-benchmarks-explained) · [Releasebot Anthropic updates](https://releasebot.io/updates/anthropic) · [Fortune lawsuit-context coverage](https://fortune.com/2026/09/01/anthropic-warner-sony-music-songs-lawsuit/). Same weights, differing safeguards — Fable 5.1 GA, Mythos 5.1 gated to US trusted-access programs (advanced biology capabilities via **Life Sciences Verification Program**). 1M context, 128k output, always-on adaptive thinking. Sticker price unchanged from Fable 5 ($10/$50) but **cache reads dropped to $0.25/1M** = 25–45% cheaper in typical Claude Code workloads. **Enterprise Frontier Safeguards** launched alongside — customer-controlled cloud storage for safeguard telemetry spanning Claude Code, Enterprise, Platform, Bedrock, Google Agent Platform, Microsoft Foundry. Claude Code shipped **four in-window releases** (v2.1.257 Sep 1 → v2.1.259 Sep 3 → v2.1.260 Sep 4 → v2.1.261 Sep 5) with managed MCP servers, fullscreen diff, `/skill-doctor`, `--permission-prompts none`, 128K inline output cap. **Directly consequential to portfolio ops.**

3. **World Labs "Atlas" unveiled Sep 1** — Fei-Fei Li's omni world model, **outputs 3D Gaussian splats and point clouds**. [World Labs Atlas blog](https://www.worldlabs.ai/blog/atlas) · [SiliconAngle coverage](https://siliconangle.com/2026/09/01/fei-fei-lis-world-labs-debuts-atlas-a-world-model-showcase-for-advanced-spatial-intelligence/). Text/image/video/3D unified; 1440p up to 1 minute; pixel-perfect camera positioning as native input (not text-derived); novel-view synthesis from as few as 1–3 images; real-to-sim workflows generating RGB+depth for robotics. **Access is waitlist early-access with select partners; no public API, no pricing.** This is the most consequential in-window development for the `haptic-mirror-d4rt` blocker — but only partial: the blocker specifies *open-source* worldbuilder, and Atlas is closed/waitlist. Positive drift, not unblock.

4. **IFA 2026 delivered the year's densest AR/glasses shipping week.** Three separate hardware families went on sale in-window: **RayNeo iO/GT/GT Max Sep 4** ($479/$299/$399), **HTC Vive Eagle US Sep 3** ($499), and dev/preview demos of **XREAL Aura + Blackview BV200**. Critically, **none satisfy the 3rdrider `<$800 camera+mic+display+SDK` bar**: RayNeo iO has display but no camera; RayNeo GT/GT Max are birdbath viewers with no camera; HTC Vive Eagle has camera+mic+AI but no display; Blackview BV200 is audio+camera without display. **The under-$800-with-all-four bar remains unbroken** even in what was the biggest consumer-AR retail week of 2026.

5. **Meta open-sourced Haptics Studio under MIT license.** [github.com/facebook/haptics-studio](https://github.com/facebook/haptics-studio) · [github.com/facebook/meta-haptics-sdk](https://github.com/facebook/meta-haptics-sdk). Desktop authoring app with audio-to-haptics conversion, visual envelope editing, real-time Quest+mobile preview, multi-format export (`.haptic`, `.ahap`, Android arrays, `.wav`), sample library. The Haptics SDK (runtime) was already open-source; Studio (authoring) joining under MIT completes the stack. **Directly relevant to any future haptic-mirror work** — the tooling substrate for authoring haptic content in-house is now MIT-licensed and forkable.

6. **Everything committed but un-shipped continues to age.**
   - **Apple Foundation Models framework open-source** — Labor Day Sep 7 came and went with no drop. WWDC's "coming this summer" is now formally past-due. `apple/coreai-models` repo exists but the `CoreAILanguageModel` + `MLXLanguageModel` companions remain unshipped. **Watchlist Week 13 — first post-summer week.**
   - **Meta Muse Spark 1.2 open weights** — **Day 35+**. Meta shipped **Muse Spark 1.3 (proprietary) on Sep 2** and re-promised open weights again (third promise: Aug 10, Aug 20, Sep 2). Contrast with GLM-5.3 delivered-exactly-on-time-with-license widens the credibility asymmetry.
   - **Gemini 3.5 Pro GA** — **seventh slip**. Google instead shipped Gemini 3.8 Flash on Sep 2.
   - **DeepMind D4RT code** — **Week 18** on watch.
   - **Genie 3 dev API** — no tier change; still Ultra-only ($250/mo).

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **RayNeo iO / GT / GT Max — shipped Sep 4 at IFA 2026 (Berlin, Sep 4–8).** [Android Authority hands-on](https://www.androidauthority.com/rayneo-gt-max-ar-glasses-pocket-tv-pro-streamer-3701131/) · [TechPowerUp specs](https://www.techpowerup.com/351785/rayneo-unveils-rayneo-io-smart-glasses-and-cinematic-rayneo-gt-series) · [GSMArena](https://www.gsmarena.com/rayneo_unveils_productivity_focused_io_glasses_and_multimedia_focused_gt_glasses-news-74284.php) · [Auganix](https://www.auganix.org/ar-news-rayneo-io-gt-max-smart-glasses/) · [PRNewswire — IFA Innovation Award Honoree](https://www.prnewswire.com/news-releases/rayneo-showcases-next-generation-cinematic-ar-and-ai-smart-glasses-at-ifa-2026-with-dolby-and-bang--olufsen-302870067.html). Sale via rayneo.com and Amazon.
  - **iO** — $479 ($529 with charging case). 33g, HUD-style AR, display + 4 mics + bone-conduction sensor. **No camera. No speakers.** Productivity focus.
  - **GT** — $299. 68g, 46° FOV, dual 0.6" micro-OLED 1080p/eye, 120Hz, 1,200 nits, birdbath optics, single IPD. No camera.
  - **GT Max** — $399. 78g, 59° FOV, virtual screen up to 307", Peacock Optical Engine 3.0 Max, three IPD sizes. No camera.
  - **Pocket TV Pro** companion streamer — Amlogic S905X5M-J, 3GB/64GB, 6,500mAh (~5.5h). Pricing undisclosed.
  - **Developer story: none announced.** No SDK, no Android XR compatibility, purely consumer messaging.
- **HTC Vive Eagle — US launch Sep 3, $499.** [Vive blog](https://blog.vive.com/us/introducing-vive-eagle-smart-glasses-built-for-everyday-life/) · [VR.org US-store coverage — 3 of 10 configurations in stock](https://vr.org/articles/htc-vive-eagle-499-us-store-three-of-ten-configurations-2026). ZEISS optics; 12MP ultra-wide (HDR 3024×4032 photos, 1512×2016 30fps video); 32GB onboard; on-device Vive AI + cloud OpenAI GPT + Google Gemini; live translation; 4.5h music playback; <49g. **No display. No developer SDK announced.** Three configurations available at launch (Pantos round Charcoal Black w/ sun or blue-light lenses; square black w/ sun); seven more "Coming Soon." Taiwan launch was Sep 1 at NT$15,600.
- **Meta Ray-Ban Display — v128 firmware shipped early September, primarily a security fix.** [IPVM: LED-bypass fix tested](https://ipvm.com/reports/meta-ray-ban-led-bypass-fix-tested) · [Digital Trends coverage](https://www.digitaltrends.com/wearables/meta-brings-one-of-the-ray-ban-displays-most-useful-features-to-its-standard-smart-glasses/). Camera now stops recording if the indicator LED is physically covered — closes the exploit surfaced in prior press. **No new feature adds documented in-window.** Meta's official release-notes page has not been updated past June 29, so v128 details live in the Threads announcement from Alex Himel plus IPVM's independent retest, not the canonical page.
- **Meta Ray-Ban Gen 3 (Aperol/Bellini) — no in-window FCC filings** under those codenames. March 2026 "Scriber"/"Blazer" filings unchanged. Meta Connect Sep 23–24 remains the reveal event.
- **Samsung Jinju — no in-window movement.** All substantive leaks (OnLeaks renders, One UI XR software leak, $379–499 pricing, Sony IMX681 dual 12MP cameras, Snapdragon AR1, 155mAh, 50g, no-display AI-first design) predate Sep 1.
- **Snap Specs — Sep 16 LA launch event confirmed** (just outside window). Pricing unchanged at $2,195; preorder $200 refundable deposit; US/UK/France fall 2026 shipping. Spectacles dev-kit rental unchanged at $99/mo ($49/mo students). **No in-window price cuts or new dev-program tiers.** Lens Studio 5.23.2 (Aug 17) still current — no in-window release.
- **XREAL Aura — no in-window announcement.** State as of last week: $299 Founder Priority Pass (2,000 units) sold out in 36h, $99 Launch Credit tier sold out, only $199 Priority Deposit tier remains. 10K+ reservations. Retail $1,500 base, fall 2026. Android XR Developer Catalyst applications closed June 30; dev-kit ships are underway (hundreds distributed globally per XREAL).
- **Blackview BV200 AI glasses** — IFA 2026 debut. ChatGPT integration, 139-language translation. Audio+camera, no display. [IFA 2026 recap — BGR](https://www.bgr.com/2250817/biggest-announcements-showstoppers-ifa-2026/).
- **Jetpack Compose for XR beta — still not shipped.** Google's Aug 21 post said "to follow soon" after SceneCore/ARCore-for-XR/XR-Runtime beta; no drop in-window. Watch [developer.android.com/jetpack/androidx/releases/xr-compose](https://developer.android.com/jetpack/androidx/releases/xr-compose).
- **Pico Space Pro — Sep 2 event canceled Aug 24, now Q4 2026.** [VR.org — Pico moves Space Pro to Q4](https://vr.org/articles/pico-space-pro-delayed-q4-september-event-cancelled-2026). Pico's stated reason: hardware/software "reached a high level of completion" but they "saw an exciting new opportunity" to fold into the initial release. No confirmed SKUs, price, or region.

### Spatial Computing / 3D

- **World Labs Atlas unveiled Sep 1.** [World Labs Atlas blog](https://www.worldlabs.ai/blog/atlas) · [SiliconAngle](https://siliconangle.com/2026/09/01/fei-fei-lis-world-labs-debuts-atlas-a-world-model-showcase-for-advanced-spatial-intelligence/). **Fei-Fei Li's omni world model — native inputs: text, images, video, 3D. Native outputs: 2D images/videos + point clouds + 3D Gaussian splats.** 1440p, up to 1 minute, from 1–6 input images with manually designed camera paths. Bullet-time multi-view from ordinary cameras. Real-to-Sim workflows for robotics simulation (RGB+depth sensor data). Text-to-image incl. 360° panoramas. **Early access via typeform / partner-gated.** No public API, no pricing, integration planned for future Marble versions. **This is the strongest in-window candidate for the D4RT-equivalent role, but Atlas is closed-source and waitlist-only — see Parked Idea Unblocks.**
- **Three.js r186 merged a native Gaussian splat renderer (WebGPU/TSL, ~7KB).** [Radiance Fields coverage of r186 PR #33950 by bhouston](https://radiancefields.com/three.js-merges-a-native-gaussian-splat-renderer-for-webgpu-in-r186). GPU counting sort, PLY/SPZ/KSPLAT/glTF loaders. **Removes third-party dependency for web-based splat viewers** — anything MedSim ever ships to a browser can now render splats with the mainline Three.js build. Meaningful reduction in JavaScript integration cost for the whole 3DGS-in-browser toolchain.
- **NVIDIA vkSplatting 2026.1 open-sourced (Apache 2.0).** [SplatLabs coverage](https://www.splatlabs.ai/blog/nvidia-vulkan-gaussian-splatting-2026) · [Radiance Fields Aug 2026 roundup](https://radiancefields.substack.com/p/gaussian-splatting-in-august-2026). Introduces ray-traced shadows, DLSS Ray Reconstruction, multi-instance splat set architecture. GitHub: `NVIDIA/vkSplatting`. **Note license difference:** vkSplatting is Apache 2.0 (commercial-safe); NVIDIA Lyra 2.0 remains under NVIDIA Internal Scientific R&D License (research/spike only). Two NVIDIA splat efforts, two license postures.
- **Broader 3DGS toolchain — sustained in-window activity.** Per Radiance Fields early-Sep roundup: **vis.gl / luma.gl 9.4.0-beta** shipped a GPU splat renderer; **Foundry Nuke 17.1v1** shipped a Gaussian splat toolset; **Maya** got splat snapping; **Houdini** got three more splat tools; **PlayCanvas** turned SuperSplat into a publishing endpoint; four free Blender add-ons and a free Houdini tool landed. **This is the continued "boring reliability tooling" phase** from last week's read, now hitting the DCC-integration inflection.
- **DeepMind D4RT — Week 18 on watch, still no code drop.** [D4RT project page](https://d4rt-paper.github.io/) · [OpenD4RT community fork](https://github.com/Lijiaxin0111/Open-d4rt) — neither changed in-window. Adjacent: [google-deepmind/representations4d](https://github.com/google-deepmind/representations4d) (4D vision foundation models) exists but is a distinct paper.
- **Tencent WorldClaw — no code drop.** [github.com/Tencent-Hunyuan/Hunyuan3D-WorldClaw](https://github.com/Tencent-Hunyuan/Hunyuan3D-WorldClaw) repo still README-only. Issue #1 ("No code in here") remains open with no maintainer response. No timeline.
- **Google Genie 3 — no in-window tier change.** Still Ultra-only ($250/mo, above the $200/mo autonomy gate).
- **OpenAI Sora 2 / Videos API — shutdown announced for Sep 24, 2026.** [Prompt Architects migration guide](https://prompt-architects.com/blog/141-sora-2-shuts-down-september-24-move-your-prompts-now). Standalone Sora product already killed in April; API and web-app deprecation Sep 24. Sora capabilities remain inside ChatGPT Plus/Pro but not as a discrete developer surface. **Portfolio impact: none direct** — we don't ship on Sora — but this constrains options if we ever needed a video-gen fallback outside Runway/Google.

### AI / ML

- **OpenAI GPT-6 Astra released Sep 3.** [OpenAI safety overview](https://openai.com/index/safety-overview-gpt-6-astra/) · [OpenAI GPT-6 Astra system card](https://deploymentsafety.openai.com/gpt-6-astra) · [Axios: Brockman says "a taste of AGI"](https://www.axios.com/2026/09/03/openai-astra-gpt-6-agi-brockman) · [Yotta Labs launch recap](https://www.yottalabs.ai/post/gpt-6-release-date-rumors-what-is-known-2026) · [9to5Mac ChatGPT/Codex upgrade coverage](https://9to5mac.com/2026/09/04/openai-releasing-major-upgrade-to-chatgpt-and-codex-with-gpt-6-astra-details-here/). **First OpenAI model at Critical cybersecurity threshold per Preparedness Framework.** Pricing $10 input / $50 output per 1M tokens. Rollout: cybersecurity program partners → ChatGPT Plus/Pro/Business/Enterprise → OpenAI API + AWS. State-of-the-art claims for computer use, browsing, software engineering, cybersecurity, science, professional work, and 3D/CAD-style tasks. Ends the 28-day pause (Aug 7 → Sep 3). ChatGPT + Codex upgraded to Astra on Sep 4. **Portfolio implication:** Astra is a candidate model for MedSim's most complex scenario-generation and content-QA passes; the pricing ratchet is significant ($10/$50 vs Claude Fable 5.1 $10/$50 — parity headline, but Anthropic's 75% cache-read cut this same week means Claude comes in cheaper in cache-heavy workloads). Not an immediate switch — worth an A/B on the scenario-authoring pipeline post-flagship-Vault-v1.
- **Anthropic Claude Fable 5.1 + Mythos 5.1 released Sep 1.** [MacRumors](https://www.macrumors.com/2026/09/01/anthropic-claude-fable-5-1/) · [Vellum benchmarks](https://www.vellum.ai/blog/claude-fable-5-1-mythos-5-1-benchmarks-explained) · [Releasebot updates](https://releasebot.io/updates/anthropic). Same weights, differing safeguards. 1M context, 128k output, always-on adaptive thinking. **Cache reads cut 75% to $0.25/1M** — 25–45% cheaper in practice for Claude Code / long-context workloads. Mythos 5.1 gated to US Life Sciences Verification Program.
  - **Enterprise Frontier Safeguards (EFS)** — customer-controlled cloud storage for safeguard monitoring across Claude Code, Enterprise, Platform, Bedrock, Google Agent Platform, Microsoft Foundry. **Directional relevance to MedSim school/employer channel** — school-district and health-system procurement of managed AI now has a matching enterprise-storage-control surface.
  - **Claude Code:** four in-window releases. v2.1.257 (Sep 1, defaults to Fable 5.1) → v2.1.259 (Sep 3, managed MCP servers, `--permission-prompts none`) → v2.1.260 (Sep 4, fullscreen diff) → v2.1.261 (Sep 5, 128K inline output cap, `/skill-doctor`).
  - **Ant CLI v1.30.0** (Sep 3): `ant apply` for IaC-style agent/skill/env deployment with `claude-lock.json`.
  - Admin API user-management out of beta; `web_search` / `web_fetch` domain restrictions now supported for Managed Agents.
- **Google Gemini 3.8 Flash + 3.8 Flash Cyber shipped Sep 2.** [Unite.ai](https://www.unite.ai/google-launches-gemini-3-8-flash-with-cybersecurity-variant/) · [9to5Google](https://9to5google.com/2026/09/02/gemini-3-8-flash-launch/) · [The Register](https://www.theregister.com/ai-and-ml/2026/09/02/with-gemini-38-flash-google-reminds-everyone-its-still-in-the-race/5294049). Model ID `gemini-3.8-flash`, GA via Gemini API + AI Studio + Android Studio. Introductory pricing $0.75 input / $3.75 output per 1M (through Dec 31, 2026). 1M context, 64k output, all-modalities-in. **Flash Cyber variant is government/critical-infrastructure gated** — Google now has an explicit two-tier cyber-gating structure. **Third Flash update in six weeks; Pro line remains stuck** — Gemini 3.5 Pro is officially in its seventh slip and no `gemini-3.5-pro` endpoint exists.
- **Meta Muse Spark 1.3 (proprietary) shipped Sep 2 — Muse Spark 1.2 open weights still not on HuggingFace.** Meta re-promised open weights for the Spark line for the third time (Aug 10, Aug 20, Sep 2). **Day 35+ on watch — this is now materially aged.** The only open Meta model in-line remains Muse Glimmer 30B (Apache 2.0, Aug 10). GLM-5.3 delivered-on-time-with-tighter-license contrast makes Meta's open-source communications look increasingly unreliable relative to Chinese labs' delivery discipline.
- **Alibaba Qwen3.8-Max-0902 (Sep 2) — text-only post-training upgrade.** Same 2.4T MoE, same $2/$6 pricing, coding/agent focus. **Vision path still gated to Qwen3.8-27B VLM (Apache 2.0, Aug 13–14).** [SCMP coverage](https://www.scmp.com/tech/article/3362738/alibabas-ai-model-qwen38-max-made-widely-accessible-ahead-open-weights-release). No full-spec Qwen3.8-Max vision open weights in-window.
- **DeepSeek / xAI / Mistral / Kimi / Yi / Falcon — nothing shipped in-window.** xAI Grok 4.7 targeted Sep 12 (next scout window).
- **IBM Granite 4.2** shipped Aug 25 (out of window; logging for continuity).
- **GitHub Copilot weekly release (Aug 31 batch, published Sep 4).** [GitHub Changelog](https://github.blog/changelog/2026-09-04-github-copilot-weekly-releases-august-31/). Claude Fable 5.1 rolled out to Pro+/Max/Business/Enterprise; Gemini 3.8 Flash rolling out to Pro/Pro+/Max/Business/Enterprise. **Agent Merge in public preview** (auto-resolves review feedback, failed checks, merge conflicts). Copilot CLI now honors content exclusions.
- **OpenAI Codex CLI v0.153.4 (Sep 6):** async cloud tasks with PR creation from completed work.
- **Cursor — no in-window escalation** on the Nov 12 OpenAI cutoff. Negotiations ongoing per OpenAI's Aug 29 decision post.
- **Sony/Warner/33-publisher Anthropic lawsuit — no in-window procedural developments** beyond the Sep 1 news pickup ([Fortune](https://fortune.com/2026/09/01/anthropic-warner-sony-music-songs-lawsuit/), [Insurance Journal](https://www.insurancejournal.com/news/national/2026/09/01/883461.htm)). Anthropic response unchanged.
- **Apple Foundation Models framework open-source — Labor Day Sep 7 slip.** No drop. Watchlist Week 13 escalation now in effect. The `apple/coreai-models` GitHub org exists but has no `CoreAILanguageModel` or `MLXLanguageModel` package. WWDC 2026 [session 241](https://developer.apple.com/videos/play/wwdc2026/241/) commitment now formally past the summer window.

### Hardware

- **Meta open-sourced Haptics Studio under MIT license.** [github.com/facebook/haptics-studio](https://github.com/facebook/haptics-studio) · [github.com/facebook/meta-haptics-sdk](https://github.com/facebook/meta-haptics-sdk). Authoring app: audio-to-haptics conversion, visual envelope editing, real-time Quest+mobile preview, multi-format export (`.haptic`, `.ahap`, Android arrays, `.wav`), built-in sample library, tutorials. Runtime SDK (already open-source) pairs alongside. **This is a full authoring-plus-runtime open-source haptic stack** and directly relevant to any future haptic-mirror or MedSim-tactile work — no more building on Meta's closed-tooling substrate.
- **NVIDIA Jetson AGX Thor lineup unchanged.** T3000/T2000 Q1 2027 ship.
- **HTC Vive Eagle** — see AR section. $499 US, no display, no SDK.
- **Unitree G1 pricing unchanged.** $17,990 US direct-buy MSRP; $43.9K EDU; $13.5K manufacturer-direct (backordered China shipping). No downward movement in ems-event-robot-fleet trigger direction.
- **Figure 03 / Tesla Optimus V3 — no in-window movement.** BMW Spartanburg fleet stable at ~$25/robot-hour; Optimus V3 ramp still targeted late Jul/Aug 2026 with no external pricing.
- **Onyx Boox Note X6 + Palma 3 — no ship in-window.** Palma 3 Q4 target; Note X6 fall target unchanged.
- **Voyant Photonics Carbon 32/64-line FMCW LiDAR** — shipping to qualified partners; not sub-$1K.
- **Seeed reComputer RK3576 platform** — late-Sep/Oct target, no in-window ship. $219 standard / $379 with RK1820 NPU.

### Medical / Clinical AI

- **No new 510(k) clearances for LLM-based SaMD in-window.** UpDoc remains the only patient-facing LLM 510(k)-cleared device.
- **Anthropic Mythos 5.1 Life Sciences Verification Program (Sep 1)** — structured-access program for advanced biology capabilities on Mythos 5.1 (advanced-safeguard-tier). Not a cleared clinical device; positioning is life-sciences enterprise / research. **Closest adjacent MedSim-relevant enterprise-AI-with-safeguards development in-window.**
- **FDA GenAI discussion paper docket** — comments due Oct 19; docket FDA-2026-N-7874 open. **43 days remaining** on the runway; SBA Office of Advocacy's Aug 26 amplification stands. Recommendation from prior weeks unchanged: yes on submitting a competency-based-evaluation comment as portfolio-visibility play.
- **Mayo Clinic + Microsoft frontier healthcare model** — **14 weeks post-announcement, zero delivery.**
- **ARPA-H simulation + causal models workshop report** — July 16 workshop, no output in 7+ weeks.

### Governance / Structural

- **Cyber-gating norm — third resolution mode observed.** GLM-5.3 (on-time delivery + license ratchet) → Astra (Critical rating + phased partner-first ship, not delay) → previously GPT-5.6-Cyber Daybreak Red (graduated release). Norm is real; specific outcome per release still not predictable, but **the "indefinite pause" outcome (Astra pre-Sep 3) is now empirically time-bounded** — the Astra pause resolved in 28 days, not indefinitely. This is a modest update to the tail-risk model for future gated releases: pauses may be more likely to resolve than to become permanent.
- **Cyber tier structure now Google-adopted.** Gemini 3.8 Flash Cyber gated to government/critical-infrastructure operators is Google's first explicit two-tier cyber-gating in the API surface — matches the Astra partner-first / Claude Mythos-vs-Fable structure. **Three labs have now shipped tier-gated cyber variants in 2026** — this is a hardening industry pattern, not a lab-specific quirk.
- **Sony/Warner Anthropic lawsuit** — no procedural developments in-window.

---

## Nothing New (Watchlist)

- **Apple Foundation Models framework open-source release** — WWDC 2026 promise; **Labor Day Sep 7 passed with no drop. Watchlist Week 13; first post-summer week.**
- **DeepMind D4RT official code** — 18+ weeks since CVPR 2026.
- **Gemini 3.5 Pro GA** — seventh deadline slip; no `gemini-3.5-pro` in API model list. Google shipped Gemini 3.8 Flash instead.
- **Genie 3 developer API** — still Ultra-only ($250/mo, above $200/mo autonomy gate).
- **Meta Muse Spark 1.2 open weights** — **Day 35+.** Meta shipped proprietary Spark 1.3 on Sep 2 with a third promise to open Spark weights.
- **Alibaba Qwen3.8-Max full open weights** (vision + 1M context, permissive license) — text-only 0902 post-training refresh shipped Sep 2; vision path unchanged.
- **Apple `CoreAILanguageModel` + `MLXLanguageModel`** — companion open-sources; org exists but empty.
- **Cursor Origin GA** — waitlist only; Nov 12 OpenAI cutoff remains in play.
- **Ray-Ban Meta Gen 3 (Aperol/Bellini)** — Meta Connect Sep 23–24 (next window's inflection).
- **NVIDIA GR00T N2 + medical applications** — end-of-year target.
- **Onyx Boox Note X6 + Palma 3** — Q3/Q4 unchanged.
- **Mayo Clinic + Microsoft frontier healthcare model** — 14+ weeks post-announcement.
- **ARPA-H simulation + causal models workshop report** — 7+ weeks.
- **Jetpack Compose for XR beta** — "to follow soon" per Google's Aug 21, no drop in-window.
- **NVIDIA Jetson T3000 + T2000** — Q1 2027 ship.
- **Snap Specs consumer launch** — Sep 16 event confirmed (next window's inflection).
- **xAI Grok 4.7** — targeted Sep 12 (next window's inflection).
- **Meta Connect** — Sep 23–24 (Ray-Ban Gen 3 reveal expected).

---

## Project Impact

- **MedSim-Game (flagship) — three material shifts in-window; none require immediate action.**
  1. **Anthropic Claude Fable 5.1 + 75% cache-read cut** directly reduces MedSim's LLM cost basis for long-context/scenario-authoring workloads. Claude Code auto-upgraded to Fable 5.1 as of v2.1.257 (Sep 1) — the cost improvement is already flowing to portfolio dev-tooling. **No action required; drift positive.**
  2. **OpenAI GPT-6 Astra ($10/$50, Critical cyber rating, computer-use + software-eng SOTA)** is a candidate model for MedSim's most-complex content-QA and scenario-generation passes. **Not a switch recommendation right now** — flag for A/B evaluation once Vault v1 canon lands and there's a stable scenario-authoring pipeline to benchmark against. Astra's partner-first rollout means direct API access is likely still limited during the earliest days; wait for full API GA before spending A/B cycles.
  3. **Enterprise Frontier Safeguards + Life Sciences Verification Program** — Anthropic is now shipping the enterprise-storage-control and life-sciences-access-tier surfaces that MedSim's school/employer channel will eventually need to plug into. **Directionally supportive; no MedSim action** — but confirms the school-district-managed-AI market is real and hardening.
  4. **Three.js r186 native gaussian splat renderer** — if MedSim ever ships web-based 3D scene viewing (patient-body, procedure-simulation), the browser-side 3DGS story is now mainline and dependency-free. **Log for future consideration.**
  5. **FDA GenAI docket action still stands** (submit competency-based-eval comment before Oct 19). No new signal in-window; recommendation unchanged.
- **MedCapture (Tier-2) — no direct customer signal in-window.**
- **BadgeMedia / Tenetrix Insight (Tier-2/3) — no direct impact.**
- **Claude Code substrate** — improved this week (four releases, 75% cache-read cut, managed MCP servers). Sony/Warner lawsuit remains background tail-risk factor; no substrate-migration recommendation.

---

## Parked Idea Unblocks

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"
  - **What changed:** **World Labs Atlas unveiled Sep 1** — this is the strongest in-window candidate for the "equivalent worldbuilder" clause. Atlas outputs 3D Gaussian splats + point clouds natively; accepts text/image/video/3D as input; supports pixel-perfect camera positioning; novel-view synthesis from as few as 1–3 images; explicit real-to-sim workflows for robotics simulation. **But: Atlas is closed-source and waitlist-only (early access via typeform, no public API, integration planned for future Marble versions).** The blocker specifies *open-source*. Partial unblock: the *capability* exists and is demonstrably shippable, which invalidates the "we don't yet know if this class of tool works" implicit sub-blocker. **Adjacent positive drift:** Three.js r186 mainline splat renderer + Meta Haptics Studio MIT open-source both reduce the substrate cost of the eventual haptic-mirror build. D4RT itself: Week 18 with no drop.
  - **Recommended action:** **WAIT, but with revised outlook.** The Atlas signal is strong enough that a *closed-source-tolerant* version of this parked idea is now feasible if Atlas early access opens to us — worth applying for the World Labs waitlist as a low-cost option. Full unblock still requires either D4RT release or an equivalent open-source drop. Log Atlas early-access application as a possible pre-flagship action once Vault v1 lands.

- **Idea:** 3rdrider (resume when consumer AR ships at viable price/form with SDK)
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"
  - **What changed:** **The biggest consumer-AR retail week of 2026 shipped three families and none satisfy the four-factor bar.** RayNeo iO ($479, display+mic, NO CAMERA). RayNeo GT/GT Max ($299/$399, display, NO CAMERA). HTC Vive Eagle ($499, camera+mic+AI, NO DISPLAY). Blackview BV200 (audio+camera, NO DISPLAY). No developer SDK announced with any of these. **The under-$800 bar is now hit by multiple products, but the four-factor combo (camera + mic + display + SDK, all under $800, with prescription option) still doesn't exist.** Adjacent: Meta Ray-Ban Display v128 (already >$800, but the LED-bypass security patch matters for buyer-trust posture); Snap Specs Sep 16 ($2,195, above threshold); Samsung Jinju ($379–499 audio-only, no display). **Read: 2026 has produced a rich menu of *partial* products — each vendor is optimizing away one of the four factors to hit the price. The four-factor combo may not exist until 2027.**
  - **Recommended action:** **WAIT (unchanged).** Watch Meta Connect Sep 23–24 (Ray-Ban Gen 3 reveal) — this remains the most plausible next candidate for the four-factor combo, though pricing is unlikely to be under $800.

- **Idea:** AI video / scene generator with synchronized 6-direction output
  - **File:** `_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a public API feature ... (b) build it from existing 3D primitives ... requires the display-cube-six-screens project to exist first"
  - **What changed:** **World Labs Atlas explicitly supports "bullet-time multiview capture from ordinary cameras"** — this is the closest anyone has come to shipping the multi-view feature the parked idea needs, but again closed-source/waitlist. Genie 3 API tier unchanged. Tencent WorldClaw code still not released. **Path (a) is materially closer than it was — a competitor to Genie 3 (Atlas) now demonstrably has the multi-view capability, even if not yet in a public API.** Path (b) tooling substrate improved with Three.js r186 splat + Meta Haptics MIT.
  - **Recommended action:** **WAIT.** Same holding logic as haptic-mirror-d4rt — Atlas early-access application is a low-cost option if we're pursuing multiple Atlas-dependent ideas in parallel.

- **Idea:** MedSim school/employer custom content
  - **File:** `_ops/idea-vault/medsim-school-employer-custom-content.md`
  - **Blocker was (per file):** "Core single-tenant product not yet validated; multi-tenant adds substantial complexity before MVP demand exists"
  - **What changed:** **Anthropic Enterprise Frontier Safeguards (Sep 1)** — customer-controlled cloud storage for safeguard monitoring, spanning Claude Code + Enterprise + Platform + Bedrock + Google Agent Platform + Microsoft Foundry. This adds to last week's Claude for Teachers Enterprise (Aug 28) signal — school-district / multi-tenant procurement of managed AI now has enterprise-grade data-control surfaces available. **Does not unblock the parked idea** (blocker is single-tenant validation), but continues to strengthen the case that the multi-tenant channel infrastructure will be there when v1 delivers.
  - **Recommended action:** **WAIT (channel readiness unblock is positive but single-tenant validation still gates).**

- **Idea:** MedCapture hand-kinematics for robotics licensing
  - **File:** `_ops/idea-vault/medcapture-hand-kinematics-robotics.md`
  - **Blocker was:** "MedCapture v1 has first paying pilot AND at least one humanoid/medical robotics company signals concrete procurement intent for clinical hand-motion datasets"
  - **What changed:** No procurement signal from any prime in-window. **World Labs Atlas real-to-sim robotics-simulation workflow is a modest ambient signal** — Fei-Fei Li's lab is explicitly pitching Atlas as a robotics-training-data generator, which reinforces that clinical hand-motion capture has a real class of buyers, but does not translate to a specific procurement signal for MedCapture.
  - **Recommended action:** **WAIT.**

- **Idea:** EMS / event robot fleet
  - **File:** `_ops/idea-vault/ems-event-robot-fleet.md`
  - **Blocker was:** "Unitree Go2 to ~$1K, G1 to ~$10K; MedCapture flagship milestones; EMS licensure researched"
  - **What changed:** Unitree G1 pricing unchanged at $17,990 US direct-buy. Wrong direction of travel.
  - **Recommended action:** **WAIT.**

- **Idea:** MedSim as competency-eval instrument for third-party clinical AI ("Vault-for-labs")
  - **File:** implicit / covered by `medsim-revenue-angles-expansion.md` umbrella
  - **Blocker was (per umbrella):** "v1 monetization (subscription + ACCME co-providership) not yet validated; expansion ideas premature"
  - **What changed:** FDA docket action-runway now 43 days; no new blocker-moving signal in-window.
  - **Recommended action:** **WAIT on promotion.**

- **All other parked ideas** (`ai-augmented-field-sales-scaling`, `display-cube-six-screens`, `group-matchmaking-cascading-tinder`, `instrumented-task-marketplace`, `longplay-monument`, `medcapture-humanoid-robot-extension`, `medcapture-stereo-second-camera`, `medical-mmo-open-world`, `medsim-data-gathering-analytics`, `medsim-marketing-gtm`, `medsim-revenue-angles-expansion`, `military-parallel-pipeline`, `painting-wars-pixel-rts`, `regional-ems-ecosystem-simulator`, `runway-dev-portal-exploration`, `sim-lab-mockup-print-bank`, `sim-lab-rfid-ultrasound-trainer`, `swappable-shells-animated-screens`, `telegram-inline-keyboard-question-protocol`, `zoll-stryker-bracket`) — **no in-window developments touch their blockers.**
