# Tech Scout Report — 2026-07-30

**Window:** 2026-07-29 → now (normal 24h daily cadence). Prior report: `scout-2026-07-29.md`.

## Verdict

**Nothing new shipped in the focus areas in the last 24 hours.** Per the daily cadence rule that is
the expected result and this report does not pad it.

**One backfill, and it is a real one.** Snap shipped **Lens Studio 5.23.0 on July 28** — the first
Lens Studio branch targeting the *shipping consumer Specs* rather than the 2024 dev-kit Spectacles.
Yesterday's report opened its AR section with *"Nothing new. No SDK, hardware, dev-program, or
pricing announcement in the last 24 hours"* — that was wrong on the SDK clause. Snap's SDK is the
single most-watched dependency for `3rdrider`, so this is written up as a backfill below.

That makes two consecutive runs where the miss was in the *named-target* sweep, not the generic one.
See Notes on scope.

---

## Backfill — missed in yesterday's window

### Lens Studio 5.23.0 — first SDK branch for shipping Specs, released July 28

- **Downloads / release notes** — [ar.snap.com/download](https://ar.snap.com/download) ·
  [ar.snap.com/lens-studio-v5](https://ar.snap.com/lens-studio-v5)
- **Verified by reading Snap's own download + release-notes pages, not press coverage.**
- **The version split is the headline.** Snap now maintains two incompatible Lens Studio lines:

| Build | Target | Note |
|---|---|---|
| **5.23.0** (July 28, 2026) | **"SPECS 27"** — the consumer Specs | Current Spectacles (2024) firmware does **not** run Lens Studio 5.23 content |
| **5.15.4** | Spectacles (2024) dev kit | Snap explicitly says 2024 owners "should continue using Lens Studio 5.15.xx" |

- **What's actually in 5.23.0:**
  - **3D Hand Mesh** — a real-time mesh mirroring the user's hand, for rendering, mesh effects, and
    attaching objects; no separate hand model needed.
  - **Custom Texture Tracking for Hands** — 3D hand tracking / hand mesh can now run against a Media
    Picker texture, dual camera, or embedded video instead of only the live feed.
  - **CRISP compression for Gaussian Splatting** — Snap claims **~14× file-size reduction** on splats.
  - Vertex snapping + 3D grid snapping in the Scene viewport; variable-font named instances; SVG
    import as Vector Composite assets.
  - Tooling: script debugging via IntelliJ / WebStorm / Chrome DevTools, faster TypeScript compile.
- **Why it matters to us — the 3rdrider v2 port target just moved.** Memory records that the
  3rdrider Lens project needs an SIK rewrite and that Claude Code must be launched from the
  Spectacles directory for the Lens Studio MCP. That port now has a **fork in the road**: write it
  against 5.15.x (runs on hardware that exists, on a line Snap is clearly winding down) or against
  5.23 (runs on hardware nobody owns yet, ships this fall). Building against 5.15 and porting later
  is now a *known* rework cost, not a hidden one.
- **Caveats, stated plainly:**
  - **"SPECS 27" is Snap's own label inside Lens Studio.** Public marketing calls the product
    "Specs," priced $2,195, shipping fall 2026 in US/UK/France
    ([UploadVR](https://www.uploadvr.com/snap-specs-design-revealed-preorders-open-price/) ·
    [TechCrunch](https://techcrunch.com/2026/06/16/snap-finally-debuts-its-long-awaited-ar-glasses-specs-and-oof-they-arent-cheap/)).
    Do not read "27" as a confirmed 2027 slip — Snap has not said that, and this report will not
    infer it.
  - **No hardware, price, or ship-date change accompanied this.** Specs remain $2,195 / fall 2026.
    This is an SDK drop only.
  - The 5.23 features are documented on Snap's pages; **none of them have been run on real hardware
    by us**, and 5.23 content cannot be tested on a 2024 dev kit at all.
- **CRISP is a second, separate hook.** A ~14× splat compression scheme aimed at glasses-class
  devices is relevant to `haptic-mirror`'s Gaussian-splatting scenario loading and to the R2 asset
  CDN's bandwidth math — *if* Snap documents the format outside Lens Studio. Unverified whether
  CRISP is an open/portable codec or a Lens-Studio-internal one. **Do not budget against it until
  that is checked.**

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing new **in the 24h window**. See the July 28 Lens Studio backfill above.
- **Meta Wearables Device Access Toolkit** — still developer preview; last doc revision was the iOS
  integration guide on **July 14**, unchanged since
  ([Meta wearables docs](https://wearables.developer.meta.com/docs/develop/dat/build-integration-ios/)).
  Publishing is still limited to select partners.
- **Samsung** — Galaxy Unpacked (July 22) named the eyewear and disclosed nothing else: no price, no
  ship date, no SDK, no developer track. Unchanged.

### Spatial Computing / 3D
- Nothing new. Re-checked the config's named GS targets — Gaussian Point Splatting (SIGGRAPH '26)
  and FastGS are both already-logged, unchanged. The only splat-adjacent movement in the window is
  Snap's CRISP, filed above.

### AI / ML
- Nothing new. **Gemini 3.5 Pro is still not GA — seventh consecutive miss.** No `gemini-3.5-pro`
  route in the public API model list. Reuters reported on July 21 that Google shipped three cheaper,
  lighter Gemini models instead and offered no new timeline for the flagship
  ([eesel tracker](https://www.eesel.ai/blog/gemini-3-5-pro)).
- **Genie 3 developer API — still none.** Access remains Project Genie via AI Ultra ($250/mo, above
  the $200/mo infra gate). Third-party pages advertising a "Genie 3 API" are resellers, not Google.
- **July 29 AI news was policy, not product** — the 1,100-signature AI pacing letter, the Cyera /
  Oasis Security acquisition, the OpenAI–Hugging Face breach post-mortem
  ([roundup](https://www.buildfastwithai.com/blogs/ai-news-today-july-29-2026)). Nothing shipped.
  Logged so a later run does not mistake the volume of coverage for a release.

### Hardware
- Nothing new. **ST VL53L9 / X-NUCLEO-53L9A1** unchanged and still the one purchasable item inside
  the ≤$200/mo infra gate. **Onyx Boox Picco** (3.97" e-reader) is a **tease published July 23**, not
  a release — no price, no date ([Good e-Reader](https://goodereader.com/blog/onyx-boox/new-onyx-boox-picco-wants-to-compete-against-xteink)).
  Explicitly not counted as shipped.

### Medical / Clinical AI
- Nothing new. **Verified the NVIDIA Isaac for Healthcare org directly** (`gh api
  orgs/isaac-for-healthcare/repos`) rather than trusting search: latest push across all seven repos
  is `i4h-workflows` at **2026-07-28T17:24Z**. No new repo, no new release since yesterday's report.
- **License note carried forward and sharpened:** `Cosmos-H-Dreams` reports as **`NOASSERTION`** on
  the GitHub API, not a clean Apache-2.0 the way the other four repos do. Yesterday's report flagged
  the *checkpoint* license as unverified; the *repo* license detection is also ambiguous. Treat
  Cosmos-H Dreams as license-unresolved until someone reads the actual `LICENSE` file, and do not
  build anything shippable on it before that.

---

## Nothing New (Watchlist)

Rolled forward:

- **Khronos `KHR_gaussian_splatting` glTF extension** — still RC, not ratified. Q2 2026 target
  missed. [Khronos](https://www.khronos.org/news/press/gltf-gaussian-splatting-press-release). Monthly check.
- **DeepMind D4RT** — week 13, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none.
- **Gemini 3.5 Pro GA** — missed, seventh time.
- **Apple Foundation Models open-source** ("later this summer," announced WWDC June 9, includes
  `CoreAILanguageModel` + `MLXLanguageModel`) — ~5 weeks of summer left, no drop. Weekly through early September.
- **Snap Specs** — $2,195, fall 2026, no sharper date. *SDK dependency now partially resolved — see backfill.*
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — price, ship date, developer track all undisclosed.
- **Android XR Developer Catalyst Program** (`g.co/dev/catalyst`) — intake status **still unverified**.
  Carried open for a third consecutive report. This is an administrative action, not a news item;
  it will keep rolling forward until someone loads the page and checks.

---

## Project Impact

**3rdrider (parked-but-watched) — the port decision is now concrete.** STR-525's v2 port needs an SIK
rewrite regardless. What changed is that the SIK it targets now bifurcates: 5.15.x for the 2024 dev
kit in hand, 5.23 for the Specs that ship this fall. The **3D Hand Mesh** addition is directly on
3rdrider's use case — a paramedic HUD is a hands-busy application, and real-time hand geometry is
better input for gesture-free interaction than the 2024-era hand tracking. **Recommended action:** no
build work. When the port is eventually scheduled, scope it against 5.15.x for testability and book
the 5.23 migration as a known follow-on, rather than discovering the split mid-port.

**haptic-mirror / MedSim R2 CDN — one cheap question worth answering.** If Snap's CRISP splat
compression is a documented portable format, ~14× is a material change to splat delivery over the R2
CDN and to haptic-mirror's scenario loading. If it is Lens-Studio-internal, it is worth nothing to
us. That is a 20-minute docs check, not a project. **Do it before any splat-compression work is
hand-rolled** — same shape of mistake as hand-building a POCUS slicer while an Apache-2.0 raytracer
sat in a public repo.

**MedSim-Game (flagship)** — no change. Yesterday's NVIDIA POCUS/fluoro finding remains the live
recommendation (one bounded evaluation session on a CUDA box before more hand-written slicer work).
The license ambiguity noted above is a reason to scope that session as *evaluation*, not integration.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of every `_ops/idea-vault/*.md`.

**No parked ideas unblocked.** One moved measurably closer and is worth naming:

- **Idea:** 3rdrider on Snap Spectacles
- **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
- **Blocker was:** *"Consumer AR glasses with prescription compatibility, on-device camera+mic+display,
  and developer SDK shipping at <$800"*
- **What changed:** the **developer SDK** clause is now satisfied for the consumer product — Lens
  Studio 5.23.0 targets shipping Specs as of July 28. On-device camera+mic+display is satisfied
  (standalone, dual Snapdragon, 51° display, no tether).
- **What did not change:** **price.** $2,195 against a **<$800** trigger — off by 2.7×. Prescription
  compatibility is also still unconfirmed by Snap.
- **Recommended action: WAIT.** The blocker is a conjunction, and the binding term was always price,
  not tooling. An SDK arriving does not move a hardware-cost gate. Recording the partial satisfaction
  so a future run does not re-litigate the SDK question — but this stays parked.

Every other vault entry is blocked on market, money, or time, and nothing in this report touches any
of those. `haptic-mirror-d4rt.md` remains blocked on D4RT-or-equivalent scene reconstruction from
short video captures; Snap's CRISP compresses splats, it does not reconstruct them. **WAIT.**

---

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24**.
- **Process note, second consecutive run.** Yesterday's report caught the 07-28 report missing an
  NVIDIA healthcare release; today's catches the 07-29 report missing a Snap SDK release. Both
  targets are *already named in `TECH_SCOUT_CONFIG.md` §2* — Snap Developer GitHub is listed under
  §2A at weekly frequency. The failure mode is not an unlisted target; it is that the named targets
  are being covered by generic web queries instead of being **fetched directly**. The NVIDIA check in
  this run worked precisely because it hit `gh api` against the org rather than searching for news
  about it. **Recommended fix:** make §2A's Snap row concrete the same way §2D's NVIDIA row now is —
  fetch `ar.snap.com/download` and compare the version string against the last report, every run. A
  version-string diff cannot be missed the way a news query can.
