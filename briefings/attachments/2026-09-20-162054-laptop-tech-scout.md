# Tech Scout Report — 2026-09-20

**Window:** 2026-09-14 → 2026-09-20 (6 days).

## Gap Backfill

Last report was `scout-2026-09-14.md` — **6 days old**, so this run widened the search window to cover
the entire gap (2026-09-14 → 2026-09-20) rather than a 24–48h daily slice. Nothing in the gap is
left uncovered.

**Major event swept in window: Snap SPECS launch event, Sep 16, Los Angeles.** This was flagged T-2
in the last report and it happened — it is the single largest item below. **Meta Connect Sep 23–24
is T-3 and has NOT happened**; it is watchlist-only, not reported as shipped.

---

**Headline shifts — one major AR launch, one surprise hardware ship, a thin AI week.**

1. **Snap shipped the full SPECS launch on Sep 16 — the product is real, the price is still the wall.**
   $2,195, prescription-capable, standalone, genuinely see-through AR — and *still no firm ship date*
   beyond "later this fall." The enterprise partner list (Salesforce Agentforce, AWS, NVIDIA XR AI
   stack, Tandem by Trifork remote-expert) is the first time a consumer AR vendor has shipped a
   credible **remote-expert / worker-vision** story, which is structurally the same shape as a
   clinical preceptor surface.
2. **Valve shipped the Steam Frame on Sep 14 at $1,059 — and it had never appeared in any prior
   scout report.** Caught by the gap backfill. Not a portfolio-relevant surface, but it is the
   cheapest new standalone SteamOS XR device and it closes a hole in the hardware ledger.
3. **AI/ML was genuinely thin: zero major-lab model releases in the seven days ending Sep 19.**
   The one item that matters is **Qwen3.8-Omni-Flash** (Sep 18) — 1M-context native omnimodal with a
   >90% cut to audio-visual input cost. That is the cheapest path yet to machine-scoring a video of a
   learner performing a skill. API-only, Alibaba-hosted, no open weights.
4. **Claude Code shipped 8 releases in-window (v2.1.271 → v2.1.278)**, including **AGENTS.md support**
   in v2.1.277.
5. **Grok 4.7's Sep 18 window closed with nothing shipped.** Grok 4.8 (2.5T, C++ stack) still training.
6. **Watchlist decay continues:** Meta Muse Spark 1.2 open weights **Day 48+**; Apple Foundation
   Models open-source **Week 15 past-due**; DeepMind D4RT **Week 20**, verified stale at the repo level.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Snap SPECS — full launch event, Sep 16, Los Angeles (THE in-window event).**
  [Snap Newsroom](https://newsroom.snap.com/specs-launch-date) ·
  [Engadget live blog](https://www.engadget.com/2260114/snap-specs-launch-live-blog-evan-spiegel-keynote/) ·
  [Auganix](https://www.auganix.org/ar-news-snap-showcases-specs-ar-glasses/) ·
  [Spatial Insider full recap](https://spatialinsiders.com/stories/snap-specs-launch-highlights-september-2026) ·
  [AR Insider](https://arinsider.co/2026/09/17/specs-launch-in-la-with-an-ai-twist/) ·
  [FourWeekMBA on the enterprise runtime angle](https://fourweekmba.com/ai-snap-specs-intelligence-enterprise-partners/)

  **Hardware (confirmed at event):** standalone computer in the glasses — no puck, no tether.
  51° FOV transparent waveguide, adaptive tint, **two Snapdragon processors**, hand + voice control,
  **132 g** (47 mm narrow) / **136 g** (52 mm wide), Swiss TR90 polymer,
  **removable prescription inserts supporting a wide range of prescriptions**.
  4 hours mixed-use battery.

  **SPECS Intelligence** — Snap's "anticipatory AI service." Connects your chosen apps and proactively
  surfaces next actions; organized around **"Corners"** (life areas) and **"Goals"** (long-term
  priorities). Object ID, routing, flight-detail alerts. **iPhone preview available NOW** (Gmail +
  Google Calendar only, US adults 18+); **Mac version invitation-only with a waitlist**. Snap states
  connected personal content **will not train its AI models or serve personalized ads**.

  **Enterprise partners (the portfolio-relevant part):** **Salesforce Agentforce** (workflow
  automation), **AWS** (retail-staff integration), **NVIDIA XR AI stack** (connects *worker vision*
  with *company data*), **Tandem by Trifork** (remote-expert connection), **Hololight** (spatial
  workstation tools).

  **Consumer:** Connected Lenses shared-space AR games (Dominoes w/ Jimmy Butler, chess, table tennis,
  Core Boom, Battleship, SmashAR); virtual screen ≈115" at 10 ft streaming YouTube / HBO Max / Spotify;
  Harry Potter, Star Map, Apollo 11 experiences; NBA/WNBA virtual training; **60-language translation**;
  Tripadvisor; Shopify; walking directions; hands-free calls.

  **Pricing / availability:** **$2,195** preorder with $200 refundable deposit ($1,995 on ship).
  **Charging Case with Cellular — $2,395**, US Verizon-exclusive, adds 5G. Verizon Connected Wearable
  plans **$10/mo** (existing customers) / **$20/mo** (non-customers); 36-month financing.
  International carriers: **Orange (France)**, **EE (UK)**.
  **Ships "later this fall" in US / UK / France — still no specific date announced.**
  **"SPECS First Look" public demo opens Oct 1** at Westfield Century City, LA.
  ALO Wellness Club experiences slated 2027.

  **Why it matters to us:** two things. (1) The **Tandem remote-expert** product and NVIDIA's
  "worker vision + company data" framing are the exact architecture a clinical preceptor / remote-
  proctor surface would need — a vendor has now shipped that pattern, so it no longer has to be
  invented. (2) At **$2,195 + no ship date**, this is not a learner-facing surface for MedSim and
  will not be one in this fiscal year. Track the pattern, not the device.

- **Valve Steam Frame — LAUNCHED Sep 14 (new to this ledger; never covered in any prior scout report).**
  [VR.org release date](https://vr.org/steam-frame-release-date) ·
  [Dexerto](https://www.dexerto.com/gaming/valve-reveals-steam-frame-price-and-release-date-starting-at-1059-3408909/) ·
  [SteamDeckHQ](https://steamdeckhq.com/news/the-steam-frame-officially-launches-available-from-1059/)
  **$1,059 (256 GB) / $1,299 (1 TB)**, Snapdragon 8 Gen 3, 16 GB LPDDR5X, wireless streaming-first
  SteamOS headset. Kit includes Steam Frame Controllers, Wi-Fi 6E PC-streaming adapter, and
  *Half-Life: Alyx*; **power supply sold separately at $29**. Distribution by **randomized reservation
  lottery** — signups closed **Sep 17, 10:00 AM PT**; first purchase invitations went out **Sep 18**,
  so actual delivery varies per buyer. Not portfolio-relevant as a target surface; logged to close
  the ledger gap.

- **No other AR/glasses hardware shipped in-window.** RayNeo iO + GT + GT Max shipped **Sep 4**
  (pre-window, already covered). XREAL Aura still "fall 2026" with no date and two of three
  reservation tiers sold out. Rokid: nothing in-window.

- **Meta Connect 2026 — Sep 23–24, Menlo Park (T-3, NOT YET HAPPENED).**
  [Engadget preview](https://www.engadget.com/2262932/what-to-expect-at-meta-connect-2026-new-ai-glasses-a-mixed-reality-headset-and-more/) ·
  [VR.org](https://vr.org/meta-connect-2026) ·
  [TechRadar](https://www.techradar.com/computing/virtual-reality-augmented-reality/7-things-to-expect-at-meta-connect-2026-from-camera-less-smart-glasses-to-meta-ray-ban-glasses-updates)
  Zuckerberg keynote **Sep 23, 4:00 PM PT**. **Confirmed developer sessions:** "Building web apps for
  Meta Ray-Ban Display", "Wearables Device Access Toolkit", "Building for AI glasses", "The multimodal
  intelligence of Muse Spark". Rumored (NOT confirmed, not reportable): Ray-Ban Meta Gen 3, a premium
  model codenamed "Phoenix" at $1,000–2,000, Ray-Ban Display international expansion, Hologram Calling.
  **This is the decision point for the 3rdrider blocker — see Parked Idea Unblocks.**

### Spatial Computing / 3D

- **Nothing shipped in-window.** Reported as a null result, not padded.
- **DeepMind D4RT — Week 20 on watch, verified stale at the repo level this run.** Official code still
  unreleased. Community reimplementations checked directly via the GitHub API:
  [`lucidrains/d4rt`](https://github.com/lucidrains/d4rt) — created 2026-05-10, **last push
  2026-06-20**, 74 stars, **zero commits in-window, no tags, no releases**;
  [`MasahiroOgawa/D4RT_MasImpl`](https://github.com/MasahiroOgawa/D4RT_MasImpl) — **last push
  2026-04-12**, 9 stars. Neither is a usable substitute and neither moved.
  [DeepMind D4RT blog](https://deepmind.google/blog/d4rt-teaching-ai-to-see-the-world-in-four-dimensions/)
- **Genie 3 — no tier change.** Still no public developer API; access remains Project Genie for
  **Google AI Ultra subscribers, US, 18+**. [Genie 3](https://deepmind.google/models/genie/)
- **Gaussian Splatting — no new in-window code drops.** Prior-covered work unchanged
  (FastGS, VolSplat, Mobile-GS from March, HTGS).

### AI / ML

- **Qwen3.8-Omni-Flash — Alibaba, Sep 18. The one AI release in-window that matters to us.**
  [TechNode](https://technode.com/2026/09/18/alibabas-qwen-releases-qwen3-8-omni-flash-with-1m-token-context/) ·
  [MarkTechPost](https://www.marktechpost.com/2026/09/18/alibaba-qwen-releases-qwen3-8-omni-flash/) ·
  [Neowin](https://www.neowin.net/news/alibabas-qwen38-omni-flash-undercuts-gemini-on-audio/) ·
  [Pandaily](https://pandaily.com/qwen3-8-omni-flash-native-omni-model)
  Native omnimodal — text, image, **audio and video** in one workflow. **1M-token context.**
  Live on **QwenCloud, Alibaba Cloud Model Studio, Qwen Studio**. Pricing **¥0.8 / 1M input tokens,
  ¥2.7 / 1M output**. Claims **>90% reduction in audio-visual input cost** and **+26% average across
  30 evaluations** vs Qwen3.5-Omni-Plus; gains in audio-video agents, coding, long-context, real-time
  multimodal. Optimized for long-horizon agentic workflows such as video post-production.
  **No open weights at launch — self-hosting is not an option.**
- **PrismML Ternary Bonsai 2 27B — Sep 17, Apache 2.0 open weights.** Ternary-weight compression of
  Qwen 3.8 27B. *Confidence note: surfaced from a single release-tracker aggregator and not
  independently corroborated this run — treat the details as provisional.*
  [Release tracker](https://www.digitalapplied.com/blog/ai-model-releases-september-2026-tracker)
- **TypeSafe AI Jev 1.13 — Sep 15, early access via waitlist.** "System One" model returning typed
  decisions with probabilities. Low relevance; logged for completeness.
- **Claude Code — 8 releases in-window, v2.1.271 → v2.1.278.**
  [Official changelog](https://code.claude.com/docs/en/changelog)
  - **v2.1.278 (Sep 19)** — auto mode on Claude API/Enterprise, Bedrock, Vertex, Foundry and gateways
    now defaults to the **server-side classifier, which does not charge for classifier overhead**;
    new `Auto mode server` row in `/status`.
  - **v2.1.277 (Sep 18)** — **AGENTS.md support: in a project with no CLAUDE.md, Claude Code reads
    AGENTS.md instead.** Plus `CLAUDE_GATEWAY_PROXY_IS_EGRESS_BOUNDARY=1`, optional `headers:` map on
    gateway upstreams, and a large bug-fix batch (empty-text-block failures, unexpected logouts,
    plugin install).
  - **v2.1.276 (Sep 18)** — hotfix for every request failing with `400 … Input tag 'advisor_20260301'`
    behind a proxy/gateway (a 2.1.275 regression).
  - **v2.1.275 (Sep 17)** — **syncs skills and plugins enabled on the claude.ai account into terminal
    sessions**; send-now key (`ctrl+enter`) that interrupts the turn and flushes queued messages.
  - **v2.1.274 (Sep 17)** — `CLAUDE_CODE_MCP_STARTUP_WAIT_MS` to bound MCP connection wait; critical
    memory-usage warning; `effort` attribute on OTel spans.
  - **v2.1.273 (Sep 15)** — new LLM-gateway request headers; **notification when MCP servers
    disconnect mid-session**.
  - **v2.1.272 (Sep 15)** — bug fixes.
  - **v2.1.271 (Sep 14)** — **fast mode in Claude Code Remote sessions** (cloud + self-hosted runners);
    `--drain-marker-file` for self-hosted runner drain reporting; **per-command `allowed_domains` on
    Bash, PowerShell and Monitor in auto mode with sandboxing**; mouse support in `/config`.
- **Grok 4.7 — the Sep 18 window closed with no ship.**
  [orcarouter on the closed window](https://www.orcarouter.ai/blog/grok-4-7-release-date) ·
  [CellCog Grok 4.8 tracker](https://cellcog.ai/blog/grok-4-8-release-date/)
  Grok 4.8 (named Sep 13 as "a 2.5T model trained with our new C++ software stack") remains in
  training with **no model page, API identifier, pricing, context window, or benchmarks**.
  xAI has now shipped nothing across multiple consecutive scout windows.
- **Aggregate trackers record zero major-lab model releases in the seven days ending Sep 19, 2026.**
  [llm-stats](https://llm-stats.com/ai-news) · [AI release tracker](https://aireleasetracker.com/latest)
  Most recent tracked major release remains DeepSeek-V4.1-Flash (Sep 10, covered last report).
  **Per the daily-cadence rule, this thin result is the correct output, not a failed run.**

### Hardware

- **Valve Steam Frame, $1,059 / $1,299 — Sep 14.** See AR / Smart Glasses above.
- **Nothing else in-window** across dev boards, edge-compute modules, LiDAR sensors, or e-ink
  (no new Onyx Boox SKUs). Null result.

### Medical / Clinical AI

- **Nothing shipped in-window.** No new FDA clearances, model releases, or clinical-AI APIs in the
  gap window. Prior clearances stand unchanged: **UpDoc V1.0** (K253281, cleared 2025-12-23,
  announced Jun 25 2026 — insulin management, type 2 diabetes), **GE HealthCare MIM Contour
  ProtégéAI+ 2.0** (Jun 4, radiation-oncology auto-contouring), **Aidoc** foundation-model triage.
  The **FDA's January 2026 updated CDS guidance** remains the governing document.
  [ACR on the guidance update](https://www.acr.org/News-and-Publications/2026/fda-updates-guidance-on-clinical-decision-support) ·
  [FDA AI device tracker](https://intuitionlabs.ai/articles/fda-ai-medical-device-tracker)
- **Adjacent signal worth one line:** Snap's enterprise partner **Tandem by Trifork** ships
  remote-expert connection on SPECS. Not clinical, but it is the telepresence-proctor pattern
  arriving on consumer AR hardware.

### Governance / Structural

- **Meta Muse Spark 1.2 open weights — Day 48+, still unreleased.** Zuckerberg's open-weight pledge
  (Aug 10 → Aug 20 → Sep 2, all missed) has produced nothing. **Muse Glimmer** (30B, Apache 2.0,
  Aug 10) remains Meta's only actual open drop; **Muse Spark 1.3** (Sep 2) shipped closed with a
  contributor tier.
  [CNBC](https://www.cnbc.com/2026/09/06/meta-google-openai-anthropic-ai-model-fatigue.html) ·
  [Constellation Research](https://www.constellationr.com/insights/news/meta-releases-open-weight-muse-glimmer-model-open-muse-spark-12-tap) ·
  [AI News](https://www.artificialintelligence-news.com/news/meta-muse-spark-ai-model-open-source/)
  The asymmetry noted last report holds: Chinese labs (DeepSeek, Qwen, GLM) keep shipping on
  schedule while Meta's open-source posture degrades.
- **Apple Foundation Models framework open-source — Watchlist Week 15, formally past-due.**
  WWDC 2026 (Jun 9) committed to "later this summer"; summer is over. `CoreAILanguageModel` and
  `MLXLanguageModel` remain unreleased.
  [WWDC26 session 241](https://developer.apple.com/videos/play/wwdc2026/241/)

---

## Nothing New (Watchlist)

| Item | Status this run |
|---|---|
| **Apple Foundation Models open-source** | **Week 15 — past-due.** "Later this summer 2026" has expired. `CoreAILanguageModel` + `MLXLanguageModel` unreleased. |
| **Meta Muse Spark 1.2 open weights** | **Day 48+.** No release. Three missed self-imposed dates. |
| **DeepMind D4RT code** | **Week 20.** Verified stale via GitHub API — community repos last pushed Jun 20 / Apr 12, zero in-window commits. |
| **Genie 3 developer API** | No change. Google AI Ultra only, US, 18+. No public API, no multi-view export. |
| **Gemini 3.5 Pro** | **Week 19+.** No `gemini-3.5-pro` endpoint. (Note: Gemini **3.8 Flash** shipped Sep 2 — a different line.) |
| **Grok 4.7 / 4.8** | 4.7's Sep 18 window closed unshipped; 4.8 named but still training, no specs or pricing. |
| **Tencent WorldClaw** | No code drop. Repo still README-only. |
| **Meta Ray-Ban Display firmware** | No release beyond v128. Canonical release-notes page unchanged since Jun 29. |
| **XREAL Aura** | Still "fall 2026," no date, no new SDK. Two of three reservation tiers sold out. |
| **Cursor / OpenAI Nov 12 cutoff** | No escalation. **53 days remaining.** |
| **Meta Connect** | **T-3 (Sep 23–24).** Not yet happened. Highest-value event on the near calendar. |

---

## Project Impact

- **MedSim-Game (flagship).** Two impacts, neither urgent.
  1. **Qwen3.8-Omni-Flash's >90% audio-visual input cost cut + 1M context** is the cheapest path yet
     to machine-scoring *video of a learner performing a skill* — directly relevant to the learner-
     assessment substrate. **But it is API-only and Alibaba-hosted, so it is a non-starter for
     anything touching PHI or real learner recordings.** Log as a capability datapoint; the
     architecture-of-record path for clinical data remains Anthropic WIF + self-hosted sandbox.
  2. **Snap SPECS is now a shipping consumer AR platform with prescription support and a real
     publishing model** — but at **$2,195 with no ship date**, it is not a learner surface. The
     reusable insight is the **remote-expert pattern** (Tandem by Trifork, NVIDIA worker-vision +
     company-data): that is the shape of a remote preceptor/proctor feature, and a vendor has now
     validated it. **No action; pattern noted.**
- **Claude Code / dev tooling.**
  - **v2.1.277 AGENTS.md support** changes nothing operationally here — every portfolio project uses
    `CLAUDE.md`, which still takes precedence. It is relevant only if the `migrating-agents-md-to-
    control-flow` workflow is ever applied to an external repo.
  - **v2.1.271's per-command `allowed_domains` on Bash/PowerShell/Monitor in auto mode** is the most
    useful item for the always-on automation tier — it tightens what the droplet's scout jobs can
    reach without relying on blanket permissions.
  - **v2.1.273's mid-session MCP disconnect notification** and **v2.1.274's
    `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`** are directly useful given how many MCP servers this
    portfolio runs.
  - **v2.1.275 syncing claude.ai-enabled skills/plugins into terminal sessions** means account-level
    skill changes now land in terminal sessions without local config edits.
- **3rdrider (parked, AR glasses).** The most movement of any parked project this window — but the
  price gate is not cleared and the decision point is 3 days out. See below.
- **haptic-mirror (parked).** No movement. D4RT verified stale at the repo level.
- **Operational note (not a news item):** the **`lens-studio` MCP server failed to connect this
  session** (`ConnectionRefused`) because Lens Studio is not running locally. Any 3rdrider Lens work
  requires launching Lens Studio first, then Claude Code from the project directory. Separately,
  **`linear` / `linear-server` and the claude.ai Notion/Idiolect connectors are unauthorized** in
  this session — so no Linear issues were filed for anything above; that needs an interactive
  session to authorize.

---

## Parked Idea Unblocks

- **Idea:** Resume 3rdrider when consumer-grade AR glasses ship at viable price/form
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** *"Consumer AR glasses with prescription compatibility, on-device camera+mic+display,
    and developer SDK shipping at <$800"*
  - **What changed:** Snap SPECS fully launched Sep 16 and **satisfies three of the four criteria** —
    prescription compatibility (removable inserts, wide prescription range), on-device camera + mic +
    see-through display with no tether, and a mature developer SDK (Snap OS, Lens Studio, SIK, UI Kit,
    SyncKit, NDK, Commerce Kit). **It fails the price criterion decisively at $2,195 — 2.7× the $800
    gate — and still has no announced ship date.** Meanwhile **Meta Ray-Ban Display already sits
    exactly at the $799 gate** with camera + mic + display, prescription via LensCrafters, and a
    developer preview plus the Wearables Device Access Toolkit — but it is a **monocular HUD, not
    spatial AR**, and its international rollout was paused in Jan 2026 on inventory limits.
  - **Recommended action:** **WAIT — 3 days, explicitly.** Do not reopen 3rdrider on the Snap launch;
    the price gate written into this blocker exists for a reason and $2,195 does not clear it.
    **Meta Connect (Sep 23–24) is the event most likely to satisfy or definitively refute this
    blocker in a single keynote** — it has confirmed sessions on the *Wearables Device Access Toolkit*
    and *Building web apps for Meta Ray-Ban Display*, plus credible reporting of a Ray-Ban Gen 3 and
    a $1,000–2,000 "Phoenix" tier. **Re-evaluate this blocker in the Sep 24 or Sep 25 report with
    Connect's actual announcements in hand.** If Connect ships a sub-$800 device with a real
    app SDK, this moves to PROMOTE; if it ships only a $1,000+ tier, this stays parked with the
    gate intact.

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world
    reconstruction tooling that lets you generate training scenarios from short video captures"*
  - **What changed:** **Nothing — and this was verified directly rather than assumed.** Official D4RT
    code remains unreleased (Week 20). Both community reimplementations were checked via the GitHub
    API this run: `lucidrains/d4rt` last pushed **2026-06-20** with **zero in-window commits and no
    tags or releases**; `MasahiroOgawa/D4RT_MasImpl` last pushed **2026-04-12**. Neither is a usable
    equivalent.
  - **Recommended action:** **WAIT.** Blocker fully intact.

- **Idea:** AI video / scene generator with synchronized 6-direction output
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** *"(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a
    public API feature … (b) build it from existing 3D primitives … requires the display-cube-six-screens
    project to exist first"*
  - **What changed:** **Nothing on path (a).** Genie 3 still has no public developer API and no
    multi-view export; access remains Google AI Ultra-only, US, 18+. Path (b) is unchanged and still
    gated on `display-cube-six-screens`, which is itself gated on barad-dûr v2.
  - **Recommended action:** **WAIT.** Both paths still blocked.

**No parked ideas were unblocked this window.** One (3rdrider) moved materially closer and has a
hard re-evaluation date of Sep 24–25, immediately after Meta Connect.
