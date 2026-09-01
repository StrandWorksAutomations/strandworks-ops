# Tech Scout Report — 2026-08-09

**Window:** 2026-08-08 → now (normal 24h daily cadence). Prior report: `scout-2026-08-08.md`.

## Verdict

**Nothing shipped in any focus area in the last 24 hours.** Every per-run diff returned a clean
negative, the model-release calendar is empty for a **fifth** consecutive run, and no tracked repo
cut a release or a tag. Per the daily-cadence rule this is a correct and expected result.

Three things are worth recording, and all three are about *reading signals*, not about news:

1. **The "Pixel Buds Sight" phantom came back.** It was falsified yesterday against Google's own
   I/O post. Today's AR sweep returned it again with **byte-identical specificity** — $299,
   November 2026, "announced at I/O 2026." It was not re-chased, because §5 has it logged. This is
   the first proof that a falsified lead **recurs** rather than dying.
2. **LichtFeld-Studio inverts yesterday's lesson.** Yesterday `pushed_at` moved on pure housekeeping
   and would have produced a false "eighth day of commits." Today `pushed_at` moved again — and this
   time there **is** real work, just not on `master`. `pushed_at` is neither a work signal nor a
   non-work signal. **Only the event log separates the two cases**, and both cases occurred inside
   48 hours.
3. **The Gaussian Splatting Newsletter is now measurably late, not just absent.** The archive shows
   a strict 1st-of-month cadence. The August issue (covering July) is **8 days overdue** — the first
   break in that cadence on record.

---

## Breakthroughs & Releases Since Last Report

**None.** Every section below is a negative, recorded so the next run can diff against it.

### AI / ML

- **No model releases dated Aug 7, 8, or 9.** The
  [digitalapplied August 2026 tracker](https://www.digitalapplied.com/blog/ai-model-releases-august-2026-tracker)
  newest dated entry is still **Aug 6 — OpenAI GPT-5.6 Sol thinking-slider update / Luna default
  rollout**. Below it: Aug 5 (xAI `grok-voice-latest` → Think Fast 2.0; Meta Muse Code beta + Muse
  Spark 1.2), Aug 4 (BFL FLUX 3 Video GA), Aug 2 (Qwen3.8-Max full release; EU GPAI enforcement).
  **Fifth consecutive run confirming an empty calendar.**
- **Anthropic — nothing new.** [anthropic.com/news](https://www.anthropic.com/news) newest is still
  **Aug 7, "Improving Fable 5's biology safeguards."** Then Aug 4 (Cuéllar), Jul 30, Jul 27 ×2,
  Jul 24 (Claude Opus 5). **Second run with no Opus 5 follow-up** extending the biology-safeguard
  change to the API surface.
- **OpenAI — nothing new.** [developers.openai.com/api/docs/changelog](https://developers.openai.com/api/docs/changelog)
  newest is still **Aug 5** (Fast mode extended context >272K on GPT-5.6), then Aug 4, Jul 30,
  Jul 29, Jul 28, Jul 22. All previously reported.
- **Google Developers Blog — nothing new.** Newest is still **Aug 6** (Agent Plugins), then Aug 5
  (MCP Stateless), Aug 4 (unified model-routing API). Everything below those is undated in the feed
  and predates the window.
- **MCP spec — no change.** [blog.modelcontextprotocol.io](https://blog.modelcontextprotocol.io/)
  post list unchanged: **2026-07-28 Specification** (Jul 28), Beta SDKs (Jun 29),
  Enterprise-Managed Authorization (Jun 18).
- **Agent Plugins — the star/artifact gap widened again.**
  `agentplugins/agent-plugins-spec`: **638 → 741 stars** in 24h (74 → 741 in 72h, **10×**).
  **Still 0 release tags, 0 git tags.** Last commit **2026-08-06T15:26Z** — unchanged, i.e.
  **three consecutive days with zero commits** while the repo added ~667 stars. Watch trigger
  unchanged: **a client shipping a reader.**

### Spatial Computing / 3D

- **No new release across any tracked repo.**

  | Repo | Latest release | Newest commit | In-window commits |
  |---|---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-07-26 | 0 |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | 2026-08-07 (`master`) | **0 on `master`** |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | 2026-07-29 | 0 |
  | `nerficg-project/faster-gaussian-splatting` | **none (0 tags)** | 2026-07-11 | 0 |
  | `Project-MONAI/MONAI` | 1.6.0 — 2026-06-11 | 2026-08-07 | 0 |
  | `agentplugins/agent-plugins-spec` | **none (0 tags)** | 2026-08-06 | 0 |

- **LichtFeld-Studio — real work today, none of it on `master`.** `pushed_at` reads
  **2026-08-09T12:43Z**; newest `master` commit is still **2026-08-07T10:37Z** (`style: apply
  clang-format`). The event log shows the difference is **active feature work on a side branch**:

  | Time (UTC) | Event |
  |---|---|
  | 2026-08-09T12:43Z | Push `refs/heads/lfs-elite` |
  | 2026-08-09T11:25Z | Push `refs/heads/lfs-elite` |
  | 2026-08-09T11:15Z | Push `lfs-elite` + PullRequestEvent |
  | 2026-08-09T10:52Z | PullRequestEvent |
  | 2026-08-09T10:26Z | Push `lfs-elite` + PullRequestEvent |
  | 2026-08-09T10:13Z | PullRequestEvent |
  | 2026-08-09T10:08Z | Issue opened + comment |
  | 2026-08-09T10:01Z | Create branch `fix/1579-overlay-render-cost` |

  Five pushes, four PR events, a new fix branch. **This is genuine development** — it simply has not
  landed. `lfs-elite` was the scratch branch created *and deleted twice* yesterday; it is now being
  used as a working branch. v0.5.3 is **seven weeks old**. Nothing to report as shipped.
- **Gaussian Splatting Newsletter — the August issue is 8 days overdue.** The
  [radiancefields archive](https://radiancefields.substack.com/archive) shows a firm 1st-of-month
  cadence: **Jul 1** (June issue — Houdini/Arnold/TouchDesigner/SketchUp go native, Apple Maps picks
  up splats), Jun 1 (May), May 1 (April), Apr 3 (March), Mar 3 (Feb). **No Aug 1 issue exists.**
  Third run logging the absence, and the first with the cadence quantified. Do not mistake its
  eventual arrival for new news — it is a monthly digest of items this scout should already hold.
- **Gaussian splatting sweep returned nothing dated in-window.** Everything surfaced is
  prior-reported or older: FastGS (CVPR'26 Highlight), Mobile-GS (ICLR'26 — note its **mobile-side
  Vulkan code was never released**, company policy; only the March CUDA version is public), Khronos
  `KHR_gaussian_splatting` (Feb 2026 announcement, still unratified past its Q2 target), INRIA
  reference impl, OpenSplat, Taichi 3DGS.
- **World Labs / Marble — no change.**
  [release notes](https://docs.worldlabs.ai/marble/release-notes) newest entry still **2026-04-02**
  (Marble 1.1 / 1.1 Plus + model selector). Baseline holds; four months stale.
- **SpAItial — no new model.** [spaitial.ai/blog](https://spaitial.ai/blog) (via `curl` + browser UA
  per §5) unchanged: **Echo-2 — 2026-04-28**, Echo-1 — 2025-12-15, plus two May 2025 company posts.
  Second clean negative since being added.

### AR / Smart Glasses

- **Nothing shipped.** Both per-run diffs clean in one fetch each:
  - **Lens Studio: 5.23.1 (Aug 5) — unchanged.** SPECS 27 track; Spectacles (2024) still pinned at
    **5.15.4**. [ar.snap.com/download](https://ar.snap.com/download)
  - **Snap newsroom: unchanged.** Newest headline still **07.31.26** ("Rewarding Authentic
    Creativity on Spotlight"); SPECS launch post still **07.30.26**; **September 16, Los Angeles**
    unchanged. [newsroom.snap.com](https://newsroom.snap.com/)
- **AR sweep returned only roadmap material and one known phantom** (see below). Rejected under the
  no-roadmap rule: XREAL Project Aura (Android XR, "global 2026"), Samsung Intelligent Eyewear,
  VITURE SDK updates, Meta Wearables Device Access Toolkit developer preview. **Android XR SDK
  Developer Preview 3** — the first with official glasses support, dedicated libraries, a glasses UI
  framework, and an emulator with touchpad + limited-FOV simulation — surfaced again but shipped
  **May 2026**, out of window and previously covered.

### Hardware

- **Nothing.** No e-ink movement.
- **Onyx Boox Picco — sixth consecutive run, still not a product.** Re-verified across
  Notebookcheck, Liliputing, Good e-Reader, Gizmodo, Engadget: 3.97" monochrome E Ink, front light,
  page-turn buttons, microSD, debut of a new "Tile" line aimed at XTEINK. **Price and release date
  explicitly undisclosed**; the only pricing language is Onyx's own "accessible price point," and
  the one number in circulation ($69) is a *competitor's* price being used for speculation.
  Announcement, not release.
- Modos unchanged: Paper Monitor 13" $599 in stock, 6" dev kit $199; Modos Flow still Dec 10, 2026.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all seven repos is
  **`i4h-workflows` at 2026-07-28T17:24Z** — **tenth identical reading**. `Cosmos-H-Dreams`
  unchanged at 2026-07-27.
- **MONAI: no new release**, still 1.6.0 (2026-06-11). Newest commit is still yesterday's
  hash-validation hardening fix (2026-08-07T11:19Z). **Zero commits in window.**

---

## The phantom recurred

Yesterday's report falsified **"Pixel Buds Sight"** — a claimed $299 audio-first Google AR product
"confirmed for November 2026, announced at I/O 2026" — against
[Google's own I/O post](https://blog.google/products-and-platforms/platforms/android/android-xr-io-2026/),
which names no such product, no price, and no month.

**Today's AR sweep returned the identical claim again, with the identical fabricated specificity**,
from a different query. It was not re-verified and not carried forward, because §5 already holds the
verdict.

The operational point: **falsification is not self-enforcing.** A wrong claim with concrete numbers
attached will keep resurfacing in search summaries for as long as the underlying pages exist, and
each run that meets it fresh pays the same verification cost — or worse, believes it. Yesterday's
config entry converted a repeat 6-fetch investigation into a one-line lookup on its very first test.
**Logging negatives is what makes the daily cadence affordable.**

---

## Nothing New (Watchlist)

- **Qwen3.8-Max + Qwen3.8-27B open weights** — **absent, seventh consecutive run.**
  `?author=Qwen&sort=lastModified` newest entries remain `Qwen3-ASR-0.6B-hf` / `Qwen3-ASR-1.7B-hf`
  (**2026-07-22**, 18 days). `?search=Qwen3.8` newest are still the falsified `neroued/*` pair
  (2026-08-06) — **no new squats for three days.** ⏰ **The formal re-check is due tomorrow,
  2026-08-10** — one week after the "next week" promise of 08-03. **Read the LICENSE first**
  (alleged US/EU/UK/KR prohibition, still unclarified). If nothing lands tomorrow the promise has
  visibly lapsed and the §4 item should be struck.
- **Snap SPECS** — $2,195, fall 2026, US/UK/FR. Hard event date **Sep 16, Los Angeles** (5½ weeks).
- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly, last 07-30.
- **DeepMind D4RT** — **week 16**, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra.
- **Gemini 3.5 Pro GA** — missed, seventeenth consecutive.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly
  through early September.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track undisclosed.
- **XREAL Project Aura** — "global 2026," ≤$1,500, reservations only. Not shipping.
- **Google intelligent eyewear** — audio class "later in the fall of 2026," display class after.
  No name, no price, no date published. **Display class is the one that matters for 3rdrider.**
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Android XR Catalyst second cohort** — no announcement. Monthly.
- **Onyx Boox Picco** — sixth run: price and date still undisclosed.
- **Agent Plugins adoption** — **741 stars**, **zero tags**, **zero commits in 3 days**. Weekly.
- **Gaussian Splatting Newsletter (August issue / July coverage)** — ➕ **8 days overdue** against a
  strict 1st-of-month cadence. Third run logging; first with the cadence established.
- **Marble release notes** — newest entry **2026-04-02**. Baseline holds.
- **SpAItial blog** — newest post **Echo-2, 2026-04-28**. Baseline holds.
- **`gaussian-splatting` PyPI (yindaheng98 fork)** — suppressed per §2B. Did not surface today.
- **`llm-stats.com`** — fetch-hostile since 08-08 (bot interstitial). Not retried; the independent
  tracker covered the calendar.

---

## Project Impact

**MedSim-Game (flagship) — no impact this run.** Nothing shipped that touches the physiology engine,
the clinical content pipeline, the asset pipeline, or the R2/Blender→GLB path. The Fable 5
biology-safeguards change from Aug 7 remains the standing item with its stated bound (**API surface
moved ~7%**), and a second day has passed with no Anthropic post extending it to Opus 5. Nothing to
act on.

**MedSim-Game — the Isaac ultrasound-raytracing item is unchanged for a tenth reading.** One bounded
session evaluating NVIDIA Isaac for Healthcare ultrasound raytracing on a CUDA box before more
hand-written POCUS slicer work. License gate cleared 08-01 (Apache-2.0). **Ten identical push
dates.** It is **blocked on a session, not on news.** This is the highest-value item on the board
and it has now been static for twelve days — the scout cannot move it, and restating it daily is
the only thing this report can do about that.

**MedSim-Game — SpAItial evaluation unchanged, still low priority.** $1.60/Standard world for
**non-clinical background environments only**; the parametric town-buildings generator remains the
choice for town buildings. **Generated environments carry no clinical accuracy guarantee — never
near clinical content.**

**haptic-mirror — unchanged from yesterday's strengthened position.** Marble's video→world path is
confirmed at the API level by two independent vendor documents (prompt guide + the Jan 29 release
note raising the API video-prompt limit to 100MB). The pending $5.00 test is unchanged and remains
the best-evidenced open experiment in the vault. Still **not a promote to active work** — the
Bouren-Plan freeze is a scope decision and MedSim is the flagship.

**3rdrider (parked) — unchanged.** SPECS at $2,195 is ~2.7× the $800 gate. The recurring "$299
Pixel Buds Sight" claim is falsified and would fail the blocker on **display** even if it were real.
**Sep 16 remains the only hard date in the AR calendar.**

**SmartBadge — no change.** Blocker on record is 4.9pt typography on the physical cards, not tech.

**MedCapture — no change.**

**Portfolio build substrate — one negative worth keeping.** Agent Plugins is now at 741 stars with
**zero commits in three days and zero tags since creation in April**. A 10× star run with a flat
commit graph is the clearest available argument against treating adoption metrics as readiness.
Nothing to adopt.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**No parked ideas unblocked.** Nothing shipped in the window, so nothing new can satisfy a blocker.

Two entries carry forward with **unchanged recommendations and no new evidence**:

- **`haptic-mirror-d4rt.md` — REVISIT (carried, unchanged).** Yesterday's API-level corroboration
  stands; nothing today adds to or subtracts from it. The honest mismatch is unchanged: the blocker
  says *"open-source,"* and Marble is a commercial credit-billed API — a **functional** satisfaction,
  not a literal one.
- **`ai-multiview-video-generator.md` — PROMOTE (carried, unchanged).** Both satisfiers priced
  (SpAItial $1.60 / $8.00 published; World Labs $1.00 per 1,250 credits, $5 minimum, per-generation
  cost unpublished). Start with SpAItial.

The remaining 25 entries are blocked on market validation, money, revenue milestones, sequencing, or
a specific build session — **none movable by tech news**, and none moved today.

---

## Notes on scope

- **This is a correct thin day**, the second in a row. Nothing shipped; the report says so and does
  not pad. Both standing obligations ran in full: the `Parked Idea Unblocks` cross-reference against
  all 27 vault entries, and the `Still Watching` roll-forward.
- **`pushed_at` failed in the opposite direction today, which completes the lesson.** Yesterday it
  *overstated* (housekeeping read as commits). Today it would have *understated nothing* but still
  misled — real PR-driven feature work exists, entirely off `master`, so both a `pushed_at` check
  and a naive `master` commit check give the wrong picture on their own. **The event log is the only
  reading that was correct on both days.** This matters most for
  `nerficg-project/faster-gaussian-splatting`, which §2B monitors by push and has no releases.
- **A logged falsification paid for itself within 24 hours.** The Pixel Buds Sight entry added to §5
  yesterday turned a repeat multi-fetch investigation into a one-line lookup today. Negative results
  are the cheapest thing this scout produces and the most reusable.
- **An absence became a measurement.** "Newsletter missing" was a soft note for two runs; reading
  the archive turned it into "**8 days past a strict 1st-of-month cadence**." Establishing a
  publisher's cadence converts a vague gap into a dated anomaly — worth doing for any source logged
  as overdue more than once.
- Upcoming calendar in scope: **Snap SPECS launch, Sep 16 (Los Angeles)**; **Meta Connect,
  Sep 23–24**. Nearest actionable date: **Qwen re-check tomorrow, Aug 10** — the last one before
  the promise is declared lapsed.
- **Config updates recommended this run:**
  1. **§2B push-monitoring warning** — extend with today's inverse case: `pushed_at` moved on
     *genuine* work confined to a side branch. State the rule as **"read `/events`; `pushed_at`
     and the `master` commit list are each wrong on one of the two 08-08/08-09 cases."**
  2. **§2B** — add the Gaussian Splatting Newsletter (radiancefields.substack.com) as an explicit
     row with its **1st-of-month cadence** and the note that the digest is a lagging summary, not a
     source of new items.
  3. **§5** — annotate the Pixel Buds Sight row: **recurred 2026-08-09 from a different query with
     identical fabricated specificity.** Do not re-verify.
  4. **§4** — the Qwen re-check comes due **2026-08-10**; if weights are still absent, strike the
     item as a lapsed promise rather than rolling it forward an eighth time.
