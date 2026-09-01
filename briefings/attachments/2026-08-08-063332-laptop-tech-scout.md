# Tech Scout Report — 2026-08-08

**Window:** 2026-08-07 → now (normal 24h daily cadence). Prior report: `scout-2026-08-07.md`.

## Verdict

**Nothing shipped in any focus area in the last 24 hours.** Every per-run diff returned a clean
negative, the model calendar is empty for a fourth consecutive run, and no tracked repo cut a
release. Per the daily-cadence rule this is a correct and expected result, not a failed run.

Three things are worth the ink anyway, and all three are corrections to how signals were read rather
than news:

1. **LichtFeld-Studio's "eighth consecutive day of commits" is not real.** `pushed_at` moved to
   **2026-08-08T12:41Z**, which would have read as a continuing streak. The event log shows it was
   **branch housekeeping** — two epic branches deleted and a scratch branch (`lfs-elite`)
   created/pushed/deleted twice. **Zero commits on `master` today.** The streak ended on 08-07.
2. **"Pixel Buds Sight" returned zero grep hits across every prior report, was run through the
   §5 verify-a-named-vendor rule, and was falsified.** Google's own I/O post names no such product,
   no $299 price, and no November date. A search summary invented specificity.
3. **Marble's release notes were read for the first time**, and a January entry independently
   corroborates yesterday's correction at the **API** level — not just the app.

---

## Breakthroughs & Releases Since Last Report

**None.** All sections below are negatives, recorded so a future run can diff against them.

### AI / ML

- **No model releases dated Aug 7 or Aug 8.** Confirmed against an independent tracker
  ([digitalapplied August 2026 tracker](https://www.digitalapplied.com/blog/ai-model-releases-august-2026-tracker),
  itself published Aug 7): its newest dated entry is **Aug 6 — OpenAI GPT-5.6 Sol update / Luna
  default swap**, and it states the next scheduled entries begin **the week of Aug 10**. Fourth
  consecutive run confirming an empty calendar.
  - ⚠️ **`llm-stats.com/llm-updates` is now bot-gated** — WebFetch returns a "confirm you are human"
    interstitial with no content. It was a usable source through 08-07. Treat as fetch-hostile;
    see *Config updates*.
- **Anthropic — nothing new.** [anthropic.com/news](https://www.anthropic.com/news) newest post is
  still **Aug 7, "Improving Fable 5's biology safeguards"** (reported in full yesterday), then Aug 4
  (Cuéllar appointment). No Opus 5 follow-up extending the biology-safeguard change to the API surface.
- **OpenAI — nothing new.** [developers.openai.com/api/docs/changelog](https://developers.openai.com/api/docs/changelog)
  newest is still **Aug 5** (Fast mode long-context >272K for GPT-5.6), Aug 4 below it. Both reported.
- **Google Developers Blog — nothing new.** Newest is still **Aug 6** (Agent Plugins), then Aug 5
  (MCP Stateless) and Aug 4 (unified model-routing API). All three already on record.
- **MCP spec — no change.** [blog.modelcontextprotocol.io](https://blog.modelcontextprotocol.io/)
  post list unchanged: **2026-07-28 Specification** (Jul 28), beta SDKs (Jun 29),
  Enterprise-Managed Authorization (Jun 18).
- **Agent Plugins — attention still climbing, artifacts still zero.**
  `agentplugins/agent-plugins-spec`: **354 → 638 stars** in 24h (74 → 638 in 48h, 8.6×).
  **Still 0 release tags and 0 git tags.** Last push **2026-08-06T15:26Z** — unchanged from
  yesterday, i.e. *no commits at all in this window* while stars nearly doubled. That gap is the
  cleanest illustration yet of the point made yesterday: this is attention, not availability.
  Watch trigger unchanged — **a client shipping a reader**.

### Spatial Computing / 3D

- **No new release across any tracked repo.**

  | Repo | Latest release | Last push | In-window commits |
  |---|---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-08-05 | 0 |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | 2026-08-08 | **0 (see below)** |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | 2026-08-05 | 0 |
  | `nerficg-project/faster-gaussian-splatting` | never (push-monitored) | 2026-07-11 | 0 |
  | `Project-MONAI/MONAI` | 1.6.0 — 2026-06-11 | 2026-08-07 | 0 |
  | `agentplugins/agent-plugins-spec` | **none (0 tags)** | 2026-08-06 | 0 |

- **LichtFeld-Studio — the commit streak ended, and `pushed_at` hides it.** Reading `pushed_at`
  alone (2026-08-08T12:41:44Z) reads as a continuing streak. The event log says otherwise:

  | Time (UTC) | Event |
  |---|---|
  | 2026-08-08T12:41:45Z | Delete branch `epic/1568-viewport-drains` |
  | 2026-08-08T12:41:44Z | Delete branch `epic/1577-gpu-async` |
  | 2026-08-08T09:12:29Z | Delete branch `lfs-elite` |
  | 2026-08-08T09:10:25Z | Push `refs/heads/lfs-elite` |
  | 2026-08-08T05:24:49Z | Create branch `lfs-elite` |

  Newest `master` commit is **2026-08-07T10:37Z** (`style: apply clang-format`), on top of
  `End the remaining per-frame CPU waits on the GPU (#1577)`. The two epic branches deleted today
  are the *merged* ones from yesterday's work — cleanup after landing, not new work. v0.5.3 is now
  **seven weeks old**.
- **World Labs / Marble — release notes read for the first time; nothing in-window.**
  [docs.worldlabs.ai/marble/release-notes](https://docs.worldlabs.ai/marble/release-notes) newest
  entry is **2026-04-02** (Marble 1.1 / 1.1 Plus models, model-used shown on assets page, redesigned
  assets page). Four months stale. Config listed this URL as a target but no prior report quotes it —
  logging the baseline so future runs can diff. **See *Corroborations* for why the Jan 29 entry matters.**
- **SpAitial — no new model.** [spaitial.ai/blog](https://spaitial.ai/blog) (via `curl` + browser UA
  per §5) unchanged: **Echo-2 — 2026-04-28**, Echo-1 — 2025-12-15, plus two 2025 company posts.
  Newly added as a target yesterday; this is its first clean negative.
- **Gaussian splatting sweep returned nothing dated in-window.** Everything surfaced is prior-reported
  or older: FastGS (CVPR'26, 9 prior reports), Mobile-GS (ICLR'26, 3 prior reports), Khronos
  `KHR_gaussian_splatting` (Feb 2026 announcement, still unratified), and the suppressed
  `gaussian-splatting` PyPI fork (§2B — v2.6.4, Aug 1; **not reported**, working as intended).
  The **Gaussian Splatting Newsletter July issue is still absent** — June issue (posted Jul 1)
  remains newest. Second run logging the overdue.

### AR / Smart Glasses

- **Nothing shipped.** Both per-run diffs clean in one fetch each:
  - **Lens Studio: 5.23.1 (Aug 5) — unchanged.** SPECS 27 track; Spectacles (2024) still pinned at
    **5.15.4**. [ar.snap.com/download](https://ar.snap.com/download)
  - **Snap newsroom: unchanged.** Newest headline still **07.31.26** ("Rewarding Authentic Creativity
    on Spotlight"); SPECS launch post still **07.30.26**; **September 16, Los Angeles** unchanged.
    [newsroom.snap.com](https://newsroom.snap.com/)
- **AR sweep returned only roadmap material**, all rejected under the no-roadmap rule: Snap SPECS
  ($2,195, fall, US/UK/FR), Samsung Intelligent Eyewear (named at Unpacked Jul 22, no ship date),
  XREAL Project Aura, Rokid AI Glasses Style (shipped **Jan 19, 2026** — out of window, $299, and
  audio/display-free class). Nothing dated in-window.

### Hardware

- **Nothing.** No e-ink movement. **Onyx Boox Picco** logged for a **fifth consecutive run** — still
  a July announcement with **price and release date undisclosed**. Everything else the sweep returned
  (Palma 3, Go refresh, Android 16, Tab X C, Note Air 6/6C) is expectation, not product.
- Modos unchanged: Paper Monitor 13" $599 in stock, 6" dev kit $199; Modos Flow still Dec 10, 2026.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all seven repos is
  **`i4h-workflows` at 2026-07-28T17:24Z** — **ninth identical reading**. `Cosmos-H-Dreams` unchanged
  at 2026-07-27.
- **MONAI: no new release**, still 1.6.0 (2026-06-11). One in-window commit (2026-08-07T11:19Z,
  `Validate downloaded file integrity and raise ValueError on hash mismatch #8833`) — a hardening fix,
  not a capability.

---

## Falsified lead: "Pixel Buds Sight"

`grep -il "pixel buds sight" scout-*.md` → **zero files**, which under the §5 rule added yesterday
makes it a lead requiring same-run verification against the vendor's own material. **It did not
survive.**

- **The claim** (from a search summary): *"Pixel Buds Sight are confirmed for November 2026 release
  as Google's audio-first AI glasses, announced at I/O 2026 as the affordable entry point into the
  Android XR glasses lineup, priced at $299."*
- **What Google actually published**
  ([blog.google — Android XR at I/O 2026](https://blog.google/products-and-platforms/platforms/android/android-xr-io-2026/),
  headline *"Intelligent eyewear with Gemini is coming this fall"*): two eyewear classes — **audio
  glasses** (spoken help, no display) and **display glasses** — with **audio glasses first, "later in
  the fall of 2026."** A domain-restricted search across `blog.google`, `store.google.com`,
  `developer.android.com`, and `android-developers.googleblog.com` returns **no product named "Pixel
  Buds Sight," no $299 price, and no November date.**
- **Verdict: not a product. Do not carry it forward.** The underlying fall-2026 audio-glasses plan is
  real and already covered; the name, price, and month were summary-generated specificity.
- **Note the rule cutting both ways.** Yesterday the zero-grep-hits rule surfaced SpAitial, which was
  real and valuable. Today it surfaced a phantom. The rule's value is that it forces the check —
  **its output is a verdict, not a discovery.** A run that reports every zero-hit name it finds is
  worse than one that reports none.
- **Immaterial to `3rdrider-snap-spectacles.md` either way.** Even taking the claim at face value,
  a **display-free audio** device fails that entry's blocker, which requires on-device
  camera + mic + **display** + developer SDK. Price was never the only gate.

---

## Corroborations

**Yesterday's Marble correction holds at the API level, from a second independent page.**

Yesterday's report corrected an 08-06 error by citing Marble's video-prompt *guide*. The release
notes — not previously read by any run — corroborate it from a different document, and extend it:

- **2026-01-29:** *"Video prompt file size limit for the **API** increased to 100MB."*

A published, versioned increase to a **video-prompt file-size limit on the API** is only meaningful
if video→world is a supported API path. Yesterday's correction rested on prose in a prompt guide,
which a skeptic could read as app-only marketing copy; this is a changelog entry for the programmatic
surface. **The `haptic-mirror-d4rt.md` REVISIT is now supported by two independent vendor documents,
and specifically for the API rather than the web app.** The 100MB ceiling is also the first concrete
capture constraint on record for planning that test.

Also corroborated from the release notes, relevant to any export work: **SPZ v2 is the default export
format** as of 2025-12-11, and **exports default to the OpenGL coordinate system** with an
OpenGL/OpenCV toggle added 2026-01-01. Worth knowing before importing into Blender.

---

## Nothing New (Watchlist)

- **Qwen3.8-Max + Qwen3.8-27B open weights** — **absent, sixth consecutive run.**
  `?author=Qwen&sort=lastModified` newest entries remain `Qwen3-ASR-0.6B-hf` / `Qwen3-ASR-1.7B-hf`
  (**2026-07-22**). `?search=Qwen3.8` newest are still yesterday's already-falsified `neroued/*` pair
  (2026-08-06) — **no new squats for two days**, the daily-squat pattern remains broken.
  Re-check **~2026-08-10** (2 days). **Read the LICENSE first** (alleged US/EU/UK/KR prohibition,
  still unclarified).
- **Snap SPECS** — $2,195, fall 2026, US/UK/FR. Hard event date **Sep 16, Los Angeles** (6 weeks).
- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly, last 07-30.
- **DeepMind D4RT** — **week 16**, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra.
- **Gemini 3.5 Pro GA** — missed, sixteenth consecutive.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through
  early September.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track undisclosed.
- **XREAL Project Aura** — before end of 2026, ≤$1,500, reservations only. Not shipping.
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Android XR Catalyst second cohort** — no announcement. Monthly.
- **Google intelligent eyewear (audio class)** — ➕ new framing. Google's own I/O post says audio
  glasses ship **"later in the fall of 2026,"** display glasses after. **No name, no price, no date
  published.** Tracks alongside Samsung; **display class is the one that matters for 3rdrider.**
- **Onyx Boox Picco** — fifth run logging: price and date still undisclosed. Not a release.
- **Agent Plugins adoption** — **638 stars**, still **zero tags**, zero commits in window. Weekly.
- **Gaussian Splatting Newsletter July issue** — still absent (June issue posted Jul 1). Second run
  logging the overdue. Do not mistake its arrival for new news.
- **Marble release notes** — ➕ new baseline: newest entry **2026-04-02**. Diff from here.
- **SpAitial blog** — ➕ new baseline: newest post **Echo-2, 2026-04-28**. Diff from here.
- **`gaussian-splatting` PyPI (yindaheng98 fork)** — suppressed per §2B; surfaced (v2.6.4, Aug 1),
  correctly not reported.

---

## Project Impact

**MedSim-Game (flagship) — no impact this run.** Nothing shipped that touches the physiology engine,
the clinical content pipeline, the asset pipeline, or the R2/Blender→GLB path. Yesterday's Fable 5
biology-safeguards item remains the standing change, with its stated bound: **the API surface moved
~7%**, and no Anthropic post today extends it to Opus 5. Nothing to act on.

**MedSim-Game — the ultrasound raytracing item is unchanged for a ninth reading, and that remains the
finding.** One bounded session evaluating NVIDIA Isaac for Healthcare ultrasound raytracing on a CUDA
box before more hand-written POCUS slicer work. License gate cleared 08-01 (Apache-2.0). Nine
identical push dates. **Blocked on a session, not on news — the scout cannot unblock it, and
repeating it daily does not change that.** It is the highest-value item on the board and it has been
static for over a week.

**MedSim-Game — SpAitial evaluation unchanged and still low priority.** $1.60/Standard world for
**non-clinical background environments only**; the parametric town-buildings generator remains the
choice for town buildings. No new information today. **Generated environments carry no clinical
accuracy guarantee — never near clinical content.**

**haptic-mirror — the REVISIT strengthens, and the action shrinks.** Second independent vendor
document confirms video→world on the **API** specifically (100MB limit, versioned Jan 29). The
pending $5.00 World Labs test is now the best-evidenced open experiment in the vault: one continuous
360° take of a static room, under 100MB, one world, export 2M-splat PLY. Still **not a promote to
active work** — the Bouren-Plan freeze is a scope decision and MedSim is the flagship.

**3rdrider (parked) — unchanged, and today's phantom does not change it.** SPECS at $2,195 is ~2.7×
the $800 gate. Google's audio-class glasses would fail the blocker on **display**, not price. The
Android XR **display** class is the one to watch, and Google has published no name, price, or date
for it. Sep 16 remains the only hard date in the AR calendar.

**SmartBadge — no change.** Blocker on record is 4.9pt typography on the physical cards, not tech.

**MedCapture — no change.**

**Portfolio build substrate — one negative worth keeping.** Agent Plugins added ~284 stars and
**zero commits** in 24 hours. Nothing to adopt, and the absence of commits alongside the star surge
argues against treating adoption metrics as a readiness signal at all.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**No parked ideas unblocked.** Nothing shipped in the window, so nothing new can satisfy a blocker.

Two entries carry forward from yesterday with **unchanged recommendations**, one of them with
strengthened evidence:

- **`haptic-mirror-d4rt.md` — REVISIT (carried, evidence strengthened).** Yesterday's Marble
  video→world finding is now corroborated by the release notes at the **API** level (100MB video
  prompt limit, 2026-01-29). This does not change the recommendation; it removes the last reasonable
  doubt about whether the capability is real and programmatically reachable. The honest mismatch
  stands: the blocker says *"open-source,"* and Marble is a commercial credit-billed API — a
  **functional** satisfaction, not a literal one.
- **`ai-multiview-video-generator.md` — PROMOTE (carried, unchanged).** Both satisfiers priced as of
  yesterday (SpAitial $1.60/$8.00 published; World Labs $1.00/1,250 credits, $5 min, per-generation
  cost unpublished). Start with SpAitial. No new information today.

The remaining 25 entries are blocked on market validation, money, revenue milestones, sequencing, or
a specific build session — **none movable by tech news**, and none moved today.

---

## Notes on scope

- **This is a correct thin day.** Nothing shipped; the report says so and does not pad. Both
  standing obligations were still run in full: the `Parked Idea Unblocks` cross-reference against all
  27 vault entries, and the `Still Watching` roll-forward.
- **`pushed_at` is not a work signal, and today it would have produced a false claim.** LichtFeld's
  timestamp moved 26 hours after the last real commit, entirely from branch deletions and a scratch
  branch. Yesterday's report called it "seven consecutive days of commits"; today's would have said
  eight. **For push-monitored repos the check must be the commit list or the event log, not
  `pushed_at`.** This matters most for `nerficg-project/faster-gaussian-splatting`, which §2B
  explicitly monitors by push date and has no releases to fall back on.
- **The zero-grep-hits rule produced a falsification today, and that is the rule working.** SpAitial
  (yesterday) and Pixel Buds Sight (today) entered by the same door; one was real and one was
  invented. The rule's job is to force the vendor-doc check, not to promote every unfamiliar name.
  A run that skipped the check would have carried a phantom $299 AR product into the 3rdrider
  discussion.
- **A source went dark mid-cadence without announcing it.** `llm-stats.com/llm-updates` was quoted
  as recently as yesterday and now returns a bot interstitial. It was caught only because the fetch
  returned obviously empty content. **Two sources that agree are worth more than one that is
  convenient** — the empty Aug 7–8 calendar was confirmed against an independent tracker instead.
- Upcoming calendar in scope: **Snap SPECS launch, Sep 16 (Los Angeles)**; **Meta Connect, Sep 23–24**.
  Six and seven weeks out. Nearest actionable date: **Qwen re-check ~Aug 10.**
- **Config updates recommended this run:**
  1. **§5** — add `llm-stats.com` as fetch-hostile (bot interstitial to WebFetch; no working path
     identified). Fallback: `digitalapplied.com/blog/ai-model-releases-august-2026-tracker` and
     vendor changelogs directly.
  2. **§2B** — add a standing note that **push-monitored repos must be checked via the commit list
     or `/events`, not `pushed_at`**, with today's LichtFeld case as the example.
  3. **§2B** — record the two new diff baselines: **Marble release notes = 2026-04-02**,
     **SpAitial blog = 2026-04-28**. Add Marble's SPZ v2 default + OpenGL default coordinate system
     to the World Labs row.
  4. **§5** — append to the verify-a-named-vendor rule that its output is a **verdict, not a
     discovery**, and log the Pixel Buds Sight falsification so a future run does not re-chase it.
