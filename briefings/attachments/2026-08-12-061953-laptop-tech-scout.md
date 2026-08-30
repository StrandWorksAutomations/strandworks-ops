# Tech Scout Report — 2026-08-12

**Window:** 2026-08-11 → 2026-08-12 09:15 EDT (normal daily cadence; prior report [scout-2026-08-11.md](scout-2026-08-11.md)).

**Verdict: thin day on shipped artifacts.** Nothing new shipped in AR/smart glasses, spatial computing, AI/ML, or medical AI in the window. Per the daily cadence rule that is the expected result, not a failure.

Three things worth the ink:

1. ⏰ **Made by Google has NOT happened yet.** It is tonight at 6:00 PM ET — **~9 hours after this run closed.** The single task yesterday's run assigned to this one is **not executable at this hour**. See below.
2. 🆕 **A real coverage gap found: the EU AI Act has never appeared in this scout.** Zero hits across every prior report — the six "AI Act" matches are all **Colorado**. Obligations took effect **August 2**.
3. ✅ **Two zero-hit names investigated, both negative** — and one of them (`i4h-workflows`) is a textbook reproduction of the `pushed_at` trap the config warns about.

---

## ⏰ Made by Google — deferred, not swept

Yesterday's run closed with one instruction: *"Sweep Made by Google (Aug 12, 6 PM ET) in full … specifically whether Gemini 3.5 Pro GA is announced there. This is the falsifiable test of a rumor that has missed four times."*

**That test cannot be run yet.** The event is 6:00 PM ET today; this run executed at **09:15 EDT**. Nothing has been announced. Reporting on it now would be exactly the rumor-repetition this scout exists to avoid.

**Pre-event state, recorded now so tonight's check is a genuine diff and not a hindsight rationalization:**

- **Gemini 3.5 Pro is NOT GA as of this run.** Verified against Google's own surfaces — [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog), [DeepMind model page](https://deepmind.google/models/gemini/), and a [Google AI Developers Forum thread](https://discuss.ai.google.dev/t/where-is-gemini-3-5-pro/176134) from ~1 week ago where users are still asking where it is. Status: partner testing, no date.
- **The [digitalapplied dated ledger](https://www.digitalapplied.com/blog/ai-model-releases-august-2026-tracker) has no Gemini 3.5 Pro entry at all** — its only Gemini reference is 3.1 Flash as the Imagen 4 replacement.

**Action: this needs a run 2 after 6 PM ET tonight.** That is the whole point of the mechanism argument made yesterday — the rumor is testable today and only today.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Nothing shipped.** Both per-run diffs are flat:
  - **Snap Newsroom** — headline list unchanged. Newest remains *"See for Yourself: Watch the SPECS Launch on September 16"* (posted **07.30.26**). No new post. [newsroom.snap.com](https://newsroom.snap.com/)
  - **Lens Studio 5.23.1 (released Aug 5)** — unchanged for the **fifth consecutive run**. [ar.snap.com/download](https://ar.snap.com/download)
- No movement on Samsung Jinju pricing, Ray-Ban Gen 3, or XREAL.

### Spatial Computing / 3D

- **Nothing shipped.** All four monitored surfaces flat:
  - **SpAItial blog** — newest post still **Echo-2, 2026-04-28**. Baseline holds. (Fetched via `curl` + browser UA; the site 403s WebFetch.)
  - **World Labs / Marble release notes** — newest still **2026-04-02** (Marble 1.1 / 1.1 Plus). Baseline holds.
  - **`nerficg-project/faster-gaussian-splatting`** — ⚠️ **quiet, and only `/events` proves it.** Events since 08-10 are **exclusively `WatchEvent` and `ForkEvent`** — stars and forks, **zero pushes, zero PRs, zero commits.** A `pushed_at` check would have misread the fork as activity.
  - **`MrNeRF/LichtFeld-Studio`** — **genuinely active today** (7+ pushes to `licht_format`, a push to `feat/custom-vulkan-inference`, PR reviews, branch `fix/1450-rml-ui-noops` deleted). **But no release and no tag.** Ongoing dev, not a drop. Logged as activity, not news.
- **MCP spec blog** — post list unchanged; newest remains **The 2026-07-28 Specification**. No new revision.

### AI / ML

- **Nothing shipped in-window.** The [digitalapplied dated ledger](https://www.digitalapplied.com/blog/ai-model-releases-august-2026-tracker)'s newest *confirmed* entry is **August 6 (OpenAI GPT-5.6 Sol)**. Everything it lists for "week of August 10" is scheduled, not shipped.
- **Anthropic** — newest post **August 7** (*"Improving Fable 5's biology safeguards"*). Nothing Aug 10–12. [anthropic.com/news](https://www.anthropic.com/news)
- **Every model name surfaced by today's sweep is already logged.** Cross-checked by `grep` against all prior reports: Seedance 2.5 (logged 08-10), Muse Spark 1.2 (5 reports), Muse Glimmer (3), Qwen Image 3.0 (1), GPT-5.6 Luna/Sol (9), Thinking Machines Inkling (4), DeepSeek-V4 (5). **No new AI item today.**

### Hardware / Medical

- **No new FDA AI clearance in-window.** Most recent remain UpDoc (cleared Dec 23 2025, announced June 2026) and Aidoc (Jan 2026) — both long-logged. Cumulative authorization leaders, for reference: GE HealthCare 120, Siemens Healthineers 89, Philips 50, Canon 45, United Imaging 38, Aidoc 31, DeepHealth 28. [IntuitionLabs tracker](https://intuitionlabs.ai/articles/fda-ai-medical-device-tracker)
- **NVIDIA Isaac for Healthcare — no new release.** See the negative verdict below; the apparent Aug 11 activity is not real.

---

## 🆕 Coverage Gap Closed — the EU AI Act

**`grep -il "EU AI Act" scout-*.md` → zero hits.** The six `"AI Act"` matches across prior reports are **all the Colorado AI Act** (SB24-205 → SB 26-189). The EU regime — the one that actually governs medical-AI software — has never been covered by this scout.

**What is in effect right now (as of 2026-08-02, ten days ago):**

| Provision | Status |
|---|---|
| **Art. 50** — transparency obligations for *deployers* (disclose AI interaction / AI-generated content) | ✅ **In effect since 2026-08-02** |
| **Art. 4** — AI literacy obligation | ✅ **In effect since 2026-08-02**, unchanged by the Omnibus |
| **High-risk AI in regulated products** (MDR/IVDR medical devices) | ⏸️ **Pushed 2027-08-02 → 2028-08-02** |
| **High-risk standalone systems** | ⏸️ **Pushed to December 2027** |

The delays came from the **"Digital Omnibus"** (political agreement **2026-05-07**). The Act classifies AI for diagnosis, clinical decision support, treatment recommendation, patient triage, and patient monitoring as high-risk; the substantive additions are Art. 10 (data governance), Art. 12 (automatic record-keeping/logging), and Art. 14 (human oversight as a *design* requirement).

Sources: [Tandem Health](https://tandemhealth.ai/resources/knowledge/eu-ai-act-explained-what-healthcare-organisations-need-to-know) · [IntuitionLabs](https://intuitionlabs.ai/articles/eu-ai-act-pharma-medical-device-compliance) · [MAIA MedTech deadlines](https://www.getmaia.ai/en/blog/eu-ai-act-in-der-medtech-was-medizintechnik-unternehmen-2026-wissen-und-tun-mussen) · [RAPS on high-risk classification guidelines](https://www.raps.org/resource/eu-commission-drafts-guidelines-on-classifying-high-risk-systems-under-the-ai-act.html)

**Honest scoping for MedSim — this is a flag, not an alarm.** MedSim-Game is a *training simulator*, not a medical device: it does not diagnose, triage, or recommend treatment for a real patient, so the MDR/IVDR high-risk path most likely **does not** attach, and that path is 2028 regardless. What plausibly *does* touch it, and is live today, is **Art. 50 transparency** — LLM-driven NPCs and AI-generated scenario content shown to an EU user. That is a labeling question, cheap to satisfy, and only bites if/when there are EU users. **No action required now; it belongs in the record before a launch decision, not after.**

---

## Zero-Hit Name Verdicts

Per the standing rule: a name with zero `grep` hits gets verified in the same run, and **the verdict gets reported either way** — including the negatives, so the next run does not re-chase.

| Name | Verdict |
|---|---|
| **GSPrior** (`takeshie/GSPrior`, CVPR'26 — *3DGS with Self-Constrained Priors for High Fidelity Surface Reconstruction*) | ❌ **Real repo, but not news and not usable.** Last real commit **2026-05-22** (three README touch-ups); repo created 2026-03-17; 85 stars. **`license: none`** — no LICENSE file at all, so there is no grant to rely on. Not in-window, not adoptable. **Do not re-chase** unless a license appears. |
| **`isaac-for-healthcare/i4h-workflows`** | ❌ **Falsified — `pushed_at` trap, textbook.** The org listing showed `pushed_at = 2026-08-11T02:16Z`, which reads as in-window activity. The **commit log's newest entry is 2026-07-23** ("Update tutorial package references…"), and the newest release is **v0.7.1, 2026-07-23**. The Aug 11 push touched no code. **This is precisely the failure mode §2B warns about**, reproduced on a different repo than the one the warning was written for — confirming the rule generalizes beyond the GS row. **No new Isaac for Healthcare release.** |

Other org repos, all stale, for completeness: `Cosmos-H-Dreams` 2026-07-27, `i4h-tutorials` / `i4h-asset-catalog` 2026-07-21, `i4h-sensor-simulation` 2026-07-20.

---

## Nothing New (Watchlist)

| Item | Status |
|---|---|
| **Gemini 3.5 Pro GA** | ⏳ **Still preview-only at run time.** Fifth slip pending. **Tonight's Made by Google is the falsifiable test** — see top of report. |
| **Qwen3.8-Max / Qwen3.8-27B weights** | 📉 **Periodic-watch (downgraded 08-11) — not re-probed today, per instruction.** The ledger still lists open weights as "week of August 10, license undisclosed" — i.e. the vendor's own tracker now carries the license cloud as an open question. Next check ~08-18 unless Alibaba names a date. |
| **Radiance Fields newsletter (August issue)** | ⚠️ **Now 11 days overdue** (was 8 days on 08-09). Archive newest remains **July 1** ("Gaussian Splatting in June 2026"). The strict 1st-of-month cadence — unbroken Mar/Apr/May/Jun/Jul — is now **decisively broken**. Reminder: this is a *lagging digest*, so its absence costs nothing in coverage; it only removes a completeness-audit backstop. |
| **Snap SPECS launch** | 📅 **September 16, Los Angeles** — unchanged, 35 days out. |
| **Meta "even bigger models coming soon"** | 📋 Roadmap only, no artifact. Unchanged. |
| **Agent Plugins v1.0.0** | Unchanged — still zero release tags, still awaiting a client shipping a *reader*. |
| D4RT code, Genie 3 dev API, NVIDIA T2000/T3000, Ray-Ban Gen 3, Apple Foundation Models open-source, Mayo/Microsoft model, ARPA-H report, Pixel Buds Sight (**falsified 08-08, recurred 08-09 — do not re-chase**) | Unchanged from 08-11. |

---

## Project Impact

### MedSim-Game (flagship)

- **No new direction today.** Yesterday's correction stands unchanged: the Muse Glimmer eval belongs on the **Shadow VM** or a spot GPU hour, **not** the 16 GB Mac; the 32K context ceiling keeps clinical-decision arbitration on Opus 5.
- **One item added to the record, no action:** EU AI Act **Art. 50 transparency** is live as of Aug 2 and is the only provision plausibly touching MedSim (AI-generated scenario content / LLM NPCs shown to EU users). The medical-device high-risk path is both **probably inapplicable** to a simulator and **deferred to 2028** anyway. File it against a future launch decision.
- **NVIDIA Isaac for Healthcare gave nothing today** — the apparent activity was branch housekeeping. Cosmos-H-Dreams remains at 2026-07-27, Apache-2.0 (closed 08-01), with the two residual pre-ship checks still open: `THIRD-PARTY-NOTICES`, and weights licensed separately from code.

### MedCapture / Sim-Lab / 3rdrider / haptic-mirror

- **No change.** `3rdrider` remains the only thread with a near-term test, and that test is **tonight**, not this morning — any Android XR / display-eyewear detail out of Made by Google.

---

## Parked Idea Unblocks

Re-ran the `_ops/idea-vault/*.md` `blocked_on:` cross-reference against this window.

**No parked ideas unblocked.**

Explicitly checked and not moved:

- `haptic-mirror-d4rt` — blocker is D4RT code *or* equivalent open 3D-world-reconstruction tooling. Nothing shipped; SpAItial and Marble both flat; GSPrior is unlicensed and three months stale. **No movement.** The standing **$5 World Labs video→world test** remains the cheapest live probe of this blocker and is still unspent.
- `ai-multiview-video-generator` — path (a) was already **PROMOTE**d on 08-06 (Marble portable PLY/GLB export). Nothing today changes it; it is waiting on execution, not on news.
- `3rdrider-snap-spectacles` — blocker (<$800 consumer AR glasses w/ SDK) partial-satisfied 08-10. Snap SPECS **Sept 16** is the dated event; tonight's Google event is the nearer test. **No new hardware today.**
- `military-parallel-pipeline`, `medsim-school-employer-custom-content` — blocked on market/customer milestones, not weight availability. Unmoved.
- `runway-dev-portal-exploration` — `active`, blocked only on ~$25 of credits. Still the one vault item whose blocker is **a decision, not an external event**. Third consecutive report flagging this.

---

## Notes for the next scout

1. 🔴 **RUN 2 TONIGHT, after 6:00 PM ET.** Sweep **Made by Google** in full: Pixel 11 / 11 Pro / XL / Pro Fold, Watch 5, any **Android XR / display-eyewear** detail, and **specifically whether Gemini 3.5 Pro GA is announced.** This report deliberately records the pre-event state so tonight's is a true diff. Do not let this slip to tomorrow's run — a keynote swept 18 hours late is how the Snap SPECS post was missed for five runs.
2. **Add the EU AI Act to `TECH_SCOUT_CONFIG.md` §2 as a tracked regulatory surface.** It went 100+ runs uncovered while Colorado's version was tracked six times. Next dates that matter: **2027-12** (standalone high-risk), **2028-08-02** (AI in MDR/IVDR products).
3. **Do not re-chase:** GSPrior (unlicensed, stale), `i4h-workflows` Aug 11 push (housekeeping), Pixel Buds Sight (falsified twice).
4. **Do not re-log as new:** Muse Glimmer + GGUF quants, Seedance 2.5, Muse Spark 1.2, GPT-5.6 Sol/Luna, Qwen Image 3.0, Inkling, Kimi K3, Opus 5, Snap SPECS Sept 16, Lens Studio 5.23.1, FastGS / OpenUSD 26.03 / World Labs Spark 2.0.
5. **Qwen3.8** — periodic-watch; next probe ~08-18.
6. **Method note that earned its keep today:** `/events` was the *only* check that correctly read `faster-gaussian-splatting` as quiet (stars/forks ≠ work) **and** `i4h-workflows` as quiet (`pushed_at` ≠ work). Two repos, two opposite naive-check failures, one correct method. Keep it.
