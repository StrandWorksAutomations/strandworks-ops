# Tech Scout Report — 2026-07-29

**Window:** 2026-07-28 (run 2) → now. Prior reports: `scout-2026-07-28-run2.md` (same-day thin run)
and `scout-2026-07-28.md` (the substantive one, covering the 07-20 → 07-28 gap).

## Verdict

**Nothing new shipped in the focus areas in the last 24 hours.** Per the daily cadence rule that is
the expected result, and this report does not pad it.

**However, this run caught a real miss in the previous report's own window.** NVIDIA open-sourced a
**medical physics simulation framework and a clinical soft-tissue generative world model** on
**July 22** — inside the 07-20 → 07-28 gap that `scout-2026-07-28.md` was written to cover. That
report logged NVIDIA Cosmos 3 Edge and explicitly concluded it was *"still a physical-AI world model
rather than a clinical one, so no direct MedSim use."* The clinical one existed at that moment and
was not found. It is the most flagship-relevant drop in several weeks, so it is written up here as a
**backfill**, not as new-in-window news.

---

## Backfill — missed in the 07-20 → 07-28 window

### NVIDIA Isaac for Healthcare — medical physics simulation, open-sourced July 22

- **Announcement** — [NVIDIA blog](https://blogs.nvidia.com/blog/medical-physics-simulation-open-source/) · [NVIDIA technical blog](https://developer.nvidia.com/blog/developing-healthcare-robotics-with-gpu-native-medical-physics-simulation) · [HIT Consultant](https://hitconsultant.net/2026/07/22/nvidia-launches-isaac-open-source-medical-physics-simulation-framework/) · [AIwire](https://www.hpcwire.com/aiwire/2026/07/22/nvidia-open-sources-1st-gpu-accelerated-medical-physics-simulation-framework/)
- **Verified against the actual repos, not the press release** (`gh api`, checked today):

| Repo | License | Last push | What it is |
|---|---|---|---|
| [`isaac-for-healthcare/i4h-sensor-simulation`](https://github.com/isaac-for-healthcare/i4h-sensor-simulation) | Apache-2.0 | 2026-07-20 | **Ultrasound raytracing simulator** (CUDA + OptiX, Python bindings, real-time) **and fluoroscopy simulator** (X-ray from CT volumes, differentiable ray marching, ~5 ms/frame at 512×512) |
| [`isaac-for-healthcare/Cosmos-H-Dreams`](https://github.com/isaac-for-healthcare/Cosmos-H-Dreams) | Apache-2.0 (code) | 2026-07-27 | Generative clinical world model — **soft-tissue deformation + visual scene dynamics learned from procedural clinical data**; created 2026-07-17 |
| [`isaac-for-healthcare/i4h-workflows`](https://github.com/isaac-for-healthcare/i4h-workflows) | Apache-2.0 | 2026-07-28 | Reference workflows (cholecystectomy, prostatectomy, hernia, hysterectomy, kidney stone, endovascular) |
| [`isaac-for-healthcare/i4h-asset-catalog`](https://github.com/isaac-for-healthcare/i4h-asset-catalog) | Apache-2.0 | 2026-07-21 | Anatomy/device asset catalog |

- **Why it matters to us — this is the first genuinely *clinical* open world model, not a robotics
  one wearing a lab coat.** Every prior Cosmos entry in this log was physical-AI/robotics and was
  correctly filed as "no direct MedSim use." Cosmos-H Dreams is trained on procedural clinical data
  and models soft-tissue deformation. Code is Apache-2.0 and downloadable today.
- **Caveats, stated plainly:**
  - Code license is confirmed Apache-2.0 by reading `LICENSE` in-repo. **The pretrained model
    checkpoint license on Hugging Face is NOT verified** and is typically a separate NVIDIA Open
    Model License with its own terms. Verify before any use beyond local experimentation.
  - This is **CUDA/OptiX desktop tooling**, not something that runs in MedSim's browser client. Its
    realistic use is **offline frame generation**, not runtime.
  - The framing throughout NVIDIA's material is **surgical robot policy training**, not human
    learner education. The overlap with MedSim is the physics and the imaging, not the product.

---

## Breakthroughs & Releases Since Last Report

### AR / Smart Glasses
- Nothing new. No SDK, hardware, dev-program, or pricing announcement in the last 24 hours. Snap
  Specs unchanged at $2,195 / "fall 2026" with no sharper date ([Road to VR](https://roadtovr.com/snap-specs-2026-ar-glasses-release-date-price/)). Samsung Intelligent Eyewear still has no disclosed price, ship date, or developer track.

### Spatial Computing / 3D
- Nothing new in the window. Re-checked Gaussian-splatting tooling: **Gaussian Point Splatting**
  (SIGGRAPH '26, [code on GitHub](https://github.com/JorisAR/gaussian-point-splatting)) and
  [FastGS](https://github.com/fastgs/FastGS) are both already-known config targets, not new drops.

### AI / ML
- Nothing new. **Gemini 3.5 Pro is still not GA** — sixth consecutive miss. No `gemini-3.5-pro`
  entry exists in the public API model list in either Stable or Preview; Flash remains the only 3.5
  family member with GA ([Gemini API models](https://ai.google.dev/gemini-api/docs/models) · [eesel status tracker](https://www.eesel.ai/blog/gemini-3-5-pro)).
- **Correction to a candidate item:** LongCat-2.0 (Meituan, 1.6T MoE, MIT) surfaced in searching but
  is **out of window** — released June 30, weights to Hugging Face July 4 ([MarkTechPost, 2026-07-05](https://www.marktechpost.com/2026/07/05/meituan-releases-longcat-2-0-a-1-6t-parameter-open-moe-model-with-native-1m-context-and-longcat-sparse-attention/)). Not new; logged so it is not mistaken for new next run.

### Hardware
- Nothing new.

### Medical / Clinical AI
- Nothing new **in window**. See the July 22 backfill above.

---

## Nothing New (Watchlist)

Rolled forward:

- **Khronos `KHR_gaussian_splatting` glTF extension** — still a release candidate, not ratified. RC Feb 3, 2026; Q2 2026 ratification target missed. [Khronos](https://www.khronos.org/news/press/gltf-gaussian-splatting-press-release) · [spec](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_gaussian_splatting). Check monthly.
- **DeepMind D4RT** — week 13, no code. OpenD4RT unchanged since June 4.
- **Genie 3 developer API** — still none. Access remains Project Genie via AI Ultra ($250/mo, above the $200/mo infra gate).
- **Gemini 3.5 Pro GA** — missed again.
- **Apple Foundation Models open-source** ("later this summer") — ~5 weeks of summer left. Check weekly through early September.
- **Snap Specs** — $2,195 preorder, "fall 2026," no sharper date.
- **Jetson T2000/T3000** — Q1 2027.
- **Samsung Intelligent Eyewear** — price, ship date, developer track all still undisclosed.
- **Android XR Developer Catalyst Program** (`g.co/dev/catalyst`) — intake status still **unverified**; carried from the 07-28 run-2 report as an open administrative action.

---

## Project Impact

**MedSim-Game (flagship) — POCUS ultrasound prop.** The memory-tracked next step for
`props/pocus-ultrasound` is *real-organ v2 via Z-Anatomy → voxelize organs → slice at probe plane* —
i.e. hand-building a geometric slicer and accepting whatever fidelity it yields. NVIDIA's
Apache-2.0 **ultrasound raytracing simulator** is a physically-based alternative to that hand-built
step: run it offline against anatomy meshes to bake ground-truth frames, then ship the frames to the
browser prop. This does not replace the Z-Anatomy plan (that supplies the anatomy; the raytracer
supplies the imaging physics) and it is **not free** — it needs a CUDA box, which the portfolio has
via the RunPod pods and the Shadow VM. Worth one bounded evaluation session before more slicer work
is written by hand.

**MedSim-Game — fluoroscopy.** The same repo ships a CT→X-ray simulator at ~5 ms/frame. There is no
fluoro prop in the portfolio today; this lowers the cost of one from "research project" to
"integration," if a fluoro/C-arm prop is ever wanted.

**Everything else** — no change from the 07-28 reports. The one purchasable action they named
(ST STEVAL-VL53L9 / X-NUCLEO-53L9A1 depth-sensing dev kits, inside the ≤$200/mo infra gate) is
unchanged, as is the administrative one (verify Catalyst intake).

---

## Parked Idea Unblocks

Re-ran the cross-reference against the `blocked_on:` field of every `_ops/idea-vault/*.md`.

**No parked ideas unblocked.**

The reasoning is worth stating, because the NVIDIA find looks like it should have moved something:

- **`sim-lab-rfid-ultrasound-trainer.md`** is the closest match by subject, but its blocker is
  *market*, not tech — *"MedCapture must land first sim-lab pilot AND ≥3 sim-center directors
  validate demand."* A better ultrasound simulator does not touch that. **WAIT.**
- **`haptic-mirror-d4rt.md`** is the only tech-blocked idea in the vault that borders this space, but
  its blocker is specifically *"D4RT code release, OR equivalent open-source 3D world reconstruction
  tooling that lets you generate training scenarios from short video captures."* Cosmos-H Dreams
  generates clinical scene dynamics; it does not reconstruct a scene from a phone video. Not an
  equivalent. **WAIT.**
- Every other vault entry is blocked on market, money, or time. Nothing in this report moves any of
  those.

The NVIDIA release is a **live-project** impact (MedSim POCUS prop), not a **parked-idea** unblock.
Filing it correctly matters more than claiming a win.

---

## Notes on scope

- Next major calendar event in scope: **Meta Connect, Sep 23–24**.
- **Process note:** the 07-28 report ran a full 8-day gap sweep and still missed a July 22 NVIDIA
  healthcare release that is directly on the flagship's subject. The gap-sweep queries evidently
  covered "NVIDIA + world model" but not "NVIDIA + healthcare/medical." Worth adding a standing
  medical-simulation-vendor query (NVIDIA Isaac for Healthcare, MONAI, Siemens, GE) to
  `TECH_SCOUT_CONFIG.md` §2 rather than relying on the generic medical-AI sweep.
