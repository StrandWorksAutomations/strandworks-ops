# GLM-5.2 as a standing coder on a Shadow VM — research findings

**Filed:** 2026-07-12 · **Author:** research-spike agent · **Status:** research
findings, NON-DIRECTIVE. Owner / Intake decides. Nothing here confers authority
or obligates any spend. This is a SPEC v2.0.0 WS-D spike answering named
unknowns; it is not a plan.

All figures are sourced from public web material as of July 2026 and may drift.
Where the web was ambiguous or unverifiable, it says so plainly. Third-party
pricing/spec pages disagree with each other; treat any single number as ±20%.

---

## 0. Bottom line first

**Recommendation: API-coordinator, not self-host.** "GLM on Shadow" cannot mean
local inference. GLM-5.2 is a ~744-billion-parameter Mixture-of-Experts model
whose weights need roughly **372 GB VRAM at INT4** and **~1 TB at FP8** — a
Shadow PC has **16–20 GB VRAM**. That is a 20–50× shortfall; it is not a
quantization-tuning problem, it is a category error. The realistic shape is:
the Shadow VM is a **thin, always-on coordinator** (runs the coding harness,
holds the repo, brokers tool calls) that calls **GLM-5.2 over the hosted z.ai
API** for the actual model inference.

The model itself is a genuinely strong, tool-native agentic coder that plugs
into Claude Code / Cline / Cursor and speaks the shape a review-gated sub-agent
needs. The cost question is the one that matters: a "constant" coder on
**per-token API** can blow past the fabric's **$200/mo autonomous ceiling**
easily, whereas the **GLM Coding Plan flat subscription ($18–$160/mo)** fits
under it comfortably — but the Plan has a rate-limit shape (prompts per 5h) that
constrains what "always-on" can mean.

---

## 1. What is GLM-5.2 (and is that the real name?)

**Yes, "GLM-5.2" is a real released model** — the owner's naming is accurate,
not approximate. It is from **Zhipu AI**, operating globally as **Z.ai**.

- **Lineage** (per Presenc AI lineage tracker and Z.ai release notes):
  GLM-4 (Jun 2024) → GLM-4.5 (Jul 2025) → GLM-4.6 (Sep 30 2025) →
  GLM-4.7 (Dec 2025) → GLM-5 (Feb 2026) → **GLM-5.2** (coding-plan preview
  Jun 13 2026; open weights + standalone API generally available ~Jun 16 2026).
- **Architecture:** sparse **Mixture-of-Experts**, **~744B total parameters**
  (some pages round to ~750–753B), **~40B active parameters per token**. A new
  "IndexShare" sparse-attention technique is cited as how they keep 1M-context
  inference affordable.
- **Context window:** **1,048,576 tokens (1M)** input; max output reported as
  **131,072 tokens** on several trackers (Z.ai's own page lists max output as
  "not published," so treat 131K as third-party-reported).
- **Coding capability:** coding-first, tuned for software engineering,
  multi-step reasoning and tool-augmented agent work. Third-party benchmark
  writeups place it at frontier-adjacent level for agentic coding — e.g.
  MCP-Atlas 77.0, reported ahead of GPT-5.5 (75.3) and roughly tied with
  Claude Opus 4.8 (77.8). VentureBeat headlined it beating "GPT-5.5 on multiple
  long-horizon coding benchmarks for ~1/6 the cost." **Caveat:** these are
  vendor-adjacent / third-party benchmarks, not independent replications — read
  them as "strong contender," not "verified best."

**Open weights vs hosted API — the important distinction:**
- **Open weights:** the full 744B model is published on **Hugging Face under a
  permissive MIT license** — downloadable, fine-tunable, self-hostable *in
  principle* (see §2 for why "in principle" is load-bearing).
- **Hosted API:** Z.ai serves the same model via a first-party API, plus it is
  available through OpenRouter, Together AI, and other routers. The **GLM Coding
  Plan** is a separate flat-rate subscription that fronts GLM-5.2 (+ GLM-5-Turbo,
  GLM-4.7, GLM-4.5-Air) specifically for coding tools.

---

## 2. Can it run on a Shadow VM's VRAM? (the load-bearing finding)

**No — not for local inference. Not close.**

**Shadow hardware (2026 tiers, per Shadow support + reviews):**
- Neo (base): ~RTX 4060-class / RTX 2000 Ada, **16 GB VRAM**
- Power: RTX 3070 Ti-class, **20 GB VRAM**
- Shadow PC Pro (Advanced): RTX A4500, **20 GB VRAM**

So a Shadow VM is one consumer/prosumer GPU with **16–20 GB VRAM** — exactly the
owner's "roughly one consumer GPU, modest VRAM" estimate.

**GLM-5.2 self-host VRAM math (all expert weights must be resident in VRAM even
though only ~40B compute per token):**
- **BF16 (full):** ~1,488 GB weights → ~16 GPUs
- **FP8:** ~744 GB weights; with KV cache/activations true serving wants **~1 TB
  VRAM → ~8× H200 (141 GB each) or an MI300X-class node**
- **INT4/AWQ (aggressive quant):** ~372 GB → **~4× H100/H200 minimum**

**The gap:** even the most aggressive INT4 footprint (~372 GB) is **~20× larger**
than a Power/Pro Shadow VM's 20 GB, and **~23×** the Neo's 16 GB. FP8 is ~50×.
No quantization trick closes a 20–50× VRAM gap; a distilled tiny variant would be
a different model, not GLM-5.2.

**Therefore "GLM on Shadow" realistically = coordinator pattern.** The Shadow VM
runs the *harness* (Claude Code / Cline, the git checkout, the tool executor,
scheduler) — cheap, always-on, fits in 16–20 GB with room to spare — and every
model turn is an **API call to hosted GLM-5.2**. Heavy local inference on Shadow
is infeasible and should be treated as off the table.

---

## 3. Operational unknowns (owner's verbatim questions)

**"Does it need compaction?"** — Yes, in the same sense any long-running agentic
coder does, but the 1M window makes it *far less frequent*. Compaction is a
harness behavior (Claude Code / Cline summarize-and-truncate when the context
fills), not a GLM-specific requirement. With 200K windows you must chunk a repo
and lose cross-file context; at 1M you can hold a substantial repo + relevant
history in one pass, so you hit the compaction threshold much later. Practically:
keep the harness's auto-compaction on; it will rarely fire, and when it does
it's the standard summarize-old-turns mechanism.

**"Does its context window need clearing between tasks?"** — Yes — as a
discipline, not a hard requirement. The API itself is **stateless** (you resend
context each call; there's no server-side session that leaks across tasks).
Within a single long harness session, though, prior-task context accumulates and
can cause the model to "go off-script on longer sessions" (a specific failure
mode noted in the field guides). Recommended shape: **one fresh context per
task/ticket** (new session or explicit `/clear`), rather than one immortal
session that runs for days. This also protects the adversarial-review gate — each
task starts from a clean, auditable context.

**Practical session/workflow shape for a long-running coder:**
- **Statelessness:** hosted API is stateless; state lives in the harness + repo
  on the Shadow VM. Good — it means restarts are cheap and context is explicit.
- **Context management:** prefer **task-scoped sessions**. Lean on the 1M window
  to avoid mid-task compaction; clear between tasks.
- **Tool / function-calling:** **native.** GLM-5.2 exposes an
  **Anthropic-compatible API** and natively parses standard Anthropic `tools` /
  `tool_choice` schemas — filesystem ops, shell execution, custom tools work
  without a translation layer. It also has OpenAI-compatible endpoints for
  Cline/Cursor.
- **Harness compatibility:** works in **Claude Code** (Anthropic format),
  **Cline / Cursor** (OpenAI-compatible), OpenCode, and 20+ clients. For Claude
  Code you point the Anthropic base URL at Z.ai; for others use the
  OpenAI-compatible endpoint or a router (OpenRouter/Together).
- **"Always-on":** the coordinator (harness + scheduler) is always-on cheaply on
  Shadow; the model is only "on" per request. There is no persistent model
  process to babysit — which is the *right* shape for a standing agent.

---

## 4. Cost — and the $200/mo ceiling check

**Two distinct pricing paths. This distinction is decisive for the ceiling.**

**(a) Per-token hosted API (metered):**
- Official **Z.ai first-party:** **$1.40 / 1M input**, **$4.40 / 1M output**,
  **$0.26 / 1M cached input** (~81% caching discount).
- **OpenRouter** reported cheaper (~$0.42 in / $1.32 out) — routing-dependent,
  don't rely on it as a floor.
- **What "constant coder" costs metered:** an agentic coder is output-heavy and
  re-sends large context each turn. Even at official rates, a genuinely
  *continuous* coder doing repo-scale turns can consume millions of tokens/day.
  Illustratively, ~1M input + ~0.3M output per hour, 8h/day, 22 days ≈
  ~176M in + ~53M out/mo → **≈ $246 + $233 ≈ ~$480/mo** at first-party rates,
  before caching. **This blows past the $200/mo ceiling.** Caching and OpenRouter
  routing can cut it substantially, but metered "always-on" is inherently
  ceiling-risky and hard to bound. *(These are order-of-magnitude estimates from
  assumed usage, not measured — treat as a caution, not a quote.)*

**(b) GLM Coding Plan flat subscription (recommended for a standing coder):**
- **Lite $18/mo · Pro $72/mo · Max $160/mo** (intro 30% promo seen at
  $12.60 / $50.40 / $112; yearly billing also offered).
- Covers GLM-5.2, GLM-5-Turbo, GLM-4.7, GLM-4.5-Air inside coding tools.
- **Rate-limit shape (this is the catch for "always-on"):** limits are
  **prompts per 5 hours**, where a "prompt" = one user turn (each prompt fans out
  to ~15–20 model calls). Reported: **Lite ~80 / Pro ~400 / Max ~1,600 prompts
  per 5h** (weekly caps ~400 / 2,000 / 8,000). Quota burns **3× at peak / 2×
  off-peak** on GLM-5.2 (a promo through Sep 2026 drops off-peak to 1×).
- **Ceiling fit:** **Max at $160/mo sits under the $200/mo autonomous ceiling**
  with ~$40/mo headroom, and its cost is *fixed* regardless of throughput — which
  is exactly what a spend-ceiling wants. Pro ($72) leaves more headroom if
  ~400 prompts/5h is enough. The tradeoff vs metered: predictable cost, but a
  hard throughput ceiling — a truly saturating 24/7 coder may hit prompt limits.

**Verdict on cost:** for a *standing* coder under a hard $200 ceiling, the
**flat Coding Plan (Pro or Max)** is the fit; **per-token metered is the wrong
tool** for "constant" because it's unbounded and estimates already exceed the
ceiling.

---

## 5. Fit as a sub-agent coder under an adversarial-review gate

**Good fit on capability shape; the constraints are operational, not model.**

- **Tool use:** native Anthropic-compatible tool/function-calling — a sub-agent
  can drive filesystem/shell/custom tools without a shim. ✔
- **Structured output:** supports the standard tool_call / structured-output
  shape harnesses depend on; strong on "reading and modifying existing files
  without hallucinating structure" per field reports. ✔
- **Patch generation:** targets exactly the review-gate workflow — follow
  detailed instructions, maintain multi-step context, produce syntactically
  correct diffs in common languages. Pairs naturally with a **diff/patch →
  adversarial reviewer → gate** pipeline: GLM proposes the patch, a separate
  reviewer (could be a different model, e.g. Claude) adjudicates before merge.
  Stateless API + task-scoped context means each proposed patch is reproducible
  and auditable. ✔
- **Where to be careful:**
  - Function-calling "behavior can differ slightly from Claude's native
    implementation" — expect minor harness-specific quirks; validate the exact
    Claude Code / Cline wiring before trusting it unattended.
  - Benchmarks are vendor-adjacent; don't assume Opus-4.8-parity in *your* repo
    without a bake-off on real tickets.
  - Data governance: hosted API means code/context leaves the machine to Z.ai
    (a China-based vendor). For strandworks repos this needs an explicit
    owner ruling — some repos may be fine, others not. Flagged, not decided.

---

## Open risks / caveats

1. **Self-host is off the table on Shadow** — do not let "open weights" imply
   local feasibility. It would take a multi-GPU datacenter node (4× H100 min,
   ~8× H200 for FP8), nowhere near Shadow's 16–20 GB.
2. **Metered API can breach the $200 ceiling** for a truly constant coder;
   only the flat Coding Plan bounds spend predictably.
3. **Coding Plan throughput cap** (prompts/5h, 2–3× peak multiplier) may
   throttle a saturating always-on agent — "always-on" and "unlimited" are not
   the same.
4. **Vendor / data-residency** — code and context go to Z.ai's hosted service;
   needs an owner data-governance ruling per repo.
5. **Benchmark trust** — strong but vendor-adjacent numbers; requires an
   in-repo bake-off before relying on it as the primary coder.
6. **Numbers drift** — model specs, prices, and Shadow tiers all change; every
   figure here is July 2026 and should be re-checked at intake time.

---

## Sources

Model / lineage / open weights:
- Presenc AI — Zhipu/Z.ai GLM lineage 2026: https://presenc.ai/research/zhipu-glm-model-lineage-2026
- Z.ai developer release notes: https://docs.z.ai/release-notes/new-released
- Eigent — GLM-5.2 1M-token open-weight: https://www.eigent.ai/blog/glm-5-2
- MindStudio — What is GLM-5.2: https://www.mindstudio.ai/blog/what-is-glm-5-2-open-weight-model-1m-context
- Verdent — Developer's guide to GLM-5.2: https://www.verdent.ai/guides/what-is-glm-5-2
- VentureBeat — GLM-5.2 beats GPT-5.5 on long-horizon coding: https://venturebeat.com/technology/z-ais-open-weights-glm-5-2-beats-gpt-5-5-on-multiple-long-horizon-coding-benchmarks-for-1-6th-the-cost

Hardware / VRAM math:
- Spheron — Deploy GLM-5.2 744B on GPU cloud: https://www.spheron.network/blog/deploy-glm-5-2-gpu-cloud/
- ofox.ai — Self-host GLM-5.2 8×H200 vLLM: https://ofox.ai/blog/glm-5-2-self-host-vllm-hardware-cost-2026/
- apxml — GLM-5.2 specs and VRAM: https://apxml.com/models/glm-52
- InsiderLLM — Run GLM-5.2 locally, GPU/VRAM/quant: https://insiderllm.com/guides/run-glm-5-2-locally/
- Shadow support — PC gaming hardware specs: https://support.shadow.tech/hc/en-us/articles/31001157820049-Shadow-PC-Gaming-Offers-Hardware-Specifications
- TechPowerUp — Shadow Neo launch: https://www.techpowerup.com/338065/shadow-launches-neo-the-next-generation-cloud-gaming-pc

Operational / harness / tool-use:
- apidog — GLM-5.2 with Claude Code, Cline, Cursor: https://apidog.com/blog/glm-5-2-claude-code-cline-cursor/
- MindStudio — GLM-5.2 in Claude Code: https://www.mindstudio.ai/blog/how-to-use-glm-5-2-in-claude-code
- MindStudio — GLM-5.2 in agent harnesses: https://www.mindstudio.ai/blog/how-to-use-glm-5-2-agent-harnesses-cursor-opencode
- DataCamp — GLM-5.2 features/setup: https://www.datacamp.com/blog/glm-5-2

Pricing:
- AI Pricing Guru — GLM-5.2 token cost: https://www.aipricing.guru/models/z-ai-glm-5-2/
- OpenRouter — GLM-5.2: https://openrouter.ai/z-ai/glm-5.2
- Z.ai pricing overview: https://docs.z.ai/guides/overview/pricing
- AI Pricing Guru — Coding Plan limits: https://www.aipricing.guru/z-ai-subscription-pricing/
- Z.ai subscribe: https://z.ai/subscribe
- Lushbinary — GLM-5.2 API & Coding Plan: https://lushbinary.com/blog/glm-5-2-api-pricing-glm-coding-plan-guide/
