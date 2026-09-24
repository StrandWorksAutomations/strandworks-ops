# Tech Scout Report - 2026-09-24

**Window:** 2026-09-22 → 2026-09-24 (2 days; daily cadence, no gap backfill).
**Major event swept:** **Meta Connect 2026, Sep 23–24, Menlo Park.** Full keynote + product catalogue reviewed.

**Bottom line: the biggest AR day of the year, and it moves a parked idea.** The Meta Ray-Ban Display is now orderable online at **$799** with prescription support and a shipping developer SDK — which satisfies every clause of the `3rdrider-snap-spectacles` blocker except public app publishing. Two frontier model tiers also shipped with live APIs on Sep 22 and were missed by yesterday's report; both are captured below.

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

**SHIPPED — orderable today:**

- **Meta Ray-Ban Display — now sold online, $799 US / £749 UK / $1,149 CAD.** Previously demo-and-retail-only in the US; as of Connect it is orderable online in the **US, UK, and Canada**, with prescription lenses ordered through meta.com in the US and Canada. EU pre-orders open at **€899** (Germany, France, Italy) shipping **Oct 13**. — [Road to VR: international rollout](https://roadtovr.com/meta-ray-ban-display-int-launch-connect-2026/) · [Meta retail FAQ](https://www.meta.com/blog/meta-ray-ban-display-retail-faq/) — **This is the item that matters.** Monocular right-lens display + camera + mics + Neural Band EMG input, prescription-compatible, at $799, with a real SDK. See Parked Idea Unblocks.
- **Ray-Ban Meta Gen 3 — $449, available today.** Slimmer frame, dedicated Meta AI button, 9h battery (up from 8). New Aviator, Zena cat-eye, and Wayfarer shapes; Kylie Jenner / Lisa special editions from $399. — [Engadget: everything announced](https://www.engadget.com/2267230/everything-announced-at-meta-connect-2026/)
- **Ray-Ban Meta Audio — $349, pre-order now, ships Oct 13.** The camera-free "Luna" device, confirmed: **no cameras at all**, six-mic array instead, 43g, 12h battery + 48h from case, Clubmaster and Burbank shapes in 23 combos. Meta's explicit answer to the bystander-privacy backlash. — [Engadget](https://www.engadget.com/2267230/everything-announced-at-meta-connect-2026/)
- **Meta Adventurer Frames — $249, pre-order now, ships Oct 23.** Cheapest entry into the camera glasses line. — [BestInXR recap](https://bestinxr.com/post/meta-connect-2026-everything-announced)

**ANNOUNCED, NOT SHIPPED (roadmap — logged, not actionable):**

- **Meta VR Glasses — $1,299.99, Spring 2027.** ~100g, 5K display, full-color passthrough, tethered puck running Snapdragon Reality Elite, 3+ hours battery, 75 launch titles. Not orderable. — [VR.org](https://vr.org/meta-connect-2026) · [CNBC](https://www.cnbc.com/2026/09/23/mark-zuckerberg-1299-meta-vr-glasses-ai-agent.html)
- **Muse Charm — December 2026, price not announced.** Keychain-sized Muse AI agent device: small display, speakers, mics, fingerprint sensor. No battery life, connectivity, or phone-pairing details given. — [Karmactive](https://www.karmactive.com/meta-muse-charm-ai-device-connect-2026-specs-price-release/) · [Axios](https://www.axios.com/2026/09/23/meta-muse-ai-hardware-handheld-glasses)
- **Hearing enhancement feature — late 2026 (US), $149 one-time or bundled with Meta One.** Turns the glasses into an assistive-hearing device. Clinically adjacent; worth watching for the EMS/nursing angle. — [Engadget](https://www.engadget.com/2267230/everything-announced-at-meta-connect-2026/)

**DEVELOPER STATUS — the one thing that did NOT move:**

- **Meta Wearables Device Access Toolkit is still Developer Preview. Publishing is still not GA.** Meta promised general availability "in 2026" back in Sept 2025; Connect came and went with no announcement. Builds can only reach limited audiences through release channels — you cannot ship an app to the public. — [VR.org: three tiers, toolkit that still cannot publish](https://vr.org/articles/meta-glasses-three-tiers-wearables-toolkit-publishing-connect-2026) · [Meta wearables FAQ](https://developers.meta.com/wearables/faq/) · [GitHub: facebook/meta-wearables-dat-android](https://github.com/facebook/meta-wearables-dat-android)
- Ray-Ban Display has **two build paths**, both live since **May 2026** (not new at Connect): an updated native iOS/Android SDK, and a **Web Apps** route — plain HTML/CSS/JS distributed by URL, rendering to the right-lens display, with Neural Band gesture input. Both now reach customers in the US, Canada, UK, France, Italy, and Germany. — [VR.org: two SDK paths](https://vr.org/articles/meta-ray-ban-display-developer-sdk-2026) · [Meta Wearables Developer Center](https://wearables.developer.meta.com/)

### Spatial Computing / 3D

- **Nothing material.** No D4RT code, no Genie API tier change, no WorldClaw release. Academic 3DGS repos continue to land (VolSplat/ECCV'26, ReSplat, GlobalSplat, ZipSplat) but none is a tooling breakthrough over what the haptic-mirror pipeline already uses. No action.

### AI / ML

Two shipped items below were **missed by the 2026-09-22 report**, which swept Apsara and did not sweep the US model releases the same day. Both are live and priced.

- **OpenAI GPT-6 Sol and GPT-6 Luna — shipped Sep 22, API live.** Sol at **$2 / $10 per MTok** in/out; Luna at **$0.10 / $0.50 per MTok** — roughly **50% below** GPT-5.6's promotional rate. Built on GPT-6 Astra (Sep 3), positioned as cheap high-volume workhorses. Available in API plus ChatGPT Plus/Pro/Business/Enterprise/Edu and Codex. — [TechCrunch](https://techcrunch.com/2026/09/22/openai-launches-gpt-6-sol-and-luna/) · [VentureBeat](https://venturebeat.com/technology/openai-releases-gpt-6-sol-and-luna-models-slashing-api-costs-50-or-more)
- **Anthropic Claude Opus 5.5 — shipped Sep 22.** **$4 / $20 per MTok**, a 20% cut from Opus 5; cache reads **$0.20/MTok**, a 60% cut; ~40% cheaper on typical workloads and 30%+ faster output. Live on AWS, Google Cloud, and Azure. Sonnet 5.5 and Haiku 5.5 signalled "within weeks." — [SiliconANGLE](https://siliconangle.com/2026/09/22/anthropic-releases-claude-opus-5-5-and-openai-counters-with-two-cheaper-gpt-6-models/) · [9to5Mac](https://9to5mac.com/2026/09/22/anthropic-upgrades-claude-with-new-opus-5-5-model-details-here/)
- **Sora 2 API removed today (Sep 24) — watchlist item executed.** `sora-2`, `sora-2-pro`, all dated snapshots, and the Videos API are gone, with **no replacement model** listed. OpenAI now has no video-generation product of any kind (web/app were killed Apr 26). — [OpenAI deprecations](https://developers.openai.com/api/docs/deprecations) · [OpenAI help center](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation)

### Hardware

- Nothing beyond the Meta glasses above. No new dev boards, LiDAR modules, e-ink SKUs, or edge-compute drops in window.

## Nothing New (Watchlist)

- **Meta Wearables DAT public publishing.** THE remaining gate for 3rdrider. Promised "2026," still preview after Connect. 98 days left in the year.
- **Alibaba Qwen 4.** Apsara days 2–3 added nothing: still "in training," no specs, no pricing, no date. Qwen 4.5/Qwen 5 at 5–10T params remain roadmap. — [CellCog](https://cellcog.ai/blog/qwen-4-release-date/)
- **DeepMind D4RT code.** Week 20+; no drop.
- **Gemini 3.5 Pro GA.** Week 19+; no endpoint.
- **Genie 3 developer API.** Still Ultra-only ($250/mo, above the autonomy gate).
- **Apple Foundation Models open-source.** Week 15; no drop.
- **Meta Muse Spark 1.2 open weights.** Day 52+. Connect gave Muse new hardware (Charm) and glasses integration, but no weights.
- **Tencent WorldClaw code.** Still README-only.
- **World Labs Atlas public API.** No change.
- **xAI Grok 4.7/4.8.** Not shipped.
- **Jetpack Compose for XR beta.** Not announced.
- **Samsung/Google Android XR glasses.** Fall 2026 window still open, $600–900 expected; color-display Samsung variant now reported as late 2027. No ship. — [9to5Google](https://9to5google.com/2026/09/10/samsungs-first-android-xr-glasses-with-a-color-display-may-launch-in-late-2027/)
- **Cursor Origin GA.** Waitlist; 49 days to the Nov 12 OpenAI cutoff.
- **NVIDIA GR00T N2 / Jetson T3000/T2000.** End-of-year and Q1 2027.
- **Mayo + Microsoft healthcare model.** 16+ weeks, no delivery.
- **FDA GenAI docket FDA-2026-N-7874.** **T-25 (Oct 19).** Related: FDA's TEMPO pilot is now letting generative-AI devices reach patients pre-authorization — relevant framing for the comment. — [STAT](https://www.statnews.com/2026/09/03/tempo-fda-pilor-generative-ai-medical-device-regulation/)

## Project Impact

- **MedSim-Game (flagship).** Two cost moves worth acting on. Opus 5.5 cuts cache reads 60% ($0.20/MTok) — the physiology-graph and scenario-synthesis prompts are cache-heavy, so that is a direct bill reduction with no code change beyond a model-ID swap. GPT-6 Luna at $0.10/$0.50 is now the cheapest credible tier for bulk non-clinical content passes (asset descriptions, NPC dialogue, placement metadata) where clinical review is not in the loop. Do not route clinical content through a cheap tier. Standing recommendation carries forward: **file the FDA GenAI docket comment, T-25.**
- **3rdrider.** Materially changed for the first time since parking. See below.
- **haptic-mirror.** No change — D4RT still dark, no 3DGS tooling breakthrough.
- **MedCapture / BadgeMedia.** No change. The Meta hearing-enhancement feature ($149, late 2026) is a weak signal for glasses-as-clinical-assistive-device; logged, not actionable.
- **Video generation (any project).** Sora is now fully dead as an API. Anything in the portfolio that assumed an OpenAI video endpoint as a fallback must be re-pointed — Veo, Runway, or LTX are the remaining options.

## Parked Idea Unblocks

- **Idea:** Resume 3rdrider when consumer-grade AR glasses ship at viable price/form
  - **File:** `/Users/jonathanbouren/PROJECTS/_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"
  - **What changed:** Meta Ray-Ban Display, as of Sep 23–24, is orderable **online** at **$799 US** (under the $800 line by $1), is **prescription-compatible** via meta.com in the US and Canada, carries **camera + mics + monocular display** plus Neural Band EMG input, and has a **shipping developer SDK with two paths** — native iOS/Android, and Web Apps in plain HTML/CSS/JS delivered by URL. Every literal clause of the blocker is now satisfied. Before Connect it was demo-and-retail-gated; now it is a normal online purchase.
  - **The caveat that is not in the blocker text:** **public publishing is still not available.** The Device Access Toolkit remains Developer Preview — apps reach only limited audiences through release channels. You can build and wear a 3rdrider HUD; you cannot distribute one.
  - **Recommended action:** **REVISIT.** The blocker as written is satisfied and the idea should come off "parked." Concretely: (1) the **Web Apps path is the cheap probe** — `docs/hud-mockup.html` in the 3rdrider repo is already the design spec and is already HTML/CSS/JS, so porting it to a Ray-Ban Display web app is a far shorter path than the Lens Studio SIK rewrite the Spectacles version needs; (2) do that port **before** buying hardware, since it costs nothing and proves the layout fits a monocular display; (3) treat the $799 purchase as a gated decision for the owner, not an autonomous spend. Rewrite the vault entry's `blocked_on:` to the one thing actually left: **"Meta Wearables Device Access Toolkit public publishing reaches GA."**

- All other parked ideas: no in-window developments. `haptic-mirror-d4rt.md` and `ai-multiview-video-generator.md` remain **WAIT** (no D4RT, no Genie API tier change, no WorldClaw code — and the Sora API removal narrows the generative-video field rather than widening it). `ems-event-robot-fleet.md` remains **WAIT** (no Unitree pricing movement).
