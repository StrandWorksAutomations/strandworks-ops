# Tech Scout Report — 2026-09-01

**Window:** 2026-08-31 → 2026-09-01 (1 day; normal daily cadence — no gap backfill).

**Major events swept:** none in-window. Next on the calendar: **IFA Berlin Sep 4–8** (RayNeo iO/GT/GT Max go on sale Sep 4; Meta AI Glasses + CUPRA showcase), **Apple event Sep 9** (Ternus's first as CEO), **Snap Specs launch Sep 16**, **Meta Connect Sep 23–24**, **Pico Space Pro Q4** (see correction below).

**Headline:** a real model-drop day, not a thin one. Anthropic shipped **Claude Fable 5.1 / Mythos 5.1** (the substrate every agent in this portfolio runs on — three API breaking changes to check), OpenAI moved **Astra** from "indefinitely paused" to a gated graduated release, Meta shipped a closed real-time ASR model (**Muse Voice Transcribe**) instead of the promised Muse Spark 1.2 weights, and DeepSeek's first **V4 vision model went open-weights**. AR hardware: nothing shipped; one stale watchlist line corrected.

**Method notes (log, don't repeat):** (1) Techmeme front-page scan surfaced four of today's five headline items that the targeted focus-area queries missed — add [techmeme.com](https://www.techmeme.com/) as a per-run headline diff. (2) `deepseek-ai` was logged "flat" on 08-22 because only the HF org was checked; the V4-Flash-Vision API launch on Aug 21 lived on [api-docs.deepseek.com/news](https://api-docs.deepseek.com/news/news260821/) — API-first labs need their news page checked, not just HF. (3) LichtFeld `model-sam2-v1` (Aug 28) was missed by three runs because it is a *model-asset* release tag, not an app tag — read every release tag, not just `v*`.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- **Nothing shipped.** Snap newsroom headline list unchanged (newest still 07-31 "SPECS Launch on September 16"). Lens Studio still **5.23.2** (Aug 17). Android Developers Blog: no Compose for XR beta post; the Sep 1 "Enhance your app for the new Pixel lineup" item is a re-post of the Aug 12 Made by Google content.
- **Meta AI Glasses + CUPRA Raval "look-and-ask" showcase — world premiere at IFA 2026** — [IFA press](https://myc-media.de/ifa-2026-zeigt-weltpremiere-meta-ai-glasses-und-cupra-demonstrieren-die-naechste-generation-der-mensch-produkt-interaktion/) — a demo, not a product: glasses capture visual context + pointing gesture, ground against a product knowledge base, answer by voice. This is exactly the 3rdrider interaction model applied to a car. Demand signal, not an unblock.
- 🔧 **CORRECTION to the 08-31 watchlist:** "Pico Space Pro — Sep 2 launch" was stale. Pico **cancelled the Sep 2 Beijing event on Aug 24 and moved launch to Q4 2026** — [vr.org](https://vr.org/articles/pico-space-pro-delayed-q4-september-event-cancelled-2026). Specs still: dual 4K micro-OLED (~4,000 PPI), ~270 g, tethered battery puck, ~$2,000 expected, unconfirmed.

### Spatial Computing / 3D
- **LichtFeld-Studio — genuine feature work in-window, no app release.** 30 commits Aug 31–Sep 1 via `/commits` (not `pushed_at`): **"Cut training VRAM by 30% and speed up training" (#1917, Aug 31)**, training survives OOM + `.licht` keeps checkpoint history (#1943), 2.2x faster project save (#1940), crash-relaunch fix (#1944), mixed-orientation normal/depth fix (#1946). Last app tag still **v0.5.3 (Jun 24)** — [github.com/MrNeRF/LichtFeld-Studio](https://github.com/MrNeRF/LichtFeld-Studio). **Backfill (missed by 08-28/08-30/08-31):** release tag **`model-sam2-v1` (Aug 28)** ships SAM 2.1 Hiera base+ image-predictor weights (Apache-2.0) as a LichtFeld model asset — SAM2-based splat segmentation is landing in the app.
- Marble release notes unchanged (newest 2026-04-02). SpAItial blog unchanged (Echo-2, 2026-04-28). SuperSplat v2.32.5 (Aug 25) unchanged. faster-gaussian-splatting last commit Aug 20. **Gaussian Splatting Newsletter: no Sep 1 issue** — the July issue landed Aug 14 (44 days late); the strict 1st-of-month cadence is broken, treat as irregular.
- **D4RT official code:** still none (week 18). Community `Open-d4rt` unchanged.

### AI / ML
1. **Claude Fable 5.1 + Claude Mythos 5.1 — shipped Sep 1.** [Announcement](https://www.anthropic.com/claude-fable-and-mythos-5-1) · [Fable page](https://www.anthropic.com/claude/fable) · [Models table](https://platform.claude.com/docs/en/docs/about-claude/models/overview) · [Breaking-changes writeup](https://www.digitalapplied.com/blog/claude-fable-5-1-cost-and-breaking-changes). Same underlying model; Fable = public with cyber/bio classifier safeguards, Mythos = same weights with safeguards loosened for vetted US orgs (Cyber Verification / Life Sciences Verification programs). API id **`claude-fable-5-1`**; on Bedrock (`anthropic.claude-fable-5-1`), Vertex, Foundry, Claude Platform on AWS. **1M context / 128K output / knowledge cutoff Jun 2026**; adaptive thinking always on; default effort `high`; retirement not before 2027-09-01. **Pricing $10 / $50 per MTok (unchanged); cache reads cut 75% to $0.25** → ~25% cheaper typical, up to 45% cheaper agentic; US-only inference 1.1x. Benchmarks vs Fable 5: agentic scientific research 52.6% (was 24.7%), agentic coding 55.8% (was 42.0%). **Three API breaking changes:** (a) `tool_choice: any` or a named tool → **400**; use `auto` + strict tool use / structured outputs; (b) **append-only history** — editing system prompt, tool list, or any message before a thinking block → 400 (enforced now for accounts created after Aug 31, wider rollout later); (c) thinking blocks are one-way portable (5.1 reads older models' thinking; older models can't read 5.1's) unless `thinking-binding-controls-2026-08-01` beta. Also shipped: **Watermark Detection API (private preview, EU AI Act Art. 50 tooling)** for regulators/media/researchers; 60% fewer cyber false-positive refusals; **Claude Code defaults to High effort**. Companion (Sep 1): **Enterprise Frontier Safeguards** — zero-data-retention + customer-side misuse detection, phased rollout "later this fall", 100+ design customers incl. healthcare — [post](https://www.anthropic.com/news/enterprise-frontier-safeguards).
2. **OpenAI Astra crosses the "Critical" cyber threshold — graduated release announced Sep 1.** [OpenAI post](https://openai.com/index/responding-next-frontier-critical-cyber-capabilities/) · [CNBC](https://www.cnbc.com/2026/09/01/open-ai-astra-cyber-model.html). First OpenAI model in the top Preparedness tier (autonomous zero-day discovery + exploitation). A public version ships "soon"; the cyber capabilities are gated to **Daybreak Blue** partners + government testers at launch. **Resolves the "indefinitely paused since Aug 7" watchlist item** into the same graduated-gate pattern as GPT-5.6-Cyber and GLM-5.3 — the cyber-gating norm now has three on-record outcomes and none is "cancelled."
3. **Meta Muse Voice Transcribe — shipped Sep 1, API-only, closed weights.** [AI at Meta](https://x.com/AIatMeta/status/2094839236016976028) · [The New Stack](https://thenewstack.io/meta-muse-voice-transcribe/) · [Engadget](https://www.engadget.com/2249112/meta-new-ai-transcription-model-can-distinguist-between-multiple-speakers-and-languages-in-real-time/). First real-time audio model from Meta Superintelligence Labs: streaming ASR + **diarization for 20+ speakers** + endpointing in one model, 70+ languages (25 validated), mid-sentence code-switching. **#1 on Artificial Analysis AA-WER Streaming at 3.1% WER, 0.16 s after end of speech** (Cartesia Ink-2 3.4%, ElevenLabs Scribe v2 RT 3.6%, GPT Live Transcribe 3.9%, Gemini 3.5 Transcribe Live 4.0%). **$3 per 1,000 audio-minutes ($0.18/hr)** via Meta Model API. **Meta explicitly will NOT open the weights** — note the asymmetry with the still-undelivered Muse Spark 1.2 weights (Day 22).
4. **DeepSeek-V4-Flash-Vision-Exp open weights — HF repo created Aug 31, MIT.** [huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp) · [API news (Aug 21)](https://api-docs.deepseek.com/news/news260821/). First multimodal model in the V4 family: sparse MoE **284B total / 13B active**, image-text-to-text, 1M context, matches V4-Flash on text; ApexBench 36.5% (was 26.2%). API live since Aug 21 at $0.44 / $1.32 per MTok. Deployable via vLLM/SGLang; no third-party inference provider yet.
5. **Android Studio Quail 4 stable — Sep 1.** [Android Developers Blog](https://android-developers.googleblog.com/2026/09/leverage-gemma-4-android-studio-quail.html). **23 bundled Agent Skills** (open-standard skill spec; AGP 9 upgrade, Profiler, Navigation3, Adaptive UI…), **`android skills add --all`** CLI to hand the same skills to any external agent (Claude Code included), **Gemma 4 local model** built in (12 GB RAM min, 32 GB recommended; code never leaves the machine), parallel-agent UX. Gemma 4 itself is not new (Apr 2).
6. **Anthropic "Improving our alignment and security efforts" — Aug 31.** [Post](https://www.anthropic.com/news/improving-alignment-security-efforts) · [IT Pro](https://www.itpro.com/security/anthropic-resumes-model-testing-after-recent-cyber-incidents-but-its-introduced-new-rules-to-improve-security). Follow-up to the July cyber-eval incidents (three unauthorized-access events + the UK AISI Mythos 5 incident): hardened eval sandboxes, new third-party-tester rules, ~150 engineers seconded to security, model-side changes. Governance context for item 1.
7. **Minor / no action:** `modelcontextprotocol/servers` **2026.8.31** (package bump of filesystem/memory/sequential-thinking/everything; no new capability; MCP blog unchanged, newest Aug 22 roadmap). `Qwen/Qwen3.8-Flash-Next-FP8` (Aug 31, quant of the Aug 26 model). NVIDIA Nemotron-3.5-Lightning NVFP4 **DFlash/DSpark** speculative-decoding checkpoints and Nemotron-3-Ultra GenRM touched Sep 1 (repos date from Aug 5 / May 26 — card updates, not drops). `google/timesfm-3.0-pytorch` (time-series, Aug 24, updated Sep 1).

### Hardware
- **NVIDIA DLSS 5 "3D-Guided Neural Rendering" — announced Sep 1, live Sep 3 21:00 PT in NBA 2K27.** [NVIDIA](https://www.nvidia.com/en-us/geforce/news/dlss-5-3d-guided-neural-rendering/) · [Tom's Hardware](https://www.tomshardware.com/pc-components/gpus/nvidias-controversial-dlss-5-will-launch-september-3-with-nba2k27-available-on-all-rtx-50-series-gpus-laptops-and-geforce-now). Final-stage neural pass adds skin subsurface scattering, light-through-hair/ears, contact shadows while the engine frame defines geometry. **RTX 50-series only** (desktop + laptop) + GeForce NOW Ultimate; devs integrate via **Streamline or the UE5 plugin**. Performance cost disputed (NVIDIA: 370 fps 4K on 5090; PC Gamer: 50–60% hit). Irrelevant to MedSim's web/mobile target; note for any future desktop hero-patient render.
- Nothing else shipped. RayNeo iO (33 g AI glasses) / GT / GT Max go on sale **Sep 4** — pricing still unpublished; iO is the one to check against the 3rdrider <$800 threshold.

### Governance / Structural
- **Apple: John Ternus is CEO effective Sep 1; Tim Cook → Executive Chairman** (announced April; effective today) — [Apple Newsroom](https://www.apple.com/newsroom/2026/04/tim-cook-to-become-apple-executive-chairman-john-ternus-to-become-apple-ceo/) · [NPR](https://www.npr.org/2026/09/01/g-s1-141411/apple-ceo-tim-cook-john-ternus). Ternus ran hardware incl. Vision Pro — the AR product line now reports to someone who built it. First event Sep 9 (foldable iPhone expected). Also watch whether the **Foundation Models open-source promise** survives the transition.
- **EU designates ChatGPT a Very Large Online Search Engine under the DSA (Aug 31)** — [Business Standard](https://www.business-standard.com/world-news/what-does-the-eu-very-large-search-engine-tag-mean-for-chatgpt-126090100678_1.html) · [SEJ](https://www.searchenginejournal.com/chatgpt-is-now-a-very-large-online-search-engine-in-the-eu/587801/). 159M EU MAU vs 45M threshold; compliance (risk assessments, audits, data access) due Jan 2027. Precedent: an assistant with web search is a search engine. Zero MedSim exposure.
- **Anthropic $35B / 350 MW compute deal with Nvidia-backed Lambda (Nueces County, TX), signed Aug 31** — [Forbes](https://www.forbes.com/sites/jonmarkman/2026/09/01/anthropic-books-35-billion-to-nvidia-backed-lambda-for-cloud-capacity/) · [Quartz](https://qz.com/anthropic-lambda-nvidia-cloud-deal-35-billion-090126). Substrate-capacity signal for Claude; on top of the $45B Nscale WV deal.

---

## Nothing New (Watchlist)

- **OpenAI Astra** — ⬆️ **MOVED to Releases** (graduated release announced; public version "soon"). Watch for the actual ship date + whether it is GPT-6-branded.
- **Pico Space Pro** — 🔧 **corrected to Q4 2026** (Sep 2 event cancelled Aug 24).
- **Apple Foundation Models framework open-source** — WWDC "later this summer" promise; **Labor Day Sep 7 in 6 days**; `apple` GitHub org shows no new FM repo (only `foundationdb` pushed today). Watchlist week 13. CEO transition today adds risk.
- **DeepMind D4RT official code** — week 18.
- **Gemini 3.5 Pro GA** — still absent from the API changelog.
- **Genie 3 developer API** — still Ultra-only Project Genie.
- **Meta Muse Spark 1.2 open weights** — **Day 22**; no repo in `facebook`/`meta-llama` (a `MuseSparkAI/musespark-video` repo created Aug 30 is third-party, not Meta). Meta shipped a *closed* model today instead.
- **Alibaba Qwen3.8-Max vision weights** — `Qwen` org newest = Flash-Next-FP8 (Aug 31); no Max-vision.
- **Apple CoreAILanguageModel / MLXLanguageModel** — org still empty.
- **Cursor Origin GA** — waitlist; OpenAI API wind-down Nov 12 unchanged.
- **Ray-Ban Meta Gen 3** — Connect Sep 23–24; no FCC filings under Aperol/Bellini.
- **Jetpack Compose for XR beta** — "to follow soon" since Aug 21; core libs beta, Compose still alpha.
- **NVIDIA GR00T N2 / Jetson T3000-T2000** — EOY / Q1 2027 unchanged.
- **Onyx Boox Palma 3 / Note Air6 C / Note Mini C / Tab Elite** — "soon," no dates.
- **Mayo Clinic + Microsoft frontier healthcare model** — 14 weeks, nothing.
- **ARPA-H simulation + causal models workshop report** — 7 weeks, nothing.
- **Snap Specs** — Sep 16 event (specs.com stream 4 PM PT), $2,195, $200 deposit, ships "this fall."
- **RayNeo iO / GT / GT Max** — on sale Sep 4 (IFA); pricing TBD.
- **Gaussian Splatting Newsletter** — cadence broken; no Sep 1 issue.
- **Agent Plugins spec** — still zero tags; Android Studio's "open-standard skills" is the closest thing to a shipping reader — confirm which spec it follows on the next run.

---

## Project Impact

- **MedSim-Game (flagship) — substrate day, one concrete check.**
  1. **Fable 5.1 breaking changes vs MedSim code:** grep of `MedSim-Game` + `medsim-physio` finds **zero `tool_choice` usage** (change a: clear) and **three references pinned to the `claude-fable-5` id** — leave them pinned unless a re-eval is scheduled; Fable 5 remains available as a legacy model. The `sim-llm-npc` edge function (legacy Supabase project) should be re-checked for any history-editing pattern before it is ever moved to a post-Aug-31 account (change b). No action today.
  2. **Cache-read cut to $0.25** directly lowers the cost of the long-context agent sessions this portfolio runs (scout, job-watch, build agents) by ~25–45%. Nothing to change; it applies automatically.
  3. **Watermark Detection API** is the first concrete tooling for **EU AI Act Art. 50** labeling of LLM-NPC / AI-generated scenario content — file under the EU-launch decision (per TECH_SCOUT_CONFIG §E), not a sprint.
  4. **Muse Voice Transcribe** is a candidate for voice-in to NPC patients and for **debrief transcription with per-speaker attribution** (20+ speaker diarization fits a sim-lab team debrief). $0.18/hr is inside budget. Evaluate against the current STT choice when the voice feature is scheduled; API-only means no offline mode.
  5. **Android Studio Quail 4 → `android skills add --all`** gives Claude Code Google's 23 Android skills for the mobile-first build path. Cheap to adopt when Android work resumes.
  6. **DeepSeek V4-Flash-Vision open weights**: a self-hostable MIT vision model for image-grounded clinical content QA (ECG strips, POCUS frames). 284B total means RunPod-class, not the droplet. Low priority; logged as an option.
- **MedCapture (Tier-2):** Muse Voice Transcribe's diarization + code-switching fits multi-provider procedure narration capture. No customer signal in-window.
- **BadgeMedia / Tenetrix (Tier-2/3):** no impact.
- **3rdrider / haptic-mirror (parked):** see below.

---

## Parked Idea Unblocks

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"
  - **What changed:** D4RT still no code (week 18). **Small positive drift:** LichtFeld-Studio cut training VRAM 30% and added OOM-survival/checkpoint history in-window, plus SAM 2.1 segmentation weights (Aug 28) — the timeboxed 3DGS spike gets cheaper and more robust on the hardware already owned. Not new scene-gen capability.
  - **Recommended action:** **WAIT** (unchanged). Spike after Vault v1 canon lands.

- **Idea:** 3rdrider (resume when consumer AR ships at viable price/form with SDK)
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"
  - **What changed:** No unblock. Two ambient signals: (1) **Meta + CUPRA IFA showcase** is a mainstream OEM validating the "look at a thing, ask a question, get grounded answer" interaction — 3rdrider's exact loop — on camera-only glasses; (2) **RayNeo iO (33 g AI glasses) on sale Sep 4** — if iO turns out to have a display + camera + SDK under $800 it is the first candidate to meet the threshold. Pricing not yet published.
  - **Recommended action:** **WAIT**; on the Sep 4 run, check RayNeo iO price/display/SDK against the threshold explicitly.

- **Idea:** AI video / scene generator with synchronized 6-direction output
  - **File:** `_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "(a) Genie 3 (or competitor) exposes multi-view export as a public API … (b) build from 3D primitives, requires display-cube-six-screens first"
  - **What changed:** No Genie 3 API. No change to path (b).
  - **Recommended action:** **WAIT.**

- **Idea:** Telegram inline-keyboard question protocol
  - **File:** `_ops/idea-vault/telegram-inline-keyboard-question-protocol.md`
  - **Blocker was:** "small spec — answer-callback path through daemon → outbox handoff back to inbox; ~2-4 hour build"
  - **What changed:** Not a tech unblock — the **Telegram channel was muted 2026-08-30** and agent delivery moved to the briefings feed, so the idea's transport no longer exists. The blocker text is stale.
  - **Recommended action:** **Owner call** — re-point the idea at a briefings-feed answer path or mark it deprecated. Flagged, not actioned.

- **Idea:** MedSim school/employer custom content
  - **File:** `_ops/idea-vault/medsim-school-employer-custom-content.md`
  - **Blocker was:** "Core single-tenant product not yet validated; multi-tenant adds substantial complexity before MVP demand exists"
  - **What changed:** **Enterprise Frontier Safeguards** (customer-controlled ZDR + misuse detection, healthcare among the design customers, rolling out this fall) is the kind of control a school/hospital procurement asks for before approving an LLM-backed training tool. Channel-readiness drift only; v1 traction still gates.
  - **Recommended action:** **WAIT.**

- **All other parked ideas** (`ai-augmented-field-sales-scaling`, `display-cube-six-screens`, `ems-event-robot-fleet`, `group-matchmaking-cascading-tinder`, `instrumented-task-marketplace`, `longplay-monument`, `medcapture-hand-kinematics-robotics`, `medcapture-humanoid-robot-extension`, `medcapture-stereo-second-camera`, `medical-mmo-open-world`, `medsim-data-gathering-analytics`, `medsim-marketing-gtm`, `medsim-revenue-angles-expansion`, `military-parallel-pipeline`, `painting-wars-pixel-rts`, `regional-ems-ecosystem-simulator`, `runway-dev-portal-exploration`, `sim-lab-mockup-print-bank`, `sim-lab-rfid-ultrasound-trainer`, `swappable-shells-animated-screens`, `zoll-stryker-bracket`) — **no in-window developments touch their blockers.**
