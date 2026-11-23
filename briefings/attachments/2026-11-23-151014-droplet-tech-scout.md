# Tech Scout Report — 2026-11-23

**Window:** 2026-11-16 → 2026-11-23 (7 days).

## Gap Backfill

Previous report dated **2026-11-16**; today is **2026-11-23** — weekly cadence held. **Zero in-window major industry conferences** on the explicit list (no I/O / WWDC / Connect / GTC / CES / MWC / SIGGRAPH / CVPR / NeurIPS). **Modern Warfare Week closed yesterday Nov 19 at Fort Bragg** — the Vuzix row's named Shrike demo window; **no Shrike pricing / SDK announcement surfaced** in the window (Vuzix shipped two unrelated items instead; see below).

**Headline shifts of the week (ranked):**

1. **🔴 Genie 4 (`genie-4`) GA on the Gemini API (2026-11-19) — the §2F world-model API gate opens.** [blog.google — Genie 4 on the Gemini API (via RSS, Nov 19)](https://blog.google/rss/) · [aistudio.google.com/docs/models](https://aistudio.google.com/docs/models) · [deepmind.google/models/model-cards/genie-4/](https://deepmind.google/models/model-cards/genie-4/) · [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing). **Model ID `genie-4`**, Interactions API, **24 fps 16:9 steerable interactive worlds + 48 kHz stereo audio over WebRTC and WebSockets**, paid tier. **Pricing: $1.50 / $9.00 / $17.50 per MTok (text input / text output / video+audio output).** Video is billed at **240 tokens per frame = 5,760 tokens/sec at 24 fps**, equating to **~$0.10/sec of generated video, ~$6.05/min** on Standard. Audio is bundled into the video token rate. **Must call `complete()`** to end a session or billing continues. Consumer announcement one day prior ("Genie 4 is now available," 2026-11-18); API GA announcement 2026-11-19. 🔴 **This closes the §2F Genie/world-model API gate on the "callable Genie model id" clause** — trigger fired. **`ai-multiview-video-generator.md` blocker clause (a) is now materially satisfied** (see Parked Idea Unblocks below). **Advance the §2F Genie row baseline to "`genie-4` GA via Interactions API, 2026-11-19."** The §2F note "NOT GA / Fairwind-gated" that was already superseded for Argon is now fully obsolete for the world-model side too.

2. **🔴 OpenAI GPT-6.2 Astra + Sol (2026-11-17) — surfaced via Codex changelog, NOT via the OpenAI news or developer changelog.** [community.openai.com — GPT-6.2 Astra and Sol are now available](https://community.openai.com/t/gpt-6-2-astra-and-sol-are-now-available/1417531) · [openai.com — GPT-6 Astra](https://openai.com/index/gpt-6-astra/) · [github.com/openai/codex/releases/tag/rust-v0.171.0](https://github.com/openai/codex/releases). **Model IDs `gpt-6.2-astra` and `gpt-6.2-sol`** on OpenAI API. **Astra:** frontier reasoning/coding/cyber, **$8 / $40 per MTok**, "most capable OpenAI model ever for cyber"; **"less than a third of the cost per task of GPT-6 Astra"** — major cost cut. **Sol:** fast agentic workhorse, **$2 / $10 per MTok**, **"powers through multistep agentic workflows"**, OpenAI employees' default. Available in ChatGPT Work and Codex for Plus/Pro/Enterprise/Edu. **Ultrafast variant available.** 🔴 **Zero prior scout hits on "GPT-6.2".** 🔴 **Routing failure that §5 names as a conjunction, not a choice: the §2F "Codex CLI release" row surfaced these; the §2C "Claude API / Gemini API" row would NOT have, because there is no OpenAI row in §2C analogous to Anthropic's or Google's.** Add an **OpenAI announcement-surface row to §2C** — vendor changelogs (`learn.chatgpt.com/docs/changelog`, `openai.com/news/product-releases`) **and** the dated ledger, same as the Nov 2–4 §2C expansion for Microsoft/Cloudflare/second-tier. Both candidate OpenAI URLs returned **404 to WebFetch** this run — `learn.chatgpt.com/docs/changelog` and `digitalapplied.com/blog/ai-model-releases-tracker`. Record the fetch failure per §5; do not report "nothing shipped" from a blank fetch.

3. **🔴 Jetpack XR Compose 1.0.0-rc01 (2026-11-18) — §2F trigger fired on the Compose half.** [developer.android.com/jetpack/androidx/releases/xr-compose](https://developer.android.com/jetpack/androidx/releases/xr-compose). **`androidx.xr.compose:compose:1.0.0-rc01`** (and `compose-testing:1.0.0-rc01`) — API surface final, "prospective stable release." The §2F trigger was *"`xr.compose` 1.0.0 or `xr.projected` RC"* — the Compose half is now met; `xr.projected` remains at **1.0.0-alpha15** (also bumped Nov 18) and is still the live trigger on the glasses path. Also Nov 18: **`xr.runtime` 1.1.0-alpha03**, **`xr.scenecore` 1.1.0-alpha02**, **`xr.arcore` 1.1.0-alpha02** — the next-train alpha series progressing. `xr.compose.material3` 1.0.0-alpha18 and `xr.glimmer` 1.0.0-alpha22 (Oct 21) unchanged. **Advance §2F Jetpack XR baseline: Compose `1.0.0-rc01` (2026-11-18), Projected `1.0.0-alpha15` (2026-11-18), the 1.x train on alpha02/03.**

4. **🔴 Meta DAT 1.1.0 (2026-11-20) — Android + iOS simultaneous; MockDevice MCP server ships; publishing gate STILL SHUT.** [github.com/facebook/meta-wearables-dat-android/releases](https://api.github.com/repos/facebook/meta-wearables-dat-android/commits) · [raw.githubusercontent.com/facebook/meta-wearables-dat-android/main/CHANGELOG.md](https://raw.githubusercontent.com/facebook/meta-wearables-dat-android/main/CHANGELOG.md). Both repos tagged `1.1.0` on Nov 20. **New capabilities:** `DeviceSession.pause()` / `.resume()`; granular stream errors (`HINGE_CLOSED`, `THERMAL_HOT`, `BATTERY_LOW`, `PEAK_POWER_LIMIT`); tightened registration state (`Wearables.createSession` now requires `REGISTERED`); **`MockDevice` MCP server (Python 3.8+ compatible)** that lets AI coding assistants verify app behavior without hardware — extends the existing MockDisplayKit zero-cost pattern into the agent-tooling surface. **Deprecation:** `MockDeviceKitInterface.simulateRegistrationOutcome()` → `setRegistrationResult()`; `CRASH_REPORTING_OPT_OUT` manifest flag removed → use `ANALYTICS_OPT_OUT`. 🔴 **The CHANGELOG top line is unchanged in substance from 1.0.0: "Experimental features are testable but cannot be published to production."** 1.1.0 **IS the §2F "1.1.0" baseline trigger**, but is **NOT the §2F publishing-gate trigger** ("any module leaving `[Experimental]`" / "submissions open"). **No module left `[Experimental]`.** **Advance §2A Meta DAT baseline to 1.1.0 (2026-11-20, both platforms).** Publishing gate FAQ check next run.

5. **🔴 Vuzix Ultralite Color (2026-11-18) — second OEM platform in seven weeks; different market from Shrike.** [ir.vuzix.com — Ultralite Color OEM Platform](https://ir.vuzix.com/news-events/press-releases/detail/2189/vuzix-introduces-ultralite-color-oem-platform-for) · [prnewswire mirror](https://www.prnewswire.com/news-releases/vuzix-introduces-ultralite-color-oem-platform-for-lightweight-full-color-ai-eyewear-302943870.html). **<40 g reference design, full-color binocular microLED waveguide, transparent optics, Vuzix Incognito (reduced forward light leakage), electrochromic tinting**. Named **CES 2027 Innovation Awards Honoree (Fashion Tech)**. **Hardware omits cameras and speakers**; retains microphones for voice-driven AI; compute/apps via tethered phone. **Intended uses:** AI assistance, translation, navigation, messaging (consumer); hands-free guidance/notifications (professional). 🔴 **Shrike (2026-09-29) targeted defense/first-responder as a 3,000-nit configurable module with camera support; Ultralite Color is the consumer/style-led half of the OEM strategy at sub-40 g with no camera.** Vuzix is now running two parallel reference platforms: **Shrike = defense/tactical (camera, tactical FOV), Ultralite Color = consumer/fashion-adjacent (no camera, waveguide display)**. Same exit conditions on both: **published price, published SDK, or developer program.** **None published** for Ultralite Color this run. **Next trigger: pricing, SDK, or an OEM partner shipping a branded product.** Also **Vuzix × Friends With Holograms reseller agreement (Nov 23)** — enterprise distribution via content-partner channel; corporate, not developer-facing. Shrike itself unchanged this window despite MWW Nov 16–19 being its named demo surface — no post-event coverage yet; next scout must re-sweep.

6. **🔴 Snap Easy Lens CLI (2026-11-18) — Snap ships a Claude/Codex/Cursor-integrated no-code path to a published Lens.** [newsroom.snap.com — Introducing Easy Lens CLI](https://newsroom.snap.com/introducing-easy-lens-cli) · `easylens.snapchat.com/cli`. **Free with a Snapchat account; Mac, Windows, Linux.** Integrates with the AI coding assistants developers already use (Claude, Codex, Cursor). **100+ AR blocks + 50+ AI asset generators**; previews via video; publishes directly to Snapchat subject to standard review; **Lens+ Payouts applies**. Snap's framing: *"A full game can go from an idea to a published Lens in a single day, without writing any code."* 🔴 **Parallel to the Meta DAT MockDevice MCP server (#4)**: Snap and Meta both shipped first-party agent-assistant integrations this week — the pattern is **vendor-first-party agent surfaces** (Easy Lens CLI, MockDevice MCP), not generic Agent-Plugins consumption. This is a different shape from the §2C Agent Plugins row (which tracks *spec* adoption). **Zero prior scout hits on "Easy Lens."** Watch whether it collapses the Lens Studio dev loop or sits alongside.

7. **🔴 Lens Studio 5.25.0 (2026-11-16) — version bump from 5.24.1; builds target "SPECS 27."** [lensstudio.com/download](https://lensstudio.com/download) (301 from `ar.snap.com/download`). "Runs on macOS and Windows" and **"Builds Lenses for Snapchat, SPECS 27 and Camera Kit."** **"SPECS 27" is new copy** — prior baselines named only "SPECS." Whether this is a next-gen hardware reference, a software version string, or a publishing-target label is **unverified this run** (Snap OS release notes URL remains 403, per §5 fetch-hostile table). ⚠️ Per §2A: **5.25 is the last Intel-Mac release**; 5.26+ is Apple-silicon only. **No impact here** (this machine is Apple M4). **Advance §2A Lens Studio baseline to 5.25.0 (2026-11-16); flag "SPECS 27" copy for next-run Snap OS release-notes verification in Chrome.**

8. **🔴 Gemini 4 Neon GA (2026-11-18) + Gemini Tool Retrieval + Office/OpenDocument multimodal + Transcribe voice-editing + macOS Gemini.** [aistudio.google.com/docs/changelog](https://aistudio.google.com/docs/changelog) · [blog.google (via RSS)](https://blog.google/rss/). Five distinct Gemini-side moves in-window:
   - **Gemini 4 Neon (`gemini-4-neon`) GA (Nov 18)** — four thinking levels, **1M unified context window**. Fourth Gemini 4 model in nine days (Carbon Nov 10, Hydrogen Nov 12, Neon Nov 18; Argon GA on the API via the Oct 13 line is the fifth confirmed).
   - **Tool Retrieval preview (Nov 19)** — Interactions API can *"search your tool library and load function schemas on demand."* **This is RAG for tool catalogs** — directly relevant to any MCP-server-heavy agent harness where tool-count outruns context budget.
   - **Multimodal file processing expanded (Nov 18)** — Microsoft Office + OpenDocument files with **document slicing**. Relevant to MedSim/MedCapture content pipelines operating on clinical PDFs/Office docs.
   - **Gemini 3.5 Transcribe voice-editing (Nov 17)** — dictation rewriting and formatting. The §2C transcription comparator shelf grows: DAT `TranscriptionResult` (on-device, free), MAI-Transcribe-2-Streaming (cloud, $0.54/hr introductory), ElevenLabs Scribe v3 Live (previous report), now Transcribe voice-editing.
   - **"Let Gemini tackle repetitive chores on your Mac" (Nov 19)** — Mac-native Gemini agent surface. Not deeply detailed this run; filed for next-run read.

9. **🔴 LichtFeld-Studio v0.5.4.3 (2026-11-23) — VR Viewing + User Shaders + Calibration Correction; splat-stack in-browser now 4D.** [github.com/MrNeRF/LichtFeld-Studio/releases/tag/v0.5.4.3](https://github.com/MrNeRF/LichtFeld-Studio/releases). First LichtFeld release that ships **VR viewing** in-tool — directly relevant to `haptic-mirror-d4rt.md`'s VR-training-scene path. Still Linux-only, still pre-1.0 — §2F trigger ("LichtFeld 1.0 or a macOS build") unmet. **SuperSplat moved three bumps: v3.9.0 (Nov 17, timeline sequences + LOD publishing from 1M splats + anti-aliased splat rendering), v3.9.1 (Nov 19), v3.9.2 (Nov 19)** — §2F trigger "SuperSplat v4" unmet. **radiancefields.com published seven new items Nov 21–23**, all zero-prior-hit, with two on-topic for the portfolio:
   - **Twinbly Ships a CLI and Local MCP Server for Splats (Nov 22)** — a local **MCP server** for splats. Parallel to the Snap Easy Lens CLI (#6) and DAT MockDevice MCP (#4) pattern: **tool-vendor-first-party MCP surfaces are the Nov theme.**
   - **PinchDrop Unfolds Phone Photos as Splats on Vision Pro (Nov 21)** — Vision Pro splat capture; competitor to NuRec / Marble / sperid-swift-mlx on Apple-side.
   - Also: LichtFeld for Blender (Nov 23, Blender-native splat training), French Touch Factory HD 4DGS in Unity (Nov 21), QuickSplat (Nov 21), Bi Gan's long-take splat planning (Nov 23, art), LichtFeld 0.5.4.3 (Nov 23, already covered).

10. **Isaac for Healthcare active pushes continue — 6 repos touched Nov 13–23, still no tag past v0.9.0 (Oct 19–20).** [api.github.com/orgs/isaac-for-healthcare/repos?sort=pushed](https://api.github.com/orgs/isaac-for-healthcare/repos?sort=pushed). Push dates in window: `i4h-digital-twin` (**2026-11-23**, two pushes in window), `i4h-workflows` (Nov 21), `i4h-physics-simulation` (Nov 20), `i4h-sensor-simulation` (Nov 20), `Cosmos-H-Dreams` (**Nov 17**, the capital-C clinical soft-tissue world model), `cosmos3-h-dreams` (Nov 13). `xr_teleoperate` (Unitree humanoid XR teleoperation; **pushed Nov 6, carried**) remains the robotics-adjacent repo. **No new tag; `v0.9.0` finals (Oct 19–20) remain newest.** Same work-in-flight signal as Nov 16 — not a shipping event. **Next trigger: `v1.0` tag or a repo card / README / license on `Cosmos-H-Dreams`.**

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **🔴 Vuzix Ultralite Color OEM (Nov 18) — see headline #5.** Full-color microLED waveguide, <40 g, Vuzix Incognito, electrochromic, no camera, phone-tethered. CES 2027 Innovation Awards Honoree.
- **🔴 Vuzix × Friends With Holograms reseller agreement (Nov 23).** Enterprise distribution; corporate. [ir.vuzix.com](https://ir.vuzix.com/news-events/press-releases).
- **🔴 Vuzix Shrike — unchanged post-Modern Warfare Week.** MWW closed Nov 19; **no Shrike pricing / SDK / developer-program announcement in the window** despite being named the demo surface in §2A. Next scout still must sweep the following week in case of delayed coverage.
- **🔴 Lens Studio 5.25.0 (Nov 16) — see headline #7.** Baseline advance; "SPECS 27" copy unverified.
- **🔴 Snap Easy Lens CLI (Nov 18) — see headline #6.** Free, cross-platform, Claude/Codex/Cursor integration, 100+ AR blocks + 50+ AI asset generators. `easylens.snapchat.com/cli`.
- **🔴 Snap Newsroom — three other in-window items:** "Snapchat Introduces Mutual Friends" (Nov 17, social feature, not SPECS-related), "Snapchat Expands Creator Advertising Solutions to Help Brands Drive Results" (Nov 18, advertising business), "Snapchat Recap 2026 Is Coming" (Nov 14, carried from prior window).
- **🔴 Meta DAT 1.1.0 (Nov 20) — see headline #4.** Session pause/resume, MockDevice MCP server, granular stream errors, registration state tightening. **Publishing gate still shut; no module left `[Experimental]`.**
- **🔴 Jetpack XR Compose 1.0.0-rc01 (Nov 18) — see headline #3.** `xr.projected` still alpha15, not RC. §2F Compose half met.
- **XREAL AURA — no new SDK or firmware release in-window.** XREAL SDK **3.1.0** unchanged.
- **Samsung Galaxy Glasses audio tier ships Dec 10.** 17 days away; retail pre-orders still live; display tier unchanged (no announced window).

### Spatial Computing / 3D

- **🔴 Genie 4 (`genie-4`) GA on the Gemini API (Nov 19) — see headline #1.** $1.50/$9.00/$17.50 per MTok (text in / text out / A+V out); ~$0.10/sec of generated video on Standard; WebRTC and WebSockets; 24 fps 16:9 + 48 kHz stereo.
- **🔴 Isaac for Healthcare — see headline #10.** 6-repo push wave Nov 13–23; no tag; `Cosmos-H-Dreams` push Nov 17 is a work-in-flight signal on the clinical soft-tissue world model.
- **🔴 LichtFeld-Studio v0.5.4.3 (Nov 23) — see headline #9.** VR viewing + user shaders + calibration correction.
- **🔴 SuperSplat v3.9.0 → v3.9.1 → v3.9.2 (Nov 17–19) — see headline #9.** Timeline sequences (4D-adjacent), LOD publishing from 1M splats, anti-aliased splat rendering.
- **🔴 radiancefields.com — 7 new items Nov 21–23, all zero-prior-hit:**
  - **LichtFeld for Blender Trains Splats From Blender Scenes (Nov 23)** — Blender-native splat training.
  - **LichtFeld Studio 0.5.4.3 Adds VR Viewing and User Shaders (Nov 23)** — see #9.
  - **Bi Gan's Resurrection Crew Planned Its Long Take in 3DGS (Nov 23)** — splat used in a film-planning context.
  - **Twinbly Ships a CLI and Local MCP Server for Splats (Nov 22)** — splat MCP surface.
  - **QuickSplat Previews Gaussian Splats With the Space Bar (Nov 21)** — preview tool.
  - **PinchDrop Unfolds Phone Photos as Splats on Vision Pro (Nov 21)** — Apple-platform splat capture.
  - **French Touch Factory Adds HD 4DGS Playback to Unity (Nov 21)** — Unity 4DGS runtime.
- **World Labs blog — unchanged in-window.** Latest post still "Atlas: Releasing our next generation world model" (Nov 12). **`platform.worldlabs.ai` requires auth to view pricing; a pricing/latency read for Atlas API is still open.** `docs.worldlabs.ai/marble/release-notes` newest entry remains **2026-04-02 (Marble 1.1)** — carried; no Atlas-specific release-notes entry. §2B baseline unchanged.
- **SpAItial blog — unchanged.** Latest remains "Echo-3 and the SpAItial app" (2026-10-27).
- **MCP spec repo — unchanged.** Latest tag still **`2026-07-28`** (Jul 28); no new revision in-window. MCP blog unchanged in-window (latest Nov 11 "A More Predictable Release Cycle"; next-oldest Nov 10 file-transfer).

### AI / ML

- **🔴 Genie 4 API GA (Nov 19) — see headline #1.**
- **🔴 OpenAI GPT-6.2 Astra + Sol (Nov 17) — see headline #2.** `gpt-6.2-astra` $8/$40, `gpt-6.2-sol` $2/$10. Astra is a frontier cyber/reasoning model at ~1/3 the per-task cost of GPT-6 Astra. Ultrafast variant.
- **🔴 Gemini 4 Neon GA (Nov 18) — see headline #8.** 1M context, four thinking levels.
- **🔴 Gemini Tool Retrieval preview (Nov 19) — see headline #8.** Interactions API RAG for tool catalogs.
- **🔴 Gemini multimodal + Office/OpenDocument + Mac-native + Transcribe voice-editing (Nov 17–19) — see headline #8.**
- **🔴 DeepMind "Opening the datasets behind our AI weather models" (Nov 16+).** [deepmind.google/blog](https://deepmind.google/blog/). Zero prior scout hits on weather datasets. **Not directly MedSim-adjacent**, but filed as a possible input for EMS surge-simulation (`regional-ems-ecosystem-simulator.md` is bandwidth-gated, not data-gated — this is capability, not unblocker). Next-run read for scope.
- **🔴 Claude Code 2.1.330** (over `2.1.325` baseline). [CHANGELOG raw](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md). Notable: **organization sign-in via Enterprise Admin Console (2.1.330)**, **easel charting mod (2.1.330)**, **scheduled tasks integrated into `/tasks` (2.1.329)**, Code Mode expanded with OpenTelemetry (2.1.329), auto mode for Opus 4.6 and Sonnet 4.6 on multiple cloud providers (2.1.328), Code Mode with agent teams (2.1.326). **Per §2F "majors only" — not report-worthy at the version level**; Code Mode continuing to evolve is a capability-surface-shape change worth noting since the §2C "Claude Code" row explicitly tracks hook/.mcp.json/headless-auth breaking changes.
- **🔴 Codex 0.170.0 (Nov 18) → 0.171.0 (Nov 20) → rust-0.173.0-alpha.4 (Nov 21).** [github.com/openai/codex/releases](https://github.com/openai/codex/releases). 0.170.0 adds **WebRTC realtime voice calls in the TUI**; 0.171.0 adds **GPT-6.2 Sol/Astra to model catalog with Sol as the default**, TUI workspace default with searchable document previews and subagent transcripts, **`codex exec --remote` for noninteractive sessions on existing app servers**, `/rc` and `/remote` commands, custom MCP status line. **Per §2F "majors only" — not report-worthy at version level**, but the Sol/Astra integration is the actual surface where **OpenAI's new frontier models first appear in this scout** (see headline #2).
- **🔴 Claude Agent SDK python 0.2.183 (Nov 16) → 0.2.184 (Nov 18) → 0.2.185 (Nov 19) → 0.2.186 (Nov 19) → 0.2.187 (Nov 20).** Five bumps in five days. Not major per §2F.
- **🔴 ChatGPT iOS 1.2026.314 (Nov 18).** [learn.chatgpt.com/docs/changelog (fetch returned Codex items instead)](https://learn.chatgpt.com/docs/changelog). **Side chats persist on paired computers; project picker Cloud/paired-computer; word-wrap toggle for code blocks; iPad Cmd+N for new Codex tasks.** Not a model release; captured as consumer-surface context.
- **MiniMax H3-Image license verification — repo returns 401 on both `/raw/main/LICENSE` and `/api/models/MiniMaxAI/H3-Image`.** Per §2C Qwen precedent, **401 does NOT prove nonexistence** (the HF API returns 401 for repos that don't exist AND for gated repos). **Treated as unresolved, not falsified.** Next-run attempt: fetch `huggingface.co/api/models?author=MiniMaxAI` to enumerate what's public, and check `huggingface.co/MiniMaxAI/H3-Image` HTML to see if it's gated-but-visible or plain-404. Do not report as "unusable in portfolio" from a blank fetch (per §5 "Assert only what was fetched").
- **Thinking Machines Inkling 2 Small — Cloudflare row unchanged in-window, no new Workers AI model entries.** [developers.cloudflare.com/changelog](https://developers.cloudflare.com/changelog/). No Clef / Clef-flash deprecation or update. Weights-home verification still open from Nov 16 report.
- **Cloudflare changelog — infra, not models, in-window:** Pi 1.6 for Agents (Nov 20), Browser Run `/script` + `/snapshot` upgrades (Nov 19–20), Durable Objects reliability improvements (Nov 19), R2 metrics rps (Nov 19), Workers/Pages 30-day version retention (Nov 19), Agent Lee file attachments (Nov 18), Hyperdrive PlanetScale + mTLS (Nov 18), Cloud Connector GA (Nov 18), **WAF Java4Shell emergency rules (Nov 18) — security event, not model.**
- **Anthropic news — IPO closed Nov 20, priced Nov 18, roadshow Nov 10.** [anthropic.com/news](https://www.anthropic.com/news). **Corporate finance, not product.** No in-window model releases.
- **OpenAI developer changelog (`learn.chatgpt.com/docs/changelog`) — 404 to WebFetch this run.** The only OpenAI product content came through Codex release notes. Per §5 fetch-hostile table, add a note for next run.
- **digitalapplied AI model releases tracker — both guessed URLs 404'd.** Per §5, record the miss. Need correct URL next run — maybe `/blog/ai-model-releases-november-2026` or a dated monthly variant.

### Hardware

- **🔴 Vuzix Ultralite Color OEM reference design (Nov 18) — see headline #5.** <40 g full-color waveguide. No camera. No price. No SDK.
- **🔴 Vuzix × Friends With Holograms reseller (Nov 23).** Distribution channel.
- **No in-window humanoid-robot price movement.** Unitree G1 Basic $17,990, R1 Basic $8,990, 1X NEO $20,000 / $499/mo unchanged.
- **Samsung Galaxy Glasses audio tier ships Dec 10** (17 days). Pre-orders live since Nov 12; display tier still has no announced window.
- **No new LiDAR / RF-sensing hardware release in-window.**
- **No new AR dev-board or edge-compute release in-window.**

### Medical / Clinical AI

- **Isaac for Healthcare active pushes (Nov 13–23) — see headline #10.** `i4h-digital-twin` pushed Nov 16 and Nov 23; `Cosmos-H-Dreams` pushed Nov 17. No tag past v0.9.0.
- **MONAI-Physio — unchanged at `2026.11.0` (Nov 2).** PyPI unchanged. Duke labelmap + pretrained-model licenses still not read; carrying as standing residual.
- **DeepMind AI-for-Science items prior-report (AlphaGenome 2, Gemini Robotics 2.5, AlphaProof Code) — no in-window updates.**
- **🔴 Watch Duty + Gemini wildfire-alert case study (Nov 20).** [blog.google](https://blog.google/). First-responder adjacency; Gemini used for wildfire alerting. **Not actionable this sprint**, but filed as EMS-adjacent capability-ceiling data.
- **FDA CDRH FY2027 comment window closes 2026-11-30 — 7 days away.** §2E monthly cadence; no §4 action triggered — MedSim is a training simulator, not a device.
- **EU AI Act Art. 50 + Art. 4 obligations unchanged.** High-risk MDR/IVDR deadline still 2028-08-02.
- **No Siemens Healthineers / GE HealthCare simulation / digital-twin release in window.**
- **Anthropic drug-development followup — no in-window post.** The 2026-10-27 post remains the latest.

---

## Nothing New (Watchlist)

- **Apple Foundation Models framework open-source** — WWDC 2026 "later this summer"; still no repo. **Watchlist Week 25.**
- **Samsung Galaxy Glasses DISPLAY tier launch date** — audio tier ships Dec 10 (17 days); display tier unchanged (no window).
- **Snap SPECS consumer SKU date** — meteorological fall ends in **7 days** (Nov 30). If no announcement by then, "fall 2026" commitment slips calendar-year. The Nov 18 Easy Lens CLI post does not mention a SPECS consumer ship date.
- **"SPECS 27" copy in Lens Studio 5.25.0** — unverified whether this is hardware generation, software version, or publishing-target label. Next-run read Snap OS release notes in Chrome (fetch-hostile per §5).
- **XREAL AURA customer-review window** — orders opened Oct 28; no substantive long-form reviews surfaced in-window.
- **Vuzix Shrike pricing / SDK** — no change despite MWW Nov 16–19. §2A exit condition (published price or public SDK) remains the trigger.
- **Vuzix Ultralite Color pricing / SDK / dev program** — same exit conditions as Shrike; carry as a second row.
- **World Labs Atlas API pricing/latency figures** — `platform.worldlabs.ai` pricing page requires auth. Still unresolved.
- **Meta DAT publishing-gate open** — 1.1.0 shipped but publishing gate still shut; FAQ unchanged per §2F row. No module left `[Experimental]`.
- **FDA follow-up draft guidance** — comment window closes Nov 30 (7 days); §2E monthly cadence.
- **XREAL SDK 3.2.0** — no announcement.
- **Qwen4 open-weight sub-Max releases** — no new Qwen4 public weight in-window.
- **MiniMax H3-Image license verification** — 401 on both LICENSE and api/models paths; unresolved per §5.
- **Cosmos-H-Dreams / cosmos3-h-dreams** — both pushed in-window; no repo card, no README, no tag yet. Watch for model card + license file.
- **Inkling 2 Small weights home** — Cloudflare lists as "frontier open model"; no HF/weights link; weights-public claim still unverified.
- **OpenAI announcement surface in §2C** — this scout surfaced GPT-6.2 only via the Codex release notes. **The config is missing a §2C row for OpenAI.** Recommend adding one next scout (see Project Impact).

---

## Project Impact

- **MedSim-Game (flagship):**
  - **Genie 4 API GA is the single most significant release of the window for MedSim content pipelines**, but with cost discipline: a one-minute generated video clip is ~$6.05 at Standard pricing. **Action: for any scenario-video or demo-world prototyping, Genie 4 is now the first tool to reach for; budget per-session cost upfront.** The Nov 12 Gemini 4 Hydrogen ($1.50/$7.50 per MTok) remains the text/multimodal default. Genie 4 and Hydrogen together close the "clinical-scenario pipeline" and "scenario-video generation" surfaces that were previously open.
  - **OpenAI GPT-6.2 Sol at $2/$10 per MTok is the new cross-vendor baseline for agentic workflows.** Below Gemini 4 Hydrogen ($1.50/$7.50) on input but above on reasoning-level default; above Claude Fable 5.2 ($8/$40) on cost by 4×, below it on model quality per Anthropic benchmarks. **Not a migration recommendation**; MedSim content review still runs on the Anthropic stack through the owner's established workflow. File as cost-ceiling data.
  - **Isaac for Healthcare** continues to push code without tagging. **Not actionable this sprint.** The Nov 23 `i4h-digital-twin` push follows the same patient-DT pipeline shape as the Nov 16 push.
  - **radiancefields Nov 21–23 wave does not change MedSim flagship trajectory** — none of the splat items targets clinical scene capture or physiological grounding.

- **MedCapture:**
  - **Gemini Transcribe voice-editing (Nov 17)** and the ongoing DAT 1.1.0 / ElevenLabs / MAI matrix make this a four-vendor comparison shelf for voice capture. **Still no action required**; benchmark when a labeling-cost or voice-capture decision reopens.
  - **Gemini document-slicing + Office/OpenDocument (Nov 18)** moves the ceiling on clinical-document ingestion. Unchanged capability for MedCapture's current capture-to-DB flow; relevant if the roadmap moves to document-assisted labeling.
  - **MockDevice MCP server (Meta DAT 1.1.0) + Twinbly Local MCP Server (splats) + Easy Lens CLI (Snap)** = three vendor-first-party MCP/CLI surfaces in one week. **The pattern worth filing in the MedCapture / 3rdrider tech-radar: vendor-first-party agent surfaces are shipping faster than the Agent Plugins spec is maturing.** The §2C Agent Plugins row's "watch for a client shipping a reader" trigger has not fired; the market is routing around it with vendor-specific MCP endpoints.

- **BadgeMedia / Tenetrix Insight:** No relevant news this window.

- **3rdrider (parked):**
  - **Snap Easy Lens CLI (Nov 18)** materially lowers the engineering cost to ship a Snap Lens, and it is the first vendor-side move that brings Snap's developer surface into the AI-coding-assistant loop that the owner's workflow already runs on. **It is NOT the hardware blocker** — 3rdrider's blocker is consumer AR glasses with display, camera, mic, SDK at <$800. Easy Lens CLI runs against the existing SPECS hardware line, and SPECS consumer-SKU ship date is still unresolved (Nov 30 is the fall-window cliff).
  - **Vuzix Ultralite Color (Nov 18)** is the second Vuzix OEM platform after Shrike. **It is CAMERA-LESS and DISPLAY-only**, so it does not meet the 3rdrider blocker (which requires camera + display). But it is the first full-color waveguide reference design at sub-40 g in the portfolio-tracked set, and if an OEM ships a branded product with Ultralite Color *plus* a camera module, it shifts the landscape. **No price, no SDK, no dev program this run.**
  - **Jetpack XR Compose 1.0.0-rc01 (Nov 18)** means the Compose half of the Android XR runtime stack is one step from stable; combined with the already-stable `xr.runtime` / `xr.scenecore` / `xr.arcore` (Oct 21), the SDK leg of the 3rdrider blocker is almost entirely closed on Android. Still waiting for `xr.projected` RC / stable (the glasses-specific track).
  - **Meta DAT 1.1.0 publishing still shut.** No change on the Meta-side path.
  - **No action — field is converging, blocker specifics unchanged.**

- **Haptic-mirror (parked):**
  - **LichtFeld-Studio v0.5.4.3 (Nov 23) ships VR viewing in-tool** — the viewer side of the haptic-mirror stack has moved from "assemble three components" to "one tool + Linux." **Technical blockers remain fully closed; this is a path-simplification, not a new unblocker.** PinchDrop on Vision Pro (Nov 21) adds a second Apple-silicon capture path alongside sperid-swift-mlx. **Non-technical blocker (procedure + customer) unmoved.**

- **AI Multi-view Video Generator (parked):**
  - **Genie 4 API GA (Nov 19) is the categorical unblock the (a)-clause of the blocker was waiting for.** The clause reads *"wait for Google Genie 3 (or competitor) to expose multi-view export as a public API feature."* Genie 4 exposes **real-time steerable interactive worlds over WebRTC** — a **stream of a single steerable view, not a batch export of 6 fixed views**. So the blocker's letter (multi-view export as public API) is **almost met**: Genie 4 is a public API, exposes a world model, and the camera is programmable, but the specific "6 synchronized fixed views for a cube face" delivery shape is not an endpoint yet. **PROMOTE to active-consideration** — the field has crossed from "no path" to "one API call away" via per-face concurrent `genie-4` sessions on a shared seed, subject to session-consistency. **Cost caveat:** 6 concurrent 1-minute sessions at ~$6.05/min each = **~$36 per 1-minute cube clip** on Standard. Validation cost is now the question, not availability.

- **Regional EMS Ecosystem Simulator (parked):**
  - **DeepMind weather-model datasets (Nov 16+)** expand the inputs available to a surge-simulation; not actionable since blocker is engineering bandwidth, not data.
  - **No other movement. WAIT (bandwidth-gated).**

- **MedCapture humanoid-robot extension / EMS event robot fleet (parked):**
  - **Isaac for Healthcare `xr_teleoperate` (Unitree XR teleoperation)** present in the org repo list since Nov 6; no in-window push. No humanoid-robot hardware price movement.
  - **WAIT — price blocker unmoved.**

- **Military parallel (parked):**
  - **Vuzix Modern Warfare Week closed Nov 19 with no Shrike pricing / SDK announcement.** The §2A exit condition remains the trigger. **Second Vuzix OEM platform (Ultralite Color, Nov 18)** is a different product line (no-camera waveguide), not a military parallel. **WAIT.**

---

## Config maintenance recommended for next run

- **Add a §2C row for OpenAI announcement surface.** This scout surfaced GPT-6.2 only through the Codex release notes. Candidate URLs: `openai.com/news/product-releases/`, `learn.chatgpt.com/docs/changelog` (fetch-hostile per §5 from this run — 404 to WebFetch), `community.openai.com` category feed. Without a §2C row, future OpenAI SKU drops will again depend on the Codex row catching them downstream.
- **Advance baselines in-same-run (per §2B World Labs rule):**
  - §2A Snap Newsroom: top headline now "Introducing Easy Lens CLI" (2026-11-18).
  - §2A Lens Studio: **5.25.0** (2026-11-16); flag "SPECS 27" copy.
  - §2A Meta DAT: **1.1.0** (2026-11-20), both platforms.
  - §2B radiancefields.com: newest **2026-11-23** ("LichtFeld for Blender …" + "LichtFeld Studio 0.5.4.3 …" + "Bi Gan's Resurrection Crew …").
  - §2C MCP blog: unchanged (newest 2026-11-11 "A More Predictable Release Cycle").
  - §2C blog.google RSS: newest **2026-11-20** ("Get your year-end tasks done with new Connected Apps" / "Watch Duty wildfire alerts").
  - §2C Cloudflare changelog: newest **2026-11-23** (DNS endpoint change).
  - §2F Jetpack XR: Compose **1.0.0-rc01**, Projected **1.0.0-alpha15**, Runtime/Scenecore/ARCore 1.1.0-alpha03/02/02 (all 2026-11-18).
  - §2F Claude Code CHANGELOG: **2.1.330**; Claude Agent SDK python: **v0.2.187**; Codex stable: **0.171.0** (rust-0.173.0-alpha.4 in pre-release).
  - §2F SuperSplat: **v3.9.2** (2026-11-19).
  - §2F LichtFeld-Studio: **v0.5.4.3** (2026-11-23).
  - §2F Genie API gate: ✅ **`genie-4` GA on Interactions API (2026-11-19)** — trigger fired. Row stays live; next trigger is Project Genie export of multi-view / camera paths.

---

## Parked Idea Unblocks

- **Idea:** AI Multi-view Video Generator
  - **File:** `_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a public API feature; (b) build it from existing 3D primitives…requires display-cube-six-screens project to exist first."
  - **What changed:** **Genie 4 (`genie-4`) is GA on the Gemini API as of 2026-11-19**, exposing real-time steerable interactive worlds over WebRTC at 24 fps 16:9 + 48 kHz stereo audio, $1.50/$9.00/$17.50 per MTok (~$0.10/sec of generated video). The blocker's (a)-clause is **categorically met** on "public API for a world model" — though Genie 4 exposes a *steerable single view*, not a batch export of 6 fixed views. Six-camera coverage requires 6 concurrent sessions on a shared seed/state, subject to session-consistency the model does not yet guarantee across parallel streams.
  - **Recommended action:** **PROMOTE to active-consideration.** Zero-cost moves this week: read the Genie 4 model card and the Interactions API docs end-to-end to confirm or rule out per-session state-sharing, and compute the per-minute cost ceiling (~$36/min at 6×). Low-cost move: one $6 1-minute single-view test session to establish the actual cost-per-session floor before committing to a 6-session trial.

- **Idea:** 3rdrider — AR clinical decision support for paramedics
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800."
  - **What changed:** **Nothing changed on the hardware blocker.** Vuzix Ultralite Color (Nov 18) adds a second OEM reference design but is **camera-less**, not consumer-shipping, and has no SDK. Jetpack XR Compose 1.0.0-rc01 (Nov 18) advances the Android XR SDK leg almost to stable. Snap Easy Lens CLI (Nov 18) lowers the per-engineer cost to ship a Snap Lens but does not change the hardware availability.
  - **Recommended action:** **WAIT** — same as the Nov 16 recommendation. The specific wait remains for Samsung's display-tier launch date OR a Snap SPECS consumer-SKU ship date (fall 2026 window closes Nov 30, 7 days).

- **Idea:** Haptic Mirror — D4RT / world-model body sim
  - **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** "no validated procedure or customer for a VR training scene; capture→scene→render fully available as of 2026-09-28."
  - **What changed:** **LichtFeld-Studio v0.5.4.3 (Nov 23) adds VR viewing in-tool**, simplifying the viewer side of the capture→scene→render stack to a single Linux tool. PinchDrop on Vision Pro (Nov 21) adds a second Apple-silicon capture path. **Technical blockers remain fully closed — these are path-simplifications, not categorical unblockers.** Non-technical blocker (procedure + customer) unmoved.
  - **Recommended action:** **WAIT** — same as Nov 16.

- **Idea:** Regional EMS Ecosystem Simulator
  - **File:** `_ops/idea-vault/regional-ems-ecosystem-simulator.md`
  - **Blocker was:** engineering bandwidth, not technology.
  - **What changed:** **DeepMind released weather-model datasets (Nov 16+)** that could ground a surge-simulation on real meteorological data. Not an unblocker — the blocker is bandwidth, not data.
  - **Recommended action:** **WAIT** — bandwidth-gated.

- **Idea:** MedCapture humanoid-robot extension / EMS event robot fleet
  - **Files:** `_ops/idea-vault/medcapture-humanoid-robot-extension.md`, `_ops/idea-vault/ems-event-robot-fleet.md`
  - **Blocker was:** humanoid robot price + capability.
  - **What changed:** No in-window humanoid-robot hardware price movement. Isaac `xr_teleoperate` (Unitree humanoid XR teleoperation) carried from Nov 6.
  - **Recommended action:** **WAIT** — hardware-price blocker unchanged.

- **All other parked ideas** (`medcapture-stereo-second-camera.md`, `medcapture-hand-kinematics-robotics.md`, `sim-lab-mockup-print-bank.md`, `sim-lab-rfid-ultrasound-trainer.md`, `medical-mmo-open-world.md`, `medsim-marketing-gtm.md`, `medsim-data-gathering-analytics.md`, `medsim-revenue-angles-expansion.md`, `medsim-school-employer-custom-content.md`, `military-parallel-pipeline.md`, `zoll-stryker-bracket.md`, `group-matchmaking-cascading-tinder.md`, `instrumented-task-marketplace-for-ai-training.md`, `painting-wars-pixel-rts.md`, `longplay-monument.md`, `display-cube-six-screens.md`, `swappable-shells-animated-screens.md`, `runway-dev-portal-exploration.md`, `telegram-inline-keyboard-question-protocol.md`, `ai-augmented-field-sales-scaling.md`) — **blockers unchanged by this window's releases.** No action.
