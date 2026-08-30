# Tech Scout Report — 2026-08-14

**Window:** 2026-08-12 09:15 EDT → 2026-08-14 (covers the Made by Google keynote + the two days after; prior report [scout-2026-08-12.md](scout-2026-08-12.md)). The instructed "run 2 tonight" after the keynote **did not happen** — this run absorbs it. Window widened accordingly.

**Verdict: one real shipped item, and the keynote test resolved — negatively.**

1. ✅ **Gemini 3.7 Flash shipped GA on 2026-08-13.** Real, in the API, priced, documented. First genuinely new model in this scout since GPT-5.6 Sol (Aug 6).
2. ❌ **The Gemini 3.5 Pro test failed — and the watch should now be retired, not slipped a sixth time.** Made by Google did not mention it. Google instead shipped 3.7 **Flash**. The naming has moved two minor versions past the rumor while the rumored model never appeared.
3. ❌ **Zero Android XR / eyewear content at Made by Google.** The `3rdrider` near-term test that was pending resolves to nothing. Snap SPECS (Sept 16) is now the only dated AR event left.

---

## 🔴 Resolved: Made by Google 2026 (Aug 12, NYC)

The single task the 08-12 run assigned. Swept in full.

**Announced:** Pixel 11 ($899), Pixel 11 Pro ($1,099), Pixel 11 Pro XL, Pixel 11 Pro Fold (~10% lighter), Pixel Watch 5 (41mm $399 / 45mm $429 / Curry Edition $579), Pixel Buds Pro in olive, and **Pixel Tag** ($29, $99/4-pack, on Android Find Hub). Pre-orders opened Aug 12; most of the lineup ships **Aug 20**.
[TechCrunch](https://techcrunch.com/2026/08/12/google-unveils-pixel-11-lineup-new-airtag-rival-and-gemini-features-at-made-by-google-2026/) · [Android Police liveblog](https://www.androidpolice.com/made-by-google-august-2026-liveblog/) · [Tom's Guide live](https://www.tomsguide.com/news/live/made-by-google-2026-live)

**Two negatives, both of which were the actual point of the sweep:**

- **No Android XR. No glasses. No eyewear of any kind.** Not a downplayed mention — absent. Google's XR eyewear (Samsung / XREAL / Warby Parker / Gentle Monster) remains on the "Fall 2026" line set at I/O in May, with no new date, price, or SDK.
- **Gemini 3.5 Pro was not mentioned.** See below.

**Non-hardware, low-signal but real:** Gemini gained connected apps (Granola, Otter.ai, Wix, OpenTable UK, Ticketmaster, Fever, GetYourGuide, Localiza, iHeartRadio, Pandora), rolling out "over the next few weeks." Accessibility: Live Transcribe now does **ASL → text via the Pixel camera**, plus "Rambler" voice input. Pixel Watch adds **insulin-resistance and blood-pressure trend** tracking. [Google blog](https://blog.google/innovation-and-ai/products/gemini-app/new-connected-apps-services-gemini-august-2026/)

---

## Breakthroughs & Releases Since Last Report

### AI / ML

- 🆕 **Gemini 3.7 Flash — GA, 2026-08-13.** Shipped, not previewed. `gemini-3.7-flash`, generally available for production via Gemini API / AI Studio / Android Studio, **Google Antigravity**, and Gemini Enterprise.
  - **1M context, 64k max output, tunable thinking levels (low/med/high)**, same built-in tool suite as 3.6 Flash.
  - **Pricing: $0.75 / 1M in, $3.75 / 1M out through 2026-12-31** — half the launch price of the prior model. **From 2027-01-01 it doubles to $1.50 / $7.50.** The introductory rate is a dated cliff, not a permanent price; anything budgeted against it needs a January line.
  - Pitched at coding and agents, three weeks after 3.6 Flash (July 21).
  - [Google blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/) · [API changelog](https://ai.google.dev/gemini-api/docs/changelog) · [model card](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash) · [9to5Google](https://9to5google.com/2026/08/13/gemini-3-7-flash-launch/)
  - ⚠️ One source ([WindowsForum](https://windowsforum.com/windows-news.4/gemini-3-7-flash-unconfirmed-use-gemini-3-6-flash.442060/)) still lists 3.7 Flash as unconfirmed. It is wrong — Google's own changelog and model page carry it. Noted so the contradiction isn't re-litigated next run.
- **Anthropic** — nothing in-window. Newest post remains **Aug 7** ("Improving Fable 5's biology safeguards"). [anthropic.com/news](https://www.anthropic.com/news)
- **The [digitalapplied dated ledger](https://www.digitalapplied.com/blog/ai-model-releases-august-2026-tracker) has no Aug 12–14 entries at all** — it is stale through Aug 7 and **missed 3.7 Flash**. Second consecutive report where the ledger lagged the vendor's own changelog. Demote it: check `ai.google.dev/gemini-api/docs/changelog` and `anthropic.com/news` first, use the ledger only as a cross-check.

### AR / Smart Glasses

- **Nothing shipped.** Made by Google produced zero XR (above). No movement on Samsung Jinju pricing, Ray-Ban Gen 3, or XREAL.
- **Snap** — Newsroom fetched but **not cleanly diffable this run** (the page is JS-rendered; the raw HTML grep returned only meta/CSP boilerplate, no headline list). Recorded as **unverified, not flat.** No Snap news surfaced through any other channel, so a missed post is unlikely but not excluded. Next run: use the browser MCP, not `curl`, for this surface.

### Spatial Computing / 3D

- **Nothing shipped in-window.** The GS sweep returned only already-logged items: FastGS, Mobile-GS (CUDA release March 2026), the INRIA reference impl, and a routine PyPI `gaussian-splatting` 2.6.4 bump on **Aug 1** (out of window, packaging only).
- **Khronos `KHR_gaussian_splatting`** resurfaced in search and was re-checked: the press release is **2026-02-03**, release-candidate status, ratification expected Q2 2026. Already covered in 10+ prior reports. **Not news — do not re-surface without a ratification announcement.**

### Hardware / Medical

- **No new FDA AI clearance in-window.** UpDoc (K253281, cleared 2025-12-23, announced June 2026) and Aidoc remain the most recent, both long-logged. [IntuitionLabs tracker](https://intuitionlabs.ai/articles/fda-ai-medical-device-tracker)
- The only consumer health hardware in-window is the **Pixel Watch 5 insulin-resistance / BP-trend tracking** above — wellness features, not cleared diagnostics. No clinical claim attached.

---

## Nothing New (Watchlist)

| Item | Status |
|---|---|
| **Gemini 3.5 Pro GA** | 🪦 **RETIRE.** Test run, test failed. Not at Made by Google; not in the changelog; Google shipped **3.7 Flash** while the rumored 3.5 Pro never appeared. The version line has moved past it. Six months of "next event will confirm" is enough — this is a dead rumor, not a delayed launch. Re-open only if Google names it directly. |
| **Android XR eyewear (Google/Samsung/XREAL/Warby Parker)** | ⏳ **"Fall 2026," no date, no price, no SDK.** Made by Google was the plausible venue and passed. Next realistic window: Samsung's own event. |
| **Snap SPECS launch** | 📅 **September 16, Los Angeles** — 33 days out. Now the only dated AR hardware event on the board. |
| **Qwen3.8-Max / Qwen3.8-27B weights** | 📉 Periodic-watch. Ledger still says "week of August 10, license undisclosed" — that week has now **ended with nothing shipped.** Next probe ~08-18 as scheduled. |
| **Radiance Fields newsletter (August issue)** | ⚠️ **13 days overdue.** Archive newest still July 1. Lagging digest — costs no coverage, only a completeness backstop. |
| **Meta "even bigger models coming soon"** / **Agent Plugins v1.0.0** / **D4RT code** / **Genie 3 dev API** / **NVIDIA T2000/T3000** / **Ray-Ban Gen 3** / **Apple Foundation Models open-source** / **Mayo-Microsoft model** / **ARPA-H report** | Unchanged from 08-12. |

---

## Project Impact

### MedSim-Game (flagship)

- **Gemini 3.7 Flash is the only item with a real decision attached, and it is a cheap-tier decision, not an arbitration one.** 1M context + $0.75/$3.75 makes it a credible candidate for the **high-volume, low-stakes** side of the game: NPC chatter, scenario-text generation, content drafting. It does **not** change the standing call that clinical-decision arbitration stays on Opus 5 — a cheaper workhorse doesn't buy clinical correctness.
- **Budget the January cliff now if it gets adopted.** The rate doubles 2027-01-01. A pipeline sized on introductory pricing will silently cost 2× in month five.
- **EU AI Act Art. 50** — unchanged from 08-12. Live, transparency-only, filed against a future launch decision. No action.
- **No new physiology, world-model, or clinical-content tooling.** SpAItial, World Labs, Isaac for Healthcare all flat.

### 3rdrider / haptic-mirror / MedCapture / Sim-Lab

- **3rdrider: the pending test resolved to nothing.** Made by Google had no XR at all. The thread now has exactly one dated event left — Snap SPECS, Sept 16. Nothing to do until then.
- **haptic-mirror, MedCapture, Sim-Lab: no change.**

---

## Parked Idea Unblocks

Re-ran the `_ops/idea-vault/*.md` `blocked_on:` cross-reference against this window.

**No parked ideas unblocked.**

Explicitly checked and not moved:

- **`3rdrider-snap-spectacles`** — blocker is <$800 consumer AR glasses with an SDK. Made by Google was the nearest test and produced **no eyewear whatsoever**. Blocker **unmoved, and one candidate venue eliminated**. Action: **WAIT** until Sept 16.
- **`haptic-mirror-d4rt`** — blocker is D4RT code or equivalent open 3D-world-reconstruction tooling. Nothing shipped; the GS sweep surfaced only already-logged repos. **WAIT.** The **$5 World Labs video→world test** remains the cheapest live probe and is still unspent — fourth report noting it.
- **`ai-multiview-video-generator`** — already **PROMOTE**d 08-06. Waiting on execution, not news. Unchanged.
- **`runway-dev-portal-exploration`** — `active`, blocked on ~$25 of credits. **Fourth consecutive report flagging this as the one vault item whose blocker is a decision, not an external event.** Nothing external will ever unblock it.
- **`military-parallel-pipeline`**, **`medsim-school-employer-custom-content`** — blocked on market/customer milestones. Unmoved.

---

## Notes for the next scout

1. **Retire the Gemini 3.5 Pro watch.** It has been carried across six-plus reports on "the next event will settle it." The event happened and settled it: the model does not exist as a shipping product. Carrying it further is the rumor-repetition this scout exists to avoid.
2. **Demote the digitalapplied ledger to cross-check.** It missed Gemini 3.7 Flash entirely and is stale through Aug 7. Vendor changelogs first.
3. **Snap Newsroom needs the browser MCP, not `curl`.** This run could not verify it. Do not record it as "flat" again without an actual rendered diff — that is how the SPECS post was missed for five runs.
4. **Do not re-chase:** Khronos `KHR_gaussian_splatting` (Feb 3, RC, logged 10× ), GSPrior (unlicensed, stale), `i4h-workflows` Aug 11 push (housekeeping), Pixel Buds Sight (falsified twice).
5. **Do not re-log as new:** Gemini 3.7 Flash (logged here), Pixel 11 line, Muse Glimmer, Seedance 2.5, Muse Spark 1.2, GPT-5.6 Sol/Luna, Qwen Image 3.0, Inkling, Kimi K3, Opus 5, Snap SPECS Sept 16, Lens Studio 5.23.1, FastGS / Mobile-GS / OpenUSD 26.03 / World Labs Spark 2.0.
6. **Qwen3.8** — the promised "week of August 10" has now passed with no weights. Probe 08-18; if still nothing, downgrade to monthly.
7. **A scheduling lesson worth keeping:** the 08-12 run correctly identified that the keynote could not be swept at 09:15 and instructed a run 2. That run 2 never fired, so the keynote was swept **two days late** anyway — exactly the failure the instruction was written to prevent. An instruction to a future run is not a scheduling mechanism. If a dated event falls after a run's execution time, the sweep needs a real scheduled trigger, not a note.
