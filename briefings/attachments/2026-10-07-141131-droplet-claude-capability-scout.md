---
name: Claude-Capability Scout - 2026-10-07
description: 7-day window (10/1–10/7). **Headline #1 (agent-team + product-build lens): Claude Mods shipped (v2.1.287, 10/1)** — plugins can now register TypeScript functions that hook deeper behavior (rewrite a prompt, change or retry a tool call, approve/deny permission, strip secrets from tool output before Claude reads it, add new UI, replace a built-in feature). Mods ship inside regular plugins and run unsandboxed with Claude Code's own machine privileges — same security bar as any locally installed program. Some built-in features (e.g. `/diff`) now ship as mods, so they can be turned off in `/plugin` or replaced. Builds through five more releases in-window: `$.ui.selection()` (10/2), `serverToolUses` on `turn.step` + `agentId` on `tool.check` + `ThemeKey`/`Color` typings (10/5), `prompt.autocomplete` hook + prompt caching for `$.model.complete` + workflow agents in `agent.spawn` + `agent.spawn` for teammates with one agent id across hook events (10/3, 10/5, 10/6). Companion built-in mod shipped same day: **"You should know"** — a side agent that watches your work and flags things you or Claude might miss (`/plugin enable cc-plugin-you-should-know@builtin`, telemetry-on only). **Direct fit for Strandworks + MedSim-Game (BOTH lenses).** Agent-team lens: every hook point in Strandworks' Claude-Code setup — the per-project `CLAUDE.md` fleet (23 files), the Explore / verify / code-review subagents, the `/loop` scheduled scouts, the Telegram bridge, the Supabase MCP flows — can now be instrumented without forking Claude Code or writing shell hooks that fire on event names. Product-build lens: Claude Mods is the same shape as the "Claude Design" miss from Apr 17 that this scout under-weighted — it's a programmable surface that could support MedSim-Game tool UX, student-facing wrappers around Claude, or an in-app learning agent that flags clinical reasoning errors in real time. **Headline #2 (agent-team + cost lens): Agent tool `effort` parameter + `claude plugin install --marketplace <source>` + prompt-caching API for mods (v2.1.292, 10/6).** `Agent({ effort: "low" })` means subagents can now run below the parent's default effort, which cuts cost on routine delegations (Explore agent, file lookups, status checks). `--marketplace <source>` lets a plugin install from a marketplace that isn't yet added, under the same policy checks as `claude plugin marketplace add` — direct fit for scripted plugin deploys. Mod `$.model.complete` now takes `cache: true` on blocks, so a mod running its own model calls (e.g. a classifier mod, a secret-scan mod) can cache its own prompt the same way Claude Code does. **Headline #3 (security + correctness lens): seven security-adjacent fixes in-window.** (a) `rm -rf` inside `bash -c` / `sh -c` scripts now prompts in bypass-permissions mode and under shell allow rules (anthropics/claude-code#96300, v2.1.288) — prior: a shell-allow rule could silently approve `bash -c "rm -rf /"`; (b) `rm -rf` on the 8.3 short-name or alternate Windows spelling of `$HOME` or a drive is now treated as removing it (v2.1.292); (c) sandboxed commands could read staged `/ultrareview` upload copies under `~/.claude/seed-admin` — fixed (v2.1.292); (d) a managed sandbox read-deny path appearing or re-pointing mid-session no longer drops project grants inside it or ends credential injection — fixed (v2.1.292); (e) notebook/PDF read on macOS/Windows could return a file outside what was approved through a swapped symlink — fixed (v2.1.292); (f) tampered on-disk cache of server-managed settings could switch off the built-in policy plugin while the settings fetch failed — fixed (v2.1.292); (g) PreToolUse hook approvals + auto mode could bypass permission prompt for reads from UNC network paths — fixed (v2.1.292). Also: `--allow-dangerously-skip-permissions` was honored on `respawn` without the bypass-permissions disclaimer having been accepted — fixed (v2.1.290). (h) PreToolUse/PermissionRequest hooks skipped if matching failed or input couldn't be JSON-serialized — now blocked (v2.1.288). **Headline #4 (agent-team + cost lens): Opus 4.7+ and Fable use 1M context by default on Bedrock, Vertex, Foundry, and the Claude apps gateway (10/1, v2.1.287)** — no `[1m]` suffix needed. `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` reverts to 200K. Direct fit for Strandworks `/autocompact 200k` users on gateways. **Headline #5 (cost lens): WebSearch budget refills over time instead of ending at 200 calls (v2.1.290)** — default 100 calls/hour via `CLAUDE_CODE_WEB_SEARCH_REFILLS_PER_HOUR`, 0 turns it off. Prior: interactive session capped at 200 WebSearch calls per session. Direct fit for scout flows that WebSearch heavily (this one). **Headline #6 (platform + enterprise lens): Claude for Google Workspace shipped public beta (10/6)** — sidebar add-on in Docs/Sheets/Slides (read + edit; in Sheets writes formulas + pivots + charts, Python data processing; in Slides generates slides from existing layouts), plus three new connectors (Google Docs, Sheets, Slides) for the Claude apps that let Claude create/edit Google files from a chat. Available on all paid Claude plans; Team/Enterprise owners enable the connectors. Access matches existing Google sharing permissions. **Direct fit for Strandworks only if Jonathan uses Google Workspace** — portfolio operating substrate is `.md` + Linear + Supabase, so this is a lower-priority capability unless Google Docs becomes a surface. **Headline #7 (security-research lens): Expanded Cyber Verification Program (10/6)** — three access tiers (Defense / Red Team / Specialized) that unlock advanced cyber capabilities with reduced blocking classifiers for vetted security professionals. Project Glasswing partners (Comcast, Booz Allen) reported 129,000+ verified vulns April–July 2026 through the program. **Not relevant to Strandworks threat model** (solo-dev, local machine, no public deploys) but worth noting if MedSim-Game ever adds a HIPAA audit surface. **Headline #8 (enterprise lens): Claude Frontier Academy (10/2)** — $100M to train 10,000 Frontier Deployed Engineers by end of 2027; invitation-only through partner firms (Accenture, Bain, Deloitte, McKinsey, Morgan Stanley) + a 12-week residency leading a Claude project at the engineer's home organization. **Not relevant to Strandworks** (solo). **Headline #9 (cost / Agent SDK lens): Anthropic paused the Agent SDK API-rate billing change** that had been described previously — Agent SDK stays on the earlier billing model. Direct fit for every Strandworks workflow that uses the Agent SDK (`claude -p`, scheduled scouts, MCP agent flows). **Headline #10 (customer story): Barclays (10/1)** — expects 50% of developers on Claude Code by end of 2026, majority of SWEs in 2027. 16,000+ colleagues on Colleague Knowledge Assistant (RAG). 120,000 emails/day in Global Markets routed via Claude. Just a customer-story post; no platform change. **Headline #11 (projects lens, pre-window context): Claude Code Projects redesign (beta since 9/17)** — one project coordinates parallel agent threads, shared memory, and a shared library across repos; coordinator scopes requests, delegates work, reviews outputs, assembles results. Still Pro/Max cloud-sessions beta as of 10/7; local-execution and Cowork integration "coming." Not a 10/1–10/7 ship, flagging because Strandworks hasn't adopted it yet and it's maturing. **Also this window**: Claude for Small Business expanded (pre-window on 9/15, context) to 43 workflows + 27 new integrations (Shopify, Salesforce, TikTok, Atlassian, Zoom, Xero, Gusto, Square, Stripe, Zapier) — not relevant to Strandworks. v2.1.288 added `--max-findings <n>|all` to `/code-review` (sticky preference). v2.1.290 added `claude attach <name>` and `claude logs <name>` (part of a session name works in place of id) — direct fit for Strandworks background daemons. v2.1.290 added `/claude-api managed-agents-onboard <url>` for `ant apply` setup + `<quickstart-name>` for Console quickstart templates like `deep-researcher` — direct fit for the `claude-api` skill already listed as available. v2.1.292 added `prompt.autocomplete` mod hook. v2.1.287 added URL prompts from MCP servers on protocol 2025-11-25 (add `"bareElicitationCapability": true` if a server stops connecting). v2.1.287 fixed Sonnet 5.5 ↔ Opus 5.5 model switches dropping earlier thinking. v2.1.287 fixed background sessions on Homebrew upgrade (takes effect from the upgrade after this one). v2.1.288 fixed `--resume` dropping files/context after compaction. v2.1.288 fixed cloud sessions losing earlier conversation on restart-during-compaction. v2.1.290 fixed scheduled tasks (`/loop` + reminders) silently not coming back after compaction (new compactions only). v2.1.290 fixed foreground scheduled tasks never firing after `←` or `/background` handoff + recurring ones firing an extra run on resume/respawn/fork. v2.1.290 fixed plan mode not restoring on `--continue`/`--resume <id>`. v2.1.290 fixed interactive session's model/effort/rename changes applying immediately in `claude agents` to busy background sessions. v2.1.290: Bash permission now prompts on `pyright` (no longer treated as read-only). v2.1.290: Bash permission now prompts on more `ps` forms. **Anthropic engineering blog: still no new post** (eighth consecutive week). **MCP spec: no new revision in-window** (still 2026-07-28). **No major new MCP servers in official or community catalogs.** **No parked ideas unblocked this week.**
metadata:
  type: report
project: _ops
status: report
---

# Claude-Capability Scout - 2026-10-07

Weekly window: 2026-10-01 → 2026-10-07 (7 days; prior scout ran Wednesday 2026-09-30). Six Claude Code releases in-window (v2.1.287, .288, .289, .290, .291, .292); four Anthropic news posts (Barclays 10/1, Frontier Academy 10/2, Cyber Verification Program 10/6, Claude for Google Workspace 10/6); no Anthropic engineering blog post; no MCP spec update. Flagship remains **MedSim-Game** per `/PROJECTS/CLAUDE.md`.

## Releases This Week

### Claude Code

**Six versions shipped in-window (v2.1.287 → v2.1.292).** Structural headlines: **Claude Mods** (v2.1.287); Agent tool `effort` parameter + plugin marketplace install + prompt caching for mod model calls (v2.1.292); seven security-adjacent fixes (v2.1.288, .290, .292); 1M context default for Opus 4.7+/Fable on Bedrock/Vertex/Foundry/gateway (v2.1.287); WebSearch budget refills over time (v2.1.290); `claude attach <name>` / `claude logs <name>` by partial name (v2.1.290); `/claude-api managed-agents-onboard` (v2.1.290); mod hook ecosystem expansion across all five releases.

**v2.1.287 (2026-10-01)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added Claude Mods: plugins may now modify deeper behavior.** **HEADLINE — Agent-team + product-build lens: HIGH.** Prior: plugins could add commands/skills/hooks but couldn't rewrite prompts, intercept tool calls, approve/deny permissions programmatically, or replace built-in features. New: TypeScript functions that hook into Claude Code's internal execution pipeline. Some built-ins (e.g. `/diff`) now ship as mods. Mods run unsandboxed with Claude Code's machine privileges — security bar = any locally installed program. **Direct fit for Strandworks** — see headline. [Dev community writeup](https://dev.to/bobbyhalljr/anthropic-launched-mods-for-claude-code-lets-build-a-tiny-one-in-typescript-152h), [Cellcog overview](https://cellcog.ai/blog/claude-code-mods/).
- **Added "You should know", a built-in mod where a side agent watches your back and flags things you or Claude might miss.** Enable with `/plugin enable cc-plugin-you-should-know@builtin` (first-party sessions with telemetry on). **Agent-team lens: HIGH.** Companion to Claude Mods — the reference "watcher agent" pattern Anthropic shipped alongside the plumbing. Direct fit for Strandworks long autonomous sessions where mid-task drift matters (scheduled scouts, flagship work).
- **Changed Opus 4.7+ and Fable to use 1M context window by default on Bedrock, Vertex, Foundry and the Claude apps gateway, with no `[1m]` suffix** (`CLAUDE_CODE_DISABLE_1M_CONTEXT=1` keeps 200K). **HEADLINE — Agent-team + cost lens: HIGH.** Direct fit for Strandworks if any session routes through those providers.
- Added an `n:<text>` filter to the agents view that matches session names and tasks; Enter opens the first match. UX for Strandworks `claude agents` fleet.
- Added `prompt_text` to the OpenTelemetry `user_prompt` event (dotted-key backends). **Observability: LOW** — only matters if Strandworks sets up OTEL.
- Added URL prompts from MCP servers on the 2025-11-25 protocol (e.g. sign-in). Add `"bareElicitationCapability": true` to a server's MCP config if it no longer connects.
- Windows: Added startup warning when denying Bash also turns off PowerShell. Not applicable (macOS/Linux user).
- Self-hosted runner: Added built-in `gh api` (REST only) for sessions on managed git on macOS/Linux without GitHub CLI.
- **Fixed `--allow-dangerously-skip-permissions` on respawn without the bypass-permissions disclaimer having been accepted.** **Security-adjacent: HIGH.** Prior: `respawn` → bypass without acceptance. Fixed.
- Fixed fast mode staying off in remote sessions owned by an agent with no user account.
- Fixed Remote Control not receiving messages for minutes when a reconnect got no response (30s give-up + retry).
- Fixed hooks configured with `asyncRewake` waking Claude over and over with "found issues" when the hook's script file is missing.
- Fixed tool heartbeats not reaching SDK hosts while the model's response stream was stalled.
- Fixed Bedrock/Vertex startup checks ignoring enforced `availableModels`, which could collapse `/model` to one Opus row.
- Fixed Claude in Chrome browser picker showing a JSON parse error when Chrome couldn't be reached.
- Fixed picking Fable in `/model` on a claude.ai login saving the current version's id (now follows newest Fable like Opus/Sonnet do).
- Fixed switching between Opus 5.5 and Sonnet 5.5 (`/model`, `opusplan`) rewriting earlier MCP tool announcements, which could drop earlier extended thinking. **Correctness: MEDIUM** — direct fit for Strandworks `opusplan` users.
- Fixed Bedrock Guardrails blocks mid-response ending turn with API error instead of guardrail's message when reply began with thinking.
- **Fixed a dangerous `rm` (such as one on `/` or the home directory) losing its always-ask safeguard when the same command also redirected output to a `~` or wildcard path.** **Security-adjacent: HIGH.**
- Fixed `claude -p` and SDK sessions repeating a model fallback on every later message after model switch while reply was running.
- Fixed a folder's CLAUDE.md being attached a second time after resuming or compaction. **Cost lens: MEDIUM.** Direct fit for Strandworks 23-file `CLAUDE.md` deployment — this was likely silently paying for duplicate CLAUDE.md tokens on every resume.
- Fixed background sessions that could not be reopened from `claude agents` after the agent exited and removed the worktree.
- **Fixed `/advisor` pairing checks: Sonnet 5.5 can now advise Opus 4.7 and 4.8, and advisors the API would refuse are flagged up front instead of silently dropped.** Direct fit for Strandworks if any `/advisor` flow pairs Sonnet 5.5 with Opus 4.7.
- Fixed Bash permission prompts showing internal parser names like "Contains simple_expansion" instead of plain explanations.
- Fixed a cause of fullscreen sessions exiting with "unrecoverable interface error" while a scroll key was held in a long conversation.
- Fixed organization per-tool permission ceilings being silently dropped for an MCP tool named `__proto__`. **Security-adjacent: MEDIUM.** Prototype-pollution-shaped bug class — fixed.
- Fixed Claude being told to page large MCP results saved as JSON with Read's `offset`/`limit`, which cannot split one long line.
- Fixed the commit attribution reminder being delivered inside a tool result after compaction.
- Nine screen-reader-mode fixes — accessibility.
- Fixed `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` not removing structured-output format from session-title and prompt-hook requests, which Bedrock gateways reject.
- Fixed `--include-partial-messages` sending a cut-short reply's `message_stop` late or never.
- Fixed `claude agents` sometimes not showing a permission prompt a background session was waiting on.
- Fixed `/ultrareview` advice on `.git/info/attributes` when upload stops on committed UTF-16 `.gitattributes`.
- Fixed `claude remote-control` failing behind HTTP proxy with "Check your organization permissions" error (anthropics/claude-code#97352).
- Fixed sandboxed Bash on Linux inheriting an open handle on the Claude Code executable. **Security-adjacent: MEDIUM.**
- Fixed running-tool spinners still moving with "Reduce motion" on; fixed `/rewind` confirm screen updating "ago" time while typing.
- Fixed times in `claude agents` changing every second in screen reader mode (now ≥10s).
- Fixed revoked claude.ai login showing generic `API Error: 401` instead of "OAuth token revoked" (`-p` mode: "Failed to authenticate").
- Fixed `/ultrareview` upload refusals advising copying variables from repo settings into user settings.
- Fixed `--output-format stream-json` and SDK not streaming turns of `context: fork` skill runs invoked by typing `/<skill>`.
- Fixed `/feedback` and `/bug`: pre-filled GitHub issue no longer includes recent error messages; confirmation screen lists them as part of the report. **Security-adjacent: MEDIUM.**
- Fixed `claude plugin marketplace add --sparse` and `git-subdir` plugin installs failing with "transport 'http' not allowed" when the repo is HTTP.
- Fixed cloud sessions sometimes losing earlier conversation when restarting during compaction.
- Fixed plugin reload overlapping startup `--plugin-url` download corrupting cached plugin archive.
- Fixed `/desktop` quoting partial output when opening Claude Desktop timed out; error now names cause.
- Fixed MCP connector tool calls occasionally running twice when a remote server's result was over 16 MB or couldn't be parsed.
- Fixed SessionStart hooks from synced plugins not running in new cloud sessions.
- Fixed transcript's "N hooks ran" summary including Claude Code's internal callbacks (one configured hook was showing as two).
- Fixed files Claude sends from cloud/Remote Control failing when upload finished just after the 30s timeout (now 35s).
- Fixed repositories added mid-session in cloud/SDK sessions not loading skills/plugins + loading CLAUDE.md late.
- Fixed PNG/JPEG/WebP over 8000 pixels on a side failing from remote session (now sends scaled copy).
- Fixed messages sent from Claude apps with 17–20 attached files delivering only the first 16.
- Fixed headless sessions reporting MCP server as needing auth after one refused call even though later calls succeed.
- macOS: Fixed Remote Control sessions started with `claude remote-control` stopping mid-turn when Mac went to idle sleep.
- Windows: Fixed interactive `claude` hanging/crashing with "Raw mode is not supported" when input is piped (now says why + exits; use `-p`).
- Bedrock/Vertex/Mantle: Fixed model availability checks under `CLAUDE_CODE_SKIP_*_AUTH` sending different `Authorization` header than real requests when `ANTHROPIC_CUSTOM_HEADERS` repeats it.
- Improved `/config`: cyclable settings show ‹ ›, narrow terminals stack values under labels, PgUp/PgDn pages.
- Improved plugin marketplace errors to say plainly why a marketplace was ignored.
- Improved plugin listings to note missing dependencies; updating a plugin now retries an install that didn't finish.
- Improved Claude apps gateway's Bedrock-rejected model-ID error (now names which model).
- Improved SDK sessions: priority "now" messages no longer cancel running web fetch/search.
- Improved `/memory`: ← and → flip on/off settings like Auto-memory. **Direct fit for Strandworks** — Auto-memory is the native-memory pattern migrated to on 2026-06-17.
- Improved `/skill` names typed mid-message: Claude is now told they are skills (including `disable-model-invocation` ones).
- Improved contrast of prompt input border in light themes.
- Improved delivery of files Claude sends from cloud sessions and Remote Control: upload failures retried once.
- Improved explanation when a file can't be sent for a temporary reason.
- Improved held-message-from-another-session prompt to show message between dashed lines.
- Improved MCP/tool permission prompts to show the tool call between dashed lines.
- Improved MCP startup in headless mode: transiently-failed remote server is retried without waiting for the slowest server.
- Improved large MCP tool results: less memory, smaller session files, no extra upload to count tokens.
- Windows: Improved Bash tool speed by removing subshell that ran before every command.
- Changed shell writes through repo-committed symlinks onto sensitive files or out of working tree to name where it lands and wait for a person.
- Changed replies from `claude agents` to arrive as queued messages; slash commands other than `/stop` sent while a turn is running now run when it ends.
- Changed whole-tool `Bash` allow rules and allowing hooks to prompt for (not run) shell writes to files Claude Code's file tools refuse outright (Anthropic profile store, host credentials file). **Security-adjacent: HIGH.** Direct fit for Strandworks cred hygiene.
- Changed right-click paste on Windows/Linux + middle-click paste on Linux to happen on button release.
- Changed MCP server `alwaysLoad: false` to defer all that server's tools behind tool search.
- Changed automatic model switches after flagged message to keep current effort level instead of new model's default.
- Changed waiting permission prompts to show oldest first.
- `[VSCode]` Added "Run in background" + background shell output in agent map + several extension-side fixes.
- `[Cloud sessions]` Fixed occasional failures to fetch/push to GitHub when GitHub briefly refused a newly issued token.
- `[Claude Tag]` (Slack): several Slack-side fixes.
- `[Code Review]` Fixed finding comments stopping mid-sentence; fixed Code Review skipping PR after new push when previous commit's review failed twice.

**v2.1.288 (2026-10-02)** — [changelog](https://code.claude.com/docs/en/changelog)
- Added `$.ui.selection()` for mods: returns last selected text in fullscreen mode. Mod ergonomics.
- Added built-in `gh api` to cloud sessions whose image has no GitHub CLI (fixed sending control chars from file names / jq filters / GitHub errors to terminal).
- **Added Ctrl+C draft recovery: a prompt cleared with Ctrl+C comes back with Up on the empty prompt**, including pasted text + images. **UX: HIGH** — direct fit for Strandworks terminal use.
- Added re-authenticate prompt when MCP server asks for more OAuth scope during a tool call.
- **Added `--max-findings <n>|all` to `/code-review`** to report more/fewer findings than usual limit; sticky until `--max-findings default`. **Direct fit for Strandworks** — `/code-review` is listed as an available skill; `--max-findings all` surfaces the long tail of lower-confidence findings on complex changes.
- Added Ctrl+F to find a session by name + Alt+↑/↓ to jump between groups in agents view; both rebindable in `keybindings.json`.
- Added screen-reader announcement of new permission mode when you approve a plan.
- Fixed mid-response API timeouts failing the turn: non-interactive sessions and subagents now continue from partial response; thinking-only responses retried.
- Fixed long conversations failing with "Prompt is too long" instead of auto-compacting when last reply reported zero token usage.
- **Fixed `--resume` sometimes dropping files and other context that a compaction had just restored.** **Correctness: HIGH.** Direct fit for Strandworks `--resume` + `/compact` daily use.
- Fixed resumed session sometimes not saving last response of a turn.
- Fixed resume occasionally loading transcript cut short when session rewrote the file during load.
- Fixed resuming a conversation started on 2.1.286 or earlier dropping the model's earlier thinking.
- Fixed session titles / memory recall / prompt hooks failing on Mantle or behind gateways that reject structured outputs; added `CLAUDE_CODE_DISABLE_STRUCTURED_OUTPUTS`.
- Fixed auto mode denials pointing Claude at a Bash permission rule when blocked tool was not Bash.
- Fixed auto mode on Bedrock/Mantle switching to local classifier for rest of session after a request to an older model (e.g. WebFetch summary or `sonnet` subagent).
- Fixed cloud sessions that restarted on newly picked model replying with that model after server refused it.
- Fixed Cowork cloud sessions staying marked as waiting for input after WebFetch permission prompt for unapproved URL went unanswered for 5 min.
- Fixed prompt suggestions not appearing on a phone that joins a Cowork cloud session started on another device.
- Fixed mod button sometimes running a different button's action.
- Fixed plugin pane showing nothing when `Code` element held unparseable diff (now draws as plain code).
- Fixed plugin LSP servers receiving literal `${user_config.*}` and `${CLAUDE_PLUGIN_ROOT}` placeholders in `initializationOptions`.
- Fixed plugin `tool.call` hook making Bash fail / file searches read wrong folder in worktree subagents.
- Fixed `git-subdir` plugin installs failing on older git (<2.39).
- Fixed plugins loaded with `--plugin-dir` not showing "Configure options" in `/plugin`.
- Fixed background sessions ending when a plugin was reloaded/disabled while one of its timers or reads was still running. **Correctness: HIGH.**
- Fixed sandboxed heredocs with unquoted delimiter asking for approval on every run under sandbox auto-allow when body is plain text + simple `$VAR`.
- Fixed Bash tool permission check to prompt before `BASHPID` assignment whose value shell would arithmetic-evaluate.
- Fixed fullscreen sessions exiting with "unrecoverable interface error" when opening background tasks dialog while plugin/mod showed rows above prompt.
- Fixed Claude reporting message to another session as delivered when that session held it (now says undelivered and names session).
- Fixed OpenTelemetry `claude_code.tool.blocked_on_user` spans reporting `unknown` source/decision in `-p` and SDK sessions.
- Fixed permission asks that ended unanswered emitting no `tool_decision` event.
- Fixed Edit and Retry in Cowork cloud sessions refusing a message sent before `/compact`.
- Fixed unattended sessions (`CLAUDE_CODE_RETRY_WATCHDOG`) retrying for hours after very long response stream failed (now streams again, gives up after 3 timeouts). **Cost lens: HIGH.** Direct fit for Strandworks `-p` background jobs.
- Fixed `/login` reporting "Login successful" when credentials couldn't be saved to secure storage (anthropics/claude-code#73861).
- Fixed Stop during Bedrock credential lookup moving session to fallback model instead of ending request.
- Fixed second `gcpAuthRefresh`/`awsAuthRefresh` browser sign-in opening when a laptop wakes from sleep.
- **Fixed agent teams: plugin-defined agent spawned by name now runs with its own prompt, tools, disallowedTools and effort instead of defaults.** **Correctness: HIGH.** Direct fit for Strandworks subagent definitions in `~/.claude/agents/*`.
- Fixed headless (`-p`/SDK) sessions occasionally ignoring SIGTERM when supervisor sends SIGCONT alongside it.
- Fixed restarted cloud sessions restoring a model that organization's enforced model list refuses.
- Fixed MCP tool calls sometimes running twice when remote server's result was over 16 MB or unparseable.
- Fixed subagents in Claude Desktop's Code tab getting none of the tools of a user-configured MCP server named `memory`. **Direct fit for Strandworks** if the native-memory MCP server is named `memory`.
- Fixed Claude in Chrome asking before every screenshot and page read on a site you allowed when auto mode unavailable.
- Fixed `claude plugin install` failing for GitHub-source plugins on machines with no GitHub SSH key (falls back to HTTPS + prints notice).
- Fixed `sandbox.credentials.files` entries on git config files not taking effect while `permissions.blockReadsOutsideWorkingDirectories` is on. **Security-adjacent: MEDIUM.**
- Fixed Claude leaving out organization's design systems when starting slides/design with Artifact tool on Team/Enterprise plans or machines with managed settings.
- Fixed keyboard not working on Windows after Claude Code restarts itself.
- Fixed stall when launching agent whose `tools:` lists very many `Agent(...)` entries.
- Fixed sessions on Claude 3 Opus / Claude 3 Sonnet failing on every turn after a whole PDF entered the conversation.
- Fixed npm auto-updater reporting success when platform-native binary failed to download.
- Fixed Remote Control cleanup archiving a session that is still connected or was just re-attached.
- Fixed `owner/repo` plugin marketplaces showing only second attempt's error when both SSH and HTTPS fetch fail.
- **Fixed path-scoped `.claude/rules` and nested CLAUDE.md files not loading when Write or Edit creates/changes a file in their scope** (previously only Read loaded them). **Correctness: HIGH.** Direct fit for Strandworks per-project `CLAUDE.md` fleet.
- **Fixed a dangerous `rm` (such as one on `/` or home directory) inside a `bash -c` or `sh -c` script running without a prompt in bypassPermissions mode or under a shell allow rule (anthropics/claude-code#96300).** **HEADLINE — Security-adjacent: HIGH.** See headline #3.
- Fixed LSP tool calls hanging indefinitely when a language server uses dynamic capability registration or stops responding (now times out after 60s, per-server `requestTimeout`).
- Fixed `idle_prompt` notification hooks firing while background agents are still running (anthropics/claude-code#93672).
- **Fixed PreToolUse and PermissionRequest hooks being skipped when matching them failed or tool input couldn't be serialized to JSON; call is now blocked.** **Security-adjacent: HIGH.** Prior: hook-matching failure = silent bypass. Fixed.
- Fixed first request in fresh environment or after model switch using built-in output limit and auto-compact window, not server's.
- Fixed "What should Claude do instead?" hint showing on Interrupted row after sending queued messages with ctrl+enter.
- Fixed `/login` in a `--bare` session running sign-in session never reads, which could replace saved login.
- Fixed InstructionsLoaded hook omitting `agent_id` + `agent_type` when subagent's file access loads a rule or nested CLAUDE.md.
- Fixed Agent tool in `claude mcp serve` always reporting no available agents and rejecting every `subagent_type`.
- Fixed terminal cursor not following typed text in fullscreen transcript viewer's search + `/theme`'s custom color search.
- Fixed `/permissions` in screen reader mode: typing a rule's number now picks it instead of opening search.
- Improved auto mode: when conversation grows too long for client-side safety classifier, it is now compacted instead of prompting-for or failing every tool call. **Cost lens: HIGH.**
- Improved screen reader mode (two improvements).
- Improved `/usage-credits` message for Team/Enterprise with usage credit requests off.
- Improved cloud sessions: new conversation's first turn no longer waits for stdio MCP server whose config sets `alwaysLoad: false`.
- Improved "You should know" notes to say "we", "the main agent" or "you" depending on who was responsible.
- Improved error for artifact DB write refused at size limit (names limit + what frees space).
- Improved Bash permission prompts to give shorter reason when part of command can't be checked.
- Self-hosted runner: Improved built-in `gh api`: refused `gh` command prints its `gh api` equivalent; `--paginate` follows every page.
- Improved Remote Control recovery from expired server credential.
- **Changed background command time limit to apply only in unattended sessions (`-p`, Agent SDK, CI, cloud); terminal, desktop app and VS Code sessions have no limit.** **Correctness: MEDIUM.** Reverses the "30-min default, 2-h max" default added in v2.1.285 for interactive sessions. Direct fit for Strandworks interactive dev where a long-running local service shouldn't be auto-killed.
- Changed client-side auto mode classifier to ignore `ANTHROPIC_DEFAULT_SONNET_MODEL` pin that names Sonnet 5.5 or Opus 5.5 and use Sonnet 5 instead.
- Changed `claude project purge` to `claude purge` (old name still works with notice).
- Changed agents view `n:` filter + Ctrl+F search so Enter opens best name-matching session.
- Changed `/autocompact` to save auto-compact window per model.
- Changed MCP URL prompts from servers that can't report when you're done to wait for "I'm done, continue" before tool call continues.
- `[VSCode]` 3 fixes.
- `[Cloud sessions]` Cloud sessions switch in Claude Code admin settings staying locked off; Stop while runner was starting not cancelling queued message.
- `[Claude Tag]` 3 Slack fixes.
- Fixed `claude plugin test` reporting mods as turned off remotely when it had only read out-of-date saved setting.

**v2.1.289 (2026-10-03)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `agent.spawn` for teammates, one agent id across plugin hook events, and idle/waiting states in `$.agent.list()`.** **Agent-team lens: HIGH.** Direct fit for Strandworks subagent + Teammates ecosystem.
- Fixed deny/ask rule on nested part of compound shell command not holding over user-installed mod's approval on managed machines. **Security-adjacent: MEDIUM.**
- Fixed terminal freezing on short code blocks with many unclosed `<script>` tags or deeply nested `${` substitutions.
- **Fixed `Read` deny rules not applying to files @-mentioned, changed, or selected in the IDE through a symlink.** **Security-adjacent: HIGH.** Direct fit for Strandworks `.env.master` deny-rule hygiene.
- `[VSCode]` Reverted a 2.1.288 change to `claude auth status` that may have made sign-outs more frequent.
- Improved how quickly large files open in a plugin code pane.
- Fixed `plugin list` / `plugin eval` / `plugin update` showing stale copy of plugin installed from local-folder marketplace; hot reload for symlinked `--plugin-dir`.
- Fixed installed mods not loading in first session after upgrade.
- Fixed plugin rows above the prompt showing stale row while Background tasks dialog was open in fullscreen.
- Fixed plugin panes drawing nothing when a link used localhost, `@` in path, uppercase host, or `file:` path.
- **Fixed user-installed plugin being able to rewrite descriptions of an organization-managed MCP server's sign-in tools.** **Security-adjacent: HIGH.** Prototype-pollution-shaped.
- Fixed freeze or forced quit at launch when plugin drew a `Box` with border style terminal doesn't know.
- Fixed supervised and background sessions ending when a plugin's on-screen handler threw asynchronously.
- Fixed sessions ending with interface error when a plugin region with no height kept growing.
- Fixed Bash deny/ask rules missing a command behind env-var prefix with expanded value (`TZ="$HOME" rm -rf build`) when sandbox auto-allows. **Security-adjacent: HIGH.**
- Fixed Bash deny/ask rule skipped under sandbox auto-allow when bare variable assignment came before command. **Security-adjacent: HIGH.**
- Fixed `claude plugin validate` skipping plugin when folder also holds marketplace manifest.
- Fixed sessions ending with "unrecoverable interface error" when a value a mod's `ui.render` hook wrote made a row throw.
- Fixed text with tab + stray escape + C1 control, or short text with tab + CRLF, drawing over rows below it.
- Fixed right-aligned content in mod's pane/band drawing under close mark `[-]`.
- Fixed mod's `Client` that fails while drawn taking down everything mod drew around it (now fails alone, raises `ui.fault`).
- Fixed `claude plugin validate` failing Anthropic marketplace's own plugin and listing a clean `plugin.json` in `--json`.
- Fixed mod's band that fails to draw briefly telling cards under it to step aside.
- Fixed failed plugin component showing `Error` or nothing as reason when failure carried no message.
- Improved line a mod's author sees when its band or pane fails to draw (names mod, says nothing was drawn).
- Fixed published artifact pages freezing/crashing reader's browser tab on short code blocks with many unclosed `<script>` tags.
- Fixed mod's Client region staying failed for whole session after terminal threw while drawing it.

**v2.1.290 (2026-10-05)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `serverToolUses` to the result of a mod's `turn.step` hook: the tool calls the API ran itself (the advisor), each with id, name, input, start, end.** **Observability + mod-platform lens: HIGH.** Direct fit for mods that want to see what the advisor pattern did.
- Added `agentId` to the `tool.check` event of plugin hooks (hook can tell subagent's permission check from main session's).
- Added `ceiling` to question/verdict a mod's `tool.check` hook reads (names the approval an org requires for a tool).
- Added `ThemeKey` + `Color` types to plugin hooks typings.
- Added to `claude plugin validate`: each gating-site hook listed with whether it has a `.catch` (`gatingHooks` under `--json`).
- Added Deny button to Claude apps gateway's sign-in approval page.
- **Added `claude attach <name>` and `claude logs <name>`: part of a session name works in place of id.** **UX: HIGH.** Direct fit for Strandworks background daemons / `claude agents` fleet — human-friendly session targeting.
- **Added `/claude-api managed-agents-onboard <url>` to set up the Managed Agents pattern a page describes as `ant apply` files.** **Agent-team lens: HIGH.** Direct fit for the `claude-api` skill already listed as available in Strandworks.
- **Added `/claude-api managed-agents-onboard <quickstart-name>` to build a Console quickstart template, such as `deep-researcher`, with the `ant` CLI.** Same.
- Added warning when managed settings file is link to file outside managed settings folder.
- Added `/status` and doctor warning when managed settings ignore user-configured sandbox `allowRead` paths or allowed domains.
- Fixed requests failing behind proxies/gateways that reject one of Claude Code's beta headers.
- Fixed long sessions with hundreds of images getting stuck on "Request rejected as unprocessable by the model".
- Fixed turn ending at once when API's output content filter stopped reply while Claude was still thinking.
- Fixed resumed subagents and teammates losing their earlier thinking and prompt cache after receiving a message mid-run.
- **Fixed WebFetch silently dropping page text past 100,000 characters; it now says how much was unread and takes an `offset` to read on.** **Correctness: HIGH.** Direct fit for Strandworks scouts that WebFetch large pages (this one just did).
- Fixed crash ("Maximum call stack size exceeded") when response nested lists or quotes thousands of levels deep.
- Fixed `/rewind` not listing a prompt sent while Claude was still working.
- **Fixed scheduled tasks (`/loop` with an interval, reminders) silently not coming back on resume once the conversation was compacted; covers compactions made from this version on.** **Correctness: HIGH.** Direct fit for Strandworks `/loop`-based scheduled scouts (this one runs on `/loop`).
- **Fixed scheduled tasks set in the foreground never firing after a ← or `/background` hand-off, and recurring ones firing an extra run on every resume, respawn or fork.** Same.
- Fixed headless `--json-schema` runs exiting non-zero with `is_error: true` on `success` result when connection dropped after structured output was delivered.
- Fixed plan mode letting auto mode classifier approve non-read-only connector tools that carry server-pushed ask policy.
- **Fixed a project `CLAUDE.md`, rule or `AGENTS.md` symlinked outside the working directories loading under `permissions.blockReadsOutsideWorkingDirectories` or a `Read` deny rule.** **Security-adjacent: MEDIUM.**
- Fixed URL allow/deny patterns with wildcard inside `xn--` host label matching differently from one process to the next.
- Fixed MCP server provided by organization being relisted as your own after sign-in/reconnect.
- Fixed `/ultrareview` dropping uncommitted changes without warning on Windows + refusing them after `git add -N` file deleted/moved.
- Fixed `plansDirectory` setting's project-root check for paths that contain a backslash on macOS/Linux.
- Fixed replies in very long Remote Control/cloud sessions appearing a block at a time instead of streaming.
- Fixed background daemon's log passing terminal control chars to screen under `claude daemon run` / `claude daemon logs`.
- Self-hosted runner: Fixed crafted very long line of session's error output freezing runner for several seconds.
- Fixed plugin hook with `.catch` being unloaded + its `.catch` skipped when hook kept hooks worker busy on a prompt/tool call.
- Fixed mod's `turn.step` result listing tool call that mid-response model fallback had discarded.
- Fixed Cowork cloud session's reply sometimes never finishing when container restarted just after Claude sent a message/file.
- Fixed `claude plugin validate` + plugin loading refusing hooks module that destructures option named like one of its top-level functions.
- Fixed `/ultrareview` failing to upload uncommitted changes when `core.safecrlf=true` is set.
- Fixed effort level changing when flagged message is retried on fallback model with different level saved in settings.
- Windows: Fixed multi-line `!` shell blocks in skills/commands failing when file is saved with CRLF.
- Fixed Claude Code hanging until killed when `/permissions` tab was clicked while searching in fullscreen.
- Fixed conversation compaction sometimes failing with "null is not an object" error.
- Fixed plugin hooks reading empty `answer` on `turn.complete` for subagent that hands its report back in auto mode.
- Fixed mod being unloaded without message when refresh followed its failed reload.
- Fixed mod's `prompt.submit` hook that drops prompt after calling `next(e)` being ignored silently.
- Fixed mod's pane/band being redrawn without end when it followed its end over a tree that changed height at every drawing.
- **Fixed image read on macOS and Windows being able to return a file outside what was approved, through a link swapped in mid-read.** **Security-adjacent: HIGH.** TOCTOU on symlinks (variant appears in v2.1.292 for notebooks/PDFs).
- **Fixed case where user-installed mod could get an organization's plugin unloaded; the mod is now the one unloaded.** **Security-adjacent: MEDIUM.** Mod isolation.
- Fixed `disableClaudeAiConnectors` and `allowedMcpServers` URL rules not being applied to some MCP entries declared in `.mcp.json`, plugins or agents.
- Fixed mod's inline pane being redrawn without end when its tree changed height at every drawing.
- **Fixed `@`-mention under read block or `--restricted` being able to read file outside working directories through link changed mid-read.** **Security-adjacent: HIGH.**
- Fixed Esc in agents view confirming "Press enter again to restart this session".
- Fixed agent view losing background session's `/loop` run count, countdown and live status line after session enters worktree it creates.
- Fixed `claude agents` sessions in manual permission mode asking for approval to read image pasted into reply.
- Fixed deny/ask rule missing a command/path whose name came from variable set as prefix on `declare`, `typeset`, `export`, `readonly`. **Security-adjacent: HIGH.**
- Fixed Read deny rules not applying to image paths pasted/dragged into prompt, or to file names listed for @-mentioned folder.
- **Fixed case where user-installed mod could make an organization's guard skip its check; such a mod is now unloaded.** **Security-adjacent: HIGH.** Mod isolation.
- Fixed plugin hooks stalling each redraw when a mod draws long multi-line text holding non-Latin characters.
- Fixed repeated Ctrl+X in agents view deleting whole next section after bottom session of a section was deleted.
- Fixed You should know writing notes in English regardless of `language` setting.
- Fixed freeze after sending some very long messages.
- Fixed slowdown when expanding transcript (ctrl+o) or resizing over large tool output with non-ASCII (arrows, dashes, box-drawing).
- Fixed `claude respawn` re-sending earlier message to backgrounded session that has no saved transcript.
- Fixed Esc after `n:` or Ctrl+F search in agents view moving focus to section header where Ctrl+X twice would delete every session.
- Fixed `claude agents` saving slash command it couldn't deliver to a stopped session and then running it when session restarted.
- Fixed `/ultrareview` uploading uncommitted changes unfiltered for files under git filter driver named `unset`/`unspecified`.
- Fixed auto mode denials suggesting a permission rule that would skip classifier for whole tool or that Claude Code would ignore.
- Fixed `claude --teleport` and `/teleport` deleting files in folder that had replaced tracked file of same name when you chose to stash.
- Fixed `/chrome` "Reconnect extension" not restoring browser tools (anthropics/claude-code#98135).
- Fixed mods staying off for people who reach Claude through a gateway (`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`) and have no Anthropic account.
- Fixed replies sent from `claude agents` just after a background session crashed being refused after 2s (now retried for up to 12s).
- Fixed slash commands and multiple-choice answers `claude agents` couldn't deliver to a running session being saved and sent by themselves on restart.
- Fixed sandboxed commands that pipe a heredoc into another command asking for approval on every run.
- Fixed `claude agents` failing with "Couldn't restart the background service" and background sessions stopping after Homebrew upgrade.
- Fixed agent view's "restart this session fresh" re-sending earlier message.
- Fixed Bash permission checks auto-approving some read-only commands (`rg`, `git grep`) whose arguments shell would still expand as wildcards. **Security-adjacent: MEDIUM.**
- Fixed `claude plugin test` refusing to run after upgrade because of out-of-date saved setting.
- Fixed Bash permission checks auto-approving certain commands whose variable names zsh reads differently from bash. **Security-adjacent: MEDIUM.**
- Fixed short form of `git clone` option keeping sandbox exemption from `git *` pattern in `sandbox.excludedCommands`.
- Fixed first feature-flag request of session ignoring proxy/API endpoint set in project settings.
- Fixed `/ultrareview` of local branch silently leaving uncommitted work out of upload in repo that keeps branches outside `.git` (git 2.54+).
- Fixed cloud sessions staying asleep after container restart lost pending `/loop` wakeup or scheduled task.
- Fixed Claude apps gateway's retention sweep deleting a returning developer's identity row.
- **Fixed sandboxed Monitor tool commands skipping permission prompt under sandbox auto-allow.** **Security-adjacent: MEDIUM.**
- Fixed Claude apps gateway exiting with bare "Invalid URL" when `store.postgres_url` can't be parsed.
- Fixed background agents failing with "Agent stalled" and Workflow tool subagents restarting from their prompt when Mac woke from sleep.
- Fixed slow/failed startup since 2.1.285 under SDK hosts such as VS Code extension when managed settings deny reads of many paths on slow filesystem (Windows drives under WSL).
- Fixed response interrupted by computer sleep being treated as stalled stream on Bedrock, Vertex, Foundry, custom gateways.
- Fixed freeze before first request and in `/sandbox` Config tab on Linux/WSL when a sandbox read rule like `~/**/.env` covers a large folder.
- Fixed skills not being found when asked for by name in SKILL.md when folder has different name (e.g. non-English name).
- Fixed plan written in plan mode being lost when cloud session's container restarted before plan was presented.
- **Fixed plan mode not being restored when resuming a session with `--continue` or `--resume <session-id>` in the terminal.** **Correctness: HIGH.** Direct fit for Strandworks `--resume` discipline.
- Fixed Bash tool occasionally losing shell aliases/functions/plugin PATH entries for whole session when first command ran seconds after startup on new config dir.
- Fixed unbounded memory use when HTTP MCP server sends very large response.
- Fixed artifact operations failing in Claude Code run started from inside cloud session (e.g. `claude -p` from Bash tool).
- Fixed files sent from remote sessions sometimes being refused as "not the one approved" when four or more sent at once.
- Fixed marketplace named after another GitHub marketplace's download folder stopping that marketplace from downloading.
- Fixed automatic compaction giving up with "Prompt is too long" when Mac went to sleep while running.
- Fixed rewind menu (Esc Esc / `/rewind`) freezing for hundreds of ms per keypress when conversation contains very large pasted stack trace or source file.
- Fixed subdirectory's AGENTS.md not being attached when a file under it is @-mentioned.
- Fixed self-hosted runner sessions resumed after a stopped runner failing with "missing but already registered worktree" when sessions folder is relative symlink.
- Fixed freeze when secret scan or permission prompt met long token-like text.
- Fixed Bash permission checks not applying Read deny rules or outside-directory read block to wildcard in some option values of read-only commands.
- Fixed `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS=5m` being read as 5ms and cancelling remote dialogs at once.
- Fixed stall when MCP server's tool listing contains very long runs of combining characters.
- Fixed two pastes that overlap in one prompt being sent to the model partly as typed text.
- Fixed Claude in Chrome's browser picker showing a message meant for Claude when chosen browser is no longer connected.
- Fixed background subagents losing write and Bash access in their worktree after main session enters or exits a different worktree.
- **Fixed background commands, the agents view and daemon workers sending telemetry and a feature-flag request to Anthropic behind a Claude apps gateway when no managed settings on the machine force gateway login.** **Observability/privacy: MEDIUM.**
- Fixed `--restricted` (and `CLAUDE_CODE_RESTRICTED=1`) sessions opening the cross-session messaging socket.
- Fixed sessions moved to background while idle reopening as "no saved transcript" after restart.
- Fixed background workers honoring `--allow-dangerously-skip-permissions` on respawn without bypass-permissions disclaimer having been accepted. (Also in v2.1.287 — re-fixed in v2.1.290.)
- Fixed Claude replying in endless loop when a plugin's async Stop hook passes an unquoted script path under a folder with a space.
- Fixed freeze of several seconds when secret masking met very long unbroken text.
- **Fixed some permission rules and safety checks not being applied to a tool call after a PreToolUse hook rewrote its input.** **Security-adjacent: HIGH.**
- Fixed first launch asking to pick login method again after `claude auth login`.
- Fixed file names containing line breaks being displayed incorrectly in file tool errors + permission prompts.
- Fixed large paste expanded in place being sent to model as typed text after next keystroke when it held accents stored as separate characters.
- Fixed macOS `/login` reporting success when keychain refused new login + kept old one.
- Fixed SDK hosts using `--include-partial-messages` seeing reply stay open after turn ended when its stream was cut.
- Fixed sandboxed Bash on Linux running `ConfigChange` hooks and reloading settings mid-command when `.claude/settings.json`/`.claude/settings.local.json` doesn't exist.
- Fixed errors reading "Premature close" instead of naming the missing program (git, gh) when a tool Claude Code runs is not installed.
- Fixed `/loop` and other recurring session-only scheduled tasks running an extra time after sandboxed Bash command on Linux or after `.claude/scheduled_tasks.json` was deleted.
- Fixed edits to file a symlinked settings file points at running without settings-file permission question.
- Improved MCP startup behind network proxy: server proxy blocks (HTTP 403) is no longer retried three times.
- Improved permission prompts from background agents to show Ctrl+X Ctrl+K shortcut to stop all background agents.
- Improved built-in `plugin-authoring` skill: Claude now gives install command for mods you made + writes it in a README install section.
- Improved reply to `/plugin` in desktop app's Code tab.
- Improved Bash changed-files view when chained command includes `git merge`, `pull`, `checkout`.
- Improved Claude apps gateway log when upstream's cloud credentials or connection fail.
- Improved error shown when cloud session is started without claude.ai sign-in.
- Improved Read tool's message for binary files (now points Claude to a skill or shell command).
- Improved error shown when git config file stops `/ultrareview` upload (about half as long).
- Improved errors shown when `/ultrareview` upload refuses a checkout.
- Improved Claude apps gateway to log warning during last 30 days before cert expires.
- Improved Claude in Chrome: `browser_batch` call now gets 90s (was 60s).
- Improved Claude apps gateway's browser sign-in pages (brand fonts, centered, dark mode).
- Improved responsiveness while resuming large sessions (timers, input, rendering keep running).
- Improved `/` and `@` suggestion lists (selected row starts with ❯ pointer).
- Changed `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` to also skip startup connection warm-up.
- **Changed Claude in Chrome so that a project's settings files can no longer turn it on**; use `--chrome`, `/chrome`, or user settings. **Security-adjacent: MEDIUM.**
- **Changed Bash tool to ask for permission before running `pyright`, which is no longer treated as read-only.** Direct fit for Strandworks Python repos.
- Changed what mod's `$.process.spawn` rejects with when another mod denies it after child ran.
- Changed background daemon's log to write multi-line message as one JSON-quoted line.
- Changed skills and custom commands to refuse `!` shell command that contains raw control characters other than tab + newline.
- Changed `/artifacts`: opening artifact in browser now closes list.
- **Changed Bash permission checks so that more forms of `ps` command ask for approval instead of running without asking.** **Security-adjacent: MEDIUM.**
- Changed plugin hooks so long text is clipped and logged instead of being refused or dropped silently.
- Changed background sessions whose scheduled task is gone to move to Completed about 20s later.
- Changed "Press ← again" confirm on just-cleared prompt (no second-wait + holding ← now switches).
- Changed errors shown when `/ultrareview` upload fails at a git step (names step + what to try).
- Changed `/code-review` at medium effort to also report cleanup and CLAUDE.md convention findings on models without tuned review settings (incl. Opus 5.5 + Sonnet 5.5). **Direct fit for Strandworks** — `/code-review` already listed as available.
- Changed in-process teammate's `agent_id` in Agent results to its agent ID (`name@team` stays in `teammate_id`); TeammateIdle hooks no longer fire from subagents/forks.
- Changed background sessions waiting on scheduled wakeup (`/loop`) to be left running through updates and low memory.
- Changed `/model`, `/effort`, `/rename` sent from `claude agents` to busy background session to apply right away, without confirmation. **Direct fit for Strandworks**.
- Changed Claude apps gateway's minimum PostgreSQL version from 14 to 11.
- **Changed interactive session's WebSearch budget to refill over time (100 calls/hour; `CLAUDE_CODE_WEB_SEARCH_REFILLS_PER_HOUR` sets rate, 0 turns it off) instead of ending after 200 calls.** **HEADLINE — Cost + correctness lens: HIGH.** Direct fit for Strandworks scouts.
- Changed `CLAUDE_CODE_DISABLE_ATTACHMENTS` so repo `.claude/settings.json`/`.claude/settings.local.json` can no longer set it; shell/user/managed can.
- Changed `claude plugin update` on a plugin loaded from a directory to print just its reason, without "Failed to update plugin" prefix.
- Changed built-in `gh api` in cloud sessions: host other than github.com set in `GH_HOST`/`GH_REPO` now refused (use `--hostname` or full URL).
- Changed `claude-api` skill's Managed Agents examples to turn off web tools unless agent needs them and use `auto` permission policy. **Direct fit for Strandworks** — `claude-api` skill listed as available.
- Self-hosted runners: Changed `claude --environment <id>` to create session through current Sessions API.
- `[VSCode]` ~12 fixes incl. screen reader announcement when message queued; plugin marketplace review from Manage plugins dialog; blank chat keeping background process running; branch switch dialog offering to switch when it couldn't check for uncommitted changes; permission prompt arriving behind open dialog taking keyboard focus (**Security-adjacent: MEDIUM**).
- `[VSCode]` Changed message timestamps to show by default.
- `[Cloud sessions]` 4 fixes.
- `[Remote Control]` 1 fix.
- `[Claude Tag]` Added `!fast` to switch Slack thread to fast mode (moves to Opus if needed); `!fast off` to switch back; replies show `(fast)`.
- `[Claude Tag]` 7 Slack fixes.
- `[Code Review]` 2 fixes.

**v2.1.291 (2026-10-06)** — [changelog](https://code.claude.com/docs/en/changelog)
- Fixed regression in 2.1.290 where cloud sessions could drop answers to permission prompts.
- Fixed regression in 2.1.288 where last messages of a session could be lost when quitting. **Correctness: HIGH.**

**v2.1.292 (2026-10-06)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `--marketplace <source>` to `claude plugin install`: adds marketplace if needed (same policy checks as `claude plugin marketplace add`), then installs plugin from it.** **HEADLINE — Agent-team lens: HIGH.** Direct fit for scripted plugin deploys.
- **Added `effort` parameter to the Agent tool, so Claude runs a sub-agent at the effort level you ask for.** **HEADLINE — Cost + agent-team lens: HIGH.** Direct fit for Strandworks subagent flows — Explore / file-lookup / status-check subagents can run below parent effort.
- Added `CLAUDE_CODE_OVERLOADED_RETRY_BASE_DELAY_MS` to set longer base delay for backoff when retrying overloaded (529) requests. Cost lens.
- Added `prompt.autocomplete`, an event a mod hooks to add its own rows to the prompt box's autocomplete list.
- **Added prompt caching to `$.model.complete` for mods: `prompt` and `system` take blocks of text, and `cache: true` on a block caches request up to it.** **Mod-platform + cost lens: HIGH.**
- Added workflow agents to the `agent.spawn` mod hook, with their run and index, so a mod can refuse them.
- Fixed subagent definitions with `permissionMode: auto` entering auto mode when auto mode is unavailable (disabled by settings, circuit breaker, or model that doesn't support it). **Correctness: HIGH.**
- **Fixed sandboxed commands being able to read staged file copies of `/ultrareview` uploads under `~/.claude/seed-admin`.** **Security-adjacent: HIGH.**
- **Fixed managed sandbox read-deny path (and user ones beside it) that appears or re-points mid-session not dropping project grants inside it or ending credential injection from files it covers.** **Security-adjacent: HIGH.**
- **Fixed notebook or PDF read on macOS and Windows being able to return a file outside what was approved, through a link swapped in mid-read.** **Security-adjacent: HIGH.** (Images were fixed in v2.1.290; this closes the notebook/PDF variant.)
- **Fixed a tampered on-disk cache of server-managed settings being able to switch off or unseat the built-in policy plugin while settings fetch failed.** **Security-adjacent: HIGH.**
- **Fixed `rm -rf` on 8.3 short name or another alternate Windows spelling of home folder or drive not being treated as removing it.** **Security-adjacent: HIGH** (Windows only).
- **Security: Fixed PreToolUse hook approvals and auto mode bypassing permission prompt for file reads from network (UNC) paths.** **Security-adjacent: HIGH.**
- Fixed skill's/slash command's `allowed-tools` rule coming back in a later turn when you leave auto mode or plan mode partway through.
- Fixed `NO_PROXY` being ignored for Claude Code's own API requests when `HTTPS_PROXY` is set.
- Fixed MCP tool with name longer than 128 chars making every request fail (tool now left out + MCP error names it).
- Fixed `claude plugin` commands running before org's managed settings had loaded on first run.
- Fixed one-shot `claude -p` and Agent SDK runs stopping a background command 5s after final result + dropping scheduled wakeup. **Correctness: HIGH.** Direct fit for Strandworks `-p` jobs.
- Fixed plan mode not being restored when resuming session from `claude --resume` picker or `/resume`.
- **Fixed saved scheduled tasks created after `/resume`, `/branch` or `/clear` never firing, and saved tasks ignoring later creates and deletes after two writes to tasks file milliseconds apart.** **Correctness: HIGH.** Direct fit for `/loop` scheduled scouts.
- Fixed background session's `/loop` silently stopping when session process restarted (crash) because pending wakeup was lost. **Correctness: HIGH.**
- Fixed Grep and Glob reporting no matches when file/folder couldn't be read (now retries once or tells you).
- Fixed Read tool returning only first entry on PDF `pages` list like `"6,9,15"` (now returns error).
- Fixed @-mentioned text files over 256KB being left out silently (Claude now told file's size + to read it in portions). **Correctness: HIGH.**
- Fixed usage limit alert repeating once per background agent when agents failed on a limit that had already stopped main conversation.
- Fixed Remote Control viewers seeing empty subagent pane for background subagents in sessions hosted by desktop app or IDE.
- Fixed cross-session delivery notices showing two sessions with similar names as one recipient.
- Fixed Send-now in desktop app ending subagent a turn was waiting on when another message was already queued.
- Fixed `/bug`, `/share` and `/feedback <text>` starting over after Ctrl+O or Ctrl+Z while a report was being sent.
- Fixed `/remote-env` replacing your saved default environment when you pressed Enter right away.
- Fixed some pasted text reaching Claude as typed text when several pastes overlapped in one prompt.
- Fixed vim mode leaving cursor past end of line.
- Fixed `/add-dir` path box letting Shift+Enter or paste add line break.
- Fixed fast typing / IME text / decomposed accents being dropped while prompt footer row was selected.
- Fixed fullscreen mode sending full-screen clear on every window resize and Ctrl+L when iTerm2 detected (**direct fit for Strandworks** — Jonathan uses iTerm2 per prior scout note).
- Fixed spurious "could not be examined" note for @-words when Read deny rule set + working dir under symlink.
- Fixed "instruction file not loaded" lines going stale or missing after `/cd` or permission change.
- Fixed compaction summary that repeated `/name` letting Claude invoke a skill reserved for the user. **Security-adjacent: MEDIUM.**
- Fixed Write/Edit/NotebookEdit/LSP rows and single Read/Grep/Glob rows hiding why a mod denied the call.
- Fixed cloud session showing turn that never ended when worker stopped just as turn finished.
- Fixed cloud sessions with large transcript sometimes asking for permission again after it was approved.
- Fixed scheduled tasks + other queued notifications being lost in cloud sessions when message retried/edited while Claude was reading them.
- Fixed cloud sessions forgetting thinking setting chosen in client when container restarted.
- Fixed Cowork cloud sessions saying proxy blocked artifacts when Anthropic couldn't confirm org's settings.
- Fixed plugins whose hooks module makes many `$.state` calls through one const taking minutes to load/validate.
- Fixed `claude plugin validate` listing a matcher/state value for hooks module that engine reads from elsewhere.
- Fixed `claude plugin validate` listing `$.state` value read through top-level `var` that was declared again or reassigned (such module now refused).
- Fixed plugin's served `$` method restarting hook origin.
- Fixed plugin interface calls made while plugin hooks worker restarts running without hooks other plugins put on them.
- Fixed mod's `config.set`/`state.set`/`env.set`/`agent.spawn` hook that denies after calling `next(e)` being answered as refusal (now reported as failed, by name).
- Fixed `/theme`, `/config` Theme menu + first-run theme step saving theme before plugin's `config.set` hook was asked.
- Fixed plugin's `tool.check` hook answering allow running a tool that requires your answer (question, plan approval) without showing its dialog.
- Fixed mod's start-up prompt/command/subagent being queued twice when hooks worker was replaced.
- Fixed mod's hook that called `next(e)` and then failed while turn was interrupted letting call through (now rejected).
- Fixed plugin's prompt drop or setting deny being ignored when its reason was longer than 4096 chars.
- Fixed organization's plugin being unloaded on its own reload or after another plugin crashed when it returned `$` name that a user-installed mod had added (mod now unloaded instead).
- Fixed tool calls made while plugin hooks worker restarts being answered without plugins' permission hooks. **Security-adjacent: HIGH.**
- Fixed plugin `tool.call` hooks seeing some tool calls before misnamed parameters were repaired.
- Fixed mod's guard hook with `.catch` being skipped silently for calls another mod's hook makes beneath guard's own `$` call.
- Improved startup of `claude -p` and SDK sessions: first turn no longer waits for HTTP and SSE MCP servers to answer `resources/list`. **Direct fit for Strandworks scheduled scouts.**
- Improved rendering speed of long bulleted/numbered replies (stream + resize + re-open in transcript much faster).
- Improved Ctrl+C draft recovery: cleared prompt stays reachable with Up after slash command or sent message.
- **Improved hook output handling: `<system-reminder>` tags written in hook's output are escaped before they reach Claude.** **Security-adjacent: HIGH.** Prior: hook output could inject `<system-reminder>` prompt-injection payloads. Fixed. **Direct fit for Strandworks** — native-memory auto-load already got this treatment in v2.1.284; this closes the hook-output variant.
- Improved tool input handling: Grep accepts `file_path` for `path`; Write/WebFetch/Read ignore stray parameters.
- Improved steps shown when marketplace declared in settings has name that looks like official Anthropic marketplace.
- Improved sandbox auto-allow: with strict sandbox mode set in user/managed/`--settings`, interpreter command with env var prefix (`FOO=bar python3 app.py`) runs unprompted.
- Improved Artifact tool's listing: Claude now sees how many published artifacts you have + can list up to 200 at once (was 50).
- Improved cloud sessions after restart: Claude told which stopped background agents it can resume by id.
- Improved Claude in Chrome message in claude.ai cloud sessions when browser can't be reached.
- Improved `/focus` tip to invite trying focus view mid-turn.
- Improved startup with local (stdio) MCP servers that ignore newer protocol check: after one slow connect, remembered for 7 days + connected the older way without wait.
- **Changed local (stdio) MCP server connections to negotiate protocol version 2026-07-28 by default on every install, including Bedrock, Vertex and Foundry**; `MCP_PROTOCOL_NEGOTIATION=legacy` opts out. **Direct fit for Strandworks** MCP servers (Linear, Supabase, Notion, Gmail, Telegram, Chrome, Blender).
- Changed `claude plugin test`: failed `expect` inside hook test registered, or stub answer engine refuses, now fails test instead of passing silently.
- Changed usage limit messages to write claude.ai settings links with `https://` so terminals + apps can make them clickable.
- Changed scheduled and Run-now routine runs to publish new artifact only you can see without asking for approval.
- Changed agent names to allow at most 256 characters.
- `[Cloud sessions]` 4 fixes.
- `[Remote Control]` 1 fix.
- `[Claude Tag]` ~8 Slack fixes/improvements/changes.
- `[Code Review]` 3 fixes.

### Anthropic Platform

- **[Claude for Google Workspace (public beta, 10/6)](https://claude.com/resources/articles/claude-now-works-in-google-docs-sheets-and-slides)** — sidebar add-on in Docs/Sheets/Slides (read + edit; Sheets writes formulas/pivots/charts + Python data processing; Slides generates slides from existing layouts). Plus three connectors (Docs, Sheets, Slides) for the Claude apps that let Claude create/edit Google files from chat. Available on all paid Claude plans. Team/Enterprise owners must enable connectors first. Access matches existing Google sharing permissions. **Agent-team lens: LOW** (Strandworks substrate is `.md` + Linear + Supabase, not Google Docs). **Product-build lens: LOW** (not a MedSim-Game surface). [9to5Google writeup](https://9to5google.com/2026/10/06/claude-google-docs-sheet-slides/).
- **[Expanded Cyber Verification Program (10/6)](https://www.anthropic.com/news/cyber-verification-program)** — three access tiers (Defense / Red Team / Specialized) that unlock advanced Claude cyber capabilities with reduced blocking classifiers for vetted security pros. Project Glasswing partners (Comcast, Booz Allen) reported 129,000+ verified vulns April–July 2026. Real-time blocks for physical-harm or mass-disruption remain across all tiers. **Agent-team lens: NOT APPLICABLE** (solo-dev threat model). **Product-build lens: NOT APPLICABLE** currently; could matter if MedSim-Game ever adds HIPAA audit surface.
- **[Claude Frontier Academy (10/2)](https://www.anthropic.com/news/claude-frontier-academy)** — $100M to train 10,000 Frontier Deployed Engineers (FDEs) by end of 2027. In-person bootcamp + 12-week residency leading a Claude project at engineer's home organization. Invitation-only through Accenture, Bain, Deloitte, McKinsey, Morgan Stanley. First badges early 2027. **Agent-team lens: NOT APPLICABLE** (solo, not nominated through a partner firm).
- **[Barclays scales Claude (10/1)](https://www.anthropic.com/news/barclays-scales-claude)** — customer story. 50% of Barclays devs on Claude Code by end-2026, majority in 2027. 16,000+ on Colleague Knowledge Assistant (RAG). 120,000 emails/day in Global Markets routed via Claude. **Not a platform change.**
- **Opus 4.7+ and Fable 1M context default on Bedrock/Vertex/Foundry/Claude apps gateway (10/1)** — see Claude Code v2.1.287 bullet.
- **Agent SDK pricing: Anthropic paused the API-rate billing change** that had been described previously on the billing support page. Agent SDK stays on the earlier billing model. **Cost lens: HIGH.** Direct fit for every Strandworks workflow using the Agent SDK.

### MCP Ecosystem

- **MCP spec: no new revision in-window.** Current revision remains 2026-07-28 (shipped before this scout window — stateless transport, Tasks + Apps as first-class extensions, authorization hardening).
- **MCP TypeScript + Python SDKs crossed 1B total downloads** (reported in-window). Context, not a shippable Strandworks change.
- Claude Code v2.1.292 changed local stdio MCP server connections to negotiate protocol version 2026-07-28 by default on every install, including Bedrock/Vertex/Foundry; `MCP_PROTOCOL_NEGOTIATION=legacy` opts out. **Direct fit for Strandworks MCP servers.**
- **No new MCP servers in the official Anthropic catalog or major community catalogs in-window.**
- Ruby SDK 1.0 shipped (reported in-window; actual ship was earlier — flagged because v1.0 = stable public API, breaking changes gated behind majors). Not relevant to Strandworks (not a Ruby shop).

### Agent Patterns + Best Practices

- **No Anthropic engineering blog post in-window** (eighth consecutive week with no post). Most recent engineering posts remain from August 2026.
- **Claude Mods establishes a new "programmable extensibility layer" pattern.** Expect community guidance to accumulate over the next few weeks. [DEV community overview](https://dev.to/max_quimby/claude-code-mods-just-turned-agents-into-a-platform-5gc0), [Superpowerdaily analysis](https://superpowerdaily.com/posts/anthropic-adds-claude-code-mods-that-can-rewrite-prompts-and-replace-built-in-features), [Minssam deep-dive](https://www.minssam.com/en/blog/2026-10-02-claude-code-mods-typescript-plugin-system/).
- **"You should know" pattern** (companion built-in mod) formalizes the "second agent watches the first" pattern that previously required custom hook plumbing.
- **Claude Code Projects (beta since 9/17, context)** — one project coordinates parallel threads + shared memory. Still Pro/Max cloud-sessions beta as of 10/7. [Projects redesigned article](https://claude.com/resources/articles/projects-redesigned).

### Adjacent Tooling

- Nothing in-window materially shifts the workflow comparison vs Claude Code. Cursor / Aider / Codeium / Continue: no releases that change their positioning this week. Open-source agent frameworks: no major shifts.

## Recommended Actions

1. **Upgrade Claude Code to v2.1.292** (6 in-window releases). Direct fit for every Strandworks `claude` session.
2. **Enable "You should know" built-in mod** in a flagship session for a trial: `/plugin enable cc-plugin-you-should-know@builtin`. If it catches a drift or a mistake over a week, keep it on by default. **Direct fit for Strandworks** autonomous long-session work.
3. **Try `Agent({ effort: "low" })` on Explore + verify + file-lookup subagents** that don't need the parent effort. Direct cost savings on routine delegations. New in v2.1.292.
4. **Set `CLAUDE_CODE_WEB_SEARCH_REFILLS_PER_HOUR`** to a value that matches scout cadence (default 100/hr). Scout flows that do many searches now refill instead of hitting a hard 200-cap. New in v2.1.290.
5. **If Strandworks uses Bedrock/Vertex/Foundry/gateway**, confirm Opus 4.7+ / Fable are using 1M context by default (no `[1m]` suffix). Set `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` only if a gateway caps at 200K. New in v2.1.287.
6. **Audit `~/.claude/agents/*` subagent definitions** that use `permissionMode: auto`: v2.1.292 fixed a correctness bug where they'd enter auto mode when auto mode was unavailable. Verify behavior matches intent after upgrade.
7. **Verify the native-memory setup** against the auto-memory ← / → fixes (v2.1.287 `/memory` arrow keys) and the hook-output `<system-reminder>` escaping (v2.1.292). Both are direct fits for the native-memory migration from 2026-06-17.
8. **Reconfirm Agent SDK cost projections**: Anthropic paused the Agent SDK → API-rate billing change. Any budget planning done assuming the switch should be revised. Cross-ref Bouren Plan §1.
9. **Review `claude-api` skill setup** — v2.1.290 added `/claude-api managed-agents-onboard <url>` + `<quickstart-name>` and updated the skill's Managed Agents examples to turn off web tools unless needed and use `auto` permission policy. **Direct fit** for the `claude-api` skill listed as available.
10. **Consider trialing a one-off Claude Mod** that strips secrets from tool output before Claude reads it, or that adds a MedSim-Game-specific permission layer around Supabase MCP calls. Low risk, high learning value for the mod platform's product-build fit.
11. **Delay evaluating Claude Code Projects (beta)** until it exits Pro/Max cloud-sessions beta and lands local execution. The redesign is promising but Strandworks runs local, not cloud-session-first.
12. **Skip Claude for Google Workspace unless Google Docs becomes a surface** — Strandworks substrate is `.md` + Linear + Supabase.

## Pricing / Cost Watch

- **No model price changes in-window.** Sonnet 5.5 remains $2/$10 per MTok (cache reads $0.20/MTok, batch 50% off). Opus 5.5 remains $4/$20. Fable 5.1 at $10/$50 (cache reads 75% cheaper than Fable 5).
- **Agent SDK stays on earlier billing model** — Anthropic paused the API-rate switch. **Cost lens: HIGH.** Any Bouren Plan §1 monthly AI line that assumed the switch should be revised downward.
- **WebSearch budget now refills over time** (default 100/hr) instead of ending at 200 calls per session. **Cost lens: positive** for high-WebSearch workflows (this scout being one).
- **1M context default on Opus 4.7+/Fable on Bedrock/Vertex/Foundry/gateway** — context tokens at Opus-tier rates can add up fast; set `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` if gateway work doesn't need it.
- **`Agent({ effort: "low" })`** gives finer-grained cost control over delegated work.
- **Agent SDK `claude -p` + background jobs**: v2.1.290 fixed `CLAUDE_CODE_RETRY_WATCHDOG` retrying for hours after a very long response stream failed. **Cost lens: HIGH** — this closes a cost-escalation path.
- Pro/Max plan pricing unchanged ($20 Pro monthly, $17 annual; $100/$200 Max).

## Nothing New (Watchlist)

- **MCP spec next revision after 2026-07-28** — no update in-window.
- **Anthropic engineering blog** — eighth consecutive week with no new post.
- **Claude Code Projects redesign** — still Pro/Max cloud-sessions beta (shipped 9/17); local execution + Cowork integration + Team/Enterprise still "coming."
- **Agent SDK API-rate billing** — paused this week; watch for whether it stays paused or restarts.

## Parked Idea Unblocks

No parked ideas unblocked this week. Review of all 28 entries in `_ops/idea-vault/`:
- Of the 27 non-template entries, blockers are overwhelmingly market/time/money (MedCapture-flagship-gated or Strandworks-focus-gated) rather than Claude capability gaps.
- The two technology-blocked entries (`ai-multiview-video-generator`, `haptic-mirror-d4rt`) are blocked on external capabilities (Google Genie 3 multi-view export API; validated procedure + customer for VR training scene) that Claude Mods / Google Workspace / 1M-context / WebSearch-refill don't address.
- The one small-spec entry (`telegram-inline-keyboard-question-protocol`) is blocked on build time, not external capability.
- Claude Mods could in principle support `telegram-inline-keyboard-question-protocol` as a reference-platform choice for the daemon ↔ outbox handoff, but that's not an unblock — it's an implementation option alongside existing choices.
