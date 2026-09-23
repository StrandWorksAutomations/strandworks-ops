---
name: Claude-Capability Scout - 2026-09-23
description: 7-day window (9/17–9/23). **Headline #1 (agent-team + product-build + cost lens): Claude Opus 5.5 shipped (9/22, `claude-opus-5-5`)** — new default Opus, 1M context, 128k max output, always-on adaptive thinking. $4/$20 per MTok (was $5/$25 on Opus 5 = 20% cheaper), cache reads $0.20/MTok (was $0.25 = 20% cheaper cache reads), batch $2/$10. Anthropic's own benchmarks: 40% cheaper than Opus 5 on typical workloads, >30% faster output, matches Fable 5.1 on most work and surpasses it on agentic coding, knowledge work, computer use, visual chart recognition, and multidisciplinary reasoning. Four breaking changes: (a) `thinking: {"type": "disabled"}` returns 400 — thinking is always on, effort controls depth (default `medium`, was `high` on Opus 5); (b) `tool_choice: any` or `tool` return 400 — use `auto` + strict tool use; (c) thinking blocks are now tied to the model AND to the conversation (Opus 5.5 reads Opus/Sonnet/Haiku 4.x + 3.x thinking, Fable 5.1 and Mythos 5.1 read Opus 5.5 thinking, nothing else); (d) `computer_20251124` returns 400 on Claude API + Google Cloud (Bedrock still accepts) — migrate to `computer_toolset_20260801`. Fifth silent-behavior change: text between tool calls now returns as `thinking` blocks (empty at default `display: "omitted"`) — apps that stream progress notes go quiet unless they set a `display` value. Available on Claude API, Amazon Bedrock, Claude Platform on AWS, Google Cloud, Microsoft Foundry. Fast mode research-preview available on Claude API only. **Direct fit for Strandworks + MedSim-Game**: 20% headline price drop + 20% cache-read drop cross-refers Bouren Plan §1 monthly AI-tooling line — every daily Strandworks Claude Code session on Opus 5.5 costs less than the same session on Opus 5. Product-build lens: MedSim-Game consumer-facing chat / agent surfaces (scenario director, learner tutor, analytics chat) get cheaper base + cache reads. **Headline #2 (agent-team lens): AGENTS.md support (v2.1.277, 9/18)** — in a project with no `CLAUDE.md`, Claude Code reads `AGENTS.md` instead; change under "Project instructions" in `/config`. Not yet on Bedrock/Vertex/Foundry. **Alignment with the industry-wide `AGENTS.md` convention (Codex, Cursor, Aider, JetBrains AI); tolerates a `CLAUDE.md`-less repo. Not-a-today for Strandworks** (portfolio-scope + per-project `CLAUDE.md` fully deployed) but bookmark for interoperability if any Strandworks repo ever gets shared with a non-Claude toolchain. **Headline #3 (agent-team + product-build lens): inline tool definitions in mid-conversation system messages (9/22, beta)** — `inline-tools-2026-09-15` header lets a `tool_addition` block carry a full tool definition (`type: "tool_definition"`), so tools can be added / re-schema'd / version-bumped mid-conversation **without editing `tools` and without invalidating the prompt cache**. Paired `mcp-client-2026-09-15` header extends the same primitive to MCP toolsets + returns an `mcp_tool_listing` block that pins the fetched tool list on replay. Available on every model that supports mid-conversation tool changes, Opus 5.5 included. **Direct fit for Strandworks-built agents that ever add tools dynamically** (per-scenario tool packs, per-user MCP servers, per-conversation capability grants). Product-build lens: MedSim-Game agents whose tool surface differs by scenario / role / school-partner can now grow their tool surface without eating prior cache. **Headline #4 (product-build lens): Life Sciences Verification Program opened to broader community (9/17)** — verified biology researchers get "refined classifiers that are more permissive for science tasks" across Claude Science, Claude.ai, Claude Code, and the API, with Mythos + Opus + Sonnet models unlocked. Two tiers: Standard Use (team-wide, annual renewal) + High-risk Use (project-specific, semi-annual; currently limited for Mythos pending government coordination). Applications open 9/17. **Signal, not action, for MedSim-Game.** MedSim's medical content sources (PhysioNet, VitalDB, NIH, peer-reviewed) don't currently hit classifier refusals in practice, so LSVP isn't a today-fix. But it establishes precedent: Anthropic differentiates classifier posture by verified use case. Worth bookmarking if MedSim ever hits a pharmacology / procedure-content refusal that a Standard Use grant would unblock. **Headline #5 (security + correctness lens): Claude Code v2.1.280 (9/22) landed keyboard hardening + auto-mode retry limits + symlinked-write correctness** — Ctrl+C / Ctrl+D twice in `/model`, `/effort`, `/config`, `/status`, `/usage`, `/plugin`, `/sandbox`, `/permissions`, `/artifacts`, `/mobile`, `/login`, `/upgrade`, `/usage-credits`, etc. no longer quits Claude Code (closes the dialog); auto mode denies once when a safety check declines (won't retry) + backs off + stops after ten denials in a row; symlinked-path writes now judged by where they land — `acceptEdits`, allow rules, auto mode no longer approve one that lands outside the tree. **Also this window**: five Claude Code releases in-window (v2.1.276, .277, .278, .279 skipped, .280); auto-mode server-side classifier now default for Claude API + Enterprise + Bedrock/Vertex/Foundry/gateways (v2.1.278, `CLAUDE_CODE_AUTO_MODE_SERVER=0` to opt out) — **removes the classifier-overhead billing that was previously local-model-billed**; TaskOutput tool REMOVED (v2.1.277) — Claude reads a background task's output file with Read instead, `taskOutputMaxChars` + `TASK_MAX_OUTPUT_LENGTH` no longer honored; subagent results now reach the main agent under an explicit header with the result indented, so subagent text can't pass as session instructions; Compliance API local session endpoints now return Claude-in-Chrome transcripts (`product_surface: claude_in_chrome`, beta, Enterprise) — not applicable to Strandworks; four Bash-hardening + LSP + turn-error fixes (`text content blocks must be non-empty`, `null bytes`, Edit regex-too-large, `\uXXXX` escape rewrite); default model on Pro + Team Standard plans switched from Sonnet to Opus (matching Max/Team Premium/Enterprise). **Anthropic engineering blog: still no new post** (sixth consecutive week). **Two Anthropic news posts** (9/17 Life Sciences Verification Program, 9/18 Accenture embedded evaluation partnership — services engagement, not a developer capability). **No new MCP servers, spec updates, or major catalog moves.** **No parked ideas unblocked this week.**
metadata:
  type: report
project: _ops
status: report
---

# Claude-Capability Scout - 2026-09-23

Weekly window: 2026-09-17 → 2026-09-23 (7 days; prior scout ran Wednesday 2026-09-16). Four Claude Code releases in-window (v2.1.276, .277, .278, .280); two Claude Platform release-note days (9/18 + 9/22); two Anthropic news posts (9/17 + 9/18); no Anthropic engineering blog post. Flagship remains **MedSim-Game** per `/PROJECTS/CLAUDE.md`.

## Releases This Week

### Claude Code

**Four versions shipped in-window (v2.1.276 → v2.1.280).** Two structural headlines: `AGENTS.md` support (v2.1.277) + Opus 5.5 as default Opus (v2.1.280). Two removal/behavioral headlines: TaskOutput tool removed (v2.1.277), auto-mode server-side classifier now default across cloud + gateway (v2.1.278). One security-adjacent headline: symlink-write correctness + auto-mode retry limits (v2.1.280). One directional headline: subagent results delivered under an explicit header with indentation so their text cannot pass as session instructions (v2.1.277).

**v2.1.280 (2026-09-22)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added Claude Opus 5.5 (`claude-opus-5-5`), now the default Opus model — 1M context, $4/$20 per MTok with $0.20/MTok cache reads.** **HEADLINE — Cost lens: HIGH.** Prior default was Opus 5 at $5/$25 with $0.25/MTok cache reads. New default drops base 20% + cache reads 20%. See Anthropic Platform section for full model + breaking-changes detail. **Direct fit for Strandworks** — every Strandworks Claude Code session on Opus now runs cheaper by default.
- **Added mouse support to more lists in fullscreen mode**: wheel scrolls the `/skills` list, click on a skill's state option in `/plugin`. UX.
- **Added `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH` to change the 2,048-character cap on MCP tool descriptions and server instructions for every MCP server in the session.** **Agent-team lens: MEDIUM.** Direct fit if any Strandworks MCP server (Chrome, Blender, Linear, Supabase, Telegram, Gmail, Notion) hits the description cap or has long server instructions cut off. Raise cautiously — long descriptions inflate every turn's prefix.
- **Added hook output sizes + count of oversized outputs saved to a file to the `hook_execution_complete` OpenTelemetry event.** Enterprise observability.
- **Fixed writes through a symlinked path being judged by their in-tree spelling**: the prompt names where the write lands, and `acceptEdits`, allow rules, auto mode no longer approve one landing outside. **HEADLINE — Security-adjacent: HIGH.** Prior: a symlinked path could route a write outside the tree while permission rules judged it as in-tree. Fixed. Direct fit for any Strandworks flow with symlinked project dirs (e.g. `/PROJECTS/_3D-ASSET-LIBRARY/` → SSD `/Volumes/ASSETS/PROJECTS/<path> copy`).
- **Fixed auto mode retrying an action over and over when a safety check declined to review it**; the action is now denied once, noting that retrying won't help. **HEADLINE — Cost + correctness lens: HIGH.** Prior: safety-check no-response = infinite retry loop. Fixed. Direct fit for Strandworks auto-mode sessions.
- **Fixed auto mode denying actions over and over without pause when a safety check gave no answer**; retries now back off, and the turn stops with a message after ten in a row. **HEADLINE — Cost + correctness lens: HIGH.** Same class as the fix above — burn-out limit + backoff. Prevents cost spirals on auto mode when a safety classifier flakes.
- **Fixed Write calls failing validation when a model sends `path`, `file_text`, `file_content` or a stray `description` instead of `file_path` and `content`.** Correctness — direct fit for older-model interop.
- **Fixed Ctrl+C or Ctrl+D pressed twice in most dialogs quitting Claude Code instead of closing the dialog** — `/model`, `/effort`, `/config`, `/status`, `/usage`, `/plugin`, `/sandbox`, `/permissions`, `/artifacts`, `/mobile`, `/login`, `/upgrade`, `/usage-credits`, `/install-github-app`, `/setup-bedrock`, `/setup-vertex`. **HEADLINE — UX: HIGH.** Prior: rapid Ctrl+C to close a dialog quit the whole session. Fixed. **Direct fit for Strandworks daily use** — solves a common accidental-quit pattern.
- **Fixed a click that only brought the terminal window to the front also triggering the item under the pointer** — in search pickers, tab bars, agent/workflow rows, slash-command links and suggestion dropdowns. **UX: MEDIUM.** Prior: window-focus click ate as a menu-click. Fixed.
- **Fixed a stray `n` closing dialogs and a stray `y` confirming them**; Enter and Esc accept and cancel (bind `y`/`n` to `confirm:yes`/`confirm:no` in `keybindings.json` to restore). **UX: MEDIUM.** Behavioral change — direct fit if Strandworks muscle memory used `y`/`n`. Restore via keybinding if wanted.
- **Fixed text fields in dialogs losing a typed letter, digit or Space to a keybinding on that key.** UX.
- **Fixed the prompt line staying scrambled on Windows terminals after invisible characters were removed on Enter**; the screen is now repainted so you review the exact text that will be sent. Windows.
- **Fixed the invisible-character cleanup removing the zero-width non-joiner that Persian and Arabic text uses to attach a suffix to a Latin word or number, such as the plural of "PDF".** i18n.
- **Fixed voice dictation not stopping on Ctrl+C** (the prompt cleared but the microphone kept recording), Esc not cancelling while a transcript was processing, and held Space starting dictation from the transcript view and vim NORMAL mode. **Direct fit for Strandworks voice-dictation flow** if used.
- **Fixed a model switch made from a host app (Claude Desktop, VS Code, SDK) while Claude is working causing a prompt-cache miss on the next prompt.** **Cost lens: MEDIUM.** Prior: switching model in Desktop / VS Code mid-work punched a cache hole. Fixed.
- **Fixed resumed fork subagents rebuilding their tool list instead of re-sending the one they first used**, which broke prompt caching for that agent. **Cost lens: MEDIUM.** Direct fit for Strandworks fork-subagent flow.
- **Fixed subagent hand-back messages showing an internal provenance preamble when expanded outside verbose mode.** UX.
- **Fixed `installed_plugins.json` keeping the install-time commit after updating a plugin from a GitHub repository or git URL that tracks a branch or tag.** Correctness — direct fit for Strandworks plugin-tracking-branch pattern if used.
- **Fixed skills in `~/.claude/skills/` being moved to `~/.claude/skills/.trash/` when a `manifest.json` in that folder listed their names.** Correctness — direct fit for Strandworks `~/.claude/skills/*` layout.
- **Fixed the session feedback survey showing no hover highlight on light and ANSI themes.** UX.
- **Fixed `/workflows` briefly showing a one-row list before opening the only run.** UX.
- **Fixed the mouse wheel not scrolling selection lists with hidden options** (such as `/model` and `/permissions`) in fullscreen mode. UX.
- **Fixed a skill you switched off showing the same red ✘ as a plugin that failed to load in `/plugin` and `/skills`**; off now shows a dim ◯. **UX: MEDIUM.** Direct fit — Strandworks has many skills, off-vs-broken distinction now visible.
- **Fixed multi-select option descriptions being indented under the option number instead of under the label.** UX.
- **Fixed the search box in `/plugin`, `/skills` and `/mcp` losing its right border in fullscreen mode.** UX.
- **Fixed `/mcp` showing △ in the server list but ⚠ in the detail view for the same server**; the list, detail views and `/plugin` now all show ⚠. UX consistency.
- **Fixed Home and End doing nothing in the `/config` settings list and in selection lists such as `/model`, `/memory` and permission prompts.** UX.
- **Fixed PgUp/PgDn in the `/skills` menu wrapping past the first or last skill instead of stopping there.** UX.
- **Fixed Tab silently changing the selected setting's value in the `/config` list**; it now does nothing there. UX.
- **Fixed conversations failing on every turn with a "role 'system' must precede an 'assistant' message" API error.** **Correctness: HIGH.** Direct fit if Strandworks ever hit this failure mode.
- **Fixed conversations with the advisor on failing every turn with API Error 400 "Input tag 'advisor_20260301'" behind a proxy or gateway that doesn't support it**; the request now retries without it. Enterprise/gateway.
- **Fixed a session failing on every turn and `/compact` when its saved history held a malformed notice about MCP tools that could not be loaded.** Correctness.
- **Fixed a crash when resuming a session whose saved transcript holds a malformed system message or a memory-saved notice without its file list.** Correctness.
- **Fixed one cause of long-running fullscreen sessions exiting with "Claude Code exited after an unrecoverable interface error"**: a damaged cached message list is now rebuilt. **Direct fit for Strandworks long-running iTerm2 sessions.**
- **Fixed Claude Code hanging when a settings file, or a file it re-reads after an edit, is replaced by a named pipe mid-read.** Correctness.
- **Fixed `/config` crashing and some on/off preferences being misread when a preference that has moved to `settings.json` still holds a value like `null` or `"false"` in `~/.claude.json`.** Correctness.
- **Fixed resuming a session with unfinished background agents, shells or workflows starting a model turn on its own before you typed anything.** **Cost + correctness lens: MEDIUM.** Prior: resume auto-fired a turn before user input. Fixed. Direct fit for Strandworks `--resume` + background-agents pattern.
- **Fixed messages sent to a background subagent being silently lost in headless and SDK sessions when the subagent was finishing its turn.** Correctness.
- **Fixed a finished subagent's report being lost when the conversation that launched it was compacted before the report was read.** **Agent-team lens: HIGH.** Prior: subagent report lost on parent auto-compact. Fixed. Direct fit for Strandworks scout / verify / code-review subagent flows.
- **Fixed background subagents being unable to use the LSP tool when an LSP plugin is active.** Correctness.
- **Fixed background shell tasks reporting benign non-zero exits (e.g. grep with no matches) as failures.** **Direct fit for Strandworks Bash scripting** — grep-with-no-matches is a common no-failure result.
- **Fixed background sessions (`claude --bg`) being unable to run git, hooks, plugins and other helper programs when an environment variable handed to the session contained a NUL character.** Correctness — direct fit for Strandworks `--bg` scheduled jobs.
- **Fixed Ctrl+C needing three or four presses to exit while background subagents are running**; two presses now exit. UX.
- **Fixed IDE selection being dropped when a sent prompt comes back into the input**, such as pressing Esc to edit it, rewinding to it, or pressing Esc while startup hooks run. UX.
- **Fixed a `!` shell-mode prompt stashed with Ctrl+S coming back as a plain prompt when restored**, and `/` listing file paths right after stashing one. UX.
- **Fixed `claude agents` showing a blank, unresponsive screen instead of an error when the temp directory is full, not writable or owned by another user.** Observability.
- **Fixed an MCP server re-added under the same name after `claude mcp remove` still showing as needing authentication instead of reconnecting.** MCP correctness.
- **Fixed background plugin marketplace auto-update ignoring git credential helpers**, so private-repo marketplaces were re-cloned every run or never updated. Correctness.
- **Fixed `claude plugin update` clearing a plugin's recorded commit and moving it to version "unknown"** when the official marketplace's snapshot file is a link or too large. Correctness.
- **Fixed the Artifact tool silently disappearing when your organization's policy can't be loaded (for example behind a web proxy)**; Claude now says what's blocking it. Observability.
- **Fixed artifact republishes silently resetting stored database access rules or dropping the viewer profile scope when that capability was re-sent without them**; they are now refused. **Security-adjacent: MEDIUM.** Prior: republish could drop access-rule state. Fixed.
- **Fixed `/ultrareview` reporting a stopped cloud review as completed or as an error to retry**, and waiting out the full timeout when its session was deleted or the signed-in account changed. Correctness.
- **Fixed the Claude app showing a missing or stale context usage figure for Remote Control and cloud sessions right after `/compact` or `/clear`.** Correctness.
- **Fixed the Claude app's diff view for Remote Control and cloud sessions dropping a branch's committed files whenever there are also uncommitted changes.** Correctness.
- **Fixed cloud and self-hosted runner sessions failing with "Authentication failed" after waiting out a long overload during which the session's access token was rotated.** Correctness.
- **Fixed memory write conflicts in Cowork sessions showing Claude only the start and end of a memory file over about 10,800 characters**, so the retried write dropped the middle. **Direct fit for Strandworks `MEMORY.md` (currently ~2,700 chars — well under, but flag if it drifts).**
- **Self-hosted runner**: Fixed lifecycle-hook commits failing to sign under `--configure-git`. Enterprise.
- **Windows**: Fixed background cleanup deleting a directory symlink or junction used to relocate `~/.claude/session-env`, `image-cache` or another cleaned-up folder. Windows-only.
- **Self-hosted runner**: Fixed a turn that ended right at a `--retire-at` release losing its finished signal. Enterprise.
- **Reverted `ctrl+l` / `cmd+k` in fullscreen mode clearing the transcript view (added in 2.1.260)**; they redraw the screen again. **UX regression fix — direct fit for Strandworks daily use.** Prior: `ctrl+l` cleared the transcript in fullscreen (frustrating). Fixed.
- **Improved `/permissions`**: focus returns to the rule list after viewing, adding or deleting a rule, and the delete-rule and remove-directory confirmations now default to No. UX.
- **Improved `/permissions` tab navigation**: ←/→ and Tab in a rule list now switch tabs without moving focus to the tab bar. UX.
- **Improved `/cost` cache-miss causes to name thinking mode and thinking display changes.** **Agent-team lens: MEDIUM.** Better `/cost` observability — direct fit for Strandworks cost debugging.
- **Improved the Artifact tool so that when Claude cannot read an artifact link it was given, it tells the user before continuing.** UX.
- **Improved `/install-github-app`**: the GitHub CLI check and repository selection steps now show "Esc to cancel". UX.
- **Improved the `/artifacts` and `/workflows` lists**: scrollbar shows how much of a long list is hidden + position. UX.
- **Improved the workflow progress tree**: running agents and phases show a dim dot instead of ⟳. UX.
- **Improved `/plugin`'s Add Marketplace form in fullscreen**: no inner box, text + key hints line up. UX.
- **Improved the `/workflows` detail view in fullscreen**: no second horizontal rule under the pane's divider. UX.
- **Improved code blocks that don't name a language**: colored like inline code, so commands stand out from surrounding text. **UX — direct fit for Strandworks daily reading of long tool output.**
- **Improved `/btw` asked while a tool is still running**: the side question now knows that call is in progress instead of reading it as a failed one. Correctness.
- **Improved the UserPromptSubmit hook timeout notice + debug log to name which hook command timed out.** **Direct fit for Strandworks hook-heavy setup.**
- **Improved `@` file suggestions**: a file whose name contains the query now ranks above one that only matches across its folder names. UX.
- **Improved artifact pages**: no Print buttons, confirm dialogs or device features the viewer blocks, email + phone as text, dark mode reaches form controls + scrollbars. UX.
- **Improved `/ultrareview` uploads**: renamed copies of key files, such as `id_rsa copy` or `kubeconfig (1).yaml`, now also stay on your machine. **Security-adjacent: HIGH cred-hygiene.** Prior: renamed key files could leak into `/ultrareview` upload. Fixed. **Direct fit for Strandworks — `.env.master` copies, credential-file variants often left in `~/Downloads/` etc.**
- **Improved the cross-session messaging startup warning to explain that `--debug-file` writes a debug log to a path you choose.** UX.
- **Changed the default model on Pro and Team Standard plans from Sonnet to Opus**, matching Max, Team Premium, and Enterprise. **Cost lens: NOTE.** Not applicable to Strandworks (Max plan).
- **Changed an effort level saved before `/effort` became per-model to no longer apply to newly released models such as Opus 5.5**; they start at their default until you pick a level. **Direct fit for Strandworks** — Opus 5.5 starts at default `medium` effort even if a prior global effort was saved.
- **Changed Opus 4.7, Opus 4.8 and Fable 5 to stop holding their launch-default effort over `/effort` in `-p` or the Agent SDK, a project, managed or `--settings` `effortLevel`, or a per-model level.** **Direct fit for Strandworks headless `-p` runs** (scout, cockpit) — if effort was set per-model it's now honored across these paths.
- **Changed `/autocompact`'s footer hint to name ←/→**, the keys that adjust other ordered values. UX.
- **Changed `/fast`'s footer to name Space as the toggle key.** UX.
- **Self-hosted runner**: Changed git in lifecycle hooks to ignore hook folders and programs named in the runner's shared git files. Enterprise.
- **Changed plugin marketplaces whose name imitates a reserved marketplace name to be refused when added**, and to stop loading if one was already added. **Security-adjacent: MEDIUM.** Prior: no name-collision guard against reserved marketplace names. Fixed.
- **Changed `PermissionRequest` hooks**: an agent-type hook no longer runs there, since its answer could never allow or deny the request; it now shows an error pointing to command or http hooks. **Agent-team lens: MEDIUM.** Direct fit if any Strandworks PermissionRequest hook was ever configured as an agent hook.
- **[VSCode]** Status dialog (`/status`), Sandbox dialog (`/sandbox`), Claude in Chrome dialog (`/chrome`), Export conversation (`/export`), skills detail + typed `/skills`, typed `/plan`, paste-marker for pasted text ≥800 chars / 2 line breaks, invisible-Unicode strip in chat box, "Open in New Tab" opens beside working group, and multiple correctness fixes (effort chip stale, Python-hangs 60s timeout, plan approval auto-mode option, session-list arrow after archive, paste marker in own messages after reopen).
- **[Claude Code on the web]** Admin Routines on/off moved under Admin → Capabilities → Remote sessions; GitHub Enterprise Server token renews after 8h; edit-moments-before-scheduled-routine fix; file links outside working dir disabled; auto-mode retry-after-expired-approval fix; cloud sessions save files where the app can open them; empty-repo-picker removed when admin has GitHub off.
- **[Claude Tag]** Slack native Working indicator + Stop button + thread title in Claude's threads; guest-join / last-guest-leave notice under Restrict / Channel-only guest setting; Enterprise Grid workspace join fix for scheduled routines; file-scan-outage retry; bullet-starting-with-+-or-* rendering fix; setup-script failure names the script; GitHub banner reasons in Claude Tag admin.
- **[Code Review]** Code Review check run now says when `REVIEW.md` instructions were cut / left out for exceeding a size limit, naming the file + limit.

**v2.1.278 (2026-09-19)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Changed auto mode for Claude API + Enterprise users, and on Bedrock, Vertex, Foundry and gateways, to default to the server-side classifier, which does not charge for classifier overhead** (`CLAUDE_CODE_AUTO_MODE_SERVER=0` opts out on Bedrock/Vertex/Foundry/gateways); warns on billed fallback. See [auto mode classifier billing docs](https://code.claude.com/docs/en/auto-mode-classifier-billing). **HEADLINE — Cost lens: HIGH.** Prior: auto-mode classifier ran locally + was billed as normal inference. New: server-side classifier is the default + not billed for overhead. **Direct fit for every Strandworks Claude API session using auto mode.**
- **Added an `Auto mode server` row to `/status` showing whether this session's auto-mode classifier runs on the server.** Observability.

**v2.1.277 (2026-09-18)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `AGENTS.md` support: in a project with no `CLAUDE.md`, Claude Code reads `AGENTS.md` instead**; change it under "Project instructions" in `/config` (not yet on Bedrock, Vertex or Foundry). **HEADLINE — Agent-team lens: HIGH interop.** Prior: only `CLAUDE.md` was read as project instructions. New: `AGENTS.md` used when `CLAUDE.md` absent. **Alignment with the industry-wide convention (Codex, Cursor, Aider, JetBrains AI, agents.md). Not-a-today for Strandworks** (portfolio + per-project `CLAUDE.md` fully deployed) but bookmark for shared / handed-off repos.
- **Added `CLAUDE_GATEWAY_PROXY_IS_EGRESS_BOUNDARY=1` for Claude apps gateways whose only egress is a forward proxy**: every outbound request hands the proxy the hostname instead of resolving it locally. Enterprise.
- **Added an optional `headers:` map on Claude apps gateway upstreams**, to send static headers to a proxy in front of a provider. Enterprise.
- **Added a line saying a background task's update is waiting when it finishes while a panel such as `/tasks` is open.** UX.
- **Fixed `claude -p` and Agent SDK sessions that could hang with no result after an internal error**; they now report the error and exit with code 1. **Direct fit for Strandworks headless scheduled jobs** — a silent hang now surfaces as a proper error + exit 1.
- **Fixed conversations failing every request with "text content blocks must be non-empty" when an earlier assistant turn held an empty text block beside other content**, including after `--resume`. Correctness — direct fit for Strandworks `--resume` daily use.
- **Fixed being unexpectedly logged out when an older Claude Code build (for example an IDE extension's bundled CLI) runs on the same machine as the current one.** Correctness.
- **Fixed interactive start-up hanging or showing an error for `ANTHROPIC_API_KEY` users when `~/.claude.json` holds a malformed `customApiKeyResponses` value.** Correctness.
- **Fixed update checks erroring every 30 minutes**, + `claude update` hanging when a min/max version is set, if a proxy returns an invalid version. Correctness.
- **Fixed `claude update` on winget- or apk-managed installs reporting "up to date" when the version lookup failed.** Correctness.
- **Fixed `claude plugin install` sometimes failing and breaking the installed copy when reinstalling a plugin version that a session or another program was using**; an unchanged copy is now left alone. Correctness.
- **Fixed Grep and Glob reporting no matches when the search could not start because the system was out of processes, memory or file handles**; they now return an error. **Correctness: MEDIUM.** Prior: silent no-match on resource exhaustion. Fixed. Direct fit for Strandworks Grep-heavy sessions on a saturated machine.
- **Fixed the Write tool silently ending the turn as a declined permission when the target path is an existing directory**; it now reports a clear error. Correctness.
- **Fixed the Edit tool treating an escaped backslash followed by `uXXXX` text as a `\uXXXX` escape**, which could make an edit of a non-ASCII character rewrite an escaped backslash sequence instead. **Correctness: MEDIUM.** Direct fit if Strandworks Edit calls touch non-ASCII content.
- **Fixed the Edit tool reporting "Invalid regular expression: regular expression too large" instead of "String not found in file" when a very large edit containing non-ASCII text did not match the file.** Correctness — misleading-error fix.
- **Fixed a turn ending early with "Path contains null bytes" when a tool call's file path contained ` ` written as an escape sequence**; escaped control characters now stay as literal text. **Correctness: MEDIUM.** Direct fit if Strandworks paths ever include escape-sequenced control chars.
- **Fixed background sessions (`claude --bg`) exiting when a plugin's LSP server exited or closed its stdin.** Correctness.
- **Fixed crash ("Type error") when opening `/mcp` or `/plugin manage` with a malformed `claudeAiMcpEverConnected` value in `~/.claude.json`.** Correctness.
- **Fixed a crash at launch when `~/.claude.json` holds a malformed `theme` value.** Correctness.
- **Fixed a crash ("unrecoverable interface error") when the prompt held text containing terminal color codes**, for example a prompt recalled from history or text loaded from the external editor. Correctness.
- **Fixed a crash when resuming a session whose saved history holds an assistant message stored as a plain string.** Correctness.
- **Fixed sessions on slow or heavily loaded machines sometimes exiting with "Claude Code exited after an unrecoverable interface error" when the first spinner appeared.** Correctness — direct fit for Strandworks first-turn crash pattern if seen.
- **Fixed a rare case where the screen could stop updating for the rest of the session after an internal rendering error.** Correctness.
- **Fixed a rare case on Windows where a turn could stop with an error such as "Out of memory" right after Claude replied, so that reply's tool calls never ran.** Windows-only.
- **Fixed sessions continued after `/clear` (restart, `--continue`, `--resume`) missing part of their first message when a SessionStart hook printed output**, causing a full prompt-cache miss. **Cost lens: HIGH.** Prior: SessionStart hook output silently dropped part of the first message on continuation → cache miss. Fixed. Direct fit for Strandworks SessionStart-hook-heavy setup.
- **Fixed messages from other agents (such as a subagent's SendMessage) that arrived mid-turn showing up below the "Ran N shell commands" row instead of where they arrived.** UX.
- **Fixed the "copied" notice not appearing after drag-selecting text in the fullscreen `/resume` picker + other panels that cover the prompt area.** UX.
- **Fixed `$TMPDIR` expanding empty in Bash commands that run outside the sandbox while sandboxing is enabled.** Correctness — direct fit for Strandworks Bash flows with sandboxing.
- **Fixed WebFetch and WebSearch in Cowork cloud sessions not telling Claude why a request was refused**, such as a used-up fetch budget or an admin policy. Observability.
- **Fixed the Claude apps gateway's telemetry relay ignoring a collector hostname or domain listed in `NO_PROXY` when a proxy is set.** Enterprise.
- **Fixed one malformed `strictKnownMarketplaces` or `blockedMarketplaces` entry silently disabling the whole enterprise marketplace policy.** Enterprise.
- **Fixed failed auto-updates leaving large staged downloads behind in `~/.cache/claude/staging`.** Cleanup.
- **Fixed `/plugin` not stripping terminal control characters from messages on the Installed tab**, such as the error of a failed plugin update. UX.
- **Fixed `/plugin` → Installed and `/skills` crashing when a skill or legacy command is named like a built-in Object property such as `constructor` or `toString`.** Correctness.
- **Fixed `/plugin` closing with no message when every install in a multi-select failed.** UX.
- **Fixed uninstalled plugins reappearing as "failed to load" rows in `/plugin` Installed**, and Remove not clearing such a row. Correctness.
- **Fixed plugins from the official marketplace being recorded without their commit in `installed_plugins.json`**, and `installed_plugins.json` keeping the old commit after updating a pinned-commit plugin. Correctness.
- **Fixed plugin reload previews keeping every previewed copy of a plugin archive unpacked until exit**, and overwriting the cached `--plugin-url` archive a reload falls back to when its download fails. **Cleanup / correctness — direct fit for Strandworks disk-cleanup pattern.**
- **Fixed Remote Control session bookkeeping failing when `~/.claude.json` holds a malformed placeholder record.** Correctness.
- **Fixed the error after a revoked claude.ai login blaming an expired Anthropic profile**; it now leads with `/login`. UX.
- **Fixed typed or pasted text occasionally coming out scrambled in the `claude agents` dispatch input during key repeat or very fast input.** UX.
- **Fixed a crash ("unrecoverable interface error") when resuming a session whose saved transcript contains a stop hook summary without a well-formed hook list.** Correctness.
- **Fixed Enter on a selected agent panel row doing nothing when `keybindings.json` rebinds Enter in the Chat context**, for example to `chat:queueSubmit`. UX.
- **Fixed PDF page reads on Windows failing when the working folder's path is long (about 120 characters or more).** Windows-only.
- **Fixed a headless resume (`claude -p --resume`, the SDK, a VS Code extension window reload) starting the session's cost and usage totals at zero**; headless sessions now save their totals at exit. **Cost observability: MEDIUM.** Direct fit for Strandworks `--resume` from headless.
- **Fixed project skills from the main repository not loading in `--worktree` sessions when `.claude/skills` is untracked.** **Direct fit for Strandworks worktree pattern.**
- **Fixed a `sandbox.excludedCommands` glob exempting an entire compound Bash command from the sandbox when only one part matched**; every part must now match. **Security-adjacent: MEDIUM.** Prior: partial-match sandbox exemption bypass. Fixed.
- **Fixed resumed subagents + teammates re-rendering the MCP tool definitions they had loaded**, which broke prompt caching for that agent. **Cost lens: MEDIUM.** Direct fit for Strandworks subagent flows.
- **Fixed rate-limited artifact publishes telling Claude to stop retrying**; Claude is now told nothing was published + when to send the same publish again. Correctness.
- **Fixed attachments recorded earlier in a conversation being re-rendered after a resume or relaunch**, which dropped extended thinking + missed the prompt cache. **Cost lens: MEDIUM.** Direct fit for Strandworks resume + attachment-heavy sessions.
- **Fixed Console sign-in showing only "Request failed with status code 400" when the server refuses to create an API key**; it now shows the server's message. Observability.
- **Fixed messages typed while Claude is still working sometimes being ignored by the model.** **Correctness: HIGH.** Direct fit for Strandworks — typing-during-work is a routine pattern.
- **Improved session start-up for SDK + headless (`-p`) use**: the first turn no longer waits on the per-directory `CLAUDE.md` lookup. **Latency win for Strandworks headless scout jobs.**
- **Improved the Claude apps gateway's loopback error messages to name `CLAUDE_GATEWAY_ALLOW_LOOPBACK`.** Enterprise.
- **Improved `/plugin` Installed**: an MCP server listed apart from its plugin now shows which plugin it belongs to. UX.
- **Improved `claude plugin install` on an already-installed plugin**: says when the marketplace offers a newer version + names `claude plugin update`. UX.
- **Improved the startup notice overflow line under the logo**: reads "N more notices hidden" instead of "+N more · /status". UX.
- **Improved prompt handling**: invisible Unicode formatting + tag characters in a prompt are removed + the cleaned prompt is shown for review before it is sent. **Security-adjacent: MEDIUM.** Defends against invisible-char prompt injection.
- **Improved `/ultrareview` when there's nothing to review**: says which case, offers a command that reviews latest commit, new repo's first commit reviewed in full. UX.
- **Improved artifact link handling so Claude reads claude.ai artifact links with the Artifact tool instead of WebFetch when that tool is available.** Correctness.
- **Improved the dangerous-rm permission prompt to name the flagged rm command + suggest a `${VAR:?}` guard**, so headless runs can recover. **Security-adjacent: MEDIUM.** Prior: dangerous-rm prompt cryptic. Fixed. Direct fit for Strandworks Bash `rm` flows.
- **Improved the Artifact tool's permission prompts**: shorter sentences, pages + artifacts named by title / file name, links listed after the text. UX.
- **Changed Fable to always appear in `/model` on the Anthropic API**; it is greyed out only when your organization's settings disable it. UX.
- **Changed the Bash sandbox instructions on Bedrock, Vertex + Foundry to the first-party wording.** Enterprise parity.
- **Changed `/ultrareview` in non-interactive sessions to refuse when the repository has no base branch or shared history.** Correctness.
- **Changed subagent results to reach the main agent under a header marking them as subagent output, with the result indented, so text in a subagent's result cannot pass as the session's own instructions.** **HEADLINE — Security-adjacent: HIGH.** Prior: a subagent's returned text was concatenated as the caller's next message → prompt-injection surface if subagent output contained instructions or if the subagent was hijacked. New: framed under a header + indented so the caller model reads it as subagent output, not as its own instructions. **Direct fit for Strandworks scout / verify / code-review subagent flows** — every one of them consumes external content (web, GitHub, changelogs, PR diffs) that could contain adversarial instructions.
- **Changed workflow scripts' computed `agent()` prompts on Bedrock, Vertex + Foundry to reach the subagent framed as script-authored text**, so the safety classifier does not read them as the user. Enterprise safety.
- **Removed the background Haiku auto-title request from `claude -p` runs launched outside an SDK or IDE.** **Cost lens: MEDIUM.** Removes a small tax on Strandworks headless runs.
- **Removed the deprecated TaskOutput tool**; Claude reads a background task's output file with Read instead, and the `taskOutputMaxChars` setting + `TASK_MAX_OUTPUT_LENGTH` no longer have any effect. **HEADLINE — Agent-team lens: MEDIUM.** **Breaking change** — if any Strandworks skill/workflow ever called TaskOutput, migrate to Read of the task's output file. Confirmed still available in the deferred-tools list at session start, but flagged deprecated.
- **[VSCode]** Sign out row + typed `/logout`; background shells + running tasks in agent map + typed `/tasks`; Copy response + typed `/copy`; inactive-session archive notice + Unarchive all; cost/usage in Account & usage where plan limits don't apply; multiple correctness fixes (General config row, effort slider, Auto missing from mode picker with cased alias, `/fast` not saving, `/plugin install --marketplace`).
- **[Claude Code on the web]** Personal + Organization sections in environment picker (Team + Enterprise); organization environments open read-only from Code tab, admin edit under Admin → Cloud environments; Custom-network-access saved-with-no-domains reverting-to-Trusted fix; admin Claude Code "Web" renamed to "Cloud sessions", redundant Mobile row removed.
- **[Claude Tag]** Enterprise Grid org-wide install routine-reading-other-channels fix; credential preset "Learn more" links open vendor page; Pylon EU host; Google Cloud credential form errors; network events log response-status through AWS signing / client certs / custom CA.

**v2.1.276 (2026-09-18)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Fixed every request failing with `400 … Input tag 'advisor_20260301'` when `ANTHROPIC_BASE_URL` points at a proxy or gateway** (v2.1.275 regression). Enterprise/gateway — same-day regression fix.

---

### Anthropic Platform

**Two release-note days in-window (9/18 + 9/22).** One major model release (Opus 5.5). One beta primitive addition (inline tool definitions). One compliance-API expansion (Claude in Chrome sessions).

**Claude Opus 5.5 — 2026-09-22** — [what's new in Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5) · [migration guide](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide) · [prompting Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)

**Model IDs**: Claude API `claude-opus-5-5`; Bedrock `anthropic.claude-opus-5-5`; Google Cloud + Microsoft Foundry `claude-opus-5-5`.

**Pricing**: $4/$20 per MTok (Opus 5 was $5/$25 — 20% drop base). 5-min cache writes $5/MTok, 1-hour cache writes $8/MTok, cache reads $0.20/MTok = 0.05x base input (Opus 5 was $0.25 = 20% drop cache reads). Batch processing $2/$10 (half price). Anthropic's benchmarks: 40% cheaper on typical workloads vs Opus 5, >30% faster output, matches Fable 5.1 on most work, surpasses Fable 5.1 on agentic coding, knowledge work, computer use, visual chart recognition, multidisciplinary reasoning.

**Context + output**: 1M context window (default), 128k max output tokens, adaptive thinking always on. Default effort `medium` (Opus 5 default was `high`).

**Availability**: Claude API, Amazon Bedrock, Claude Platform on AWS, Google Cloud, Microsoft Foundry.

**Fast mode**: research preview, available on **Claude API only** (not Bedrock/Vertex/Foundry/Claude Platform on AWS). Set `speed: "fast"` with `fast-mode-2026-02-01` beta header.

**Four breaking changes vs Opus 5** (first three also apply on Fable 5.1):

1. **Thinking can't be disabled.** `thinking: {"type": "disabled"}` returns 400. Manual budget `thinking: {"type": "enabled", "budget_tokens": N}` also returns 400. Omit `thinking` or send `thinking: {"type": "adaptive"}` (equivalent). Control thinking depth via `effort` parameter.
2. **Forced tool use returns 400.** `tool_choice: {"type": "any"}` and `{"type": "tool", "name": "..."}` rejected. Use `auto` + strict tool use, or structured outputs, or prompt the model to call a tool.
3. **Thinking blocks are tied to the model AND the conversation.** Opus 5.5 reads thinking from Opus/Sonnet/Haiku 4.x + 3.x. Fable 5.1 + Mythos 5.1 read Opus 5.5 thinking. Nothing else reads Opus 5.5 thinking. Also: any pre-block change to `system`/`tools`/earlier messages triggers 400 on replay for accounts created ≥ 2026-08-31 00:00 UTC. Set `thinking-binding-controls-2026-08-01` beta header + `thinking.block_binding.prefix_mismatch_behavior: "drop_block"` to drop instead of erroring. Anthropic's official mitigation: **keep the conversation append-only + use mid-conversation system messages instead of edits**.
4. **On Claude API + Google Cloud, `computer_20251124` computer-use tool returns 400.** Migrate to `computer_toolset_20260801`. Bedrock still accepts `computer_20251124`.

**Silent-behavior change #5**: text between tool calls now returns as `thinking` blocks (empty at default `display: "omitted"`) instead of `text` blocks. Apps that stream these progress notes to users **go quiet between tool calls** unless they explicitly opt-in to `display` values on `thinking`.

**Silent-behavior differences**:
- More thinking per turn at a given effort level (especially at `xhigh` + `max`) — re-sweep effort rather than carrying old settings.
- Sharper reading of charts, diagrams, screenshots — prompt-side vision workarounds built for earlier models may no longer be needed.
- More safeguard categories: **biology safety classifier now runs in addition to cybersecurity**, and requests pushing the model to reproduce its internal reasoning in the response text can be declined with `reasoning_extraction` category.

**Cost + product-build lens**: 20% headline price drop + 20% cache-read drop + 40% cheaper on typical workloads (per Anthropic's benchmarks) = every Strandworks Claude Code session on Opus + every MedSim-Game consumer-facing agent call on Opus becomes materially cheaper. Cache reads at $0.20/MTok = 0.05x base = 95% discount on cached prefix, which pairs with the multi-week prompt-cache-leak-closing pattern in Claude Code. **HEADLINE — Cross-refers Bouren Plan §1 monthly AI-tooling line.**

**Define tools in a mid-conversation system message (beta) — 2026-09-22** — [docs](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages#define-tools-in-a-message-beta)
- **Beta header**: `inline-tools-2026-09-15`.
- **What it does**: A `tool_addition` block in a mid-conversation system message can now carry a **full tool definition** (`tool: {"type": "tool_definition", "definition": {...}}`) instead of a reference. Add a tool, change its schema, or move a server tool to a newer version **without editing `tools` and without invalidating the prompt cache**.
- **Paired header**: `mcp-client-2026-09-15` extends the same primitive to MCP toolsets. The definition can be an MCP toolset (`{"type": "mcp_toolset", "mcp_server_name": "..."}`), and the response records each server's fetched tool list in an `mcp_tool_listing` block that pins that list when you send it back.
- **Also carries**: existing `mid-conversation-tool-changes-2026-07-01` header (adds/removes by reference), `mid-conversation-system-clear-at-2026-08-21` (turn-scoped messages), `mid-conversation-output-config-2026-07-01` (per-message effort).
- **Availability**: every model that supports mid-conversation tool changes, Opus 5.5 included.
- **HEADLINE — Agent-team + product-build lens: HIGH.** Prior: adding a tool mid-conversation required editing the top-level `tools` array → cache invalidation. New: full tool definition inline in a system message → cache stays. **Direct fit for Strandworks-built agents that add tools dynamically** (per-scenario tool packs, per-user MCP servers, per-conversation capability grants). **Product-build lens**: MedSim-Game agents whose tool surface differs by scenario / role / school-partner can grow their tool surface without eating prior cache.

**Compliance API local session endpoints now return Claude-in-Chrome transcripts — 2026-09-18** — [compliance sessions docs](https://platform.claude.com/docs/en/manage-claude/compliance-sessions#retrieve-local-sessions)
- **What it does**: Local session endpoints now also return transcripts of Claude-in-Chrome sessions (`product_surface` value `claude_in_chrome`), in beta for Claude Enterprise organizations, with the existing Compliance Access Key + `read:compliance_user_data` scope.
- **Applicability**: Claude Enterprise only. **Not applicable to Strandworks** (Max plan). Bookmarked for completeness.

**No pricing changes** beyond the Opus 5.5 pricing that lands with the model release. Fable 5.1 remains $10/$50 per MTok with $0.25/MTok cache reads. Fable 5, Mythos 5.1, Sonnet 4.6, Haiku 4.5 pricing unchanged.

**No model deprecations in window.** Opus 5.5 launches alongside, does not replace, Opus 5.

**No new beta headers** beyond `inline-tools-2026-09-15` + `mcp-client-2026-09-15` (both released 9/22 with Opus 5.5).

---

### MCP Ecosystem

**No net-new headline MCP servers, catalog entries, or spec updates in the window.** Spec remains **MCP 2026-07-28** (stateless core, hardened auth, graduated Apps + Tasks extensions), unchanged. PulseMCP directory continues steady growth (~22,090+ servers per pulsemcp.com; up from ~22,070+ last week — noise-level growth, no headline additions).

**Notable this week: the `mcp-client-2026-09-15` beta header for the Messages API** (see Anthropic Platform above) lets an MCP toolset be added mid-conversation via `tool_addition` block, with the response recording each server's fetched tool list in an `mcp_tool_listing` block that pins it on replay. This is a **Messages API primitive**, not an MCP-spec change — but it changes how a Messages-API-hosted client interacts with MCP servers.

**Client-side MCP fixes landed in Claude Code** (see Claude Code section for full detail):
- **`CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH` new env var** (v2.1.280) — override the 2,048-character cap on MCP tool descriptions + server instructions.
- **`/mcp` server-status glyph now consistent** (v2.1.280) — list, detail views, `/plugin` all show ⚠ instead of the earlier list-△ / detail-⚠ split.
- **MCP server re-added under the same name after `claude mcp remove` no longer stuck showing "needs authentication"** (v2.1.280) — reconnects instead.
- **Resumed subagents + teammates no longer re-render MCP tool definitions** (v2.1.277) — prompt-cache preservation.
- **MCP servers via crash-safe malformed-config recovery** (v2.1.277) — `/mcp` + `/plugin manage` no longer crash on malformed `claudeAiMcpEverConnected` value in `~/.claude.json`.
- **MCP-tool bare-name search + list_changed tight-loop fixes carried in from v2.1.271** (still relevant).

---

### Agent Patterns + Best Practices

**No net-new Anthropic engineering blog post in the window. Sixth consecutive week without a new engineering-blog release.** Engineering blog's most recent post remains "An update on recent Claude Code quality reports" from April 2026.

**Two Anthropic news posts in-window** (both 9/17 + 9/18, both non-capability):

1. **[Introducing the Life Sciences Verification Program](https://www.anthropic.com/news/life-sciences-verification-program)** — 2026-09-17. Two tiers (Standard Use: team-wide, annual, most biology work; High-risk Use: project-specific, semi-annual, currently limited for Mythos pending government coordination). Refined classifiers "more permissive for science tasks than our generally available models" across Claude Science, Claude.ai, Claude Code, API. Applications open 9/17 to broader life-sciences community. First-party console for Enterprise + Team plans; users can switch between grants natively in API + Claude Science. Monitoring is offline analysis (not real-time blocking), 30-day retention for flagged activity review. **Product-build lens (MedSim-Game): SIGNAL, NOT ACTION.** MedSim content (PhysioNet, VitalDB, NIH, peer-reviewed) doesn't hit classifier refusals in current practice. But: Anthropic now differentiates classifier posture by verified use case, which is a precedent worth remembering if MedSim ever hits a pharmacology / procedure-content refusal that a Standard Use grant would unblock.

2. **[Partnering with Accenture on embedded evaluation](https://www.anthropic.com/news/accenture-embedded-evaluation)** — 2026-09-18. Strategic partnership, not a developer capability, SDK, or API. Embedded evaluators (from Accenture Faculty) work "inside AI companies with access comparable to an employee's" to observe training, examine deployment decisions, red-team, assess alignment, test safeguards. Both organizations expect to invest ≥$1B over 5 years. Non-exclusive (Anthropic also works with METR and others). **Not developer-facing.** Referenced here for completeness — not actionable for Strandworks workflows or MedSim product-build.

**Pattern shift observed**: this week extends the multi-week ergonomics-of-agents-and-plugins doctrine into two new territories: (1) **subagent output framing** (v2.1.277) — subagent results reach the main agent under a header with indentation so their text can't pass as session instructions, closing a prompt-injection surface that grows with the number of external-content subagents; (2) **`AGENTS.md` interop** (v2.1.277) — Claude Code reads the industry-wide `AGENTS.md` convention when no `CLAUDE.md` exists, signaling Anthropic's willingness to defer to a cross-tool standard when project instructions are ambiguous. **Directional signal**: Anthropic is treating agents-as-attack-surface AND agents-as-portable-artifact as first-class concerns. Direct fit for Strandworks 20-project portfolio + scout/verify/code-review/security-review subagent pattern.

**No bundled skill updates in-window** (`claude-api` skill was updated 9/14 in prior scout).

---

### Adjacent Tooling

**Cursor**: no notable release in window that shifts workflow-competitiveness vs Claude Code. Cursor also reads `AGENTS.md`, so Claude Code's 9/18 addition normalizes on the shared convention.
**Aider**: no notable release in window.
**Codex CLI / OpenAI Agents**: no notable release in-window vs Claude Code.
**No adjacent tooling shifts warrant migration analysis.**

---

## Recommended Actions

1. **Migrate at least one Strandworks Claude Code session to Opus 5.5 (`claude-opus-5-5`) this week + verify the four breaking changes don't bite.** Direct fit — new default Opus, 20% cheaper base + 20% cheaper cache reads + 40% cheaper on typical workloads per Anthropic. Checklist before rolling broadly:
   - Remove any `thinking: {"type": "disabled"}` or `thinking: {"type": "enabled", "budget_tokens": ...}` — replace with an `effort` level (default `medium`, was `high` on Opus 5, so re-run any evals to re-calibrate).
   - Remove any `tool_choice: {"type": "any"}` or `{"type": "tool", ...}` — use `auto` + strict tool use.
   - If Strandworks uses `computer_20251124` computer-use tool on Claude API or Google Cloud (not Bedrock), migrate to `computer_toolset_20260801`.
   - Check any UI that streams "text between tool calls" to users — those now come back as `thinking` blocks, empty at default `display: "omitted"`; set a `display` value to see them.
   - Set model ID via `/model` in Claude Code or `model: "claude-opus-5-5"` in API code. Effort levels saved before `/effort` became per-model do NOT apply to Opus 5.5 (starts at default `medium` until you pick a level).
   - Cross-refers Bouren Plan §1 monthly AI-tooling line — measure `claude cost` before + after switch to quantify.

2. **Try the `inline-tools-2026-09-15` beta header on any Strandworks-built agent that adds tools dynamically.** Direct fit for tool-surface-varies-by-scenario patterns. Prior: adding a tool mid-conversation forced editing `tools` array → cache invalidation. New: full tool definition inline in a mid-conversation system message → cache stays. **Also try `mcp-client-2026-09-15` for MCP toolsets added mid-conversation** — response returns an `mcp_tool_listing` block that pins the fetched tool list on replay. Product-build lens: worth prototyping for MedSim scenario-director agents that would gain per-scenario tool packs.

3. **Audit Strandworks subagent flows now that subagent output is framed under an explicit header with indentation (v2.1.277).** Prior: subagent's returned text was concatenated as the caller's next message → prompt-injection surface if subagent output contained instructions or if a scout subagent consumed adversarial web content. New: framed as subagent output, not user instructions. Direct fit for scout, verify, code-review, security-review. No action needed if patterns already assumed this — but if any Strandworks skill relied on subagent output flowing verbatim into the caller's context, verify it still works as expected.

4. **Verify no Strandworks skill / workflow calls the removed TaskOutput tool (v2.1.277).** Removed 9/18. Claude now reads a background task's output file with Read. `taskOutputMaxChars` + `TASK_MAX_OUTPUT_LENGTH` no longer honored. Direct fit for any Strandworks scheduled-job / background-task pattern.

5. **Turn on auto-mode server-side classifier for Strandworks cost savings** (v2.1.278, 9/19). It's now the default on Claude API + Enterprise + Bedrock/Vertex/Foundry/gateways. Adds an `Auto mode server` row to `/status` to confirm. If Strandworks any session ever set `CLAUDE_CODE_AUTO_MODE_SERVER=0`, un-set it to get the free-of-charge server-side classifier.

6. **Watch the "text between tool calls returns as thinking blocks" behavior on any Strandworks tool loop that streams progress updates.** On Opus 5.5 (+ Fable 5.1, + Mythos 5.1), the model's short between-tool-calls notes now arrive as `thinking` blocks with empty text at default `display: "omitted"`. If Strandworks CLI or dashboard ever showed these notes to the user (e.g. cockpit briefings, live-progress UIs), set an explicit `thinking.display` value to receive them.

7. **If Strandworks ever hits an Opus 5.5 thinking-block "prefix changed" 400 error, set `thinking-binding-controls-2026-08-01` beta header + `thinking.block_binding.prefix_mismatch_behavior: "drop_block"`.** Prior workaround was Anthropic's recommended pattern: **keep conversations append-only + use mid-conversation system messages instead of editing the top-level `system` or `tools`**. This ties directly to Recommended Action #2 (inline tool definitions).

8. **Bookmark Life Sciences Verification Program for MedSim-Game.** Not-a-today (no active classifier refusals). But if MedSim ever hits a pharmacology / procedure-content refusal, or if scenarios ever need to model rare-toxin exposure or bioweapon-adjacent injuries in a plausibly-refused way, a Standard Use grant may be the path. Applications opened to broader community 9/17; Anthropic monitors offline (30-day retention), not real-time blocking. Would need MedSim-Game to be verified as a life-sciences use case (medical simulation platform, not weapons research).

9. **Verify Strandworks daily-use keyboard patterns didn't rely on the Ctrl+C/Ctrl+D-exits-Claude-Code behavior in dialogs (v2.1.280).** Fixed 9/22. Prior: Ctrl+C or Ctrl+D twice in `/model`, `/effort`, `/config`, `/status`, `/usage`, `/plugin`, `/sandbox`, `/permissions`, `/artifacts`, `/mobile`, `/login`, `/upgrade`, `/usage-credits`, `/install-github-app`, `/setup-bedrock`, `/setup-vertex` quit Claude Code. Now closes the dialog. Direct fit for muscle-memory quit patterns. Similarly, `y`/`n` no longer confirm/close dialogs by default — Enter/Esc do. If Strandworks used `y`/`n`, bind to `confirm:yes`/`confirm:no` in `keybindings.json` to restore.

10. **Verify Strandworks project skills load in worktree sessions (v2.1.277 fix).** Prior: project skills from main repo didn't load in `--worktree` sessions when `.claude/skills` was untracked. Fixed. Direct fit for Strandworks worktree flow.

11. **If Strandworks ever ran the Sandbox with `sandbox.excludedCommands` globs (v2.1.277 fix).** Prior: a glob exempting an entire compound Bash command from sandbox when only one part matched. Fixed — every part must match now. Direct fit for any tightening.

12. **Test writes-through-symlinked-paths on the `_3D-ASSET-LIBRARY` SSD symlink (v2.1.280 fix).** Prior: `acceptEdits`, allow rules, auto mode could approve a symlinked-path write that landed outside the tree. Fixed — writes judged by where they land. Direct fit for Strandworks `/PROJECTS/_3D-ASSET-LIBRARY/` → `/Volumes/ASSETS/PROJECTS/<path> copy` symlink pattern; writes should now surface the actual destination.

13. **Watch for `AGENTS.md` in any repo Strandworks might collaborate on.** Not-a-today (portfolio + per-project `CLAUDE.md` fully deployed). But if any Strandworks repo is ever shared with a Codex / Cursor / Aider / JetBrains-AI user, `AGENTS.md` becomes the shared-project-instructions surface.

14. **Verify Strandworks headless (`claude -p`) or `--resume` flows aren't hit by the "typed-while-Claude-is-working messages sometimes ignored" pattern (v2.1.277 fix).** Direct fit — typing while a scout job runs, or continuing after Ctrl+C mid-thought, both patterns Strandworks uses. Fixed 9/18.

---

## Pricing / Cost Watch

- **Claude Opus 5.5 pricing (9/22): $4/$20 per MTok base (Opus 5 was $5/$25 = 20% drop), $0.20/MTok cache reads (Opus 5 was $0.25 = 20% drop), 5-min cache writes $5, 1-hour cache writes $8, batch $2/$10.** Anthropic benchmarks: 40% cheaper than Opus 5 on typical workloads, >30% faster output. **Cross-refers Bouren Plan §1 monthly AI-tooling line — sizable if Strandworks runs Opus for a nontrivial share of turns.** Measure with `claude cost` before + after swap.
- **Auto-mode server-side classifier is now the default across Claude API + Enterprise + Bedrock/Vertex/Foundry/gateways** (v2.1.278). Removes classifier-overhead billing that was previously local-model-billed. Small but continuous cost win.
- **Fable 5.1, Mythos 5.1, Sonnet 4.6, Haiku 4.5 pricing unchanged.**
- **Passive cost wins landed in Claude Code this week** (continuing multi-week pattern of closing silent prompt-cache leaks + reducing redundant work):
  - **SessionStart hook output no longer causes first-message-part-dropped cache miss on continuation** (v2.1.277) — direct fit for Strandworks SessionStart-hook-heavy setup.
  - **Resumed subagents + teammates no longer re-render MCP tool definitions** (v2.1.277) — cache preserved on subagent resume.
  - **Attachments recorded earlier in a conversation no longer re-rendered after resume/relaunch** (v2.1.277) — was dropping extended thinking + missing cache.
  - **Fork subagents on resume no longer rebuild tool list; re-send the original** (v2.1.280) — cache preserved on fork-subagent resume.
  - **Model switch from host app while Claude is working no longer causes next-turn cache miss** (v2.1.280) — direct fit if Strandworks ever switches model via Claude Desktop / VS Code mid-work.
  - **Removed background Haiku auto-title request from `claude -p` runs outside SDK/IDE** (v2.1.277) — removes small tax on Strandworks headless runs.
  - **Auto-mode denial-loop bounded**: safety-check no-answer denies once + won't retry, or backs off + stops after 10 in a row (v2.1.280) — prevents cost spirals on flaky safety-classifier.
  - **Headless (`-p`) session start no longer waits on per-directory `CLAUDE.md` lookup for first turn** (v2.1.277) — latency win.
  - **Headless `--resume` no longer starts cost + usage totals at zero** (v2.1.277) — cost observability fix, not a cost delta.
- **Combined cost signal for the week**: **Opus 5.5 headline pricing + 40% cheaper-on-typical-workloads benchmark is the dominant signal.** The passive cache-leak-closing pattern continues but is now overshadowed by the model-level pricing move. Bouren Plan §1 monthly AI-tooling line should show a step-change if Strandworks moves Opus 5 usage to Opus 5.5 this week — verify via `claude cost` next week vs this week.

---

## Nothing New (Watchlist)

- **MHS spec publication + open-cohort application timeline**: no updates. Research preview cohort-restricted. Next signals: Anthropic publishing driver spec + safety-eval framework, or partners (Doosan, Universal Robots, Tecan, QIAGEN) publishing MHS-conforming SDKs.
- **Fable 5.1 behind Claude apps gateway**: no gateway-partner 5.1-support announcement this week.
- **Sonnet 5.5 + Haiku 5.5**: Anthropic signaled "within weeks" alongside Opus 5.5 release (per public press coverage). No release date yet. Watch for these in the next 2-4 scout windows.
- **`/design` skill (v2.1.233, research-preview)**: no changes in window; still research-preview, still Sonnet-4.5 back-end.
- **Managed Agents extended surface**: no follow-on changes this week; `ant beta:sessions connect` + `auto` permission policy (2 weeks ago) remain the last additions.
- **Enterprise Frontier Safeguards (9/1 preview)**: no rollout progress announcements this week. Phased starting fall 2026.
- **Windows cross-session messaging GA (v2.1.239)**: not applicable to Strandworks.
- **Remote Control device cards on phone GA (Week 34)**: no changes in window.
- **Claude Code on the web (Pro/Max)**: this week added Personal/Organization environment picker sections + admin-shared personal environments + Admin Routines on/off relocation + GitHub Enterprise Server 8h-token-renewal. Feature set continues to build. Not applicable to Strandworks primary pattern.
- **Anthropic engineering blog**: sixth consecutive week without a new release. Still stuck at April 2026.
- **`ant apply` (3 weeks ago)**: no follow-on Managed Agents structural changes.
- **`/skill-doctor` (v2.1.261, 3 weeks ago)**: no changes in-window.
- **Messages API on-demand compaction (`compact-2026-09-04`, 2 weeks ago)**: no changes in-window; still beta. Now demonstrably useful in conjunction with Opus 5.5's "keep the conversation append-only" thinking-binding pattern.
- **`omitClaudeMd` in subagent frontmatter (v2.1.271, last week)**: no changes in-window. Still worth measuring via `/context` on a Strandworks scout / verify / security-review subagent.
- **Per-command `allowed_domains` for Bash/PowerShell/Monitor in auto mode (v2.1.271, last week)**: no changes in-window. Still worth wiring up for Strandworks Bash flows hitting known hosts.
- **`claude plugin eval` (v2.1.269, 2 weeks ago)**: no changes in-window. Bookmark for when the first Strandworks-authored plugin needs a stable eval bar.

---

## Parked Idea Unblocks

**No parked ideas unblocked this week.**

Cross-referenced all 28 parked-idea files in `_ops/idea-vault/`. This week's capability changes (Opus 5.5 with 20% cheaper base + 20% cheaper cache reads + 40% cheaper on typical workloads, `AGENTS.md` support, inline tool definitions in mid-conversation system messages, Life Sciences Verification Program, Compliance API Claude-in-Chrome transcripts, TaskOutput removal, auto-mode server-side classifier default) do not satisfy any parked-idea blocker.

Categories of blockers, none of which move on this week's items:

- **MedCapture v1 first-pilot gate** (medcapture-hand-kinematics-robotics, medcapture-humanoid-robot-extension, medcapture-stereo-second-camera, sim-lab-mockup-print-bank, sim-lab-rfid-ultrasound-trainer, ems-event-robot-fleet, military-parallel-pipeline, zoll-stryker-bracket): no MedCapture pilot news this week.
- **MedSim-Game substrate maturity** (medical-mmo-open-world, medsim-data-gathering-analytics, medsim-marketing-gtm, medsim-revenue-angles-expansion, medsim-school-employer-custom-content, regional-ems-ecosystem-simulator): substrate work continues; this week's model / API changes don't accelerate scenario count or engine surface.
- **Hardware / adjacent tech gates** (3rdrider-snap-spectacles: consumer AR glasses <$800; ai-multiview-video-generator: Genie 3 multi-view API OR display-cube-six-screens shipping; haptic-mirror-d4rt: D4RT/worldbuilder release; display-cube-six-screens + swappable-shells-animated-screens: barad-dûr v2 shipping): no hardware/tech-partner announcements this week.
- **Bouren Plan portfolio-focus gates** (painting-wars-pixel-rts, longplay-monument, ai-augmented-field-sales-scaling): unchanged.
- **Market-validation gates** (instrumented-task-marketplace-for-ai-training): no market signals this week.
- **Regulatory / App-Store gates** (group-matchmaking-cascading-tinder): unchanged.
- **Money / time gates** (runway-dev-portal-exploration: paid Runway API credits worthiness — this is Runway credits, not Anthropic credits, so Opus 5.5 pricing doesn't touch): unchanged.

**Notable non-unblocks worth naming**:

- **Opus 5.5 20% cheaper base + $0.20 cache reads COULD look like it unblocks `runway-dev-portal-exploration`** (blocked_on: "Time + worthiness of paid API credits"). It does not — Runway's blocker is Runway API credits, not Anthropic API credits.
- **Life Sciences Verification Program COULD look like it unblocks `medical-mmo-open-world` or `medsim-school-employer-custom-content`** (which imagine deep clinical / pharmacological content generation). It does not — MedSim's current content pipeline uses PhysioNet + peer-reviewed sources + doesn't hit classifier refusals in practice. LSVP becomes relevant only if a specific refusal happens. Bookmark, not an unblock.
- **Inline tool definitions COULD look like they unblock `telegram-inline-keyboard-question-protocol`** (active-list item, ~2-4 hour build). It does not — that plugin is Telegram-daemon-side callback routing, not mid-conversation tool definition. Different layer.
- **`AGENTS.md` support COULD look like it unblocks any parked interop idea** — it does not; no parked idea is blocked on cross-tool interop.

**One active-list check** (not a parked-unblock): `telegram-inline-keyboard-question-protocol` (status: active, ~2-4 hour build). Nothing this week affects its build path. No update.
