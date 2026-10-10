# Tech Scout Report — 2026-10-10

**Window:** 2026-10-08 → 2026-10-10 (2 days; normal daily cadence, no gap backfill). No major industry event in window (AUSA Oct 12–14 is next).

**Verdict: thin day.** Nothing in the window changes a decision. There are three small open-weight drops and one headset price. No watchlist item closed.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing shipped. Pimax's price is listed under Hardware. The Samsung FCC clearance and Snap's pop-up store were in the Oct 5 roundup and are regulatory or retail news, not ships. Both are tracked below.

### Spatial Computing / 3D
- Nothing shipped. Checked: **three.js** is still r186 (09-24). **gsplat**'s last tagged release is still v1.5.3. **i4h-workflows** is still at v0.9-rc1 (10-07), with no final release.

### AI / ML
- **Qwen-Image-2.1-Turbo (HF, Oct 9)**: [huggingface.co/Qwen/Qwen-Image-2.1-Turbo](https://huggingface.co/Qwen/Qwen-Image-2.1-Turbo). This is a distilled, fast text-to-image model in the Qwen-Image-2.1 family, which has been tracked since 10-02. Its license is tagged `other`, so read it before any commercial use. For MedSim, it's a cheap self-hosted option for scenario, poster, and UI art. It isn't a clinical tool.
- **Mistral Voxtral-Mini-4B-Realtime-Arabic + LIDstral-Arabic (HF, Oct 8)**: [Voxtral-Mini-4B-Realtime-Arabic](https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-Arabic) · [LIDstral-Arabic](https://huggingface.co/mistralai/LIDstral-Arabic). These are an Arabic real-time speech recognizer and a language-ID model. Relevance is low. Note only that the Voxtral realtime family now has language-specific variants, which matters if MedSim voice ever goes multilingual.

### Hardware
- **Pimax Crystal Pro priced at $1,399 (week of Oct 9)**: [vr.org weekly roundup](https://vr.org/articles/this-week-in-vr-2026-10-09). This is the price only. The ship date is inconsistent: the press release says "TBA", the FAQ says spring 2027, and the store says 2027. The 60G AirLink kit is +$599. You can't buy it yet, so it changes nothing.
- **Boox P6 Pro**: the "Oct 9" date on the watchlist traced to **2025** coverage, so it was a stale item. It is dropped. The Boox event (Oct 19/21) stays.

---

## Nothing New (Watchlist)
- **Mistral Large 4 weights**: API preview only since 10-06. Weights are promised "by end of month."
- **Reflection AI Beam weights**: still nothing on HF (re-checked 10-10). The October promise stands.
- **Gemini 4 Argon API**: still gated.
- **Genie 3 public API**: none.
- **Apple Foundation Models open source**: no repo.
- **D4RT code/weights**: nothing (no longer a blocker).
- **Qwen 4**: roadmap only. Only Qwen-Image-2.1-Turbo shipped.
- **World Labs Atlas API**: early access only.
- **Snap Specs ship**: $2,195 pre-orders, "later this year." The LA pop-up runs to 11-07.
- **XREAL Aura general-public ordering**: "coming weeks." Android Authority reports mid-November shipping.
- **Samsung Android XR glasses**: ➕ NEW. FCC-cleared (SM-O200P/J). A November launch is reported, with no price. They have no display, so they don't move 3rdrider.
- **Ray-Ban Meta Audio first ship**: **Oct 13** (3 days).
- **Vuzix Shrike price/SDK**: none. Watch AUSA, Oct 12–14.
- **Meta VR Start competition**: closes 11-18.
- **FDA CDRH FY2027 comments**: close 11-30 (51 days).
- **i4h v0.9.0 final**: still rc1.
- **Boox new-generation event**: Oct 19/21.

---

## Project Impact
- **MedSim-Game**: no change. Haiku 5.5 (10-07) is still this quarter's lever. Qwen-Image-2.1-Turbo is an optional art-pipeline tool, pending a license read.
- **3rdrider / haptic-mirror / MedCapture / BadgeMedia**: no impact.

## Parked Idea Unblocks
No parked ideas unblocked.
- `3rdrider-snap-spectacles.md`: the requirement is under $800, Rx-compatible, and with display + SDK. Samsung's first glasses have no display, and the Aura and Specs are both over $800. Still blocked.
