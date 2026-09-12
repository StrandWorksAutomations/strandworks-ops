# Tech Scout Report — 2026-09-11

**Window:** 2026-09-09 → 2026-09-11 (2 days; normal cadence — no gap backfill).

**Major events swept in window:** None. Apple's Sep 9 event was swept in the last report; **Y Combinator S26 Demo Day (Sep 10)** produced no in-focus-area release. Snap Specs (Sep 16), xAI Grok 4.7 (Sep 12), and **Meta Connect (Sep 23–24)** remain outside window.

**Headline shift:** **DeepSeek V4.1 Flash went to general availability on Sep 10 — this reverses last report's "skip it" recommendation.** The model last report described as a self-destructing telemetry beta is now a permanent, priced, 1M-context, natively-multimodal endpoint at **$0.15 / $0.60 per 1M tokens off-peak**. Separately, and more important for the parked ideas: a **catch of something the last two reports missed — WorldSculpt (Alaya Lab), Apache-2.0 code + weights, multi-view video → hundreds of separable object meshes.** That is the open-source, video-input world reconstructor the `haptic-mirror-d4rt` blocker has been waiting 18+ weeks for, and it has been sitting on GitHub since Sep 2.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses

- **Nothing shipped in-window.** No new hardware, no new SDK, no new dev-kit program between Sep 9 and Sep 11. The market is visibly holding for **Meta Connect Sep 23–24** (Ray-Ban Gen 3 "Aperol"/"Bellini") and **Snap Specs Sep 16**. HTC Vive Eagle ($499 US) and the RayNeo iO / GT / GT Max were both covered in the 2026-09-07 report — **roll-forward, not new.**
- **Jetpack Compose for XR — still not beta.** [`androidx.xr.compose` release page](https://developer.android.com/jetpack/androidx/releases/xr-compose) — latest is **1.0.0-alpha11**. SceneCore, ARCore for Jetpack XR, and XR Runtime remain the only beta components, per the [August Jetpack XR beta post](https://android-developers.googleblog.com/2026/08/jetpack-xr-sdk-core-libraries-beta.html). **Week 4** of "to follow soon."

### Spatial Computing / 3D

- **WorldSculpt — Apache-2.0 code AND weights released, video input, scene-scale output. MISSED BY THE LAST TWO REPORTS.** [arXiv 2609.05416](https://arxiv.org/abs/2609.05416) · [github.com/AlayaLab/WorldSculpt](https://github.com/AlayaLab/WorldSculpt) · [project page](https://alaya-lab.github.io/WorldSculpt) · weights at `AlayaLab/WorldSculpt` on Hugging Face.
  - **What it does:** takes **multi-view posed video observations** of a densely cluttered scene and outputs **hundreds of individual object meshes in a shared world frame** — not a single fused mesh, not a splat cloud. It adapts Pixal3D (a single-object generator) with a multi-view conditioning pathway and, notably, **generalizes to full scenes with severe occlusion without any scene-level training.** Ships a photorealistic benchmark (UE-MeshyScene) with ground-truth annotations.
  - **Release verified, not taken on faith:** repo created **2026-09-02**, last pushed **2026-09-07**, 149 stars; HF weights last modified **2026-09-04**. Real inference scripts, real checkpoints, documented setup — not a "code coming soon" placeholder.
  - **Timing honesty:** this landed **before** the Sep 9 report's window and was missed at the time. It is logged here as a catch, not as a Sep 9–11 release. It is the most consequential item in this report regardless.
  - **The license is layered — read this before assuming it is free to use commercially.** [LICENSE](https://raw.githubusercontent.com/AlayaLab/WorldSculpt/main/LICENSE) is explicitly per-component: Alaya Lab's original code and the finetuned weights (LoRA adapters + multi-view aggregator) are **Apache-2.0**; the released datasets are **CC BY 4.0**; the vendored `pixal3d/` directory is **MIT (Tencent)**. **But the third-party base checkpoints are not in the repo and not open — you must download DINOv3, which is under Meta's own DINOv3 License, "neither Apache-2.0 nor MIT."** So the correct characterization is *open code and open finetuned weights on a partially-restricted dependency stack*, not "fully open."
  - **Hardware:** not stated explicitly, but the build references H100-class GPUs and NATTEN CUDA arch flags. Assume a rented A100/H100, not the laptop.
  - **Why it matters to us:** this is the exact capability shape `haptic-mirror-d4rt` was blocked on, and it beats **Hyper3D WorldGen** (last report's headline) on both clauses WorldGen failed — **open-source** and **video capture input** rather than single image. Note the vendor: **Alaya Lab is the same org behind AlayaWorld**, which was already tested on a RunPod A100 in this portfolio. The RunPod path for evaluating it already exists.
- **Hyper3D WorldGen — unchanged.** Still live at `hyper3d.ai/workspace`, still no published pricing or API docs. Roll-forward from Sep 9.
- **World Labs Atlas — unchanged.** Still request-form early access.
- **No D4RT drop. Week 18+.** No code, no weights, no API from Google DeepMind. WorldSculpt now partially obsoletes the wait.

### AI / ML

- **DeepSeek V4.1 Flash reached GA on Sep 10 — the expiry is gone and it is now a real dependency candidate.** [DeepSeek pricing docs](https://api-docs.deepseek.com/quick_start/pricing/) · [OpenRouter listing](https://openrouter.ai/deepseek/deepseek-v4.1-flash) · [Dataconomy](https://dataconomy.com/2026/09/11/deepseek-v4-1-flash-ultralow-token-pricing/)
  - **552B mixture-of-experts, native vision, 1,048,576-token context.** Per DeepSeek, the architecture "dramatically reduces memory and storage requirements for its key-value cache" through sparse expert activation.
  - **Pricing: $0.15 / 1M input, $0.60 / 1M output off-peak; double at peak; cache hits $0.003.** Peak = Mon–Fri 01:00–04:00 and 06:00–10:00 UTC.
  - **Consolidation:** `deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` are **retired** and now route to V4.1 Flash. V4 Pro was slated to route to Flash from 04:00 UTC Sep 14, but **DeepSeek reversed that on user demand and is keeping V4 Pro's API and billing unchanged.**
  - **Why it matters — explicit correction to the last report:** the Sep 9 report recommended skipping this model because it was hard-coded to go offline Sep 10 (`deepseek-v4-flash-expires-on-0910`). What actually happened on Sep 10 is that it **shipped**. At $0.15/$0.60 with a 1M window and native vision, this is now the cheapest credible option for high-volume scenario-text generation in the portfolio. The 300–507 tok/s throughput figure from last report still stands.
- **Anthropic published its first case-based threat intelligence report (Sep 10)** — [Anthropic threat intelligence](https://www.anthropic.com/threat-intelligence) · [Unite.AI summary](https://www.unite.ai/anthropic-details-disrupted-claude-misuse-across-seven-harm-areas/) · [CellCog analysis](https://cellcog.ai/blog/anthropic-threat-report-september-2026/) — covers misuse disrupted between **December 2025 and August 2026** across seven harm areas: cyber operations, influence operations, surveillance, scams/fraud, biological misuse, conventional weapons development, and illicit distillation. Actors included suspected state-sponsored groups, commercial spyware vendors, and state propaganda bodies. Cases involved Haiku, Sonnet, and Opus; **Fable/Mythos-class models appear only in one distillation case.** **Why it matters:** the operationally useful finding is CellCog's framing — attacks increasingly run **on agent frameworks, and the API key is the loot.** This portfolio runs long-lived agent infrastructure (claude-ops droplet, RunPod command station, Shadow VM) with credentials in `/PROJECTS/.env.master`. Not an incident, not an action item under the solo-dev threat model; a reason to keep that file at 600 and out of git, which it already is.
- **Harvey shipped "Tenet," an in-house legal model built on Kimi K3 (Sep 10)** — [Tech Startups roundup](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/) — **Why it matters:** the pattern, not the product. A vertical company took an open base model and finetuned a domain-specific model rather than prompt-engineering a frontier API. That is the same structural choice MedSim would face for clinical content generation, and Harvey is a useful proof that the economics work at vertical scale.
- **IBM + NASA released a Lunar Foundation Model, open-source (Sep 10)** — same roundup. Open weights for lunar imagery analysis. **No portfolio relevance; logged for completeness.**
- **Gemini API changelog: no entries Sep 8–11.** [Release notes](https://ai.google.dev/gemini-api/docs/changelog) — most recent are Lyria 3.5 (Sep 3) and Gemini 3.8 Flash GA (Sep 2), both already reported. **Gemini 3.5 Pro still has no endpoint, no price, no launch entry.**

### Medical / Clinical AI

- **Nothing shipped in-window.** No FDA action, no new clinical model, no new authoritative dataset between Sep 9 and Sep 11.
- **FDA GenAI docket comment deadline (Oct 19) is now 38 days out** — [FDA press announcement](https://www.fda.gov/news-events/press-announcements/fda-seeks-public-feedback-inform-regulatory-approach-generative-ai-enabled-medical-devices). Carried forward from prior reports, still unactioned. The January 2026 CDS guidance and the March 11 revision both stand unchanged.

### Hardware

- **Apple iPhone Duo foldable — announced Sep 10, $1,999.** [Tech Startups](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/) — 7.6" inner display, 5.4" outer cover screen, 2nm A20 Pro, Apple Pencil support. **Why it matters:** a 7.6" foldable running a 2nm inference-capable SoC is a genuinely different target surface for a mobile-first medical sim — tablet-class screen area in a phone-class device. Not worth designing for at launch volumes, but it is the first Apple form factor that makes a two-pane sim layout plausible on a phone.
- **Positron "Asimov" inference processor + Titan server platform — shipping, customers named.** Same roundup — Atlas systems already delivered to **Oracle and Jump Trading**. **Why it matters:** inference-accelerator competition is what eventually moves per-token pricing down. No direct action.
- **Huawei Kirin 9050 Pro shipped** in the Mate XT2 triple-fold. Cambricon 690 and Huawei Ascend 950DT both carry announced price *increases* (Cambricon 20–30%) — **counter-signal to the cheap-inference trend above.**
- **Onyx Boox Picco unveiled** — [Technetbook](https://www.technetbooks.com/2026/09/onyx-unveils-boox-picco-pocket-e-ink.html) — 3.97" E Ink, stripped-down Linux, **~$100, store shelves ~November.** The Picco has appeared in prior reports (Aug 26/28/30); this is a specs-and-date firming, **not a new item.** Note X6 and Palma 3 unchanged.
- **No new Jetson, LiDAR, or dev-board releases in-window.**

---

## Nothing New (Watchlist)

- **Apple Foundation Models framework open-source** — **Week 15.** The "later this summer" WWDC commitment is formally expired. [`apple/foundation-models-utilities`](https://github.com/apple/foundation-models-utilities) and [`apple/python-apple-fm-sdk`](https://github.com/apple/python-apple-fm-sdk) remain companion packages, not the framework. No change.
- **DeepMind D4RT official code** — 18+ weeks since CVPR 2026. **WorldSculpt materially reduces how much this matters.**
- **Gemini 3.5 Pro GA** — no endpoint in the API model list. Slip continues; missed its June I/O target.
- **Genie 3 developer API** — still Ultra-only ($250/mo, above the $200/mo autonomy gate).
- **Jetpack Compose for XR beta** — alpha11, week 4 of "soon."
- **Meta Muse Spark 1.2 open weights** — **Day 39+.**
- **Meta Muse on Ray-Ban glasses** — confirmed coming, no date. Meta Connect Sep 23–24.
- **Alibaba Qwen3.8-Max full open weights** (vision + 1M context) — unchanged.
- **Apple `CoreAILanguageModel` + `MLXLanguageModel`** — org exists, still empty.
- **Cursor Origin GA** — waitlist only; Nov 12 OpenAI cutoff still in play.
- **Ray-Ban Meta Gen 3 (Aperol/Bellini)** — Meta Connect Sep 23–24.
- **NVIDIA GR00T N2 + medical applications** — end-of-year target.
- **Mayo Clinic + Microsoft frontier healthcare model** — 16+ weeks post-announcement.
- **ARPA-H simulation + causal models workshop report** — 8+ weeks.
- **NVIDIA Jetson T3000 + T2000** — Q1 2027.
- **Snap Specs consumer launch** — Sep 16 ($2,195, above the 3rdrider threshold).
- **xAI Grok 4.7** — targeted Sep 12 (tomorrow).
- **Apple smart glasses** — absent from the Sep 9 event; late-2026 preview vs. 2027 launch reporting split.
- **OpenAI Navier–Stokes claim + credit dispute** — no resolution in-window; still unverified, still contested.

---

## Project Impact

- **MedSim-Game (flagship) — two actionable items, one of them a correction.**
  1. **DeepSeek V4.1 Flash is now buildable-against, and last report was wrong to say skip.** The expiry was the entire reason to skip it, and the expiry did not happen — it shipped instead. At **$0.15/$0.60 per 1M off-peak with a 1M-token context and native vision**, this is the cheapest credible engine for bulk scenario-text generation and for vision tasks over the existing asset library. Concrete next step: benchmark it against the current scenario-generation path on a fixed prompt set, measure cost-per-scenario, and check whether off-peak batching (the 2× peak multiplier is avoidable — peak is Mon–Fri 01:00–04:00 / 06:00–10:00 UTC) makes it worth routing bulk generation through. Comfortably inside the ≤$200/mo infra gate at any realistic volume.
  2. **WorldSculpt deserves the spike that WorldGen was queued for — and it is a better fit.** Last report recommended spiking Hyper3D WorldGen against the `?clinic` scene. WorldSculpt is the stronger candidate for that same test on three counts: it takes **video** (you can walk a phone through a real clinic rather than finding one perfect photo), it outputs **separable per-object meshes** directly (which is what a placeable, interactable scene needs — and matches how `?placement` already consumes assets), and it is **code you run yourself** rather than a black-box workspace with undisclosed pricing. The RunPod A100 path from the AlayaWorld test is the natural harness. **Two caveats worth stating before spending the GPU hours:** (a) the DINOv3 dependency is under Meta's own license, so commercial use needs a read before anything ships; (b) the same art-direction objection that killed AI-generated town buildings applies — the realistic value here is **layout and blockout**, not final claymorphic art.
  3. **FDA GenAI docket comment (Oct 19) — 38 days out, still unactioned.** Unchanged recommendation, shorter clock.
  4. **iOS 27 ships Sep 14 (Monday).** Compatibility checkpoint for mobile surfaces; smoke test after it lands.
- **MedCapture (Tier-2)** — no procurement signal in-window. WorldSculpt is *adjacent* — scene-scale training-data generation for embodied AI is the same demand curve — but it is a tool release, not a buyer. Gating condition unchanged.
- **BadgeMedia / Tenetrix Insight (Tier-3)** — no impact.
- **3rdrider (parked)** — no impact. Two full days with zero AR hardware or SDK news; the entire category is holding for Connect.
- **Portfolio-wide** — Anthropic's threat report is worth one read for the agent-framework attack pattern, given how much always-on agent infrastructure this portfolio runs. No action under the solo-dev threat model (no public deploys, creds already 600 and git-ignored).
- **Claude Code substrate** — no in-window releases.

---

## Parked Idea Unblocks

- **Idea:** Resume haptic-mirror training-scenario worldbuilding when D4RT or equivalent worldbuilder ships
  - **File:** `_ops/idea-vault/haptic-mirror-d4rt.md`
  - **Blocker was:** "Google DeepMind D4RT code release, OR equivalent open-source 3D world reconstruction tooling that lets you generate training scenarios from short video captures"
  - **What changed:** **WorldSculpt satisfies the blocker's second clause on its own terms.** Last report upgraded this to REVISIT on WorldGen while honestly noting WorldGen failed two literal requirements — it is closed-source, and it takes a single image rather than video. **WorldSculpt fails neither.** It is code you clone ([github.com/AlayaLab/WorldSculpt](https://github.com/AlayaLab/WorldSculpt)), the finetuned weights are Apache-2.0 on Hugging Face, and the input is **multi-view posed video** — which is precisely "short video captures." Output is hundreds of individually separable object meshes in a shared world frame, which is the form a training scenario actually needs. Verified as a real release (repo pushed Sep 7, weights Sep 4, working inference scripts), not an announcement.
  - **The one honest qualification:** "open-source" is layered. Alaya Lab's code and finetuned weights are Apache-2.0 and the vendored Pixal3D is MIT, but the required **DINOv3 base checkpoint is under Meta's DINOv3 License**, which the repo's own LICENSE flags as "neither Apache-2.0 nor MIT." For research and internal training-data generation this is almost certainly fine; for anything shipped commercially it needs a license read first. That is a narrower caveat than "closed-source," and it does not block a spike.
  - **Recommended action:** **PROMOTE.** This is the first time in 18+ weeks that the blocker's literal text is satisfiable, and the evaluation path is already built — Alaya Lab is the same org as AlayaWorld, which was already stood up on a RunPod A100 in this portfolio. Spend one pod session: capture a short walkthrough video of a real clinical space, run WorldSculpt, and judge the separable-mesh output against what haptic-mirror scenarios actually need. **Watch the pod cost** — the AlayaWorld test ran at $1.39/hr on an A100 and the standing rule is to stop the pod when done. If the output is usable, rewrite the blocker to the remaining real constraint (DINOv3 licensing for commercial use) rather than deleting it.

- **Idea:** AI video / scene generator with synchronized 6-direction output
  - **File:** `_ops/idea-vault/ai-multiview-video-generator.md`
  - **Blocker was:** "(a) wait for Google Genie 3 (or competitor) to expose multi-view export as a public API feature … (b) build it from existing 3D primitives (Blender / Gaussian Splatting / NeRF) plus an AI scene-generation front-end — feasible today but requires the display-cube-six-screens project to exist first as the primary customer of the output."
  - **What changed:** Path (b)'s capability gap, which last report called closed by WorldGen, is now closed **by a tool you can run locally and inspect.** WorldSculpt outputs meshes, and once a scene is real geometry, six synchronized axis-aligned renders are ordinary Blender camera work. Path (a) is unchanged — Genie 3 is still Ultra-only at $250/mo, Atlas is still waitlisted, no public multi-view API exists.
  - **Recommended action:** **REVISIT the file, still WAIT to build** — unchanged conclusion, firmer basis. The remaining blocker is purely the ordering constraint: `display-cube-six-screens` must exist as the consumer, and that is gated behind barad-dûr v2. Update the idea file to strike the "AI scene-generation front-end" gap from path (b) and record that this is **sequencing-blocked, not capability-blocked.**

- **Idea:** Resume 3rdrider when consumer-grade AR glasses ship at viable price/form
  - **File:** `_ops/idea-vault/3rdrider-snap-spectacles.md`
  - **Blocker was:** "Consumer AR glasses with prescription compatibility, on-device camera+mic+display, and developer SDK shipping at <$800"
  - **What changed:** Nothing. Zero AR hardware or SDK releases in the window. Snap Specs lands Sep 16 at $2,195 (2.7× over threshold); Meta Connect Sep 23–24 is the next real test.
  - **Recommended action:** **WAIT (unchanged).**

- **Idea:** MedCapture hand-kinematics for robotics licensing / MedCapture humanoid-robot extension
  - **Files:** `_ops/idea-vault/medcapture-hand-kinematics-robotics.md`, `_ops/idea-vault/medcapture-humanoid-robot-extension.md`
  - **Blocker was:** "MedCapture v1 has first paying pilot AND at least one humanoid/medical robotics company signals concrete procurement intent for clinical hand-motion datasets at meaningful price points"
  - **What changed:** Nothing procurement-shaped. WorldSculpt's scene-scale output is a *substitute* input for some embodied-AI training needs, which if anything argues mildly against the "our captures are scarce" thesis. XPeng IRON is unchanged from Sep 9.
  - **Recommended action:** **WAIT.** First clause (paying pilot) gates independently regardless.

- **Idea:** EMS / event robot fleet
  - **File:** `_ops/idea-vault/ems-event-robot-fleet.md`
  - **Blocker was:** "(1) Unitree Go2 to ~$1K and G1 to ~$10K … (2) MedCapture 2+ signed sites + first paper … (3) EMS vendor licensure + event-medical insurance researched"
  - **What changed:** Nothing in-window. **Unitree G1 unchanged at $17,990.** Note a mild counter-signal: Cambricon and Huawei both announced AI-accelerator **price increases**, which is the wrong direction for robot BOM costs.
  - **Recommended action:** **WAIT.**

- **Idea:** Explore Runway dev portal
  - **File:** `_ops/idea-vault/runway-dev-portal-exploration.md`
  - **Blocker was:** "Time + worthiness of paid API credits — nothing technical"
  - **What changed:** No Runway news. The case for spending paid credits weakens further — between free WorldGen and self-hosted WorldSculpt, the generative-3D exploration budget has two cheaper destinations.
  - **Recommended action:** **WAIT**, and deprioritize relative to the WorldSculpt spike.

- **Idea:** MedSim school / employer custom content
  - **File:** `_ops/idea-vault/medsim-school-employer-custom-content.md`
  - **Blocker was:** "Core single-tenant product not yet validated; multi-tenant adds substantial complexity before MVP demand exists"
  - **What changed:** Nothing in-window.
  - **Recommended action:** **WAIT.**

**No other parked ideas were unblocked.**
