# Tech Scout Report — 2026-08-05

**Window:** 2026-08-04 → now (normal 24h daily cadence). Prior report: `scout-2026-08-04.md`.

## Verdict

**Nothing shipped in the focus areas in the last 24 hours.** One real dated release (OpenAI education
plugins, Aug 4) is adjacent, not core. The run's actual value is three verified negatives and one
calendar item that five previous runs missed:

1. **Qwen3.8 open weights still have not shipped** — and two repos that *look* like the 27B landing
   are empty placeholder squats. Verified by file listing, not by name matching.
2. **A license claim that would kill the Qwen 27B plan for this portfolio** surfaced: a reported
   prohibition covering the **USA, EU, UK, and Korea**. Unconfirmed by Alibaba. Attributed, not asserted.
3. **Snap SPECS has a hard launch date — September 16, Los Angeles** — announced July 30 and absent
   from every prior scout report. It does not unblock anything, but it moves a calendar this scout
   was tracking as vague "fall 2026."

---

## Breakthroughs & Releases Since Last Report

### AI / ML

- **OpenAI — education plugins for ChatGPT Work and Codex, shipped 2026-08-04.** Three plugins
  (K–12 teachers, college educators, college students); a plugin is a packaged bundle of apps,
  role-specific skills, instructions, and workflows so users skip prompt construction. Alongside it:
  **ChatGPT for Academic Researchers — 12 months of free Pro-level access** for eligible researchers
  in a secure workspace.
  [openai.com/index/learn-teach-chatgpt-work-codex](https://openai.com/index/learn-teach-chatgpt-work-codex/)
  - **Relevance is market-signal, not technical.** The portfolio does not gain a capability here.
    What it gains is a data point: OpenAI is packaging role-scoped agent bundles for education and
    giving away Pro access to academics. MedSim-Game sells into nursing/EMS/CNA/hospital training —
    that is a different buyer than K-12/college, but the *free-for-students* motion is the same
    on-ramp logic as the recorded MedSim freemium model. Worth knowing, not worth reacting to.
  - The academic-researcher free tier is **not** actionable here — no institutional affiliation.

- **Google Cloud — "A unified API for AI model routing," 2026-08-04**
  ([developers.googleblog.com](https://developers.googleblog.com/)). API Gateway dynamically routes
  traffic across Gemini, Claude, and OpenAI OSS-GPT. Preceded 08-03 by "Scaling real-time AI agents
  with session-aware load balancing." Infrastructure, not capability. Logged because a routing layer
  is the mechanism by which a cheap-model NPC experiment would be A/B'd against Claude — but the
  `sim-llm-npc` edge function already does its own dispatch, so this buys nothing today.

- **Anthropic — nothing technical.** Newsroom's newest post is **Aug 4, "Mariano-Florentino (Tino)
  Cuéllar to join Anthropic as Chief Global Affairs Officer"** — a hire, not a release. Last
  technical items remain Jul 30 (cybersecurity evals) and Jul 24 (Claude Opus 5).

### AR / Smart Glasses

- **Nothing shipped.** Per-run Lens Studio version diff: **5.23.0 (July 28) — unchanged for the
  seventh consecutive run**; Spectacles (2024) still pinned at **5.15.4**
  ([ar.snap.com/download](https://ar.snap.com/download)).
- **Calendar item — Snap SPECS launch event set for September 16, Los Angeles.** Announced on the
  Snap newsroom **July 30** ("See for Yourself: Watch the SPECS Launch on September 16") and **not
  present in any prior scout report** — `grep` across all `scout-*.md` returns zero hits for the date.
  - Evan Spiegel gives the first in-depth look; attendees including developers and creators are the
    first outside Snap to wear **shipping** hardware. Demos cover AI, work, entertainment, shared AR.
  - **$2,195**, ships **fall 2026**, US / UK / France first.
    [Engadget](https://www.engadget.com/2227433/snap-ar-specs-launch-date-september-event/) ·
    [Road to VR](https://roadtovr.com/snap-specs-ar-glasses-launch-event-september/)
  - **This is a dated event, not a shipped product** — reported as a calendar correction under the
    no-roadmap rule, not as a release. Its value is that it lands **one week before Meta Connect
    (Sep 23–24)**, making mid-September the densest AR window of the year.
- Everything else the AR sweep returned was 2025 AWE retrospectives and unshipped 2026 expectations
  (Samsung Galaxy Glasses, Google/Warby Parker, XREAL Aura). Rejected.

### Spatial Computing / 3D

- **Nothing.** No new release across any tracked repo:

  | Repo | Latest release | Last push |
  |---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-07-31 |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | **2026-08-05** |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | **2026-08-04** |
  | `nerficg-project/faster-gaussian-splatting` | never (push-monitored) | 2026-07-11 |
  | `nerfstudio-project/nerfstudio` | v1.1.5 — 2024-11-11 | 2025-07-29 |
  | `mkkellogg/GaussianSplats3D` | v0.4.7 — 2025-01-25 | 2025-10-19 |

  LichtFeld-Studio has now pushed commits for **five consecutive days without cutting a release**
  (v0.5.3 is six weeks old). Commits are not releases.
- World-model sweep returned **no August release**. Everything found is prior-window and already
  known: World Labs **World API** (Jan 21), Decart **Oasis 3** (June), Odyssey-2 API, Genie 3
  research preview / Project Genie behind AI Ultra. See *Parked Idea Unblocks* — the World API is
  relevant for a different reason than novelty.

### Hardware

- **Nothing.** No e-ink movement. Onyx Boox **Picco** (3.97" mono, microSD) re-confirmed as a **July**
  announcement with **price and release date still undisclosed** — outside the window and not
  reportable. Second consecutive run logging this so it does not get re-reported as new.
- Modos Paper Monitor remains resolved and shipping (13" $599 in stock, 6" dev kit $199) per 08-04.
  Modos **Flow** unchanged at Dec 10, 2026.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all seven repos is
  still **`i4h-workflows` at 2026-07-28T17:24Z** — **sixth identical reading.** `Cosmos-H-Dreams`
  unchanged at 2026-07-27.
- **MONAI: no new release.** Still **1.6.0 (2026-06-11)**; pushed 2026-08-04, commits only.
- Vendor sweep (NVIDIA Isaac for Healthcare / Siemens Healthineers / GE HealthCare) returned only the
  **March 2025** NVIDIA–GE autonomous-imaging collaboration and CES 2026 Siemens industrial material.
  Nothing in window.

---

## Verified negatives (the substance of this run)

**1. Qwen3.8-Max / Qwen3.8-27B open weights have NOT shipped.**

The HF search index surfaced two repos created **2026-08-05** that declare
`base_model: Qwen/Qwen3.8-27B`, `license: apache-2.0`, `pipeline_tag: image-text-to-text`:

- `huginnfork/Qwen3.8-27B-FP8`
- `huginnfork/Qwen3.8-27B-NVFP4A16`

A quantization declaring a base model is *suggestive* — you cannot quantize weights you do not have.
**So the repos were opened, not trusted.** Result: **both are empty.** `?blobs=true` returns
**2 files, 0.00 GB total**, and `raw/main/config.json` returns `Entry not found`. There are no
weights, no config, no shards. These are **placeholder name-squats**, not evidence of a release.
`Qwen/Qwen3.8-27B` and `Qwen/Qwen3.8-Max` do not appear in the HF model index at all, and the
official `author=Qwen` listing's newest entries are still `Qwen3-ASR-*` from **2026-07-22**.

**Methodology correction to yesterday's config change.** The 08-04 run added "verify against the HF
API, not the press release." That is right, but the stated check is unsound as written: **the HF API
returns `401 Invalid username or password` for repositories that do not exist**, not `404` — a
control request for `Qwen/Qwen-DoesNotExist-9999` returns **401**, identical to `Qwen/Qwen3.8-27B`.
A 401 therefore proves nothing either way. The checks that actually discriminate are the **search
index** (`?search=`), the **author listing** (`?author=Qwen`), and, for any candidate repo, the
**blob listing** — which is what exposed the empty squats. Config §2C and §5 updated accordingly.

**2. A license restriction is alleged that would make the 27B unusable here.** Per
[latent.space, Aug 4](https://www.latent.space/p/ainews-qwen-38-max24t-and-27b-new), OstrisAI flagged
what they read as a **license prohibition covering the USA, EU, UK, and Korea**. **Alibaba has issued
no clarification.** This is a third-party reading of an unreleased license and is **not** stated here
as fact — but it is load-bearing: the entire reason to care about `Qwen3.8-27B` was self-hosting NPC
dialogue on the RunPod command station at zero marginal cost. **A US prohibition would void that
outright.** When the weights land, read the LICENSE file before anything else — the same discipline
that closed the `Cosmos-H-Dreams` `NOASSERTION` question on 08-01.

**3. "Meta Muse Spark 1.1" and "Thinking Machines Inkling" are NOT August releases.** An aggregator
listed both as "early August 2026." Both are **July 9** (Muse Spark 1.1, Meta Model API public
preview, $1.25/$4.25 per MTok) and mid-July (Inkling, 975B MoE / 41B active). Logged so a future run
does not re-report July models as new. Independently, `llm-stats.com` shows **zero** model releases
dated August 3, 4, or 5.

---

## Nothing New (Watchlist)

- **Qwen3.8-Max + Qwen3.8-27B open weights** — still absent; two empty squat repos appeared and were
  falsified this run. Promised "next week" from Aug 3; re-check **~2026-08-10**. **Read the LICENSE
  first** — the alleged US/EU/UK/KR prohibition decides whether this is useful at all.
- **Snap SPECS** — $2,195, fall 2026, US/UK/FR. **Now has a hard event date: Sep 16, Los Angeles.**
- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly, last 07-30.
- **DeepMind D4RT** — **week 16**, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra.
- **Gemini 3.5 Pro GA** — missed, thirteenth consecutive.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through
  early September.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track undisclosed.
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Android XR Catalyst second cohort** — no announcement. Monthly.
- **Onyx Boox Picco** — announced July, **price and date still undisclosed**. Not a release.
- **`openai.com/news`** — **new fetch-hostile target.** 403s to WebFetch *and* to `curl` with a
  browser UA (both attempted this run). Working paths: `developers.openai.com/api/docs/changelog`
  (checked — no August entries), `learn.chatgpt.com/docs/changelog`, and domain-scoped search.
- **`gaussian-splatting` PyPI (yindaheng98 fork)** — suppressed per §2B; did not trigger this run.

---

## Project Impact

**MedSim-Game (flagship) — unchanged, and the queued item is still the highest-value thing this scout
tracks:** one bounded session evaluating **NVIDIA's ultrasound raytracing (Isaac for Healthcare)** on
a CUDA box before more hand-written POCUS slicer work. License gate cleared 08-01 (Apache-2.0). Isaac
repos are on their sixth identical reading — **nothing is going to change by waiting.** This is
blocked on a session, not on news.

**MedSim-Game, secondary — the Qwen 27B self-hosting plan is now at material risk, and the risk is
legal, not technical.** Yesterday's framing was "the 27B is the interesting one because it could take
NPC dialogue cost to zero on the command station." That still holds *if* the license permits US use.
The reported USA/EU/UK/Korea prohibition, if real, removes the option entirely — and there is no
point benchmarking a model that cannot be deployed. **Do not spend time on Qwen 27B planning until
the LICENSE file exists and has been read.** The Max API path (a paid $2/$6 endpoint) is unaffected
by an open-weights license and remains a cost comparison worth running for bulk non-clinical NPC
dialogue only; clinical content stays on Claude per the medical-content rule.

**3rdrider (parked) — the September 16 date is when this entry gets its real answer, and it is
probably still "no."** SPECS at **$2,195** is **~2.7× the $800 gate** recorded in the vault entry.
Price alone fails the blocker. What Sept 16 delivers is the first outside-Snap hands-on with shipping
hardware and the actual developer story — enough to judge whether the *capability* is there and worth
waiting for a cheaper generation. **Put Sep 16 on the calendar; do not unpark anything now.**

**haptic-mirror — no change.** D4RT week 16, still no code. Reconstruction from short video captures
remains the blocker. See the World API note below, which is the first thing in months that even
gestures at this.

**SmartBadge — no change.** Modos stays logged-not-actioned; the blocker on record is 4.9pt
typography on the physical cards, not display electronics.

**MedCapture — no change.**

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**No parked ideas unblocked by anything in this window.** One entry, however, appears to have been
**blocked against a condition that may already have been satisfied in January** — surfaced here
because the cross-reference is supposed to catch exactly this, and has not:

- **Idea:** AI Multi-View Video Generator
- **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/ai-multiview-video-generator.md`
- **Blocker was:** *"(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a
  public API feature … not exposed yet; (b) build it from existing 3D primitives … requires the
  display-cube-six-screens project to exist first."*
- **What changed — and it is NOT from this window:** World Labs shipped the **World API on
  2026-01-21** ([worldlabs.ai/blog/announcing-the-world-api](https://www.worldlabs.ai/blog/announcing-the-world-api)).
  It is **publicly available today**, self-serve with credit-based pricing, accepts **text, images,
  panoramas, multi-view inputs, and video**, and returns a **fully navigable 3D environment** that
  the announcement says can be "rendered in the browser, **exported into other tools**, or used as
  the foundation for interactive experiences." A navigable 3D world is strictly stronger than
  "multi-view export" — six fixed cameras is a rendering pass once the world exists.
- **The caveat that stops this being a clean unblock:** the announcement **never names an export file
  format.** Gaussian splat, mesh, or player-only is unstated, and "exported into downstream tools"
  is marketing language, not a spec. If the export is proprietary and player-bound, path (a) is not
  actually open. That is a **one-fetch question against the World Labs API docs**, not a research
  project.
- **Recommended action: REVISIT.** Specifically: read the World API docs for the output format and
  pricing, then decide. Path (b)'s dependency on `display-cube-six-screens` is unaffected either way.

Everything else: `haptic-mirror-d4rt.md` remains **WAIT** (D4RT week 16, no code — and the World API
is a *generative* world model, not reconstruction-from-your-own-capture, so it does not satisfy that
blocker). `3rdrider-snap-spectacles.md` remains **WAIT** — SPECS is $2,195 against a <$800 gate; the
Sept 16 event informs the decision but cannot move the price. Every other vault entry is blocked on
market, money, revenue milestones, or sequencing — none of which tech news can move.

---

## Notes on scope

- **A thin day is not a free day.** Nothing shipped in-window, and the three things worth writing down
  all came from checking rather than searching: empty repos behind real-looking names, a license claim
  that inverts yesterday's recommendation, and two July models an aggregator relabeled as August.
- **Correction to yesterday's config change.** "Verify against the HF API" is directionally right but
  the specific check was unsound — **HF returns 401, not 404, for nonexistent repos**, so a 401 is not
  evidence of a gated-but-real model. Use the search index, the author listing, and the blob listing.
  Verified against a deliberately fake repo name rather than assumed.
- **Five runs missed a dated AR launch event** because the AR sweep was a news query and the Snap
  newsroom was only listed as "Weekly." The SPECS date has been sitting on
  [newsroom.snap.com](https://newsroom.snap.com/) since July 30. Config §2A moves the Snap newsroom
  to a per-run fetch alongside the Lens Studio version diff.
- **The vault cross-reference has a stale-blocker problem.** It compares *this week's news* against
  `blocked_on:` text, so a blocker satisfied by a **January** product is invisible forever. The World
  API case above was found by accident during a world-model sweep. A periodic full re-validation of
  vault blockers against current market state — not against the week's news — would catch these.
- Upcoming calendar in scope: **Snap SPECS launch, Sep 16 (Los Angeles)**; **Meta Connect, Sep 23–24**.
  Six and seven weeks out respectively.
- **Config updated this run:** §2A promotes the Snap newsroom to per-run; §2C corrects the HF
  verification method (401 ≠ 404) and adds the license-first rule for Qwen weights; §5 adds
  `openai.com/news` as fetch-hostile with working alternate paths.
