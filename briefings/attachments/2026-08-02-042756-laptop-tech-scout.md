# Tech Scout Report — 2026-08-02

**Window:** 2026-08-01 → now (normal 24h daily cadence). Prior report: `scout-2026-08-01.md`.

## Verdict

**Nothing shipped in the focus areas in the 24-hour window.** No AR hardware, no SDK, no model
release, no 3D tooling drop, no medical-sim vendor drop. Second consecutive empty day. Per the
daily-cadence rule that is the report, and this run does not pad it.

The one thing this run produced: **the `Faster-GS` 404 flagged yesterday is resolved.** The repo was
moved, not deleted — new canonical URL below, config corrected.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Nothing new.** Lens Studio version diff run per config: **5.23.0 (July 28), unchanged for the
  fourth consecutive run**; Spectacles (2024) line still pinned at **5.15.x**
  ([ar.snap.com/download](https://ar.snap.com/download)). The 5.23.0 line is SPECS 27-targeted.
- No movement from Snap, Meta, Samsung, Google, or XREAL in the window. Every Android XR result
  returned by search resolves to **Google I/O, May 19 2026** — eleven weeks stale, already reported.

### Spatial Computing / 3D

- **Nothing new.** Release-date check run against the GitHub API. Commits are not releases and are
  not counted:

  | Repo | Latest release | Last push |
  |---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-07-31 |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | 2026-08-02 |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | 2026-08-02 |
  | `nerfstudio-project/nerfstudio` | v1.1.5 — 2024-11-11 | 2025-07-29 |
  | `mkkellogg/GaussianSplats3D` | v0.4.7 — 2025-01-25 | 2025-10-19 |

  LichtFeld-Studio and the MCP servers repo both pushed **today** but neither cut a release. Noted so
  a future run does not read the push timestamp as a drop.

### AI / ML

- **Nothing new in-window.** Anthropic newsroom's latest is still **July 30** (cybersecurity evals) —
  unchanged from yesterday's reading. Nothing August 1 or 2.
- **Gemini 3.5 Pro still not GA — tenth consecutive miss.**
- **Genie 3 developer API — still none.**

### Hardware

- **Nothing new.** No e-ink movement. Modos Flow remains a **December 10, 2026** ship date.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all repos is still
  **`i4h-workflows` at 2026-07-28T17:24Z** — third identical reading.
- **MONAI: no new release.** Still **1.6.0 (2026-06-11)**, last push 2026-08-01. Commits, not a release.

---

## Closed: `Faster-GS` 404 — repo relocated, not deleted (carried from 2026-08-01)

`hahlbohm/Faster-GS` still returns 404. The project moved to a lab org:

**→ [`nerficg-project/faster-gaussian-splatting`](https://github.com/nerficg-project/faster-gaussian-splatting)**
· project page [fhahlbohm.github.io/faster-gaussian-splatting](https://fhahlbohm.github.io/faster-gaussian-splatting/)

Identity confirmed three ways, not inferred from the name: sole contributor is **`fhahlbohm`** (the
original owner), the description names the **CVPR'26 paper "Faster-GS: Analyzing and Improving
Gaussian Splatting Optimization"**, and the repo was created **2026-02-10**.

**Status: no releases, ever** — it is a research codebase tracked by commit, last pushed
**2026-07-11**. So the correct monitoring signal for this target is *push date*, not release tag; a
releases-only check on this repo will always read empty. Config updated accordingly.

---

## Nothing New (Watchlist)

Rolled forward:

- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly check, last
  done 07-30.
- **DeepMind D4RT** — week 14, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra (corrected 08-01).
- **Gemini 3.5 Pro GA** — missed, tenth time.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through
  early September.
- **Snap Specs** — $2,195, fall 2026. Unchanged.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track still undisclosed.
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Android XR Catalyst second cohort** — no announcement. Monthly check.
- ~~**`hahlbohm/Faster-GS` 404**~~ — **CLOSED**, relocated, see above.

---

## Noted, not new — Claude for Open Source (announced ~May 27, 2026)

Surfaced by search this run and **explicitly not counted as news** — it is ~10 weeks old. Logged once
because it is still open on a rolling basis and no prior scout report mentions it, then dropped.

6 months of free **Claude Max 20x** (~$1,200), **10,000 spots**, rolling review
([claude.com/contact-sales/claude-for-oss](https://claude.com/contact-sales/claude-for-oss) ·
[terms](https://www.anthropic.com/claude-for-oss-terms)).

**Honest read on eligibility: almost certainly no.** The stated bars are 500+ dependent repos, 100+
dependent packages, 200k+ monthly downloads, 100+ merged PRs in 12 months, or 20+ unique external
contributors. The portfolio's public repos (`m15-monitor-defib`, `pocus-ultrasound`,
`medsim-physio`) are solo, single-contributor, and unpackaged — none clears any bar. There is an
"Ecosystem Impact Track" for critical-but-invisible packages, which is not what these are.
**No action recommended.** Flagged only so a future run does not rediscover it and overstate it.

---

## Project Impact

**MedSim-Game (flagship) — no change.** The standing queued item is unchanged and still the highest
value thing this scout tracks: **one bounded session evaluating NVIDIA's ultrasound raytracing
(Isaac for Healthcare) on a CUDA box before more hand-written POCUS slicer work.** The license gate
was removed 08-01 (Apache-2.0). Nothing today advanced or blocked it. It still competes with the
**Z-Anatomy voxelize-and-slice** plan recorded for POCUS v2, and the CUDA-box session is what
resolves that choice.

**haptic-mirror — no change.** Reconstruction from short video captures is still the blocker.

**3rdrider (parked) — no change.** No camera + display glasses under $800 exist.

**SmartBadge — no change.** No e-paper movement.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**No parked ideas unblocked.**

Nothing in this window touched a technical blocker. `haptic-mirror-d4rt.md` remains WAIT (D4RT week
14, no code; Cosmos-H-Dreams is generative, not reconstructive — settled 08-01).
`3rdrider-snap-spectacles.md` remains blocked on the **<$800 + on-device camera + display + SDK**
conjunction. Every other vault entry is blocked on market, money, revenue milestones, or sequencing —
none of which tech news can move.

---

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24**. Seven weeks out. Expect thin
  reports until then; that is the correct output, not a failure.
- **Process note carried forward and applied today:** a named target that 404s reads as "nothing new"
  and hides misses. Yesterday's `Faster-GS` finding was resolved within one run by searching for the
  repo rather than the owner. The same failure mode applies to any target monitored by *release tag*
  that never cuts releases — `faster-gaussian-splatting` is now explicitly marked push-monitored in
  the config.
- **Config updated this run:** §2B `Faster-GS` row replaced with the live
  `nerficg-project/faster-gaussian-splatting` URL and a push-date monitoring note; §4 action item
  struck as closed.
