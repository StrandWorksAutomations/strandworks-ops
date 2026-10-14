---
name: Claude-Capability Scout - 2026-10-14
description: 7-day window (10/8–10/14). **Headline #1 (agent-team + cost + correctness lens): v2.1.299 (10/14) adds idle compaction** — a 200K+ token terminal conversation left idle for ~54 minutes is automatically compacted before its one-hour prompt-cache TTL expires, so the next message doesn't reprocess the full context (`CLAUDE_CODE_IDLE_COMPACT_MIN_TOKENS` tunes it; `"idleCompaction": false` turns it off; both need v2.1.290+). Direct fit for every long-lived Strandworks session that goes idle — the daemon-side scouts, the Shadow worker, foreground sessions left mid-task. Pairs with the v2.1.299 `CLAUDE_CODE_DISABLE_FILE_MENTIONS` flag that forces Claude to *read* `@` file mentions through its file tools instead of inlining their contents — direct fit for Strandworks sessions that drop a large repo CLAUDE.md fleet into context. **Headline #2 (security-adjacent + correctness lens, v2.1.299, 10/14): MCP allow-rule prefix bug fix + hooks that can't start now block the action instead of letting it through.** `mcp__a` no longer allows a server named `a__b` or `a_` (prior: prefix-matching bypass); write `mcp__<server>__*` with the whole normalized server name. Agent `tools:` lists tighten the same way. Companion in v2.1.295 (10/8): new `onFailure: "block"` option for command and HTTP hooks — a hook that can't start, times out, or exits with an unexpected code now blocks the action instead of failing open. Direct fit for Strandworks pre-tool-use hooks + MCP allow-list hygiene across Supabase/Linear/Notion/Gmail/Telegram/Chrome/Blender configs; verify none of them use loose `mcp__<prefix>` matchers. **Headline #3 (platform + cost lens, Developer Platform 10/7): Sonnet 5.5 cache reads cut from $0.20 → $0.10/Mtok** (0.05× base input instead of 0.1×). Cache writes and all other prices unchanged. Direct fit for every Strandworks workflow that uses Sonnet 5.5 with heavy prompt caching — scouts, Code Review, long-running subagents. **Headline #4 (agent-team + cost lens, Developer Platform 10/7): Claude Haiku 5.5 shipped as the default Haiku on the API** (claude-haiku-5-5) — 1M context, 128k max output, adaptive thinking with `effort` parameter, $0.10/$0.50 per Mtok ($0.50/$2.50 for prompts over 100K). Available on API + Bedrock + Vertex + Foundry. v2.1.293 (10/7) also added `claude-haiku-5-5` to Claude Code. Direct fit for Strandworks: the `/code-review`, `verify`, `security-review`, `fewer-permission-prompts` skills all list Haiku as a candidate; the Agent SDK call sites in scouts and the Telegram daemon can downshift to Haiku 5.5 for cheap-and-fast classification. **Headline #5 (security-adjacent lens, v2.1.299, 10/14): claude.ai connector proxy, Anthropic-hosted MCP servers, cloud and self-hosted runner MCP proxy no longer follow HTTP redirects.** Prior: a connector or Anthropic MCP server could redirect a request to a third-party host. Fixed. Also `/ultrareview` error text no longer suggests `git add .` (which could stage `.env`). Direct fit for Strandworks `.env.master` hygiene. **Headline #6 (platform + policy lens, 10/8): 2026 Usage Policy update** — effective 2026-11-12. Consolidates deception rules; expands weapons prohibitions to cover software components; adds autonomous-physical-action requirements (qualified operators + safe-state failsafes); adds surveillance tracking prohibitions (real-time or historical); allows personalized political targeting if non-deceptive + privacy-respecting; adds narrow prohibition on sustained abusive behavior toward Claude. **Direct fit for Strandworks: LOW** — portfolio is medical sim + EMS billing + badging, none of which touches the new restriction classes. Flag if MedSim-Game ever adds real-world patient tracking or if 3rdrider adds surveillance capability. **Headline #7 (security-research + Strandworks-irrelevant lens, 10/8): Anthropic Cyber Mission** — new umbrella containing CIDP (Critical Infrastructure Defense Program with 11 OT-partner firms) + a free, opt-in OSS Scanner (opened 10/12) that scans enrolled open-source projects for vulnerabilities with ~90% accuracy, publishes PoC + fixes. Individual options: free Claude Max for OSS maintainers (program predates window — opened 2026-02-26, applications closed 2026-06-30); solo researchers can enroll projects in OSS Scanner or apply to Cyber Verification Program. **Direct fit for Strandworks** = check whether any Strandworks-owned OSS repo (`m15-monitor-defib`, `pocus-ultrasound`, physiology engine submodule) qualifies for OSS Scanner enrollment — zero-cost supply-chain scan with no deploy work. **Headline #8 (safety-research lens, Anthropic blog 10/12): preserved-thinking defenses in Claude Fable 5.1 + Opus 5.5 cut distillation extraction by 90–99%.** Preserved thinking blocks API accounts created on/after 2026-08-31 from editing Claude's prior context, and a two-stage classifier detects extraction attempts. Not a feature Strandworks consumes; informational — a late-created API account may hit stricter output-context rules on Fable 5.1 / Opus 5.5 when attempting to feed Claude's own prior reasoning back in. **Headline #9 (engineering-blog lens, 10/13): Scion** — Anthropic's in-house Git replacement for its 30K-merges/day monorepo, written in 5 months by 7 engineers. 200× smaller infra, checkouts in seconds, 99%+ cache hit. **Not for public use** — Anthropic says Scion makes sense only for very large monorepos with tens of thousands of engineers or swarms of agents; git remains right for ordinary projects. Guidance-only for Strandworks: the "assume clients are always online, server computes history/blame/commits/merges, clients fetch only files they need" shape is worth knowing if MedSim-Game asset pipelines ever outgrow git-LFS. Breaks the eight-week engineering-blog drought. **Headline #10 (agent-team lens, v2.1.296 10/9): per-subagent `autoCompactWindow`** — a subagent can now auto-compact earlier than the main conversation's window. Also `CLAUDE_CODE_WORKFLOW_SUBAGENT_MODEL` lets every workflow agent run on one model while other subagents keep theirs. Direct fit for Strandworks subagent configs in `~/.claude/agents/*`. **Headline #11 (observability lens, v2.1.295 10/8): Program Status Protocol (OSC 7501).** Terminals that implement it can show whether Claude Code is working, waiting on you, or done. Status widget was permanently removed on 2026-07-21 per user request ([terminal-status-widget](../../memory/terminal-status-widget.md)) — do NOT suggest rebuilding it; this is informational only. **Headline #12 (Strandworks-irrelevant lens, 10/14): Anthropic opens Singapore office + MOU** — no new products, APIs or SDK capabilities. In-region Bedrock inference for data residency (already available). **Also this window**: v2.1.299 added `/effort` + `/fast` in agents view (new sessions default); v2.1.299 added `--disallow-tools` + `disallowed_tools` to `claude plugin eval` (keep Agent / other built-ins out of eval runs); v2.1.299 changed `UserPromptSubmit` hooks to run *before* skill/custom-slash-command expansion (prior: embedded shell commands could run even if the hook later blocked); v2.1.299 fixed scheduled wakeups (ScheduleWakeup) not firing while a background task was running in Agent SDK/IDE/claude remote-control sessions — direct fit for Strandworks; v2.1.299 fixed background sessions started with `--safe-mode` silently leaving safe mode on wake/restart; v2.1.299 fixed scheduled tasks + loops firing again after every turn, or firing early, during the repeated DST-end hour (local to Mac timezone — direct fit for Strandworks `/loop` scouts around 2026-11-01 DST end); v2.1.299 fixed loud memory leak under `--debug`/`--debug-file`; v2.1.299 switched cloud session + Remote Control MCP connectors to MCP protocol 2026-07-28 by default; v2.1.299 fixed MCP OAuth sign-in / token refresh / sign-out ignoring `headers`/`headersHelper` (broke servers behind authenticating proxies); v2.1.296 (10/9) added `allow_large` option to Read tool so Claude can read a text file past the usual size limits in one call when it needs the whole file + context has room; v2.1.296 raised default MCP tool description + server instruction limit from 2,048 → 4,096 characters; v2.1.295 (10/8) added `$.ui.notify` mod primitive for native notifications; v2.1.295 improved sandboxed Bash on Linux so Esc + Ctrl-C work while wildcard read rules are being expanded; v2.1.295 added `onFailure: "block"` for hooks (see headline #2); v2.1.293 (10/7) added `isDeferred` to `$.tool.register` for mods so a tool's schema is in the prompt from the start instead of behind tool search. **Anthropic engineering blog: broke eight-week drought with "Redesigning source control at Anthropic" (Scion, 10/13).** **MCP spec: no new revision in-window** (still 2026-07-28). **No new MCP servers in official or community catalogs beyond what Anthropic's plugin-submission portal already lists.** **No parked ideas unblocked this week** (all 26 vault entries are gated on market/hardware/money/time or MedCapture pilot milestones, none of which this week's shipped capabilities move).
metadata:
  type: report
project: _ops
status: report
---

# Claude-Capability Scout - 2026-10-14

Weekly window: 2026-10-08 → 2026-10-14 (7 days; prior scout ran Wednesday 2026-10-07 and covered through v2.1.292). Five Claude Code releases in-window plus v2.1.293 (10/7, released after last scout and so still in-scope): v2.1.293 → v2.1.299. Four Anthropic news posts in-window (Singapore 10/14, Usage Policy update 10/8, Genesis Mission commitment 10/8, Cyber Mission 10/8); one Anthropic engineering blog post (Scion, 10/13 — ends the eight-week drought); one Anthropic research post (preserved-thinking distillation defenses, 10/12); one Developer Platform model launch (Haiku 5.5) + one price cut (Sonnet 5.5 cache reads halved) — both dated 10/7 on the API changelog but shipped to Claude Code on 10/7 and consumed in-window. No MCP spec update; no new major MCP servers in the official catalog. Flagship remains **MedSim-Game** per `/PROJECTS/CLAUDE.md`.

## Releases This Week

### Claude Code

**Six versions shipped in-window** (v2.1.293 through v2.1.299, counting v2.1.293 on 10/7 which post-dated last week's scout). Structural headlines: **idle compaction** (v2.1.299); **MCP allow-rule prefix tightening** (v2.1.299); **`onFailure: "block"` for hooks** (v2.1.295); **per-subagent `autoCompactWindow`** (v2.1.296); **`CLAUDE_CODE_DISABLE_FILE_MENTIONS`** (v2.1.299); **Claude Haiku 5.5 available in `/model`** (v2.1.293); plus a dense cycle of mod-platform additions, 361+ bug fixes across the week.

**v2.1.293 (2026-10-07, post-last-scout)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `claude-haiku-5-5`.** Direct fit for Strandworks — now callable from `/model` and the Agent SDK. See Developer Platform notes below for pricing + context details.
- Added `agentType` to the `subagentStatusLine` payload, so scripts can tell custom subagent types apart. Observability.
- Added `isDeferred` to `$.tool.register` for mods: `false` lists the tool's schema in the prompt from the start instead of behind tool search. **Mod-platform lens.**
- Reverted the auto-mode denial message change from 2.1.281 that told Claude a denial covers the outcome, not only the exact command. (Prior change had been causing over-broad model behavior.)
- Reverted the 2.1.290 fix for cloud sessions staying asleep after a container restart lost a pending `/loop` wakeup; Claude is no longer told, and the session stays asleep. **Correctness: regression on `/loop` recovery in cloud sessions** — direct fit if any Strandworks `/loop` runs in cloud sessions (currently they run on the DO droplet, so limited impact).
- Changed claude.ai skill syncing to check for changes every ~40 minutes instead of every 10 while no session is in use. Lower sync traffic.
- Changed OpenTelemetry `claude_code.at_mention` logging to emit at most 100 agent + 100 MCP-resource events per prompt. Observability tuning.
- Self-hosted runner: Changed orchestrator to sleep 4–6s between polls instead of a constant 5, so replicas stop polling at the same moment.
- Improved startup for Team/Enterprise orgs: policy + managed settings fetched earlier, stalled requests retried after 3s.
- Improved Claude in Chrome: fewer page actions refused when the browser is slow to report its tabs.
- Improved artifacts: Claude pins libraries to exact versions two weeks old or older. **Correctness: HIGH** — reduces risk of a fresh-but-unstable dep being pulled into artifact code.
- **Fixed Claude sometimes treating its own last actions before a context compaction as done after it, and retracting or redoing finished work.** **Correctness: HIGH.** Direct fit for Strandworks `/compact` discipline — this was a silent cause of lost work after compaction.
- Fixed a memory leak where an HTTP MCP connection kept every request it had sent until it closed.
- Fixed a message sent while Claude was working being lost when `←` moved the session to the background.
- Fixed `/model` effort ←/→ wrapping past the highest/lowest level, which could accidentally save Low as a model's default effort.
- Fixed Claude being told to continue or message subagents with `SendMessage` in sessions where a host, permission rule or `--tools` list removed that tool.
- Fixed a custom agent named `worker` being shown as "Agent" when it starts.
- Fixed Remote Control uploading a session's starting history again after every credential recovery. **Cost lens: MEDIUM.**
- Fixed path-scoped rules and nested CLAUDE.md files not loading when Claude views a file with a single-file `cat`, `head`, `tail`, `sed -n` or `grep` command in the Bash tool instead of the Read tool. **Direct fit for Strandworks per-project `CLAUDE.md` fleet.** Prior: using Bash to peek at a file in a nested project would NOT trigger that project's CLAUDE.md load.
- Fixed `claude purge` stopping silently (exit 0, or a hang in a terminal) when a file or folder could not be deleted; it now deletes the rest, lists what it could not delete, and exits 1.
- Fixed keybindings.json checks: a lone " " (space key) is no longer reported as an error.
- Fixed vim-mode cursor bugs (`>>`, `<<`, `V` + `d`, `.`).
- Windows: Fixed stopping a status line/hook/shell command sometimes terminating an unrelated process that had been given the same process ID.
- [Claude Tag] Several Slack fixes.

**v2.1.294 (2026-10-08)** — [changelog](https://code.claude.com/docs/en/changelog)
- Fixed `prompt` and `agent` hooks written as instructions (such as "Block commands that…") allowing what they should block. **Correctness: HIGH.** Direct fit for any Strandworks instruction-style hook.
- Improved how `prompt` hooks on Stop and SubagentStop written as instructions (such as "Carry on if the build is broken") are judged, so Claude is less likely to stop early.

**v2.1.295 (2026-10-08)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `onFailure: "block"` for command and HTTP hooks: a hook that can't start, times out, or exits with an unexpected code blocks the action instead of letting it through.** **HEADLINE — Security-adjacent: HIGH.** See headline #2. Direct fit for Strandworks pre-tool-use hooks that today fail open silently.
- Added Program Status Protocol (OSC 7501) support: terminals that implement it can show whether Claude Code is working, waiting on you, or done. **Observability: LOW** (status widget is permanently removed per user — do NOT rebuild).
- Added quoted text to the `/copy` picker, so a drafted message copies without its `>` markers.
- Added a warning to `claude plugin install`, `enable`, `disable` and `marketplace add` when the settings file they write to does not load.
- Added a stderr line on terminals that says what a `claude -p` run is waiting for when it stays open after its last turn. **Direct fit for Strandworks `claude -p` daemon jobs** — stops the "why is this still open?" mystery.
- Added `timeouts.upstream_ttfb_ms` on Claude apps gateway's Bedrock/Vertex/Foundry upstreams.
- Added a "Backgrounding cancelled" message when you stop the turn while `←` is waiting for the current tool to finish.
- Added an optional `models` list to every Claude apps gateway upstream.
- Added support for `forceLoginMethod: "gateway"` and `forceLoginGatewayUrl` in user settings on machines with no managed settings.
- Added advice to `claude plugin validate` when a plugin's README has no install line.
- Added `upstream_request_id` to Claude apps gateway's `inference` audit event.
- **Added `$.ui.notify` for mods: raises a native notification through your own notification setting and names which channel sent it.** Mod-platform lens.
- Added children to a mod's `Button`: strings + `Text`.
- Added `CLAUDE_CODE_RETRY_WATCHDOG_MAX_WAIT_MS` to limit how long unattended retry mode waits out 429 and 529 errors. **Cost lens.**
- Added a `request-id` header to Claude apps gateway's successful inference responses.
- [VSCode] Added a chat row for files Claude sends you.
- [Claude Tag] Added confirmation in Claude Tag admin settings before adding a channel manager moves that member to Custom roles.
- Changed MCP tool descriptions the model loads through tool search to be cut at 16,384 characters instead of 2,048.
- **Changed subagents to preload at most 32 skills from the `skills` field, each once; a subagent with the Skill tool can still invoke the rest.** **Correctness + cost lens.** Direct fit for Strandworks subagents listing many skills — the first 32 are preloaded.
- Changed Ctrl+C at the idle prompt of an attached background session to leave a pending `/loop` wakeup alone, so pressing it twice detaches and the loop keeps running; press Esc to stop it. **Direct fit for Strandworks `/loop` scouts.**
- Changed claude.ai connectors to negotiate MCP protocol version 2026-07-28 by default on installs that fetch no flags.
- Changed Artifact pages with no background of their own to show on white instead of off-white.
- Changed scheduled and Run-now routine runs in installs with telemetry disabled to publish new private artifacts, and update your own, without asking.
- [Claude Tag] Changed settings confirmation cards Claude posts in a Slack channel to stay open for 30 minutes instead of 10.
- Improved fullscreen mode: the link under the mouse pointer is now underlined to show it can be opened.
- Improved transcript toggle (ctrl+o) responsiveness in code-heavy conversations by caching syntax-highlighted code blocks.
- Improved Claude Desktop's Code tab behind a Claude apps gateway.
- Improved errors for a refused cloud session.
- Improved `--debug` output to name unrecognized frontmatter fields in custom agent files, with a hint for likely typos. Direct fit for Strandworks custom agents.
- Improved auto mode: a tool call that wasn't run because auto mode's check had no usable answer now shows as a dim "Not run" row.
- **Improved `--debug` output for hooks: command hooks on tool calls, prompts, SessionStart and Stop now log their command, plugin, outcome and duration when they finish, so a slow hook is identifiable.** **Observability: MEDIUM.**
- Improved `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC`: large transcript file is no longer rewritten when that would free <10% of it.
- [Code Review] Improved Code Review admin settings to say why a setting couldn't be saved.
- **Fixed every request failing on a `[1m]` model when a gateway, Bedrock, Vertex or Foundry refuses the context-1m beta; Claude Code now resends without it.** **Correctness: HIGH.** Direct fit for Strandworks Opus 4.7[1m] / Fable[1m] sessions.
- Fixed `claude -p` text output dropping earlier responses when background work started another turn.
- Fixed remote MCP servers in headless/SDK sessions staying disconnected after an outage longer than 15s. **Correctness: HIGH** — direct fit for Strandworks headless MCP (Supabase, Linear) in background workers.
- Fixed MCP servers that repeat a pagination cursor being asked for the same page up to 20 times at every connect. **Cost lens.**
- Fixed CSS/JavaScript/XML files returned by MCP tools being saved as `.bin`, which Read refuses.
- Fixed Bash tool calls failing when the model passes `command_description` instead of `description`.
- Fixed Claude in Chrome not applying a site deny rule written with port 80.
- Fixed `/plugin`'s Errors tab removing a marketplace that failed to load, and uninstalling its plugins, on Enter without asking first.
- Fixed `claude plugin marketplace add` reporting success for a marketplace whose name no plugin can be installed under.
- Fixed `CLAUDE_AUTO_BACKGROUND_TASKS` moving a subagent to the background while an edit or shell command waited behind it.
- Fixed PushNotification saying a push was not sent in `claude remote-control` sessions right after a phone message. Direct fit if Strandworks uses push notifications.
- Fixed files sent from remote sessions being refused as "could not be vouched for" when more than 256 were sent at once.
- Fixed subagents in their own linked worktree being shown the parent session's git branch, status and recent commits. **Correctness: MEDIUM.** Direct fit for Strandworks `isolation: "worktree"` pattern.
- Fixed Claude stopping at end of current tool when text typed in the prompt cancelled backgrounding with `←`.
- Fixed `--tools` and `--restricted` not applying to built-in tools that register after launch.
- Fixed an interrupt not ending the turn until a timeout while Claude waited for an MCP server's resource list.
- Fixed a mod's hook being handed a deeply nested tool input cut short with no error, so a guard could pass content it never saw. **Security-adjacent: HIGH.** Mod/guard isolation.
- Fixed Esc not stopping a self-paced `/loop` that was moved to the background with `←`.
- Fixed commands and hooks in background sessions inheriting `FORCE_COLOR=3`, which put color escape codes into the output Claude reads. Direct fit for Strandworks background scouts.
- Fixed `claude agents` starting a new background service as it exited.
- Fixed Bash permission checks for for-loops over glob patterns.
- Fixed forked skills invoked from Workflow subagents delivering their results to the main conversation instead of the invoking agent.
- Fixed in-process agent teammates failing their first SendMessage call until they loaded the tool through tool search.
- Fixed Claude being told on resume that an unfinished background workflow may have been stopped by `TaskStop`, which can never be the cause.
- Fixed Claude not being told when you stop a long-running MCP tool call from the tasks panel.
- Fixed a background session's `/loop` stopping without notice when its next wakeup came due while the session's process was down. Direct fit for Strandworks `/loop`.
- Fixed raw terminal hyperlink bytes in a reply or a teammate's message being drawn as a clickable link with a hidden address.
- Fixed plugin marketplaces whose repository has large git submodules failing to add or refresh.
- Fixed the `/advisor` dialog showing a checkmark on a saved advisor model that is no longer available.
- Fixed vim-mode cursor + paste bugs (several).
- Fixed terminal freezing with ctrl+c ignored when a response ran to tens of thousands of lines.
- Fixed plugins whose hooks module nests code thousands of levels deep failing to load with a bare stack-overflow message.
- Fixed `claude plugin test` passing a `session.append` hook that removes tool/thinking blocks that a real session keeps.
- Fixed Claude not being told it can resume background subagents with SendMessage after a session was killed and resumed a second time.
- Fixed a file being treated as already read after a Bash command such as `cat` ran without printing it.
- Fixed plugin options named `constructor` or `prototype` always reading as their default. **Security-adjacent: MEDIUM.** Prototype-pollution-shape.
- Fixed a mod's hot reload missing a save made while `/reload-plugins` or session start was reading the mod's files.
- Fixed mod hot-reloading question being asked again every turn for the whole session when it is approved without picking an answer.
- Fixed `/model`, `/fast` and `/output-style` saving their setting without asking a plugin's `config.set` hook.
- Fixed replies whose quotes nest deeper every few lines freezing the terminal for seconds and using gigabytes of memory.
- Fixed `claude mcp serve` background Bash results not naming the output file.
- Fixed an async SessionStart hook's unchanged context being added to the conversation again on every resume. Direct fit for Strandworks SessionStart hooks.
- Fixed variables a SessionStart hook writes to `CLAUDE_ENV_FILE` not reaching the Bash tool after an in-app `/resume` or `/branch`.
- Fixed a skill's `allowed-tools` and `effort` being dropped when the Skill tool finished before the response stream ended.
- Fixed a tampered cache of server-managed settings making a person's own plugin count as organization-managed. **Security-adjacent: MEDIUM.**
- Fixed Claude 3 Opus and Claude 3.x Sonnet sessions being offered tool search, which those models reject.
- Fixed generated type files being written into a `--plugin-dir` plugin's folder in `-p` and SDK sessions.
- Fixed text with tabs or bidirectional control characters losing its end at the edge of the screen.
- Fixed `/model` saying a Max effort pick was saved as your default (Max applies to current session only).
- Fixed an async hook's JSON output being ignored when it is printed over several lines.
- Fixed the Read tool rejecting calls with an empty `pages` parameter instead of treating it as omitted.
- Fixed project-scope plugins not loading in VS Code on Windows due to drive-letter casing.
- Fixed mod hot-reloading turning off for the whole session when an SDK host closed its enable question before anyone answered.
- Fixed a prompt that a mod's `prompt.submit` hook rewrote or dropped still being saved as typed to prompt history and transcript queued-prompt records. **Security-adjacent: MEDIUM.**
- Fixed non-interactive sessions telling you about MCP servers that need authentication when your request doesn't use them.
- Fixed the `claude_code.auth` OpenTelemetry login event not being emitted on Claude apps gateway sign-in.
- Fixed a plugin that adds very large interfaces getting another plugin unloaded when the plugin hooks worker stalls.
- Fixed Edit treating a file as fully read when its contents changed without its modification time advancing. **Correctness: HIGH.**
- Fixed short command output with Windows line endings (CRLF) being drawn on a single line.
- Fixed a stopped scheduled task coming back on resume after a rewind.
- Fixed the terminal freezing for seconds/minutes while syntax highlighting code with very long lines/blank lines/unclosed strings.
- Fixed temporary files left under `~/.claude/seed-admin` by an interrupted `/ultrareview` upload never being removed by retention cleanup.
- Fixed Desktop and SDK sessions refusing to switch back to auto mode until restart after `disableAutoMode` was removed.
- Fixed claude.ai-synced plugin hooks failing with "Plugin directory does not exist" in long-running sessions.
- Fixed the prompt sent after a `/rewind` being lost, and the removed turns coming back, when the session was moved to the background or resumed after being killed.
- Fixed cloud sessions hanging when a mod's `session.receive` hook asked for permission before passing a message on.
- Fixed macOS background sessions that restart together after an update sometimes running outside the stable app wrapper.
- Fixed an MCP sign-in or reconnect that finishes late in headless/SDK sessions relisting a server set with `setMcpServers()` as your own.
- Fixed changing the auto-update channel in `/config` saving before a plugin's `config.set` hook was asked.
- **macOS: Fixed a file count at session start that could reach other apps' data and raise the "access data from other apps" prompt when a session starts in the home folder or above it.** **Security-adjacent: HIGH.** Direct fit for Strandworks sessions launched from `~` or `~/Documents`.
- [VSCode] Several fixes.
- Self-hosted runner: Fixed git fetches being cut off while the git server was still reporting progress on a large repository (`CLAUDE_RUNNER_FETCH_SERVER_PROGRESS_CAP_MS`).
- [Cloud sessions] Several fixes.
- [Claude Tag] Several Slack fixes.
- [Code Review] Several fixes.
- Fixed web searches and `agent` hook evaluations taking much longer at `xhigh` and `max` effort. **Cost lens.**

**v2.1.296 (2026-10-09)** — [changelog](https://code.claude.com/docs/en/changelog)
- Added a `code` key to Claude apps gateway's `managed.policies[]`: same settings as `cli`, also applied in Claude Desktop's Code tab.
- **Added `autoCompactWindow` to subagent frontmatter and `--agents` definitions, so a subagent can auto-compact earlier than the main conversation's window.** **HEADLINE — Agent-team lens: HIGH.** See headline #10. Direct fit for Strandworks subagent configs in `~/.claude/agents/*`.
- **Added `CLAUDE_CODE_WORKFLOW_SUBAGENT_MODEL` to run every workflow agent on one model while other subagents keep theirs.** Cost + agent-team lens. Direct fit for Strandworks workflow-agent pattern (e.g. pin Explore/verify to Haiku 5.5 while the main workflow stays on Opus).
- Added `CLAUDE_CODE_OVERLOADED_RETRY_MAX_DELAY_MS` to set a longer maximum delay for backoff when retrying an overloaded (529) request. Cost lens.
- Added a note in `/plugin` on a plugin whose hooks are left out because another enabled plugin has the same name.
- **Added an `allow_large` option to Read tool so Claude can read a text file past the usual size limits in one call when it needs the whole file and context has room.** **Correctness: MEDIUM.** Direct fit for Strandworks scouts reading large sources.
- [Cloud sessions] Added a status filter to Sessions/Runners lists on a self-hosted environment's Activity tab.
- [Claude Tag] Added creating/editing/deleting workspace + channel memory files on the Activity page's Memory tab for Claude Tag Admins.
- **Updated `/cost`, status line, `--max-budget-usd` and SDK cost figures to price Sonnet 5.5 cache reads at $0.10/Mtok (was $0.20).** **HEADLINE — Cost lens: HIGH.** See headline #3. Prior: in-session cost estimates were inflated 2× for Sonnet 5.5 cache reads.
- Updated the bundled dataviz skill: lighter violet for 7th series in light mode, softer primary text in dark mode, compact y-axis labels like 1K.
- **Changed the default limit on MCP tool descriptions sent up front and on MCP server instructions from 2,048 to 4,096 characters.** Direct fit for Strandworks MCP configs that previously had long descriptions truncated.
- Changed `←`: a turn or `!` command started while the session moves to the background is now stopped instead of finishing out of sight.
- [VSCode] Changed Claude in Chrome to ask before browser actions in every session (same as terminal).
- [Claude Tag] Changed Claude in Slack to show the footer with session link/model/cost only on its newest reply in a thread.
- Improved fullscreen link underline on hover.
- Improved transcript toggle responsiveness in code-heavy conversations.
- Improved Claude Desktop's Code tab behind Claude apps gateway.
- Improved errors for refused cloud sessions.
- Improved `--debug` output: unrecognized frontmatter fields in custom agent files are named with a hint for typos.
- Improved auto mode's "Not run" row rendering.
- Improved hooks `--debug` output (names command, plugin, outcome, duration).
- Improved `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC` to skip rewrites that free <10%.
- [Code Review] Improved admin settings error messages.
- Fixed managed-settings `PreToolUse` hooks that deny a tool call with `"continue": false`, and managed `prompt` hooks that block one, refusing the call but not ending the turn.
- Fixed PostToolUse hooks in managed settings not applying `updatedMCPToolOutput` in some sessions.
- Fixed headless sessions starting a folder's `.mcp.json` or plugin MCP server that was switched off for that folder.
- Fixed a Claude apps gateway that serves `allowedProviders` with `"gateway"` locking out laptops that name that gateway in user settings.
- Fixed a saved Claude apps gateway sign-in being ignored on machines whose managed settings set `forceLoginMethod` to `gateway` with no `forceLoginGatewayUrl` (regression in 2.1.295).
- Fixed `--teleport` opening an empty conversation when session history could not be read.
- Fixed token counts for Haiku 5.5 and other models that take only adaptive thinking.
- Fixed resumed subagents being told that the user rejected a tool call that a session shutdown had interrupted.
- Fixed hook output being altered when it contained text resembling a plugin hint tag.
- Fixed secret redaction in shared transcripts and debug logs missing some values that follow a key with no value. **Security-adjacent: HIGH.**
- Fixed a stray `52;c;…` escape sequence printed on screen after copying in older VTE-based terminals (MATE Terminal).
- Fixed toasts and notifications waiting unseen for as long as the `/diff` panel or dialog was open.
- Fixed Esc or an interrupt during a `UserPromptSubmit` hook or a mod's `prompt.submit` hook ending headless sessions, clearing the typed prompt, or letting the unchecked prompt through. **Security-adjacent: HIGH.**
- Fixed SessionStart hooks of a plugin loaded after a headless session starts being skipped.
- Fixed `claude self-hosted-runner` printing misleading errors when registration is refused.
- Fixed a self-hosted runner session's git fetch/pull/push failing while another session of the same repository starts on a runner with `--capacity` above 1.
- Fixed workflow scripts silently truncating results, agent options and other values nested deeper than ~20,000 levels.
- Fixed a plugin's served `$` methods running in the main session's working directory instead of the calling agent's.
- Fixed `$.agent.register` succeeding from a mod's hook that was still running after the mod was reloaded or removed.
- Fixed `$.http.fetch` in mods refusing a `HEAD` request when the response declares a `Content-Length` over 4 MiB.
- Fixed `claude plugin marketplace add`/`marketplace update`/`plugin install` failing with an internal error for a marketplace named like `constructor`.
- Fixed a plugin secret named `constructor` or `prototype` being deleted by the next save of that plugin's options.
- Fixed cloud sessions skipping auto mode's checks on Claude in Chrome actions.
- Fixed `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` re-running a finished turn after a restart when an MCP tool result had ended that turn.
- Fixed Bash permission checks auto-approving some commands that assign the `BASH_ARGV0` shell variable. **Security-adjacent: MEDIUM.**
- Fixed Edit and NotebookEdit replacing every non-ASCII character in files that are not valid UTF-8 (Windows-1252, Shift-JIS, GBK); such edits are now refused. **Correctness: HIGH.**
- Fixed a prompt sent just after `←` being run twice.
- Fixed a prompt sent while SessionStart hooks were still running vanishing when `←` moved the session to the background.
- Fixed a late-loading plugin's SessionStart hook output reaching the new conversation after `/clear` in headless sessions.
- Fixed PowerShell commands not seeing variables that hooks write to CLAUDE_ENV_FILE.
- Fixed Claude calling cloud sessions non-interactive and suggesting `/mcp` when an MCP server needs authentication.
- Fixed `/code-review` ending on a raw JSON array in cloud sessions, Agent SDK and IDE integrations. **Direct fit for Strandworks** — `/code-review` is listed as an available skill.
- Fixed auto mode occasionally refusing one update to your own artifact.
- Fixed skills synced from claude.ai never finishing their install.
- Fixed a plugin synced from claude.ai being disabled when the marketplace dependency it declares was also synced from claude.ai.
- Fixed a startup hang on macOS when plugin paths copied from a Linux machine pointed under /home.
- Fixed the Workflow tool refusing script files with CRLF line endings.
- Fixed OpenTelemetry `tool_result` events missing `git_commit_id` after `git commit -q`.
- Fixed `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC` dropping a message from the saved transcript when its text held a Unicode line/paragraph separator.
- Fixed `claude purge` leaving a prompt in the history file when its text held a Unicode line/paragraph separator.
- Windows: Several fixes.
- [VSCode] Several fixes.
- [Cloud sessions] Several fixes.
- [Claude Tag] Several Slack fixes.
- [Code Review] Fixed the Code Review check sometimes staying "in progress" on a pull request after the review finished.

**v2.1.299 (2026-10-14)** — [changelog](https://code.claude.com/docs/en/changelog)

(Note: v2.1.297 + v2.1.298 are not listed on the public changelog page as separate rows — jump from .296 → .299. If internal rows existed, they're bundled under .299.)

- **Added `CLAUDE_CODE_DISABLE_FILE_MENTIONS`: Claude gets the paths of `@` file mentions to read with its file tools, not the files' contents.** **HEADLINE — Cost + context lens: HIGH.** See headline #1 companion. Direct fit for Strandworks sessions where a large CLAUDE.md fleet or multiple docs get `@`-mentioned into context all at once.
- **Added idle compaction in the terminal: a 200K+ token conversation left idle for about 54 minutes is compacted before its one-hour prompt cache expires.** **HEADLINE — Cost + correctness lens: HIGH.** See headline #1.
- **Added `CLAUDE_CODE_IDLE_COMPACT_MIN_TOKENS` to change idle compaction's 200K-token minimum; `"idleCompaction": false` in settings.json turns it off. Both need v2.1.290 or later.** Direct fit for Strandworks — tune per-project if 200K is too eager or too conservative.
- Added `$.prompt.media` so a `prompt.submit` hook of a mod installed by managed settings can read bytes of an image/document attached to the prompt.
- Added `$.session.identity()` for mods installed by managed settings: how the session is signed in, and its organization + email when managed `forceLoginOrgUUID` lists that organization.
- Added `size`, `weight`, `mono` and `tabular` to a mod's `Text` and named spacing steps (`xs` to `xl`) to its `Box`; `bold` is deprecated in favor of `weight`.
- Added `--shutdown-drain-sec` to `claude self-hosted-runner orchestrator`.
- Added skill frontmatter + source + plugin name + file path to what a mod's `skill.prompt` hook receives.
- **Added `/effort` and `/fast` in agent view to set what new sessions start with; a bare `/model`, `/effort` or `/fast` there now opens a picker.** Direct fit for Strandworks `claude agents` fleet.
- Added a "safe mode" line to the agents view peek panel for background sessions started with `--safe-mode`.
- Added a one-time note when plan mode won't ask before most edits or commands because bypass permissions is available.
- **Added `--disallow-tools` and a `disallowed_tools` case field to `claude plugin eval` to keep specific built-in tools, such as Agent, out of eval runs.** Direct fit for Strandworks plugin dev.
- Added support for turning off attribution block in Claude Desktop's Code tab (`CLAUDE_CODE_ATTRIBUTION_HEADER=0`).
- Added a `queue` door to the `session.append` mod hook.
- Added a note in `/plugin` and `claude plugin validate` naming a mod's hooks that are skipped where an organization manages Claude Code.
- Added `/usage` warnings for max effort, workflows, always-on context, and large tool results.
- [Claude Tag] Added ability for Claude in Slack to delete a canvas it created in a channel when someone asks.
- Changed plugin hooks and workflow scripts to refuse values they hand back that nest deeper than 28,000 levels, with an error naming the limit.
- Changed actions a plugin hook can block to be refused, not let through, when the hook cannot be handed them or cannot hand back its answer.
- **Changed requests to claude.ai's connector proxy and to Anthropic-hosted MCP servers to no longer follow HTTP redirects.** **HEADLINE — Security-adjacent: HIGH.** See headline #5.
- **Changed MCP requests in cloud and self-hosted runner sessions to no longer follow HTTP redirects from the session's MCP proxy.** Same.
- Changed skill/command loading: files with hidden, direction-changing or blank-like characters, `<` or `>` in name are no longer offered until renamed.
- Changed `ui.render` trees in `claude plugin test`: each mod's `Box`/`Text` root now carries `part: { plugin }`.
- Changed WebFetch page reads to pick their effort as web searches do: caller's level on caller's own model, otherwise the small model's level settings.
- Changed `claude plugin test` to fail a call to a mod's served `$` method that has not answered within 10 seconds.
- **Changed MCP allow rules to reach only the server they name: `mcp__a` no longer allows a server named `a__b` or `a_`; write `mcp__<server>__*` with the server's whole normalized name.** **HEADLINE — Security-adjacent: HIGH.** See headline #2.
- **Changed agent `tools:` lists to take only the named MCP server's tools; list a server whose name contains `__` as `mcp__<whole name>__*`.** Same.
- Changed Claude in Chrome in Cowork cloud sessions outside auto mode.
- **Changed cloud session + Remote Control MCP connectors to negotiate MCP protocol version 2026-07-28 by default on installs that fetch no flags; `MCP_PROTOCOL_NEGOTIATION=legacy` opts out.** Direct fit for Strandworks MCP in cloud sessions.
- **Changed MCP tool descriptions + server instructions from Anthropic's first-party MCP servers at `api.anthropic.com` to reach Claude in full instead of being cut at 4,096 characters.**
- Changed auto mode in Cowork cloud sessions: a `PermissionRequest` hook can no longer approve shell commands or subagents. **Security-adjacent: MEDIUM.**
- **Changed the resume command printed at exit: it names the session by its ID and no longer by its name, so that nothing in a session name can run when the line is pasted.** **Security-adjacent: HIGH.** Prior: pasting the resume line could execute parts of a session name as a shell command.
- Changed resume command printed at exit of a worktree session to use `-w` and `-r` short flags if long flags don't fit the terminal.
- Changed `/btw` side questions in non-interactive sessions to return a timeout error when still unanswered after 11 minutes.
- **Changed `UserPromptSubmit` hooks to run before a skill or custom slash command expands, so a hook that blocks the prompt now also stops its embedded shell commands.** **Security-adjacent: HIGH.** Prior: an embedded shell command inside a skill/slash-command could run even if the hook later blocked. Direct fit for Strandworks skills with embedded `!` lines.
- Changed a skill's own front-matter `UserPromptSubmit` hook to first run on the prompt after the one that invokes the skill.
- **Changed the `turn.start` mod hook to also hear subagents' and teammates' turns, not only the main loop's; tell them apart by `e.agentId`.**
- **Changed errors shown when `/ultrareview` can't upload a repository to stop suggesting `git add .`, which could stage or commit untracked files such as `.env`.** **Security-adjacent: HIGH.** Direct fit for Strandworks `.env.master` hygiene.
- Changed the cyber safeguard notice to no longer ask people to apply to the Cyber Verification Program.
- [Cloud sessions] Several changes.
- [Claude Tag] Several Slack changes.
- Improved error for a refused cloud session.
- **Improved enforcement of managed permission rules, managed hooks and organization MCP tool names against user-installed mods.** **Security-adjacent: HIGH.**
- **Improved memory and disk use when PDFs are @-mentioned: their bytes are no longer kept in the session transcript.** **Cost lens: HIGH.** Direct fit for Strandworks scouts that WebFetch PDF sources.
- Improved sandboxed Bash on Linux: Esc and Ctrl-C now work while wildcard read rules are being expanded for a command.
- Improved the startup warning for an unrecognized model ID.
- Improved the plugin-authoring skill's steps for sharing a mod.
- Improved the Skill tool's "Unknown skill" error.
- Improved `/reload-skills` to say it re-sends the full skill list to Claude.
- Improved worktree error messages.
- Improved artifact watching: a local session can now watch up to 25 published artifacts at once, up from 10.
- Improved background agent notifications: they now say when an agent is only waiting on its own background work, got a message too late for its result, or was stopped by a usage limit.
- [VSCode] Several improvements.
- [Cloud sessions] Improved deploy command box.

**v2.1.299 (2026-10-14) — Bug Fixes (131 total)** — selected items with direct Strandworks fit:

- Fixed the error for a denied cloud session, which could point to the wrong organization when a key from `apiKeyHelper` was in use.
- Fixed sessions on a gateway-specific model name behind a custom `ANTHROPIC_BASE_URL` ending with "Prompt is too long · automatic compaction failed" near 200K tokens instead of sending the request.
- Fixed a mod that submits a prompt at the end of every turn keeping a headless run going past `--max-turns`, `--max-budget-usd`, an interrupt, or the end of the host's conversation. **Correctness: HIGH.**
- Fixed Edit and Retry in Cowork/claude.ai cloud sessions failing on a message stopped while its `UserPromptSubmit` or mod `prompt.submit` hooks were still running (regression in 2.1.296).
- Fixed an agent teammate started without a description keeping part of a credential from its prompt in the task description shown for it. **Security-adjacent: HIGH.** Prior: credential leakage via teammate task descriptions.
- **Fixed a sandboxed shell command being able to write into a `--plugin-dir` folder, whose code Claude Code reloads and runs outside the sandbox.** **Security-adjacent: HIGH.** Sandbox escape.
- Fixed memory growth under heavy debug logging (`--debug`, `--debug-file`), and a hang on exit when the debug log is on a disk/network mount that stops accepting writes.
- Fixed memory growing without bound when debug output goes to stderr and the parent process stops reading it.
- Fixed rm prompts on shell `-c` scripts that don't run `rm`. An rm built at run time in a script Claude Code can't read no longer prompts unless `CLAUDE_CODE_STRICT_INLINE_SHELL_RM_PROMPT=1`.
- Fixed `claude mcp list`, `claude doctor` and `/status` reporting an empty `.mcp.json` as invalid.
- Fixed sandboxed commands failing on WSL2 with `bwrap: Can't mkdir /mnt/c/Program Files/ClaudeCode`.
- **Fixed scheduled wakeups (ScheduleWakeup) not firing while a background task was running in Agent SDK, IDE and `claude remote-control` sessions.** **Correctness: HIGH.** Direct fit for Strandworks `ScheduleWakeup`-based scheduled work.
- Fixed a mod's `prompt.submit` rewrite being silently dropped for some prompts with a pasted image or an image that can't be read.
- Fixed Remote Control prompt + hook delivery bugs.
- Fixed sign-in, MCP servers and project trust appearing lost on Linux after a sandboxed command left an empty `.config.json` in the config directory.
- Fixed `/sandbox` reporting success when its setting could not be saved.
- Fixed SDK and headless sessions staying in auto mode after the host switched to a model that doesn't support auto mode.
- Fixed MCP servers named `constructor` or `prototype` in an MCP config never being connected. **Prototype-pollution-shape.**
- Fixed tools of an MCP server named `constructor` or `toString` asking for permission in auto mode and bypass permissions mode.
- Fixed a spurious "synced[0] commands path not found" plugin error at startup when another Claude Code process had just updated a claude.ai-synced plugin.
- Fixed Cowork cloud sessions staying on an old account plugin after a plugin reload timed out or a restart reused a recent sync.
- Fixed document blocks being dropped from your own message sent while Claude is working.
- Fixed Claude in Chrome asking for permission while no browser is connected.
- Fixed the fullscreen "Update installed" notice being hidden behind the idle "/clear to save tokens" hint.
- Fixed a mod hook, with or without a `.catch`, being run again without end when it waits on another mod's noun that does its work outside the call.
- Fixed Claude apps gateway serving models that a policy's `availableModelsMatch: exact` or `deniedModels` blocks.
- **Fixed server-managed settings request to Anthropic carrying a third-party gateway's API key when a managed settings file sets `ANTHROPIC_BASE_URL`.** **Security-adjacent: HIGH.** Credential leakage to Anthropic from gateway-only sessions.
- Fixed streams through a custom `ANTHROPIC_BASE_URL` being aborted after 180 seconds with no data arriving; they now wait 300 seconds.
- Fixed a mod's `tool.describe` or `prompt.section` answer that changed after `$.ui.invalidate` never reaching Claude.
- Fixed a settings file being ignored when `enabledMcpjsonServers` or `disabledMcpjsonServers` held a single server name as a plain string.
- Fixed `claude plugin test` pausing a hook's time budget while a served `$` method it had called kept making `$` calls after answering.
- Fixed high memory use after resuming a cloud or Remote Control session that had run many subagents.
- Fixed plugin hooks being skipped when they pass a very deeply nested tool input or message on with next(). **Security-adjacent: MEDIUM.**
- Fixed a value a mod's hook passes to `next()` being refused whole when one of its getters throws a `RangeError`; now only that key is refused.
- Fixed `/usage`, the approaching-limit warning (terminal + VS Code) and status line sometimes showing more than 100% used.
- Fixed wrapped text mixing CJK/emoji with Latin words losing its last line.
- Fixed cloud session sometimes ignoring the answer to a permission prompt when answer was given while session's worker was being replaced.
- Fixed bold/italic nested text styles running over table borders or being lost on wrapped rows.
- Fixed Cowork cloud sessions running the old version of an account plugin after cross-device changes.
- **Fixed deny and ask rules for an MCP server (`mcp__<server>`) not applying when the server's normalized name contains a double underscore.** **Security-adjacent: HIGH.** Companion to the headline #2 allow-rule change.
- Fixed long conversations losing newly attached images on every turn after one oversized image was refused by the API.
- Fixed the `plugin_loaded` telemetry event reporting `has_hooks` as false for plugins whose hooks are a hooks module.
- Fixed images attached while Claude is working being sent at full size, which led to repeated image errors.
- Fixed the image coordinate hint being missing or slightly off for large near-square images on newer models.
- **Fixed feature flag, startup, fast mode, profile and feedback requests to Anthropic carrying the API key configured for a third-party gateway (`ANTHROPIC_BASE_URL`); Anthropic API keys are still sent.** **Security-adjacent: HIGH.** Credential leakage from gateway sessions.
- Fixed a mod's hot reload ignoring a fix saved right after a failed reload.
- Fixed mods loaded from source files being refused when a hook hands `$` to a function declaration imported from another file of the mod.
- Fixed a regression in 2.1.296 where cloud and headless sessions could run an approved tool call twice.
- **Fixed scheduled tasks being announced for the wrong minute: the scheduling tools now report each job's actual next run time.** Direct fit for Strandworks `/loop` scheduling.
- **Fixed mods' hooks being handed values with `__proto__` keys silently removed, which could skip a `tool.check` guard on a tool call another mod made.** **Security-adjacent: HIGH.** Mod/guard isolation hole.
- Fixed `claude -p` saying nothing when a settings file fails validation.
- Fixed long pastes in terminals without bracketed paste losing all text after an invisible control character.
- Fixed managed settings/org policy not being fetched when the stored login's plan was changed locally on machines whose MDM sets `forceLoginOrgUUID`.
- Fixed MCP connections over HTTP hanging for 30 seconds and failing when a server never ends the body of its reply to a notification.
- Fixed MCP servers added to a running headless/SDK session being connected before some policy checks ran; a blocked server is now reported as failed without being contacted. **Security-adjacent: HIGH.**
- Fixed `claude mcp list`, `claude mcp get` and subagent MCP servers starting a server that a policy check blocks. **Security-adjacent: HIGH.**
- Fixed `/reload-plugins` not loading a plugin installed from another terminal a moment earlier.
- Fixed `$.http.fetch` in mods refusing a `304`, `204` or `205` response.
- Fixed `/config` push notification toggles sending your account the previous setting.
- Fixed a cloud session leaving a reply unfinished when its worker was replaced just after the reply hit the output token limit.
- Fixed Read failing on PDF page ranges in remote sessions on Linux without elevated privileges.
- Fixed Enter answering a question or permission prompt that had been held back while you typed an unsent message.
- Fixed a file attached to a message in a remote session being left out when its download stalled part way.
- Fixed queued prompts sent as content blocks over `--input-format stream-json` running together without a line break when merged into one turn.
- Fixed self-hosted runner sessions shutting down MCP servers added through an `--exec-path` wrapper's own `--mcp-config` when connectors change mid-session.
- Fixed `claude plugin eval` passing runs that the API refused.
- Fixed permission prompts cutting off or wrapping too early when the reason text contains keycap or joined emoji.
- Fixed `forceLoginOrgUUID` and `forceLoginMethod` from MDM or managed-settings file being hidden or replaced by server-managed settings.
- Fixed `--bare` sessions leaving out an MCP server named `constructor` or `prototype`.
- Fixed resuming a conversation from before `/clear` reattaching to the Remote Control session of the conversation after it.
- Fixed a prompt starting with `/`, sent with the Agent SDK's `verbatimPrompts` option, running as a slash command when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` re-ran it after a restart.
- **Fixed background sessions started with `--safe-mode` silently leaving safe mode when the session was woken or restarted.** **Security-adjacent: HIGH.** Direct fit for Strandworks `--safe-mode` background sessions.
- **Fixed scheduled tasks and loops firing again after every turn, or firing early, during the repeated hour when daylight saving time ends.** Direct fit for Strandworks `/loop` scouts around 2026-11-01 DST end (US).
- Fixed the diff view listing a new file whose name begins or ends with a space under the wrong name.
- Fixed MCP tool calls in headless/SDK sessions sometimes failing or running twice when a background reconnect closed the connection.
- Fixed `/btw` side questions in non-interactive sessions not being cancelled when the session ends.
- **Fixed sandboxed commands on macOS being able to read or write a denied path by its real location when the denied path passes through a symlink.** **Security-adjacent: HIGH.** TOCTOU on symlinks (variant of v2.1.290/.292 fixes).
- Fixed sandbox `denyRead`/`allowRead` globs with braces/parentheses/backslashes in a folder's name being read differently by Claude Code's settings checks than by the sandbox. **Security-adjacent: MEDIUM.**
- Fixed sandbox glob `allowRead`/`allowWrite` entries not being re-checked when the directory they start from is replaced by a symlink. **Security-adjacent: HIGH.**
- Fixed worktree-isolated sessions accepting some awk programs the isolation guard should refuse. **Security-adjacent: MEDIUM.** Direct fit for Strandworks `isolation: "worktree"` pattern.
- Fixed `claude mcp add <name> -- <command> --background` being started as a background session.
- Fixed a prompt or reply of `--bg` or `--background` to a background session being taken for the flag, which could start new sessions over and over.
- Fixed a custom slash command's embedded shell line running twice when a newer message interrupted the command while its prompt was being checked.
- Fixed `--worktree` sessions leaving a folder behind in `.git/worktrees` in repositories using git's reftable ref storage.
- Fixed `claude self-hosted-runner` sessions using Anthropic-managed git showing tracked files as staged deletions.
- Fixed Ultracode not being announced to scheduled tasks and other delivered headless turns.
- **Fixed MCP OAuth sign-in, token refresh and sign-out not sending configured `headers`/`headersHelper` values, which broke servers behind an authenticating proxy.** Direct fit for Strandworks MCP configs that use auth proxies.
- Fixed the Artifact tool reporting a spurious one-line difference against the live page.
- Fixed `$.ui.open` reporting a mod's pane as placed in sessions where no surface draws it.
- Fixed `agent.spawn` mod hook not running when a finished subagent or killed teammate is resumed.
- Fixed `claude plugin validate` rejecting a mod's `$.state` references.
- Fixed a mod's `dimColor` text looking the same as plain text under dark ANSI theme and on 16-color terminals.
- **Fixed plan mode running a write (an MCP tool's, a file's, a shell command's) that a `PreToolUse` hook or a mod's `tool.check` hook allowed.** **Correctness: HIGH.** Prior: plan-mode guardrail could be bypassed by a hook.
- Fixed background subagents in auto mode sometimes sending their final report twice.
- Fixed `SendMessage` not finding a subagent by name after the CLI restarted and resumed the session.
- Fixed replies cut off at the output token limit ending the turn silently.
- Fixed Read garbling UTF-16LE files with a byte-order mark, and Write dropping byte-order marks.
- Fixed cloud sessions sometimes leaving a message unanswered when the worker was replaced right after a compaction.
- Fixed cloud sessions and `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` sometimes answering a finished turn again after a restart.
- Fixed photos sent over Remote Control being dropped.
- Fixed files sent over Remote Control sometimes not arriving in long-running sessions.
- Fixed files of 30 to 35 MiB sent over Remote Control or to a cloud session not arriving.
- Fixed a user-installed mod's `$.env.set` changing the environment or shell prefix that command hooks from managed settings start with. **Security-adjacent: HIGH.**
- Windows: Fixes.
- Self-hosted runner: Fixes.
- [VSCode] Fixes.
- [Cloud sessions] Fixes.
- [Remote Control] Fixes.
- [Claude Tag] Several Slack fixes.
- [Code Review] Fixed Code Review's monthly spend-limit comment and check-run card linking the wrong settings page.

### Anthropic Platform

**Claude Developer Platform API Release Notes** — [changelog](https://platform.claude.com/docs/en/release-notes/api)

- **2026-10-08 — Compliance API expanded (beta, Claude Enterprise):** chat endpoints now return chats from the unified Claude experience under existing Compliance Access Key; Compliance API can now download Claude Docs as Word files, in beta. **Not relevant to Strandworks** (solo, no Enterprise plan).
- **2026-10-07 (last day of prior window; shipped to Claude Code 10/7, consumed in-window) — Sonnet 5.5 prompt cache reads cut from $0.20 → $0.10/Mtok** (0.05× base input instead of 0.1×). Cache writes + all other prices unchanged. [Pricing](https://platform.claude.com/docs/en/about-claude/pricing#prompt-caching). **HEADLINE — Cost lens: HIGH.** See headline #3.
- **2026-10-07 — Launched Claude Haiku 5.5 (`claude-haiku-5-5`):** 1M context, 128k max output, adaptive thinking with `effort` parameter. $0.10 / $0.50 per Mtok (over 100K prompts: $0.50 / $2.50). Available on Claude API + Bedrock + Vertex + Foundry. [What's new](https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5). **HEADLINE — Agent-team + cost lens: HIGH.** See headline #4.

**Anthropic news posts in-window:**
- **2026-10-14 — Singapore office + MOU with Government of Singapore.** [post](https://www.anthropic.com/news/singapore-office-opening). No new products/APIs/SDK; in-region Bedrock inference for data residency (already available). **Not relevant to Strandworks.**
- **2026-10-08 — 2026 Usage Policy update, effective 2026-11-12.** [post](https://www.anthropic.com/news/2026-usage-policy-update). Consolidates deception rules; expands weapons prohibitions to cover software components; adds autonomous-physical-action requirements; adds surveillance tracking prohibitions; allows personalized political targeting if non-deceptive + privacy-respecting; adds narrow prohibition on sustained abusive behavior toward Claude. **Direct fit for Strandworks: LOW.** See headline #6.
- **2026-10-08 — Building on our commitment to American scientific discovery (Genesis Mission).** [post](https://www.anthropic.com/news/genesis-mission-commitment). $150M over 3 years to U.S. DoE Genesis Mission; Claude + Claude Code + API credits to 15+ federal agencies (NASA, NIH, NSF). **Not relevant to Strandworks.**
- **2026-10-08 — Introducing the Anthropic Cyber Mission.** [post](https://www.anthropic.com/news/anthropic-cyber-mission). New umbrella: CIDP (Critical Infrastructure Defense Program, 11 OT partners) + free, opt-in OSS Scanner. **Direct fit for Strandworks: MEDIUM (potential).** See headline #7 + Recommended Actions below.
- **2026-10-12 — OSS Scanner opened to open-source maintainers** (per Alphasignal, blockchain.news, ccleaks summaries of the Cyber Mission post; not a separate newsroom post but tracked as a shipped capability).
- **2026-10-12 — Preserved-thinking distillation defenses** published to [research page](https://www.anthropic.com/research/distillation-defenses). Shipped in Fable 5.1 + Opus 5.5; cuts data harvesting by distillers by ~90–99%. See headline #8.

**Anthropic engineering blog:**
- **2026-10-13 — Redesigning source control at Anthropic (Scion).** [post](https://www.anthropic.com/engineering/redesigning-source-control). **Direct fit for Strandworks: LOW.** See headline #9. Breaks eight-week engineering-blog drought.

### MCP Ecosystem
- **No new MCP spec revision in-window** (still 2026-07-28).
- **No major new MCP servers in Anthropic's official catalog** beyond what the plugin-submission portal already lists.
- **Protocol default version 2026-07-28 is now the default for cloud sessions + Remote Control + self-hosted runners** (v2.1.299, 10/14) on installs that fetch no flags. Prior: those surfaces defaulted to the earlier protocol. Direct fit for Strandworks cloud/Remote Control MCP use.
- **MCP tool description + server instruction default limit raised 2,048 → 4,096 characters** (v2.1.296, 10/9); limit sent through tool search bumped to 16,384 characters (v2.1.295, 10/8). First-party Anthropic MCP servers at `api.anthropic.com` now return full-length tool descriptions and server instructions to Claude.

### Agent Patterns + Best Practices
- **Scion post (Anthropic engineering, 10/13)**: assume clients always online; server computes history/blame/commits/merges; clients fetch only files they need; horizontal scaling over distributed-first design; rethink merge-queue + CI models for concurrent agent-generated changes. Guidance-only — Scion is not public.
- **Preserved thinking (Anthropic research, 10/12)**: multi-layered defense (classifier + context-edit block + preserved-thinking separation). Context: Anthropic now operates in an active-extraction threat environment where attackers test 12,000+ techniques per lab per attack. Relevant for anyone building derivatives of Claude outputs: API accounts created on/after 2026-08-31 can't edit Claude's prior context on Fable 5.1 / Opus 5.5.

### Adjacent Tooling (only when notable)
- **Nothing notable this week.** No major Cursor / Aider / Codeium / Continue releases that shift the workflow comparison.

## Recommended Actions

Direct-fit, concrete actions ordered by effort × impact:

1. **Enable idle compaction on long-running Strandworks sessions** (v2.1.299, 10/14). Default-on at 200K tokens; use `CLAUDE_CODE_IDLE_COMPACT_MIN_TOKENS` or `"idleCompaction": false` to tune. **Zero config needed to adopt;** verify the daemon-side scouts on `claude-ops` VPS and the Shadow worker are on v2.1.299+ (otherwise they still re-process full context on wake). Affects: [claude-ops VPS](../../memory/claude-ops-vps.md), [Shadow VM](../../memory/shadow-vm-wake-on-demand.md).
2. **Audit `.claude/settings.json` for loose `mcp__<prefix>` allow rules.** v2.1.299 (10/14) tightened MCP allow rules to only match the server they name; agent `tools:` lists tighten the same way. Any Strandworks config that writes `"mcp__supabase"` expecting it to match a server named `supabase__something` or `supabase_x` now has no effect. Check all MCP configs across the portfolio (Supabase, Linear, Notion, Gmail, Telegram, Chrome, Blender). Related: [Tools & capabilities](../../memory/tools-and-capabilities.md).
3. **Add `onFailure: "block"` to critical pre-tool-use hooks** (v2.1.295, 10/8). Prior default: hook that times out or crashes fails open silently. Direct fit for any Strandworks guardrail hook on destructive operations (git push, Supabase writes, `rm`).
4. **Switch cost-sensitive subagents to Haiku 5.5** (v2.1.293, 10/7). The `/code-review`, `verify`, `security-review`, `fewer-permission-prompts` skills + any Agent SDK call-site in scouts and the Telegram daemon that does cheap classification. Haiku 5.5 is $0.10/$0.50 per Mtok, 1M context, adaptive thinking with `effort` — fits the "low-effort delegation" pattern that the Oct 6 `effort` parameter on the Agent tool already enabled. For workflow agents specifically: set `CLAUDE_CODE_WORKFLOW_SUBAGENT_MODEL=claude-haiku-5-5` (v2.1.296, 10/9) to downshift every workflow agent in one place.
5. **Confirm the Sonnet 5.5 cache-read price cut shows in `/cost` + status line** (v2.1.296, 10/9). If any Strandworks cost tracking (`strandworks-cockpit`, `_ops/strategy/revenue-plays`, Bouren Plan §1) relies on the old $0.20/Mtok number, divide the cache-read line in half from 10/7 forward. Related: [strandworks-ops registers](../../memory/strandworks-ops-registers.md), [Cockpit v2 money register](../../memory/cockpit-command-center.md).
6. **Audit Strandworks-owned OSS repos for Anthropic OSS Scanner enrollment** (Cyber Mission, 10/12). Candidates: `StrandWorksAutomations/m15-monitor-defib`, `StrandWorksAutomations/pocus-ultrasound`, the physiology-engine submodule, any BadgeMedia/haptic-mirror public repo. Zero-cost supply-chain scan with no deploy work; reports include PoC + fixes at ~90% accuracy. Verify repo visibility (OSS Scanner is opt-in for public repos). Related: [MedSim-Game monitor](../../memory/medsim-lifepak15-monitor.md), [POCUS prop](../../memory/medsim-pocus-ultrasound.md).
7. **Add `--safe-mode` wake test** (v2.1.299 fixed background sessions started with `--safe-mode` silently leaving safe mode on wake/restart). If any Strandworks `/loop` or background job uses `--safe-mode`, verify on v2.1.299+ that it stays in safe mode across the next DST wake (US DST ends 2026-11-01).
8. **DST pre-check on `/loop` scouts** (v2.1.299 fixed scheduled tasks + `/loop` firing extra runs or firing early during the repeated DST-end hour). US DST ends 2026-11-01 02:00 → 01:00. The claude-ops VPS + any Mac-local `/loop` sessions should be on v2.1.299+ by 2026-10-31 to avoid duplicate scout runs or missed runs over the DST transition. Related: [claude-ops VPS](../../memory/claude-ops-vps.md).
9. **If any Strandworks session uses a custom `ANTHROPIC_BASE_URL` (third-party gateway):** v2.1.299 fixed two credential-leakage bugs where Anthropic API keys were being sent to the gateway and gateway API keys were being sent to Anthropic (feature-flag + startup + fast-mode + profile + feedback requests + server-managed-settings request). Upgrade to v2.1.299 and rotate any key that was exposed to the wrong endpoint. **If no gateway in use (default Strandworks posture): skip.**
10. **Verify guardrail hooks against prompt-injection via `__proto__`** (v2.1.299 fixed mods' hooks being handed values with `__proto__` keys silently removed, which could skip a `tool.check` guard on a tool call another mod made). Mod-platform only; relevant if Strandworks adopts the Claude Mods platform from last week.

## Pricing / Cost Watch

- **Sonnet 5.5 prompt cache reads: $0.20 → $0.10/Mtok** (2026-10-07). 50% reduction on cache reads only; cache writes + base input + output unchanged. Direct fit for Strandworks: every scout + `/code-review` + Agent SDK session using Sonnet 5.5 with heavy caching pays half the cache-read line. Cross-reference: Bouren Plan §1 monthly AI tooling line — adjust projection for Sonnet 5.5 share of usage.
- **Haiku 5.5 launched: $0.10 / $0.50 per Mtok (over 100K prompts: $0.50 / $2.50), 1M context, adaptive thinking.** Same base-input price as prior Haiku, with 5× the context ceiling + adaptive-thinking cost headroom. Direct fit: downshift cheap-and-fast classification workloads (status checks, Explore, verify) from Sonnet 5.5 to Haiku 5.5 wherever quality survives the switch — the `effort` parameter (Agent tool, Oct 6) + `CLAUDE_CODE_WORKFLOW_SUBAGENT_MODEL` (v2.1.296, 10/9) make this a per-call tuning.
- **No price changes on Opus 4.7, Opus 5.5, Fable 5.1 in-window.**
- **No pricing changes on prompt caching for Haiku 5.5, Opus, or Fable in-window.** The Sonnet 5.5 cut did not extend to the other families.

## Nothing New (Watchlist)

- **Claude Code Projects redesign (beta since 9/17)**: still Pro/Max cloud-sessions beta as of 10/14; local-execution and Cowork integration still "coming." No visible movement in-window. Strandworks has not adopted; no change in advisability.
- **Claude Design (Apr 17)**: no further announcements. Strandworks has not evaluated.
- **Agent SDK API-rate billing change**: Anthropic paused this in prior window; status unchanged — Agent SDK stays on earlier billing model.
- **Expanded Cyber Verification Program (10/6)**: now folded into the broader Anthropic Cyber Mission (10/8). Three access tiers (Defense / Red Team / Specialized) remain. Not relevant to Strandworks (solo-dev, local, no public deploy).
- **Claude for Google Workspace public beta (10/6)**: no movement in-window. Not relevant unless MedSim-Game ever adopts Google Docs as a surface.
- **Claude Frontier Academy (10/2)**: no new in-window milestones. Not relevant.
- **MCP spec next revision**: still 2026-07-28 (release candidate dates back to July). No update.

## Parked Idea Unblocks

**No parked ideas unblocked this week.** All 26 entries in `_ops/idea-vault/*.md` are gated on non-tech conditions: market validation, MedCapture pilot milestones, hardware availability (consumer AR glasses <$800, Unitree pricing), money, or Strandworks-internal engineering bandwidth. This week's capability changes (idle compaction, MCP allow-rule tightening, hook `onFailure: "block"`, Sonnet 5.5 cache-price cut, Haiku 5.5 launch, OSS Scanner, preserved thinking, Scion engineering guidance) don't move any of those gates.

The closest potential unblock to flag: **`runway-dev-portal-exploration.md`** — blocker is "Time + worthiness of paid API credits — nothing technical." Haiku 5.5's 1M context + $0.10/$0.50 pricing + Agent SDK `effort` parameter together lower the cost of experimentation; if Runway's dev portal is primarily a prompt-eng + batch exploration project rather than Runway-specific SDK work, Haiku 5.5 could make a short exploration run meaningfully cheaper. Not a formal unblock — the written blocker is money/time, which Haiku pricing moves marginally.
