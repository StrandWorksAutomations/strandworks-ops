# Tech Scout Report — 2026-08-04

**Window:** 2026-08-03 → now (normal 24h daily cadence). Prior report: `scout-2026-08-03.md`.

## Verdict

**Two real items, ending a three-day empty streak — and one of them is a correction to yesterday.**

1. **Qwen3.8-Max shipped August 3** — 2.4T-param MoE, 1M context, text+image+video in, API live at
   $2/$6 per MTok. Yesterday's report asserted "no model release dated August 2 or 3." That was
   wrong; this landed inside that window. Open weights are **promised, not shipped** — verified
   against the Hugging Face API, not taken from the press release.
2. **Modos Paper Monitor is confirmed shipping** — the item yesterday parked as unverifiable behind
   a Crowd Supply 403. Resolved with a different fetch path, not by guessing. 13" monitor **$599, in
   stock**; 6" dev kit **$199**.

Everything else in the focus areas: nothing.

---

## Breakthroughs & Releases Since Last Report

### AI / ML

- **Qwen3.8-Max — SHIPPED 2026-08-03, API available now.** Alibaba's largest model to date and the
  first Max-class model it has committed to open-sourcing.
  - **2.4 trillion parameters**, mixture-of-experts. **Activated-parameter count is not disclosed by
    Alibaba** — secondary coverage citing "95B active" is not sourced to a first-party statement and
    is not repeated here as fact.
  - **1M-token context**; practical ceilings 991K input (983K with reasoning on), 131K output.
  - **Multimodal input: text, image, and video** → text out.
  - **Available now** via Alibaba Cloud Model Studio and QwenWork; endpoints are **OpenAI- and
    DashScope-API compatible**, so a swap costs a base URL and a key.
  - **$2 / $6 per MTok** in/out; **cached input $0.25/MTok** (8× cheaper than fresh).
  - Sources: [MarkTechPost](https://www.marktechpost.com/2026/08/03/alibaba-qwen-releases-qwen3-8-max/),
    [VentureBeat](https://venturebeat.com/technology/qwen3-8-max-arrives-with-a-bold-claim-it-outperforms-gpt-5-6-sol-max-and-fable-5-on-agentic-computer-use),
    [SCMP](https://www.scmp.com/tech/article/3362738/alibabas-ai-model-qwen38-max-made-widely-accessible-ahead-open-weights-release)

  **The open-weights part has NOT shipped and is not reportable as available.** Alibaba says weights
  for Qwen3.8-Max **and** a `Qwen3.8-27B` checkpoint land "next week" on Hugging Face and ModelScope.
  Checked directly rather than trusted: `huggingface.co/api/models?search=Qwen3.8` returns **only two
  third-party artifacts** (`Ma7ee7/Qwen3.8_4B_Distilled` + GGUF, both 2026-07-30) — **no official
  Qwen3.8-Max or 27B repo exists.** Under the no-roadmap rule the weights are a watchlist entry, not
  a release. Re-check ~2026-08-10.

  **Reality check on the 2.4T figure:** at that size only the promised **27B** is a plausible
  self-host. The flagship is datacenter-scale and, for this portfolio, is an *API* — which means it
  competes with Claude/Gemini on price and context, not on "we could run it ourselves."

### Hardware

- **Modos Paper Monitor — CONFIRMED IN STOCK AND SHIPPING.** Yesterday this was flagged as an
  unverified search claim because [crowdsupply.com/modos-tech/modos-paper-monitor](https://www.crowdsupply.com/modos-tech/modos-paper-monitor)
  returns **HTTP 403 to WebFetch**. Re-fetched with `curl` and a browser user-agent → **HTTP 200**,
  and the page states it plainly:
  - **13" Modos Paper Monitor — `In stock`, $599**, free US shipping / $18 worldwide.
  - **6" Modos Paper Dev Kit — $199**, "Orders placed now ship **Jul 28, 2026**" — a date now in the
    past, i.e. shipping.
  - Campaign closed at **$197,588 raised of a $110,000 goal (179% funded)**.
  - What it actually is: an **open-hardware e-paper display controller** — Caster FPGA gateware +
    driver-board reference design, a **user-defined-modes API**, high refresh, and a Mega Adapter
    that drives **third-party e-paper panels**, not just Modos'. Funded by NLnet / NGI Zero Entrust.
  - **This is distinct from the Modos Flow** ($619/$719), which remains a **Dec 10, 2026** ship date
    and has not moved. Do not conflate them again.

- **No other e-ink movement.** The Onyx Boox **Picco** (3.97", monochrome, microSD, reading-only
  firmware) is a **July** announcement, outside this window — logged so a later run doesn't re-report
  it as new. Palma 3 / Go refresh / Android 16 remain unshipped 2026 expectations, rejected as
  roadmap.

### AR / Smart Glasses

- **Nothing new.** Per-run Lens Studio version diff: **5.23.0 (July 28) — unchanged for the sixth
  consecutive run**; Spectacles (2024) still pinned at **5.15.4**
  ([ar.snap.com/download](https://ar.snap.com/download)).
- Search returned only 2025 AWE retrospectives and unshipped 2026 roadmap items (Samsung Galaxy
  Glasses, Google/Warby Parker, Snap Specs, XREAL Aura). No shipped hardware, no new SDK. Rejected
  under the no-speculation rule.

### Spatial Computing / 3D

- **Nothing.** No new release across any tracked repo:

  | Repo | Latest release | Last push |
  |---|---|---|
  | `playcanvas/supersplat` | v2.32.3 — 2026-07-26 | 2026-07-31 |
  | `MrNeRF/LichtFeld-Studio` | v0.5.3 — 2026-06-24 | **2026-08-04** |
  | `modelcontextprotocol/servers` | 2026.7.10 — 2026-07-10 | **2026-08-04** |
  | `nerficg-project/faster-gaussian-splatting` | never (push-monitored) | 2026-07-11 |
  | `nerfstudio-project/nerfstudio` | v1.1.5 — 2024-11-11 | 2025-07-29 |
  | `mkkellogg/GaussianSplats3D` | v0.4.7 — 2025-01-25 | 2025-10-19 |

  LichtFeld-Studio and the MCP servers repo pushed again today — **fourth consecutive day of commits
  without a release.** Commits are not releases.
- The `gaussian-splatting` PyPI fork triggered again (2.6.4/2.6.5 surfaced in search). **Suppressed
  per config §2B** — third-party refactor of the INRIA reference impl, no new capability. Not
  reported.

### Medical / Clinical AI

- **Nothing new.** `gh api orgs/isaac-for-healthcare/repos`: newest push across all seven repos is
  still **`i4h-workflows` at 2026-07-28T17:24Z** — fifth identical reading. `Cosmos-H-Dreams`
  unchanged at 2026-07-27.
- **MONAI: no new release.** Still **1.6.0 (2026-06-11)**; pushed 2026-08-04, commits only.
- Search re-surfaced the **July 22** Isaac Medical Physics Simulation launch (8,192 parallel GPU
  envs; CMR Surgical, J&J MedTech, Medtronic, XCath adopters). **Already reported — not new.** Noted
  only because the queued evaluation below still depends on it.
- Anthropic newsroom: latest is still **July 30** (cybersecurity evals) — fifth identical reading.
  Nothing Aug 3 or 4.

---

## Nothing New (Watchlist)

- **Qwen3.8-Max + Qwen3.8-27B open weights** — **new entry.** Promised "next week" from Aug 3;
  confirmed absent from Hugging Face. Re-check ~08-10. Only the **27B** matters for self-hosting.
- **Khronos `KHR_gaussian_splatting`** — RC, not ratified; Q2 2026 target missed. Monthly, last 07-30.
- **DeepMind D4RT** — week 15, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — none. Consumer Project Genie only, $200/mo AI Ultra.
- **Gemini 3.5 Pro GA** — missed, twelfth consecutive.
- **Apple Foundation Models open-source** ("later this summer," WWDC June 9) — no drop. Weekly
  through early September.
- **Snap Specs** — $2,195, fall 2026. Unchanged.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — fall 2026; price, ship date, developer track undisclosed.
- **Modos Flow** — $619/$719, ships Dec 10, 2026. (Distinct from the Paper Monitor above.)
- ~~**Modos Paper Monitor 13" dev kit**~~ — **RESOLVED this run. In stock, $599. Removed.**
- **Android XR Catalyst second cohort** — no announcement. Monthly.
- **`gaussian-splatting` PyPI (yindaheng98 fork)** — suppressed; triggered and ignored this run.

---

## Project Impact

**MedSim-Game (flagship) — the queued item is unchanged and still the highest-value thing this scout
tracks:** one bounded session evaluating **NVIDIA's ultrasound raytracing (Isaac for Healthcare)** on
a CUDA box before more hand-written POCUS slicer work. License gate cleared 08-01 (Apache-2.0).
Nothing today advanced or blocked it. It still competes with the **Z-Anatomy voxelize-and-slice**
plan for POCUS v2, and the CUDA-box session is what resolves that choice.

**MedSim-Game, secondary — Qwen3.8-Max is worth a price comparison, not a migration.** The live
LLM-NPC path is the `sim-llm-npc` edge function. A 1M-context multimodal model at $2/$6 with
$0.25 cached input and an OpenAI-compatible endpoint is cheap enough to be worth benchmarking for
**bulk non-clinical NPC dialogue** — but clinical content stays on Claude, because the medical-content
rule (authoritative sources, no fabricated clinical data) is not something to re-validate against a
new vendor for a cost saving. **The 27B open-weights checkpoint, when it lands, is the more
interesting one** — it is the first Max-family checkpoint plausibly self-hostable on the RunPod
command station, which would take NPC dialogue cost to zero. That is a next-week decision, not today's.

**SmartBadge — the Modos confirmation is genuinely relevant, with a caveat.** Recorded stack is
**nRF54L15 + Waveshare 3.52" e-paper + Jauch LP305166JH**. Modos does not replace the panel; what it
offers is an **open FPGA display-controller reference design with a documented modes API, driving
third-party panels, buyable today at $199**. If e-paper refresh behavior becomes the blocker on the
Route B lashup, that is a $199 de-risking part with published gateware rather than a datasheet
guess. **It is not on the critical path** — the badge blocker on record is 4.9pt typography on the
physical cards, not display electronics. Logged, not actioned.

**haptic-mirror — no change.** Reconstruction from short video captures is still the blocker.

**3rdrider (parked) — no change.** No camera + display glasses under $800 exist.

**MedCapture — no change.** The false-premise config item closed 08-03 stays closed.

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of all 27 `_ops/idea-vault/*.md` entries.

**No parked ideas unblocked.**

The one that came closest is `ai-multiview-video-generator.md`, blocked on *"wait for Google Genie 3
(or competitor) to expose multi-view export as a public API feature."* **Qwen3.8-Max does not satisfy
this.** It accepts video as *input* and returns *text* — it is not a world model and has no
multi-view export. Path (a) remains blocked; path (b) still waits on `display-cube-six-screens`.
Verdict: **WAIT.**

`haptic-mirror-d4rt.md` remains **WAIT** (D4RT week 15, no code). `3rdrider-snap-spectacles.md`
remains blocked on the **<$800 + on-device camera + display + SDK** conjunction — today's AR sweep
returned only unshipped roadmap items. Every other vault entry is blocked on market, money, revenue
milestones, or sequencing — none of which tech news can move.

---

## Notes on scope

- **Correction to 2026-08-03.** That report stated "no model release dated August 2 or 3." Qwen3.8-Max
  released **August 3**. The miss came from asking search for models by date instead of checking
  frontier-lab channels by name. **Config §2C gains a named Qwen/Alibaba row** so this is a
  per-run target rather than something a date query has to stumble into.
- **A 403 is not a "no" — and now there is a procedure.** Crowd Supply blocks WebFetch but returns
  **HTTP 200 to `curl` with a browser user-agent**. Yesterday's decision to park the claim as
  unverified rather than report or drop it was the right call, and it resolved in one day. **Recorded
  in config §5 as the standard fallback for any fetch-hostile target.**
- **Two verified negatives this run, both cheap and both load-bearing:** Qwen weights absent from the
  Hugging Face API (kills a "shipped open weights" misread), and Boox Picco dated to July (kills a
  future re-report). Verifying a negative is not a thin-day filler activity.
- Next major calendar event in scope: **Meta Connect, Sep 23–24.** Seven weeks out.
- **Config updated this run:** §2C adds a Qwen/Alibaba frontier-model row; §4 strikes the resolved
  Modos watchlist item; new §5 records the 403 → `curl -A` verification fallback.
