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
