# Tech Scout Report — 2026-11-02

**Window:** 2026-10-20 → 2026-11-02 (14 days).

## Gap Backfill

Previous report dated **2026-10-19**; today is 2026-11-02 — a **14-day gap**, no scout runs on 10-26 or weekly cadence (last 7-day cadence broke after 10-19). Per §Catch-up window rule, this report widens the search to cover the full gap. **Zero in-window major industry conferences** that fit the explicit list (no I/O / WWDC / Connect / GTC / CES / MWC / SIGGRAPH / CVPR / NeurIPS). The window did contain **OpenAI DevDay Exchange Tokyo (Oct 20), Seoul (Oct 22), Berlin (Oct 26), Paris (Oct 28)** — DevDay flagship recap and GPT-6.1 Sol/Terra tier drops land in this window.

**Headline shifts of the gap:**

1. **🔴 Genie 4 shipped Oct 27 as a research preview — Google DeepMind's first real-time, interactive world model with native audio.** [DeepMind blog](https://deepmind.google/models/genie/) · [cellcog.ai analysis](https://cellcog.ai/blog/genie-4/). Keyboard/mouse navigation + text prompts; built on Gemini Omni; **doubles the working horizon to ~2 minutes of interactive simulation**; renders ambient sound, music, characters that speak and react; coming "soon to Google AI Ultra subscribers in Project Genie, and to early-access partners in the Gemini API and Google AI Studio" — **today it is waitlist-only** ([forms.gle/WQnSNEM3omF7Uruu7](https://forms.gle/WQnSNEM3omF7Uruu7)). **Why it matters — single biggest event of the gap for the Haptic Mirror / world-model path.** Genie 3 was experimental research with no API; Genie 4 explicitly maps a path through Project Genie → Gemini API → AI Studio, which is the first dated gate the Haptic-Mirror blocker's "world-model-as-service" clause has had. ⚠️ **No export path specified** — the DeepMind page emphasizes real-time interaction; no video / multi-view / 3DGS / glTF output is advertised. For `ai-multiview-video-generator.md` path (a), that is still the blocker. Advancing the §2F "Genie / world-model API gate" baseline from "experimental research prototype, no API" to "research preview with named API transit, no callable model ID yet."

2. **🔴 Gemini 4 Carbon shipped Oct 28 — Google's next frontier model after Argon, cybersecurity + long-horizon specialist.** [cometapi](https://www.cometapi.com/what-is-gemini-4-carbon/) · [neuraltrust](https://neuraltrust.ai/blog/gemini-4-carbon). **Pricing $2/$10 per MTok introductory, then $4/$20; cached input 95% off.** 🔴 **NOT GA — gated first to "a subset of cyber defenders," then trusted partners through Fairwind.** No public model ID, no API docs, no AI Studio, no Vertex availability. **Why it matters:** this is the same Fairwind-gated release shape Argon had on Sep 30; Argon went GA on the Gemini API on **Oct 13** (per the §2F changelog read this run) — about **13 days** gated-to-GA. If Carbon follows Argon's cadence, expect a callable model ID by **~Nov 10**. Not immediately usable in the portfolio.

3. **🔴 OpenAI DevDay flagship recap — GPT-6 Astra (new flagship), GPT-6.1 Sol (coding/computer-use at ~1/5 of Astra pricing), Dots autonomous agents, Agents API public beta, Decisions API limited preview; GPT-6.1 Terra (Oct 26) now live on Plus / Pro / Business / Enterprise / Edu in ChatGPT Work + Codex.** [DevDay Recap](https://openai.com/index/devday-2026-recap/) · [InfoQ](https://www.infoq.com/news/2026/10/openai-devday-2026/). **Why it matters — the stack this scout and the Claude-Code workflow depend on is now explicitly multi-tier**: Astra ceiling, Sol everyday, Terra for image/screen reasoning + act. **Decisions API** is directly the typed-decision shape of Cloudflare Clef / Amazon strands-decider / Liquid d1 (§2C second-tier open-weight vendors row) — **this is the second-tier players and OpenAI converging on the same decision-model API shape at the same time.** For MedSim content-review or MedCapture dataset-labeling tasks, the decision-model class is now a cross-vendor pattern worth designing around rather than a Cloudflare curiosity.

4. **🔴 XREAL AURA ordering opened Oct 28 — $1,099/$1,299 launch (list $1,279/$1,499 after Dec), ships mid-November to US/CA/JP/KR.** [blog.google](https://blog.google/products-and-platforms/platforms/android/xreal-aura/) · [TechCrunch](https://techcrunch.com/2026/10/28/xreal-aura-is-a-new-wired-headset-powered-by-android-xr/) · [Road to VR](https://roadtovr.com/google-ar-glasses-xreal-aura-release-date-price/). First wired XR glasses on Android XR, Sony Micro-OLED 1200p@120Hz, 95° FOV, Qualcomm Snapdragon Reality Elite + XREAL X1S coprocessor, <95g head weight. **Why it matters:** tightens the §2F XREAL Aura trigger — this was in the baseline but the mid-November ship date is now firm (Google blog). **Per the 10-19 parked-idea read, Samsung at $379–$499 remains the one that satisfies the 3rdrider blocker**; AURA at $1,099 is above the <$800 cap. Does not promote.

5. **✅ Meta Adventurer shipped Oct 23 — $249, $80 under Ray-Ban Meta Gen 2, no display, open-ear, 12MP/3K video, 8+hr battery.** [BestBuy listing](https://www.bestbuy.com/product/meta-adventurer-large-ai-glasses-smart-features-like-12mp-camera-live-translate-8-hour-battery-brown-lenses-classic-tortoise/J3LHRV84L6/sku/6677833/reviews) · [Men's Journal review](https://www.mensjournal.com/gear/metas-249-smart-glasses-are-here-just-dont-forget-your-charger) · [WearableBeat review](https://wearablebeat.com/articles/meta-glasses-review-2026/). **Why it matters:** last report's Oct 23 prediction held. Reviews describe microphones as the weakest component — relevant to any clinician voice-capture scenario. Still fails the 3rdrider blocker (no display); confirms the "price floor for camera-equipped AI glasses" is now $249.

6. **✅ Meta Wearables DAT 1.0.1 landed Oct 9 on both Android and iOS — buffer-corruption + Stream fixes.** Per Android CHANGELOG: *"Fixed buffer corruption while streaming compressed HEVC buffers, performance issues on Stream."* iOS repo CHANGELOG shows the same version date, no developer-facing changes. **Why it matters — gap-backfill note:** 1.0.1 landed between the 10-05 and 10-12 scout runs and was not called out in either the 10-12 or 10-19 reports. The config §2F baseline was advanced to 1.0.1 ahead of this scout; recording it here closes the loop so future runs don't re-flag it. Publishing gate remains shut (FAQ still "soon"), no module left `[Experimental]`, no 1.1.0.

7. **⚠️ Anthropic S-1 IPO filing Oct 26** — [anthropic.com/news](https://www.anthropic.com/news). Material only as corporate signal: cadence of consumer-tier access to Haiku/Sonnet/Opus pricing is likely to tighten before S-1 effectiveness. No immediate action; file for context.

8. **✅ SpAItial Echo-3 shipped Oct 27 — iPhone capture → metric-scale splat with SPZ/SOG/mesh/normals/depth export.** [spaitial.ai/blog](https://spaitial.ai/blog). Standard non-commercial, Pro commercial, enterprise API. Already in config §2B baseline; recording here because the last scout file did not carry it. **Why it matters — Haptic Mirror supplier set now:** NVIDIA NuRec (free, self-hosted, Linux/CUDA, USDZ output), World Labs Marble (metered, cloud, SPZ/PLY/GLB), SpAItial Echo-3 (metered iPhone capture, metric-scale, SPZ/SOG/mesh/normals/depth). **Three independent paths, three different OS/output profiles — the supplier-diversification note from `haptic-mirror-d4rt.md` is now unambiguously satisfied.**

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **XREAL AURA — orders open Oct 28; ships mid-November US/CA/JP/KR.** [blog.google — XREAL AURA launches as first Android XR glasses](https://blog.google/products-and-platforms/platforms/android/xreal-aura/) · [TechCrunch — AURA is a new wired headset powered by Android XR](https://techcrunch.com/2026/10/28/xreal-aura-is-a-new-wired-headset-powered-by-android-xr/) · [RoadToVR — AURA launch pricing](https://roadtovr.com/google-ar-glasses-xreal-aura-release-date-price/) · [MakeTechEasier](https://maketecheasier.com/xreal-aura/). $1,099 (US) / $1,299 launch promo through Dec; list $1,279 / $1,499 after. Wired, <95g head weight, Sony Micro-OLED 1200p@120Hz, 95° FOV, Snapdragon Reality Elite + XREAL X1S. First Android XR glasses to ship. **Does not satisfy 3rdrider's <$800 blocker; Samsung Galaxy Glasses remains the one that moves it.**

- **Meta Adventurer — shipped Oct 23, $249.** [BestBuy listing](https://www.bestbuy.com/product/meta-adventurer-large-ai-glasses-smart-features-like-12mp-camera-live-translate-8-hour-battery-brown-lenses-classic-tortoise/J3LHRV84L6/sku/6677833/reviews) · [WearableBeat full review](https://wearablebeat.com/articles/meta-glasses-review-2026/) · [Men's Journal](https://www.mensjournal.com/gear/metas-249-smart-glasses-are-here-just-dont-forget-your-charger). 12MP, 3K@30fps, open-ear audio, 6 mics, 8+hr battery, Standard + Large sizes. **No display.** Review consensus: materials below Ray-Ban Meta Gen 2, mics are weakest component in Meta's lineup. New price floor for camera-equipped AI glasses. Still fails 3rdrider blocker.

- **Samsung Galaxy Glasses — still "November 2026", no specific day as of Nov 2.** [SamMobile — launch next month](https://www.sammobile.com/news/samsung-intelligent-eyewear-smart-glasses-launch-next-month/) · [smartwearables.io — launch confirmed](https://www.smartwearables.io/news/samsung-galaxy-glasses-november-launch-confirmed-official-korea-herald-october-2026) · [Forbes — design range outed](https://www.forbes.com/sites/andrewwilliams/2026/10/13/samsung-galaxy-smart-glasses-design-range-outed-ahead-of-release/). FCC approved September; Samsung official confirmed launch month to Korea Herald on Oct 1. US + Korea selected markets; US pricing $349–$499 expected. Partners: Gentle Monster, Warby Parker. 9hr battery, 7-charge case. **Hardest-watched trigger of November for the 3rdrider blocker.**

- **Snap SPECS — Robert Downey Jr. announced as Chief Customer Experience Officer, Oct 20.** [newsroom.snap.com](https://newsroom.snap.com/). Non-technical; marketing/talent signal around the Sep 16 SPECS launch. No OS or Lens Studio update in-window.

- **Lens Studio — no new version in gap (still 5.24.1, released Oct 7).** [ar.snap.com/download](https://ar.snap.com/download). Baseline unchanged.

- **Meta Wearables DAT 1.0.1 — Oct 9 (gap backfill).** [Android CHANGELOG](https://raw.githubusercontent.com/facebook/meta-wearables-dat-android/main/CHANGELOG.md). Buffer-corruption fix on compressed HEVC streaming + Stream performance fix (Android). iOS 1.0.1 same date, no developer-facing changes. Publishing gate on FAQ still "soon", no module out of `[Experimental]`.

### Spatial Computing / 3D

- **🔴 Genie 4 — Oct 27, Google DeepMind — research preview, waitlist-only, no public API yet.** [DeepMind Genie page](https://deepmind.google/models/genie/) · [cellcog.ai analysis](https://cellcog.ai/blog/genie-4/) · [aihubmix explainer](https://aihubmix.com/blog/genie-4-explained-what-world-models-are-and-why-google-keeps-chasing-them). Real-time interactive world model, keyboard+mouse navigation, text prompts to steer scene evolution, **native audio** (ambient + music + character speech), **~2 min interactive horizon** (doubles Genie 3), built on Gemini Omni with Gemini reasoning for coherence. **Rollout:** waitlist today → Google AI Ultra subscribers in Project Genie → early-access partners in Gemini API + Google AI Studio. **No export surface** — the page emphasizes real-time play, not video / multi-view / 3DGS output. Known limits: visual drift on long/complex edits, cannot perfectly simulate real-world locations, text rendering unreliable, audio accuracy evolving. **Advances §2F Genie / world-model API-gate baseline** from "no API" to "explicit API path, model ID TBD."

- **SpAItial Echo-3 + SpAItial app — Oct 27.** [spaitial.ai/blog](https://spaitial.ai/blog). iPhone capture (plus text / images / 360° panorama from prior Echo-2 inputs) → metric-scale 3D Gaussian splat; exports **SPZ, SOG, mesh, normals, depth**. Standard = non-commercial, Pro = commercial, enterprise API; MCP server + agent-skill paths unchanged from Echo-2. First Echo generation to add **mesh + normals + depth** alongside splat, and the first to publish **metric scale** — a prerequisite for any physics-attached use (training sim, VR room-scale).

- **Radiance Fields newswire — 7 in-window items, all 10-31 → 11-02:** [radiancefields.com](https://radiancefields.com/).
  - **SculptForge 0.9.0 (Nov 2)** — local Gaussian splat training from phone video/photos using Brush + COLMAP. Fully-local splat training on consumer hardware continues to tighten.
  - **OctaneRender 2027.1 Beta 1 (Nov 1)** — up to **3.8× faster** Gaussian splat rendering on macOS. First production renderer with native splat on Apple silicon in this performance tier.
  - **3D-Tiles-RendererJS-3DGS-Plugin v0.3.1 (Nov 1)** — streams **uncompressed `KHR_gaussian_splatting` glTF tiles**. The glTF/web pipeline continues to consolidate on the Khronos-ratified extension; three.js can consume this directly (r186+ already carries `GLTFGaussianSplatLoaderExtension`).
  - **LichtFeld Studio 0.5.4.2 (Nov 1)** — opt-in POPSpa sparsification + CLI training crop-box. Minor on the §2F LichtFeld trigger (still no macOS build, no 1.0).
  - **SHINING 3D EXStar Hub 2.0 (Oct 31)** — cloud-computed 3DGS for Einstar 2 + Einstar Rockit consumer scanners.
  - **Octave Alto 2026.1 (Oct 31)** — Gaussian splats as **OGC 3D Tiles** with live drone video integration. Second splat-via-3D-Tiles item of the day; the geospatial side is converging.
  - **Yehe Liu ColmapView Spatial Hub (Oct 31)** — public dataset catalog, **4,559 COLMAP-compatible scenes** browsable in-browser. Immediately useful for Haptic Mirror prototype data.

- **No in-window update to Faster-GS, LichtFeld 1.0, SuperSplat v4, gsplat 2.0, or nerfstudio releases.** §2F trigger conditions on those unmoved.

### AI / ML

- **🔴 Gemini 4 Carbon — Oct 28, Google.** [cometapi overview](https://www.cometapi.com/what-is-gemini-4-carbon/) · [neuraltrust details](https://neuraltrust.ai/blog/gemini-4-carbon) · [datastudios writeup](https://www.datastudios.org/post/google-gemini-4-carbon-cybersecurity-long-horizon-model-cyber-defenders). Frontier model, cybersecurity + long-horizon agent specialist, **$2/$10 MTok introductory → $4/$20**, cached 95% off. 🔴 **Fairwind-gated**: cyber defenders first, trusted partners next, developers/business/consumer "as soon as possible" with **no API, no model ID, no AI Studio, no Vertex, no GA date**. Argon pattern: gated Sep 30 → Gemini API GA Oct 13 (13 days). Carbon likely callable **~Nov 10** on that pattern.

- **✅ Gemini 4 Argon — now GA on the Gemini API (Oct 13).** [ai.google.dev changelog](https://ai.google.dev/gemini-api/docs/changelog). Supersedes the §2C "NOT GA / Fairwind-gated" note. Callable model ID `gemini-4-argon`. **Backfill item** — gap-report scope: last report had Argon still Fairwind-gated.

- **Gemini API — Computer Use GA (Oct 30), `gemini-api` CLI beta (Oct 27), `store=true` default on paid tier (Oct 26).** [ai.google.dev changelog](https://ai.google.dev/gemini-api/docs/changelog). Computer Use crossing GA is the direct Gemini equivalent of OpenAI's GPT-6.1 Terra and Anthropic's Computer Use; the agentic-screens pattern is now cross-vendor-shipped. The `store=true` default is a quiet policy change — paid-tier requests are now stored by default; **flag before using the Gemini API for any PHI-adjacent capture**.

- **🔴 OpenAI GPT-6 Astra + GPT-6.1 Sol + Dots agents + Agents API + Decisions API — DevDay (San Francisco flagship, recap published in-window).** [DevDay Recap](https://openai.com/index/devday-2026-recap/) · [InfoQ coverage](https://www.infoq.com/news/2026/10/openai-devday-2026/) · [truescho all-announcements](https://truescho.com/en/blog/openai-devday-recap). GPT-6 Astra = new flagship. **GPT-6.1 Sol = coding + computer-use at ~1/5 Astra token cost.** Dots = "always-on autonomous agents" powered by Astra. **Agents API in public beta** (hosted execution + memory + tools + multi-agent). **Decisions API in limited preview** — Luna model classifies inputs / routes requests / picks from predefined answers. **Why it matters — the Decisions API is the typed-decision shape of Cloudflare Clef, Amazon strands-decider, Liquid d1** (§2C second-tier vendors row). The pattern that was "second-tier open-weight curiosity" one month ago is now a first-tier OpenAI preview; design for the shape, not the vendor.

- **✅ OpenAI GPT-6.1 Terra — Oct 26, ChatGPT Work + Codex, Plus/Pro/Business/Enterprise/Edu.** [learn.chatgpt.com/docs/changelog](https://learn.chatgpt.com/docs/changelog). Image + screen reasoning + act across browser/desktop/apps. Efficient tier below Astra. **Closed-weights, Plus-tier gating.**

- **Codex CLI 0.166.0 (Oct 29), 0.165.0 (Oct 27), 0.164.0 (Oct 23)** — [learn.chatgpt.com/docs/changelog](https://learn.chatgpt.com/docs/changelog). Three releases in the gap, matches §2F baseline (0.166.0). Added: GPT-6.1 Terra support, Vertex AI provider built-in, 10 numbered preset slots, inline `/model` + `/permissions`, Kitty/Sixel fullscreen image previews, enterprise MCP auth.

- **Claude Code 2.1.316** — [raw CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md). Matches §2F baseline, no new major in-window. Notable minor: `CLAUDE_CODE_DISABLE_ULTRATHINK` toggle, layered policy mode, pooled group budgets, Bedrock guardrails input tagging, **deprecated fast mode for Opus 4.8** (per the current env, this machine is on Opus 4.7 1M-ctx so no immediate impact).

- **Anthropic — AI for Science expansion + drug-development progress (Oct 27–28) + S-1 IPO filing (Oct 26) + Agent Skills donated to Agentic AI Foundation (Oct 22) + Christopher Stubbs joins Long-Term Benefit Trust (Oct 21).** [anthropic.com/news](https://www.anthropic.com/news). **Drug-development progress post is directly MedSim-adjacent** — track for any specific tooling / dataset / model-ID disclosure in followups. S-1 filing is corporate: likely tightens the cadence of consumer-tier pricing changes before S-1 effectiveness; file for context. Agent Skills donation shifts the format from Anthropic-owned to foundation-governed — relevant to any portfolio skill the user maintains (e.g. the ADVERTISING, verify, run, loop skills).

- **Second-tier model-ledger drops in window (per [digitalapplied October tracker](https://www.digitalapplied.com/blog/ai-model-releases-october-2026-tracker)):**
  - **Mistral Voxtral 3 (Oct 20)** — closed. Voice model class.
  - **NVIDIA Nemotron 3.5 Embed/Rerank (Oct 21)** — OpenMDW 1.1. Follows 10-15 Nemotron 3.5 family; embeddings + reranker complete the self-hosted RAG stack for MedCapture-style ingest.
  - **Recursive Flint (Oct 21)** — Apache 2.0. New vendor.
  - **Ideogram Vector 1.0 (Oct 22)** — closed. Vector-art generation.
  - **NVIDIA Nemotron 3.5 Bolt E4B (Oct 23)** — OpenMDW 1.1. Edge-size addition to the Nemotron 3.5 family.
  - **Moonshot Kimi K3.1 Pro (Oct 24)** — closed.
  - **Tencent Hy-SimulMT-30B-A3B (Oct 26)** — Apache 2.0. Simultaneous MT; narrow use.
  - **Liquid AI LFM3 (Oct 27)** — LFM Open License 1.0. Next-gen Liquid foundation model.
  - **Baidu Unlimited-OCR 2 (Oct 27)** — MIT. OCR with no documented page limit — notable for MedCapture clinical PDF ingest; test alongside Nemotron 3.5 Parse.
  - **No full-ledger second-tier drops Oct 28 → Nov 2** in the tracker's current scope.

### Hardware

- **No in-window humanoid price movement.** Unitree G1 Basic $17,990, R1 Basic $8,990, 1X NEO $20,000 / $499/mo. `ems-event-robot-fleet.md` blocker unmoved.

- **No new AR dev-kit or dev-board hardware release in window.** Android XR Catalyst Program window still closed since Jun 30, 2026. Snap Spectacles dev program unchanged. Meta Wearables DAT 1.0.1 is the only movement (already covered).

- **No new LiDAR / RF-sensing hardware release in window.**

- **Vuzix Shrike — no further specifics in window.** AUSA (Oct 12–14) was pre-window; **Modern Warfare Week (Nov 16–19, Fort Bragg)** is the next potential surface. §2A exit condition (published price or public SDK) unmet.

### Medical / Clinical AI

- **FDA GenAI medical device docket FDA-2026-N-7874 — comments closed Oct 19, FDA now reviewing.** [regulations.gov docket page](https://www.regulations.gov/docket/FDA-2026-N-7874/document). No new agency action announced in-window. Next watch item: follow-up draft guidance, timing unknown; this scout cadence drops to monthly on this item.

- **FDA FY2027 CDRH guidance agenda — comment window closes 2026-11-30** (per §2E baseline, no in-window re-fetch needed; status unchanged).

- **No material MONAI, NVIDIA Isaac for Healthcare, Siemens Healthineers, or GE HealthCare release in window.** `monai-physio` holds at `2026.9.1` on PyPI; Isaac `v0.9.0` final shipped Oct 19–20 (last report). No v1.0 trigger.

- **No MedSim-adjacent vendor move in window** (SimX, Laerdal, Oxford Medical Sim unchanged).

- **Anthropic drug-development post (Oct 27)** — closest medical-AI item in-window; not a dataset or tool release, but worth watching for followups that name specific capabilities / datasets.

---

## Nothing New (Watchlist)

- **Apple Foundation Models framework open-source** — WWDC 2026 "later this summer"; still no repo. **Watchlist Week 22.**
- **Android XR SDK — xr.runtime/scenecore/arcore stable 1.0.0 since Oct 21.** xr.compose still beta02, xr.projected still alpha14. Baseline unchanged. Next trigger = xr.compose 1.0.0 or xr.projected RC/stable.
- **Samsung Galaxy Glasses specific day** — "November 2026", no day. Watch for Samsung press announcement.
- **XREAL AURA mid-November ship date** — orders opened Oct 28, first customer reviews expected mid-Nov.
- **Snap Spectacles consumer SKU date** — "fall 2026", no narrower window; fall ends Nov 30 (meteorological) or Dec 21 (astronomical).
- **World Labs post-AMD integration** — no new blog post since 09-28 AMD + Fei-Fei posts; **blog diff baseline unchanged.** The AMD/World Labs $8.2B all-stock deal was expected to close by end of 2026; no ToS/pricing statement for Marble yet.
- **MCP spec repo** — blog "Official Ruby SDK Reaches Tier 1" (09-29) remains newest, no new posts in-window.
- **FDA follow-up draft guidance** — docket closed; cadence now monthly.
- **URXR One Kickstarter backer shipments** — flagged last report as expected mid-October; no backer-ship confirmation surfaced in-window.
- **xAI Grok Imagine Video 1.5 Lite deeper coverage** — still thin.
- **Microsoft Decision-1 weight-availability** — still unknown.
- **Reka Edge 2603 deeper coverage** — still thin.
- **Vuzix Shrike price / SDK** — no change; next potential surface Modern Warfare Week Nov 16–19.

---

## Project Impact

- **MedSim-Game (flagship):**
  - **Genie 4 is the single most relevant item of the window** — it moves the "world-model-as-service" category from "experimental research prototype" (Genie 3) to "research preview with named API path." Still no API, no export, waitlist-only. **Action: file in MedSim tech-radar as the first dated gate for any clinical-scenario environment that would otherwise require hand-built 3D content**; join the waitlist (zero cost, reversible, [forms.gle/WQnSNEM3omF7Uruu7](https://forms.gle/WQnSNEM3omF7Uruu7)); no change to the master-design-2026-05-24.md doctrine.
  - **Gemini 4 Carbon** — not usable this week (Fairwind-gated). Likely callable ~Nov 10 on the Argon pattern. **For MedSim clinical-scenario grading at scale**, Carbon's long-horizon claim is directly relevant; wait for GA.
  - **OpenAI Decisions API + the typed-decision pattern across Clef / strands-decider / d1 / Liquid LFM3** — if MedSim content-review ever becomes a volume task, the typed-decision pattern is now a four-vendor API shape worth designing around rather than coupling to any one.
  - **Nemotron 3.5 Embed/Rerank + Bolt E4B** — completes the self-hosted Nemotron 3.5 RAG stack flagged last week. No immediate flagship need, but if the dataset pipeline ever requires embedding + rerank, this is now Apache-2.0-adjacent (OpenMDW) and self-hostable end-to-end.

- **MedCapture:**
  - **Baidu Unlimited-OCR 2 (MIT)** is a plausible companion to Nemotron 3.5 Parse for clinical PDF ingest. **Action: file alongside Parse / Content Safety / ASR Streaming in the MedCapture tech-radar.**
  - **Gemini API `store=true` default on paid tier (Oct 26)** — material: if MedCapture ever calls the Gemini API, requests are now stored by default. **Set `store=false` explicitly** before any PHI-adjacent image or dictation call.
  - **Anthropic drug-development post** — watch for followups; may surface tooling or dataset partners relevant to the MedCapture dataset-shape thesis.

- **BadgeMedia / Tenetrix Insight:** No relevant news this window.

- **3rdrider (parked):**
  - **Android XR SDK stable since Oct 21** (xr.runtime / scenecore / arcore 1.0.0), **XREAL AURA orders live Oct 28 ships mid-November**, **Samsung Galaxy Glasses still "November 2026" no specific day**. All three legs of the blocker converging on November. **Meta DAT 1.0.1 publishing gate still shut** (FAQ "soon", no module out of experimental).
  - **Still WAIT** — the specific trigger remains Samsung Galaxy Glasses retail availability at $379–$499 (XREAL at $1,099 is above the cap). See Parked Idea Unblocks.

- **Haptic-mirror-D4RT (parked):**
  - **Genie 4 is the biggest advance in-window on the world-model path**, but ships waitlist-only, no API, no export — the blocker's "world-model-as-service" clause is now dated (API path named for Project Genie + Gemini API + AI Studio) but not open.
  - **SpAItial Echo-3 adds a third independent supplier** (iPhone capture → metric-scale splat + mesh + normals + depth). Supplier-diversification clause is now unambiguously satisfied: three independent paths with three OS/output profiles. **The real blocker — "no validated procedure or customer for a VR training scene" — is unchanged.**

---

## Parked Idea Unblocks

- **Idea:** 3rdrider — Snap Spectacles consumer AR glasses venture
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800."
  - **What changed:** (1) Android XR SDK core libraries (xr.runtime, xr.scenecore, xr.arcore) stable 1.0.0 Oct 21 — the "developer SDK" leg is now shipped-stable, not RC. (2) XREAL AURA opens orders Oct 28 — ships mid-November, $1,099 (above the <$800 cap, so does not satisfy the device leg). (3) Samsung Galaxy Glasses still "November 2026", no specific day — this is the one that satisfies the device leg at $379–$499. (4) Meta DAT 1.0.1 shipped Oct 9 but the publishing gate on the FAQ remains "soon" with no date.
  - **Recommended action:** **WAIT** — SDK leg satisfied, device leg still pending Samsung Galaxy Glasses retail day. **Re-evaluate the week Samsung Galaxy Glasses actually ship**; this is the one trigger that promotes the idea from WAIT to REVISIT.

- **Idea:** AI Multi-view Video Generator
  - **File:** `_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "Two paths, both blocked: (a) wait for Google Genie 3 (or competitor) to expose multi-view export as a public API feature... (b) build it from existing 3D primitives... requires the display-cube-six-screens project to exist first."
  - **What changed:** Path (a) — **Genie 4 shipped Oct 27 as a research preview with a named API path (Gemini API + AI Studio + Project Genie)**, but no public model ID, no documented multi-view / video / splat export, waitlist-only access. Path (b) tooling continued to tighten this window (SculptForge local training, OctaneRender 3.8× faster splat rendering, 3D-Tiles-RendererJS-3DGS v0.3.1 uncompressed glTF streaming, Yehe Liu's 4,559-scene COLMAP catalog); still no change to the display-cube-six-screens parent gate.
  - **Recommended action:** **WAIT** — joining the Genie 4 waitlist is zero-cost and reversible. The parent-project gate on path (b) is unchanged. Re-evaluate when Genie 4 either exposes an export surface or ships a callable model ID with multi-view output.

- **Idea:** Haptic Mirror — D4RT / world-model body sim
  - **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** per the standing 09-28 rewrite recommendation — real blocker is *"no validated procedure or customer for a VR training scene; capture→scene→render fully available."*
  - **What changed:** Capture-side supplier set is now unambiguously three-independent-vendor: NVIDIA NuRec (self-hosted, USDZ, CUDA/Linux), World Labs Marble (metered, SPZ/PLY/GLB, cloud), SpAItial Echo-3 (metered iPhone capture, metric-scale, SPZ/SOG/mesh/normals/depth, cloud). Delivery side (`KHR_gaussian_splatting` + three.js r186+) unchanged.
  - **Recommended action:** **WAIT** — the technical blockers are closed. The idea file's `blocked_on:` still has the stale "D4RT" framing. The recommended rewrite (standing since 09-28) has not been applied; it is now **two months overdue**. Non-technical blocker (customer / procedure) is unmoved.

- **Idea:** Regional EMS Ecosystem Simulator
  - **File:** `_ops/idea-vault/regional-ems-ecosystem-simulator.md`
  - **Blocker was:** no `blocked_on:` field (flagged in §4 standing action since 09-26 and 09-28, still not added)
  - **What changed:** nothing — the Parked Idea Unblocks cross-reference still silently skips this file. **Standing action still open.** No in-window news that would unblock an EMS simulator even if the field existed.
  - **Recommended action:** **ADD `blocked_on:` field to this file** (per §4 standing instruction, now 5+ runs overdue). Then re-evaluate.

- All other parked ideas (`medcapture-stereo-second-camera.md`, `medcapture-hand-kinematics-robotics.md`, `medcapture-humanoid-robot-extension.md`, `sim-lab-mockup-print-bank.md`, `sim-lab-rfid-ultrasound-trainer.md`, `ems-event-robot-fleet.md`, `medical-mmo-open-world.md`, `medsim-marketing-gtm.md`, `medsim-data-gathering-analytics.md`, `medsim-revenue-angles-expansion.md`, `medsim-school-employer-custom-content.md`, `military-parallel-pipeline.md`, `zoll-stryker-bracket.md`, `group-matchmaking-cascading-tinder.md`, `instrumented-task-marketplace-for-ai-training.md`, `painting-wars-pixel-rts.md`, `longplay-monument.md`, `display-cube-six-screens.md`, `swappable-shells-animated-screens.md`, `runway-dev-portal-exploration.md`, `telegram-inline-keyboard-question-protocol.md`, `ai-augmented-field-sales-scaling.md`) — **blockers unchanged by this window's releases.** No action.
