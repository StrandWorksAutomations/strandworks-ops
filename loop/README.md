# Owner loop (`swd`)

Two-way channel between Jonathan's dashboard (`/decisions`, `/timeline`) and every working agent.

```
agent: swd ask ──► owner_loop_items (open) ──► dashboard "Needs you"
owner: taps option ──► ruled ──► SessionStart / UserPromptSubmit hook injects the ruling
agent: swd pickup ──► picked_up ──► swd done --note ──► done (outcome shown on dashboard)
```

A ruling that sits in `ruled` for more than 24 hours shows as STALLED on the dashboard.

## Agent protocol

- Decision that needs Jonathan: ask in the chat **and** `swd ask "<title>" -b "<context>" -o A="..." -o B="..." -r A [-d YYYY-MM-DD]`.
- He answers an open decision in chat: `swd resolve D-0007 --ruling A` (his exact answer), so the dashboard ledger stays complete. It cannot override a dashboard ruling.
- A ruling appears in your context: `swd pickup D-0007`, do the work, then `swd done D-0007 -n "<what changed, link/commit>"`.
- Dates he must not miss: `swd deadline "<title>" -d 2026-11-01`; `swd milestone ...` for planned delivery points.
- `swd alert` is for recurring failures (deduped by title, counted). Do not file alerts as decisions.
- `swd inbox` shows what is pending for the current repo; `swd show D-0007` shows history.

## Install

`./loop/install.sh` copies `swd` to `~/.local/bin`. It needs `~/.config/strandworks/owner-loop.token` (agent token; its SHA-256 is registered in `owner_loop_agent_tokens`) and `~/.config/strandworks/owner-loop.apikey` (the project's publishable key), both chmod 600. Hooks (Claude `~/.claude/settings.json`, Codex `~/.codex/hooks.json`):

```
SessionStart      → swd hook --event session-start
UserPromptSubmit  → swd hook --event prompt     (re-checks at most every 45 s, shows only new rulings)
```

Backend: Supabase `bniuiwbwumpymxiesyyt`, migration `owner_loop_v1`. Tables are RLS-locked; agents use the token-gated `owner_loop_ask / inbox / get / transition` RPCs; only the cockpit's service role can call `owner_loop_rule`.

### Local portfolio runtime (installed November 2, 2026)

From the current source checkout, preview the filesystem-only installation, then
apply with a backup folder outside the repository and runtime:

```sh
python3 loop/install_local_runtime.py
python3 loop/install_local_runtime.py --apply --backup-dir /path/outside-repo/backups
python3 -m unittest discover -s loop -p test_install_local_runtime.py -v
```

The installer copies `swd`, `reconcile.py`, `publish_local.py`, `meter.py` and
`portfolio-push.json` into `~/PROJECTS/_ops/portfolio-control/`, with a SHA-256
receipt at `runtime-install.json`. It copies the marketing snapshot and latest
dated saved scout unchanged, retaining their original check times. It validates
`bash -n`, keeps exactly one 900-second publisher hook in the existing master,
and retires only `qa_inbox_sweep`, `drift_gmail_sweep`, `drift_appstore_sweep`,
`drift_morning_brief`, `drift_morning_ingest_sweep`, `drift_morning_ingest` and
`drift_evening_push`. Unrelated jobs and paused job-watch stay intact. It creates
no scheduler and runs no source job or remote publication. Re-run after intended
helper, plan or saved-evidence updates; the saved scout copy is not a new scan.

The same backed-up install maintains a marked quota-handoff block in existing
`~/PROJECTS/{AGENTS,CLAUDE}.md`, `~/.codex/AGENTS.md` and `~/.claude/CLAUDE.md`.
It preserves surrounding guidance and company facts, creates no missing guidance
file, and refuses duplicate or unpaired markers before writing. The block routes
fresh sessions to the canonical provider meter and fixed approved plan, without
copying live quota percentages into global guidance. A custom `--projects-root`
uses its parent for the sibling `.codex`/`.claude` guidance paths.

| Installed entrypoint | Purpose / existing cadence |
|---|---|
| `loop/portfolio-push.json` → `~/PROJECTS/_ops/portfolio-control/portfolio-push.json` | Eight approved objectives, allocations, reset cutoffs and dated reviews; shared live records are read through `swd focus -p portfolio --json`. |
| `~/.local/bin/swd` / `~/PROJECTS/_ops/portfolio-control/swd` | Shared focus, owner decisions, claims, checkpoints, reports and metrics. Existing `loop/install.sh` refreshes the PATH CLI copy; the runtime installer refreshes its sibling helper copy. |
| `~/PROJECTS/_ops/lib/master_run.sh` → `_ops/portfolio-control/publish_local.py` | Existing `com.claude.schedule.master-runner` launch agent; publisher interval 900 seconds. Saved inputs are runtime `marketing-snapshot.json` and `inputs/tech-scout/*tech-scout*.md`; local completion is `~/.cache/strandworks/portfolio-local-publisher/latest.json`. |
| Droplet `/opt/claude-ops/portfolio-control/run.sh` → `reconcile.py` + sibling `swd` | Existing root cron: `*/15 * * * * /opt/claude-ops/portfolio-control/run.sh >> /var/log/portfolio-control.log 2>&1 # portfolio-control-managed`. State/completion: `/var/lib/strandworks/portfolio-control/{state.json,latest.json}`. Existing owner-loop credentials and Linear key are reused; no LLM call. This local installer does not modify the droplet. |
| Codex automation `portfolio-reset-push` | Existing active hourly heartbeat (`~/.codex/automations/portfolio-reset-push/automation.toml`); agent continuation is separate from the local publisher and droplet reconciliation. |

## Shared project focus and work handoffs

`portfolio_control_v1` adds shared outcomes, metric observations, session claims
and durable reports. **Linear remains the source of issue scope and status.**
These records link to Linear; publishing a report or releasing a claim never
changes an issue's status. Owner decisions still use the owner loop above.

Start every fresh project session with `swd focus` (or `swd focus -p portfolio`
for the whole portfolio). `swd focus --json` returns the same bootstrap data the
dashboard reads: objectives, latest source observations, current/expired claims,
reports and the owner-loop inbox, plus the server check time. Session-start
hooks include a compact focus summary automatically. A failed explicit read
returns a nonzero exit; it never represents an unavailable source as an empty
successful queue. The hook falls back to the existing owner loop during rollout.

Before editing, read the existing Linear issue and claim it:

```sh
swd claim STR-1234 --objective kc-reliability --session YOUR-CHAT-ID \
  --branch codex/kc-reliability --worktree /path/to/worktree
swd checkpoint STR-1234 --session YOUR-CHAT-ID \
  -n "Source checks passed; browser review remains" --next-action "Verify mobile filters"
swd release STR-1234 --session YOUR-CHAT-ID \
  -n "Handoff saved in report kc-review-2026-11-02; browser review remains"
```

The session ID defaults to the Codex/Claude environment when available; otherwise
pass `--session`. Claims last **60 minutes**. Renew with a useful checkpoint
every **15 minutes** while working. An active competing session is rejected
atomically, including simultaneous first claims. After expiry, inspect Linear,
the working tree, running writer processes and the last checkpoint; then use
`claim ... --recovery-note "what I inspected and recovered"`. Expiry alone does
not authorize two writers. A recovered claim fences the old session from renew
and release. Prior checkpoint/next-action text is retained for recovery.

Publish reports and metrics with stable idempotency keys, using JSON files or
stdin. Preserve the exact JSON when retrying after an uncertain response: the
same key and payload return the same row, while changed payloads with that key
are rejected. Evidence rows are append-only; corrections are new observations
or reports with new keys.

```sh
swd report --file work-report.json
swd metric --file metric-observation.json
swd objective-upsert --file objective.json
```

An objective is a complete replacement document:

```json
{"id":"kc-reliability","project":"highest-paying","title":"Reliable job search",
 "outcome":"Users reach verified employer postings","priority":1,
 "target_at":"2026-11-04T17:00:00-05:00","review_at":"2026-11-03T12:00:00-05:00",
 "accountable_owner":"Jonathan","linear_project_id":null,"linear_milestone_id":null,
 "issue_ids":["STR-1234"],"status":"active",
 "metric_definitions":[{"id":"verified_links","label":"Verified employer links","unit":"count","target":20}]}
```

Report and observation examples (example values, not live project claims):

Today and Projects show original report text and current attention separately
from historical register checks. For explicit delivery summaries, `validation`
may contain a JSON string with `delivery.local`, `delivery.deployment` and
`delivery.owner_acceptance`, each an object with `status` and optional `detail`.
Local statuses: `in_progress`, `review_candidate`, `complete`, `blocked`.
Deployment statuses: `not_deployed`, `private_review`, `production_deployed`,
`production_verified`, `blocked`. Owner acceptance: `pending`, `accepted`,
`changes_requested`. Omitted, `unknown`, invalid and unrecognized statuses show
**Not recorded**. Include the source date, commit/build and scope in `detail`;
existing Production and a new local candidate can have different states.
These are reported facts, never inferred from result text, test counts or a
repository activity badge. Evidence publication does not establish acceptance.

```json
{"issue_id":"STR-1234","objective_id":"kc-reliability","session_id":"YOUR-CHAT-ID",
 "agent":"codex","result":"Review build ready","evidence":["https://example.com/review"],
 "validation":"Source and browser checks passed","remaining":"Owner review",
 "next_action":"Collect owner feedback","idempotency_key":"kc-review-2026-11-02-v1"}
```

```json
{"objective_id":"kc-reliability","metric_id":"verified_links","value":null,
 "observed_at":"2026-11-02T12:00:00-05:00","source":"Unknown: source unavailable",
 "evidence":[],"idempotency_key":"kc-links-2026-11-02-v1"}
```

An unknown value is JSON `null`, with its reason in `source`; never substitute
zero. A report's session/agent default from the CLI environment when omitted.
Global flags such as `--agent claude` precede the subcommand. Agents use the
existing owner-loop token; the dashboard uses server-only service-role reads.
No new browser credential or direct public table access is introduced.

RPC contract: `portfolio_focus(p_token,p_project)`,
`portfolio_objective_upsert(p_token,p_objective)`,
`portfolio_claim(p_token,p_work,p_recovery_note)`,
`portfolio_checkpoint(p_token,p_issue_id,p_session_id,p_checkpoint,p_next_action)`,
`portfolio_release(p_token,p_issue_id,p_session_id,p_note)`,
`portfolio_report(p_token,p_report)` and `portfolio_metric(p_token,p_observation)`.
Claim JSON contains `issue_id,objective_id,agent,session_id,branch,worktree`.
All timestamps are ISO 8601; owner-facing dates use America/New_York.

Run `python3 -m unittest discover -s loop -p 'test_*.py' -v`. Tests create and
stop a disposable local PostgreSQL cluster, apply the actual migrations, and
exercise concurrency, expiry/recovery, append-only evidence, retry semantics,
authorization and unavailable-source behavior. They never use live credentials.
