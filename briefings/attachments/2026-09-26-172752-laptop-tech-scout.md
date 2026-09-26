# Tech Scout Report - 2026-09-26

**Window:** 2026-09-24 → 2026-09-26 (2 days; daily cadence, no gap backfill required).
**Major event in window:** none. Meta Connect (Sep 23–24) was swept by the 09-24 report; Snap's Sep 17 SPECS block by the 09-20 report. No industry event landed in this window.

**Bottom line: one tracked item shipped, and it is the one this scout has been waiting on for three weeks.** **three.js r186 tagged Sep 24 with the native Gaussian Splat renderer** — the `§2B` row that said "report the r186 tag when it lands, then drop this row." It is on npm as `three@0.186.1`. Paired with a correction found this run — **`KHR_gaussian_splatting` is ratified, not the "Feb 2026 RC" the 09-21 report recorded** — MedSim now has a fully standards-based splat path inside the renderer it already ships. Three out-of-window misses are also backfilled below, one of them a mandated per-run check that failed six runs in a row.

## Breakthroughs & Releases Since Last Report

### Spatial Computing / 3D

**SHIPPED — the tracked item:**

- **three.js r186 — tagged 2026-09-24, published to npm as `three@0.186.1`.** — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186) · [migration guide r185→r186](https://github.com/mrdoob/three.js/wiki/Migration-Guide#185--186) — The native Gaussian-splat stack landed complete, not as a stub:
  - `GaussianSplat` (renamed from `GaussianSplatMesh`, #34306) — **TSL-based renderer/loader for WebGPU *and* WebGL** (#33950, @bhouston/@Mugen87)
  - `GaussianSplatPLYLoader` (#34278, #34292) — dedicated splat-PLY loader
  - `GLTFGaussianSplatLoaderExtension` — glTF splat import (#34205) with **view-dependent spherical harmonics** (#34215)
  - **Raycasting support** (#34284), per-mesh bounding box + **frustum culling** (#34254), RGBA8 packing in storage buffers (#34255), sort-invalidation fix for transforms (#34233)
  - **Why it matters:** raycasting and frustum culling are the two features that separate "can display a splat" from "can build an interactive scene on one." A splat scene is now hit-testable — which is the requirement for a walkable/clickable clinical environment, not just a backdrop. **Action detail: MedSim pins `three ^0.184`. A caret range on a `0.x` version does not cross the minor — `^0.184` will never resolve to `0.186`.** This is an explicit, deliberate bump, not something `npm update` delivers.

- 🔧 **CORRECTION — `KHR_gaussian_splatting` is RATIFIED, not a release candidate.** — [spec README](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_gaussian_splatting/README.md) — The extension's own `## Status` section reads **"Complete, Ratified by the Khronos Group."** Registry update commit **2026-09-03** ([#2642](https://github.com/KhronosGroup/glTF/commit)); editorial review closed 2026-04-15. **The 09-21 report recorded it as "(Feb 2026 RC) … unchanged," and the 08-31 report as "the substrate work."** Both carried the stale February press-release framing. A web search *still* returns "ratification expected in Q2 2026" from that Feb announcement — the primary source contradicts it. Contributors span Cesium, Niantic Spatial, Esri, NVIDIA, Huawei, Autodesk, Khronos.
  - **Why the pairing matters more than either item:** as of this report there is a **ratified open standard** for splats in glTF *and* a **first-party loader for it in three.js**. Marble/Atlas/SpAItial all export PLY and GLB. So the chain **capture → world model → ratified glTF splat → MedSim's existing renderer** is now closed end-to-end with zero third-party splat libraries. Standing guidance from 09-05 holds and is now unconditional: **do not add Spark or GaussianSplats3D.**

- **LichtFeld-Studio — genuine commits in window** (verified via `/commits`, per the §2B push-monitoring rule, not `pushed_at`): `Show VRAM by owner over time and report GPU memory like the driver` (#2466), `Reduce viewer VRAM` (#2463), `Release cached images when host memory runs low` (#2461), all 2026-09-26. **VRAM/memory-pressure work, no release tag.** Continues the "boring reliability tooling" phase. No action.
- **nerficg-project/faster-gaussian-splatting** — last commit 2026-09-21 (`Make Mip-Splatting 3D filter compatible with MCMC densification`); CUDA 13 build fix 09-19. No release (repo has never cut one). Nothing in window.
- **World Labs blog — no new post.** Baseline holds: newest = **Atlas, 2026-09-01**. Atlas remains early-access-only.
- **No D4RT code. No Genie API tier change. No WorldClaw release. No new SpAItial Echo model.**

### AR / Smart Glasses

- **Snap Newsroom — no new post since 2026-09-17.** Headline diff clean; the four Sep 17 SPECS posts (SPECS launch, Visionaries, SPECS Intelligence, SPECS for Enterprise) were captured by the 09-20 report. Per-run newsroom check: **pass.**
- 🔧 **BACKFILL — Lens Studio 5.24.0 shipped 2026-09-10 and was never reported.** — [ar.snap.com/download/v5-24-0](https://ar.snap.com/download/v5-24-0) — **Missed by six consecutive runs** (09-11, 09-14, 09-20, 09-21, 09-22, 09-24), all of which carried **5.23.2** as current. `grep -lF "5.24.0" scout-*.md` → zero hits. This is the exact failure the §2B row exists to prevent — it mandates a **per-run version-string diff** against `ar.snap.com/download`, and that diff was not performed. Contents:
  - **VFX optimized to use less CPU** — lenses with many VFX components stay performant on lower-powered devices
  - **Character Controller now uses synchronous raycasts** for collision/movement resolution
  - **New SPECS Account** — sign into Lens Studio with a SPECS developer account; on a Spectacles project the "My Lenses" menu becomes **SPECS DevPortal** (Login / Account / Log Out), with SPECS and Snapchat accounts signed in simultaneously
  - ⚠️ **Platform deprecation: 5.25 will be the final release for Intel Macs (macOS x86_64); 5.26+ requires Apple silicon.** 5.25 stays available for download. **No impact here — this machine is an Apple M4 (`arm64`).** Logged so it is not re-raised as a risk.
- **No new AR hardware in window.** Meta's Connect lineup ($249 Adventurer / $349 Audio / $449 Gen 3 / $799 Ray-Ban Display / $1,299 VR Glasses spring 2027) is unchanged from the 09-24 report. XREAL Aura still fall 2026. Snap SPECS still on fall shipping.

### AI / ML

Four items dated **Sep 23–24** were not covered by the 09-24 report, which swept Meta Connect plus the Sep 22 US frontier releases. Verified against the dated ledger. *(Method note: an earlier `grep -il "Ember-1"` appeared to show prior coverage — those were false positives matching "Sept**ember-1**0". Fixed-string grep confirms all four are new.)*

- **AionLabs Aion 3.5 and Aion 3.5 Mini — Sep 23, API live.** Aion 3.5 at **$3.00 / $6.00 per MTok**; Mini at **$0.70 / $1.40**. Available via the AionLabs models API and OpenRouter. — [dated ledger](https://www.digitalapplied.com/blog/ai-model-releases-september-2026-tracker) — **Unusual pricing shape: only a 2× in/out spread**, where the field runs 4–5× (Opus 5.5 is $4/$20). For output-heavy generation that ratio matters more than the headline input price.
- **Fireworks Ember-1 — Sep 23, research preview.** **$3 / $15 per MTok, cached input $0.30.** On Fireworks serverless and OpenRouter. — same ledger — Research preview; not a production dependency.
- **Black Forest Labs FLUX 3 Action — Sep 23, open weights.** **Three open-weight checkpoints on Hugging Face** under BFL's FLUX Kommunity license; no API price. — same ledger — ⚠️ **Read the FLUX Kommunity license before any portfolio use.** BFL's prior licenses have restricted commercial use; "open weights" is not "usable in a product." Not verified this run.
- **Google Gemini 3.8 Live with Live Avatar — Sep 24, Gemini Enterprise only.** No published pricing. — same ledger — **This is a feature on an existing model, not a model release.** Enterprise-gated, so out of reach at the current autonomy budget. Logged.
- **No model releases dated Sep 25 or Sep 26** in the ledger (refreshed Sep 25). Confirms a genuinely quiet two days at the frontier.
- **Qwen — no Qwen 4, and nothing in window.** `?author=Qwen&sort=lastModified` newest is **`Qwen/Qwen-Image-2.1` (2026-09-21)**, with `-PE-I2I` / `-PE-T2I` variants 09-20 — all predate the 09-24 report and are image models, outside the portfolio's text/clinical path. `?search=Qwen4` returns only unrelated third-party `qwen-4B` repos, **zero Qwen-authored**. `Qwen3.8-27B` weights have been live since 2026-08-14.

### Medical Simulation Vendors

- 🔧 **BACKFILL — `monai-physio` cut its first releases and they were never reported.** — [repo](https://github.com/Project-MONAI/monai-physio) · [docs](https://project-monai.github.io/monai-physio/) — **`2026.09.0` (Sep 14)** and **`2026.09.1` (Sep 22)**, and **PyPI now carries `monai-physio` at `2026.9.1`** (`physiotwin4d` is frozen at `2026.8.0`). The **09-05 report predicted this exact event** — *"PyPI `monai-physio` does not exist yet … expect a renamed release"* — and no run since checked. In-window commits: `ENH: Release 2026.09.1` (#146), `registrar/segmenter factories, Tutorial 00` (#145, Sep 21), `NV-Segment-CT, pretrained weights, lung tutorial fixes` (#144, Sep 17), `2026.09.0 Migration Guide` (#143).
  - **Why it matters:** the MONAI-branded personalized-physiological-digital-twin package is now **pip-installable with pretrained weights and a migration guide** — it graduated from a renamed research repo to a released artifact. Apache-2.0, non-clinical disclaimer intact. The 09-03/09-05 doc-read recommendation stands and is now cheaper to act on.
- 🔧 **BACKFILL — `i4h-digital-twin v0.8.0` (Sep 2) was never reported.** 24 days old, logged for completeness.
- ✅ **`pushed_at` trap caught again, same repo.** `i4h-digital-twin` reports `pushed_at = 2026-09-23T00:55Z` while its newest commit is **2026-09-02**. `/events` shows the 09-23 activity is **one PushEvent plus four DeleteEvents** — release-candidate branch cleanup. A `pushed_at` read would have reported three weeks of phantom work. The §2B rule held.
- **MONAI core** pushed 2026-09-26 (routine); `MONAILabel` 09-22. **Siemens Healthineers / GE HealthCare newsrooms: nothing.**
- **Isaac for Healthcare:** `Cosmos-H-Dreams` pushed 09-22, `i4h-workflows` 09-21 — both predate last report's window; no releases, no tags.

### Hardware

- **Nothing.** No new dev boards, LiDAR modules, edge-compute drops, or e-ink SKUs in window. Onyx Boox Picco (3.97", ~$100, ~November) unchanged since the 09-11 firming; no Palma 3 or X6 movement.

## Nothing New (Watchlist)

- **Meta Wearables DAT public publishing.** THE remaining gate for 3rdrider. Still Developer Preview post-Connect. **96 days left in the year.**
- **DeepMind D4RT code.** Week 20+; no drop.
- **Genie 3 developer API.** Still Ultra-only ($250/mo, above the $200/mo autonomy gate).
- **Gemini 3.5 Pro GA.** Week 19+; no endpoint, no price.
- **World Labs Atlas public API.** Early-access form only.
- **Alibaba Qwen 4.** Still "in training." No specs, pricing, or date.
- **Apple Foundation Models open-source.** Week 15; no drop.
- **Meta Muse Spark 1.2 open weights.** Day 54+.
- **Tencent WorldClaw code.** Still README-only.
- **Anthropic Sonnet 5.5 / Haiku 5.5.** Signalled "within weeks" on Sep 22; not shipped.
- **xAI Grok 4.7/4.8.** Not shipped.
- **Jetpack Compose for XR beta.** Not announced.
- **Samsung/Google Android XR glasses.** Fall 2026 window open, no ship. Color-display Samsung variant reported as late 2027.
- **Android XR Catalyst second cohort.** No announcement.
- **Cursor Origin GA.** Waitlist; **47 days** to the Nov 12 OpenAI cutoff.
- **NVIDIA GR00T N2 / Jetson T3000/T2000.** End-of-year and Q1 2027.
- **Mayo + Microsoft healthcare model.** 16+ weeks, no delivery.
- **Gaussian Splatting Newsletter** (`radiancefields.substack.com`). Cadence broken since Aug; lagging digest only, not a news source.
- **FDA GenAI docket FDA-2026-N-7874.** ⏰ **T-23 (Oct 19).** Unchanged recommendation: file the comment.
- **World Labs $5 video→world test.** Still unspent. Now materially more valuable than when logged — see below.

## Project Impact

- **MedSim-Game (flagship).** The r186 + ratified-`KHR_gaussian_splatting` pairing is the actionable item of this report. Concretely: (1) bump `three` from `^0.184` to `^0.186` **explicitly** — the caret will not do it for you — and read the [r185→r186 migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide#185--186) first, since r186 also removed deprecated code globally (#33880) and changed render-target viewport pixel-ratio scaling (#34333), neither of which is splat-related but both of which can bite an existing scene; (2) splat scenes are now **raycastable and frustum-culled**, so a captured real clinical room can be an interactive scene rather than a skybox — this is the first time the `?clinic` / ERRoom walkable-scene work has a non-mesh path; (3) **do not add a third-party splat library.** Secondary: nothing in this window changes model-cost posture — the Opus 5.5 cache-read cut ($0.20/MTok) and GPU-6 Luna bulk tier from 09-24 remain the live recommendations. **Standing: file the FDA GenAI docket comment, T-23.**
- **haptic-mirror (parked).** Blocker unchanged on its face — still no D4RT — but the *consumption* half of its pipeline just became standard. See Parked Idea Unblocks.
- **3rdrider (parked).** No change since 09-24. Ray-Ban Display is orderable at $799; publishing is still gated. The Lens Studio 5.24.0 backfill adds a **SPECS DevPortal login** to the Spectacles path, which is a developer-ergonomics improvement on the route the 09-24 report already recommended *against* taking (SIK rewrite) in favour of the Ray-Ban Display web-app port. No re-ranking.
- **MedCapture / BadgeMedia.** No change in window.
- **Tooling hygiene.** `monai-physio` being pip-installable is the cheapest item on this report to act on if the physiological-clone vocabulary mapping is wanted: `pip install monai-physio` now resolves.

## Parked Idea Unblocks

- **Idea:** Haptic Mirror — VR training scenes from short video captures (D4RT-gated)
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"*
  - **What changed:** not the reconstruction half — **the delivery half, which the blocker text never separated out.** The blocker's `next_action_if_pursued` is literally *"capture short video → generate a Gaussian Splat scene → use as VR training environment."* Step 2 was already covered by Marble's documented video→world path (established 2026-08-08, corroborated at the API level: video-prompt limit raised to 100MB). **As of this report step 3 is covered too, by a ratified standard rather than a vendor SDK:** `KHR_gaussian_splatting` is ratified, three.js r186 loads it natively from glTF with spherical harmonics, and splats are raycastable and frustum-culled. Marble exports PLY and GLB. There is no longer a missing link between "captured room" and "interactive scene in a browser engine this portfolio already ships."
  - **Recommended action:** **REVISIT — and rewrite the blocker, because as written it is now misleading.** D4RT is not required and has not been required since August; the entry has been waiting on a specific vendor's code release while a standards-based path assembled itself underneath. Two concrete moves: (1) **spend the $5.00 World Labs minimum** — already an open §4 action item, and it is now the single remaining unknown in the chain rather than one of three; (2) restate `blocked_on:` to what is actually left, which is **not tooling at all** — it is *"no validated procedure/customer for a VR training scene; capture→scene→render pipeline is available as of 2026-09-26."* That converts a tech blocker into a demand blocker, which is an honest downgrade, not a promotion.

- **Idea:** AI multi-view video generator
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** two paths — *"(a) wait for Genie 3 (or competitor) to expose multi-view export as a public API … (b) build it from existing 3D primitives (Blender / Gaussian Splatting / NeRF) … but requires display-cube-six-screens to exist first."*
  - **What changed:** path (a) was already satisfied by the World Labs World API (found 2026-08-05, self-serve since 2026-01-21) and promoted 2026-08-06. This report strengthens **path (b)** specifically: the Gaussian-Splatting leg now has a ratified interchange format and a first-party three.js renderer with raycasting, so six-view rendering off a splat scene needs no custom viewer.
  - **Recommended action:** **WAIT — unchanged, and the reason is not technical.** Path (b)'s real gate is `display-cube-six-screens.md`, which is itself gated on barad-dûr v2 and on the recreational-project slot being occupied. **Better tooling does not clear a slot-discipline blocker.** No promotion; noted so a future run does not re-promote it on tooling news alone.

- **All other parked ideas: no in-window developments.** `3rdrider-snap-spectacles.md` remains **REVISIT** per 09-24 (blocker text satisfied; publishing GA is the real remaining gate — the rewrite recommended in that report has not been applied to the file yet). `ems-event-robot-fleet.md` remains **WAIT** (no Unitree pricing movement). The eleven MedCapture/MedSim/sim-lab/military entries are gated on **pilot sites, papers, and product validation** — commercial and time blockers that no technology release can move. `regional-ems-ecosystem-simulator.md` has **no `blocked_on:` field at all** — worth adding one so it participates in this cross-reference instead of being silently skipped every run.

## Process Notes (for the next run)

- ✅ **DROP the `three.js releases` row from `§2B`.** Its stated exit condition — "report the r186 tag when it lands, then drop this row" — is met.
- 🔴 **The Lens Studio per-run version diff was not being performed.** Six consecutive runs carried 5.23.2 while 5.24.0 had been live since Sep 10. The §2B row already warns *"do NOT rely on a news query — this is how 5.23.0 was missed on 07-29."* The same row failed the same way for a second time. **Correct baseline: 5.24.0 (2026-09-10).** Next run must diff against that string, and the check must be a fetch of `ar.snap.com/download`, not a search.
- 🔴 **A watch item this scout itself created went unchecked for six runs.** The 09-05 report wrote "expect a renamed release" for `monai-physio`; the release landed Sep 14 and was caught only today, by an org-wide push enumeration. **A prediction written into a report is not a tracked item** unless it is also in `TECH_SCOUT_CONFIG.md`. The MONAI row does say to enumerate the org by push date — that is what found it — but nothing said *"a release is expected, check PyPI."*
- ⚠️ **`grep -i "<name>"` produces false negatives-by-false-positive on version and date strings.** `grep -il "Ember-1"` matched "Sept**ember-1**0" and made a genuinely new model look already-reported; `grep -l "2026.09.0"` matched "2026-09-05" because `.` is a wildcard. **Use `grep -F` for every version string, model name with a hyphen, and date check.** Two near-misses this run traced to this.
- ⚠️ **A stale press release outranks the primary source in search.** `KHR_gaussian_splatting` ratification: every search result repeated February's "expected Q2 2026." The spec's own README said "Ratified." **For any standard's status, read the spec file, not coverage of the announcement** — consistent with the existing "Assert only what was fetched" rule, extended to *"and prefer the artifact over reporting about the artifact."*
