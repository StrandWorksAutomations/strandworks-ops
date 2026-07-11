# STRANDWORKS — OPERATIONS DASHBOARD

Generated 2026-07-11 by generate.py — edit registers/, never this file.

## Money

- Known recurring spend: **$0.00/mo** — **INCOMPLETE: 10 subscriptions have no cost on record**

### Subscriptions

| service | plan | cost_monthly_usd | renewal_date | status | notes |
|---|---|---|---|---|---|
| RunPod | RTX 4090 pod | — | — | paused | confirm storage charges while paused |
| Supabase | — | — | — | active | UNEXAMINED $67 bill — get line items; hypothesis: haptic-mirror sim Edge Function + AI usage since May |
| Vercel | — | — | — | active | hosts haptic-mirror-sim.vercel.app |
| Namecheap | — | — | — | active | domains — enumerate which |
| DigitalOcean | — | — | — | active | what droplets exist? |
| ShadowVM | — | — | — | active | role unclear — candidate for worker-VM consolidation |
| Cascadeur | annual | — | — | refund-requested | accidental 1-yr sub; refund email sent 2026-07-11 |
| Character Creator 5 | — | — | — | owned | license type + machine it lives on |
| Claude | Max | — | — | active | primary LLM |
| Gemini | Ultra | — | — | active | speed/media-gen/large context |
| Codex | — | — | — | active | owner: cheap unremarkable — cancel-candidate? |

## Flags (owner attention)

- ⚠ cost unknown: RunPod
- ⚠ cost unknown: Supabase
- ⚠ unexamined bill: Supabase
- ⚠ cost unknown: Vercel
- ⚠ cost unknown: Namecheap
- ⚠ cost unknown: DigitalOcean
- ⚠ cost unknown: ShadowVM
- ⚠ cost unknown: Cascadeur
- ⚠ owner decision pending: Cascadeur (refund-requested)
- ⚠ cost unknown: Claude
- ⚠ cost unknown: Gemini
- ⚠ cost unknown: Codex
- ⚠ owner decision pending: Codex (active)
- ⚠ SINGLE-COPY ASSET RISK: Lens-scenes project at old Mac PROJECTS folder

## Calendar — action needed

| date | item | type | action_needed |
|---|---|---|---|
| 2026-07-11 | Cascadeur refund email sent | deadline-watch | confirm refund lands; escalate if no reply in 7 days |
| 2026-07-12 | Supabase $67 bill review | billing | line-item breakdown via Mac sweep |
| — | Strandworks LLC filings/renewal dates | business | owner to supply — currently untracked |

## Services → projects

| service | what_it_runs | project | environment | notes |
|---|---|---|---|---|
| Vercel | haptic-mirror-sim.vercel.app (clinical sim v1) | haptic-mirror | production | live since 2026-05-07 |
| Supabase | sim-llm-npc Edge Function (Haiku patient dialogue) | haptic-mirror | production | likely the $67 driver |
| RunPod | RTX 4090 pod | MedSim-Game | episodic | paused; also candidate for SnapML detector training + big-LLM batch |
| GitHub | StrandWorksAutomations org repos | all | infrastructure | 3rdrider/haptic-mirror/liaison-dashboard/MedSim-Game/ai-governance-kit/strandworks-portfolio/strandworks-ops |
| unknown-host | MedSim waitlist-landing app | MedSim-Game | unknown | found .env.example in repo — where is it deployed? |

## Governance scouts (per repo)

| repo | latest_audit | latest_drift |
|---|---|---|
| 3rdrider | audit-2026-07-10.md | drift-2026-07-11.md |
| haptic-mirror | audit-2026-07-11.md | never |
| liaison-dashboard | audit-2026-07-11.md | never |

## Models & compute

| name | kind | where | cost_model | notes |
|---|---|---|---|---|
| Claude (Max) | frontier LLM | cloud | subscription | orchestrator + dev sessions; primary |
| Gemini (Ultra) | frontier LLM | cloud | subscription | media-gen / large-context lane |
| Codex | frontier LLM | cloud | subscription | cancel-candidate per owner assessment |
| Haiku 4.5 | frontier LLM (API) | via Supabase Edge Function | usage | powers sim patient dialogue — the quiet biller |
| RunPod 4090 | GPU host | cloud (paused) | usage | can run 30-70B local models episodically |
| worker VM (~$37/mo) | proposed | not yet purchased | subscription | pending infrastructure charter — 7-14B local model + CI/grind |

## Assets

| asset | type | location | size | project | canonical | notes |
|---|---|---|---|---|---|---|
| ml-models collection | model checkpoints | SSD | ~794MB per old notes | 3rdrider/MedSim | no | partially in Google Drive — needs manifest sweep |
| datasets collection | training data | SSD | ~1GB per old notes | 3rdrider/MedSim | no | partially in Google Drive |
| Lens-scenes project | Lens Studio scenes | old Mac PROJECTS folder | ~156MB | 3rdrider | yes-only-copy | NOT in git (binaries); single copy risk |
| MedSim game assets | engine/art assets | MedSim-Game repo | ~700MB+ | MedSim-Game | yes | in git |

## Access map

| system | account | machines_with_access | key_location | notes |
|---|---|---|---|---|
| GitHub | StrandWorksAutomations | VAIO + Mac JB-1272 | ~/.ssh/github_ed25519 on each | VAIO key added 2026-05-12; Mac key added 2026-07-11 |
| Vercel | — | Mac browser | — | CLI not installed on VAIO |
| Supabase | — | Mac browser | — | same |
| DigitalOcean | — | Mac browser | — | same |
| RunPod | — | Mac browser | — | same |
| gh CLI | StrandWorksAutomations | VAIO (token DEAD since May) | ~/.config/gh | repo creation done via web instead |
