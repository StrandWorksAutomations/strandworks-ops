# Tech Scout Report — 2026-08-06

**Window:** 2026-08-05 → now (normal 24h daily cadence). Prior report: `scout-2026-08-05.md`.

## Verdict

**Three real in-window releases, one of which matters to how this portfolio is actually built** —
and two findings that are worth more than the releases:

1. **Agent Plugins 1.0.0 shipped today (Aug 6).** A vendor-neutral spec for packaging **Agent Skills
   and MCP servers** into one portable unit. TSC is Amazon, Cursor, Microsoft, OpenAI, Vercel —
   **Google joined as Core Maintainer today.** This portfolio runs ~40 skills and a dozen MCP servers
   in Claude-Code-specific layouts. This is the first standard that targets exactly that.
2. **A major protocol revision was missed by every prior scout run: MCP went stateless on
   2026-07-28.** Handshake gone, session header gone. `grep` across all `scout-*.md` returns **zero**
   hits for "stateless" or the spec date. Out-of-window, reported as a correction.
3. **The World Labs export question from yesterday is CLOSED, and the answer is favorable.** Marble
   exports **SPZ + PLY splats and GLB meshes** with documented Blender / Houdini / Unity / Unreal
   importers. Not proprietary, not player-bound. Yesterday's REVISIT caveat is resolved.

Also: **Lens Studio moved for the first time in eight runs** (5.23.0 → 5.23.1), and two *more* empty
Qwen3.8-27B name-squats appeared and were falsified.

---

## Breakthroughs & Releases Since Last Report

### AI / ML

- **Agent Plugins 1.0.0 — shipped 2026-08-06.** An open, vendor-neutral specification for packaging
  **Agent Skills and MCP servers** into portable plugins. Standardizes a `plugin.json` manifest plus
  a **fixed directory layout** with defined locations for skills and MCP servers, so a plugin authored
  once works across agent clients without per-client rearrangement or duplicate wrappers.
  [agent-plugins.org](https://agent-plugins.org/) ·
  [github.com/agentplugins/agent-plugins-spec](https://github.com/agentplugins/agent-plugins-spec) ·
  [Google announcement, "AUG. 6, 2026"](https://developers.googleblog.com/agent-plugins-package-your-skills-tools-and-more/)
  - **Technical Steering Committee Core Maintainers: Amazon, Cursor, Microsoft, OpenAI, Vercel** —
    **Google joined today.** That is a genuinely broad cross-vendor set for a v1.0.0.
  - Google shipped two things *as* Agent Plugins on announcement day: the **Agents CLI** (skills for
    agent building, evaluation, deployment, observability, publishing) and the **Data Agent Kit**
    (BigQuery / Spanner / Cloud SQL connectors). Google's own post names **Claude Code** alongside
    Antigravity, Gemini CLI, and Cursor as target clients.
  - **The spec is deliberately narrow.** It defines layout and manifest only, and **explicitly
    excludes** installation mechanism, distribution protocol, permission model, sandboxing, trust
    verification, and UX. It is a packaging convention, not a runtime.
  - Repo reality-check: created **2026-04-03**, pushed **today**, **74 stars, zero release tags and
    zero git tags.** The v1.0.0 designation lives in the spec text and the announcement, not in a
    tagged artifact. Early. Adoption is announced, not yet demonstrated in the wild.
  - **Why it matters here** — see *Project Impact*. This is the first item in weeks that touches the
    portfolio's own build substrate rather than a product it might one day consume.

- **OpenAI — Fast mode extended to long context, 2026-08-05.** Fast mode now supports long-context
  requests for **GPT-5.6 Sol / Terra / Luna**, up to **2.5× Standard-tier speed on prompts over
  272K tokens**. Aug 4 entry: usage data filterable and groupable by API key.
  [developers.openai.com/api/docs/changelog](https://developers.openai.com/api/docs/changelog)
  (Reached via the §5 fallback path — `openai.com/news` remains 403 to both WebFetch and `curl`+UA.)
  - Not actionable. Logged because it is a dated, shipped API change inside the window.

- **Anthropic — nothing.** Newest newsroom post is still **Aug 4** (Tino Cuéllar hire, not a release).
  Last technical items remain Jul 30 (cybersecurity evals) and Jul 24 (Claude Opus 5).

- **No model releases anywhere on Aug 4, 5, or 6.** `llm-stats.com/llm-updates` most-recent dated
  entries: **Qwen3.8 Max (Aug 2)**, **DeepSeek-V4-Flash-0731 (Jul 31)**, **Claude Opus 5 (Jul 24)**.
  Second consecutive run confirming an empty model calendar.

### AR / Smart Glasses

- **Lens Studio 5.23.1 — released 2026-08-05.** First version movement in **eight consecutive runs**
  (5.23.0 had been static since July 28). [ar.snap.com/download/v5-23-1](https://ar.snap.com/download/v5-23-1)
  - **New:** *SVG Text* — Vector Composite assets now render text with per-run weight, italic, letter
    spacing, and horizontal alignment.
  - **Four bug fixes:** crash when scripts reassign materials while destroying visuals; objects
    staying registered for change notifications after destruction;
    `Editor.Components.ObjectTracking3D.objectIndex` not applying from scripts; VFX assets losing
    Inspector parameters across save/reload.
  - **This is a maintenance release.** It is reported because the version diff is a standing per-run
    check and the number moved — not because it changes anything. The substantive 5.23 features
    (3D Hand Mesh, custom texture tracking for hands) shipped July 28 and are already on record.
  - Note the download page now splits tracks: **5.23.x is for SPECS 27**; **Spectacles (2024) users
    stay on 5.15.xx** (Snap OS 5.64.396+). The two-track split is consistent with a September launch.
- **Snap newsroom — no change.** Per-run headline diff (promoted to per-run yesterday) returns nothing
  newer than **July 31** ("Rewarding Authentic Creativity on Spotlight"). SPECS launch post still
  **July 30**; **September 16, Los Angeles** unchanged. The promotion is working as intended: it took
  one fetch to confirm a negative that a news query would have left ambiguous.
- **No AR hardware shipped in-window.** The sweep returned only prior-window and unshipped material:
  XREAL Project Aura (Fall 2026, ≤$1,500, Founder Pass sold out in 36h — reservations, not shipping),
  Samsung AR glasses (2026, undated), ASUS ROG XREAL R1 (**June 1, 2026** — prior window), Pimax
  micro-OLED PC VR preorders clearing. All rejected under the no-roadmap rule.

### Spatial Computing / 3D

- **No new release across any tracked repo.**

  | Repo | Latest release | Last push |
  |---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-08-05 |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | **2026-08-06** |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | 2026-08-05 |
  | `nerficg-project/faster-gaussian-splatting` | never (push-monitored) | 2026-07-11 |
  | `Project-MONAI/MONAI` | 1.6.0 — 2026-06-11 | 2026-08-04 |

  LichtFeld-Studio: **six consecutive days of commits without a release.** v0.5.3 is now seven weeks
  old. Commits are not releases.
- **Gaussian splatting sweep returned nothing dated in-window** — only 2026 survey posts, arXiv
  preprints, and the already-tracked **KHR_gaussian_splatting** glTF extension (still RC, Feb 2026).
- **World-model sweep: no August release.** Marble's own release notes confirm it —
  latest entry is **April 2, 2026** (Marble 1.1 / 1.1 Plus models). Genie 3, Odyssey-2 Pro, Decart
  Oasis 3, World Labs World API all unchanged and already on record.

### Hardware

- **Nothing.** No e-ink movement. **Onyx Boox Picco** re-confirmed for the **third consecutive run**
  as a July announcement with **price and release date still undisclosed** — not a release, not
  reportable. Everything else returned for 2026 (Palma 3, Go refresh, Android 16) is expectation.
- Modos Paper Monitor unchanged (13" $599 in stock, 6" dev kit $199). Modos Flow still Dec 10, 2026.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all seven repos is
  **`i4h-workflows` at 2026-07-28T17:24Z** — **seventh identical reading.** `Cosmos-H-Dreams`
  unchanged at 2026-07-27.
- The vendor sweep resurfaced NVIDIA's **Medical Physics Simulation** launch (Open-H 700h surgical
  video dataset, Cosmos-H, GR00T-H VLA, Rheo; 8,192 parallel envs, >5h → <2min policy training;
  J&J MedTech / CMR Surgical / PeritasAI / Proximie as first adopters). **This is the July 22
  release already on record** — logged here only so a future run does not re-report it as new.
- **MONAI: no new release.** Still 1.6.0 (2026-06-11); pushed 2026-08-04, commits only.

---

## Corrections and verified negatives

**1. Every prior scout run missed the MCP stateless spec — the largest protocol revision since MCP
launched.**

`grep -il "stateless"` and `grep -il "specification/2026-07-28"` across **all** `scout-*.md` return
**zero files.** The spec landed **2026-07-28**
([blog.modelcontextprotocol.io/posts/2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/) ·
[changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)). What changed:

- **The handshake is gone. The session header is gone.** Sticky routing and shared session stores are
  no longer part of the protocol.
- Every request carries its protocol version and client capabilities in `_meta`
  (`io.modelcontextprotocol/protocolVersion`, `io.modelcontextprotocol/clientCapabilities`).
- New **`Mcp-Method` / `Mcp-Name` headers** let gateways route on headers instead of parsing bodies.
- List and resource results carry **`ttlMs` and `cacheScope`** so clients know result freshness.
- Plus: Multi Round-Trip Requests, authorization hardening, a formal extensions framework, updated
  Tier 1 SDKs.

**Why it was missed:** §2C monitors `modelcontextprotocol/servers` **releases** and
`modelcontextprotocol.io` for "new server categories." The **spec** is published on a different
surface (`blog.modelcontextprotocol.io` + `/specification/<date>/`) and a spec revision cuts no
release tag on the servers repo. Same failure shape as the Snap SPECS miss: watching an artifact
feed instead of the announcement surface. **Config §2C updated to add the spec blog as a per-run
target.**

**2. Two MORE empty Qwen3.8-27B name-squats appeared — created today, falsified today.**

`neroued/Qwen3.8-27B-NInfer` and `neroued/Qwen3.8-27B-nvfp4-NInfer`, both created **2026-08-06**.
Blob listing: **2 files each, 0.00 GB, a 1,519-byte `.gitattributes` and a 28-byte `README.md`.**
`raw/main/config.json` → **404**. No weights, no config, no shards. Identical pattern to yesterday's
`huginnfork/*` pair. **This is now a recurring daily phenomenon** — the corrected §2C blob-listing
method caught it in one call both times. `Qwen/Qwen3.8-27B` and `Qwen/Qwen3.8-Max` remain absent from
the author listing, whose newest entries are still `Qwen3-ASR-*` from **2026-07-22**.

**3. The alleged Qwen license prohibition (USA / EU / UK / Korea) remains unclarified by Alibaba.**
Unchanged from 08-05. Still attributed, not asserted. Still load-bearing — read the LICENSE first.

---

## Nothing New (Watchlist)

- **Qwen3.8-Max + Qwen3.8-27B open weights** — still absent. **Four** empty squat repos falsified
  across two runs. Re-check **~2026-08-10**. **Read the LICENSE before anything else.**
- **Snap SPECS** — $2,195, fall 2026, US/UK/FR. Hard event date **Sep 16, Los Angeles**.
- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly, last 07-30.
- **DeepMind D4RT** — **week 16**, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra.
- **Gemini 3.5 Pro GA** — missed, fourteenth consecutive.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through
  early September.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track undisclosed.
- **XREAL Project Aura** — Fall 2026, ≤$1,500, reservations only. Not shipping.
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Android XR Catalyst second cohort** — no announcement. Monthly.
- **Onyx Boox Picco** — third run logging: price and date still undisclosed. Not a release.
- **Agent Plugins adoption** — ➕ new. Spec is v1.0.0 with **no tagged release and 74 stars**. Watch
  whether Claude Code / Cursor / OpenAI ship *readers*, not just announcements. Weekly.
- **`openai.com/news`** — fetch-hostile (403 to WebFetch and to `curl`+UA). Working path
  `developers.openai.com/api/docs/changelog` used successfully again this run.
- **`gaussian-splatting` PyPI (yindaheng98 fork)** — suppressed per §2B; did not trigger.

---

## Project Impact

**Portfolio build substrate — Agent Plugins is the one thing this run that touches how the work
itself gets done.** The portfolio runs roughly 40 skills and a dozen MCP servers, all in
Claude-Code-native layouts (`.claude/skills/`, `.mcp.json`). Agent Plugins standardizes exactly that
pair — skills + MCP servers — into a portable `plugin.json` + fixed directory layout, with Amazon,
Cursor, Microsoft, OpenAI, Vercel, and now Google as Core Maintainers.

**The honest read: interesting, not yet actionable.** Value only materializes if the skill set needs
to run on a client other than Claude Code, and nothing today requires that. The spec has **zero
tagged releases and 74 stars**, and it deliberately punts installation, permissions, sandboxing, and
trust to clients — meaning "portable" today means "the files are in predictable places," not "it
runs anywhere." **Recommended posture: watch, do not migrate.** The trigger to revisit is a *reader*
shipping in a client actually in use here. Google's post naming Claude Code as a target is a claim
about intent, not a shipped integration.

**MedSim-Game (flagship) — unchanged, and the queued item is unchanged for a seventh reading:** one
bounded session evaluating **NVIDIA's ultrasound raytracing (Isaac for Healthcare)** on a CUDA box
before more hand-written POCUS slicer work. License gate cleared 08-01 (Apache-2.0). Isaac repos have
now returned the **same push dates seven runs running** — waiting changes nothing. This is blocked on
a session, not on news.

**MedSim-Game, secondary — Qwen 27B unchanged and still at legal risk.** Four falsified squat repos
in two days is noise, not signal. Do not spend time on 27B planning until a LICENSE file exists and
has been read.

**MedSim-Game, third — the World Labs export finding is the most useful new fact in this report for
the game.** Marble exports **PLY splats and GLB meshes** with documented Unity, Unreal, Blender, and
Houdini importers. The 3D asset pipeline here is Blender-centric with GLB output to R2 — that is a
**format match, not an integration project**. This does not displace the parametric town-buildings
generator (a deliberate choice over AI-gen), and generated environments carry no clinical accuracy
guarantee, so it is a **non-clinical background/environment** tool at best. Worth one evaluation
session, low priority, well behind the ultrasound raytracing item.

**MedSim / infra — MCP stateless is a real fact worth knowing, with no forced action.** The
`sim-llm-npc` edge function and the local MCP fleet are not broken by this; the old spec remains
supported by existing SDKs. It matters whenever an MCP server here needs to scale horizontally or
run serverless — the session-affinity requirement that would have made that painful is gone. **No
migration is warranted now.** Logged so it is not discovered mid-incident.

**3rdrider (parked) — unchanged. Sep 16 is still the date.** SPECS at $2,195 is ~2.7× the $800 gate;
price alone fails the blocker. Lens Studio 5.23.1 changes nothing for it.

**haptic-mirror — no change.** D4RT week 16, still no code. Reconstruction-from-your-own-capture
remains the blocker, and Marble does not satisfy it (see below).

**SmartBadge — no change.** The blocker on record is 4.9pt typography on the physical cards.

**MedCapture — no change.**

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**One parked idea is now unblocked** — and it is yesterday's open question, closed by one fetch
rather than left as a REVISIT.

- **Idea:** AI Multi-View Video Generator
- **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/ai-multiview-video-generator.md`
- **Blocker was:** *"(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a
  public API feature … not exposed yet; (b) build it from existing 3D primitives … requires the
  display-cube-six-screens project to exist first."*
- **What changed:** Yesterday flagged World Labs' **World API** (public since 2026-01-21) as a
  probable satisfier of path (a), with one caveat: *the announcement never named an export format,
  so the export could be proprietary and player-bound.* **That caveat is now resolved.** Per
  [docs.worldlabs.ai/marble/export/specs](https://docs.worldlabs.ai/marble/export/specs), Marble
  exports:
  - **Splats (SPZ)** ~2M splats, and **low-res SPZ** ~500k
  - **Splats (PLY)** ~2M splats, and **low-res PLY** ~500k — explicitly *"broader software
    compatibility"*
  - **Collider Mesh (GLB)**, 100–200k tris, for physics
  - **High-quality mesh (GLB)** — ~600k tris textured, plus ~1M tris vertex-colored (up to an hour
    to generate, rate-limited to 4/hour/user, own-worlds only)
  - **360 panorama** — 2560×1280 equirectangular PNG
  - Plus documented import paths for **Blender, Houdini, Unity, Unreal, and Spark**, and a dedicated
    page on applying Marble splat-scale metadata when **rendering SPZ in third-party engines**.
  - **PLY and GLB are open, universally-readable formats.** The export is not player-bound. Path (a)
    is open.
- **Recommended action: PROMOTE from parked.** The blocker is satisfied. The remaining unknown is
  **cost** — `docs.worldlabs.ai/api/pricing` is credit-based and was not read this run; that is the
  one thing left to check before scoping. Note the idea's *original* framing (multi-view export) is
  now the weaker version of what is available: a navigable 3D world downloadable as PLY/GLB makes six
  fixed camera views a trivial local render pass, no API feature required. Path (b)'s dependency on
  `display-cube-six-screens` is unaffected — but path (b) is no longer the only route.

**No other parked ideas unblocked.** `haptic-mirror-d4rt.md` remains **WAIT** — D4RT week 16, and
Marble is a *generative* world model, not reconstruction from your own video capture, so it does not
satisfy that blocker even with the export path open. `3rdrider-snap-spectacles.md` remains **WAIT** —
$2,195 against a <$800 gate; Sep 16 informs the decision but cannot move the price. The remaining 24
entries are blocked on market, money, revenue milestones, or sequencing — none movable by tech news.

---

## Notes on scope

- **The most valuable finding this run was a `grep`, not a search.** MCP going stateless on July 28 is
  the biggest protocol change in the portfolio's most-used integration layer, and nine consecutive
  scout runs did not mention it — because the config watched a *repo's releases* and a *docs site*
  instead of the **spec announcement surface**. That is the identical failure that hid the Snap SPECS
  date for five runs. Worth asking, per target: *where does this project announce, versus where does
  it publish artifacts?*
- **Yesterday's REVISIT was closable in one fetch, and closing it changed the recommendation.** It went
  from "read the docs and decide" to "PROMOTE — blocker satisfied, only pricing left." Open questions
  that cost one fetch should not survive to a second report.
- **The Snap newsroom promotion paid for itself immediately** — one fetch produced a clean negative
  (nothing newer than July 31) where a news query would have produced ambiguity.
- **Four empty Qwen name-squats in two days.** The corrected blob-listing method (§2C, added 08-05
  after the 401≠404 finding) caught both pairs in a single call each. If a fifth pair appears, do not
  re-litigate it in prose — one line.
- Upcoming calendar in scope: **Snap SPECS launch, Sep 16 (Los Angeles)**; **Meta Connect, Sep 23–24**.
  Six and seven weeks out.
- **Config updated this run:** §2C adds `blog.modelcontextprotocol.io` + `modelcontextprotocol.io/specification/`
  as per-run targets (spec revisions cut no release tag); §2C adds Agent Plugins as a weekly
  adoption-watch target; §4 closes the World Labs export-format question with the resolved answer.
