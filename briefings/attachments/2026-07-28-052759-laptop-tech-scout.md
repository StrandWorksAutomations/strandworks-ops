# Tech Scout Report — 2026-07-28 (run 2)

**Window:** 2026-07-28 01:49 → now (same day). Prior report: `scout-2026-07-28.md`, written 01:49
today, which covered the full 2026-07-20 → 2026-07-28 gap.

**This is a same-day second run.** It does not supersede `scout-2026-07-28.md` — that report stands
as the substantive one for this date. Read it first.

## Verdict

**Nothing material shipped in the focus areas in the hours since the 01:49 report.** Per the daily
cadence rule, that is the expected result and this report stops short rather than padding.

Swept: AR/smart-glasses SDK + hardware, Gaussian splatting / 3DGS tooling, open-weight and frontier
model releases, Gemini 3.5 Pro GA status. All either unchanged or already covered in the 01:49
report.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing new. No SDK, hardware, or dev-program announcement landed today.

### Spatial Computing / 3D
- Nothing new shipped. See watchlist addition below re: Khronos.

### AI / ML
- Nothing new. **Gemini 3.5 Pro is still not GA** as of today — confirmed again against the public
  API catalog; the live Pro tier remains `gemini-3.1-pro`, and Google's own Pro page still carries a
  "3.5 Pro coming soon" badge. [The AI Rankings status tracker](https://theairankings.com/google/gemini-3-5-pro/) · [Coursiv](https://coursiv.io/blog/gemini-3-5-pro). Fifth consecutive miss; the 01:49 report's read — that Google shipped a Flash tier on July 21 while the Pro tier stayed vapor — holds.

### Hardware
- Nothing new.

### Medical / Clinical AI
- Nothing new.

---

## Refinements to the 01:49 report

These are corrections/additions to today's earlier report, not new-in-window news.

1. **The Android XR developer track is not absent — it is Google's, not Samsung's.** The 01:49
   report concluded that the 3rdrider gate had moved to "the missing Android XR developer program."
   That is accurate for **Samsung** (no dev program, no SDK, no guidance for Intelligent Eyewear),
   but it understates what exists: Google announced the **Android XR Developer Catalyst Program** on
   **May 19, 2026**, handing selected developers **XREAL Project Aura dev kits** —
   application at **`g.co/dev/catalyst`**. [Road to VR](https://roadtovr.com/google-android-xr-developer-program-free-ar-glasses/). Jetpack XR SDK has also been iterating publicly, and **Developer Preview 4 (May)** targets one codebase across the Galaxy XR headset, wired display glasses, and audio-only intelligent eyewear, with capability tiers surfaced at runtime rather than a separate SDK per form factor. [VR.org](https://vr.org/articles/galaxy-unpacked-july-22-galaxy-glasses-android-xr-developer-watch-2026).
   **Caveat:** I could not verify current intake status — `developers.google.com/xr` returns 404 and
   the Catalyst landing page was not reachable for confirmation. Treat the program as existing but
   its application window as **unverified**.
   **Why it matters:** this is a concrete, free-hardware path toward the 3rdrider blocker that the
   01:49 report did not name. It does not change the recommendation (still WAIT — Project Aura is
   display-glasses without the camera-plus-prescription profile the idea needs), but the *action*
   available is "apply to Catalyst and check status," not "wait for a program to exist."
2. **Two models missing from the 01:49 model-wave list:** **MiniMax M3 Pro** (2.7T) and **DeepSeek
   V4** (mid-July official release) both landed inside the covered window and were not logged.
   [Open-weight wave tracker](https://www.digitalapplied.com/blog/open-weight-model-wave-july-2026-momentum-tracker). Neither is portfolio-changing; logged for completeness. Release cadence across the window was roughly **one new model family on OpenRouter every 2.2 days**.
3. **Kimi K3 weights landed July 26**, a day ahead of the July 27 target the 01:49 report used.
   Day-0 hosted access from Together AI and Modal. [explainx.ai](https://www.explainx.ai/blog/kimi-k3-open-weights-2-8-trillion-parameters-july-2026). The license correction in the 01:49 report is unaffected and stands.

---

## Nothing New (Watchlist)

Rolled forward from `scout-2026-07-28.md`, plus one addition:

- **NEW — Khronos `KHR_gaussian_splatting` glTF extension: still a release candidate, not ratified.**
  RC announced **Feb 3, 2026**; ratification was targeted for **Q2 2026** and has not been confirmed
  as of today. [Khronos press release](https://www.khronos.org/news/press/gltf-gaussian-splatting-press-release) · [spec on GitHub](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_gaussian_splatting). Worth tracking: ratification is what makes splats a first-class citizen in the same asset pipeline MedSim already uses for GLB, rather than a parallel format track. Check monthly.
- **DeepMind D4RT** — week 12, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — still none. Access remains Project Genie via AI Ultra ($250/mo, above the $200/mo infra gate).
- **Gemini 3.5 Pro GA** — missed again (see above).
- **Apple Foundation Models open-source** ("later this summer") — ~5 weeks of summer left. Check weekly through early September.
- **Snap Specs** — $2,195 preorder, "fall 2026," no sharper date.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — price, ship date, and any developer track all still undisclosed.

---

## Project Impact

No change from the 01:49 report. The single concrete purchasable action for today remains the one it
named: **ST STEVAL-VL53L9 / X-NUCLEO-53L9A1** depth-sensing dev kits, orderable now, inside the
≤$200/mo infra autonomy gate.

The one *new* action surfaced by this run is administrative, not purchasing: **verify whether the
Android XR Developer Catalyst Program (`g.co/dev/catalyst`) is still accepting applications**, since
free Project Aura dev kits are the cheapest possible entry into Android XR and the 01:49 report
treated that track as nonexistent.

---

## Parked Idea Unblocks

Re-ran the cross-reference against every `_ops/idea-vault/*.md` `blocked_on:` field.

**No parked ideas unblocked.** Nothing shipped since 01:49 today, so no blocker moved. The full
per-idea analysis in `scout-2026-07-28.md` stands unchanged, with one refinement:

- **Idea:** 3rdrider / Snap Spectacles AR
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** *"Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"*
  - **What changed:** Nothing shipped. But the *characterization* of the remaining gate changes — see Refinements #1. An Android XR developer program **does** exist (Google's Catalyst, May 19, free Project Aura dev kits), and Jetpack XR DP4 already targets audio-only eyewear as a capability tier. The missing piece is specifically **Samsung's** developer track for Intelligent Eyewear, plus price and display.
  - **Recommended action:** **WAIT** (unchanged), with one cheap side-action: check Catalyst intake status. Re-evaluate at **Meta Connect, Sep 23–24**.

---

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24** (Ray-Ban Gen 3 Scriber/Blazer, confirmed, against an SDK that already ships).
- Two scout runs fired on 2026-07-28 (01:49 and this one). The scout was converted from weekly to
  daily today; if same-day double-runs recur, `run-daily.sh` should be checked for a duplicate
  scheduler registration in `_ops/lib/master_run.sh`.
