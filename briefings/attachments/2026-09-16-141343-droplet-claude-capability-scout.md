---
name: Claude-Capability Scout - 2026-09-16
description: 7-day window (9/10–9/16). **Headline #1 (agent-team + product-build lens): Messages API on-demand compaction ships to beta (9/14, `compact-2026-09-04` header)** — send a top-level `compaction` parameter, get back a signed `compaction` block that summarizes prior messages; replay that block in later requests in place of those messages. Choose when to compact, run it in the background, keep recent turns verbatim after the summary, thinking blocks in the kept turns stay valid on models with preserved thinking. First-party primitive for context-length management on the Claude API — direct fit for any Strandworks-built long-running agent (MedSim backend agents, custom scout tooling, extended chat surfaces). **Headline #2 (agent-team lens): `omitClaudeMd` in agent frontmatter + `--agents` JSON (v2.1.271, 9/14)** — custom and plugin subagents can now opt out of user/project/local CLAUDE.md files; managed-policy files still load. **Direct passive-context savings for every Strandworks subagent that doesn't need the 100-line portfolio CLAUDE.md** — scout, code-review, security-review, verify. Every skipped CLAUDE.md is bytes off every turn's prefix. **Headline #3 (security lens): Per-command `allowed_domains` for Bash/PowerShell/Monitor in auto mode with sandboxing (v2.1.271, 9/14)** — Claude declares the hosts a command needs; auto mode reviews the host list with the command, opens the network only for those hosts, refuses others. Prior: Bash + net-access was all-or-nothing per session; net now scoped per-command. **Direct fit for Strandworks Bash flows that curl known hosts (Supabase, R2, GitHub, Vercel).** **Headline #4 (agent-team lens): Managed Agents `auto` permission policy + `ant beta:sessions connect` (both 9/10)** — `auto` = server evaluates each agent/MCP tool call and runs, denies, or pauses for approval, with `evaluation` field on `agent.tool_use` + `agent.mcp_tool_use` events. `ant beta:sessions connect` attaches a local terminal to a running Managed Agents session for live monitoring, message-sending, and tool-call approvals (`--web` flag serves the Console viewer locally). Not-today (Strandworks not on Managed Agents) but bookmark for the MedSim-Game backend-agents build stage. **Headline #5 (agent-team + cost lens): `claude plugin eval` (v2.1.269, 9/11)** — run a plugin's eval suite against Claude Code + get scored, reproducible JSON+HTML results. Direct fit for Strandworks plugin-authoring pattern (any `.claude/plugins/*` bundle can now be regression-tested end-to-end). **Also this window:** six Claude Code releases (v2.1.268, .269, .270, .271, .272, .273); MEMORY.md truncation warning now names cut-count + start-line (v2.1.268 — direct fit for `MEMORY.md` 200-line cap); several silent prompt-cache leak fixes (advisor tool 2x context miscount → premature auto-compact; resume-after-mid-thought interruption; output-token-cutoff resume; `/login`/`/upgrade` discarding thinking); Bash permission-checker bypass patches (subshell-hides-rm in bypass, `env -C`/`eval` bypass, wildcard-expand bypass, cd+git chain bypass under `blockReadsOutsideWorkingDirectories`); symlink deny-rule fix (`/etc` `/tmp` `/var` on macOS); TaskCreate/TodoWrite scoped to Claude 3.x/Opus 4.0-4.7/Sonnet 4.0-4.6/Haiku 4.5 (`CLAUDE_CODE_ENABLE_TODO_TOOLS=1` to enable elsewhere); WebFetch deny/ask rules no longer apply to Artifact reads (migrate to `Artifact` rule); `--accept-command <sha256>` for plugin install cryptographic accept. **No new models.** **No new MCP servers or spec updates.** **No engineering blog post** (fifth consecutive week). **No parked ideas unblocked this week.**
metadata:
  type: report
project: _ops
status: report
---

# Claude-Capability Scout - 2026-09-16

Weekly window: 2026-09-10 → 2026-09-16 (7 days; prior scout ran Wednesday 2026-09-09). Six Claude Code releases in-window (v2.1.268, .269, .270, .271, .272, .273); two Claude Platform release-note days (9/10 + 9/14); one Anthropic-blog post (9/10 threat-intelligence — no capability content). Flagship remains **MedSim-Game** per `/PROJECTS/CLAUDE.md`.

## Releases This Week

### Claude Code

**Six versions shipped in-window (v2.1.268 → v2.1.273).** Two structural headlines: `omitClaudeMd` subagent-frontmatter opt-out (v2.1.271) + per-command Bash `allowed_domains` in auto mode w/ sandboxing (v2.1.271). One direct diagnostic headline: `claude plugin eval` (v2.1.269). Several silent prompt-cache leak fixes tightening the pattern that landed 9/2-9/9 (advisor 2x miscount, resume-after-mid-thought, output-token-cutoff resume, `/login` discarding thinking).

**v2.1.273 (2026-09-15)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `x-claude-code-request-class`, `x-claude-code-agent-type`, `x-claude-code-prev-tool-durations`, `x-claude-code-compaction`, `x-claude-code-context-compacted` request headers for LLM gateways; opt in with `CLAUDE_CODE_GATEWAY_HINT_HEADERS=1`.** Enterprise/gateway-adjacent. Not applicable to Strandworks direct-API path.
- **Added a notification when an MCP server disconnects mid-session and automatic reconnection gives up, pointing at `/mcp`.** **Agent-team lens: MEDIUM.** Prior: silent MCP dropout after N reconnect attempts. New: explicit notification + `/mcp` pointer. Direct fit for any Strandworks MCP that flakes mid-session.
- **Added forking a session started with `claude --remote-control` or `/remote-control` from the Claude app; the fork runs as a background session on your computer.** Direct fit for Remote-Control-from-phone flow if used.
- **Fixed Bash commands the permission checker cannot fully analyze skipping the prompt under `permissions.blockReadsOutsideWorkingDirectories`, and a subshell hiding a dangerous `rm` in bypass mode.** **HEADLINE — Security-adjacent: HIGH.** Prior: `sh -c "rm -rf $1"` and unanalyzable Bash lines bypassed both the block-reads-outside guard and the bypass-mode dangerous-rm prompt. New: caught. Direct fit for Strandworks Bash flows using bypass mode.
- **Fixed skills synced from claude.ai staying available after your organization turns Skills off; they now move to the recoverable trash.** Enterprise.
- **Fixed `allowManagedMcpServersOnly`, `deniedMcpServers`, `disableClaudeAiConnectors` set via MDM/`managed-settings.json` being ignored when server-managed settings also present.** Enterprise.
- **Fixed 401/403 on Bedrock/Vertex/Foundry + Claude apps gateway 403s to name the credential to refresh or point to the gateway admin, instead of a generic "run `/login`".** Enterprise observability.
- **Fixed `/login`, `/upgrade`, `/extra-usage` discarding earlier thinking from the conversation, which forced a full prompt-cache rewrite on the next request.** **HEADLINE — Cost lens: HIGH.** Prior: any of these three commands mid-session dropped preserved thinking blocks → next turn's request prefix changed → cache miss. Fixed. Direct fit for Strandworks: `/upgrade` and `/login` are common mid-session, both silently punched a cache hole.
- **Fixed auto mode stopping for approval when Artifact tool uploads a file you attached to the chat in a cloud or Remote Control session.** Correctness — Artifact + auto-mode friction fix.
- **Fixed a long-running session recreating a stub `.git/info/exclude` after the repository's `.git` directory was removed or moved away.** Direct fit for portfolio-of-repos flow that renames/moves `.git`.
- **Fixed the main prompt dropping a `!` typed at the start while already in shell mode**, so negated commands like `! grep …` can be typed. UX/shell-mode fix.
- **Fixed Read on macOS refusing a dragged-in screenshot, or any file the system reports under a second path, with "symlink resolution changed after permission was checked".** **Direct fit for Strandworks macOS drag-in-screenshots-to-Claude flow.** Prior: symlink race → refusal. Fixed.
- **Fixed `permissions.blockReadsOutsideWorkingDirectories`: a memory directory chosen by a repository's settings is no longer loaded into the prompt, recalled, indexed, or used by memory extraction.** **HEADLINE — Security-adjacent: HIGH.** Prior: memory dir set at project scope could leak into prompt even when path was outside the blocked working dirs. Fixed. Direct fit for Strandworks if `blockReadsOutsideWorkingDirectories` is ever set at repo scope with a project memory dir outside the working set.
- **Fixed sub-agents + background agents being reported as failed, with their result never delivered, when the final streamed reply omitted token usage or carried no model id.** **Agent-team lens: HIGH.** Correctness fix — silent-drop of subagent results on malformed final message. Prior: full subagent report lost on flaky-provider final frame. Fixed. Direct fit for Strandworks scout / babysit / code-review subagent flows.
- **Fixed the context meter + auto-compact counting advisor-tool turns at ~2x their real context size, which made auto-compact fire at ~half the real window.** **HEADLINE — Cost lens: HIGH.** Prior: any Strandworks session using an advisor model saw auto-compact fire at ~half the real 1M/200K window → premature summary + cache-hole. Fixed. Effective context depth roughly doubles on advisor-using sessions.
- **Fixed `/tui` refusing to restart because of an agent-team teammate that had already finished its work and was no longer shown in the agents panel.** Direct fit for Strandworks agent-team pane flow.
- **Fixed saved scheduled tasks running in the wrong session after `.claude/scheduled_tasks.json` was copied into another folder, such as a new worktree.** **Agent-team lens: MEDIUM.** Direct fit for Strandworks worktree pattern — if `.claude/scheduled_tasks.json` ever got copied into a worktree, its tasks were pointing at the wrong session. Fixed.
- **Fixed SDK + `--output-format stream-json` output dropping a subagent's remaining messages + final report after it moves to the background mid-run (e.g. via `CLAUDE_AUTO_BACKGROUND_TASKS`).** Correctness — direct fit for SDK-driven flows.
- **Fixed `/install-github-app` reporting a SAML single sign-on block as "admin permissions required".** Correctness.
- **Fixed Remote Control clients attached to a Claude Desktop / VS Code / JetBrains session being refused when they ask for the session's context window usage.** Direct fit for Remote-Control-from-phone attach flow.
- **Fixed the spinner showing a doubled ellipsis ("……") on compaction status lines** (e.g. "Running PreCompact hooks…"). UX.
- **Fixed a false-positive spinner tip suggesting the frontend-design plugin after reading or publishing Artifacts.** UX.
- **Reverted a 2.1.268 change that checked Read/Edit deny rules on Bash lines the permission checker can't analyze (`eval`, `env -C`);** commands like `time -p make build` prompt again instead of being denied. **Correctness regression-fix.** If Strandworks noticed spurious permission-denials on `time -p …` or similar starting 9/10, this is the fix.
- **Improved responsiveness in long sessions**: hook progress + sub-agent activity no longer re-process the whole conversation on every update. **QoL — direct win for long Strandworks sessions with agent-team panes + hooks.**
- **Improved the Artifact tool's error when a publish includes a file type artifacts don't serve**: names supported types + what to do instead; terminal shows one plain line. UX.
- **Improved the Artifact tool's page read to state the capabilities + database rules the artifact service holds for the page**, for anyone who can publish to it. Observability.
- **Improved artifact database writes**: an update can now remove a single field instead of rewriting the whole document. Perf/cost minor.
- **Improved artifact publishing**: a publish whose connection drops after reaching claude.ai is re-sent safely instead of failing or creating a duplicate. Correctness.
- **Improved the cloud-session GitHub error for an IP allow list / suspended app installation / SAML SSO to show the cause instead of a generic install hint.** Enterprise observability.
- **Improved `/autofix-pr`**: when `gh pr view` fails it shows gh's own error (sign-in, SAML, rate limit) instead of a generic exit-code line; also names why GitHub webhook delivery couldn't be set up for the PR. Direct fit if Strandworks uses `/autofix-pr`.
- **Improved `/web-setup` errors**: a refused GitHub token now lists likely reasons + fix; connection failure names a configured proxy or TLS certificate problem. Enterprise.
- **Improved the in-session SSL cert + proxy connection errors to name the error code + what to fix**, such as `NODE_EXTRA_CA_CERTS` for an untrusted corporate CA. Enterprise.
- **Improved the error when a cloud session can't be created because your Claude login expired or was revoked**: says to run `/login`. Correctness.
- **Improved the error shown when an MCP server's sign-in expires mid-session to say `/mcp` to re-auth.** **Agent-team lens: MEDIUM.** Direct fit for Strandworks MCP servers with expiring OAuth.
- **Changed auto mode on Bedrock/Vertex/Foundry to use the local classifier by default for now**; set `CLAUDE_CODE_AUTO_MODE_SERVER=1` to use the server-side classifier. Enterprise/platform.
- **Changed `OTEL_LOG_TOOL_DETAILS=1` to also include real agent, skill, plugin, and MCP server names on cost + token metrics.** Enterprise observability.
- **Changed sign-in with a Claude account to also request access to your claude.ai plugins.** Auth scope change.
- **Changed `/bug` + `/feedback` reports to include only model-behavior params (model, system prompt, tools) from the last API request, omitting request metadata + `CLAUDE_CODE_EXTRA_BODY` fields.** **Security-adjacent — cred hygiene: MEDIUM.** Prior: `/bug` reports could leak `CLAUDE_CODE_EXTRA_BODY` (which may hold auth headers or per-org config). New: stripped.
- **[VSCode]** "Report a problem" no longer appears + `/bug`/`/feedback` no longer opens a form when org has product feedback disabled. Enterprise.
- **[VSCode]** Fixed a red "Claude Code process exited with code 4294967295" banner appearing after completed turns on Windows. Windows-only.
- **[Windows]** Improved the network-path permission check for UNC paths when a mapped network drive was added with `--add-dir`. Windows-only.
- **[Claude Code on the Web]** Routine access to org connectors fix; self-hosted environment creation fix; admin "Share cloud sessions" setting moved under Data and privacy; "Discard unsaved changes?" confirmation on New/Edit routine; removed full-page desktop-download screen for new users w/o cloud env; routine detail page reorganized. Web-only.
- **[Claude Tag / Slack]** ~10 fixes (Enterprise Grid disconnect edge case, scheduled tasks in shared private channels, older-thread replies not restarting mid-task work, account token refresh edge case, AWS region-less endpoint sign-in, OAuth lowercase token type, Enterprise Grid shared channel manager, related-channel auto-watch, admin memory page listing self-set channels). Slack-only.
- **[Code Review]** Merge-base push after "Additional findings" review no longer triggers full re-review (gets lighter follow-up); whole REVIEW.md no longer ignored due to @-mention/code-span-wrap/backticked-HTML; suggested-fix output improvement; second-location comment full-sentence fix; `/ultrareview --post` retry-safety fix; empty/identical pushes on capital-letter repos no longer re-reviewed.

**v2.1.272 (2026-09-15)** — Bug fixes and reliability improvements. Rollup.

**v2.1.271 (2026-09-14)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added fast mode in Claude Code Remote sessions (cloud + self-hosted runners)**: host's fast-mode setting or `/fast` typed in-session applies where org allows. Not applicable to Strandworks direct-terminal use.
- **Added mouse support to the `/config` panel in fullscreen mode**: wheel scrolls, click on a value changes it, row-under-pointer highlighted. QoL for `/config` navigation.
- **Added `claude self-hosted-runner --drain-marker-file <path>`**: file existence at SIGTERM drain marks it as a host drain (telemetry). Enterprise.
- **Added per-command `allowed_domains` to Bash, PowerShell, and Monitor in auto mode with sandboxing**: hosts a command needs are reviewed with it + opened for it alone; other hosts refused. **HEADLINE — Security-adjacent: HIGH.** Prior: Bash net-access in auto mode was per-session all-or-nothing. New: per-command declared + reviewed + scoped. **Direct fit for Strandworks Bash flows that curl known hosts** — Supabase (`brecweskqoiagnuzcmyr.supabase.co`, `bniuiwbwumpymxiesyyt.supabase.co`), R2 (`medsim-assets.r2.cloudflarestorage.com`), GitHub API, Vercel, Cloudflare, Linear API, Telegram Bot API. Set of hosts is small + well-known — this feature enforces "you don't get to also reach anywhere else."
- **Added `omitClaudeMd` to agent frontmatter + `--agents` JSON**, letting custom + plugin subagents run without user/project/local CLAUDE.md files; managed-policy files still load. **HEADLINE — Agent-team lens: HIGH.** Prior: every custom or plugin subagent inherited the full 100-line portfolio `/PROJECTS/CLAUDE.md` + any project-scope `CLAUDE.md` + any local overrides. Byte-count of that inheritance is nontrivial per turn. New: opt out per-agent. **Direct fit for Strandworks scout/code-review/verify/security-review subagents that don't need portfolio doctrine** — MedSim-flagship framing, tier list, HITL rules are irrelevant to (e.g.) a security-scanner subagent inspecting a single file. Add `omitClaudeMd: true` to the frontmatter of any subagent whose task is self-contained. Measure via `/context` before + after.
- **Added `--accept-command <sha256>` to `claude plugin install` + `claude plugin update`** to accept exactly the command a previous `--json` run displayed, instead of `-y`. **Security-adjacent: MEDIUM.** Prior: `-y` blindly accepts whatever install command comes down. New: cryptographic pin to the pre-reviewed command. Direct fit if Strandworks pipes plugin installs through CI or an automated flow.
- **Added support for a `multiplier` above 1, up to 10, in the `modelPricing` managed setting + Claude apps gateway `pricing` block**, for marked-up internal chargeback rates. Enterprise.
- **Added a spinner tip pointing Bedrock/Vertex/Foundry/LLM-gateway users to the Claude desktop app**; the claude.ai desktop app tip now suggests `/desktop` which offers to download. Onboarding.
- **Fixed a cached org policy being reused after switching accounts/orgs/API keys**, + policy not refreshing until hourly check on credential change mid-session. Enterprise.
- **Fixed the tool + command lists not updating when the org policy finishes loading after startup or changes mid-session.** Enterprise correctness.
- **Fixed an enterprise `managed-mcp.json` that can't be read/parsed being ignored**: now keeps exclusive MCP control (user/project/plugin servers don't load) + warns at startup. Enterprise.
- **Fixed org policy being fetched through, and rejected by, third-party local proxies set via `ANTHROPIC_UNIX_SOCKET`**; treated like other custom gateways again, including for Remote Control. Enterprise.
- **Fixed cloud sessions rejecting every subagent tool call ("updatedInput failed schema validation") when a workflow/agent approval applied after the session's worker restarted.** Cloud correctness.
- **Fixed `/fast off` answering "Fast mode unavailable" instead of turning fast mode off when org has fast mode disabled.** Correctness.
- **Fixed sessions started with `CLAUDE_CODE_SKIP_FAST_MODE_ORG_CHECK` re-sending fast requests every turn after the API rejected fast mode**; rejection now stands, reason shown. Enterprise.
- **Fixed fast mode under `CLAUDE_CODE_RETRY_WATCHDOG` failing the turn on a usage-credits limit, or retrying an overload at fast speed**, instead of falling back to standard speed. Cost/retry correctness.
- **Fixed Bash permission checks missing the file that `fmt`, `column`, and similar commands read when it follows an option the checker doesn't recognize.** **Security-adjacent: MEDIUM.** Prior: permission-scope bypass via unrecognized-option-then-path. Fixed.
- **Fixed Bash permission checks skipping files a wildcard expands to when the wildcard sits in a command's pattern or option value** (e.g. `grep -v dir/* file`). **Security-adjacent: MEDIUM.** Prior: wildcard-in-option bypassed scope check. Fixed.
- **Fixed Bash permission checks so that shell variable declaration flags cannot misrepresent the command being run.** **Security-adjacent: MEDIUM.** Prior: `declare` / `local` / `readonly` flag combos could rewrite the analyzed command. Fixed.
- **Fixed Bash commands with two directory changes, a subshell, or a `cd`+`git` chain skipping the prompt under `permissions.blockReadsOutsideWorkingDirectories` in bypass + auto mode.** **HEADLINE — Security-adjacent: HIGH.** Prior: `cd /elsewhere && git log` under `blockReadsOutsideWorkingDirectories` bypassed the block in auto/bypass mode. Fixed. Direct fit if Strandworks ever sets `blockReadsOutsideWorkingDirectories`.
- **Fixed a stale `.git/config.lock` breaking `git checkout -b`, `git push -u`, `git config` for the rest of a session after a sandboxed command failed to start (Linux).** Linux-only correctness.
- **Fixed settings file changes made outside the session going unnoticed on macOS machines whose system file-event service is saturated**; watcher falls back to polling. **Direct fit for Strandworks macOS** — if `settings.json` edits from another window ever seemed to not stick, this is the fix.
- **Fixed resumed `claude -p` sessions whose tools all come from MCP servers failing with "At least one tool must have defer_loading=false".** Direct fit for MCP-only headless sessions.
- **Fixed turns failing with "API returned an empty or malformed response" when an LLM gateway returns the non-streaming reply as `text/plain`.** Enterprise/gateway.
- **Fixed sustained high CPU usage + repeated tool-list requests when an MCP server sends `list_changed` notifications in a tight loop.** **Agent-team lens: MEDIUM.** Correctness — direct fit if any Strandworks MCP server (Chrome, Blender, etc.) ever fires `list_changed` in a loop.
- **Fixed MCP OAuth mishandling client registrations**: denying consent forced a new one; one for another redirect URI was reused; concurrent write could delete a valid one or keep a mismatched one. **Security-adjacent — MEDIUM.** MCP OAuth correctness.
- **Fixed tool search returning no match when Claude selects an MCP tool by its bare name instead of its full `mcp__server__tool` name.** Correctness — direct fit for any subagent that names an MCP tool by short-form.
- **Fixed Ctrl+O cancelling pending MCP server reconnects**, + `/mcp` sent from Remote Control failing while the transcript view is open. Correctness.
- **Fixed the Claude in Chrome prompt telling the model to load tools through ToolSearch when ToolSearch is unavailable.** Chrome-extension correctness.
- **Fixed cross-session messages held by the receiving session's permission-mode policy leaving no trace**: headless senders now get a delivery notice, + `SendMessage` results no longer imply it was read. **Agent-team lens: MEDIUM.** Direct fit for Strandworks cross-session messaging (parallel scout, cockpit briefings).
- **Fixed Claude starting a second copy of a background command (such as a watch task or dev server) that was still running after the conversation was compacted.** **Direct fit for Strandworks compaction flow** — if any long session with a running dev server gets auto-compacted, no more duplicate dev-server processes.
- **Fixed `/model` warning about losing the conversation cache when switching back to the model the conversation actually ran on.** UX.
- **Fixed `/reload-skills` reporting a skill count that disagreed with the slash menu after `/cd`.** Correctness.
- **Fixed `/resume` + `/continue` showing only 1-2 sessions in fullscreen mode on short terminals.** UX.
- **Fixed `/resume` + `/teleport` keeping the previous conversation's file-read tracking**, so Claude could edit files the resumed conversation had never read. **Security-adjacent + correctness: HIGH.** Prior: file-read tracking leaked across `/resume` → Claude could Edit a file it had not actually Read in the resumed context. Fixed. Direct fit for Strandworks `--resume` daily use.
- **Fixed `--resume` dropping the 1M context window (`[1m]`) when the resumed session's model family differs from the configured default model.** **Agent-team lens: HIGH.** Prior: resuming a session that ran on `opusplan[1m]` under a different default silently dropped the 1M-context modifier → truncated context. Fixed. Direct fit for Strandworks 1M-context resume flow.
- **Fixed artifacts attached with `/artifacts` disappearing from the session after `--resume`.** Correctness.
- **Fixed background sessions (`claude --bg`, `claude agents`) not watching the artifacts they publish for republishes made elsewhere.** Correctness.
- **Fixed custom agents, slash commands, output styles beyond the first not loading from a virtual drive that reports inode 0** (e.g. an encrypted vault mounted as a Windows drive). Windows-only.
- **Fixed self-hosted runner sessions silently losing all host config (settings, skills, plugins, MCP servers) when the host config directory exceeds 64 MiB**; added `--host-config-snapshot disk|memory`. Enterprise.
- **Fixed skills synced from claude.ai staying on disk indefinitely after signing out**; copies not refreshed within `cleanupPeriodDays` now move to the recoverable trash at next launch. Cleanup.
- **Fixed spinner tips suggesting commands that aren't available for your account type or are disabled in your session.** UX.
- **Fixed the `/add-dir` path input**: left/right arrow keys now move the cursor; Enter adds only the typed path instead of also adding the highlighted completion. UX.
- **Fixed text fields outside the main prompt moving a leading `!` to the end of what you typed** (`!foo` came out as `foo!`). UX.
- **Fixed the interactive `/hooks` menu crashing when a hook matcher is named after an inherited object property such as `__proto__` or `constructor`.** Correctness.
- **Fixed a fullscreen rendering glitch where text kept a stale background color after the box around it lost its background.** UX.
- **Fixed Delete in st and Alt+arrow keys in rxvt-unicode not working in attached background sessions.** Terminal-compat.
- **Fixed the terminal's replies to capability queries (`^[[?1;2c`) appearing at the shell prompt or in an editor when Claude Code exits, is suspended, or opens an editor right after starting.** Terminal-compat.
- **Improved terminal rendering performance**: large diffs + long transcripts render faster, with fewer slow frames. QoL.
- **Improved startup time slightly by skipping a redundant validation of built-in model data on every launch.** QoL.
- **Improved hook feedback**: while a SessionStart/UserPromptSubmit/PreToolUse/SessionEnd hook runs, the spinner says so with elapsed time; Esc cancels a prompt waiting on a SessionStart hook. **Direct fit for Strandworks hook-heavy setup** — observability into slow hooks.
- **Improved the spinner status during long thinking**: reads "deep in thought" after 45s + "picking the thought back up" while recovering from output-token limit. QoL.
- **Improved dynamic workflows to pause when you hit your usage limit + continue automatically when it resets**, instead of dropping the affected agents. **Cost/correctness — direct fit for Strandworks scheduled scout jobs.**
- **Improved Remote Control to leave fewer empty sessions on claude.ai when setup fails on a flaky network.** Correctness.
- **Improved the Claude in Chrome message in cloud sessions when the browser can't be reached**: says the computer may be asleep before it suggests an install. Correctness.
- **Improved `claude mcp serve`**: a running tool call sends a progress update every 30 seconds, so clients show it's still running + idle timeouts don't abort a long silent command. **Direct fit for any Strandworks MCP server serving long-running tools.**
- **Improved Foundry + Claude Platform on AWS sessions**: an `alwaysLoad` MCP server that finishes connecting mid-conversation is usable on the next turn without a tool-search round trip. Enterprise.
- **Improved Markdown files published as artifacts**: render as styled document pages (title header, document typography, syntax-highlighted code). Direct fit if scout reports were ever published as artifacts (currently: Telegram delivery, so no).
- **Improved Artifact tool publish errors**: publish with no file says to write the page to a file first; unsupported file type reported before missing favicon. UX.
- **Improved artifact watching**: a session can watch up to 10 published artifacts at once (up from 5). QoL.
- **Improved PDF @-mentions to say "page count unknown" instead of a page count guessed from file size when pdfinfo cannot count pages.** Correctness.
- **Improved `/mobile` to show a single QR code for claude.ai/mobile**, which opens the right app store. UX.
- **Changed auto mode so that a skill's or slash command's inline `!` shell commands follow default-mode permission rules instead of the classifier**; a command no rule decides runs as a reviewed tool call. **Agent-team lens: MEDIUM.** Behavioral change — direct fit if any Strandworks skill/command uses inline `!` shell commands.
- **Changed auto mode so a subagent reports back to its caller through a dedicated hand-back call that the safety classifier reviews**, instead of its last message being reviewed after the fact. **Agent-team lens: MEDIUM.** Cleaner auto-mode subagent boundary.
- **Changed Monitor watches to always have a deadline (at most 30 min; 10 min in single-prompt `-p` runs) + notify Claude to re-arm**, replacing the no-timeout `persistent` option. **Agent-team lens: MEDIUM.** If Strandworks Monitor watches used `persistent`, they now cap at 30 min + re-arm.
- **Changed the IDE selection indicator in the prompt to a `[⧉ …]` pill that wraps with the text instead of squeezing multi-line prompts**; delete it with Backspace to leave the selection out. UX.
- **Changed the default dynamic workflow size to small on Pro plans + lowered the medium size guideline from 15 to 10 agents.** Plan-scoped.
- **Changed Claude apps gateway/Bedrock/Vertex/Foundry sessions to no longer refresh a leftover claude.ai login that the session does not use.** Enterprise cred hygiene.
- **Updated the bundled `claude-api` skill to enable `eager_input_streaming` on streaming custom tools**, + to start deliverable-shaped Managed Agents work with `user.define_outcome`. **Agent-team lens: MEDIUM.** Direct fit — `claude-api` is one of Strandworks's loaded skills. Guidance change to reflect current best-practice for streaming custom tools + Managed Agents outcome shape.
- **[VSCode]** Attach Open File setting: when off, the open file no longer added to messages (selected text still is). Direct fit if Strandworks uses VSCode extension.
- **[VSCode]** Hooks + Permission rules dialog save + secret + gitignore fixes; session history on Windows mapped drives; Active filter behavior; new-chat switch-back; open tabs + side bar on `CLAUDE_CONFIG_DIR` change; console windows flashing on Windows.
- **[VSCode]** Prompt-cache clock hover delay; auto-compact-icon tooltip; hooks-save-refused popup with "Open settings file"; toggle-switch color from Claude orange to editor theme's button color.
- **[Claude Code on the Web]** Session recovery after process exit; Routines page layout (Yours + Templates tabs, two-column cards, calendar view removed); Custom network access option in Cloud environments editor; Cloud environments admin default-environment display.
- **[Claude Tag / Slack]** ~10 fixes (thread context reset, PR-watching thread continuity, deleted-first-message stops Claude, bot-instruction disambiguation, reply-mode card wording, Environment picker labels).
- **[Code Review]** PR-timing single-review case; duplicate-post prevention; finding preservation across pushes moving lines; session-reopening.
- **[Windows]** PowerShell "Exit code 1" no-output fix when session temp path reaches 260 chars.

**v2.1.270 (2026-09-12)** — Bug fixes and reliability improvements.
- **Fixed read-only git commands in Bash unexpectedly asking for permission after a session had been running for a while (regression in 2.1.269).** **Agent-team lens: MEDIUM.** Prior: v2.1.269 introduced a regression where `git status`/`git log`/`git diff` etc. started prompting for permission mid-session. Fixed same-day. Notable as a same-day regression-fix pattern.

**v2.1.269 (2026-09-11)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `claude plugin eval`**: run a plugin's eval suite against Claude Code + get scored, reproducible results (JSON + HTML report); see `claude plugin eval --help`. **HEADLINE — Agent-team lens: HIGH.** Prior: no first-party way to regression-test a plugin end-to-end. New: scored eval suite w/ HTML report. **Direct fit for Strandworks plugin-authoring pattern** — any `.claude/plugins/*` bundle (scout, verify, cockpit-briefings, telegram-inline-keyboard-question-protocol when built) can now be regression-tested. Bookmark for when the first Strandworks-authored plugin needs a stable eval bar.
- **Added `/output-style [name]` to list + switch output styles**, including over Remote Control + in cloud + other headless sessions. **Agent-team lens: MEDIUM.** Direct fit for Strandworks — different scout / verify / cockpit-briefing skills may benefit from distinct output styles switched programmatically.
- **Added a diff of the files a Bash command changed to the Bash tool result when the Bash tool handles file edits** (setting `bashEditDiffEnabled`). **Agent-team lens: MEDIUM.** Direct fit for Strandworks Bash-flows that write files — Claude sees the diff inline instead of re-Read-ing after Bash. Cost win on write-heavy flows.
- **Added `OTEL_METRICS_INCLUDE_REPOSITORY` to tag OpenTelemetry metrics + events with `vcs.*` repository attributes**; commit events get `vcs.ref.head.*` with `OTEL_LOG_TOOL_DETAILS`. Enterprise observability.
- **Added `CLAUDE_CODE_GATEWAY_MODEL_DISCOVERY_TIMEOUT_MS` to extend the LLM gateway `/v1/models` discovery timeout (default 3s).** Enterprise.
- **Added a spinner tip suggesting `/focus` for a view with just your prompt, a one-line work summary, + the response.** UX/onboarding.
- **Added `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` (1–256) to raise the Workflow tool's per-run concurrent agent limit for inference-bound fan-outs.** **Agent-team lens: MEDIUM.** Direct fit for Strandworks fan-out workflows (parallel scout, parallel babysit-prs).
- **Fixed the prompt cache being partially invalidated on the turn after a response was cut off at the output-token limit + automatically resumed.** **HEADLINE — Cost lens: HIGH.** Prior: hit output-token limit → auto-resume → next turn silently missed part of the cache. Fixed. Direct fit for any Strandworks scout run that hits output limits (large changelog dumps, big JSON).
- **Fixed a case where resuming a session after interrupting Claude mid-thought could change how earlier context was re-sent, hurting prompt-cache reuse.** **HEADLINE — Cost lens: HIGH.** Prior: Ctrl+C mid-thought → later resume reshaped context → cache miss. Fixed. Direct fit for Strandworks Ctrl+C-and-resume daily use.
- **Fixed F1/F2/F4 not working in kitty-protocol terminals + Delete in st, Alt+arrows acting as Escape in rxvt-unicode, + Shift+punctuation typing the unshifted key in WezTerm** (regression in 2.1.247). Terminal-compat.
- **Fixed remote + headless sessions reporting "waiting for your input" while background agents were still running** (set `CLAUDE_CODE_BG_TASKS_REPORT_RUNNING=0` to restore old behavior). **Direct fit for Strandworks `--bg` scheduled jobs.**
- **Fixed the terminal's replies to capability queries (`^[[?1;2c`) appearing as stray text at startup in some terminals.** Terminal-compat.
- **Fixed rows at the top or bottom of the transcript going blank in fullscreen after resizing the terminal.** UX.
- **Fixed a deny or ask permission rule starting with `!` applying beyond the settings source that wrote it**; such a rule now applies only within its own source, + a bare `!` negation is ignored. **Security-adjacent — MEDIUM correctness.** Prior: `!`-prefixed rule scope leaked across settings sources. Fixed.
- **Fixed the git status Claude is told after a compaction**: now the current status, not the one from the start of the session. **Agent-team lens: MEDIUM.** Direct fit for Strandworks git-heavy sessions that auto-compact — post-compact git status was stale.
- **Fixed synced plugin MCP servers not connecting when a remote session resumes.** Correctness.
- **Fixed resumed headless sessions losing a turn's replies when the model was switched or a request was retried mid-turn.** Correctness — direct fit for headless retry flows.
- **Fixed terminal escape codes, line breaks + oversized text from a background task's on-disk record reaching the task list + task notifications when work is resumed.** Correctness.
- **Fixed CMYK JPEG images failing to attach with "cannot decode"**; converted + resized like other JPEGs. Direct fit for Strandworks image-attach flows.
- **Fixed the managed settings approval dialog not naming the collector for a gRPC telemetry endpoint set without a scheme.** Enterprise.
- **Fixed plugin `headersHelper` consent prompts showing a URL path that could be misread as a different host.** Security-adjacent.
- **Fixed plugin errors showing `[redacted URL]` in place of a relative Windows path with a folder name that starts with `@`.** Windows correctness.
- **Fixed missing cursor in the permission-rule/auto-mode-rule/add-directory/session-rename/feedback-review text fields when the terminal's native cursor is enabled.** UX.
- **Fixed repeated clicks on a `/fork` receipt, each under a second apart, never backgrounding the session right away while it waited for the current tool to finish.** UX.
- **Fixed plugin LSP servers that reject `shutdown` params (e.g. rust-analyzer) being left running at session end**; `exit` sent even if `shutdown` fails. Correctness.
- **Fixed the attribution reminder overriding a CLAUDE.md or memory rule against commit + pull-request attribution**; lines set by managed settings still apply. **Agent-team lens: MEDIUM.** Direct fit if Strandworks CLAUDE.md has an attribution rule (`no Co-Authored-By:` etc.). Prior: reminder overrode. Fixed.
- **Fixed prompt suggestions being dropped for text in Japanese/Chinese/Thai + other languages without spaces between words.** i18n.
- **Fixed synchronized output being assumed from the terminal's name in GNOME Terminal + Konsole versions that do not support it.** Terminal-compat.
- **Fixed `permission_denials` in `--output-format stream-json` results omitting Read/Edit/Write calls blocked by a path-scoped deny rule.** Observability.
- **Fixed sessions run through the SDK or the desktop app showing an unknown status in other sessions' agent list.** Cross-session status correctness.
- **Fixed `/insights` failing on Bedrock/Vertex/Foundry + gateway deployments whose account can't reach default Opus** by using the session model instead. Enterprise.
- **Fixed org policy limits not loading for the session when another Claude Code process refreshed the login at the same moment.** Enterprise concurrency.
- **Fixed Claude Desktop sessions using Bedrock/Vertex/gateway not getting the contextual "what Claude needs" turn-end notification text.** Enterprise.
- **Fixed MCP servers reconnecting when an updated config only changed the order of the server URL's query parameters.** Correctness.
- **Fixed the prompt box's top border splitting into extra lines when viewing a background agent whose name/description has line breaks or is wider than the terminal.** UX.
- **Fixed sessions getting permanently stuck on "Prompt is too long" when auto-compaction had no complete earlier exchange to summarize** (mostly Agent SDK sessions with very large prompts). Correctness.
- **Fixed `/goal` runs silently stalling after API errors/network drops/token limits**: now retries with backoff, or pauses + says why (incl. until usage limit resets). Direct fit if `/goal` is ever used.
- **Fixed prompt cache misses in cloud sessions by waiting briefly for server configuration before the first request.** Cost.
- **Fixed `/btw` answers that contained made-up tool calls + output**: side question now told not to write them, + any that appear are flagged as not executed. **Security-adjacent — hallucination guard.**
- **Fixed `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` re-running a turn that had failed with an API error over 6 hours earlier**, or longer ago than `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS` when set. Correctness.
- **Fixed organization plugins enabled through managed settings not loading in headless sessions + on Claude Desktop** (once Desktop bundles this CLI version). Enterprise.
- **Fixed plugin archives extracted for a session being readable by other local users, extracted files keeping world-writable bits from the archive, + stale files surviving re-extraction.** **HEADLINE — Security-adjacent: HIGH.** Prior: plugin extraction left world-readable and world-writable files behind + stale re-extract residue. Fixed. Direct fit for any Strandworks multi-user machine (currently: single-user MacBook + solo VPS, so lower blast radius, but still a hygiene fix).
- **Fixed `Edit()` deny rules + write-path check not applying to the file a Bash `tee` command writes**; a `Bash(tee:*)` allow rule no longer covers destinations outside the working directories. **Security-adjacent: MEDIUM.** Prior: `Edit()` deny + write-path bypass via `tee`. Fixed.
- **Fixed stray characters like `22c`, or terminal color/version reply, being typed into the prompt at startup over slow connections (ssh, browser terminals).** Terminal-compat.
- **Fixed the terminal's block cursor showing under the interface in rxvt-unicode after leaving/re-entering fullscreen**; + cursor block staying visible after returning from an external editor in fullscreen on rxvt-unicode. Terminal-compat.
- **Fixed the interface being drawn twice after returning from an external editor (Ctrl+G) outside fullscreen mode** + in Konsole. UX.
- **[Windows]** PowerShell tool commands sent to the background no longer stop when Claude Code exits.
- **Improved the `/diff` panel to open fully rendered in one step instead of showing a loading state first.** QoL.
- **Improved prompt suggestion filtering for Japanese/Chinese/Korean**: mixed-script + single-word suggestions kept; meta/evaluative text dropped as for English. i18n.
- **Improved the Skill tool's "Unknown skill" error to name the plugin skill's full name when a bare name matches exactly one plugin skill.** UX — direct fit for Strandworks plugin-skill invocation.
- **Improved keyboard support over SSH + in unrecognized terminals**: terminals that answer the kitty keyboard query (foot, Alacritty 0.16+) now get Shift+Enter + Ctrl+Shift shortcuts. QoL.
- **Improved responsiveness in long sessions**: transcript updates no longer re-process whole conversation to build collapsed tool-use summaries. **QoL — direct win for Strandworks long sessions.**
- **Improved first-party sessions with telemetry disabled**: `alwaysLoad` MCP server finishing connection mid-conversation is usable on next turn without a tool-search round trip. Direct fit if Strandworks has telemetry disabled.
- **Changed `/ultrareview --post` to post the PR comment directly when findings arrive + print the comment link**, instead of starting a second cloud session to post it. **Cost lens: MEDIUM.** Removes a redundant cloud-session cost per `/ultrareview --post` run.
- **Changed artifact database reads that save into the session scratchpad so they no longer stop for working-folder approval.** UX.
- **Changed skills synced from claude.ai in cloud sessions to be named `anthropic-skills:<name>`**, matching Claude Desktop; bare name still works when nothing else uses it. Cloud correctness.
- **[VSCode]** Agent map ("N agents" footer pill opens map of session's sub-agents w/ per-agent cards, Stop agent, read-only transcripts); Hooks dialog in command menu; live progress rows for running subagents in Focus view; Permission rules dialog; Cancel on Switch account.
- **[VSCode]** ~15 fixes (Focus-view turn attribution, prompt-cache-clock minutes, session list `CLAUDE_CONFIG_DIR`, plan preview loading edge cases, session compaction cache clock reopen, Remote Control name/toggle correctness, restored tab counts, Switch account warnings, session rename during long turn, sidebar usage meter stale weekly row, @-mention insertion timing, session list layout jump).
- **[VSCode]** Doc-audience improvement (write for named audience + name it at top); accessibility improvements (screen reader + keyboard in slash/menus/picker/permissions/onboarding); X to remove current-file chip; removed Claude Code items from tab right-click + editor title-bar "..." menus.
- **[Claude Code on the Web]** Take back queued message before Claude reads it; `/model default` fix in restricted-model orgs; one-off scheduled routines re-run fix; subagent routine runs finished-too-early fix; file links opening GitHub 404 fix; Cloud environments admin page pagination; Free plan path.
- **[Claude Tag / Slack]** GitHub Connect all / Disconnect confirmation; thread-failure notice retry; model-enforcement fix (Slack accepting unenabled model + fallback-answering — now declines); table-formatting fix; `@Claude !restart` in wrong channel; plugin rows show name + link; shared-session banner accuracy; admin performance; scheduled routines in threads; live-progress timestamps.
- **[Code Review]** Note on resolving finding threads under still-open findings list; verification-agent-failure completion fix; PR-status-changed-mid-review fix; directory-scoped CLAUDE.md convention respect on root-file-vs-samename-in-subdir edits.

**v2.1.268 (2026-09-10)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added to the Claude apps gateway**: with `pricing:` set in `gateway.yaml`, signed-in Claude Code clients receive same rates through managed settings, so `/cost` + telemetry match spend meter. Enterprise.
- **Added a startup warning for gateways when `access_control.allow_cidrs` is empty**, + a one-time warning first time a request arrives from a public address. Enterprise security-adjacent.
- **Added the `gatewayInternalNetworks` managed setting**, letting admins allow `/login` to a Claude apps gateway on their org's own public IPv4 block. Enterprise.
- **Added `claude self-hosted-runner --remove-session-state`** (default off): delete each session's per-session directories under `<base-dir>/_sessions/` when session ends. Enterprise.
- **Added `configDirectory` to the output of `claude auth status --json`.** Observability.
- **Added `--json` to `claude plugin install/uninstall/update/enable/disable`**, + `errorDetails`/`noteDetails` to each row of `claude plugin list --json`. **Agent-team lens: MEDIUM.** Direct fit for scripted plugin management.
- **Added browser-tab icons for published artifacts**, chosen by Claude to match each page. UX.
- **Fixed every turn failing with HTTP 400 on third-party Anthropic-compatible endpoints (`ANTHROPIC_BASE_URL`) since 2.1.265**: a regex in the Artifact tool's input schema that those endpoints reject. Enterprise/gateway.
- **Fixed WebFetch hanging indefinitely on a server that keeps the response open without finishing**; a fetch fails after 300s. Set `CLAUDE_CODE_WEBFETCH_DEADLINE_MS` to override (0 turns it off). **Agent-team lens: MEDIUM.** Prior: WebFetch could hang the turn indefinitely. New: 300s deadline. Direct fit for Strandworks WebFetch-heavy scout runs.
- **Fixed a respawned in-process teammate picking up tools or a system prompt from a same-named agent file in a folder you have not trusted.** **HEADLINE — Security-adjacent: HIGH.** Prior: in-process teammate respawn could pick up a same-named-agent-file from an untrusted folder → run with unintended tools + system prompt. New: rejected. Direct fit for Strandworks agent-team pane pattern in iTerm2.
- **Fixed sustained high CPU usage**: busy loop in long-running idle sessions no longer pins a CPU core; rapid terminal focus reports during a session recap no longer keep CPU high. **Direct fit for Strandworks long-running iTerm2 sessions.**
- **Fixed Claude sometimes replying "your message came through empty" after an MCP tool call.** Correctness.
- **Fixed deny + ask permission rules on symlinked directories (`/etc`, `/tmp`, `/var` on macOS; `/bin` on Linux) not applying when a path was given by its real location**, + Bash commands ignoring deny rules written on a symlinked path spelling. **HEADLINE — Security-adjacent: HIGH.** Prior: macOS symlink-target-path bypassed deny rules on `/etc`, `/tmp`, `/var`. Fixed. **Direct fit for Strandworks macOS** — any deny rule on those paths was porous until 9/10.
- **Fixed a case where a Read/Edit deny rule did not apply when an `env -C`, `eval`, or similar command the permission checker cannot analyze was on the same line.** Security-adjacent — MEDIUM. (**Reverted in v2.1.273** — see there.)
- **Fixed plugin + marketplace errors showing a token or password from a git source URL.** **HEADLINE — Security-adjacent: HIGH cred-hygiene.** Direct fit if any Strandworks plugin source URL embeds a token.
- **Fixed `/mcp` + `/plugin` server details, `claude mcp list`/`get`, + MCP login errors showing secrets resolved from `${VAR}` placeholders in MCP configs.** **HEADLINE — Security-adjacent: HIGH cred-hygiene.** Prior: `${SUPABASE_KEY}` in an MCP config could get resolved-and-printed in `/mcp`. Fixed. Direct fit for Strandworks MCP configs that use `${VAR}` placeholders (currently: `.mcp.json` uses env-var placeholders — check this fix landed as expected).
- **Fixed prompt caching + extended thinking breaking mid-session for SDK sessions using `excludeDynamicSections`**: first message no longer re-rendered each request. Cost lens — direct fit if Strandworks SDK usage sets this.
- **Fixed entitled users being told a model is restricted after restart or in the Desktop Code tab when a cached model-access denial was stale**, + a running session silently switching to org default model when another Claude Code process refreshed a stale model-access entry. Enterprise.
- **Fixed long-context 429s on Fable models showing usage-credits consent prompt instead of the 1M-context message on Pro + Team plans.** Correctness.
- **Fixed workload identity federation via a profile (as claude-code-action configures it): processes sharing the profile could fail mid-run with `401 … jti reused`.** Enterprise WIF.
- **Fixed MCP server OAuth sign-in failing with "No available ports for OAuth redirect" when the local callback port range can't be bound.** MCP correctness.
- **Fixed the conversation summary produced by `/compact` + auto-compact mangling text that contained `$` sequences.** **Direct fit for Strandworks — bash-heavy content often has `$VAR` / `$1` / etc.** Prior: summaries mangled them. Fixed.
- **Fixed resuming a conversation that ended with `/compact`**: restored-file notes load in same order on every resume. Correctness.
- **Fixed SDK prompt suggestions, side questions, `/rename` sending the conversation from before a compaction.** Correctness.
- **Fixed `@` file + `/` command suggestions not appearing after recalling a previous prompt with up arrow + editing it.** UX.
- **Fixed `claude agents`**: pressing ← again at a natural pace to go back to the agent list no longer gets ignored until you pause for over a second. UX.
- **Fixed `claude agents` session delete getting stuck when a worktree can't be removed**: message names cause + next step; for git worktree, ctrl+x again deletes the directory anyway. **Direct fit for Strandworks worktree flow.**
- **Fixed background agent + workflow rows in the agents panel expanding to many lines when their text contained line breaks.** UX.
- **Fixed Claude in Slack sessions losing their Slack tools when org managed settings set an MCP allowlist.** Enterprise.
- **Fixed Claude in Chrome asking to allow the host "https" when a navigation URL had a scheme but a host that could not be parsed.** Chrome-extension correctness.
- **Fixed the spinner wrapping onto several lines when the current task's label is long**; label + "Next:" task line stay within one terminal row. UX.
- **Fixed the `/bug` + `/feedback` description field showing no cursor when the terminal's native cursor is enabled.** UX.
- **Fixed Remote Control sessions served by `claude remote-control` showing a generated name instead of their session title in `ListAgents`.** Correctness.
- **Fixed `claude plugin validate` rejecting plugin paths whose directory name begins with two dots**, which the plugin loader accepts. Correctness (companion to v2.1.265 backslash fix).
- **Fixed plugins silently skipping a default monitors file or root SKILL.md that could not be checked.** Observability.
- **Fixed WebFetch's error for localhost + other dotless hostnames to explain why the URL is refused + suggest curl.** UX.
- **Fixed PermissionRequest hooks not firing in `--print` mode.** **Agent-team lens: MEDIUM.** Direct fit if Strandworks headless `claude -p` uses PermissionRequest hooks.
- **Fixed policy-helper warnings not printing on headless (`-p`) runs.** Observability.
- **Fixed `/resume` listing a `/fork` background session under its parent's name instead of its own `⑂` fork name.** UX.
- **Fixed `/remote-control` + other claude.ai-gated commands to suggest `/login` when signed out instead of showing Claude for Enterprise migration message.** UX.
- **Fixed `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` not extending SessionEnd hooks that have no per-hook `timeout`** (were still cancelled after 1.5s). Hook correctness.
- **Fixed `/autofix-pr` + other cloud-session commands saying to retry or install the Claude GitHub App when no GitHub account is connected**; now point to `/web-setup` or web connect page. Correctness.
- **Fixed cloud-session commands such as `/teleport` + `/remote-env` to explain when an org policy turns them off**, instead of "Unknown command". UX.
- **Fixed Bash sandbox instructions over-stating confinement**: no unenforced path lists when filesystem isolation is off; strict mode no longer claims commands can never run unsandboxed. Correctness.
- **Improved fullscreen mode**: adding/removing a prompt line (Shift+Enter) now repaints as fast as typing a character. QoL.
- **Improved `--continue` / `--resume`**: conversation appears immediately instead of waiting for SessionStart hooks; first message no longer re-reads the whole transcript. **Direct fit for Strandworks daily `--resume` use — faster resume.**
- **Improved responsiveness during tool-heavy turns** by no longer redrawing transcript for a hidden per-tool-batch reminder. QoL.
- **Improved startup time in projects with `.claude/workflows/` scripts**: listing them no longer parses each script. QoL.
- **Improved auto mode denials**: message Claude receives names the rule that blocked the action + asks Claude to try a safer method + finish unrelated work before stopping to ask you. **Agent-team lens: MEDIUM.** Better auto-mode observability — Claude now knows WHY it was denied instead of just THAT it was denied.
- **Improved Claude in Chrome**: long page reads stay inline instead of being saved to a file + read back. Cost + UX.
- **Improved the MEMORY.md truncation warning to say how many lines were cut + where the cut starts.** **HEADLINE — Agent-team lens: HIGH.** Prior: silent MEMORY.md truncation past line 200 with a generic warning. New: named cut count + start line. **Direct fit for Strandworks** — `MEMORY.md` is under the 200-line cap but any drift would surface with the count now. Add periodic `/memory` check to catch this.
- **Improved the terminal permission prompt for artifacts**: leads with the ask's question. UX.
- **Improved the prompt footer**: editor / `/diff` selection shows inside prompt input; fullscreen shows Remote Control status in header instead of footer. UX.
- **Improved the "Usage credits required for 1M context" message** to say that usage credits turned on mid-session take effect after restarting Claude Code. UX.
- **Improved `/plugin`**: installing/enabling/disabling a plugin takes effect when you close the menu; `/reload-plugins` no longer needed after. QoL.
- **Changed the system prompt on Bedrock/Vertex/Foundry to deliver environment, model + settings details as attachments**, matching first-party sessions. Enterprise parity.
- **Changed Bedrock/Vertex/Foundry sessions to keep the tool list byte-stable across a conversation** (late-connecting tools load deferred instead of rewriting it), matching first-party sessions. Enterprise parity + cost.
- **Changed the task-tracking tools (TaskCreate/Get/Update/List, TodoWrite) to be offered only on Claude 3.x, Opus 4.0–4.7, Sonnet 4.0–4.6, Haiku 4.5**; set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` elsewhere. **HEADLINE — Agent-team lens: MEDIUM.** Prior: task tools always available. New: model-family-scoped. **Direct fit for Strandworks** — sessions on Fable/Mythos (any 5.x line) no longer see the task tools by default. If any Strandworks skill/workflow relies on TaskCreate/TodoWrite under a Fable model, set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` in user `~/.claude/settings.json`. This session runs Opus 4.7 so tools are available; other sessions may not.
- **Changed the artifact data-edit permission prompt in the terminal to a card that shows the document count + who can open the artifact.** UX.
- **Changed local Cowork sessions set to skip all approvals**: Artifact tool refuses a local file outside session's folders, or behind a symlink, instead of reading it without asking. Security-adjacent.
- **Changed plain `WebFetch` deny + ask rules to no longer apply to Artifact tool reads + updates**; use an `Artifact` rule (or `WebFetch(domain:claude.ai)`) to block/gate them. **HEADLINE — Agent-team lens: MEDIUM.** Behavioral change worth noting. Direct fit if any Strandworks rule blocked artifact-service via `WebFetch`. Migrate to `Artifact` rule if so.
- **Changed the "N MCP servers need authentication" startup notice to announce each server once instead of at every launch.** UX.
- **[VSCode]** Config-directory fixes (session list, settings toggles, chat tabs on `CLAUDE_CONFIG_DIR`); model pill/picker/menu blank window fix on login/logout/switch; Auto disappearing from mode picker fix; session names reverting after window reload; footer model + Remote Control pill startup fix; second-Claude-process race fix; `/resume` sidebar preference respect; Windows WSL prompt + IDE diagnostics fixes; custom style builder saving to unread folder fix; left/right arrows on always-allow permission rule; "Claude Code: Focus last message" command; Manage plugins dialog applies to open sessions without restart; some artifact permission prompts omit "don't ask again".
- **[Claude Code on the Web]** Sessions running longer than ~6 hours no longer silently lose files saved to persisted folders (saves persist up to a day); "Invalid effort level" fix in effort-capped orgs; routine creation names missing connectors.
- **[Claude Tag / Slack]** Admin settings hang + skeleton fix; channel-page → org admin settings link; Enterprise Grid channel losing settings on workspace move; blocked-action explanation; parallel read-only lookups; comparison table wrapping; `@Claude !restart` cross-notice fix; account/org connection message; angle-bracket-wrapped Markdown link fix; guest top-level @mention fix; scheduled channel-session refresh timing; channel settings card double-click; per-channel memory isolation (channel notes stay in channel; workspace notes shared).
- **[Code Review]** Note on resolving finding threads to stop later reviews from counting them open; verifier-agent-failure completion fix; PR-converted-to-draft mid-review fix; directory-scoped CLAUDE.md convention respect on root-file edits.

---

### Anthropic Platform

**Two release-note days in-window (9/10 + 9/14).** No new models, no Managed Agents structural changes beyond `auto` permission policy + `ant beta:sessions connect`, one significant beta-header addition (`compact-2026-09-04` for Messages API compaction).

**Messages API on-demand compaction — 2026-09-14, beta** — [compaction docs](https://platform.claude.com/docs/en/build-with-claude/compaction#compact-on-demand-with-the-compaction-parameter)
- **What it is**: Send a top-level `compaction` parameter on a Messages API request; the API returns a signed `compaction` block that summarizes the messages you sent. On later requests, send that block first, in place of those messages. Recent turns are kept word-for-word after the summary. On models with preserved thinking (Fable 5.1, Mythos 5.1, Opus 5), the thinking in the kept turns stays valid.
- **Beta header**: `compact-2026-09-04`.
- **You choose when to compact**: not automatic; call it when your app needs a shorter prefix.
- **Runs in the background**: request can be issued as a side effect while your app keeps working; signed block is safe to store + replay.
- **HEADLINE — Agent-team lens + product-build lens: HIGH.** Prior: no first-party primitive for context management on the raw Messages API. Every Claude API app (including any Strandworks-built agent or MedSim scenario/analytics agent) had to do its own summarization + carry the risk of a bad summary changing behavior. New: signed, provider-generated, thinking-preserving compaction as a first-class API primitive. **Product-build lens**: MedSim-Game any consumer-facing chat/agent surface (scenario director, analytics chat, learner-facing tutor) benefits directly — long-conversation depth without runaway token cost. **Agent-team lens**: Strandworks-built agents (scout, cockpit, verify, briefings) that ever run headless via the raw API can now use signed compaction blocks instead of hand-rolling summaries.
- **How it differs from Claude Code's auto-compact**: Claude Code's `/compact` produces a text summary Claude sees on the next turn. Messages API compaction produces a signed block that the API itself validates on replay — meaningful for stateless, replayable agent architectures (which is where Strandworks would want to go).

**Managed Agents `auto` permission policy — 2026-09-10** — [permission-policies docs](https://platform.claude.com/docs/en/managed-agents/permission-policies#let-the-server-evaluate-each-call-with-auto)
- **What it is**: Set a Managed Agents permission policy to `auto` + the server evaluates each agent / MCP tool call and runs it, denies it, or pauses for your approval. `agent.tool_use` + `agent.mcp_tool_use` events now include an `evaluation` field alongside `evaluated_permission`.
- **Agent-team lens: MEDIUM.** Not-a-today (Strandworks not on Managed Agents). Bookmark for MedSim-Game backend-agents build stage.
- **Product-build lens: MEDIUM–HIGH.** If MedSim-Game hosts user-facing agents (scenario director, custom-content generator from school partners, learner-analytics chat), `auto` lets the server do the per-call safety review that would otherwise need Strandworks-authored middleware. Meaningful when the migration to Managed Agents happens.

**`ant beta:sessions connect` — 2026-09-10** — [sessions-connect docs](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/sessions-connect)
- **What it is**: Attach your local terminal to a Claude Managed Agents session. Follow live, send messages, allow/deny pending tool calls. `--web` flag serves the Claude Console's session viewer locally + opens it there instead.
- **Agent-team lens: MEDIUM.** Not-a-today. Bookmark for the MedSim-Game backend-agents build stage — this is the interactive-monitoring path for a running server-side agent.
- **Product-build lens: MEDIUM.** Direct fit for a scenario-authoring or analytics agent that Strandworks would want to observe + optionally interrupt.

**No new models.** Fable 5.1 / Mythos 5.1 remain the current line, launched 9/1, unchanged this week.

**No pricing changes.** Fable 5.1: $10/$50 per MTok, cache reads $0.25/MTok (0.025x base input = 75% discount vs other models). Unchanged.

**No new beta headers beyond `compact-2026-09-04`.**

---

### MCP Ecosystem

**No net-new headline MCP servers, catalog entries, or spec updates in the window.** Spec remains **MCP 2026-07-28** (stateless core, hardened auth, graduated Apps + Tasks extensions), unchanged. PulseMCP directory continues steady growth (~22,070+ servers per pulsemcp.com; up from ~22,050+ last week — noise-level growth).

**Client-side MCP fixes landed in Claude Code** (see Claude Code section for full detail):
- **Mid-session MCP disconnect notification pointing at `/mcp`** (v2.1.273) — better observability on flaky MCP servers.
- **`list_changed` tight-loop CPU pin fix** (v2.1.271) — direct fit if any Strandworks MCP fires notifications aggressively.
- **MCP OAuth client registration correctness** (v2.1.271) — denying consent no longer forces a new client; concurrent writes no longer delete valid registrations.
- **MCP tool bare-name search fix** (v2.1.271) — subagent selecting an MCP tool by short name no longer misses.
- **Secrets resolved from `${VAR}` placeholders in MCP configs no longer shown in `/mcp` / `claude mcp list`/`get` / MCP login errors** (v2.1.268) — cred hygiene. Direct fit for `.mcp.json` entries that use `${SUPABASE_KEY}` etc.
- **`alwaysLoad` MCP server that finishes connecting mid-conversation now usable on next turn without tool-search round trip** (v2.1.269 first-party sessions with telemetry disabled; v2.1.271 Foundry + Claude Platform on AWS).
- **MCP server sign-in expiring mid-session now points to `/mcp` for re-auth** (v2.1.273).
- **`claude mcp serve`: running tool call sends progress update every 30 seconds** (v2.1.271) — for authors of long-running MCP tools.

---

### Agent Patterns + Best Practices

**No net-new Anthropic engineering blog post in the window.** Engineering blog's most recent post remains "An update on recent Claude Code quality reports" from April 2026. **Fifth consecutive week without a new engineering-blog release.** Consistent with the pattern noted last week: Anthropic is redirecting bandwidth toward product hardening (security-adjacent fixes across every Claude Code release) rather than published pattern-guidance content.

**Pattern shift observed**: this week extends last week's "treat agents + skills as codebase artifacts you diff, version, and prune" doctrine (`ant apply` + `/skill-doctor`) with **two more pieces of the discipline**: (1) `claude plugin eval` (v2.1.269) formalizes **plugin regression testing** as a first-class command with JSON+HTML scored output — plugins are now testable software artifacts, not just config bundles; (2) `omitClaudeMd` in agent frontmatter (v2.1.271) formalizes **subagent context minimization** as a per-agent opt-in — every subagent's context prefix becomes a first-class design decision. **Directional signal continues**: Anthropic treats the sprawl of agents/skills/plugins/context as a first-class ergonomics + cost problem. Direct fit for Strandworks 20-project portfolio.

**Bundled `claude-api` skill update (v2.1.271)**: enable `eager_input_streaming` on streaming custom tools + start deliverable-shaped Managed Agents work with `user.define_outcome`. Direct fit for Strandworks — `claude-api` is one of Strandworks's loaded skills. Its guidance now reflects current best practice for streaming custom tools + Managed Agents outcome-shape entry.

**One threat-intelligence report** (9/10): [Detecting and countering misuse of AI: September 2026](https://www.anthropic.com/news/detecting-countering-misuse-of-ai-september-2026). Case studies of misuse operations that were disrupted since 2025 reports. **No capability content**; no defensive tooling shipped alongside. Referenced here for completeness — not actionable for Strandworks workflows or the flagship product build.

---

### Adjacent Tooling

**Cursor**: no notable release in window that shifts workflow-competitiveness vs Claude Code.
**Aider**: no notable release in window.
**No adjacent tooling shifts warrant migration analysis.**

---

## Recommended Actions

1. **Try Messages API on-demand compaction on any headless Strandworks flow that would benefit.** Not applicable to interactive Claude Code sessions (they have their own compaction). Direct fit for anything Strandworks runs through the raw Anthropic SDK (any `_ops/lib/*` script that calls the API directly, any Managed-Agents-adjacent tooling). Beta header: `compact-2026-09-04`. Docs: [compaction](https://platform.claude.com/docs/en/build-with-claude/compaction#compact-on-demand-with-the-compaction-parameter). **Product-build lens**: same primitive is what MedSim-Game consumer-facing chat/agent surfaces will want when they need long-conversation depth without runaway cost.

2. **Test `omitClaudeMd: true` on one Strandworks subagent + measure passive-context savings.** Direct fit for subagents whose task is self-contained (scout, code-review, security-review, verify). Prior: every custom/plugin subagent inherited the 100-line portfolio `/PROJECTS/CLAUDE.md` on every turn. New: opt out per-agent. Add to the agent's frontmatter, spawn it, run `/context` before + after, quantify savings. If meaningful, roll to more subagents. Managed-policy files still load — safety guardrails unaffected.

3. **Audit `~/.claude/settings.json` + project `.mcp.json` for `${VAR}` placeholders that resolved to secrets in `/mcp` / `claude mcp list`.** Prior (before v2.1.268): running `/mcp` or `claude mcp list --json` could print resolved values of `${SUPABASE_KEY}`, `${OPENAI_API_KEY}`, etc. from placeholders. New: redacted. **Direct fit for Strandworks** — `.env.master`-sourced env-var placeholders in `.mcp.json` are common. Rotate any secrets that may have appeared in prior `/mcp` output or terminal history. Also check screenshots + shared session dumps for the same pattern.

4. **If Strandworks uses TaskCreate / TodoWrite in any skill or workflow that ever runs under Fable/Mythos (5.x line), set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` in user `~/.claude/settings.json`.** Prior: task tools always available. New (v2.1.268): scoped to Claude 3.x, Opus 4.0-4.7, Sonnet 4.0-4.6, Haiku 4.5. This session (Opus 4.7 [1M]) has them; a Fable 5.1 session does not by default.

5. **If any Strandworks permission rule uses `WebFetch` to block/gate the artifact service, migrate to `Artifact` rule (or `WebFetch(domain:claude.ai)`).** Prior: `WebFetch` deny/ask rules applied to Artifact tool reads + updates. New (v2.1.268): they don't. Direct behavioral change — if a currently-active rule was intended to gate the artifact service, it silently stopped doing so on 9/10.

6. **Verify Strandworks isn't relying on any of the Bash permission-checker bypass gaps closed this week.** Prior: `sh -c "rm -rf $1"`, subshell-hidden `rm`, `env -C`/`eval` on same line as protected path, wildcard-in-option, shell variable declaration flag misrepresentation, `cd`+`git` chain under `blockReadsOutsideWorkingDirectories`, symlinked-directory deny rules (`/etc` `/tmp` `/var` on macOS) — all bypassed permission checks. Fixed across v2.1.268 + v2.1.271 + v2.1.273. If any Strandworks workflow was implicitly relying on any of these bypasses (unlikely but worth confirming), it will now prompt.

7. **Bookmark `ant beta:sessions connect` + Managed Agents `auto` permission policy for the MedSim-Game backend-agents build stage.** Not-a-today. When MedSim-Game hosts a scenario-authoring agent, learner-analytics agent, or school-partner custom-content agent server-side, `auto` policy = server-side per-call safety review + `sessions connect` = local terminal attach for live monitoring/approval. Both collapse migration friction to the Managed Agents tier.

8. **If Strandworks uses `--resume` with `[1m]` context modifier + a non-default model family, note the v2.1.271 fix that stopped `--resume` from silently dropping the `[1m]` modifier.** Prior: resume-then-truncate silently. Fixed. If any Strandworks scout run seemed to lose context capacity after `--resume`, this was the cause.

9. **If Strandworks ever ran the advisor tool (managed-agents advisor, or a custom advisor pattern), auto-compact was firing at ~half the real window until v2.1.273 (9/15).** Prior: advisor turns counted at 2x real context size → premature summary → cache-hole. Fixed. Effective advisor-session context depth roughly doubles.

10. **Try `claude plugin eval --help` on any Strandworks-authored plugin.** Bookmark for when the first Strandworks-authored plugin needs a stable eval bar. Direct fit for the `telegram-inline-keyboard-question-protocol` plugin when it's built (currently active in idea-vault).

11. **If Strandworks has any hooks with SessionStart/UserPromptSubmit/PreToolUse/SessionEnd that are ever slow, v2.1.271 now shows elapsed time in the spinner + lets you Esc a SessionStart hook.** Observability win — direct fit for Strandworks hook-heavy setup.

12. **Set `bashEditDiffEnabled` if Strandworks Bash flows write files.** v2.1.269 adds diff-of-changed-files to Bash tool result when Bash handles the edit. Direct cost win: Claude sees the diff inline instead of Reading the file after. Direct fit for Strandworks Bash-heavy scripting.

---

## Pricing / Cost Watch

- **No model pricing changes in window.** Fable 5.1 remains $10/$50 per MTok with $0.25/MTok cache reads. Fable 5 pricing unchanged. Opus 5, Sonnet 4.6, Haiku 4.5 pricing unchanged.
- **No model deprecations in window.**
- **Passive cost wins landed in Claude Code this week** (all continue the multi-week pattern of closing silent prompt-cache leaks + reducing redundant work):
  - **Advisor-tool 2x context miscount fixed** (v2.1.273): auto-compact was firing at ~half the real window on advisor sessions → premature summary + cache-hole. Fixed.
  - **`/login`/`/upgrade`/`/extra-usage` no longer discard earlier thinking** (v2.1.273): each command mid-session used to force a full prompt-cache rewrite on the next request. Fixed.
  - **Output-token-cutoff resume no longer partially invalidates prompt cache** (v2.1.269): auto-resume after hitting output limit used to reshape the cache. Fixed.
  - **Mid-thought Ctrl+C + resume no longer changes how earlier context is re-sent** (v2.1.269): silent cache miss on resume-after-interrupt. Fixed.
  - **SDK sessions using `excludeDynamicSections` no longer re-render first message each request** (v2.1.268): cost lens for SDK-heavy flows.
  - **Cloud sessions wait briefly for server config before first request to avoid cold prompt-cache misses** (v2.1.269).
  - **Post-compact git status now shows current status, not stale start-of-session status** (v2.1.269): correctness, but also removes cost from an incorrect status forcing re-inspection.
  - **`alwaysLoad` MCP servers finishing connection mid-conversation are usable on next turn without a tool-search round trip** (v2.1.269 first-party w/ telemetry off; v2.1.271 Foundry + Claude Platform on AWS).
  - **Artifact database writes can now remove a single field instead of rewriting the whole document** (v2.1.273): minor cost lens on artifact-write-heavy flows.
  - **`/ultrareview --post` posts PR comment directly instead of spawning a second cloud session** (v2.1.269): removes redundant cloud-session cost per `/ultrareview --post` run.
  - **Long Claude in Chrome page reads stay inline instead of being saved to a file + read back** (v2.1.268): removes redundant Read cost.
- **Combined cost signal for the week**: multi-week pattern of closing silent prompt-cache leaks continues. `/login` + `/upgrade` mid-session cache-hole fix (v2.1.273) is the most-often-hit of the batch — every daily-use Strandworks session runs one of these commands. Cross-refers Bouren Plan §1 monthly AI tooling line. Verify improvement empirically via `claude cost` after next daily run that touches `/login` or `/upgrade` mid-session.

---

## Nothing New (Watchlist)

- **MHS spec publication + open-cohort application timeline**: no updates. Research preview cohort-restricted. Next signals: Anthropic publishing driver spec + safety-eval framework, or partners (Doosan, Universal Robots, Tecan, QIAGEN) publishing MHS-conforming SDKs.
- **Fable 5.1 behind Claude apps gateway**: no gateway-partner 5.1-support announcement this week.
- **`/design` skill (v2.1.233, research-preview)**: no changes in window; still research-preview, still Sonnet-4.5 back-end.
- **Managed Agents extended surface**: `ant beta:sessions connect` + `auto` permission policy (this week) are the biggest additions since 8/19 GA. Rest of Managed Agents surface stable.
- **Enterprise Frontier Safeguards (9/1 preview)**: no rollout progress announcements this week. Phased starting fall 2026.
- **Windows cross-session messaging GA (v2.1.239)**: not applicable to Strandworks.
- **Remote Control device cards on phone GA (Week 34)**: no changes in window.
- **Claude Code on the web (Pro/Max)**: this week added routine take-back, custom network access in Cloud environments, session-persistence up to 24h, routine page redesign — feature-set continues to build. Not applicable to Strandworks primary pattern.
- **Anthropic engineering blog**: fifth consecutive week without a new release. Still stuck at April 2026.
- **ant apply (9/3 last week)**: no follow-on Managed Agents structural changes this week beyond `sessions connect` + `auto` permission policy. Bookmark stays intact.
- **`/skill-doctor` (v2.1.261 last week)**: no changes in-window. Run it at start of next scout run.

---

## Parked Idea Unblocks

**No parked ideas unblocked this week.**

Cross-referenced all 28 parked-idea files in `_ops/idea-vault/`. This week's capability changes (Messages API compaction, `omitClaudeMd`, per-command Bash `allowed_domains`, Managed Agents `auto` policy + `sessions connect`, `claude plugin eval`, prompt-cache leak fixes, security-adjacent fixes) do not satisfy any parked-idea blocker.

Categories of blockers, none of which move on this week's items:

- **MedCapture v1 first-pilot gate** (medcapture-hand-kinematics-robotics, medcapture-humanoid-robot-extension, medcapture-stereo-second-camera, sim-lab-mockup-print-bank, sim-lab-rfid-ultrasound-trainer, ems-event-robot-fleet, military-parallel-pipeline, zoll-stryker-bracket): no MedCapture pilot news this week.
- **MedSim-Game substrate maturity** (medical-mmo-open-world, medsim-data-gathering-analytics, medsim-marketing-gtm, medsim-revenue-angles-expansion, medsim-school-employer-custom-content, regional-ems-ecosystem-simulator): substrate work continues; capability changes this week don't accelerate scenario count or engine surface.
- **Hardware / adjacent tech gates** (3rdrider-snap-spectacles: consumer AR glasses <$800; ai-multiview-video-generator: Genie 3 multi-view API OR display-cube-six-screens shipping; haptic-mirror-d4rt: D4RT/worldbuilder release; display-cube-six-screens + swappable-shells-animated-screens: barad-dûr v2 shipping): no hardware/tech-partner announcements this week.
- **Bouren Plan portfolio-focus gates** (painting-wars-pixel-rts: MedCapture focus through July 2026; longplay-monument: everything; ai-augmented-field-sales-scaling: liaison role acceptance): unchanged.
- **Market-validation gates** (instrumented-task-marketplace-for-ai-training: AI-primes willingness-to-pay): no market signals this week.
- **Regulatory/App-Store gate** (group-matchmaking-cascading-tinder: App Store + payment processor + personal-brand triad): unchanged.
- **Money/time gate** (runway-dev-portal-exploration: paid API credits worthiness): unchanged.

**Notable non-unblocks worth naming**:

- **Managed Agents `auto` policy + `ant beta:sessions connect` COULD look like they unblock `regional-ems-ecosystem-simulator`** (which imagines multi-agent orchestration: scenarios, EMS-crew agents, patient-state agents). They do not — the blocker there is time + substrate maturity, not agent-orchestration tooling. Same logic as last week's `ant apply` non-unblock.
- **Messages API compaction COULD look like it unblocks `medsim-school-employer-custom-content` or `medsim-data-gathering-analytics`** (which imagine long-running conversation surfaces with school partners or learners). It does not — the blocker there is substrate maturity + first-pilot signal, not context-length primitive availability.
- **`claude plugin eval` COULD look like it unblocks `telegram-inline-keyboard-question-protocol`** (active-list item, ~2-4 hour build). It does not — the plugin doesn't yet exist, so there's nothing to eval. `claude plugin eval` becomes relevant AFTER the plugin ships. Bookmark.

**One active-list check** (not a parked-unblock): `telegram-inline-keyboard-question-protocol` (status: active, ~2-4 hour build). Nothing this week affects its build path; `claude plugin eval` becomes relevant post-build. No update.
