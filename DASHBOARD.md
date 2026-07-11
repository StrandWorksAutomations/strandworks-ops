# STRANDWORKS — OPERATIONS DASHBOARD

Generated 2026-07-11 by generate.py — edit registers/, never this file.

## Money

- Known recurring spend: **$431.88/mo** — **INCOMPLETE: 1 subscriptions have no cost on record**

### Subscriptions

| service | plan | cost_monthly_usd | renewal_date | status | notes |
|---|---|---|---|---|---|
| RunPod | prepaid credit | 18.90 | — | paused-but-billing | CONFIRMED 2026-07-11: 0 pods running; balance $56.43 prepaid. Storage volumes still bill: medsim-blender 120GB $8.40/mo + command-station 150GB $10.50/mo = $18.90/mo. At this burn balance ≈ empty in ~3 months. Billing-history page white-screened — cadence unverified. FLAG: keep or dump volumes |
| Supabase | Pro | 67.18 | 2026-08-11 | active | SOLVED 2026-07-11: $67.18 = $25 Pro + ~3605 Micro Compute hrs (5 always-on projects × ~720h) − $10 credit. NOT Edge Fn/AI (35.5k invocations; 2M free). Projected next cycle $68.68. Spend cap ON. FLAG: pausing unused projects cuts ~$10/mo each |
| Vercel | Pro (team strandworks) | 20.00 | 2026-07-28 | active | Visa debit ****8774; usage $0.41 of $20 included credit (near zero); + prepaid $5 AI Gateway credit (auto-reload off). FLAG: Pro at $20/mo w/ hobby-scale usage — Hobby tier is free unless team features/domains needed |
| Namecheap | 34 domains | — | staggered — 10 renew 2026-08-29/30 | active | ENUMERATED 2026-07-11 (see services.csv); per-domain renewal prices not shown on list page — est $400-500/yr if all auto-renew. Auto-renew ON on all visible rows; account badge says 1 expiring/expired. FLAG: 9 peptide + 5 nano-banana + several brand-variant domains look speculative — owner review before the Aug 29-30 renewal cluster hits |
| DigitalOcean | pay-as-you-go | 22 | 2026-08-01 | active | MTD Jul 1-11 = $7.87 (≈$22/mo): droplet claude-ops $4.29 + App Platform strand-automation-works $1.79 + Reserved IP $1.79. PayPal backup method (peptiq@proton.me). FLAG: Reserved IP bills only while UNATTACHED — likely orphaned ~$5/mo; FLAG: DO app strand-automation-works may duplicate the Vercel site on www.strandautomationworks.com |
| ShadowVM | Shadow PC (1 VM) | 39.41 | 2026-08-04 | active | 1 Shadow PC (VM created ~2026-07-04, status Ready to Launch = not running); single invoice Jul 4 2026 $39.41 paid — subscription is NEW this month. FLAG: role unclear + RunPod/DO overlap — worker-VM consolidation candidate |
| Cascadeur | Yearly Pro | 26.20 | 2027-07-08 | refund-requested | CONFIRMED 2026-07-11: charged $314.40 on 2026-07-08 (accidental annual = $26.20/mo equiv); sub STILL ACTIVE, renews 2027-07-08 at $419.76 w/ taxes. Refund email sent 2026-07-11 — not yet refunded; escalate via customer portal if no reply by 2026-07-18. Payment method not shown on Cascadeur page (Paddle-style portal) — cross-check bank |
| Character Creator 5 | — | — | — | owned | license type + machine it lives on |
| Claude | Max 20x | 212.00 | 2026-08-07 | active | Max 20x $212/mo w/ tax (was $106 Max 5x Jan-May, upgraded Jun). PLUS usage-credit top-ups $47.70 each (2x in Jul, 1x Apr) — Jul total $307.40. Credit balance -$0.01, auto-reload OFF. Primary LLM/orchestrator |
| Google One / Gemini | Google AI Plus (400GB) | 4.99 | 2026-08-08 | active | CORRECTED 2026-07-11: register said Ultra but account shows Google AI Plus $4.99/mo (billed via Google Play, next 2026-08-08). No Ultra sub active on jonathanbouren@gmail.com — either downgraded or memory was stale. Only sub on Google Play |
| ChatGPT (Codex) | Plus | 21.20 | 2026-08-04 | active | ChatGPT Plus $21.20/mo w/ tax (Jun + Jul paid), auto-renews 2026-08-04, billing email jonathanbouren@gmail.com. Owner already called it cheap/unremarkable — CANCEL-CANDIDATE (flag only) |

## Flags (owner attention)

- ⚠ cost unknown: Namecheap
- ⚠ owner decision pending: Cascadeur (refund-requested)
- ⚠ SINGLE-COPY ASSET RISK: Lens-scenes project at old Mac PROJECTS folder

## Calendar — action needed

| date | item | type | action_needed |
|---|---|---|---|
| 2026-07-11 | Cascadeur refund email sent | deadline-watch | confirm refund lands; escalate if no reply in 7 days |
| 2026-07-12 | Supabase $67 bill review | billing | DONE 2026-07-11 — driver is 5 always-on Micro Compute projects; owner to decide which projects to pause |
| — | Strandworks LLC filings/renewal dates | business | owner to supply — currently untracked |
| 2026-07-18 | Cascadeur refund escalation deadline | deadline-watch | if no refund/reply by this date escalate via cascadeur.com customer portal (sub renews 2027-07-08 at $419.76) |
| 2026-08-04 | ChatGPT Plus renews $21.20 | billing | owner decision: cancel-candidate per own assessment |
| 2026-08-04 | ShadowVM renews $39.41 | billing | owner decision: consolidation candidate — VM idle since creation |
| 2026-08-29 | Namecheap renewal cluster (10 domains Aug 29-30) | billing | owner review speculative domains before auto-renew fires |

## Services → projects

| service | what_it_runs | project | environment | notes |
|---|---|---|---|---|
| Vercel | 12+ projects incl project-manager (manager.strandautomationworks.com) / the-kinetic-medic / medsim-viz / medsim-asset-bench / strand-automation-works-new (www.strandautomationworks.com) / tenetrix-modules / .deploy-tenetrix-web / dermatome-deploy / heart3d / pocus-ultrasound / saw-website / strand-automation-works + known haptic-mirror-sim & lifepak15-replica & liaison-dashboard | portfolio-wide | production | dashboard pagination blocked full enumeration; custom domains point at strandautomationworks.com (Namecheap) |
| Supabase | org Strand Automation Works: 5 projects (haptic-mirror-mmo / liaison-dashboard / MedCapture Production / medsim-game / Pre-production Testing DB) + sim-llm-npc Edge Function | haptic-mirror + liaison-dashboard + MedCapture + MedSim-Game | production | $67 driver = 5 always-on Micro Compute projects (NOT the Edge Fn); all disks 8GB except MedCapture 2GB; spend cap on |
| RunPod | 3 stopped pods (command-station CPU / medsim-blender-migration 4090 x2) + 2 network volumes (medsim-blender 120GB / command-station 150GB) | MedSim-Game + command-station | episodic | pods stopped; volumes bill $18.90/mo against prepaid balance; also candidate for SnapML detector training + big-LLM batch |
| GitHub | StrandWorksAutomations org repos | all | infrastructure | 3rdrider/haptic-mirror/liaison-dashboard/MedSim-Game/ai-governance-kit/strandworks-portfolio/strandworks-ops |
| unknown-host | MedSim waitlist-landing app | MedSim-Game | unknown | found .env.example in repo — where is it deployed? |
| Namecheap | 34 domains: strandautomationworks .com/.me/.net/.org | strandworks .me/.net/.org/.to | strandworksai .com/.us | strandworksglobal .com/.me/.net/.org | peptiq .me/.net/.org | whatarepeptides .me/.net/.org | peptide-planet .com/.net | peptidelean.net | nano-banana .fit/.it.com/.to | banananano .it.com/.org | emberandvellum.com | thekineticmedic.com | tenetrix.org | trendmechanic.com | orientation-tracker.com | simcenter-development.com | mixed (brand + Ember&Vellum + kinetic-medic + tenetrix + speculative) | registrar | all ACTIVE w/ privacy ON (except strandworksai.us no privacy); expirations staggered Aug 2026 – Jan 2028 |
| DigitalOcean | droplet claude-ops (2GB/50GB NYC3, 165.227.115.42, scouts 24/7 + Drive→R2 mirror) + App Platform app strand-automation-works (project Carousel, NYC1, healthy) + 1 reserved IP | ops + company site | production | app deployed 4 months ago — check if superseded by Vercel www.strandautomationworks.com |

## Governance scouts (per repo)

| repo | latest_audit | latest_drift |
|---|---|---|
| strandworks-ops | never | never |

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
