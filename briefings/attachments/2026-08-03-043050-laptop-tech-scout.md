# Tech Scout Report — 2026-08-03

**Window:** 2026-08-02 → now (normal 24h daily cadence). Prior report: `scout-2026-08-02.md`.

## Verdict

**Nothing shipped in the focus areas in the 24-hour window.** Third consecutive empty day. No AR
hardware, no SDK, no model release, no 3D tooling drop, no medical-sim vendor drop. Per the
daily-cadence rule that is the report, and this run does not pad it.

Two things this run produced, both from spending a thin day on verification instead of padding:

1. **Config §4 item "Verify MedCapture pipeline uses high-res Claude Opus image inputs" is a false
   premise.** MedCapture contains **zero** Claude/LLM API calls — it is a dataset-capture station,
   not an inference pipeline. Nothing to verify. Restated correctly below.
2. **One minor in-window PyPI upload** (`gaussian-splatting` 2.6.5), reported honestly as a
   third-party maintenance fork on a near-daily cadence — **not** a canonical drop.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Nothing new.** Lens Studio version diff run per config: **5.23.0 (July 28), unchanged for the
  fifth consecutive run**; Spectacles (2024) line still pinned at **5.15.4**
  ([ar.snap.com/download](https://ar.snap.com/download)). The 5.23.0 line is SPECS 27-targeted.
- No movement from Snap, Meta, Samsung, Google, or XREAL in the window. Every Android XR result
  returned by search still resolves to **Google I/O, May 19 2026** — eleven weeks stale, already
  reported. Search also re-surfaced generic 2026 "smart glasses roundup" listicles (Samsung Galaxy
  Glasses "this summer," Warby Parker/Google, Snap Specs, XREAL Aura) — **all rumor-or-already-known,
  none a shipped product.** Rejected under the no-speculation rule.

### Spatial Computing / 3D

- **Nothing material.** Release-date check run against the GitHub API. Commits are not releases and
  are not counted:

  | Repo | Latest release | Last push |
  |---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-07-31 |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | 2026-08-03 |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | 2026-08-03 |
  | `nerficg-project/faster-gaussian-splatting` | **never** (push-monitored per config) | 2026-07-11 |
  | `nerfstudio-project/nerfstudio` | v1.1.5 — 2024-11-11 | 2025-07-29 |
  | `mkkellogg/GaussianSplats3D` | v0.4.7 — 2025-01-25 | 2025-10-19 |

  LichtFeld-Studio and the MCP servers repo both pushed **today** but neither cut a release —
  third day running. Noted so a future run does not read the push timestamp as a drop. The
  relocated `faster-gaussian-splatting` correctly read as push-only, no false "nothing new."

- **Minor, in-window, deliberately not inflated:** the PyPI package
  [`gaussian-splatting`](https://pypi.org/project/gaussian-splatting/) published **2.6.5 on
  2026-08-02T18:47Z** (2.6.4 landed 08-01, and 2.6.0→2.6.5 is six uploads in four days). This is
  **[yindaheng98/gaussian-splatting](https://github.com/yindaheng98/gaussian-splatting)** — a
  third-party "refactored python training and inference code" fork of the INRIA reference
  implementation, **not** an upstream release and not a new technique. Its release cadence is
  near-daily, so it will trigger on most runs. **Logged once, no action, and it should not be
  treated as news again unless a version introduces an actual capability.**

### AI / ML

- **Nothing new in-window.** Anthropic newsroom's latest is still **July 30** (cybersecurity evals) —
  unchanged for the fourth reading. Nothing August 1, 2, or 3. Prior posts: Jul 27 open-weights
  position, Jul 27 Cognizant, Jul 24 Claude Opus 5.
- **Gemini 3.5 Pro still not GA — eleventh consecutive miss.**
- **Genie 3 developer API — still none.**
- Search surfaced no model release dated August 2 or 3. Newest tracked open-weights drop remains
  **Kimi K3 (July 27)** — already outside every reporting window and never a portfolio dependency.

### Hardware

- **Nothing new.** No e-ink movement. Modos Flow remains a **December 10, 2026** ship date.
- **Unresolved, flagged rather than asserted:** a search result claims the **Modos Paper Monitor
  13" dev kit** (distinct from the Flow) is shipping on orders placed now. The Crowd Supply page
  **returns HTTP 403 to automated fetch**, so this could not be confirmed at the primary source and
  is **not** being reported as a fact. Added to the watchlist with an explicit note that this target
  needs a non-fetch verification path — per the standing rule that a date arriving via search
  summary does not enter a report unconfirmed.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all seven repos is
  still **`i4h-workflows` at 2026-07-28T17:24Z** — fourth identical reading. `Cosmos-H-Dreams`
  unchanged at 2026-07-27.
- **MONAI: no new release.** Still **1.6.0 (2026-06-11)**, last push 2026-08-01. Commits, not a release.
- Surgical world-model search returned **only arXiv papers and market-research PDFs** (Cosmos-Surg-dVRK,
  SurgWM, biomedical world-model surveys). No shipped tooling, no weights, no vendor drop. Not counted.

---

## Closed: config §4 "Verify MedCapture uses high-res Claude Opus image inputs" — false premise

Verified directly against the repo rather than assumed. **MedCapture has no Claude image pipeline to
verify, and neither does 3rdrider.**

- `grep` for `api.anthropic.com`, `messages.create`, `@anthropic-ai`, and `openai` across
  `/Users/jonathanbouren/PROJECTS/MedCapture/app/src` and `App.tsx` → **zero hits.** The only
  Anthropic reference anywhere in the repo is
  `/Users/jonathanbouren/PROJECTS/MedCapture/.github/workflows/claude-review.yml` — CI code review,
  not a product path.
- The same grep across `/Users/jonathanbouren/PROJECTS/3rdrider` → **zero hits.**
- MedCapture's own README states the scope plainly: *"iPad medication-preparation imaging station for
  building an IRB-approved, labeled image dataset."* Images go to SQLite and Supabase. **The
  defensible asset is the dataset; no model is called at capture time.** Per
  `/Users/jonathanbouren/PROJECTS/MedCapture/CLAUDE.md`, vision-model training is explicitly
  **3rdrider's** domain and out of MedCapture's boundary.

**What the item should have said.** The real, live constraint is on the *capture* side, and it is
already tighter than the model limit:
`/Users/jonathanbouren/PROJECTS/MedCapture/app/src/screens/CaptureScreen.tsx:42-45` sets
`QUALITY_GOOD_DIM = 1920` (full-HD-class min-dimension) and captures at JPEG `quality: 0.8`
(line 198); thumbnails at `0.7` (line 243). A 1920-min-dimension iPad capture is ~2–5 MP, which
**exceeds** Claude's ~3.75 MP high-res ceiling at the top end — meaning that when a model path is
eventually built, the question is **downscaling policy**, not whether resolution is sufficient.

**Restated as a forward-looking design note, not a verification task**, and moved to 3rdrider's side
of the boundary. Config §4 updated. **Do not re-open as a MedCapture verification item.**

---

## Nothing New (Watchlist)

Rolled forward:

- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly check, last
  done 07-30.
- **DeepMind D4RT** — week 15, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra.
- **Gemini 3.5 Pro GA** — missed, eleventh time.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through
  early September.
- **Snap Specs** — $2,195, fall 2026. Unchanged.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track still undisclosed.
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Modos Paper Monitor 13" dev kit** — **new entry.** Possibly shipping now; Crowd Supply 403s to
  fetch. Needs a verification path that is not WebFetch before it can be reported either way.
- **Android XR Catalyst second cohort** — no announcement. Monthly check.
- **`gaussian-splatting` PyPI (yindaheng98 fork)** — **new entry, suppression note.** Near-daily
  uploads; ignore unless a version ships an actual capability.

---

## Project Impact

**MedSim-Game (flagship) — no change.** The standing queued item is unchanged and still the
highest-value thing this scout tracks: **one bounded session evaluating NVIDIA's ultrasound
raytracing (Isaac for Healthcare) on a CUDA box before more hand-written POCUS slicer work.** The
license gate was removed 08-01 (Apache-2.0). Nothing today advanced or blocked it. It still competes
with the **Z-Anatomy voxelize-and-slice** plan recorded for POCUS v2, and the CUDA-box session is
what resolves that choice.

**MedCapture / 3rdrider — one config defect cleared, no work created.** The Claude-image-input
verification item was chasing a pipeline that does not exist. Removing it stops a recurring
false-todo; the genuine constraint (downscale policy at ~3.75 MP) is now recorded on 3rdrider's side
where the vision work actually lives.

**haptic-mirror — no change.** Reconstruction from short video captures is still the blocker.

**3rdrider (parked) — no change.** No camera + display glasses under $800 exist.

**SmartBadge — no change.** No confirmed e-paper movement; the Modos dev-kit lead is unverified.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**No parked ideas unblocked.**

Nothing in this window touched a technical blocker. `haptic-mirror-d4rt.md` remains WAIT (D4RT week
15, no code). `3rdrider-snap-spectacles.md` remains blocked on the **<$800 + on-device camera +
display + SDK** conjunction — today's AR search returned only unshipped 2026 roadmap items, none of
which satisfy it. `medcapture-hand-kinematics-robotics.md` and
`medcapture-humanoid-robot-extension.md` are unaffected by the MedCapture finding above; it clears a
config defect, not a blocker. Every other vault entry is blocked on market, money, revenue
milestones, or sequencing — none of which tech news can move.

---

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24.** Seven weeks out. Expect thin
  reports until then; that is the correct output, not a failure.
- **Process note added this run:** a target that publishes *constantly* is as corrosive as one that
  404s — it manufactures a "new release" every run and inflates thin days. The `gaussian-splatting`
  PyPI fork is now explicitly suppression-flagged, the mirror of the 08-02 `Faster-GS` fix.
- **Second process note:** a 403 is not a "no." The Modos dev-kit claim is parked as unverified
  rather than reported or dropped, because both would be wrong.
- **Config updated this run:** §4 MedCapture item struck as a false premise and restated as a
  3rdrider-side design note; §2B gains a suppression row for the `gaussian-splatting` PyPI fork.
