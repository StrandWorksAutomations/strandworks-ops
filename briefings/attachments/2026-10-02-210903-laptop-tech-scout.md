# Tech Scout Report — 2026-10-02

**Window:** 2026-09-30 → 2026-10-02 (2 days; normal daily cadence — no gap backfill).

**Major event swept in window:** none. The last industry event in range was OpenAI DevDay (Sep 29), fully covered by the 09-30 report.

**Headline shift: the supplier under `_ops/idea-vault`'s only satisfied technical blocker is being acquired, and the last report missed it.** **AMD agreed to acquire World Labs for $8.2B in stock on 2026-09-28** — inside the 09-30 report's own window, on a surface that report was required to diff. Neither AMD's nor World Labs' announcement says anything about Marble, the World API, pricing, or existing customers. Everything else this window is housekeeping: no AR platform movement, no new splat capability, no hardware, no new models.

---

## Miss Backfill — 09-30 run

**`worldlabs.ai/blog` was not diffed.** §2B's World Labs blog row ("**Every run** (post diff)") carries baseline *"newest post = Atlas: A World Model for Spatial Intelligence, 2026-09-01."* Two posts dated **2026-09-28** — "World Labs is Joining AMD" and "To Seek a Newer World" — sat above that baseline when the 09-30 report was written. That report instead carried Atlas as a watchlist item and recommended submitting the Atlas early-access request, with no mention of the acquisition.

`grep -liF "joining AMD" scout-*.md` → **zero hits across the scout's entire history.** The row was added on 2026-09-05 precisely because Atlas had been missed by two consecutive runs; the same row then failed on the single biggest item it will ever see.

**Diagnosis:** the row exists and is correctly worded. It was not executed. That is a different failure from the Snap SPECS / MCP-spec class (watching the wrong surface) and does not want a new row — it wants the per-run fetch list actually run before the prose is written.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **SPECS First Look demo opens — Westfield Century City, Los Angeles, Oct 1.** — [Snap Newsroom, "Making Computing More Human with SPECS"](https://newsroom.snap.com/making-computing-more-human-with-specs). First-party, dated, and the date is inside this window. This is the first public hands-on venue for SPECS. **Why it matters:** low — it is one mall in LA and this user is in Peoria IL. Reported because it is the only dated AR event in the window that actually happened.

- 🔧 **CORRECTION to the 09-30 report: Snap SPECS shipping is NOT "resolved to October."** That report wrote *"**Resolved to 'October':** units are expected to begin shipping October 2026,"* sourced to [VR.org](https://vr.org/articles/snap-specs-enterprise-partners-verizon-cellular-2026) and [iDevice](https://idevice.com/smart-glasses/snap-spectacles/roadmap). **Snap's own newsroom says "Shipping is expected to begin later this fall in the United States, United Kingdom, and France"** — no month. Per §5 *"prefer the artifact over reporting about the artifact,"* the first-party page beats the roadmap aggregators. **Status is "later this fall," unresolved.** Carry forward as unresolved, not as October.

**Checked, no change:**
- **Lens Studio — still `5.24.0` (2026-09-10).** Fetched `ar.snap.com/download` directly per §2A. Baseline holds.
- **Meta Wearables DAT — still `1.0.0` on both platforms.** Newest commit on both repos is `Release 1.0.0` (Android 2026-09-24T10:11Z, iOS 2026-09-24T17:19Z); iOS tags top out at `1.0.0`, Android still has no git tags at all. No commits in window. Publishing still not GA.
- **Snap Newsroom headline diff:** newest post **09.30.26 "Spend Smarter on Snapchat"** (ad-platform/media-planning, no AR content). All SPECS posts remain the 09.17.26 cluster, already reported.
- **Android XR Developer Catalyst — monthly check run (Oct 1 boundary).** [developer.android.com/xr/catalyst](https://developer.android.com/xr/catalyst) still reads **"Applications are now closed."** No second cohort, no future window stated, no waitlist. Unchanged since the June 30 expiry.

**Seen and excluded:**
- *Meta Ray-Ban Display "on sale in Canada and the UK October 1"* — **excluded: already reported, and the date in the search summary is wrong.** International sale began at **Connect, Sep 23–24** (£749 / CA$1,149), covered in full by the 09-26 report; **Oct 13** is the France/Italy/Germany date. `grep -liF "Ray-Ban Display"` hits four prior reports. A summary re-dated an already-reported launch into this window.
- *Samsung AI glasses "November 2026"* — [Sammy Fans, Oct 1](https://www.sammyfans.com/2026/10/01/samsung-prepares-to-launch-ai-smart-glasses-in-november-2026/) · [mixed-news](https://mixed-news.com/en/samsung-intelligent-eyewear-november-launch-no-display-no-price/). **Excluded: not shipped.** No display, no price, no date beyond the month.

### Spatial Computing / 3D

- 🔴 **AMD to acquire World Labs — $8.2B, all stock, announced 2026-09-28.** — [World Labs blog](https://www.worldlabs.ai/blog) · [TechCrunch](https://techcrunch.com/2026/09/28/amd-will-acquire-fei-fei-lis-world-labs-for-8-2-billion/) · [CNBC](https://www.cnbc.com/2026/09/28/amd-fei-fei-li-world-labs.html) · [Fortune](https://fortune.com/2026/09/28/amd-acquires-world-labs-startup-fei-fei-li-8-2-billion/) · [StorageReview](https://www.storagereview.com/news/amd-to-acquire-world-labs-8-2b-all-stock-fei-fei-li-chief-scientist) · [Tom's Hardware](https://www.tomshardware.com/tech-industry/artificial-intelligence/amd-acquires-ai-legend-fei-fei-lis-world-labs-for-usd8-2-billion-imagenet-pioneer-will-become-amd-chief-scientist-as-the-chipmaker-brings-her-lab-in-house).
  - **Terms:** definitive agreement, all-stock, **closing by end of 2026** subject to regulatory approval. **Fei-Fei Li joins AMD as EVP and Chief Scientist.** AMD and World Labs already had an inference-optimization/training partnership; Li and Lisa Su demoed Marble building a 3D scene from a few images earlier this year.
  - 🔴 **The part that matters to us: the announcements are silent on the product.** Neither AMD's release nor World Labs' own post addresses **Marble, the World API, pricing, export formats, or existing customers** beyond saying the team continues model research. — [AI News analysis](https://www.artificialintelligence-news.com/news/amd-world-labs-world-models-enterprise/) · [continuity analysis](https://www.beri.net/article/amd-world-labs-acquisition-marble-world-api-continuity-world-model-hardware-lock-in). Nothing states whether the portable SPZ/PLY/GLB exports or the Nvidia-toolchain compatibility survive, and the terms of service already permit ending the service at any time.
  - **Why it matters — it inverts a finding this scout spent three runs establishing.** 08-06 closed "is Marble's export portable?" → yes, PLY + GLB, no player lock-in, and **PROMOTEd** `ai-multiview-video-generator.md` on that basis. 08-07 closed pricing → **"credits do not expire."** That reassurance is now worth nothing: a non-expiring credit balance against a product with no continuity statement is an unbounded-duration liability, not a perk. The open action item **"spend the $5.00 World Labs minimum on one video→world test"** is still cheap in absolute terms, but it is no longer the *right* $5 — see Parked Idea Unblocks.
  - **It does not break the pipeline.** The capture→scene step is covered twice, and the free half is unaffected: **NVIDIA NuRec** (`i4h-digital-twin/hospital-digital-twin/reconstruct_from_video`) is Apache-licensed, self-hosted, zero marginal cost, and has no supplier exposure at all. **SpAItial Echo-2** publishes **$1.60 / $8.00 per world up front** and is independent. The acquisition narrows the field by one vendor; it does not reopen the blocker.
  - **Second-order read:** a chipmaker paying $8.2B for a world-model lab is the physical-AI analogue of NVIDIA's Isaac/Cosmos play. Expect world-model capability to keep consolidating into silicon vendors, which means **free/self-hosted vendor tooling (NuRec) gets better and independent metered APIs get scarcer.** That argues for the self-hosted path on any future capture→scene work, not the metered one.

**Checked, no change:**
- **Marble release notes — newest entry still 2026-04-02** (Marble 1.1 / 1.1 Plus). Baseline holds. Notably: no post-acquisition note, no deprecation notice, nothing.
- **SpAItial blog — newest still Echo-2, 2026-04-28.** Baseline holds.
- **three.js — `r186` / npm `three@0.186.1`**, unchanged. `KHR_gaussian_splatting` remains `Complete, Ratified`. MedSim's explicit `^0.184 → ^0.186` bump is still open and still will not happen on its own.
- **`nerficg-project/faster-gaussian-splatting`** — read `/events` per §2B, not `pushed_at`: one PushEvent 2026-09-30T11:39Z, everything else WatchEvents. No release, no tag. Non-material.
- **`MrNeRF/LichtFeld-Studio`** — genuinely busy (four commits 2026-10-02: six-term rational camera distortion #2683, `--undistort` image-quality fix #2686, evaluation-gate and CI fixes). **No version release** — newest tags are model artifacts (`model-moge3-v1`, Sep 23). Camera-distortion work, not a capability drop.

**Seen and excluded:**
- **PlayCanvas SuperSplat `v3.5.0` + `v3.5.1` — shipped 2026-10-02, in-window, non-material.** A tracked §2B target releasing inside the window, so it is logged rather than omitted. Contents: strip upper-case extensions from the default export filename (#1059), npm dependency bumps (#1060, #1065), and **require LODs when publishing scenes over 40M splats** (#1064). The LOD requirement is the only behavioral change and it is a publish-side guardrail, not a new capability. **Excluded from Project Impact — nothing to act on.**
- *"FastGS", "LiteGS", "AndrewBoessen/3DGS", "godot-gaussian-splatting"* — surfaced by a generic 3DGS query. **FastGS has 18 prior report hits** (`grep -lF`); the rest are pre-window or unmaintained-adjacent. Nothing new.

### AI / ML

**Nothing shipped in this window.** Vendor changelogs checked directly per §5 (two-source rule), not via a ledger:

- **`developers.openai.com/api/docs/changelog`** — no entries dated Sep 30, Oct 1, or Oct 2. Jumps from Sep 29 (DevDay) straight back to August.
- **`anthropic.com/news`** — two in-window posts, **neither a technical release**: **Oct 1** "Barclays scales Claude to upgrade operations and improve client experience" (customer deployment), **Oct 2** "Anthropic invests $100 million to train 10,000 engineers and tackle the enterprise AI talent gap" (workforce program). No model, no API, no pricing change. Sonnet 5.5 (Sep 28) remains the newest model and was fully covered 09-30.
- **`developers.googleblog.com`** — nothing dated Oct 1–2. One in-window post, **Sep 30: "Accelerating Spatio-Temporal Attention for Video Diffusion on TPUs."** — [post](https://developers.googleblog.com/en/accelerating-spatio-temporal-attention-for-video-diffusion-on-tpus/). Custom JAX/Pallas Splash Attention kernels for sparse attention in video diffusion: **2.40× isolated kernel speedup**, **1.28× end-to-end at 720p** (153.50s → 119.86s), **1.69× end-to-end at 1440p** (2,471s → 1,461s). **Excluded from the shipped list under the no-speculation rule: no code repo, no weights, no API, no library** — it is a TPU-internals case study referencing the external *Sparse VideoGen* paper. Logged because it is the first hard number this scout has on what 2K video-diffusion inference actually costs in wall-clock (~24 min/clip even after a 1.69× win), which is useful context for the Veo-3.1-for-MedSim-scenario-video item that has sat on the §4 list with no expiry.
- **Qwen — nothing new.** `?author=Qwen&sort=lastModified` newest is `Qwen/Qwen-Image-2.1`, `lastModified` **2026-09-30** (in window) but `createdAt` **2026-09-14** — **the exact `lastModified` trap §2B documents.** Excluded. `?search=Qwen4` returns five results, none from Qwen (`luffy19/agri-slm_qwen40k`, four 2024 community repos). Qwen 4 remains roadmap-only.
- **MCP — no spec revision.** `modelcontextprotocol.io/specification/versioning` read directly: **current protocol version is still `2026-07-28`.** `blog.modelcontextprotocol.io` newest post is still **Aug 22, "The New MCP Roadmap."** Both baselines hold.

### Hardware

**Nothing shipped in this window.** No dev boards, edge modules, LiDAR, e-ink, or headset SKU/pricing changes dated Sep 30 – Oct 2. Peripheral items surfaced by the e-ink/LiDAR sweep were all pre-window and already tracked or irrelevant: Waveshare RP2350-ePaper-1.54, a **UGREEN Spectra E-INK iPhone 18 Pro case (Sep 18)**, Ouster REV8 (May 2026), Seyond Hummingbird D1 (CES 2026).

### Medical Simulation Vendors

**Nothing material.** All three §2D surfaces were enumerated by push date and by release/tag.

- **NVIDIA Isaac for Healthcare** — `i4h-workflows`, `i4h-digital-twin`, and `i4h-sensor-simulation` all pushed Oct 1–2. `/events` read on the two with no in-window master commits: real PR/review activity, no releases. Newest release across the org is still **`v0.8.0` (Sep 2)**. In-window master commits on `i4h-workflows` are **#246 "Refresh verified artifacts for 12 i4h skills" (Sep 30)** and **#247 "Complete signed i4h skill refresh" (Oct 1)** — all 14 maintained skills now match their verified signed release contents, with strict OMS certificate verification rejecting unsigned additions, validated against NV-BASE 3.7.1 / SkillSpector 2.9.5. **Excluded: the signed-skill mechanism was already reported on 2026-09-05** (`grep -lF "skill.oms.sig"` → `scout-2026-09-05.md`). This is completion of two remaining bundles, not a new capability. Per §2B's directory-diff rule, the top-level listing was also diffed — no new directories; `skills/` dates to 2026-06-03.
- **MONAI** — org enumerated by push date. **`MONAI 1.6.1` (Sep 27)** is a patch release: docstring fixes, nnUNet test-directory leakage fix, `MetaTensor` `spatial_ndim` tracking, clDice division-by-zero fix, CI noise suppression. No new capability. **`monai-physio` baseline unchanged at `2026.09.1` / PyPI `2026.9.1`.** Non-material.
- **Siemens Healthineers / GE HealthCare** — no announcement dated Sep 30 – Oct 2. Both have standing digital-twin programs (Siemens×Mayo cardiovascular twins, Siemens×MUSC facility planning, GE's hospital-operations twin with two US health systems) but nothing new in window.

---

## Nothing New (Watchlist)

- **Snap Specs consumer shipping** — ⚠️ **de-resolved.** First-party newsroom says **"later this fall"** (US, UK, France), not October. Pre-orders $2,195 + $200 refundable deposit at SPECS.com. First public demo venue opened Oct 1 (Westfield Century City, LA). **No consumer deliveries as of Oct 2.** Carry forward.
- **Meta Wearables DAT public publishing GA** — unchanged. `1.0.0` shipped Sep 24, every new module experimental, submissions not open, no date. **This is now the sole blocker on `3rdrider-snap-spectacles.md`.**
- **Apple Foundation Models framework open-source** — **Watchlist Week 18.** WWDC 2026 committed to "later this summer"; summer ended five weeks ago. Still nothing confirmable from developer.apple.com. The third-party "Apple has open-sourced it" claim remains unverified against Apple's own channels — do not treat as shipped.
- **Google DeepMind D4RT public code / weights** — still nothing. **No longer a blocker for anything** (see Parked Idea Unblocks); demoted to curiosity.
- **Google DeepMind Genie 3 public API** — still AI Ultra subscribers only, US, via Project Genie. No API.
- **World Labs Atlas public API** — early access only; no paper, pricing, model card, or GA date. **Now additionally under acquisition.** The 09-30 recommendation to submit the early-access form is superseded — see below.
- **Alibaba Qwen 4 weights** — roadmap-only. No movement.
- **Android XR Catalyst second cohort** — checked Oct 1, monthly cadence. Still closed, no second cohort announced.

### Dated-deadline assertions (§4 requires this every run)

| Item | Date | Status as of 2026-10-02 |
| :--- | :--- | :--- |
| FDA generative-AI discussion paper comment window | **Oct 19, 2026** | ⏰ **Future — 17 days.** Unchanged, unfiled. |
| Meta $1M hands-first competition — close | **Nov 18, 2026** | ⏰ **Future — 47 days.** Unentered. |
| Meta $1M hands-first competition — winners | **Dec 11, 2026** | Future. |
| AMD / World Labs deal close | **by end of 2026** | ⏰ Future. New this run; regulatory approval pending. |
| Android XR Catalyst cohort 1 | Jun 30, 2026 | ☠️ Expired, already struck. Monthly re-check done. |

---

## Project Impact

**MedSim-Game (flagship).**
- **Nothing in this window requires action.** No AR, no spatial capability, no model, no hardware. The two carried items are unchanged and both are self-inflicted rather than external: the explicit **`three ^0.184 → ^0.186`** bump (the caret will not cross the `0.x` minor) and the **Tempus ECG-MR clearance summary** to read before the next M15 12-lead content pass. Neither moved.
- **The AMD/World Labs read for MedSim is strategic, not tactical:** world-model tooling is consolidating into silicon vendors. The practical consequence is that **the free self-hosted path (NVIDIA NuRec) is the one to build against** if a captured real clinical room ever becomes a MedSim scene — not a metered third-party API that can be acquired out from under the project. This reinforces the existing `?clinic` / ERRoom direction rather than changing it.
- **One datum worth keeping:** Google's TPU post puts 1440p video-diffusion generation at **~24 minutes per clip even after a 1.69× speedup.** If the §4 item "experiment with Veo 3.1 for MedSim scenario video" is ever picked up, that is the order of magnitude to budget — scenario video is a batch/offline asset, not an interactive one.

**MedCapture.**
- No signals. **FDA generative-AI comment window closes Oct 19 — 17 days, unfiled.** The clock is the only news and it has been the only news for three consecutive reports.

**haptic-mirror.**
- **The D4RT blocker is formally dead and the vault entry now says so** — see Parked Idea Unblocks. The acquisition removes Marble as the *preferred* half of the satisfied OR clause but not the clause itself; NuRec is free, self-hosted, and unaffected.

**3rdrider.**
- No movement. DAT pinned at `1.0.0`, publishing still shut. The free work queued on 09-28 — `install-skills.sh claude`, audit the Kotlin codebase against the 1.0.0 surface, build `docs/hud-mockup.html` in `MockDisplayKit` — is unchanged, still costs nothing, still needs no glasses, still un-started. **Do not authorize the $799 purchase off this.**

**BadgeMedia / Tenetrix Insight.** No signals.

---

## Parked Idea Unblocks

**No parked ideas unblocked.** All 27 `blocked_on:` fields checked. **But two were edited this run** — both were flagged by the 09-26, 09-28, and 09-30 reports and never applied, so they were applied rather than flagged a fourth time:

**✅ APPLIED — `_ops/idea-vault/haptic-mirror-d4rt.md`**
- **Blocker was:** *"Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"* · `blocker_kind: "tech"`
- **What changed:** nothing this window — the OR clause has been satisfied since August and the delivery half closed on 09-26. The file was simply still lying about it.
- **Applied:** `blocked_on:` restated to the real blocker — *"no validated procedure and no identified customer for a VR training scene"* — with the full available pipeline recorded inline (NuRec for capture→scene; ratified `KHR_gaussian_splatting` + three.js r186 for delivery) and an explicit note that **D4RT is not required and the filename misleads.** `blocker_kind:` changed `tech` → **`market`**. Added a `supplier_note:` recording the AMD acquisition and directing any new spend to NuRec or SpAItial rather than Marble.
- **Recommended action:** **REVISIT** — it is now a market-validation question, not a technology wait. The filename is still wrong; renaming is a separate call.

**✅ APPLIED — `_ops/idea-vault/regional-ems-ecosystem-simulator.md`**
- **Blocker was:** nothing — the file had `status: active-consideration` and `blocker_kind: "time"` but **no `blocked_on:` field**, so this cross-reference silently skipped it on every run since the entry was created.
- **Applied:** added `blocked_on:` (engineering bandwidth — MedSim-Game is Tier-1 flagship and this is a second system-level build; plus the three use cases are unranked so there is no scoped first deliverable) and a missing `title:`. It will now be evaluated every run.
- **Recommended action:** **WAIT** — correctly parked, but now visibly parked.

**Notes on the others where something plausibly moved:**

- **`ai-multiview-video-generator.md`** — **WAIT on path (a), with a retarget.** Path (a) is a public multi-view/camera-path API. Genie 3 is still AI-Ultra-only with no API; Atlas is still early-access-only. **The change is adverse:** the 08-06 run PROMOTEd this entry specifically on Marble's portable PLY/GLB exports, and Marble's owner is now being acquired with no statement on the product. **The 09-30 recommendation to submit the Atlas early-access request is superseded — do not submit it, and do not spend the $5 Marble minimum.** If this is ever pursued, spend against **SpAItial Echo-2** (independent, $1.60/world published up front) or **NVIDIA NuRec** (free, self-hosted, zero supplier exposure). Path (b) is unchanged and still gated on `display-cube-six-screens` existing first.
- **`3rdrider-snap-spectacles.md`** — **REVISIT, unchanged from 09-26.** Blocker satisfied at Connect; the real remaining gate is DAT public publishing GA, still shut. No movement this window.
- **`runway-dev-portal-exploration.md`** — **WAIT.** Blocker is "time + worthiness of paid API credits." Nothing in this window touches Runway's pricing. Noted explicitly because an acquisition-and-pricing-heavy window invites the wrong inference.
- **`swappable-shells-animated-screens.md`** / **`display-cube-six-screens.md`** — **WAIT.** Both gated on barad-dûr v2. No hardware news in window at all.
- **`ems-event-robot-fleet.md`** — **WAIT.** No Unitree pricing movement.

All remaining entries are gated on internal milestones (MedCapture first paying pilot / first paper, MedSim scenario count, barad-dûr v2, role/licensure conditions), which a 2-day window does not move.

---

## Config changes recommended

1. **No new `TECH_SCOUT_CONFIG.md` row for the World Labs miss.** The row exists and is correctly worded. Adding another would repeat the 09-28 pattern of answering an execution failure with more config. The fix is procedural: **run the §2A/§2B per-run fetch list and record each baseline verdict before writing any prose** — this report does that explicitly under "Checked, no change," which is the shape that makes a skipped fetch visible.
2. **Update the §2B World Labs blog baseline** → *newest post = "World Labs is Joining AMD" / "To Seek a Newer World", both 2026-09-28.*
3. **Add to the §2B World Labs / Marble row:** ⚠️ *under acquisition by AMD ($8.2B all-stock, announced 2026-09-28, closing by end of 2026). No continuity statement on Marble, the World API, pricing, or exports. Treat any Marble spend as supplier-exposed; prefer NVIDIA NuRec (free, self-hosted) or SpAItial ($1.60/world published) for new work. Watch for a deprecation notice in the release notes.*
4. **Strike or rewrite the §4 action item "Spend the $5.00 World Labs minimum on one video→world test."** The premise it was written to test (capture→scene availability) is now better served free by NuRec, and the vendor is mid-acquisition. Recommend rewriting to: *"Run one NuRec video→scene reconstruction (free, self-hosted, Linux + NVIDIA RT-core GPU) to answer the capture→scene question without vendor exposure."*
5. **Mark §4's two applied items complete** — the `haptic-mirror-d4rt.md` rewrite and the `regional-ems-ecosystem-simulator.md` `blocked_on:` addition were both done this run.
6. **§2A Snap row:** record that **snap's own newsroom says "later this fall," and that VR.org/iDevice say "October."** The first-party page wins; the discrepancy itself is worth a line so the next run does not re-resolve it from an aggregator.
