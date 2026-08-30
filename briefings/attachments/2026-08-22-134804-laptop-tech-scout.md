# Tech Scout Report — 2026-08-22

**Window:** 2026-08-20 → 2026-08-22 (normal daily cadence; prior report 2026-08-20). No major
industry event in-window (next: Snap SPECS launch **Sep 16**, Meta Connect **Sep 23–24**).

**Verdict: one item that matters, and it is a big one.** **`arrival-space/splat.js`** puts the
**entire** Gaussian-splat pipeline — SIFT structure-from-motion *and* 3DGS training — **inside a
browser tab on WebGPU, MIT-licensed, no server, no upload, no account**, and it runs on **iPhone
Safari**. Its poses are **pixel-identical to COLMAP** on Tanks & Temples *Truck*, and it scores
**25.61 dB PSNR vs. vanilla 3DGS's 25.18** on the standard held-out protocol. Two days ago this
report called Scantic's on-device iPhone training the capture unblock; **Splat.js is strictly
better for this portfolio** — MIT instead of €29.99/yr, cross-platform instead of iOS-only, and it
runs in **the same runtime MedSim-Game already ships in**. Also in-window: **a new MCP roadmap**
(today) and an **OpenAI GPT-5.6 Sol price cut**. Everything else is flat.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- **Nothing shipped in-window. All per-run checks flat:**
  - **Snap Newsroom — flat.** Newest post still **07.31.26**; SPECS launch post 07.30.26 unchanged.
    **Zero August posts, 22 days running.** [newsroom.snap.com](https://newsroom.snap.com/)
  - **Lens Studio — 5.23.2, unchanged** (Aug 17). [ar.snap.com/download](https://ar.snap.com/download)
  - **Android XR / XREAL Project Aura / Catalyst — no update.** Aura still "before end of 2026";
    Catalyst still closed.
- 📌 **SPECS price now pinned: $2,195**, pre-orders opened June, ship US/UK/France this fall, exact
  ship date expected at the **Sep 16, 7PM ET Los Angeles** event (livestream `specs.com/launch`).
  [newsroom.snap.com/specs-launch-date](https://newsroom.snap.com/specs-launch-date) ·
  [Engadget](https://www.engadget.com/2227433/snap-ar-specs-launch-date-september-event/)
  ⚖️ **This settles `3rdrider-snap-spectacles.md` for SPECS specifically: $2,195 is 2.7× the <$800
  blocker.** SPECS will not unblock that idea at launch. Stop treating Sep 16 as a potential unblock
  date; it is a spec-and-SDK information event only.
- ⛔ **Viture Pro 2 ($299, shipped August) — checked, does not qualify.** Surfaced again in the AR
  sweep. Already swept and rejected on **08-09 and 08-16** (3 prior hits). It is a **birdbath display
  accessory** — a 146" virtual screen at 63 g — **not** camera+display AR glasses with a spatial SDK.
  The `3rdrider` blocker requires on-device camera+mic+display **and a developer SDK**. Do not
  re-chase; it will keep resurfacing in price-sorted "smart glasses" queries.

### Spatial Computing / 3D — the substantive section today

1. 🔥🔥 **`arrival-space/splat.js` — full Gaussian-splat training in a browser tab. MIT. Verified.**
   [github.com/arrival-space/splat.js](https://github.com/arrival-space/splat.js) ·
   live demo **https://arrival.space/splat-js** ·
   covered by [Radiance Fields, Aug 21](https://radiancefields.com/)
   - **Repo verified directly:** MIT license, created **2026-08-19**, **36 stars**, pushed **today**.
     ⚠️ **Zero releases and zero tags — commit-monitored, like faster-GS.**
   - **What it actually does, end to end, in one tab:** photographs in → camera poses solved → 3DGS
     trained against your photos → **standard INRIA-layout `.ply` out**. *"No server, no upload, no
     account, no build step — vanilla ES modules on WebGPU."*
   - **Structure-from-motion in JavaScript:** scale-space SIFT (worker pool), GPU brute-force
     matching, incremental registration with interim bundle adjustment, sparse Schur BA with shared
     focal + radial distortion. **Poses are pixel-identical to COLMAP's** on the full *Truck* scene
     (0.00% of path length).
   - **The trainer:** anisotropic Gaussians, global sorted binning, SH degree 2 default, **MCMC-style
     relocation and growth**, Mip-Splatting opacity compensation, FD-validated analytic gradients.
     **Scales past 1,000,000 splats.**
   - **Measured against the literature, same protocol** (every 8th of 251 *Truck* images held out;
     1M splats, 100k cycles, ~18 min in one tab on a desktop NVIDIA GPU):

     | method | Truck test PSNR |
     |---|---|
     | 3DGS (SIGGRAPH 2023) | 25.18 dB |
     | **Splat.js — in a browser tab** | **25.61 dB** |
     | Mip-Splatting (CVPR 2024) | 25.74 dB |
     | 3DGS-MCMC (NeurIPS 2024) | 26.11 dB |

     It beats the reference implementation while running **1M splats at SH degree 2 against the
     published methods' 2–2.6M at degree 3, on native CUDA.**
   - **Requirements: any WebGPU browser — Chrome, Edge, Firefox, and Safari, iPhones included.**
     **Installs as a PWA** (Add to Home Screen) so the capture tool gets its own icon and window.
     Input: **20–200 overlapping photos**, dropped in or captured straight from the device camera.
   - **Video input exists in the library (`extractSharpFrames`) but is switched off in the app** until
     frame selection meets their quality bar. Note this precisely — it is the difference between
     "photo capture" and the video→scene path `haptic-mirror-d4rt.md` actually asks for.
   - **Shipping hard right now** — today's commits alone: **LOD training + streamed-SOG export**
     (opt-in, ≥1M budgets), **in-browser SOG export** (vendored splat-transform, GPU k-means),
     **360 panoramas end-to-end** (header-sniff detection, slicing, auto rigs), GPU matcher limits raised.
   - **Same org also maintains `spz-js`** (MIT, 82★, SPZ↔PLY conversion, pushed Aug 21).

2. **`MrNeRF/LichtFeld-Studio` — heavy Aug 21–22 run, still no release** (last tag **v0.5.3, Jun 24**).
   [github](https://github.com/MrNeRF/LichtFeld-Studio)
   - **#1780 "GUT training: all SH degrees, 25% faster"** (Aug 22) — a real training-throughput win,
     not lifecycle housekeeping.
   - **#1773 measurement tool with translate gizmo in the HTML viewer export** + **#1778** input/resource
     fixes (Aug 22). 📌 **Note for MedSim: the HTML viewer export now measures distances** — that is
     the difference between a splat as scenery and a splat you can dimension a treatment bay in.
   - **#1775 Morton reorder kept in place for exportable splat storage** (Aug 21).
   - Read against the 08-18 SuperSplat publishing API: this tool keeps hardening its **export** side.

3. **MSD PointCloudSnapPro adds Gaussian splats to Maya 2026** (Aug 21) — loads splat PLY into the
   Maya viewport, snaps geometry onto splat surfaces with **no proxy mesh**, renders through Arnold.
   [radiancefields.com](https://radiancefields.com/) DCC-pipeline scope; no portfolio path. Log, ignore.

4. **`nerficg-project/faster-gaussian-splatting` — no new commits.** Newest still **Aug 20** (#11
   warp-level culling), already reported. Still zero releases.

5. **SuperSplat release tags — still stop at v2.32.3 (Jul 26).** Consistent with the 08-20 finding
   that the publishing API cut no tag.

6. **DeepMind D4RT — flat, week 15.** [OpenD4RT](https://github.com/Lijiaxin0111/Open-d4rt) last
   commit **Aug 12**. Official code: still none.

7. **World Labs / Marble release notes — flat** (newest 2026-04-02). **SpAItial blog — flat**
   (newest Echo-2, 2026-04-28), re-verified via `curl`+UA per the 08-20 method fix — **the fix works.**

### AI / ML
- **The New MCP Roadmap — published today, 2026-08-22 09:00 UTC**, by David Soria Parra and Den
  Delimarsky (Lead Maintainers).
  [blog.modelcontextprotocol.io/posts/mcp-roadmap](https://blog.modelcontextprotocol.io/posts/mcp-roadmap/)
  ✅ **The per-run MCP blog diff caught this on the day it landed** — the check added on 08-06 after
  the nine-run spec miss is now paying out. Five priority areas:
  1. **Agentic messaging primitives** — **server-initiated events (webhooks and channels)**, Tasks
     extension maturation (**SEP-2663**), *"streams can push streamed results, and there is a clear
     need to steer work mid-flight."* Owned by Agents, Transports, and Triggers & Events WGs.
  2. **HTTP-native transport unification** — standardize on HTTP across deployment modes, **including
     local servers using Streamable HTTP over stdio.**
  3. **Agent identity + enterprise security** — **DPoP**, Workload Identity Federation, standard token
     exchange **instead of API keys**; engaging OAuth standards bodies and WIMSE.
  4. **Improved primitives** — standardized response formats, **progressive discovery** so growing tool
     catalogs don't overwhelm models upfront.
  5. **SDK developer experience** — ergonomics, conformance testing, docs.
  - Scale context from the post: **~half a billion SDK downloads/month**; TypeScript and Python SDKs
    each crossed **1 billion total downloads**.
  - 📌 **Direction, not an artifact — no dates, no spec revision.** Report it as a roadmap; do not let
    it re-enter a later run as a shipped feature.
- **OpenAI GPT-5.6 Sol price cut — Aug 21.**
  [changelog](https://developers.openai.com/api/docs/changelog). **$4 / $20 per 1M tokens** — **20%
  lower input, 33% lower output**. **Promotional, guaranteed at least through 2026-11-21.** Note the
  expiry; this is a discount with a date, not a new list price.
- **OpenAI — regional processing per request** (Aug 21): select regional processing for an individual
  request via a prefixed domain, with an API key from a **Global-geography** project. Existing
  eligibility and data-retention rules still apply. ⚖️ **Worth remembering for any future EU-user
  MedSim decision** (see §E note below) — it is a data-residency lever at request granularity.
- **OpenAI — `gpt-image-2` transparent backgrounds in preview** (Aug 20): `background=transparent`,
  **PNG or WebP only, JPEG unsupported**. Small but directly usable for UI/prop asset generation.
- **HF author sweeps — all flat vs. 08-20:**
  - `zai-org` newest = **GLM-5 (Aug 11)**. 🔴 **GLM-5.3 weights still NOT published** — `?search=GLM-5.3`
    returns only **three third-party name-squats** (`audnai/…-abliterated`, `manakanemu/glm5.3`,
    `MaliAir/…-GGUF`), none from `zai-org`. Per the 08-05 method rule, a quant/derivative repo naming
    a base model is **not** evidence the base shipped. **Target ≈Aug 28, 6 days out.**
  - `Qwen` newest = **Qwen3.8-27B / -FP8 (Aug 14)**; `Qwen3.8-2.4T-A95B` + FP8 at Aug 12. Flat.
  - `deepseek-ai` newest = **V4-Pro-0813 (Aug 13)**. Flat.
- **Anthropic news — flat** (newest **Aug 14**). **Google Developers Blog — flat.**
  **`agentplugins/agent-plugins-spec` — still zero release tags, zero git tags.**

### Hardware
- **Nothing shipped in-window.** Boox **Palma 3 / Note Air6 C / Note Mini C / Tab Elite / Picco** all
  still absent from the storefront. Jetson T-series still Q1 2027. No Unitree / Figure / Optimus SKU
  or price move.

### Medical / Clinical AI — §D competitive set, first run with the new row
- **No competitor product shipped in-window.** [healthysimulation.com](https://www.healthysimulation.com/)
  swept via `curl`+UA (**it 403s WebFetch — add to §5 fetch-hostile list**). In-window posts are
  **Aug 21 media-partnership announcement (GNSH)**, **Aug 20 "Beginner's Guide to Writing Healthcare
  Simulation Scenarios"**, **Aug 19 Lecturio sponsored piece**. Trade content, not releases.
- ❌ **"Oxford Medical Simulation Announces New Multiplayer Platform for IPE" — FALSIFIED as news.**
  Surfaced high in the §D sweep and looked like a second SimX-class miss. **The article's
  `datePublished` is 2020-01-13** (`dateModified` 2025-06-04). It is a six-year-old page ranking on a
  fresh query. **Do not re-chase.** ⚠️ **This is the failure mode the new §D row will produce most
  often** — vendor-name queries surface undated evergreen vendor pages. **Always read
  `datePublished` from the page JSON-LD before writing a §D item up.**
- **SimX — no new announcement** since the Aug 12 Autonomous Simulation launch backfilled on 08-20.
  Note their **Scenario Editor** (no-code institutional scenario customization add-on) is a listed
  product; that is the same customization surface as `medsim-school-employer-custom-content.md`.
- **No FDA clearances in-window.** UpDoc **K253281** remains the sole patient-facing-LLM 510(k).
  NVIDIA `isaac-for-healthcare`: newest push `i4h-workflows` **Aug 11**, no release. **MONAI still 1.6.0.**
- ⚠️ **Standing correction, restated because a search summary reasserted it today:** the claim that
  *"most high-risk EU AI Act obligations take effect August 2026, full medical-device compliance
  August 2027"* is **wrong and superseded** by the Digital Omnibus — **high-risk standalone → December
  2027; high-risk AI inside MDR/IVDR products → 2028-08-02.** Config §E carries the correction, but
  **the 08-16 report restated the old dates**. The stale version is what search engines return. Do not
  copy it forward.

---

## Nothing New (Watchlist)
- **Snap SPECS launch** — **Sep 16, Los Angeles (25 days)**, **$2,195 confirmed.** Only dated AR event.
- **Meta Connect** — **Sep 23–24 (32 days)**; Ray-Ban Gen 3 expected.
- **Z.ai GLM-5.3 open weights** — **≈Aug 28 (6 days).** Probe on the date; log any slip explicitly.
- **DeepMind D4RT official code** — **week 15.**
- **Apple Foundation Models framework open-source** — WWDC promise, **week 11**; "summer" is nearly gone.
- **Meta Muse Spark 1.2 open weights** — committed, no date.
- **Alibaba Qwen3.8-Max full weights** (vision + 1M ctx) — partial only. 🔴 **License prohibition
  (USA/EU/UK/KR) still unclarified — read the LICENSE before any work.**
- **SuperSplat Publishing API pricing/plan tier** — still unstated (open since 08-18).
- **Splat.js first release tag** — 🆕 zero tags as of today; commit-monitored.
- **OpenAI Ultrafast tier GA** — limited preview since Aug 13. **GPT-5.6 Sol promo pricing expires
  ≥Nov 21** — 🆕 dated, watch it.
- **Radiance Fields newsletter** — next issue ~Sept 1.
- **Genie 3 developer API** — Ultra-only. **Onyx Boox Palma 3 / Note Air6 C / Note Mini C / Tab Elite /
  Picco** — all unshipped. **Cursor Origin GA**, **NVIDIA GR00T N2**, **Mayo + Microsoft healthcare
  model**, **Android XR Catalyst second cohort**, **agent-plugins client reader** — unchanged.

---

## Project Impact

**MedSim-Game (flagship) — one item, and it changes the recommendation made two days ago.**

**Splat.js supersedes Scantic as the right capture leg.** The 08-20 report recommended capturing a
real clinical space with Scantic (iOS-only, €29.99/yr or €4.99/scan for full-quality export) and
pushing it to SuperSplat. Splat.js is better on every axis that matters here:

| | Scantic (08-20 rec) | **Splat.js (today)** |
|---|---|---|
| License / cost | proprietary; €29.99/yr or €4.99/scan for full export | **MIT, free, no tiers** |
| Platform | iOS 17+, A12+ only | **any WebGPU browser — desktop, Android, iPhone Safari** |
| Runtime | native app | **the browser — the runtime MedSim already ships in** |
| Output | PLY (SPZ planned) | **INRIA PLY + in-browser SOG export (as of today)** |
| Integration | export → upload | **embeddable ES modules in the web client** |

**Revised concrete next action:** open **https://arrival.space/splat-js** on the phone, capture
**20–200 overlapping photos** of one real clinical space (an ambulance box, a treatment bay, a sim
lab), train it in the tab, export the PLY. **Cost $0, no account, no install, and it answers the same
question the 08-20 spike was meant to answer** — does a splat interior beat a hand-authored GLB for
MedSim — without spending the €4.99 or committing to an iOS-only tool. Compare against the existing
`?clinic` SketchUp conversion (4.74 MB draco). This does **not** replace the R2 asset CDN or the
placement pipeline; it is still a source-of-geometry experiment.

Two second-order notes: **LichtFeld-Studio's new HTML-viewer measurement tool** (Aug 22) means a
captured bay can be **dimensioned**, not just looked at — relevant if splat interiors ever need to
host collision or placement. And **Splat.js being MIT and ES-module** means the capture tool could
eventually live *inside* MedSim rather than beside it — that is a real option, not a plan; do not
scope it yet.

**MCP roadmap:** no action. **Server-initiated events** and **progressive discovery** are the two
areas that would eventually touch the MedSim tooling surface; both are direction, not spec.
**GPT-5.6 Sol price cut:** noted — MedSim's LLM-NPC path is Claude-based; relevant only as a
market-price data point, and it expires Nov 21.

**haptic-mirror (parked):** see Parked Idea Unblocks — moved again, and more cleanly than on 08-20.

**3rdrider (parked):** ⚖️ **negative result worth stating.** SPECS is **$2,195**, versus the vault's
**<$800** blocker. Sep 16 will not unblock this idea. Viture Pro 2 at $299 is a display accessory
with no spatial SDK. **There is still no product on the board that satisfies this blocker, and the
one dated event on the calendar has now been priced out of it.**

**MedCapture / BadgeMedia / SW_Billing:** no impact this window.

---

## Parked Idea Unblocks

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world
    reconstruction tooling that lets you generate training scenarios from short video captures"*
  - **What changed:** **Splat.js (MIT, 2026-08-19, verified on GitHub today)** is the cleanest match
    the blocker's second clause has ever gotten: **literally open-source** (MIT, not a freemium app),
    **reconstruction from your own captures**, **COLMAP-identical poses**, **PSNR above the 3DGS
    reference**, running with **no server and no account** on hardware already owned. On 08-20 this
    clause was answered by Scantic (proprietary, iOS-only) plus GaussianSplatting.jl (Apache-2.0 but
    desktop Julia); **Splat.js is a better answer than both.**
  - **⚠️ But read the blocker's exact words: "from short video *captures*." Splat.js's app takes
    photos, not video.** Video decoding exists in the library (`extractSharpFrames`) and is
    **deliberately disabled in the app** pending frame-selection quality. So the *video* leg is
    **explicitly not shipped** — by the authors' own statement.
  - **Recommended action: REVISIT — still not PROMOTE.** Same verdict as 08-20, for the same honest
    reason, now with the boundary drawn more sharply. The blocker has two halves: **reconstruct a
    space** and **generate training scenarios**. The first half is now solved to a genuinely high
    standard, free and cross-platform. **The second half did not move at all** — a splat of a real
    room is a static reconstruction with no events, no state, and no physics. **D4RT is absent at week
    15**; Marble and Echo-2 are both flat. **The $0 Splat.js capture spike recommended for MedSim
    above serves this project too** — run it once, and the remaining blocker narrows honestly to
    "scenario generation," which is a cleaner and more watchable thing than the current compound
    phrasing.

- **Idea:** 3rd Rider on Snap Spectacles
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** *"Consumer AR glasses with prescription compatibility, on-device camera+mic+display,
    and developer SDK shipping at <$800"*
  - **What changed: nothing positive — record a negative.** SPECS is now firmly priced at **$2,195**,
    **2.7× the blocker**. **Recommended action: WAIT**, and stop holding Sep 16 as a candidate unblock
    date. It is an information event, not a price event.

- **All other 25 `_ops/idea-vault/*.md` `blocked_on:` fields checked — none satisfied.** No Genie
  multi-view export API (`ai-multiview-video-generator.md`); no Unitree Go2 →~$1K or G1 →~$10K price
  move (`ems-event-robot-fleet.md`); no change to any MedCapture-pilot-gated blocker (`medcapture-*`,
  `sim-lab-*`, `military-parallel-pipeline.md`); no change to the barad-dûr-v2-gated maker ideas
  (`display-cube-six-screens.md`, `swappable-shells-animated-screens.md`); the MedSim-internal
  blockers (`medsim-*`, `medical-mmo-open-world.md`) are all gated on product maturity, not on news.

---

## Config Amendments Recommended (do not apply without authorization)
1. **§2B — add `arrival-space/splat.js`** as a **commit-monitored** row (zero tags; a releases-only
   check reads empty, same as faster-GS). Watch for: a **first release tag**, and the **video-input
   path (`extractSharpFrames`) being enabled in the app** — that second one is the exact event that
   would move `haptic-mirror-d4rt.md` from REVISIT toward PROMOTE. Also add sibling `arrival-space/spz-js`.
2. **§5 — add `healthysimulation.com` to the fetch-hostile table.** 403s WebFetch; `curl`+browser UA
   returns 200 (confirmed today). Without this, the §D row added on 08-20 fails silently on its first run.
3. **§D — add a method line: read `datePublished` from JSON-LD before writing up any vendor item.**
   The Oxford Medical Simulation "announcement" that surfaced today is dated **2020-01-13**. Vendor-name
   queries rank evergreen pages; the §D row will generate this false positive repeatedly.
4. **§A — record SPECS at $2,195** against the `3rdrider` <$800 blocker so future runs don't
   re-evaluate Sep 16 as a possible unblock.
5. **Standing note (carried from 08-20, reinforced):** search summaries today reasserted the
   **superseded EU AI Act dates** that config §E already corrects. A corrected fact is not
   self-enforcing — §E must be read, not remembered.
