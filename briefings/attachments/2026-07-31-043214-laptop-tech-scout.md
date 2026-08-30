# Tech Scout Report — 2026-07-31

**Window:** 2026-07-30 → now (normal 24h daily cadence). Prior report: `scout-2026-07-30.md`.

## Verdict

**One real release in the 24h window** — an MIT-licensed Gaussian-splatting renderer plugin, verified
against the GitHub API rather than press coverage. Everything else in the focus areas is unchanged.

**One watchlist item finally closed, and the answer is bad.** The **Android XR Developer Catalyst
Program** — carried open for three consecutive reports, and listed as `TECH_SCOUT_CONFIG.md` §4
action item #1 — **closed applications on June 30, 2026**. Selections were notified July 15. The
window was open May 19 → June 30 and nobody loaded the page. Written up below as a miss, not as news.

**The config fix from yesterday works.** `ar.snap.com/download` was fetched directly and the version
string diffed: **5.23.0, unchanged.** That is now a two-second check that cannot be missed the way a
news query can.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Nothing new.** Lens Studio version diff performed per config: **5.23.0 (July 28), unchanged**;
  the 5.15.4 line for Spectacles (2024) is also unchanged
  ([ar.snap.com/download](https://ar.snap.com/download)). No hardware, price, ship-date, or
  dev-program movement from Snap, Meta, Samsung, or Google in the window.

### Spatial Computing / 3D

- **Gaussian Splatting plugin for After Effects by KIRI Engine — v1.0.0, released July 30, MIT.**
  [GitHub](https://github.com/Kiri-Innovation/Gaussian-Splatting-plugin-by-KIRI-Engine) ·
  [CG Channel writeup](https://www.cgchannel.com/2026/07/check-out-this-free-gaussian-splatting-plugin-for-after-effects/)
  - **Verified directly against the GitHub API**, not the news post: repo created `2026-07-20`, last
    push `2026-07-30T06:02:50Z`, release **`v1.0.0` published `2026-07-30T06:02:51Z`**, license
    **MIT**, 16 stars. Prebuilt Windows/macOS binaries on Gumroad/Superhive; source builds with
    CMake ≥3.5 + a C++20 compiler.
  - **What it does:** imports `.ply` 3DGS scans into After Effects, renders them through a native AE
    3D camera with depth of field, plus crop / recolor-by-gradient / opacity / scale / noise /
    displacement / density controls.
  - **Why it matters to us — modestly, and only two ways.** (1) It is an **MIT-licensed splat
    renderer in C++**, which is a readable reference implementation if splat rendering ever has to be
    hand-rolled outside a web viewer. (2) It is the first tool that makes a splat capture into
    *finished video* inside a compositor Jonathan already knows, which is a marketing/scenario-media
    path for MedSim and haptic-mirror.
  - **What it is not:** it does **not reconstruct** anything. It renders and styles splats that were
    already captured. It is an AE plugin, not a runtime — nothing here goes into the game client.
    Relevance is real but small; it is not a project.

### AI / ML

- **Nothing new.** **MONAI checked directly via the GitHub API** rather than search: latest release is
  still **1.6.0 (2026-06-11)**; the repo has commits as recently as `2026-07-30T15:57Z` but **no new
  release** ([Project-MONAI/MONAI](https://github.com/Project-MONAI/MONAI)). Commits are not a
  release and are not counted.
- **Gemini 3.5 Pro still not GA — eighth consecutive miss.** No change since yesterday.
- **Genie 3 developer API — still none.** Access remains Project Genie via AI Ultra ($250/mo, above
  the $200/mo infra gate).
- Kimi K3, Thinking Machines Inkling, Gemini 3.6 Flash and Cosmos 3 Edge were all logged in the
  July 28 reports and are **not** re-reported here.

### Hardware

- **Nothing new in-window.** See the Modos backfill below.

### Medical / Clinical AI

- **Nothing new.** **NVIDIA Isaac for Healthcare verified via `gh api orgs/isaac-for-healthcare/repos`:**
  latest push across all seven repos is still `i4h-workflows` at **2026-07-28T17:24Z** — identical to
  yesterday's reading. No new repo, no new release.
- **License flag carried forward unchanged:** `Cosmos-H-Dreams` still reports **`NOASSERTION`** on the
  GitHub API while the other four report clean Apache-2.0. Treat as license-unresolved until someone
  reads the actual `LICENSE` file.

---

## Backfill — missed on July 28

### Modos Paper Monitor Dev Kit — began shipping July 28, $599

- [Crowd Supply](https://www.crowdsupply.com/modos-tech/modos-paper-monitor) ·
  [Tom's Hardware hands-on](https://www.tomshardware.com/monitors/portable-monitors/hands-on-with-modos-tech-13-3-inch-e-paper-monitors) ·
  [CNX Software](https://www.cnx-software.com/2026/05/27/modos-flow-an-fpga-based-13-3-inch-usb-c-touchscreen-color-e-paper-monitor/)
- 13.3" 1600×1200 e-paper, **FPGA-based open-source low-latency display controller**, USB-C. Orders
  placed now ship July 28, 2026; first backer wave has been delivered. **$599.**
- The consumer follow-on, **Modos Flow** (13.3", 60 Hz, touch/stylus), is **$619 mono / $719 color
  with shipping scheduled December 10, 2026** — not shipped, do not count it.
- **Why it matters to us — the monitor doesn't, the controller might.** E-ink displays are a standing
  focus area because of SmartBadge. SmartBadge's corrected stack is a **Waveshare 3.52" panel driven
  by an nRF54L15** — a 13.3" FPGA-driven USB-C monitor is not a substitute for any part of that. The
  only transferable asset is Modos's **open-source waveform/driver work**, which is the hard part of
  e-paper refresh latency and is published. Worth a read *if and when* SmartBadge hits a refresh-rate
  wall; worth nothing before that.
- **Not a purchase recommendation.** $599 one-time is outside the reversible-spend lane and would need
  an explicit call. Nothing in SmartBadge currently justifies it.
- **Caveat:** the Crowd Supply page itself returns HTTP 403 to automated fetches; ship status here is
  from the vendor-adjacent coverage above, not from the campaign page directly.

---

## Watchlist Resolution — Android XR Catalyst Program (closed; we missed it)

Carried open in the last three reports as "intake status still unverified." **Loaded the page. It is
closed.** [developer.android.com/xr/catalyst](https://developer.android.com/xr/catalyst) (`g.co/dev/catalyst` 302s here).

| Milestone | Date |
|---|---|
| Applications open | **May 19, 2026** |
| Applications close | **June 30, 2026, 11:59 PM PDT** |
| Selection notification | **July 15, 2026** |

- **What was on offer:** early-access dev kits for **XREAL's Project Aura** (wired XR glasses) and
  **intelligent eyewear** (audio + display), plus specialized support channels and **non-recoupable
  grants**. Kits ship to US / Canada / Japan / UK / EU. Eligibility was developers intending to
  publish on Android XR within 6–12 months; no cohort size published.
- **This was a known, dated, assigned action.** `TECH_SCOUT_CONFIG.md` §4 item #1 reads "Apply to
  Android XR Catalyst Program before June 30, 2026" and is still an unchecked box. The scout carried
  the item as "unverified" through three reports *after* the deadline had already passed. Stating it
  plainly: the cheapest path to Project Aura hardware in hand was open for six weeks and was not taken.
- **Residual action:** none is available today — there is no waitlist or rolling intake on the page.
  Convert the watchlist entry from "verify intake status" to **"watch for a second cohort
  announcement"** and check the page monthly. The generalizable fix is the same one applied to Snap
  yesterday: **dated program deadlines belong in a fetch-and-diff check, not in prose.**

---

## Nothing New (Watchlist)

Rolled forward:

- **Khronos `KHR_gaussian_splatting` glTF extension** — still RC, not ratified; Q2 2026 target missed.
  [Khronos](https://www.khronos.org/news/press/gltf-gaussian-splatting-press-release). Monthly check, last done 07-30.
- **DeepMind D4RT** — week 13, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none.
- **Gemini 3.5 Pro GA** — missed, eighth time.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through early September.
- **Snap Specs** — $2,195, fall 2026. SDK dependency resolved (Lens Studio 5.23.0); hardware date unchanged.
- **Snap CRISP splat compression** — still unverified whether it is a portable format or Lens-Studio-internal.
  Carried from yesterday; ~20-minute docs check, still not done.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — price, ship date, developer track all undisclosed.
- **Modos Flow** — $619/$719, ships **Dec 10, 2026**. New watchlist entry.
- **Android XR Catalyst second cohort** — no announcement. Reframed entry, see above.

---

## Project Impact

**MedSim-Game (flagship) — no change.** Nothing in this window touches the physiology engine, asset
pipeline, or clinical content. The live recommendation from 07-29 still stands unchanged: one bounded
*evaluation* session of NVIDIA's ultrasound raytracing on a CUDA box before more hand-written POCUS
slicer work, scoped as evaluation because the `Cosmos-H-Dreams` license is still unresolved.

**haptic-mirror / MedSim marketing media — one small, cheap capability.** The KIRI plugin means a
Gaussian-splat capture can now become a graded, cropped, camera-moved video clip in After Effects
under an MIT license. That is useful for a scenario trailer or a pitch reel. It does **not** move
haptic-mirror's actual blocker, which is reconstruction, not presentation. **Recommended action:** log
it; use it if a splat video is ever needed; do not schedule anything.

**3rdrider (parked-but-watched) — the cheap hardware path is closed for now.** Yesterday's read was
that the Snap SDK question resolved but price ($2,195 vs a <$800 trigger) still gates the idea. Today
adds that the *other* route to glasses hardware — a free Project Aura dev kit plus a grant via Android
XR Catalyst — closed June 30 without an application. There is no substitute route open today.
**Recommended action:** none beyond monitoring for a second cohort. This does not change the parked
status; it removes an option that was theoretically available and never exercised.

**SmartBadge — no action.** Modos is filed as a reference for open-source e-paper driver work, not as
hardware to buy. The corrected nRF54L15 + Waveshare 3.52" stack is unaffected.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of every `_ops/idea-vault/*.md`.

**No parked ideas unblocked.**

One deserves an explicit non-unblock so a future run does not re-litigate it:

- **Idea:** Haptic Mirror — D4RT scene reconstruction
- **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
- **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world
  reconstruction tooling that lets you generate training scenarios from short video captures"*
- **What changed:** an MIT-licensed 3DGS tool shipped this window.
- **Why it does not count:** the blocker requires **reconstruction from video**. The KIRI plugin is a
  **renderer/compositor** for splats that already exist — it consumes `.ply`, it does not produce it.
  The capture side of KIRI's stack is their commercial phone app, not open source.
- **Recommended action: WAIT.** Unchanged.

Every other vault entry is blocked on market, money, or time. `3rdrider-snap-spectacles.md` remains
blocked on the **<$800** price conjunction — the Catalyst closure above narrows the routes around it
but does not touch the stated blocker. **WAIT.**

---

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24**.
- **Process, third consecutive run.** The two prior runs found misses in the *named-target* sweep and
  the fix was to convert named targets into fetch-and-diff checks. That fix paid off today: the Snap
  version diff and the two `gh api` org checks each took seconds and each produced a defensible
  "unchanged." Today's miss is a different class — a **dated deadline sitting in prose** in
  `TECH_SCOUT_CONFIG.md` §4, which the scout read as a to-do rather than as a countdown.
  **Recommended config change:** move §4's dated action items into a checked list with explicit expiry
  dates, and have each run assert whether each date is still in the future. Item #1 is now expired and
  should be struck rather than left as an unchecked box implying it is still actionable.
