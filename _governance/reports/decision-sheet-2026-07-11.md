# Subscription Decision Sheet — 2026-07-11

Five-minute walk-through. Every line is a FLAG — nothing happens without your
word per repo rules. Reply in any format ("kill 1,2,5; keep 3; check 4 later").

## KILL — recommended, ~$120–180/mo recoverable

| # | Service | $/mo | Why |
|---|---|---|---|
| 1 | Rocket Money | 11.66 | Subscription tracker, forgotten — this repo now does its job for free |
| 2 | ChatGPT Plus | 21.20 | Your own verdict: "cheap, nothing standout." $254/yr for unremarkable |
| 3 | Supabase idle projects (3–4 of 5) | ~25–35 | Five always-on projects × 720h/mo is the $67 driver. Keep the sim's project + one active dev; pause the rest. Bill likely drops to ~$30 |
| 4 | ShadowVM **or** DigitalOcean overlap | 22–39 | You're paying for BOTH an idle Shadow PC ($39.41, "Ready to Launch" since Jul 4 = never launched) AND DO droplets (~$22). The worker-VM role needs ONE. My lean: keep Shadow (it IS the $37 worker VM you wanted, GPU-adjacent), kill/shrink DO — but first see INVESTIGATE #2 |
| 5 | Watchful (Apple) | 3.33 (39.99/yr) | Renewing soon; if you can't name what it does, that's the answer |

## KEEP — earning their cost

| Service | $/mo | Role |
|---|---|---|
| Claude Max 20x | 212 (+top-ups) | The engine of everything this week. Watch top-up rate — $47.70 in July |
| Vercel Pro | 20.00 | Live sim hosting; usage near zero, well inside plan |
| Supabase (trimmed) | ~30 after trim | Sim backend — keep, post-trim |
| RunPod | usage | Correctly paused; $56.43 credit waiting for detector training / MedSim |
| Namecheap | ~? | Domains = identity; enumerate at renewal |
| Google AI Plus | 4.99 | Cheap; media-gen lane. NOTE: you do NOT have Ultra — decide if you want it or if AI Plus suffices |
| iCloud+ | 9.99 | Mac/phone backbone |
| Corporate Filings LLC | ? | Business-critical — but VERIFY it's the real registered-agent service and what it costs annually |

## INVESTIGATE — before any decision

| # | Item | Question | How |
|---|---|---|---|
| 1 | Linear ($127.20 May 11) | Annual Basic or monthly team? Is ANYONE using it? (haptic residue says the workspace was never built — yet money moved) | Linear billing page, 1 min |
| 2 | DO droplet `claude-ops` + app `strand-automation-works` | What are these actually running? Something of yours is live there | DO dashboard → check each |
| 3 | PayPal autopay list | Extension couldn't read it | PayPal → Settings → Payments → Automatic payments |
| 4 | OpenAI API + Google Cloud (~$12) | Usage-based — what's calling them? Dead keys should be revoked | Billing dashboards |
| 5 | Meshy / KlingAI / Hyper3D / 3DAIStudio (~$50+/mo combined?) | All 3D/AI-gen tools — MedSim pipeline or experiments? Consolidate to the ones the pipeline actually uses | You know which you touch weekly |
| 6 | Cascadeur refund | Email sent — confirm it lands within 7 days | calendar.csv is tracking it |
| 7 | Substack + Dark Reader + "PERSONAL recurring" | Business or personal? Move personal off the business card ****8774 | Your call |

## The bottom line
Known spend: $760/mo (floor — 13 costs still blank). Realistic post-cleanup:
**~$550–600/mo**, mostly Claude + infrastructure that ships product. The
LLM line ($307 actual July) is 40% of known spend — worth a deliberate
"which model for which lane" decision at the infrastructure charter.
