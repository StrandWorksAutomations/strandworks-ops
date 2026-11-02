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
