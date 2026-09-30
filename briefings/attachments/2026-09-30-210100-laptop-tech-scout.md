# Tech Scout Report — 2026-09-30

**Window:** 2026-09-28 → 2026-09-30 (2 days; normal daily cadence — no gap backfill).

**Major event swept in window:** **OpenAI DevDay 2026, Sep 29** (25 announcements — GPT-6.1 Sol, Ultrafast tier, Dots always-on agents, Agents API, Decisions API, Codex cloud/security, ChatGPT Space, Marketplace, Pro 500). Also **Claude Sonnet 5.5, Sep 28.**

**Headline shift:** This is an **AI-platform window, not an AR/spatial one.** Nothing material shipped in AR/smart glasses, spatial computing, or hardware in the two days since the last report — post-Connect coverage only. What did land is a frontier-model price collapse (GPT-6.1 Sol at 1/5 of Astra; Sonnet 5.5 at ~30% lower cost per task with unchanged sticker price), a first-class **Agents API**, and — MedSim-relevant — an **FDA clearance for AI reading standard 12-lead ECGs**.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

**Nothing material shipped in this window.** Coverage Sep 29–30 is post-Connect follow-on and VR game releases, not platform or hardware news. Items seen and dismissed per the no-speculation rule:
- *Meta VR Glasses strap accessory for active VR gaming* — [Road to VR, Sep 29](https://roadtovr.com/) — reported plan, no product, no date. **Excluded: not shipped.**
- *Meta VR Glasses / Quest 3 / Steam Frame spec comparison* — [Road to VR, Sep 29](https://roadtovr.com/) — analysis of already-reported specs. **Excluded: not new.**
- *Tiny Flock* (No Brakes Games) shipped Sep 29 on Quest with hand-tracking + passthrough — [UploadVR](https://www.uploadvr.com/new-vr-games-releases-september-2026-quest-ps-vr2-pc-vr-more/). Game release, not platform capability; noted only as continued evidence the hand-tracked-title push from Connect is real.

### Spatial Computing / 3D

**Nothing material shipped in this window.** No new 3DGS/NeRF code drops, no world-model API movement, no 4D reconstruction releases dated Sep 28–30. Peripheral finds, both pre-window and flagged for completeness:
- **GSPrior — 3DGS with self-constrained priors for high-fidelity surface reconstruction (CVPR 2026)** — [GitHub](https://github.com/takeshie/GSPrior) — code is public. Static-scene surface reconstruction. **Why it matters:** incremental quality improvement to the static-3DGS toolchain we already use; does *not* address the dynamic/4D gap that gates `haptic-mirror-d4rt.md`.
- **Microsoft TRELLIS.2** — MIT-licensed image-to-3D / text-to-3D producing textured meshes, GLB/OBJ/PLY/PBR out to 4K — [overview](https://www.buildmvpfast.com/articles/best-llms-2026-guide/3d-modeling-ai). Not dated to this window and not confirmed from Microsoft's own channel in this run. **Treat as unverified pending a first-party check** — but if the MIT license and GLB/PBR output hold, it belongs in the MedSim asset pipeline evaluation alongside Hunyuan3D and Meshy, because MIT + local execution removes the license and per-asset-cost questions that constrain the `meshy`/`_hunyuan` tier convention. **Action: verify from Microsoft directly next run.**

### AI / ML

- **OpenAI DevDay 2026 — 25 announcements** — [BGR: everything announced](https://www.bgr.com/2272332/openai-devday-2026-announcements/) · [CNBC live recap](https://www.cnbc.com/2026/09/29/openai-devday-2026-live-updates.html) · [Axios: 5 biggest](https://www.axios.com/2026/09/29/openai-dev-day-2026-dots-space-sol) · [Unite.ai detail](https://www.unite.ai/openai-unveils-gpt-6-1-sol-at-devday-with-new-codex-and-chatgpt-tools/) · [9to5Mac](https://9to5mac.com/2026/09/29/openai-teases-20-announcements-at-devday-watch-live/). All rolled out Sep 29. The pieces that matter to us:
  - **GPT-6.1 Sol** — $2/M input, $10/M output; **cached input $0.10/M** (95% below standard input, half of GPT-6 Sol's cached rate); cache writes $2.50/M. Near-Astra intelligence on agentic coding + computer use at **one-fifth Astra's price**. API id `gpt-6.1-sol`. [Vellum benchmarks](https://www.vellum.ai/blog/gpt-6-1-sol-benchmarks-explained) · [DataCamp](https://www.datacamp.com/blog/gpt-6-1-sol) · [llm-stats](https://llm-stats.com/models/gpt-6.1-sol) · [Yahoo Finance on the pricing move](https://finance.yahoo.com/technology/ai/articles/openai-one-fifth-pricing-move-075503685.html). **Why it matters:** the $0.10/M cached-input rate is the real number. Any MedSim workload with a large stable prefix — physiology-graph context, drug catalog, protocol library, scenario state — is exactly the shape that rate is priced for. Worth a concrete cost comparison against our current Claude spend before committing new inference-heavy surfaces.
  - **Agents API** — computer use, multi-agent, tool calling, **context compaction** as a first-class API primitive. Also surfaced through **AWS Bedrock Managed Agents**. **Why it matters:** context compaction in the API is the piece we currently hand-roll. If MedSim ever needs a long-running NPC/preceptor agent, this is a shipped primitive rather than a build.
  - **Decisions API** — applies Luna to finite, pre-defined classification tasks. **Why it matters:** clean fit for bounded clinical classification (triage tier, rhythm label, protocol branch) where a general chat model is the wrong tool and an open-ended generation is a liability. Cheap eval candidate for the scenario engine.
  - **Ultrafast tier** — GPT-6 Astra Ultrafast at up to 8x faster in Codex, 6x in API (~300 tok/s), available now on Pro 500 and Enterprise; GPT-6.1 Sol Ultrafast "coming soon." **Why it matters:** 300 tok/s changes what's viable for real-time in-sim dialogue. Gated behind Pro 500, so not free to try.
  - **Dots** — always-on agents, each on GPT-6 Astra with its own cloud computer and browser, connected to 4k+ apps, running 24/7 toward assigned goals. Pro and Business Premium; Enterprise/Edu/Healthcare admin-enabled beta, **off by default**. **Why it matters:** this is a direct competitor to our own always-on droplet scout/agent pattern. Not a reason to change anything — our scouts run on a $-per-month droplet we control — but it's the commodity version of the same idea, and the "off by default in Healthcare" detail says OpenAI knows what the compliance question is.
  - **Codex** — cloud/remote/local execution, reusable team-shared dev environments, CLI with voice steering and an `/agents` delegation view, GitHub/GitLab code review in desktop, **Codex Security Cloud** for scheduled repo scanning.
  - **Plugin platform + MCP Events specification support** for automation triggers; plugin hosting on Business/Enterprise/Healthcare/Edu. **Why it matters:** MCP Events is the interoperability item — an eventing spec on top of MCP is relevant to any of our MCP surfaces that currently poll.
  - **OpenAI Private Intelligence** — Zero Data Retention with Private Safety Processing (automated safety, no personnel access) plus a **Private Inference preview using confidential computing (Fall 2026)**. **Why it matters — the most important DevDay item for MedCapture.** "Confidential computing + ZDR + no human review" is the exact posture a sim-lab or IRB asks about. Pairs with the gpt-oss local story as the two ends of the PHI-handling spectrum.
  - **OpenAI Marketplace** — launched with 32 partners (Adobe, Canva, Figma, Notion, Salesforce, Zendesk, HubSpot, ServiceNow). **Sign In with ChatGPT** — Plus/Pro allowance applied across 16 partners (Devin, Notion, Vercel, T3, others) with per-tool usage controls. **Pro 500** — 25x Plus allowance, Ultrafast access.
- **Anthropic Claude Sonnet 5.5** — Sep 28. [Anthropic](https://www.anthropic.com/claude-sonnet-5-5) · [VentureBeat](https://venturebeat.com/technology/anthropic-launches-claude-sonnet-5-5-with-30-cost-reduction-per-task-due-to-faster-speeds-and-fewer-tool-calls) · [SiliconANGLE](https://siliconangle.com/2026/09/28/anthropic-debuts-claude-sonnet-5-5-running-30-faster-than-the-previous-generation-ai-model/) · [Unite.ai](https://www.unite.ai/anthropic-releases-claude-sonnet-5-5-at-unchanged-sonnet-5-pricing/). **Pricing unchanged from Sonnet 5 at $2/M in, $10/M out**; >30% faster output and up to **30% lower cost per task** from fewer tool calls. Strong on document generation, summarization, spreadsheets, bug-fixing. Available on the Claude Platform as `claude-sonnet-5-5`, plus AWS, Google Cloud, Azure. **Why it matters:** the per-task saving comes from *fewer tool calls*, not a sticker cut — which is the metric that actually governs agentic build-loop cost. Sonnet 5.5 and GPT-6.1 Sol now sit at **identical list pricing** ($2/$10); the differentiator is OpenAI's $0.10/M cached input vs. Anthropic's prompt caching, so a real comparison has to be run on our own prefix shapes, not on list price.
- **OpenAI declined to release GPT-6.1 Astra** — Sep 28, citing safety concerns about "staying within scope and authorization." [BGR](https://www.bgr.com/2272332/openai-devday-2026-announcements/). **Why it matters:** a frontier lab publicly withholding a finished top-tier model on agentic-scope grounds, the day before shipping always-on agents, is a notable data point for how the deployed-agent risk conversation is going. No action.

### Hardware

**Nothing material shipped in this window.** No dev boards, edge modules, LiDAR, e-ink, or headset SKU/pricing changes dated Sep 28–30. Prior-window hardware context (Ouster REV8 color lidar May 2026, Seeed 13.3" Spectra 6 ePaper kit, Inkplate ESP32 ePaper boards, Aeva 4D lidar at CES 2026) is unchanged and already tracked.

### Medical / Clinical AI

- **Tempus ECG-MR — FDA clearance, Sep 28** — [Cardiovascular Business](https://cardiovascularbusiness.com/topics/clinical/interventional-cardiology/fda-clears-ai-tool-detecting-undiagnosed-heart-valve-disease-ecgs). AI that reads a **standard 12-lead resting ECG** for signs of undiagnosed **moderate-to-severe mitral regurgitation** and flags clinicians for follow-up imaging. Indicated for patients 65+ at cardiovascular risk. **Why it matters — the most MedSim-relevant item this window.** FDA has now cleared "structural heart disease inferred from a plain 12-lead" as a clinical claim. Two consequences for us: (1) it validates that the 12-lead is an information-dense enough substrate to carry non-electrical pathology, which is a real teaching point for the M15 monitor prop's 12-lead/STEMI module — we already run genuine PTB-XL 12-lead data, so a "what else is hiding in this tracing" scenario is authoritative-source-backed, not invented; (2) it's a concrete, citable example of clinical-AI-on-ECG for any MedSim content that discusses decision support. **Action: read the clearance summary before the next M15 12-lead content pass.**
- **CapsoVision AI Highlights — FDA clearance, Sep 25** — [announcement](https://www.minichart.com.sg/2026/09/28/capsovision-wins-fda-clearance-for-ai-highlights-reading-tool/) — AI-assisted reading for small-bowel capsule endoscopy (suspected small-bowel bleeding, patients 2y+). Cleared Sep 25, reported Sep 28. Just outside the window on clearance date, inside it on coverage. No direct project hit; logged for the clinical-AI clearance trendline.

---

## Nothing New (Watchlist)

- **Apple Foundation Models framework open-source** — [WWDC 2026 session 241](https://developer.apple.com/videos/play/wwdc2026/241/) · [DEV writeup](https://dev.to/arshtechpro/wwdc-2026-apple-just-opened-the-foundation-models-framework-to-any-llm-provider-5ejn). WWDC 2026 (June 9) committed to "later this summer." Summer is over. **Watchlist Week 17.** Still no drop confirmable from developer.apple.com. The [rits.shanghai.nyu.edu claim](https://rits.shanghai.nyu.edu/ai/apple-open-sources-its-foundation-models-framework-adds-claude-and-gemini/) that Apple *has* open-sourced (with Claude/Gemini integration, plus CoreAILanguageModel and MLXLanguageModel companions) resurfaced again this run and is **still unverified against Apple's own channels** — same status as last report. Do not treat as shipped.
- **Google DeepMind D4RT public code / weights** — [DeepMind blog](https://deepmind.google/blog/d4rt-teaching-ai-to-see-the-world-in-four-dimensions/). Announced Jan 2026. No code, weights, or API. **Blocker for `haptic-mirror-d4rt.md` remains open.**
- **Google DeepMind Genie 3 public API** — [Genie world model](https://en.wikipedia.org/wiki/Genie_(world_model)) · [Project Genie](https://en.wikipedia.org/wiki/Project_Genie_(website)). Still AI Ultra subscribers only, US, via Project Genie / Google Labs since Jan 29, 2026. **No API.** **Blocker for `ai-multiview-video-generator.md` path (a) remains open.**
- **World Labs Atlas public API** — [datanorth summary](https://datanorth.ai/news/world-labs-introduces-atlas-world-model) · [Kingy AI deep dive](https://kingy.ai/blog/world-labs-atlas-world-model-deep-dive/). Launched Sep 1. Confirmed this run: **early access with unnamed select partners, no research paper, no pricing, no model card, no GA date.** The early-access request form is still the only door. *Last report recommended submitting a request — that remains the open action item and there is no reason to wait on it.*
- **Snap Specs consumer shipping** — [VR.org enterprise-pitch analysis](https://vr.org/articles/snap-specs-enterprise-partners-verizon-cellular-2026) · [iDevice roadmap](https://idevice.com/smart-glasses/snap-spectacles/roadmap). **Resolved to "October":** units are expected to begin shipping October 2026 (US, UK, France), still $2,195 with a $200 refundable deposit, initial run ~100,000 units. **No consumer deliveries had occurred as of Sep 30.** Carry to next report.
- **Alibaba Qwen 4 weights** — roadmap-only as of Sep 22 Apsara. No movement.

---

## Project Impact

**MedSim-Game (flagship).**
- **Tempus ECG-MR is the actionable item.** FDA clearing "moderate-to-severe mitral regurgitation detected from a plain 12-lead" gives the M15 monitor prop's 12-lead module an authoritative, citable teaching hook — and we already drive that prop with real PTB-XL 12-lead data, so the scenario is buildable without fabricating anything. Read the clearance summary before the next 12-lead content pass.
- **Inference cost math is worth re-running, once.** GPT-6.1 Sol and Sonnet 5.5 now list at the same $2/$10. The difference is caching: OpenAI's $0.10/M cached input is aimed precisely at large stable prefixes, which is what the physiology graph, drug catalog, and protocol library are. This does not argue for switching the build loop — Sonnet 5.5's 30%-lower cost *per task* comes from fewer tool calls, which is the metric that governs agentic work. It argues for one concrete measurement on our own prefix shapes rather than more speculation.
- **Decisions API** is a cheap evaluation candidate for bounded scenario-engine classification (triage tier, rhythm label, protocol branch) — cases where open-ended generation is a liability rather than a feature.
- **No AR/spatial movement.** The Meta v207 SDK + XR Simulator opportunity and the **$1M hands-first competition (Sept 24 – Nov 18, winners Dec 11)** from last report are unchanged and unaddressed. That window is now **7 weeks from close** and is still the single most concrete platform bet on the board. Flagging the clock, not re-reporting the item.

**MedCapture.**
- **OpenAI Private Intelligence — ZDR + Private Safety Processing with no personnel access, plus a confidential-computing Private Inference preview in Fall 2026 — is the strongest PHI-posture story a hosted frontier model has offered.** Combined with the gpt-oss-20b local option from last report, MedCapture can now credibly answer both ends of the sim-lab/IRB question: fully local, or hosted-under-confidential-compute. Worth capturing in whatever compliance one-pager the pilot conversations need.
- **FDA generative-AI discussion paper comment window closes Oct 19, 2026** — 19 days out. Unchanged from last report; the clock is the news.

**BadgeMedia / Tenetrix Insight.** No direct-hit signals.

**haptic-mirror.** No movement. D4RT blocker unchanged; GSPrior is static-scene only and does not touch the dynamic-4D gap.

**3rdrider.** No movement in a 2-day window.

---

## Parked Idea Unblocks

**No parked ideas unblocked.**

Checked all 27 `blocked_on:` fields in `_ops/idea-vault/`. Explicit notes on the four where something plausibly moved and did not:

- **`ai-multiview-video-generator.md`** — blocker path (a) is a public multi-view/camera-path API. Confirmed again this run that Atlas is early-access-only (no paper, pricing, model card, or GA date) and Genie 3 is AI-Ultra-only with no API. **No change. WAIT** — but the Atlas early-access request recommended last week is still un-actioned and still costs nothing.
- **`haptic-mirror-d4rt.md`** — blocker is D4RT code, or equivalent open tooling that builds training scenarios from short video captures. GSPrior (CVPR 2026, code public) is static surface reconstruction, not dynamic 4D. **No change. WAIT.**
- **`runway-dev-portal-exploration.md`** — blocker is "time + worthiness of paid API credits — nothing technical." This window's frontier price cuts are LLM pricing, not Runway's, so the blocker is untouched. Noting explicitly because a price-cut window invites the wrong inference. **No change. WAIT.**
- **`swappable-shells-animated-screens.md`** / **`display-cube-six-screens.md`** — both gated on barad-dûr v2 shipping. No hardware news this window at all. **No change. WAIT.**

All remaining parked ideas are gated on internal milestones (MedCapture first paying pilot / first paper, MedSim scenario count, barad-dûr v2, role/licensure conditions) rather than on external technology, and nothing in a 2-day AI-platform window moves those.
