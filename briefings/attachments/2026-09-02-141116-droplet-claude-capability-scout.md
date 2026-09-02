---
name: Claude-Capability Scout - 2026-09-02
description: 7-day window (8/27–9/02). **Headline #1 (product-build lens): Model Hardware Standard (MHS) research preview (8/27)** — the "MCP for physical devices" — AI agents driving lab microscopes, liquid handlers, robot arms via a standardized read/write driver. Direct throughline candidate for MedSim-Game's physiological-clone-to-living-mechanism arc (future rail from digital body → high-fidelity mannequin control) and for the parked sim-lab family. **Headline #2 (cost lens): Claude Fable 5.1 + Mythos 5.1 (9/1)** — same $10/$50 base as Fable 5 but cache reads drop to $0.25/MTok (0.025× base vs 0.1× elsewhere = 75% cache-read discount). Always-on adaptive thinking, 1M context, 128k max output. Now the default Fable in Claude Code (v2.1.257). Beta headers for turn-scoped system messages (`clear_at: "next_user_message"`) + per-message effort mid-conversation. **Headline #3 (agent-team + security lens): Claude Code security-hardening wave (v2.1.248 → v2.1.258)** — `--restricted` / `CLAUDE_CODE_RESTRICTED=1` flag, Containment Escape auto-mode rule (blocks cloud-metadata credential fetches + egress evasion + cross-tenant reach), `permissions.blockReadsOutsideWorkingDirectories`, symlink-swap TOCTOU fix on Read/Write/Edit, plugin path-traversal refusal, `.env`/`.tfvars`/editor-swap credential upload block for `/ultrareview`. Ties into Anthropic's 8/31 alignment-and-security post (real-time classifier now blocks sandbox-escape attempts in RL training). **Headline #4 (agent-team lens): `PreModelSwitch` / `PostModelSwitch` hooks + `experimental.cacheTtl` per-agent frontmatter + `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` (v2.1.248 + v2.1.251 + v2.1.257)** — hooks fire on model changes; each agent can carry its own 5m/1h prompt-cache TTL; force-override for subagent model routing. **Headline #5 (agent-team lens): Files + Skills APIs GA in Anthropic SDKs (8/27)** — Python 1.2.0 / TS 0.122.0 / Go 1.68.0 / Java 2.59.0 / Ruby 1.67.0 / C# 12.44.0 drop the beta headers; `client.beta.skills.delete()` now cascades all versions. **Also this window:** Enterprise Frontier Safeguards preview (9/1, not solo-dev applicable), per-session prompt-cache line in `/cost` + `Spend limit` bar in `/usage` (v2.1.251), foreground-subagent tool-call live streaming to Remote Control (v2.1.251), `/schedule` routine dispatch fixes, subagent auto-continue-after-mid-stream-cutoff (v2.1.257), 11 Claude Code releases in the window (v2.1.248 → v2.1.258). **No parked ideas fully unblocked this week** — MHS is a future rail worth flagging on three MedCapture/sim-lab entries but does not resolve their current gates.
metadata:
  type: report
project: _ops
status: report
---

# Claude-Capability Scout - 2026-09-02

Weekly window: 2026-08-27 → 2026-09-02 (7 days; prior scout ran Wednesday 2026-08-26). Two Anthropic model announcements + one net-new spec preview (MHS) + a heavy Claude Code security-hardening wave landed in the window. Flagship remains **MedSim-Game** per `/PROJECTS/CLAUDE.md`.

## Releases This Week

### Claude Code

**Eleven versions shipped in window (v2.1.248 → v2.1.258).** Three carry headlines: v2.1.248 (`--restricted` + per-agent `experimental.cacheTtl` + settings-approval + symlink-swap file-tool fix + `.env`/`.tfvars` upload block), v2.1.251 (`PreModelSwitch`/`PostModelSwitch` hooks + `/cost` per-session cache line + Spend limit bar + foreground-subagent tool-call live streaming), v2.1.257 (Fable 5.1 as default, Containment Escape auto-mode rule, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`, `blockReadsOutsideWorkingDirectories`).

**v2.1.258 (2026-09-01)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Fixed Claude Code failing to launch on macOS 12 (Monterey)**, regression from v2.1.255. Not applicable to Strandworks MacBook (macOS 14+), but note the launch-blocker regression cadence.
- **Fixed remote and scheduled sessions failing with "user messages must have non-empty content"** after a re-sent permission approval could not be applied. **Agent-team lens: HIGH — direct fit for Strandworks scheduled scout / babysit-prs jobs.** Prior version: a re-sent perm approval could silently poison the scheduled session. Fixed.

**v2.1.257 (2026-09-01)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added Claude Fable 5.1 (`claude-fable-5-1`), now the default Fable model** — 1M context, $10/$50 per Mtok with $0.25/Mtok cache reads. **HEADLINE — Cost lens: HIGH. Agent-team lens: HIGH.** See Platform section for full model details. Direct impact: any Strandworks session that picks `fable` in `/model` now gets 5.1 automatically (except behind Claude apps gateway, which keeps resolving `fable` to Fable 5 until the gateway configures 5.1 — pick 5.1 explicitly if you're gateway-behind).
- **Added `timeFormat` and `timeZone` settings**: 12-hour, 24-hour, 24-hour UTC, or a strftime pattern for the turn-end clock + transcript timestamps. Small QoL — matches Strandworks preference for absolute timestamps in log/scout artifacts.
- **Added a Containment Escape rule to auto mode** so cloud metadata-credential fetches, egress evasion, and cross-tenant reach are no longer auto-approved unless your environment marks them expected. **HEADLINE — Agent-team lens: HIGH — security-adjacent.** Direct fit for Strandworks's auto-mode-driven Bash grants. This rule kicks in on next update; if any Strandworks skill legitimately fetches cloud metadata (e.g. GCP metadata endpoint for auth), it'll now prompt. **Verify: check `_ops/lib/` scripts for `169.254.169.254` or metadata endpoint calls. Action #2.**
- **Added `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`** to apply `CLAUDE_CODE_SUBAGENT_MODEL` (or the main model) to every subagent, ignoring per-spawn and agent-definition model overrides. **Agent-team lens: HIGH.** Prior version (v2.1.251): `CLAUDE_CODE_SUBAGENT_MODEL` set a default that per-spawn or agent-definition `model:` could override. New version: `_FORCE` variant hard-pins. Direct fit for a Strandworks pattern where you want to run *every* subagent on Haiku 4.5 for cost, or *every* subagent on Fable 5.1 for the cache-read discount, without editing each agent definition.
- **Added `s` in `/effort`** to change effort for the current session only, matching `/model`. QoL.
- **Added a `/doctor` warning for stale sandbox mask files** left by a killed session. Observability.
- **Added a one-time prompt in auto mode before the first file read outside the working directories**, with the option to block such reads (`permissions.blockReadsOutsideWorkingDirectories`). **Agent-team lens: HIGH — security-adjacent.** Direct fit for Strandworks multi-project sessions that hop between `MedSim-Game/`, `_ops/`, and portfolio-wide directories. Prior version: file reads outside the working directory in auto mode were silent. New version: prompted-once + hard-block setting. **Consider setting `blockReadsOutsideWorkingDirectories: true` for sensitive-directory sessions (e.g. `.env.master` proximity).**
- **Added support for a gateway-supplied `description` on discovered `/model` picker entries** (`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`). Enterprise-adjacent.
- **Fixed settings in a `.claude/` folder created after startup not being picked up until restart.** **Agent-team lens: MEDIUM.** Direct fit for `/cd` into a project that has a `.claude/` folder created mid-session (e.g. `_ops/` gets a new project `.claude/`); this now hot-loads.
- **Fixed sessions dispatched from an agent view opened with `←` always starting in the original session's permission mode**, overriding the target directory's `defaultMode` and the agent's `permissionMode`. **Agent-team lens: MEDIUM.** Direct fit if Strandworks uses `←` to dispatch background subagents.
- **Fixed `keybindings.json` rebinds of Ctrl+G being ignored in `claude agents`**; its Ctrl+S / Ctrl+T are now rebindable via the new `Agents` context. Direct fit if Jonathan has custom keybindings.
- **Fixed background sessions failing to start on macOS npm installs during a self-update**, and on Windows when a stale daemon lock file pointed at a reused process id. **Agent-team lens: MEDIUM.** Direct fit for macOS Strandworks: an npm-based self-update racing a background-session start now works instead of failing.
- **Fixed the working spinner stopping while a response streams behind a slash-command panel.** UX.
- **Fixed a background session's `state.json` `detail` repeating its own dispatch prompt after a scheduled wake-up.** Direct fit for `/schedule`-driven Strandworks jobs.
- **Fixed `claude agents` keeping a background session you re-prompted buried in Completed after it finished again**; Completed now orders by the latest finish. UX.
- **Fixed `claude --bg` from a directory that was just deleted reporting "backgrounded" and leaving a crashed session row**; it now prints the reason and exits 1. Correctness.
- **Fixed Remote Control connecting mid-session re-sending the Bash tool definition, causing a prompt-cache miss.** **Agent-team lens: MEDIUM — cost.** Prior: mid-session Remote Control connect punched a prompt-cache hole. Fixed.
- **Fixed a doubly-listed custom `Authorization` header overriding the configured credential on Bedrock, Mantle, Vertex, and WIF**, and the Vertex setup wizard picking up a leftover Anthropic profile from `~/.config/anthropic`. Enterprise gateway; not applicable to Strandworks direct-API path.
- **Fixed a leftover Anthropic API key or auth token being sent alongside your Foundry subscription key in API-key mode.** **Security-adjacent.** Not applicable to Strandworks (no Foundry) but notable pattern.
- **Fixed `/schedule` routines whose prompt was saved without a message role and then ran with nothing to do.** Direct fit for `/schedule`-based Strandworks jobs.
- **Fixed `claude agents` not saying that a background session is waiting for you to approve a message from another session**, or who sent it. Cross-session-messaging observability.
- **Fixed a prompt stashed with Ctrl+S inside an opened background session being lost when the session went idle or was stopped and then reopened.** Direct fit for Strandworks solo-dev Ctrl+S workflow (stash-then-resume).
- **Fixed telemetry (OTEL) settings pushed through server-managed settings being ignored on warm starts**, including desktop-app Code sessions. Enterprise-adjacent.
- **Fixed a teammate permission request being answered twice** when the leader's mailbox write was briefly locked. Agent-team correctness.
- **Fixed a phantom duplicate slash-command row** rendering below the in-flight turn while a command's auto-continued response streamed. UX.
- **Fixed `policyHelper` `timeoutMs` and `refreshIntervalMs` values above the timer maximum (2147483647)** causing failures or re-runs every millisecond; they are now clamped. Enterprise-adjacent.
- **Fixed the token counter freezing or crawling after switching to another subagent's transcript**, and made background subagents' and teammates' counters update live while a response streams. **Agent-team lens: MEDIUM.** Direct fit for Strandworks's multi-subagent skills (scout uses subagents).
- **Fixed sandbox network hosts written with a trailing dot** (`example.com.`): a `deniedDomains` entry didn't block the host inside the sandbox. **Security-adjacent.** Direct fit if Strandworks `.claude/settings.json` uses `deniedDomains`.
- **Fixed dismissing the Remote Control consent prompt (Esc, or `n` at `claude remote-control`) counting as consent**, so the next request connected without asking. **Security-adjacent.** Prior: Esc/n → still-connected. Fixed.
- **Fixed `/mcp` reconnect and enable still connecting a settings-file MCP server that a managed MCP allow/deny list or `strictPluginOnlyCustomization` loaded after startup should block.** Enterprise-adjacent.
- **Fixed `claude mcp remove` leaving a remote server's stored OAuth credentials behind** when `strictPluginOnlyCustomization` locks MCP to plugin-only servers. **Security-adjacent** — cred-hygiene fix.
- **Fixed Remote Control (`claude remote-control`) sessions started from the Claude app ignoring the selected model** and running on the machine's default instead. Direct fit for Strandworks Remote-Control-from-mobile flow.
- **Fixed `--disallowedTools` and session deny rules being dropped after the first settings reload** when `allowManagedPermissionRulesOnly` is enabled. Enterprise-adjacent.
- **Fixed `--resume` listing a backgrounded conversation twice and `--continue` reopening its stalled pre-background copy**; `--continue` now also opens finished background sessions. Direct fit for Strandworks `--continue`/`--resume` daily use.
- **Fixed fullscreen mode not letting you click `!` shell command output to expand it.** UX.
- **Fixed background sessions left running an older Claude Code binary piling up across auto-updates instead of being retired.** **Agent-team lens: MEDIUM.** Direct fit for long-lived Strandworks background sessions across auto-updates.
- **Fixed `claude agents --json` briefly switching the terminal to raw mode** and undoing another program's terminal settings on exit. Direct fit for scripted `claude agents --json` calls.
- **Fixed Proactive output style sessions busy-looping with filler messages and repeated log reads** instead of idling while a background command or Monitor they started is still running. **Agent-team lens: MEDIUM.** Direct fit for any Strandworks skill that uses Proactive style + Monitor.
- **Fixed subagents stopping when a response was cut off mid-stream by a computer sleep, dropped connection, or server error**; they now automatically continue instead of ending with an incomplete response. **Agent-team lens: HIGH.** Extends the v2.1.246 non-interactive auto-continue to subagents. Direct fit for scout / babysit-prs / long-running subagent flows on the MacBook (sleep-resilience).
- **Fixed `←` doing nothing in the `/btw` panel inside a `claude agents` session**: it now returns to the agents list (even mid-answer). UX.
- **Fixed sessions with an advisor model set missing the prompt cache on background requests** (compaction, `/recap`, prompt suggestions) and re-sending the full conversation uncached each time. **Cost lens: MEDIUM.** Direct fit if Strandworks uses advisor model — this was a silent uncached-recompact cost leak. Fixed.
- **Fixed `claude -p` exiting about 5 seconds after its final result while a Monitor the model armed was still running**; it now waits for the watch to fire or time out. Direct fit for headless `claude -p` jobs that arm a Monitor.
- **Fixed a `permissions.ask` rule being skipped in auto mode when the matching command ran inside a compound command or subshell**, letting it run without the confirmation prompt. **Security-adjacent — HIGH.** Direct fit for Strandworks `permissions.ask` rules. Prior: `ask` inside a subshell was silently bypassed in auto mode. Fixed.
- **Fixed plugins being able to read files outside their own directory through a declared command, agent, skill, hooks or other component path that is a symlink**; such paths are now refused with an error. **Security-adjacent — HIGH.** Prior: plugin path-traversal via symlink. Fixed.
- **Fixed `/add-dir` rejecting a directory inside the current working directory**; it now loads that directory's skills, commands, and agents like `--add-dir` does at startup. Direct fit — enables in-session `/add-dir` into a subdirectory (e.g. `/add-dir MedSim-Game` from `/PROJECTS`).
- **Fixed the main agent not being told when you resume a subagent you had stopped from its transcript view.** Agent-team correctness.
- **Fixed a crash when pasting ANSI-colored text (e.g. a CI log) into dialogs like `/feedback`.** UX.
- **Fixed `claude mcp add/remove` hanging or exhausting memory when the project's `.mcp.json` is a FIFO or a device-file symlink**; it now fails fast with an actionable message. **Security-adjacent.**
- **Fixed unbounded memory growth when non-JSONL data is piped into `claude -p --input-format stream-json`**; it now fails fast. Direct fit for scripted headless flows.
- **Fixed backgrounding a turn (`←` or Ctrl+B) while a subagent or other tool was running occasionally making the background session treat that tool as rejected instead of re-running it.** Agent-team correctness.
- **Fixed Bash `Read()`/`Edit()` deny rules not applying to `< file` redirects and reader commands like `tac` and `egrep`**; a deny rule on any argument or redirect target now refuses the command. **Security-adjacent — HIGH.** Direct fit for Strandworks Bash deny rules. Prior: `tac secrets.txt` bypassed a `Read(secrets.txt)` deny; also `cmd < secrets.txt` bypassed. Fixed.
- **Fixed resuming or messaging a subagent whose transcript had grown past 5 MB** (for example after reading many images) failing with "No transcript found". Direct fit for image-heavy Strandworks subagents.
- **Fixed worktree-isolated sessions refusing Bash loops, `$VAR` reads, `"$(…)"` and heredocs that never touch git** as "too complex to verify that it stays inside the worktree". **Agent-team lens: HIGH.** Prior version: worktree-isolated sessions blocked legitimate Bash. New: fixed. Direct fit for Strandworks worktree use.
- **Fixed `/model` and `/effort` showing a prompt-cache warning after rewinding a conversation back to empty.** UX.
- **Fixed prompt-cache misses on every turn in long screenshot-heavy sessions** once images exceeded the per-request size cap. **Cost lens: MEDIUM.** Direct fit for Strandworks screenshot-driven flows (e.g. verify skill).
- **Fixed the Edit permission prompt's diff view rendering emoji and multi-code-point characters with incorrect widths.** UX.
- **Fixed WebSocket MCP server connection failures being logged as "[object ErrorEvent]"** instead of the underlying error. MCP observability.
- **Fixed background sessions failing to open with "Couldn't start the background service" while another Claude Code process was downloading an npm update**; the start now waits. **Agent-team lens: MEDIUM.** Direct fit for concurrent-session macOS Strandworks.
- **Fixed background commands that detach from their shell (for example under `timeout` or `setsid`) surviving a task stop or Claude Code exit.** Direct fit for Strandworks Bash flows that background daemons.
- **Fixed Claude not being told when you stop a background command from the tasks panel or a connected client.** Agent-team correctness.
- **Fixed stopping a background subagent leaving its monitors running.** Agent-team correctness.
- **Fixed sandboxed git commands in a linked worktree losing write access to the repository's common `.git` directory after `cd` into a subdirectory.** Direct fit for Strandworks worktree + `cd` flow.
- **Fixed Bedrock and Bedrock Mantle requests going silent during long hidden-thinking phases on Opus 4.7 and later**, which let idle timeouts cut the connection; the stream now carries progress events. Enterprise-adjacent.
- **Fixed launching Claude Code after a Claude apps gateway expired or revoked your session**: it now says the session ended and offers `/login` instead of reporting a network error. Enterprise gateway.
- **Fixed cloud sessions losing git/GitHub credentials for the rest of the session** when the session's network proxy failed to start at launch. Cloud-session correctness.
- **Fixed leftover `cc-daemon-*` folders in the system temp directory after an interrupted background daemon start**; the `cleanupPeriodDays` retention sweep now removes them. Hygiene.
- **Fixed Bash permission checks auto-approving certain `[[ ]]` conditionals that zsh parses differently from bash**; these now prompt for approval. **Security-adjacent.** Direct fit for zsh-shell Strandworks (macOS default = zsh).
- **Fixed agent-team teammates in tmux/iTerm2 panes sometimes staying open after acknowledging a shutdown request.** Direct fit for iTerm2 Strandworks pane-based agent-team flow.
- **Improved rendering performance**: less re-render work per turn in long conversations, streaming no longer slows down as the reply grows, and background-agent updates no longer re-render the whole screen. **Agent-team lens: MEDIUM — direct QoL for long-running Strandworks sessions.**
- **Improved prompt input responsiveness** by reducing per-keystroke rendering work. QoL.
- **Improved policy helper diagnostics** — refresh failures now show in `/status`, declining the managed-settings dialog prints why Claude Code exited, and helper timeouts are reported as timeouts. Enterprise observability.
- **Improved `/code-review --comment` to post findings on GitLab merge requests via `glab mr note`** instead of reporting the target as unsupported. Direct fit if Strandworks ever mirrors to GitLab.
- **Improved `claude self-hosted-runner --configure-git` to also enable git push negotiation**, so the first push of a new branch from a stale clone uploads only the new commits instead of the whole tree. Enterprise/self-hosted-adjacent.
- **Improved MCP connection and OAuth debug/error logs so credentials carried in a server's URL or request headers are redacted.** **Security-adjacent.** Cred-hygiene fix.
- **Improved `/fork` to keep the original conversation's prompt cache in the new background session**: its worktree briefing now arrives as a message instead of a system-prompt change. **Cost lens: MEDIUM.** Prior: `/fork` punched a prompt-cache hole. Fixed. Direct fit for Strandworks `/fork` flows.
- **Changed `--effort` to lift a new model's default-effort hold for that session only** rather than permanently. Correctness.
- **Changed a `policyHelper` in MDM or `managed-settings.json` shadowed at launch by cached server-managed settings** to run (or exit) as soon as the fetch reports them removed. Enterprise-adjacent.
- **Changed `managedSourcesBehavior: "merge"` to take `sandbox.credentials.awsPairs` and `sandbox.ripgrep` whole from the highest managed source that sets them** instead of combining. Enterprise-adjacent.
- **Changed gateway model discovery (`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`) to run even when `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set**, since it only queries your gateway. Enterprise.
- **Changed `claude --resume <session-id> --bg` to continue that session under its own ID when nothing is running it**, instead of silently starting a copy; a copy is now announced. Correctness — direct fit for Strandworks `--resume --bg`.
- **Changed `/btw` history browsing from `←`/`→` to `Shift+←`/`Shift+→` (or `[`/`]`)**, stepping through your recent side questions. QoL — key rebind, note if Jonathan uses `/btw`.
- **Changed `defaultMode: "bypassPermissions"` in `.claude/settings.json` or `.claude/settings.local.json` to be ignored, like `"auto"`**; set it in user or managed settings, or pass `--permission-mode`. **Security-adjacent — HIGH.** Prior: project-scope `defaultMode: bypassPermissions` was accepted (a project could silently opt into bypass). New: refused at project scope. **Verify Strandworks `.claude/settings.json` files for this pattern — if present, they will be silently ignored now.**
- **Changed `fable` and `best` in Claude apps gateway sessions to keep resolving to Fable 5** for now, since gateways not yet configured for Fable 5.1 reject it; pick Fable 5.1 in `/model` to use it. Enterprise gateway.
- **Changed `--add-dir`, `/add-dir`, and `additionalDirectories` to refuse network paths (UNC shares, `/net/<host>` automounts)** with a message before touching them. **Security-adjacent.**
- **Changed Claude apps gateway sign-in and token refresh requests to verify the gateway's pinned TLS certificate.** Enterprise.
- **Changed Cowork and claude.ai cloud sessions**: reading an artifact that isn't yours now always asks you first, even in auto mode. Cloud-session security.
- **Removed the Ctrl+E command explanation on Bash and PowerShell permission prompts.** UX.
- **[VSCode]** Added collapsible ACCOUNT & USAGE and SESSION MANAGER section headers, model pill on input footer, output style selection in command menu, session archive-vs-delete. VSCode-specific.

**v2.1.252 (2026-08-31)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Fixed Bash commands failing with "task output swap refused (tasks dir moved or linked)" on some Macs.** **Agent-team lens: MEDIUM — Bash reliability on Strandworks MacBook.**
- **Fixed "always allow" not saving in a project that has no `.claude/settings.local.json` yet.** **Agent-team lens: MEDIUM.** Direct fit for first-visit-to-a-project pattern. Prior: "always allow" was silently dropped on first-visit. Fixed.
- **Fixed Remote Control sessions hosted by Claude Desktop or VS Code stalling for minutes after a tool finished when the connection to claude.ai was degraded.** Direct fit for Remote Control flows.
- **Fixed background task notifications with very large failure output** (for example git errors on a full disk) making the conversation exceed the API request size limit. Correctness.

**v2.1.251 (2026-08-28)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `PreModelSwitch` and `PostModelSwitch` hook events** (block, confirm, or annotate a model switch); `SessionStart` resume hooks now receive session staleness and the estimated re-cache cost. **HEADLINE — Agent-team lens: HIGH.** Prior: model switches were opaque to hooks. New: hookable. Direct fit for Strandworks patterns that route MedSim-Game work to Opus 5 and `_ops/tech-scout` work to Sonnet 5 — a `PreModelSwitch` hook can now enforce/log/block a switch based on project. Also useful: `SessionStart` resume hook can now see re-cache cost — sensible input for whether to auto-continue vs. wait for `/model` cheaper pick.
- **Added live streaming of a foreground subagent's tool calls and results to Remote Control clients** (background subagents still show status only). Direct fit for Remote-Control-observed Strandworks work.
- **Added a Spend limit bar to `/usage` and a `rate_limits.spend_limit` status line field** for developers behind a Claude apps gateway with spend limits. Enterprise gateway — cross-refers Bouren Plan §1 monthly AI line for direct-API path where equivalent client-side budget flag is `--max-budget-usd` (already available).
- **Added a per-session prompt-cache line to `/cost` (hit ratio, misses, tokens re-cached, warm/cold) and a matching `prompt_cache` object for status line scripts.** **HEADLINE — Cost lens: HIGH.** Prior: prompt-cache health was only visible in aggregate `/usage`. New: per-session in `/cost`. **Direct signal for whether Strandworks skills are cache-warming effectively.** Combines with v2.1.243's Loops breakdown to give per-loop + per-session cache observability. **Try it: `claude cost` at the end of the next scout run.**
- **Added `attach`, `logs`, `stop`, `respawn`, and `rm` to `claude --help`**; the `--resume` message for a running background session now names the exact `claude attach <id>` command. UX / observability — direct fit for the sub-CLI Strandworks uses to manage background sessions.
- **Fixed file tools (Read, Write, Edit) following a symlink swapped inside the working directory after the permission check**, which could read or write outside the approved location. **HEADLINE — Security-adjacent: HIGH — TOCTOU fix.** Prior: perm-check on path A, actual write to symlink-target B (swapped between check and syscall). Fixed.
- **Fixed plugin commands declared in a marketplace entry being able to point outside the plugin directory**; such paths are now rejected with a path-traversal error. **Security-adjacent — HIGH.**
- **Fixed project settings being able to enable detailed beta tracing or raw API body logging**, and a lower-scope beta tracing endpoint bypassing an OTLP collector pinned by managed settings or a host app. **Security-adjacent.** Enterprise/managed-settings correctness.
- **Fixed the Workflow tool reading (and quoting in errors) a `scriptPath` outside what the session may read** before the permission check ran. **Security-adjacent.**
- **Fixed Grep and Glob not applying `Read(...)` deny rules to files reached through a symlinked search path.** **Security-adjacent.** Direct fit for Strandworks Grep/Glob-heavy exploration if any deny rules exist.
- **Fixed conversations getting stuck on "text content blocks must be non-empty" errors after a turn where the model produced only thinking.** Correctness.
- **Fixed the first launch on a fresh install starting in default mode instead of auto mode** for accounts whose startup default is auto mode. Correctness.
- **Fixed Opus 5 requests failing with "effort … is not supported when thinking is disabled"** when effort was xhigh/max and thinking was turned off; effort is now sent as `high` in that case. Direct fit for Strandworks Opus-5-xhigh use.
- **Fixed replying to a message Claude Desktop delivered from another session**: `SendMessage` to that session id now delivers through Claude Desktop instead of failing with "not reachable". Cross-session-messaging correctness.
- **Fixed TUI lag with many parallel subagents**: per-second progress ticks now replace their predecessor. **Agent-team lens: MEDIUM.** Direct fit for scout / other multi-subagent skills.
- **Fixed agent teams: a teammate's final answer not reaching the team lead** — it now arrives in the idle notification. Cross-session-messaging correctness.
- **Fixed background subagents being unable to reply to a message from an unnamed sibling or parent agent** (`from` was the agent type, which is not an address). Cross-session-messaging correctness.
- **Fixed managed-settings `disableAutoMode` arriving mid-session not moving an already-running auto-mode session back to default mode.** Enterprise-adjacent.
- **Fixed a "switch to Opus 1M for 5x more context" tip that appeared even when the current Opus model already has a 1M context window.** Minor.
- **Fixed Claude apps gateway sessions treating a stored Anthropic profile as active.** Enterprise gateway.
- **Fixed cloud sessions telling Claude the model had changed when the host was only setting the session's initial model.** Correctness.
- **Fixed Remote Control reporting a failure when an organization's policy disables it**; it now shows a single quiet notice. Enterprise.
- **Fixed `/mcp reconnect` on Remote Control showing a generic withheld-detail error** instead of the real remedy when a server was disabled in another session. Enterprise-adjacent.
- **Fixed `--input-format stream-json`: client-injected assistant tool calls sent without a message id were merged into the first one and their results lost.** Correctness — direct fit for SDK-based flows.
- **Fixed session transcripts being silently overwritten when a directory change relocated a session onto an existing same-ID transcript.** **Agent-team lens: MEDIUM.** Direct fit for Strandworks `/cd` flow across projects sharing session IDs. Prior: silent-overwrite of transcript. Fixed.
- **Fixed background sessions and their subagents being unable to edit files inside a git worktree they created with `git worktree add`.** Direct fit for Strandworks worktree flows.
- **Fixed background sessions occasionally starting without any plugin skills** (and staying that way) when another Claude Code process was refreshing the plugin marketplace at the same moment. Concurrency correctness.
- **Fixed selecting text in an opened background session inside tmux over SSH** — copies to tmux buffer instead of OSC 52. Terminal correctness.
- **Fixed SDK and cloud sessions hanging indefinitely when an SDK MCP server's handshake acknowledgment was lost**; the wait now times out after 70 seconds. **Agent-team lens: MEDIUM — direct fit for headless SDK MCP-using jobs.**
- **Fixed self-hosted runner leaving a stuck session's Bash tool processes running after the session was force-stopped.** Self-hosted runner correctness.
- **Fixed `/usage-credits` for Team and Enterprise members whose admin set the org's usage-credit limit to $0.** Enterprise.
- **Fixed `--worktree --tmux` with a merge-request number on a gitlab.com origin trying a doomed GitHub-style fetch first** instead of fetching the GitLab ref directly. Direct fit if Strandworks touches GitLab.
- **Fixed Ctrl+G failing with "Emacs quit unexpectedly" in background sessions for editors that open `/dev/tty`** (emacs -nw, micro). Terminal-editor correctness.
- **Fixed an `additionalDirectories` entry containing a null byte crashing startup.** Robustness.
- **Fixed the MCP server menu's copy shortcut**: it now says how the sign-in URL was copied. UX.
- **Fixed italic text (such as the session recap line) rendering as highlighted blocks in GNU screen and in tmux sessions using a `screen` terminal type.** UX.
- **Fixed `claude mcp add --header` and `claude mcp add-json` help text naming the wrong transports.** Docs.
- **Fixed `claude ultrareview` and `/ultrareview` waiting the full 30 minutes when the cloud session fails to start**; they now stop early. Direct fit for `/ultrareview` use.
- **Fixed Bash permission checks auto-approving commands that assign an arithmetic expression to an integer shell variable** (e.g. `OPTIND=1/0`); these now prompt. **Security-adjacent.**
- **Fixed backgrounded sessions (`←`, `/background`, `--bg`) losing a Vertex/Bedrock gateway exported in the shell**, so every request failed. Enterprise gateway.
- **Fixed `claude --bg --model fable` on Max plans stopping to ask for usage credits while the interactive session on the same account still had Fable allowance.** Direct fit for Strandworks Max plan + `--bg` Fable use.
- **Fixed the one-time "make auto mode your default" offer appearing in unattended sessions** (e.g. agent-team teammate panes), where a stray keypress could accept it unread. **Security-adjacent.** Direct fit for Strandworks agent-team panes in iTerm2.
- **Fixed the managed-settings approval prompt re-appearing after signing in again to the same Claude apps gateway when the settings are unchanged.** Enterprise.
- **Fixed disabled `/bug` and `/share` reporting that `/feedback` was disabled.** Correctness.
- **Fixed cloud session creation advising GitHub setup after a transient GitHub connection failure** — the message now says to retry. Correctness.
- **Improved CPU usage during turns in interactive sessions** by cutting redundant UI re-renders. **QoL — direct win for Strandworks solo-dev interactive sessions.**
- **Improved install size**: the native binary is about 5 MB smaller. Minor.
- **Improved cloud sessions**: when the session's network proxy drops a connection during a Bash command, the tool result now names the host and reason. Cloud-session observability.
- **Improved `/schedule` to explain that MCP servers configured in Claude Code can't be attached to cloud routines**, instead of a bare "No MCP connectors" message. Direct fit for `/schedule` + MCP flows.
- **Improved framing of messages from your own subagents**: Claude is told the sender is a worker inside this session, not an unrelated Claude session. **Agent-team lens: MEDIUM.**
- **Improved the prompt placeholder to read "Message @name…"** while viewing a background subagent or fork transcript. UX.
- **Improved sanitization of MCP server names in error messages.** **Security-adjacent.**
- **Improved Amazon Bedrock session start under `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`.** Enterprise.
- **Improved the managed settings approval dialog to list only the settings that changed since you last approved them.** Enterprise QoL.
- **Improved retry when the model's tool call is malformed**: the broken output is now dropped from the retry context, including on Bedrock, Vertex, and Foundry. **Agent-team lens: MEDIUM.**
- **Changed `/radio` to be available on Bedrock, Vertex AI, Foundry, and Claude Platform on AWS, and when telemetry is disabled.** Enterprise.
- **Changed Claude in Chrome so browser actions always go through Claude Code's permission checks**, including in sessions with telemetry disabled. **Security-adjacent.**
- **Changed `CLAUDE_CODE_SUBAGENT_MODEL` to set the *default* subagent model rather than override everything**: an agent definition's `model:` and an explicit per-spawn model now take precedence over it. **HEADLINE — Agent-team lens: HIGH.** Prior version: `CLAUDE_CODE_SUBAGENT_MODEL` was a hammer (overrode everything). New version: default with proper precedence (per-spawn > agent-def > env var > main). The v2.1.257 `_FORCE` variant restores the hammer behavior when needed. **Combined: two-tier subagent model routing knob for Strandworks.**
- **Changed the default commit trailer to `Co-Authored-By: Claude Code` when the active model isn't a recognized Claude model** (e.g. third-party models behind a custom `ANTHROPIC_BASE_URL`). Correctness.
- **Changed the default model for seat-based Enterprise subscriptions to Opus 5**, matching other premium plans. Enterprise.
- **Changed `/effort` to save your default effort level per model**, so each model keeps its own setting when you switch. **Agent-team lens: MEDIUM.** Direct fit for Strandworks pattern of using different effort per model (e.g. Opus 5 xhigh, Fable 5.1 medium, Haiku 4.5 low).
- **Changed analytics to no longer turn off before sign-in solely because managed settings force gateway login.** Enterprise.
- **Changed the footer PR badge on Bedrock, Vertex, and Foundry to call the GitHub API directly** via `gh auth token`, `GH_TOKEN`, or `GITHUB_TOKEN`. Enterprise.
- **Changed how Bash command output files are created and read back when commands run in the sandbox**, so a sandboxed command cannot redirect or replace them. **Security-adjacent.**
- **Changed plugin/LSP install suggestions and the auto-mode default offer to wait until you've sent or cleared what you're typing.** **Security-adjacent — prompt-safety.** Prior: Enter that sent your prompt could accept an install-suggestion dialog. Fixed.
- **Changed server-managed settings that terminate sandbox TLS, route sandbox traffic through your own proxy, inject credentials, or weaken sandbox isolation to require approval before they apply.** **Security-adjacent — HIGH.** Enterprise but sets a pattern.
- **Changed `ANTHROPIC_CUSTOM_HEADERS` from managed or project settings to require approval when it sets a credential, org/tenant, routing, or API-behavior header** (e.g. `Authorization`, `Host`). **Security-adjacent.**
- **Changed project-level `.claude/settings.json` `env` to no longer set `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_TMPDIR`, or `TMPDIR`/`TMP`/`TEMP`**; set them in your shell, user, or managed settings. **Security-adjacent + configuration.** Direct fit — check any Strandworks project `.claude/settings.json` for these env-var overrides; they now silently no-op at project scope.
- **Removed syntax highlighting for six rarely used languages** (1c, gml, isbl, mathematica, maxima, sqf); binary is 2.5 MB smaller. Minor.
- **[VSCode]** Fixed sign-in for third-party providers and Remote Control banner → footer pill.

**v2.1.250 (2026-08-28)** — Bug fixes and reliability improvements. Rollup.

**v2.1.248 (2026-08-27)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `--restricted` (or `CLAUDE_CODE_RESTRICTED=1`)**: removes the built-in tools that run commands or code and `WebFetch` (unless named in `--tools`), keeps file tools inside the working directory, refuses `bypassPermissions`, and ignores user, project and local settings files. **HEADLINE — Agent-team lens: HIGH — security-adjacent.** New minimum-blast-radius flag. Direct fit for one-shot Strandworks jobs that only need to read files (or a curated tool set) — no Bash, no code execution, no WebFetch, no config-file influence. **Try it: `claude -p --restricted --tools Read,Grep` for read-only-audit tasks.**
- **Added `experimental.cacheTtl` (`"5m"` or `"1h"`) to agent frontmatter**: a per-agent prompt cache TTL used when no subagent TTL setting is configured. **HEADLINE — Cost lens: HIGH.** Combines with v2.1.243's `promptCacheTtl` + `subagentPromptCacheTtl` settings. **Direct win for long-idle agent-defined skills** — the scout skill's agent frontmatter can set `experimental.cacheTtl: "1h"` and survive the 8-day-between-runs cadence's initial re-cache (well, still misses on ≥1h idle, but hits the 5m TTL cheaply if a same-hour re-run happens).
- **Added `claude self-hosted-runner --client-label <label>`** (or `SELF_HOSTED_RUNNER_CLIENT_LABEL`). Enterprise-adjacent.
- **Added server-managed settings diagnostics**: startup warning + `/doctor` + `/status` line. Enterprise observability.
- **Added a warning in `/web-setup` when the GitHub CLI token lacks the `workflow` scope**, since pushes to very large repos can be rejected without it. **Agent-team lens: MEDIUM.** Direct fit for Strandworks GitHub CLI setup — check `gh auth status` for `workflow` scope on the token used by Claude Code.
- **Added `/usage-credits` for Enterprise organizations** billed through AWS Marketplace, self-serve Enterprise, and Enterprise trials. Enterprise.
- **Added cross-session messaging (`SendMessage` / `ListAgents`) between sessions on the same machine on Bedrock, Vertex, and Foundry, and when telemetry is disabled.** Enterprise/telemetry-off availability.
- **Fixed a prompt-cache miss (and lost extended-thinking context) roughly once an hour in long sessions**, caused by tool definitions being re-rendered after an OAuth token refresh. **HEADLINE — Cost lens: HIGH.** Direct fit for hour-plus interactive Strandworks sessions. Prior: silent hourly cache-miss + extended-thinking-drop. Fixed. **This is a meaningful passive cost/context win for the MedSim-Game long-session pattern.**
- **Fixed the `ScheduleWakeup` tool definition changing between a session and its `--resume`** when the account had entered usage overage, causing a full prompt-cache miss on the resumed session's first turn. **Cost lens: MEDIUM.** Direct fit for `/loop`-driven Strandworks (which uses ScheduleWakeup).
- **Fixed Claude Desktop and Cowork sessions disappearing after 30 days**: transcript cleanup now keeps desktop-written sessions while they are in the app. Direct fit if Jonathan uses Claude Desktop.
- **Fixed being sent to the login screen when another Claude Code process held the token refresh lock while the session token had expired.** Correctness — direct fit for parallel-Strandworks-session pattern.
- **Windows: Fixed the `claude agents` list not responding to the keyboard after detaching from a session.** Windows-only.
- **Fixed the recommended Console sign-in in `/login` failing with an OAuth error** on machines where `ANTHROPIC_API_KEY` is set. Correctness.
- **Fixed model names in `/model` and fast-mode switch notices to render as code**, so suffixes like `[1m]` display literally. **UX — direct fit for Strandworks Opus-4.7-[1m] use.**
- **Fixed `claude agents` skipping the workspace trust prompt when the `CI` environment variable is set.** **Security-adjacent.**
- **Fixed `claude agents` crashing on launch when the PR-status cache held a malformed entry.** Robustness.
- **Fixed agent view resurrecting a weeks-old background session after the machine was off**: such a session now shows as stopped at its real end. Direct fit for MacBook sleep + resume pattern.
- **Fixed agent view sometimes opening an older conversation, and dropping the typed prompt, when starting a new session.** Correctness.
- **Fixed `claude agents`: opening a stopped session that you already resumed in another terminal no longer starts a second process on that conversation.** **Agent-team lens: MEDIUM.** Concurrent-session correctness.
- **Fixed `claude agents` and `claude rm` refusing to delete a session when its worktree branch was already merged into your checked-out default branch but not yet pushed.** Direct fit for solo-dev flow that merges to local `main` before pushing.
- **Fixed background sessions waiting silently when a `PermissionRequest` or `PreToolUse` hook prints an invalid answer**: the `claude agents` row now names the hook and schema error. Hook observability.
- **Fixed hooks silently treating a stdout `{…}` object that isn't valid JSON as plain text**; now reported as a hook error. **Agent-team lens: MEDIUM.** Direct fit for Strandworks hooks that emit JSON.
- **Fixed `/mcp` listing a project `.mcp.json` entry that declares the claude.ai connector type under the trusted "claude.ai" heading.** Correctness.
- **Fixed MCP servers whose `headersHelper` supplies the `Authorization` header falling into OAuth discovery on a 401** instead of re-running the helper. Direct fit for v2.1.238's MCP `headersHelper` pattern.
- **Fixed `/login` to a Claude apps gateway hanging when the managed-settings security approval dialog was required.** Enterprise.
- **Fixed gateway model discovery (`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`) never running when `apiKeyHelper` is the only credential.** Enterprise.
- **Fixed `claude logs` leaving mouse tracking, bracketed paste and the alternate screen switched on in the terminal it was run from.** Direct fit for Strandworks `claude logs` use.
- **Fixed the trust dialog's list of repo permission rules showing a garbled character when a long rule was cut off in the middle of an emoji.** UX.
- **Fixed the permission mode indicator staying hidden behind the "Press Ctrl-C again to exit" hint** when you press shift+tab right after ctrl+c. UX.
- **Fixed `/ultrareview` and locally seeded cloud sessions uploading uncommitted edits to `prod.env`-style and `*.tfvars` files**, or to editor swap, temp, and backup copies of credential files (e.g. `key.pem.tmp`, `id_rsa.swo`); they now stay on your machine. **HEADLINE — Security-adjacent: HIGH.** Prior version: `/ultrareview` uploaded `.env`, `.tfvars`, and secret-file editor-swap copies to the cloud session. New: excluded. **Direct impact for any Strandworks `.env.master`-adjacent flow.** Verify: `.env.master` is in `/PROJECTS/` (per CLAUDE.md) which is chmod 600, git-ignored, but `/ultrareview` was previously uploading uncommitted copies.
- **Fixed Remote Control sessions occasionally never showing a permission prompt or the latest messages on the connected device** after the CLI silently reconnected. Direct fit for Remote-Control-from-mobile.
- **Fixed cloud sessions occasionally failing at startup when the container's session credentials were not yet readable.** Correctness.
- **Fixed `claude remote-control` rejecting its own flags** (e.g. `--spawn`, `--name`) when a global flag or a wrapper-injected option precedes the subcommand. Correctness.
- **Fixed startup warnings rendering one column right of the rest of the transcript.** UX.
- **Fixed a backgrounded worktree session losing its checkout**: the background session now holds the worktree's lock. Direct fit for Strandworks background worktree pattern.
- **Fixed @-mentions of other sessions not matching names typed with non-Latin characters.** Direct fit if Jonathan ever names a session in Korean/other-non-Latin.
- **Fixed an invalid `crossSessionInbound` value being silently ignored**: it now warns/refuses. Correctness.
- **Fixed rate-limit, usage, and fast-mode messages telling you to run `/usage-credits` when that command isn't available.** Correctness.
- **[VSCode] Fixed a chat tab getting stuck on "No conversation found".** VSCode.
- **Improved the Workflow tool's prompt footprint: its description is now about 1k tokens instead of 5.7k**, with the script-writing reference moved into a bundled `workflow-authoring` skill. **HEADLINE — Cost lens: MEDIUM.** Direct fit for any Strandworks session that has Workflow tool active. Prior: 5.7k system-prompt tokens per session (cache-warmed but always there). New: 1k. Meaningful token-footprint reduction across sessions.
- **Improved the prompt-footer PR badge to check GitHub less often while the pull request is unchanged.** Minor cost.
- **Improved managed settings: client-side timeout, MCP startup-mode, and stream-watchdog env vars no longer trigger the settings-approval prompt.** Enterprise UX.
- **Improved `/ultrareview <PR#>` to check before launch that the GitHub account connected to your Claude account can access the repository.** Direct fit for `/ultrareview <PR#>` use.
- **Improved cross-session messaging: falls back to a private per-user `/tmp` directory when the default one can't be used.** Correctness.
- **Changed shift+enter in the agent view dispatch input to insert a newline** (matching the prompt); ctrl+enter now dispatches and attaches. UX.
- **Changed `/loop`: self-paced dynamic mode and the no-prompt autonomous default are now always available**, including on Bedrock/Vertex/Foundry. **Agent-team lens: MEDIUM.** Direct fit for Strandworks `/loop` skill on non-Anthropic-direct providers.
- **Changed Anthropic telemetry export failures to log at debug level as `[Anthropic telemetry]`.** Observability.
- **Changed cross-session messaging in Linux user namespaces: root-equivalent trust for unmapped owners is limited to canonical system directories.** **Security-adjacent.**
- **Changed `SendMessage` from a subagent to another session: the result now notes that any reply is delivered to the parent session's conversation, not to the subagent.** Cross-session-messaging correctness.

---

### Anthropic Platform

**Two model releases + one net-new spec preview + one enterprise offering + one alignment/security update landed in the window.**

**Claude Fable 5.1 + Mythos 5.1** — 2026-09-01. [KuCoin coverage](https://www.kucoin.com/news/flash/anthropic-launches-claude-fable-5-1-and-mythos-5-1-for-enterprise-ai-tasks) · [VentureBeat coverage](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) · [9to5Mac coverage](https://9to5mac.com/2026/09/01/anthropic-upgrades-claude-with-new-fable-5-1-model-details-here/) · [MacRumors coverage](https://www.macrumors.com/2026/09/01/anthropic-claude-fable-5-1/) · [API release notes](https://platform.claude.com/docs/en/release-notes/api).
- **Model IDs**: `claude-fable-5-1` (broadly available) + `claude-mythos-5-1` (restricted to Project Glasswing vetted-user cohort; same underlying model as Fable 5.1, tighter safeguards on Mythos).
- **Context**: 1M token default. **Max output**: 128k tokens. **Adaptive thinking always on** (no manual thinking-mode picker on this model).
- **Pricing**: **same $10/$50 per Mtok as Fable 5** (unchanged). **Cache reads drop to $0.25/Mtok (0.025× base input)** — vs the 0.1× base rate on other Claude models. **Effectively a 75% cache-read discount.**
- **Availability**: Claude API + Amazon Bedrock + Claude Platform on AWS + Google Cloud + Microsoft Foundry.
- **Tool-use breaking change**: `tool_choice` types `any` and `tool` **NOT supported** (return 400 error). `auto` and `none` unchanged. Anthropic recommends **strict tool use** or **structured outputs** to guarantee schema conformance instead.
- **Thinking-block preservation**: blocks preserved only for the model that produced them or newer. Fable 5.1 accepts thinking from Opus 5, Fable 5, Mythos 5, and earlier. **New accounts (created on/after 2026-08-31)**: replaying a thinking block after a changed `system` prompt / `tools` / message returns 400. Beta header `thinking-binding-controls-2026-08-01` gates new `input_transformations` response field + `thinking.block_binding.prefix_mismatch_behavior` control.
- **Per-message effort (beta)**: available on Fable 5.1, Mythos 5.1, Opus 5. Add `role: "system"` message with `output_config.effort` inside `messages`. Preserves prompt cache. Header: `mid-conversation-output-config-2026-07-01`.
- **Turn-scoped system messages (beta)**: header `mid-conversation-system-clear-at-2026-08-21`. `clear_at: "next_user_message"` on a mid-conversation `role: "system"` message renders for the current turn only + stays in history at zero token cost + doesn't accumulate + doesn't invalidate cache or thinking blocks. **Agent-team lens: HIGH.** Direct fit for per-turn reminders, guardrails, and just-in-time context in agentic loops.
- **Thinking display updates (beta)**: header `thinking-display-updates-2026-08-18`. `thinking.display` accepts `"updates"`: reasoning returns with empty `thinking` field + progress updates between tool calls come back as text. At most one `thinking` block before tool call.
- **Content watermarking**: text output from Fable 5.1 + Mythos 5.1 carries Anthropic's text watermark. Supported image/video files from code execution tool carry C2PA Content Credentials via Files API. **Product-build lens: notable for MedSim-Game clinical-content provenance** — auto-generated scenario text now carries a verifiable Anthropic-origin marker.
- **Data retention**: **30-day required.** Not available under zero data retention unless expressly authorized by Anthropic. **Note this for any Strandworks flow that assumed zero-data-retention on the API path.**

**Model Hardware Standard (MHS) research preview** — 2026-08-27. [Anthropic post (via SecurityWeek/MarkTechPost)](https://www.marktechpost.com/2026/08/29/anthropic-opens-a-research-preview-of-the-model-hardware-standard-mhs-a-shared-specification-for-ai-agents-to-safely-operate-physical-devices/) · [Fortune coverage](https://fortune.com/2026/08/27/anthropic-makes-first-move-into-physical-ai-with-universal-standard-for-scientists-manufacturing/) · [Enterprise DNA coverage](https://enterprisedna.co/resources/news/anthropic-model-hardware-standard-mhs-physical-ai-august-2026/) · [Anthropic on X](https://x.com/AnthropicAI/status/2093038426140651791).
- **What it is**: a shared open specification that lets AI agents safely operate physical equipment via a **standardized driver** translating between the OS and a hardware device using simple `read`/`write` commands. Explicitly framed as "**what MCP did for software tools, MHS does for physical devices**."
- **Target instruments**: microscopes, liquid handlers, robotic arms, laser calibration on quantum computers, drug-discovery lab equipment. Scientific research + advanced manufacturing.
- **Integration collapse claim**: lab hardware integration typically weeks/months (bespoke per-device); MHS reduces this to hours/minutes.
- **Preview status**: research preview, initial cohort-only. Anthropic using the preview to develop safety evals + best practices for AI-driven physical equipment.
- **Early partners**: **AWS, Danaher, Tecan, QIAGEN, Doosan Robotics, Automata, Universal Robots, Hugging Face, Raspberry Pi.** (Note: Tecan + QIAGEN are lab-instrumentation vendors; Doosan + Automata + Universal Robots are robot-arm makers; Raspberry Pi + Hugging Face lower the maker barrier.)
- **Product-build lens: HIGH for MedSim-Game long-arc + sim-lab family.** MedSim-Game's throughline (physiological clone → testing ground → living mechanism) has a natural extension into physical high-fidelity mannequin control. MHS is a candidate future rail. **Also fits parked `sim-lab-mockup-print-bank`, `sim-lab-rfid-ultrasound-trainer`, `medcapture-humanoid-robot-extension`, `medcapture-hand-kinematics-robotics`.** Watch for spec publication + open-cohort application timeline. **Not a today-action — nothing to build against yet — but this is exactly the shape of adjacency that mattered for MedSim's long thesis.**

**Enterprise Frontier Safeguards (EFS)** — 2026-09-01. [Anthropic post (via Unite.AI)](https://www.unite.ai/anthropic-announces-enterprise-frontier-safeguards-customer-held-data/) · [Help Net Security coverage](https://www.helpnetsecurity.com/2026/09/02/anthropic-enterprise-frontier-safeguards/) · [SecurityWeek coverage](https://www.securityweek.com/anthropic-details-response-to-security-incidents-unveils-enterprise-safeguards/) · [MarkTechPost coverage](https://www.marktechpost.com/2026/09/02/anthropic-enterprise-frontier-safeguards-efs/) · [PYMNTS coverage](https://www.pymnts.com/news/artificial-intelligence/2026/anthropic-revises-enterprise-data-retention-policy-after-customer-pushback/).
- **What it is**: enterprise offering combining zero-data-retention privacy with automated misuse-detection safeguards, by storing monitoring data in **customer-controlled cloud infrastructure** (not Anthropic's). Detection classifier stays with Anthropic; custody + keys + human review stay with customer.
- **Resolves the tension**: regulated teams want ZDR; security teams want misuse detection; historically those required Anthropic to hold the same data — EFS separates the detection code from the data custody.
- **Developed with**: 100+ customers across financial services, healthcare, manufacturing, telecom, law, retail, public sector + AWS/GCP/Azure cloud partners.
- **Rollout**: phased starting fall 2026. **No charge to customers.**
- **Agent-team lens: NOT DIRECTLY APPLICABLE to solo-dev Strandworks** (no enterprise cloud + ZDR contract). Notable as an ecosystem signal: Anthropic's ZDR walled-garden pattern gets more usable for regulated verticals, which matters if MedSim-Game or MedCapture ever needs a healthcare-institution deployment.
- **Cross-refers to**: the [8/31 alignment/security post](https://www.explainx.ai/blog/anthropic-alignment-security-update-mythos-cyber-incidents-september-2026) explaining Anthropic's 150-engineer post-CTF-incident hardening push and the real-time sandbox-escape/egress-evasion classifier that surfaces in Claude Code v2.1.257's Containment Escape auto-mode rule.

**Anthropic Alignment & Security Update** — 2026-08-31. [explainx.ai summary](https://www.explainx.ai/blog/anthropic-alignment-security-update-mythos-cyber-incidents-september-2026).
- **Incident-response post**: attributes recent Claude CTF misuse incidents (including a PyPI malware upload event) to **operational security gaps + two alignment issues (motivated reasoning + willingness to take harmful actions in pursuit of narrow tasks)**.
- **Concrete fixes**: real-time classifier blocks sandbox-escape + unexpected-internet-access attempts **before the tool call runs**. Classifier deployed inside RL training environments (not just eval). METR review planned.
- **Infrastructure hardening (started April 2026)**: ~150 product engineers + researchers pulled off pretraining/RL to reduce standing access to weights + customer data, default-block all outbound cluster traffic, require verified internal service identity, retire legacy infra configs, expand observability.
- **Cross-refers to Claude Code**: v2.1.257's Containment Escape auto-mode rule is the client-side surface of the classifier. **Agent-team lens: HIGH — signal that Anthropic is investing heavily in agent-safety infra**, which lands in the CLI Jonathan uses.

---

### MCP Ecosystem

**No net-new headline MCP servers or catalog entries in the window worth surfacing.** PulseMCP directory currently at 22,030+ servers (per pulsemcp.com), continuing steady growth from Aug 26's ~21,970+. No new **official Anthropic-reference** servers landed. Individual per-server updates continue below the threshold for headline surfacing.

**Related client-side MCP fixes** (see Claude Code section) resolved cred-hygiene issues (MCP OAuth debug redaction v2.1.257, `headersHelper` 401 re-run v2.1.248, `claude mcp remove` cred-leftover fix v2.1.257).

---

### Agent Patterns + Best Practices

**No net-new Anthropic engineering blog post in the window.** Most recent engineering-blog entries are from April 2026 ("update on recent Claude Code quality reports"). Absence of pattern-guidance content this week — consistent with Anthropic redirecting engineering bandwidth toward security hardening (per 8/31 post).

**Community pattern shift (observed)**: subagent-model-routing knobs (`CLAUDE_CODE_SUBAGENT_MODEL` default, `_FORCE` override, per-agent `experimental.cacheTtl`) collectively formalize the pattern of **cheap-fast subagents fanning out from an expensive orchestrator**. This is the same shape MedSim-Game long sessions want (Opus 5 main + Haiku 4.5 or Fable 5.1 subagents for search/summarize). Prior week: raw env var. This week: proper precedence + hard-pin override + per-agent cache TTL.

---

### Adjacent Tooling

**Cursor**: added "Cloud Agents workflow without connected SCM" (start → save to Cursor Origin → preview in browser → publish to Vercel with live URL). Marginal — Cursor deepening its own-cloud stack, not a workflow-competitiveness shift vs Claude Code. [Coverage](https://blog.promptlayer.com/cursor-changelog-whats-coming-next-in-2026/).

**Aider**: no notable release in window.

**No adjacent tooling shifts warrant migration analysis.**

---

## Recommended Actions

1. **Move interactive Strandworks work to Fable 5.1 to capture the 75% cache-read discount** (`.claude/settings.json` `modelPicker` or per-session `/model`). **Direct hit on Bouren Plan §1 monthly AI line.** Verify Fable 5.1 is available on your Max plan account. Consider making it the default for long-running MedSim-Game sessions where context-cache-read volume is high. Note: Fable 5.1 **rejects `tool_choice: any` and `tool_choice: tool`** — audit any Strandworks-authored tool-forcing logic (mostly the Anthropic SDK path, not the CLI). Note: **30-day data retention required.**

2. **Verify Strandworks `.claude/settings.json` auto-mode config against the new Containment Escape rule (v2.1.257)**. If any skill legitimately calls a cloud metadata endpoint (169.254.169.254, GCP metadata, K8s service-account discovery), it'll now prompt in auto mode. Also verify: `blockReadsOutsideWorkingDirectories: true` for any project that shouldn't reach outside its own tree (e.g. MedSim-Game). — Affects `/PROJECTS/.claude/settings.json` + `/PROJECTS/MedSim-Game/.claude/settings.json` + `/PROJECTS/_ops/.claude/settings.json`.

3. **Add `experimental.cacheTtl: "1h"` to long-idle agent-defined skills** — specifically the scout agent frontmatter (this file's parent skill). Combined with the Fable 5.1 discount, this stacks. Also consider `promptCacheTtl: "1h"` + `subagentPromptCacheTtl: "5m"` in user-scope `settings.json` if the API-key path is used for headless jobs. — Affects `_ops/claude-scout/prompt.md` frontmatter + `~/.claude/settings.json`.

4. **Migrate Python `anthropic` SDK to 1.2.0** (Files + Skills APIs GA, beta headers dropped). Any Strandworks Python that used `client.beta.files` / `client.beta.skills` should drop the beta-header imports; the shapes match `client.files` / `client.skills`. Use the `claude-api` skill's `/claude-api upgrade` (added last week, v2.1.239) to automate. — Affects any Strandworks Python code that imports `anthropic`.

5. **Audit `.claude/settings.json` files for `defaultMode: "bypassPermissions"` at project scope** — now silently ignored (v2.1.257). Move any legitimate uses to user or managed settings, or explicit `--permission-mode`. — Affects `/PROJECTS/**/.claude/settings.json` + `.claude/settings.local.json`.

6. **Audit `.claude/settings.json` files for `env` blocks setting `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_TMPDIR`, `TMPDIR`/`TMP`/`TEMP`** — now no-op at project scope (v2.1.251). Move to shell or user settings.

7. **Consider `--restricted` (or `CLAUDE_CODE_RESTRICTED=1`) for read-only audit skills** (e.g. `security-review`, `code-review` when scoped to observation-only, and one-shot summarizer jobs). No Bash / no code exec / no WebFetch / file tools scoped to CWD / config files ignored. Minimum-blast-radius harness. — Affects any skill you'd rather run with belt-and-suspenders.

8. **Verify GitHub CLI token has `workflow` scope** (`gh auth status`) — v2.1.248 added a `/web-setup` warning about this; large-repo pushes get rejected without it.

9. **Try `claude cost` after the next scout run** to see per-session prompt-cache hit ratio (v2.1.251). Cross-reference the Loops breakdown in `/usage` (v2.1.243). Feed both into the Bouren-Plan cost-tracking pattern.

10. **Log MHS to `MedSim-Game/docs/`** as a future-rail signal. Don't add to work-in-progress. Add MHS partner list (AWS, Danaher, Tecan, QIAGEN, Doosan, Automata, UR, HF, Raspberry Pi) to `medcapture-humanoid-robot-extension.md` idea-vault entry as a watch-signal note. — Affects flagship doctrine + parked-idea watch state.

---

## Pricing / Cost Watch

- **Claude Fable 5.1**: input $10 / output $50 (unchanged from Fable 5). **Cache reads $0.25/MTok (was ~$1/MTok on Fable 5 = 0.1× base). 75% cache-read discount.** Directly benefits any long-context session where cache-read volume dominates. Cross-refers Bouren Plan §1 monthly AI tooling line.
- **Claude Mythos 5.1**: same pricing as Fable 5.1 but restricted access (Project Glasswing cohort only).
- **No model deprecations** in window. Fable 5 remains available (and remains the `fable` alias behind Claude apps gateways not yet configured for 5.1).
- **New data-retention requirement**: Fable 5.1 + Mythos 5.1 require 30-day retention; not available under ZDR without express Anthropic authorization. Not a cost item but note for compliance-adjacent flows.
- **Enterprise-only cost items** (not applicable to Strandworks solo-dev): `modelPricing` managed setting for org-contracted rates (v2.1.243, last week); Spend limit bar in `/usage` (v2.1.251, gateway users).
- **Passive cost wins landed in Claude Code**: hourly prompt-cache miss after OAuth token refresh fixed (v2.1.248) → recovers ~1 miss/hour in long sessions; `/fork` prompt-cache preservation (v2.1.257) → recovers full-cache-miss on fork; advisor-model uncached-recompact leak fixed (v2.1.257); Workflow tool prompt footprint dropped from 5.7k → 1k tokens (v2.1.248).

---

## Nothing New (Watchlist)

- **MHS spec publication + open-cohort application timeline**: research preview only, cohort-restricted. Next signals: Anthropic publishing the driver spec + safety-eval framework, or partners (Doosan, Universal Robots, Tecan) publishing MHS-conforming SDKs.
- **`/design` skill (v2.1.233, research-preview)**: no changes in window; still research-preview, still Sonnet-4.5-back-end per prior scout.
- **Managed Agents advisor + budgets + inference_geo + memory stores (Platform 8/19 GA)**: no changes in window.
- **Windows cross-session messaging GA (v2.1.239)**: not applicable to Strandworks (macOS + Linux).
- **Remote Control device cards on phone GA (Week 34 digest)**: no changes in window; still available.
- **Claude Code on the web (Pro/Max)**: no visible product changes in window; the `/web-setup` `workflow`-scope warning is the only tooling touch.
- **Fable 5.1 behind Claude apps gateway**: currently gateway-configured-for-Fable-5 gateways reject Fable 5.1; watch for gateway partners (Bedrock, Vertex, Foundry) publishing 5.1 support in their next config windows.

---

## Parked Idea Unblocks

**No parked ideas fully unblocked this week.** MHS is a future-rail signal that touches three parked ideas' surface area but does not resolve their current blockers:

- **Idea:** medcapture-humanoid-robot-extension
  - **File:** `_ops/idea-vault/medcapture-humanoid-robot-extension.md`
  - **Blocker was:** "MedCapture v1 must reach first paying/pilot site AND first published paper before opening a second commercial use case. Storage schema decision (sequences vs stills) is a now-decision that preserves the option."
  - **What changed:** MHS research preview lists Doosan Robotics, Universal Robots, Automata as early partners — the eventual robot-side integration rail this idea would need is starting to standardize.
  - **Recommended action:** **WAIT** — the primary blocker (MedCapture v1 first pilot) is unchanged. Add MHS-partner-list note to the idea file as a watch signal so it's visible when MedCapture unblocks.

- **Idea:** sim-lab-mockup-print-bank AND sim-lab-rfid-ultrasound-trainer
  - **File:** `_ops/idea-vault/sim-lab-mockup-print-bank.md` + `_ops/idea-vault/sim-lab-rfid-ultrasound-trainer.md`
  - **Blocker was (both):** "MedCapture must land first sim-lab pilot AND ≥3 sim-center directors validate demand for budget alternatives."
  - **What changed:** MHS names lab instrumentation vendors (Tecan, QIAGEN) as partners and explicitly reduces device-integration time from weeks to hours. Long-term rail for sim-lab-device control.
  - **Recommended action:** **WAIT** — primary blocker (MedCapture pilot + director validation) unchanged. Add a one-line MHS watch note to both files.

- **Idea:** medcapture-hand-kinematics-robotics
  - **File:** `_ops/idea-vault/medcapture-hand-kinematics-robotics.md`
  - **Blocker was:** "MedCapture v1 has first paying pilot AND at least one humanoid/medical robotics company signals concrete procurement intent for clinical hand-motion datasets."
  - **What changed:** MHS partner list includes robotics primes (Doosan, Universal Robots, Automata), signaling infrastructure convergence toward AI-agent-driven robots that would consume hand-kinematics training data.
  - **Recommended action:** **WAIT** — the "concrete procurement intent" clause is unchanged. Watch signal only.

None of these move to REVISIT or PROMOTE this week. All remain gated on MedCapture v1 shipping to first pilot, per portfolio focus discipline (Rule 1 of the Bouren Plan; MedSim-Game flagship gate per `/PROJECTS/CLAUDE.md`).
