# Tech Scout Report — 2026-08-01

**Window:** 2026-07-31 → now (normal 24h daily cadence). Prior report: `scout-2026-07-31.md`.

## Verdict

**Nothing shipped in the focus areas in the 24-hour window.** No AR hardware, no SDK, no model
release, no 3D tooling drop. Per the daily-cadence rule, that is the report, not a failure — and this
run does not pad it.

What this run did instead was **close the two carried action items** that had been deferred across
three reports each, because a thin news day is exactly when a 20-minute verification gets done:

1. **NVIDIA `Cosmos-H-Dreams` is Apache-2.0.** The `NOASSERTION` flag was a GitHub classifier
   artifact, not a restrictive license. **This removes the license gate from the ultrasound-raytracing
   evaluation.** It is the only materially useful thing in this report.
2. **Snap CRISP has no public spec.** Lens-Studio-internal. Answered and closed as a dead end.

One **correction** to a number this scout has repeated for weeks: Genie access is **$200/mo, not
$250** — *at* the infra gate, not above it. See below.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Nothing new.** Lens Studio version diff performed per config: **5.23.0 (July 28), unchanged** for
  the third consecutive run; the Spectacles (2024) line is still **5.15.4**
  ([ar.snap.com/download](https://ar.snap.com/download)). No movement from Snap, Meta, Samsung,
  Google, or XREAL in the window.
- **Two items surfaced by search and rejected as out-of-window** — logged so a later run does not
  re-chase them:
  - **XREAL a01+ $299** — already reported **twice** (07-13 GA, 07-28 ship). Not new. Still no camera.
  - **Lucyd smart eyewear + Claude integration** — announced **July 10, 2026**
    ([PR](https://www.prnewswire.com/news-releases/innovative-eyewear-inc-announces-new-claude-ai-integration-for-all-lucyd-smart-eyewear-302822390.html)).
    Three weeks stale, and audio-only: no display, so it fails the `3rdrider` blocker regardless.

### Spatial Computing / 3D

- **Nothing new.** Release-date check run directly against the GitHub API on the config's named
  targets — commits are not releases and are not counted:

  | Repo | Latest release | Last push |
  |---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-07-31 |
  | `modelcontextprotocol/servers` | 2026.7.10 | 2026-07-29 |
  | `nerfstudio-project/nerfstudio` | v1.1.5 — **2024-11-11** | 2025-07-29 |
  | `mkkellogg/GaussianSplats3D` | v0.4.7 — 2025-01-25 | 2025-10-19 |
  | `hahlbohm/Faster-GS` | **404 — repo gone or renamed** | — |

- **Config defect found:** `hahlbohm/Faster-GS`, a §2B named target, **returns 404**. Either renamed,
  made private, or deleted. It has been silently unfetchable and no prior run noticed. Needs to be
  re-located or struck from `TECH_SCOUT_CONFIG.md` — a target that 404s produces a false "nothing new."

### AI / ML

- **Nothing new in-window.** Anthropic newsroom's latest is **July 30** (cybersecurity evals);
  nothing July 31 or August 1.
- **Gemini 3.5 Pro still not GA — ninth consecutive miss.**
- **Genie 3 developer API — still none.** Access is still Project Genie in the consumer app only.

### Hardware

- **Nothing new.** Modos Flow remains a **December 10, 2026** ship date, not a release.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: latest push across all seven repos is
  still **`i4h-workflows` at 2026-07-28T17:24Z** — identical to the last two readings.
- **MONAI: no new release.** Still **1.6.0 (2026-06-11)**, despite pushes as recent as
  **2026-08-01T05:13Z**. Commits, not a release.
- **False lead, explicitly killed:** a search result claimed a **"MedGemma release on July 30, 2026."**
  It is wrong. The blog post it points at is dated **July 9, 2025**, and the Hugging Face API shows
  Google's newest first-party MedGemma model is **`google/medgemma-1.5-4b-it`, created 2026-01-07**.
  Everything with a recent timestamp is a third-party quantization. **No new MedGemma. Do not report
  it next run.**

---

## Closed: `Cosmos-H-Dreams` license — Apache-2.0 (carried since 2026-07-29)

Read the actual `LICENSE` file via the GitHub contents API rather than trusting the API's license
field. **The `NOASSERTION` was a classifier artifact of a composite license file, not a restriction.**

> "The bulk of Cosmos-H-Dreams source code — including the vendored `flashdreams/` subtree (sourced
> from https://github.com/NVIDIA/flashdreams) — is licensed under the **Apache License, Version 2.0**."

The repo carries inline SPDX identifiers per source file, a **REUSE 3.3** manifest (`REUSE.toml`) for
files that can't hold headers, `LICENSES/Apache-2.0.txt`, `NOTICE`, and a root `THIRD-PARTY-NOTICES`.
That is a deliberate, well-formed compliance posture — better than the other four repos, not worse.

**What this changes.** The 07-29 recommendation scoped NVIDIA's ultrasound raytracing to an
*evaluation-only* session **specifically because the license was unresolved and might block shippable
use**. That reason is gone. Cosmos-H-Dreams output can go into a shipped product under Apache-2.0.

**Two caveats that survive, and they are not small:**
- **Third-party deps are pulled at install time and are not covered** by the Apache grant — they're
  documented in `THIRD-PARTY-NOTICES`. Anything shipped needs that file read once.
- **Model weights are a separate question from code.** Apache-2.0 here covers the *repository*. If a
  scenario uses distributed checkpoints, their terms need a separate look. Do not assume the code
  license flows to the weights.

---

## Closed: Snap CRISP splat compression — internal, no public spec (carried since 2026-07-30)

Answer to "portable documented format, or Lens-Studio-internal?": **internal.**

- Snap's own [Gaussian Splatting docs](https://developers.snap.com/lens-studio/features/graphics/gaussian-splatting)
  **do not mention CRISP by name at all.** They document importing `.ply` and batching `.ply`
  sequences into **GSAF** (Gaussian Splatting Animation Frames) with 4–16-bit per-attribute
  compression sliders.
- The ~14× / ~0.04% position-error / <2 ms-decode figures appear only in **release-note and
  third-party coverage**, never in a format specification.
- **No export path out of GSAF is documented**, and no external runtime consumes it. Input is the open
  format (`.ply`); output is Snap's.

**Conclusion: nothing here is reusable outside Snap runtimes.** Interesting as evidence that
inter-frame splat compression is tractable at those ratios; useless as a component. **Item closed —
do not carry it a fourth time.**

---

## Correction — Genie access is $200/mo, not $250

This scout has repeated "**Project Genie via AI Ultra $250/mo, above the $200/mo infra gate**" for
several reports. **The $250 tier no longer exists.** Verified against Google's own post
([blog.google, May 19, 2026](https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/)):

> "We're also reducing the monthly price of our top-tier AI Ultra plan **from $250 to $200**."

| Tier | Price | Project Genie? |
|---|---|---|
| AI Ultra (new dev tier) | **$100/mo** | **No** |
| AI Ultra (top) | **$200/mo** | **Yes** — global, 18+, 25,000 AI credits/mo |

**Why this matters:** the standing autonomy rule is that **≤$200/mo infra is Jonathan's call to make
without asking**. Genie at $250 was outside it. Genie at $200 sits **exactly at the ceiling** — a
judgment call, not an automatic no. The new $100 tier does **not** include Genie, so there is no
cheap route.

**This is not a recommendation to subscribe.** $200/mo consumes the entire discretionary infra
envelope for a consumer app with **no developer API**, which is the actual blocker for embedding
anything in MedSim. Flagging only that a number this scout kept quoting was wrong in a direction that
changed which side of a gate the item sat on.

---

## Nothing New (Watchlist)

Rolled forward:

- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly check, last
  done 07-30, not re-run today.
- **DeepMind D4RT** — week 13, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer-app access only, now correctly priced at $200/mo.
- **Gemini 3.5 Pro GA** — missed, ninth time.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly through
  early September.
- **Snap Specs** — $2,195, fall 2026. Unchanged.
- ~~**Snap CRISP**~~ — **CLOSED**, see above.
- ~~**`Cosmos-H-Dreams` license**~~ — **CLOSED**, Apache-2.0, see above.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track still undisclosed.
- **Modos Flow** — $619/$719, ships Dec 10, 2026.
- **Android XR Catalyst second cohort** — no announcement. Monthly check.
- **`hahlbohm/Faster-GS` 404** — new entry. Re-locate or strike from config.

---

## Backfill — missed on July 31

### OpenAI cut GPT-5.6 API prices ~80% / ~20% — announced July 30

- [OpenAI](https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/) ·
  [InfoWorld](https://www.infoworld.com/article/4203865/openai-drops-gpt-5-6-luna-and-terra-api-prices-by-up-to-80.html) ·
  [VentureBeat](https://venturebeat.com/technology/ai-price-wars-openai-cuts-gpt-5-6-luna-prices-by-80-as-model-competition-shifts-toward-cost)
- **Luna: −80% → $0.20/M input, $1.20/M output. Terra: −20% → $2/M input, $12/M output.** Sol price
  unchanged, gains a "Fast Mode" (~2.5× faster, 2× price) replacing Priority Processing.
- **Why it matters to us: barely, and honestly.** Every project in the portfolio runs on Claude. This
  is not a migration prompt and this report is not making one. Its only real relevance is as a **price
  reference point** if a genuinely high-volume, low-stakes batch job ever appears — bulk asset
  captioning, first-pass triage of the 209-row job-watch corpus. At $0.20/M input that class of work
  gets cheap enough to stop being a budget question. **No action.**
- Logged as a backfill because it landed inside the 07-31 report's stated window and was missed there.

---

## Project Impact

**MedSim-Game (flagship) — one gate removed, no new work created.** The standing 07-29 recommendation
was **one bounded session evaluating NVIDIA's ultrasound raytracing on a CUDA box before more
hand-written POCUS slicer work**, explicitly scoped to *evaluation* because the license was unresolved.
**The license is now resolved as Apache-2.0**, so that session no longer has to be firewalled as
evaluation-only — if it works, the output path to a shipped feature is open. The recommendation is
otherwise unchanged and is still the highest-value queued item this scout is tracking. It competes
directly with the **Z-Anatomy voxelize-and-slice** plan already recorded for POCUS v2; this report
does not resolve that choice, and the CUDA-box evaluation is what would.

**haptic-mirror — no change.** Reconstruction is still the blocker. Nothing this window.

**3rdrider (parked) — no change.** No camera-equipped display glasses under $800 exist. The two
AR items search surfaced today were both stale and both fail the blocker anyway.

**SmartBadge — no change.** No e-paper movement.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 26 `_ops/idea-vault/*.md` entries.

**No parked ideas unblocked.**

One near-miss stated explicitly so it is not re-litigated:

- **Idea:** Haptic Mirror — D4RT scene reconstruction
- **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/haptic-mirror-d4rt.md`
- **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world
  reconstruction tooling that lets you generate training scenarios from short video captures"*
- **What changed:** `Cosmos-H-Dreams` — a **clinical soft-tissue world model** — is confirmed
  Apache-2.0 rather than license-unknown.
- **Why it still does not count:** the blocker requires **reconstruction from short video captures**.
  Cosmos-H-Dreams is a *generative* world model for surgical/soft-tissue simulation; it does not
  ingest a phone video and return a scene. Right license, wrong capability.
- **Recommended action: WAIT.** Unchanged.

Every other vault entry is blocked on market, money, revenue milestones, or sequencing — none of which
tech news can move. `3rdrider-snap-spectacles.md` remains blocked on the **<$800 + on-device camera +
display + SDK** conjunction; nothing today touched it.

---

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24**.
- **Process.** The fetch-and-diff discipline held: the Snap version diff, the two GitHub org/release
  sweeps, and the license read were each seconds-to-minutes and each produced a defensible answer.
  Two additional failure modes surfaced today, both worth keeping:
  1. **Search results assert dates that are wrong.** The "MedGemma July 30, 2026" claim survived until
     the blog post and the HF API were checked directly — the post is from **2025**. Any date that
     arrives via a search summary gets confirmed at the primary source before it enters a report.
  2. **A 404 target is indistinguishable from a quiet one.** `Faster-GS` has been unreachable for an
     unknown number of runs and read as "nothing new." Named targets should fail loudly.
- **Config updated this run:** items #3 (CRISP) and #4 (Cosmos LICENSE) in `TECH_SCOUT_CONFIG.md` §4
  are struck as completed; `Faster-GS` flagged in §2B as 404.
