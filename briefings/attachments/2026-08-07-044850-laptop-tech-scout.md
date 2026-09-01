# Tech Scout Report — 2026-08-07

**Window:** 2026-08-06 → now (normal 24h daily cadence). Prior report: `scout-2026-08-06.md`.

## Verdict

**One real in-window release, and it lands directly on the flagship.** Plus a vendor this scout has
never once mentioned that turns out to be the most agent-native tool in its own focus area, and a
correction to yesterday's own reasoning that flips a parked idea's recommendation.

1. **Anthropic shipped a Fable 5 biology-safeguards update today (Aug 7), live now** — biology-related
   fallbacks down **~85%**, with lab-result interpretation, symptom explanation, and *clinical task
   support for healthcare professionals* named explicitly. This is the first item in weeks that
   touches MedSim-Game's actual content pipeline. **Read the per-surface numbers before celebrating:
   the API surface moved ~7%.**
2. **SpAitial (Echo world models) has zero hits across every scout report ever written** — and it ships
   a **hosted MCP server** with a documented `claude mcp add` one-liner, an installable agent skill,
   **published per-world pricing ($1.60 / $8.00)**, and SPZ/PLY/SOG/collision-mesh export. Verified on
   vendor docs, not on a summary. Out-of-window (Echo-2: April 28), reported as backfill.
3. **Yesterday's report asserted Marble "is a *generative* world model, not reconstruction from your
   own video capture." That is wrong.** Marble documents a video→world path whose own troubleshooting
   text says the model *"reconstructs a static scene."* This reopens `haptic-mirror-d4rt.md`, which
   was dismissed on that exact basis 24 hours ago.

Also: yesterday's residual pricing question on World Labs is **closed**, and Agent Plugins went
**74 → 354 stars in one day** while still carrying **zero release tags**.

---

## Breakthroughs & Releases Since Last Report

### AI / ML

- **Anthropic — "Improving Fable 5's biology safeguards," shipped 2026-08-07, live now.**
  [anthropic.com/news/improving-fable-5-s-biology-safeguards](https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards)
  - **What changed:** the biology safety classifier's constitution was rewritten over several weeks to
    carve out benign uses in detail, reviewed by internal and external experts, then retrained and
    verified. The classifier is a smaller automated model that detects safeguarded biology tasks; the
    failure mode it was producing was **fallbacks** — silently switching the user to a less capable
    model mid-conversation.
  - **Result: ~85% reduction in biology-related fallbacks** across product surfaces.
  - **Per-surface overall fallback reduction — this is the part that matters here:**

    | Surface | Reduction |
    |---|---|
    | Claude.ai | ~67% |
    | Cowork | ~55% |
    | Claude Code | ~17% |
    | **Claude Platform (API)** | **~7%** |

  - **Named as now-supported:** interpreting lab results, understanding symptoms, educational biology,
    and **clinical task support for healthcare professionals**.
  - **Still blocked:** dual-use **virology, toxicology, and molecular design**, and dual-use
    professional biology / drug-development queries — those are routed to "trusted access pathways for
    frontier biology capabilities," which this portfolio has no part in.
  - **Scope caveat, stated plainly:** this is a **Fable 5** change. MedSim-Game's clinical content runs
    on Claude via the **API**, which is the surface that moved **least (~7%)**, and the post does not
    claim the change extends to Opus 5. Treat this as a real but bounded improvement, not a new
    capability. See *Project Impact*.

- **Agent Plugins — no new artifact, but sharp adoption movement.**
  `agentplugins/agent-plugins-spec` went from **74 stars (08-06) to 354 stars (08-07)** — 4.8× in 24
  hours. **Still zero release tags and zero git tags.** The only commits since the announcement are
  documentation (`Describe Agent Plugins as an open standard`, terminology cleanup, merged 08-06
  15:26Z). Attention is real; a tagged artifact is not. Watch posture unchanged: **the trigger is a
  client shipping a *reader*, not more stars.**

- **OpenAI — nothing new.** `developers.openai.com/api/docs/changelog` newest entry is still
  **Aug 5** (Fast mode long-context for GPT-5.6). Aug 4 usage-by-API-key below it. Both already
  reported.
- **Google Developers Blog — nothing new.** Newest is still **Aug 6** (Agent Plugins), then Aug 5
  ("Scaling AI Agent Infrastructure with the MCP Stateless updates") and Aug 4 (unified model-routing
  API). All three already on record.
- **No model releases on Aug 6 or Aug 7.** `llm-stats.com/llm-updates` newest dated entries remain
  **Qwen3.8 Max (Aug 2)**, **DeepSeek-V4-Flash-0731 (Jul 31)**, **Claude Opus 5 (Jul 24)**. Third
  consecutive run confirming an empty model calendar.
- **MCP spec — no change.** `blog.modelcontextprotocol.io` post list unchanged: **2026-07-28
  Specification** (Jul 28), beta SDKs (Jun 29), Enterprise-Managed Authorization (Jun 18). The
  per-run spec-blog check added yesterday returned a clean negative in one fetch, as intended.

### Spatial Computing / 3D

- **No new release across any tracked repo.**

  | Repo | Latest release | Last push |
  |---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-08-05 (0 commits in window) |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | **2026-08-07** |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | 2026-08-05 |
  | `nerficg-project/faster-gaussian-splatting` | never (push-monitored) | 2026-07-11 |
  | `Project-MONAI/MONAI` | 1.6.0 — 2026-06-11 | **2026-08-07** |
  | `agentplugins/agent-plugins-spec` | **none (0 tags)** | 2026-08-06 |

  LichtFeld-Studio: **seven consecutive days of commits without a release**, and today's are
  substantive rendering work — `Compute Vulkan barriers instead of hand-writing them`, `Pool viewport
  render targets`, `End the remaining per-frame CPU waits on the GPU`. v0.5.3 is now **seven weeks
  old**. Commits are still not releases, but this is a real performance push, not churn.
- **Gaussian splatting sweep returned nothing dated in-window.** The Gaussian Splatting Newsletter's
  most recent issue is still **"Gaussian Splatting in June 2026" (posted Jul 1)** — the July issue,
  normally posted in the first days of the month, **has not appeared**. Noting it so a future run does
  not read its eventual arrival as new news.

### AR / Smart Glasses

- **Nothing shipped.** Both per-run diffs returned clean negatives:
  - **Lens Studio: 5.23.1 (Aug 5) — unchanged.** SPECS 27 track; Spectacles (2024) still pinned at
    **5.15.4**. [ar.snap.com/download](https://ar.snap.com/download)
  - **Snap newsroom: unchanged.** Newest headline is still **July 31** ("Rewarding Authentic
    Creativity on Spotlight"); SPECS launch post still **July 30**; **September 16, Los Angeles**
    unchanged. [newsroom.snap.com](https://newsroom.snap.com/)
- **Android XR / XREAL sweep returned only May I/O material** — Project Aura (FHD, 70° FOV, X1S
  spatial chip, wired, "before the end of 2026"), Catalyst first cohort **1,000 dev kits shipping
  "summer 2026."** Applications closed **June 30** and were not submitted; no second-cohort
  announcement. Unchanged, and rejected under the no-roadmap rule.

### Hardware

- **Nothing.** No e-ink movement. **Onyx Boox Picco** logged for the **fourth consecutive run** as a
  July announcement with **price and release date still undisclosed** — not a release. Everything else
  returned (Palma 3, Go refresh, Android 16, Tab X C / Note Air 6) is expectation, not product.
- Modos unchanged: Paper Monitor 13" $599 in stock, 6" dev kit $199; Modos Flow still Dec 10, 2026.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all seven repos is
  **`i4h-workflows` at 2026-07-28T17:24Z** — **eighth identical reading.** `Cosmos-H-Dreams`
  unchanged at 2026-07-27.
- **MONAI: no new release.** Still 1.6.0 (2026-06-11); pushed 2026-08-07, commits only.
- The Anthropic Fable 5 item above is the only clinically-relevant thing that moved this run, and it
  is a safety-classifier change, not a medical tool.

---

## Backfill: SpAitial — a world-model vendor missed by every prior run

`grep -il "spaitial"` across **all** `scout-*.md` returns **zero files**. Same for `triposplat` and
`houdini 22`. SpAitial surfaced accidentally during a splat sweep, was **not** taken on the strength
of the summary that surfaced it, and was verified page-by-page against the vendor's own docs
(`spaitial.ai` 403s WebFetch; the §5 `curl` + browser-UA fallback returned 200).

**What it is.** A frontier lab shipping **Echo**, a physically-grounded world-model family that
outputs persistent, real-time-explorable 3D Gaussian-splat worlds from **text, image, or 360°
panorama**. [spaitial.ai](https://spaitial.ai/) · [docs.spaitial.ai](https://docs.spaitial.ai/)

- **Echo-2 shipped 2026-04-28** ([blog/echo-2-release](https://spaitial.ai/blog/echo-2-release));
  Echo-1 on 2025-12-15. Both **out of window** — this is backfill, not a new release.
- **Export: SPZ, PLY, SOG, collision meshes.** Open, universally-readable formats — same posture as
  Marble, plus SOG.
- **Public REST API** at `api.spaitial.ai` — create/edit/export/download worlds, async job model,
  panorama editing, file upload, scoped keys (`spt_live_` / `spt_test_`).

**The part that makes it different from World Labs — it is built for agents, and specifically for the
clients running in this portfolio.**

- **Hosted remote MCP server: `https://mcp.spaitial.ai/mcp`**
  ([docs](https://docs.spaitial.ai/api/mcp-server)). **Stateless, streamable-HTTP** — i.e. the
  2026-07-28 spec revision this scout only learned about yesterday, already deployed in production by
  a vendor. Every tool maps 1:1 onto the REST API, so an agent can prompt → generate → poll →
  download a splat or mesh with no glue code.
- **BYOK.** The server holds no credentials; each request carries your own key
  (`X-Spaitial-Api-Key` or `Authorization: Bearer spt_...`), and generations bill to your account.
  Keyless requests return 401.
- **Documented install for Claude Code, verbatim:**
  ```
  claude mcp add --transport http spaitial https://mcp.spaitial.ai/mcp \
    --header "X-Spaitial-Api-Key: spt_live_YOUR_KEY"
  ```
  Cursor, VS Code, Codex, opencode, and Claude Desktop are documented alongside it.
- **MCP Server Card discovery** at `mcp.spaitial.ai/.well-known/mcp/server-card.json`.
- **Installable agent skill:** `npx skills add spaitial-dev/spaitial-api-skill`, plus a single-page
  `llm-skills` reference designed to be dropped into a prompt or skill manifest.

**Published pricing — a hard number, which is rare.** ([credits-billing](https://docs.spaitial.ai/api/credits-billing))

| | Echo 2 — Standard | Echo 2 (HQ) |
|---|---|---|
| Credits | 160 | 800 |
| **Cost at $0.01/credit** | **$1.60/world** | **$8.00/world** |
| Typical time | ~8 min | ~60 min |

Plans: Free = 1,600 credits once (**explicitly "does not work with API"**); Standard 2,400/mo
(15 Standard worlds); Pro 4,800/mo (30). Reads, polling, downloads, and exports **do not** consume
generation credits. Credit purchases are self-serve and shared between app and API; free *daily*
credit never applies to API calls.

**Reality check on the repos.** `spaitial-dev/spaitial-api-skill` — created 2026-05-28, last pushed
2026-07-08, **0 stars**. `worldlabsai/marble-developer-api-skill` — created 2026-05-29, pushed
2026-06-03, **0 stars**. Both vendors shipped agent-integration surfaces that essentially nobody has
noticed. That is the opposite of the Agent Plugins situation (354 stars, zero artifacts).

---

## Corrections

**1. Yesterday's dismissal of Marble for haptic-mirror was wrong.**

`scout-2026-08-06.md` states Marble "is a *generative* world model, not reconstruction from your own
video capture, so it does not satisfy that blocker." Marble's own video-prompt guide contradicts this
([docs.worldlabs.ai/marble/create/prompt-guides/video-prompt](https://docs.worldlabs.ai/marble/create/prompt-guides/video-prompt)):

- *"Upload short videos to create immersive 3D worlds with rich spatial information. Videos provide
  multiple perspectives of your space, allowing the AI to understand depth and spatial relationships."*
- Capture guidance is photogrammetry guidance: **180°–360° coverage, one continuous take, fixed focal
  length, fixed exposure, steady motion**.
- Troubleshooting: *"Keep the space static — the model **reconstructs** a static scene best"*;
  *"Zooms and auto-exposure shifts during the take confuse **depth estimation**."*
- Output: 2M-splat SPZ or PLY.

That is **short video capture of a real space → navigable splat scene → portable export**, which is
verbatim the haptic-mirror pipeline. It changes that vault entry's recommendation — see *Parked Idea
Unblocks*.

**2. Yesterday's residual World Labs pricing question is closed.**
[docs.worldlabs.ai/api/pricing](https://docs.worldlabs.ai/api/pricing): **$1.00 per 1,250 credits**,
**minimum purchase 6,250 credits / $5.00**, credits **do not expire**, auto-refill available.
**Critical gotcha:** API billing is entirely separate from the Marble web app — *credits bought at
`marble.worldlabs.ai` CANNOT be used with the API*; API credits must be bought at
`platform.worldlabs.ai`.

**World Labs does not publish a per-generation price.** Cost is returned per-operation as
`cost.total_credits`, settled only on successful completion, and appears nowhere in the docs as a
table. **SpAitial publishes $1.60 / $8.00 up front.** For scoping a budget without spending money
first, that difference is the whole ballgame.

**3. World Labs has an agent skill but no MCP server.**
`npx skills add worldlabsai/marble-developer-api-skill` exists
([docs](https://docs.worldlabs.ai/api/agent-skill)); `docs.worldlabs.ai/api/mcp` is a 404 and no MCP
entry appears in its sitemap. SpAitial ships both.

**4. Qwen3.8 open weights: still absent — fifth run.** HF `?author=Qwen&sort=lastModified` newest
entries remain `Qwen3-ASR-0.6B-hf` / `Qwen3-ASR-1.7B-hf` (**2026-07-22**). `?search=Qwen3.8` returns
only third-party artifacts; the newest are yesterday's already-falsified `neroued/*` pair. **No new
squats today** — the daily-squat pattern broke. Re-check **~2026-08-10**. **LICENSE first.**

---

## Nothing New (Watchlist)

- **Qwen3.8-Max + Qwen3.8-27B open weights** — absent, fifth consecutive run. Re-check ~2026-08-10.
  **Read the LICENSE before anything else** (alleged US/EU/UK/KR prohibition, still unclarified).
- **Snap SPECS** — $2,195, fall 2026, US/UK/FR. Hard event date **Sep 16, Los Angeles**.
- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly, last 07-30.
- **DeepMind D4RT** — **week 16**, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra.
- **Gemini 3.5 Pro GA** — missed, fifteenth consecutive.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through
  early September.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track undisclosed.
- **XREAL Project Aura** — before end of 2026, ≤$1,500, reservations only. Not shipping.
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Android XR Catalyst second cohort** — no announcement. First cohort (1,000 kits) ships "summer
  2026"; applications closed Jun 30, not submitted. Monthly.
- **Onyx Boox Picco** — fourth run logging: price and date still undisclosed. Not a release.
- **Agent Plugins adoption** — 74 → **354 stars** in 24h, still **zero tags**. Trigger remains a
  shipped *reader* in a client in use here. Weekly.
- **Gaussian Splatting Newsletter July issue** — ➕ new. Overdue (June issue posted Jul 1). Do not
  mistake its arrival for new news.
- **`gaussian-splatting` PyPI (yindaheng98 fork)** — suppressed per §2B; did not trigger.

---

## Project Impact

**MedSim-Game (flagship) — the Fable 5 safeguards change is the first news item in weeks that touches
the clinical content pipeline, and it is genuinely good news, bounded.** MedSim's whole product is
clinical: physiology couplings, per-coupling teaching explanations behind a clinical-review gate,
scenario content for nursing/EMS/CNA. Anthropic now explicitly names *clinical task support for
healthcare professionals* and *interpreting lab results* as carved-out benign uses, with biology
fallbacks down ~85%.

**Three things keep this from being bigger than it is.** (a) It is a **Fable 5** change; MedSim runs
on Claude via the API and the post does not extend the claim to Opus 5. (b) The **Platform/API surface
moved ~7%** — by far the smallest of the four. The big wins are on claude.ai and Cowork, i.e.
authoring sessions, not the product's runtime. (c) **Virology, toxicology, and molecular design stay
blocked** — irrelevant to bedside simulation content, so no loss. **Net: authoring clinical content
in Claude should get measurably less friction starting today; the shipped product's API path is
roughly where it was.** No action required, nothing to migrate. If content authoring has been hitting
fallbacks on physiology or pharmacology explanations, that friction is what just dropped.

**MedSim-Game — the ultrasound raytracing item is unchanged for an eighth reading, and that is the
finding.** One bounded session evaluating NVIDIA's **Isaac for Healthcare** ultrasound raytracing on
a CUDA box before more hand-written POCUS slicer work. License gate cleared 08-01 (Apache-2.0). Eight
identical push dates. **This is blocked on a session, not on news, and the scout cannot unblock it.**

**MedSim-Game — SpAitial is a cheaper, agent-native second option for non-clinical environments, and
it is priced today.** The parametric town-buildings generator stays the choice for town buildings
(that was a deliberate rejection of AI-gen). Where a generated splat world could earn its place is
**non-clinical background environments** — exterior establishing spaces, ambient scenes behind a
clinical foreground — where no accuracy guarantee is needed and the Blender→GLB→R2 pipeline already
consumes exactly these formats. At **$1.60 per Standard world in ~8 minutes**, an evaluation is a
sub-$20 experiment, not a project. **Priority: low, well behind ultrasound raytracing.** Generated
environments carry **no clinical accuracy guarantee** — this must never touch clinical content.

**Portfolio build substrate — SpAitial's MCP server is the concrete counter-example to the Agent
Plugins hype.** Agent Plugins got 354 stars and shipped no tags; SpAitial shipped a working stateless
streamable-HTTP MCP server with a copy-pasteable `claude mcp add` line and got zero stars on its
skill repo. If the goal is "drive a world model from Claude Code today," the second one works now.
Also worth noting: SpAitial's server being **stateless streamable-HTTP** is the 2026-07-28 spec
running in production — a useful reference implementation if any MCP server here ever needs to scale
horizontally.

**haptic-mirror — status changed, for the first time in months.** See *Parked Idea Unblocks*. The
D4RT wait is no longer the only path.

**3rdrider (parked) — unchanged. Sep 16 is still the date.** SPECS at $2,195 is ~2.7× the $800 gate;
price alone fails the blocker. Nothing in-window moves it.

**SmartBadge — no change.** The blocker on record is 4.9pt typography on the physical cards.

**MedCapture — no change.**

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**Two entries move this run.** One is yesterday's PROMOTE, now fully scoped with a price. The other is
a **correction** — an entry dismissed 24 hours ago on a factual error.

### 1. Resume haptic-mirror training-scenario worldbuilding

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
- **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
- **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world
  reconstruction tooling that lets you generate training scenarios from short video captures"*
- **What changed:** Not the news — **the assessment.** Yesterday's report ruled Marble out on the
  grounds that it is generative rather than reconstructive. Marble's video-prompt documentation says
  otherwise: short video of a **static real space**, 180°–360° continuous take, fixed focal length and
  exposure, and troubleshooting text that states the model **"reconstructs a static scene"** and that
  auto-exposure shifts **"confuse depth estimation."** Output is a 2M-splat SPZ/PLY. The entry's own
  `next_action_if_pursued` reads: *"capture short video of a worksite or clinical room → generate a
  Gaussian Splat scene → use as VR training environment for one specific procedure."* **That is the
  documented Marble workflow, available self-serve today.** SpAitial covers image and 360° panorama
  input but does **not** document video input — Marble is the one that matches.
- **The one honest mismatch:** the blocker says *"open-source."* Marble is a commercial credit-billed
  API, so this is a **functional** satisfaction, not a literal one. The entry already recorded on
  2026-04-28 that the "or equivalent" clause was *"arguably triggered"* — this is the strongest
  version of that argument so far, and the first time the capture→scene step specifically is covered
  rather than just the training step.
- **Recommended action: REVISIT — and correct the entry.** Concretely: buy the **$5.00 minimum**
  World Labs API credit block, record one continuous 360° video of a real room, and generate one
  world. That is a single sub-$10 session that answers whether the whole premise holds. D4RT (week 16,
  no code) is no longer the only gate, and waiting on it is no longer justified by the tooling.
  **Not a promote to active work** — the Bouren-Plan freeze is a scope decision, not a tech blocker,
  and MedSim remains the flagship.

### 2. AI Multi-View Video Generator

- **Idea:** AI video / scene generator with synchronized 6-direction output
- **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/ai-multiview-video-generator.md`
- **Blocker was:** *"(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a
  public API feature … not exposed yet; (b) build it from existing 3D primitives … requires the
  display-cube-six-screens project to exist first."*
- **Status:** **PROMOTE**, as recommended yesterday — **and the last open variable is now closed.**
  Yesterday's caveat was *"the remaining unknown is cost."* Both satisfiers of path (a) are now priced:
  - **SpAitial Echo 2 — $1.60/world (~8 min) or $8.00/world HQ (~60 min)**, published up front, free
    tier explicitly excluded from API use.
  - **World Labs Marble — $1.00 per 1,250 credits, $5.00 minimum**, per-generation cost **not
    published** (returned as `cost.total_credits` on completion).
- **What this does to the idea:** the original framing — "wait for someone to expose *multi-view
  export*" — is now the weak version of what is purchasable. A downloadable navigable world (SPZ/PLY
  + collision mesh) makes six fixed cube-face views a **local render pass**, no API feature required.
  At $1.60 per world, the content cost for a cube demo is negligible.
- **Recommended action: PROMOTE, and start with SpAitial.** Reasons: published pricing, MCP server
  callable directly from Claude Code, and SOG export on top of SPZ/PLY. Path (b)'s dependency on
  `display-cube-six-screens` is unaffected — but path (b) is no longer the only route, and path (a)
  now has a number attached.

**No other parked ideas unblocked.** `3rdrider-snap-spectacles.md` remains **WAIT** — $2,195 against
a <$800 gate; Sep 16 informs the decision but cannot move the price. The remaining 24 entries are
blocked on market, money, revenue milestones, or sequencing — none movable by tech news.

---

## Notes on scope

- **The most valuable finding was again not a search result.** SpAitial appeared as one clause inside
  a summary of a third-party newsletter. It was worth more than every query run this session — a
  vendor with a production MCP server, published pricing, and portable exports that this scout had
  never named once. **Rule worth adopting: when a summary names a vendor that returns zero `grep` hits
  across all prior reports, that is a lead, and it gets verified against the vendor's own docs before
  anything else.**
- **Yesterday's report contained a confident wrong sentence, and it cost a parked idea a day.** The
  claim that Marble is "not reconstruction from your own video capture" was asserted without reading
  the video-prompt page — one fetch away. The same run correctly criticized *"open questions that cost
  one fetch should not survive to a second report."* Asserting instead of fetching is the same failure
  with the uncertainty hidden.
- **Two vendors shipped agent-integration surfaces to total silence** (0 stars on both skill repos)
  while a packaging spec with no artifacts drew 354 stars in a day. Adoption metrics measure attention,
  not availability. Check what runs, not what trends.
- **All four per-run diffs returned clean negatives in one fetch each** (Lens Studio, Snap newsroom,
  MCP spec blog, GitHub release table). The per-run promotions from the last two runs are working.
- Upcoming calendar in scope: **Snap SPECS launch, Sep 16 (Los Angeles)**; **Meta Connect, Sep 23–24**.
  Six and seven weeks out.
- **Config updates recommended this run:** add **SpAitial** (`spaitial.ai`, `docs.spaitial.ai`,
  `mcp.spaitial.ai`) to §2B alongside World Labs as a tracked world-model vendor, and mark
  `spaitial.ai` fetch-hostile in §5 (403 to WebFetch, 200 to `curl` + browser UA); §4 closes the World
  Labs pricing item ($1.00/1,250 credits, $5 min, per-generation cost unpublished) and adds the
  Marble-app-credits-≠-API-credits gotcha.
