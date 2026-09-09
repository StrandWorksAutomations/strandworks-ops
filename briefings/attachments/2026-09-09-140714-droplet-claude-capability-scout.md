---
name: Claude-Capability Scout - 2026-09-09
description: 7-day window (9/03–9/09). Quiet week on models (no new releases). **Headline #1 (agent-team lens): `ant apply` in ant CLI 1.30.0 (9/3)** — Terraform-style declarative resource-as-code for Claude Managed Agents. Describe agents, skills, environments, memory stores, and scheduled deployments as Markdown/YAML/JSON in your repo → `ant apply` reconciles against the API + writes `claude-lock.json` for drift detection. Resources reference each other by relative file path; CI story is `--dry-run` on PR + `--yes` on merge. Direct fit for Strandworks agent-team pattern where subagents/skills are already file-based. **Headline #2 (agent-team lens): `/skill-doctor` in Claude Code v2.1.261 (9/4)** — audits which loaded skills go unused and what they cost in context; flags never-invoked skills and lists plugins not used recently. Report opens in `/plugin` Stats tab interactively, prints text in `-p` headless mode. **Direct hit for Strandworks:** the current session lists ~15 skills; every listed skill costs context on every turn whether or not called. **Headline #3 (cost lens): Prompt-cache reuse fixes across resumed subagents + agent teammates (v2.1.261 + v2.1.265)** — resuming a foreground-spawned subagent used to change its tool list + system prompt prefix (broke cache reuse); teammates + resumed subagents used to move SubagentStart hook context + preloaded skills out of the prompt prefix on later turns (broke cache reuse); in-process teammates re-sent their first-turn tool + skill announcements on turn 2 (missed cache); resuming a session used to lose hook output + context around parallel tool calls (changed the resumed request). All fixed. Silent cost leaks in the exact multi-subagent pattern Strandworks uses (scout, babysit-prs, agent-team panes). **Headline #4 (agent-team lens): Non-interactive `cd` persists across turns (v2.1.265)** — `-p` stream-json input, Agent SDK, and cloud sessions used to reset shell working directory at each new user message; a `cd` now persists. Direct fit for headless Strandworks flows that navigate a project tree over multiple turns. **Headline #5 (security-adjacent): auto-mode blocks public-diagram-renderer URL uploads (v2.1.261)** — a link that packs content into a public diagram renderer's URL is now treated as an upload to that site and no longer auto-approved. This is the exact "third-party web tools publish it — consider whether it could be sensitive" pattern flagged in `CLAUDE.md`; now enforced by auto mode instead of relying on Claude to reason about it. **Also this window:** four Claude Code releases (v2.1.261, v2.1.263, v2.1.265, v2.1.266), `bashOutputMaxChars` + `taskOutputMaxChars` up to 128K, `--append-subagent-system-prompt-file` for large subagent prompts, `--plugin-dir` folder-of-plugins, 1GB cap on tool results saved to disk, `dangerous rm` safety check extended to positional params + `sh -c`, MCP HTTP transports fall back to SSE per spec, `--worktree` parallel checkout on git 2.32+, Bash-style word-editing keys (Ctrl+W, Alt+F/D — a keybinding compat break). **No new models. No new Anthropic blog posts. No net-new MCP servers worth surfacing.** **No parked ideas unblocked this week.**
metadata:
  type: report
project: _ops
status: report
---

# Claude-Capability Scout - 2026-09-09

Weekly window: 2026-09-03 → 2026-09-09 (7 days; prior scout ran Wednesday 2026-09-02). A quiet week on the model + platform front, but a **structurally-important release from the ant CLI (`ant apply` — IaC for Managed Agents)** and a **highly-usable agent-team diagnostic (`/skill-doctor`) in Claude Code**. Flagship remains **MedSim-Game** per `/PROJECTS/CLAUDE.md`.

## Releases This Week

### Claude Code

**Four versions shipped in window (v2.1.261, v2.1.263, v2.1.265, v2.1.266).** Two carry headlines: v2.1.261 (`/skill-doctor` + `bashOutputMaxChars`/`taskOutputMaxChars` up to 128K + `--append-subagent-system-prompt-file` + auto-mode diagram-renderer-URL upload block + prompt-cache reuse fix for resumed sessions with hook output) and v2.1.265 (`--plugin-dir` folder-of-plugins + 1GB tool-result-to-disk cap + fix for resumed foreground subagent prompt-cache reuse + non-interactive `cd` persists across turns + MCP HTTP → SSE fallback).

**v2.1.266 (2026-09-08)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Fixed a v2.1.265 regression affecting LLM-gateway and proxy setups**: the undocumented `CLAUDE_CODE_USE_GATEWAY` env var began forcing Cloud-gateway sign-in on its own; now ignored again unless `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN` are both set. **Not applicable to Strandworks direct-API path.** Notable as a same-day regression-fix pattern.

**v2.1.265 (2026-09-08)** — [changelog](https://code.claude.com/docs/en/changelog)
- **Added `--plugin-dir` support for pointing at a folder of plugins**: each child folder with a manifest loads, and children added/removed while running are picked up. **Agent-team lens: MEDIUM.** Direct fit for Strandworks `.claude/plugins/` if plugin-per-folder pattern is used. Enables hot-adding a plugin mid-session by dropping it into the pointed folder.
- **Added `user.email` and `user.groups` to telemetry Claude Desktop and Cowork send through a Claude apps gateway.** Enterprise/gateway-adjacent.
- **Added a 1 GB cap on tool results saved to disk**; in-conversation preview says when a saved file was truncated. **Agent-team lens: MEDIUM.** Direct fit for Strandworks flows that dump large files via Bash (git-log dumps, big JSON, screenshot batches). Prior version: unbounded. New: 1GB ceiling + explicit truncation notice.
- **Fixed resuming a foreground-spawned subagent changing its tool list and system prompt prefix, which broke prompt-cache reuse for that agent.** **HEADLINE — Cost lens: HIGH.** Prior: resume flow silently rebuilt prefix → full cache miss. Fixed. Direct hit for Strandworks patterns that resume a foreground subagent (scout, code-review, security-review).
- **Fixed agent teammates and resumed subagents moving SubagentStart hook context and preloaded skills out of the prompt prefix on later turns, which broke prompt-cache reuse.** **HEADLINE — Cost lens: HIGH.** Prior: turn 2+ silently missed the cache because prefix drifted. Fixed. Direct hit for Strandworks agent-team panes in iTerm2 and any multi-turn subagent flow.
- **Fixed resume after the previous process died while a tool was running**: the last prompt is no longer rewritten, and the interrupted tool call is kept and marked interrupted. **Agent-team lens: MEDIUM.** Correctness fix for crashed-then-resumed flows.
- **Fixed `/model opusplan[1m]` being rejected with "Model not found".** **Agent-team lens: MEDIUM.** Direct fit if Strandworks uses `opusplan` in 1M mode.
- **Fixed syntax-highlighted code in permission prompts omitting a character after a Ruby `?`, Erlang `$`, or Perl `$` sigil.** UX/correctness.
- **Fixed the fullscreen transcript jumping by one row whenever the slash-command or @-file suggestion list opened or closed.** UX.
- **Fixed a plugin path containing a backslash bypassing the symlink containment check on macOS and Linux.** **Security-adjacent — HIGH.** Prior: `plugin\..\..` bypassed containment. Fixed.
- **Fixed plugin directories whose names begin with two dots being wrongly refused as outside the plugin root.** Correctness (companion fix to backslash one).
- **Fixed VS Code and SDK sessions occasionally requiring re-login when a session was closed while refreshing its token.** Correctness.
- **Fixed Remote Control sessions sending the end-of-turn signal before the reply's last message.** Direct fit for Remote Control flows.
- **Fixed background (`--bg`) sessions occasionally being retired mid-turn when a message arrived just before the idle timeout.** **Agent-team lens: MEDIUM.** Direct fit for Strandworks `--bg` scheduled/scout jobs.
- **Fixed Claude Code's own git status and diff probes running clean filters configured by a nested repository inside the working tree.** **Security-adjacent.** Direct fit for portfolio-of-repos flow (nested `.git` under `/PROJECTS/`).
- **Fixed the advisor tool and its instructions being re-decided per request from the request's model**; decision now made once + announced in conversation when it changes. **Cost lens: MEDIUM.** Direct fit if Strandworks uses an advisor model.
- **Fixed artifact publish accepting connector tool names the connector doesn't expose**; publish now refused when none of the declared tools exist, warned when only some don't. Correctness.
- **Fixed `/add-dir <subdirectory>` refusing to load a subdirectory's agents when managed settings lock only skills to plugins**, and promising agents when only agents are locked. Correctness — direct fit for `/add-dir` into a project subdir.
- **Fixed two-key keyboard shortcuts cancelling silently when the second key arrived more than a second later** (as happens inside tmux); they now wait 3 seconds and show a notice on timeout. **Direct fit for Strandworks tmux/iTerm2 pane flow.** Prior: silent cancel on slow chord. Fixed with observable timeout.
- **Fixed forked skills (`context: fork`) not streaming their kickoff prompt** — and, with `--forward-subagent-text`, their text turns as progress events in stream-json. Direct fit if Strandworks uses forked skills.
- **Fixed a plugin's default component folder that the OS cannot check (e.g. a symlink loop) being silently skipped**; now reported in `/plugin` with the error code. Observability.
- **Fixed the Claude apps gateway's OTLP telemetry relay pausing all forwarding to a collector for 30 seconds after it rejected a few payloads.** Enterprise.
- **Fixed `/plugin` Discover/Browse and `claude plugin list --json --available` showing no description/display name for marketplace plugins whose metadata lives only in `plugin.json`.** Correctness.
- **Fixed `/login` showing "no gateway URL is configured" when re-run in a session that signed in to a Claude apps gateway set by managed settings.** Enterprise.
- **Fixed `/model` claiming a model was "saved as your default" when the settings file couldn't be written**; now says the save failed and why. Correctness.
- **Fixed `/clear` from Remote Control waiting on SessionStart hooks and on open terminal dialogs before completing.** Correctness.
- **Fixed the `/config` dialog changing height when switching between its tabs.** UX.
- **Fixed resuming a workflow run after its container restarted**; resume whose run journal is missing now fails with a clear error instead of rerunning every agent. **Correctness.** Direct fit for workflow-tool users.
- **Fixed the `claude-api` skill's error-code reference: model access failures return 404 and unavailable beta headers return 400, not 403.** **Agent-team lens: MEDIUM.** Direct fit — `claude-api` is one of Strandworks's loaded skills. Prior scout runs that used `claude-api` guidance to catch a 403 for model access would have been chasing the wrong signal.
- **Fixed non-interactive sessions (`-p` with stream-json input, Agent SDK, cloud sessions) resetting the shell working directory at each new user message**; a `cd` now persists across turns. **HEADLINE — Agent-team lens: HIGH.** Prior: headless `claude -p` streams had shell CWD reset every user message, silently. New: persistent `cd`. Direct fit for scripted headless Strandworks jobs.
- **Fixed MCP servers configured as `http` that only speak the legacy HTTP+SSE transport never connecting**; Claude Code now falls back to SSE as the MCP spec describes. **Agent-team lens: MEDIUM.** Direct fit if any Strandworks MCP entry is legacy-SSE-only.
- **Fixed some claude.ai connectors in cloud sessions showing as needing authentication even though they are connected in claude.ai** (servers that answer an unsupported request with HTTP 401). Cloud-session correctness.
- **Fixed remote sessions keeping their sandbox container alive while a connector approval or sign-in link waits for you.** Enterprise/cloud.
- **Fixed resumed sessions showing long model-facing recovery instructions in "background task didn't finish" notices instead of a short status line.** UX.
- **[Windows]** Fixed Read/Write/Edit refusing every file ("symlink resolution changed after permission was checked") in AppContainer/restricted-token sandbox. Windows-only.
- **Improved `--worktree` startup on large repositories: new worktree checked out in parallel (git 2.32+).** **Agent-team lens: MEDIUM.** Direct fit for Strandworks `--worktree` flow. `git --version` on macOS default: 2.39+ — this applies.
- **Improved `/workflows` agent detail**: tool calls marked running/failed/done, subagent task list shown, Enter unfolds listed calls with inputs + results. Observability.
- **Improved slash commands typed mid-prompt**: matches now show in a list (Tab opens outside fullscreen) instead of single suggestion; plugin skill now found by bare name. QoL.
- **Improved remote MCP servers that need sign-in**: Claude Code no longer registers an OAuth client with them until you actually authenticate. **Security-adjacent.**
- **Improved the time to resume long sessions that read many files.** **Agent-team lens: MEDIUM.** Direct fit for scout / verify skill / any image-heavy resumed session.
- **Improved the error shown when an image over the size limits cannot be decoded**: now names cause + fix. UX.
- **Improved the Artifact tool's read of an artifact someone else wrote**: summary now treats page as untrusted content and flags embedded instructions rather than relaying them. **Security-adjacent — prompt-injection hardening.**
- **Updated the `.claude` folder permission option** to say it allows editing files in the project's `.claude` folder (or `~/.claude`) for the session. UX.
- **Changed machines with `forceLoginGatewayUrl` in managed settings to be Claude apps gateway sessions from startup**, like `forceLoginMethod: "gateway"`. Enterprise.
- **Changed image processing to use the runtime's built-in image support**; CLI no longer extracts a native image module to the temp directory. **Security-adjacent + hygiene.**
- **Changed plugin display metadata to prefer the marketplace entry over `plugin.json` on the Installed tab and `claude plugin details`.** Correctness.
- **Changed Claude apps gateway sessions to export OpenTelemetry directly to a collector the gateway's managed settings name in `OTEL_EXPORTER_OTLP_ENDPOINT`.** Enterprise.
- **[VSCode] Added automatic archiving of sessions inactive for a set period** (default 14 days).
- **[VSCode] Fixed sidebar chat coming back blank after Reload Window / restart** when conversation had been open >10 minutes.
- **[VSCode] Fixed the timeline dot sitting below the text on the "Remote Control is active" message.** UX.

**v2.1.263 (2026-09-06)** — Bug fixes and reliability improvements. Rollup.

**v2.1.261 (2026-09-04)** — [changelog](https://code.claude.com/docs/en/changelog) · [/skill-doctor coverage](https://www.implicator.ai/anthropic-claude-code-skill-doctor-context-audit/)
- **Added `/skill-doctor` to show which loaded skills go unused and what they cost in context, so you can prune them.** **HEADLINE — Agent-team lens: HIGH.** Report opens in `/plugin` manager's Stats tab interactively; prints as plain text in headless `-p` mode. Flags never-invoked skills, tells you where to turn them off, also lists plugins not used recently. Requires v2.1.252+; Remote Control sessions (from phone/browser) cannot generate the report. **Direct hit for Strandworks** — this session lists ~15 skills (update-config, keybindings-help, verify, code-review, fewer-permission-prompts, loop, claude-api, run, init, review, security-review, plus per-project + per-plugin). Every listed skill costs context on every turn. **Try it: `claude -p '/skill-doctor'` at the start of a scout run + trim never-called ones from `.claude/plugins/`.**
- **Added an "Organization policy" line to `/status` and `claude doctor`** that says why your organization's policy could not be loaded. Enterprise observability.
- **Added `bashOutputMaxChars` and `taskOutputMaxChars` settings to raise how much command and background-task output Claude receives inline before it's saved to a file, up to 128K characters.** **Agent-team lens: HIGH.** Prior version: the inline cap was lower + un-configurable (Claude got truncated inline output and had to re-read the file). New: raise up to 128K per output. Direct fit for Strandworks Bash-heavy scout/verify runs where full inline output beats a re-read.
- **Added `--append-subagent-system-prompt-file` to read the subagent system prompt from a file**, for prompts too large to pass on the command line. **Agent-team lens: MEDIUM.** Direct fit for large-prompt subagents (e.g. the scout skill's prompt is 200+ lines) — no longer bumps against shell-arg length limits.
- **Fixed typed or pasted characters occasionally landing out of order or being dropped during fast input or key repeat.** **UX — direct fit for Strandworks typing speed / paste-heavy interactive use.**
- **Fixed `/add-dir <subdirectory>` printing a false "couldn't be resolved" error when the working directory is on a `/net` automount.** Correctness.
- **Fixed the Bedrock setup wizard hanging when AWS or an AWS credential helper never responds** (now times out with clear error); model checks failing behind TLS-inspecting proxy. Enterprise.
- **Fixed cloud sessions discarding a plugin synced from claude.ai when managed settings force-enable it in `enabledPlugins`.** Enterprise.
- **Fixed being unable to delete the character immediately before an inline `[Image #N]` chip in the prompt input.** UX.
- **Fixed resuming a session losing hook output and other context around parallel tool calls, which changed the resumed request.** **HEADLINE — Cost lens: HIGH.** Prior: `--resume` silently reshaped the request → full prompt-cache miss on turn 1 of resumed. Fixed. Direct fit for Strandworks `--resume` daily use.
- **Fixed Remote Control showing a stale permission mode when a phone/browser/claude.ai app attaches to a terminal session** or after the mode changes in the terminal. Direct fit for Remote-Control-from-mobile flow.
- **Fixed Remote Control sessions showing as still working (stuck spinner + Stop button) after stopping a turn from a connected phone/browser**, or after a local slash command like `/clear`. Direct fit for Remote Control flow.
- **Fixed SDK and cloud sessions ignoring a Stop or interrupt sent just after the first prompt** — turn now stops instead of running to completion. **Agent-team lens: MEDIUM.** Direct fit for SDK-driven Strandworks jobs.
- **Fixed Remote Control uploading a session pulled with `/teleport` into the connected session**, which appeared appended to the original on phone and web. Direct fit for `/teleport` flow.
- **Fixed Remote Control's inbound event stream failing behind TLS-inspecting corporate proxies on native Windows.** Windows/enterprise.
- **Fixed Remote Control sessions showing the default effort level on claude.ai when the effort comes from settings.** Correctness.
- **Fixed `gcpAuthRefresh` opening a browser at startup when the Google credential check was slow.** Enterprise.
- **Fixed claude.ai connectors staying absent for the whole session when the startup connector fetch timed out** — CLI now retries in background. Correctness.
- **Fixed sustained high CPU usage when a background agent could not be resumed and its wake-up was retried in a tight loop.** **Agent-team lens: MEDIUM — direct fit for Strandworks scheduled/background jobs.** Prior: hot-loop CPU burn on unresumable background agent. Fixed.
- **Fixed `/usage` and the VS Code usage panel dropping a model-specific weekly limit row when the usage endpoint is rate limited or when opened right after startup.** Observability.
- **Fixed `claude -p --resume <file>` adopting a malformed session ID recorded in the transcript**; now resumes under a fresh session ID. Correctness.
- **Fixed the terminal progress indicator (iTerm2, Ghostty, ConEmu) showing the session as finished while a background workflow or agent was still running.** **Direct fit for Strandworks iTerm2 flow.**
- **Fixed a rare layout glitch where a box could render with the wrong height after its container switched between row and column direction.** UX.
- **Fixed Claude apps gateway client IP when a trusted proxy appends a port to `X-Forwarded-For`.** Enterprise.
- **Fixed Claude apps gateway telling Claude Desktop to export OpenTelemetry as JSON even when the terminal CLI uses protobuf.** Enterprise.
- **Fixed Desktop and web showing a session as busy while it only watches an artifact for updates.** Correctness.
- **Fixed Claude in Chrome `file_upload` failing with "paths: expected array, received undefined" in local Cowork sessions run from the Claude Desktop app.** Correctness.
- **Fixed `SendMessage` to an offline Remote Control session on another machine reading as delivered**; now says delivery is queued until that machine reconnects. Cross-session-messaging correctness.
- **Fixed plugin install hints from CLIs run in background Bash commands**: now detected, and the raw `<claude-code-hint>` tag no longer leaks into the conversation. **Security-adjacent — prompt-injection hardening.**
- **Fixed in-process agent-team teammates re-sending their first-turn tool and skill announcements on the second turn, which changed the request prefix and missed the prompt cache.** **HEADLINE — Cost lens: HIGH.** Companion to the resumed-subagent cache-reuse fix in v2.1.265. Direct fit for Strandworks agent-team panes in iTerm2 (which is the exact "in-process teammate" pattern).
- **Improved the `/model` picker and VS Code model pill to show a model's name instead of its raw Bedrock/Vertex/LLM-gateway ID** when Claude Code recognizes it. UX.
- **Improved startup on Google Vertex AI when `GOOGLE_APPLICATION_CREDENTIALS` is set**: no re-run of Google Cloud project discovery + no extra `gcloud` processes. Enterprise.
- **Improved streaming performance: already-rendered blocks are no longer re-checked by layout on each update.** **QoL — direct win for long Strandworks streams.**
- **Improved the dangerous-`rm` safety prompt to also catch `rm -rf` on positional parameters and inside double-quoted `sh -c` scripts.** **HEADLINE — Security-adjacent: HIGH.** Prior version: `sh -c "rm -rf $1"` bypassed the safety prompt. New: caught. Direct fit for Strandworks Bash flows.
- **Improved handling when the API sends no response headers**: retry now waits up to `API_TIMEOUT_MS` (10 min default) instead of another 3 min. Correctness.
- **Changed a Claude apps gateway 403 on managed settings load (at startup or after `/login`)** to say Claude Code may not be enabled for the organization. Enterprise.
- **Changed machines whose managed settings pin `forceLoginMethod: "gateway"` to ignore a leftover API key or claude.ai login and ask for `/login`.** Enterprise.
- **Changed auto mode to treat a link that packs content into a public diagram renderer's URL as an upload to that site**: no longer auto-approved unless you asked for it. **HEADLINE — Security-adjacent: HIGH.** Prior: auto mode would open a diagram-renderer URL like `https://mermaid.live/edit#pako:...` without prompting → whatever was encoded got published to the third-party site. New: treated as an upload + prompted. **Direct fit — this is exactly the "third-party web tools publish it" pattern flagged in `CLAUDE.md` operating posture.** Now enforced by the CLI instead of relying on Claude to reason about it every time.
- **Changed the prompt's word-editing keys to match Bash**: Ctrl+W deletes back to whitespace, Alt+F and Alt+D stop at word end, punctuation separates words; `keybindingFlavor` no longer has any effect. **Agent-team lens: MEDIUM — potential keybinding compat break.** If Strandworks had a custom `keybindingFlavor` set (e.g. Emacs-style), it's now no-op. Word-editing behavior may feel different mid-line. Not a settings-file break, just muscle memory.
- **Changed `/context` token counting to use a local estimate when the token-counting API is unavailable**, instead of extra small-model requests. **Cost lens: MEDIUM.** Prior: token-count-API-down flow silently fanned out extra small-model calls. New: local estimate. Small passive cost win.
- **[VSCode] Multiple improvements** (see changelog) — MCP server add/remove form in IDE, Output style walkthrough, hollow ring for sessions open elsewhere, fold button on permission prompts, session-list archive/unarchive, plus ~14 fixes.

---

### Anthropic Platform

**One release in window: `ant apply` in ant CLI 1.30.0 (2026-09-03).** No new models, no new API features, no beta-header additions.

**`ant apply` — Terraform-style resource-as-code for Claude Managed Agents** — 2026-09-03. [ant apply docs](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/apply) · [AlphaSignal coverage](https://alphasignal.ai/news/anthropic-ships-terraform-style-workflow-to-deploy-claude-agents-from-code) · [getclaudeskills coverage](https://www.getclaudeskills.com/blog/ant-apply-infrastructure-as-code) · [anthropic-cli GitHub](https://github.com/anthropics/anthropic-cli).
- **What it is**: `ant apply` creates and updates Claude API resources from files. Resources supported: **agents, environments, skills, memory stores, deployments.** Each is a Markdown/YAML/JSON file in your repo. `ant apply` prints a plan, waits for approval, then writes `claude-lock.json` with resource IDs + content hashes for drift detection.
- **File conventions**: agents in `agents/`, environments in `environments/`, memory stores in `memory_stores/`, deployments in `deployments/`, skills as directories with `SKILL.md` conventionally under `skills/`. Markdown frontmatter holds the request body, prose fills the text field (agent's system prompt, environment's description, deployment's first message). Resources reference each other by relative file path (e.g. an agent lists `../skills/pr-summary` under `skills`, a deployment names its agent + environment + memory store by path).
- **Dependency resolution**: `ant apply` creates in dependency order + fills in real IDs. Editing a referenced skill or agent updates everything that references it in the same run (agents + skills are pinned to the version just applied).
- **External skill sources**: a skill reference can be a GitHub URL of the form `https://github.com/<owner>/<repo>/tree/<branch>/<dir>`, downloaded + uploaded pinned to the resolved commit until `--upgrade`. Supports `GITHUB_TOKEN` for private repos.
- **CI story**: `ant apply --dry-run .` on PRs (informational only, exits 0 even when plan blocked) + `ant apply --yes .` on default branch after merge. `claude-lock.json` committed after every job (even partial failures). One apply at a time (no lockfile locking). Recommended auth: [Workload Identity Federation](https://platform.claude.com/docs/en/manage-claude/workload-identity-federation) instead of stored API key. **Requires ant CLI 1.30.0+.**
- **Drift handling**: if a resource was edited/archived/deleted outside these files (in Console, for example), plan ends with `This plan cannot be applied:` + reason. `--force` overwrites. Deleting a file leaves resource in place with a warning; `--prune` removes it. **Cannot adopt resources created in Console or with `ant beta:agents create`.** If you exported an agent from Console with "Export as code," the download includes its own `claude-lock.json`.
- **Agent-team lens: HIGH.** Direct fit for Strandworks's file-based agent-and-skill pattern. AlphaSignal frames it: *"Infrastructure-as-code, but for the pieces that make up a Claude agent"* + *"teams end up writing their own thin wrapper around the create endpoints, their own drift detection, and their own ID-mapping layer."* Strandworks has not yet migrated to Managed Agents (portfolio runs on Claude Code CLI + skills + local .claude configs); but if MedSim-Game or a subagent-heavy pattern ever needs Managed Agents (e.g. for a scheduled cloud-hosted MedSim-Game analytics agent), `ant apply` is the way in. **Also relevant now**: patterns from `ant apply` (dependency resolution + lockfile drift detection + reference-by-path) are directly portable to any Strandworks-authored agent orchestration.
- **Product-build lens: MEDIUM.** MedSim-Game backend agents (scenario generation, learner analytics, custom-content generation from school partners) are natural Managed Agents candidates for post-MVP scale. `ant apply` collapses that migration friction.
- **Not-a-today-action**: Strandworks isn't on Managed Agents. Bookmark this for the MedSim-Game backend-agents build stage + for any future customer-facing cloud-hosted agents.

---

### MCP Ecosystem

**No net-new headline MCP servers, catalog entries, or spec updates in the window.** PulseMCP directory continues its steady growth (~22,050+ servers per pulsemcp.com; up from ~22,030+ last week). The most recent spec release remains **MCP 2026-07-28** (stateless core, hardened auth, graduated Apps + Tasks extensions), unchanged in this window.

**Client-side MCP fixes landed in Claude Code** (see Claude Code section):
- **MCP HTTP transports fall back to legacy HTTP+SSE per spec** (v2.1.265) — direct fit if any Strandworks MCP entry is legacy-SSE-only.
- **Remote MCP servers that need sign-in**: Claude Code no longer registers an OAuth client with them until you actually authenticate (v2.1.265) — cred-hygiene improvement.

---

### Agent Patterns + Best Practices

**No net-new Anthropic engineering blog post in the window.** Engineering blog's most recent post remains "An update on recent Claude Code quality reports" from April 2026. Absence of pattern-guidance content this week — consistent with Anthropic redirecting bandwidth toward product security hardening (per 8/31 Alignment & Security post + the tool-side v2.1.257 Containment Escape rule that shipped alongside).

**Pattern shift observed**: `ant apply` + `/skill-doctor` together formalize a **"treat agents + skills as codebase artifacts you diff, version, and prune"** discipline. Prior weeks had `experimental.cacheTtl` per-agent frontmatter + subagent-model-routing knobs — this week extends the same doctrine to **whole-portfolio resource management** (`ant apply`) and **cost-visibility-per-resource** (`/skill-doctor`). Directional signal: Anthropic is treating agent/skill/plugin sprawl as a first-class problem, not a "user configures this once" problem. **Direct fit for Strandworks's 20-project portfolio.**

---

### Adjacent Tooling

**Cursor**: no notable release in window that shifts workflow-competitiveness vs Claude Code.

**Aider**: no notable release in window.

**No adjacent tooling shifts warrant migration analysis.**

---

## Recommended Actions

1. **Run `/skill-doctor` at the start of the next scout run + trim never-invoked skills from `.claude/plugins/` and `~/.claude/plugins/`.** Session-listed skills include the built-in set (verify, code-review, fewer-permission-prompts, loop, claude-api, run, init, review, security-review, update-config, keybindings-help) + per-project + per-plugin. **Direct passive-context savings.** Each unused skill in the listing costs tokens on every turn. Try: `claude -p '/skill-doctor'` in `_ops/` first, then in `MedSim-Game/`. Prune the plugin, not just the skill file — the listing is what costs.

2. **Audit auto-mode config against the new diagram-renderer URL upload rule (v2.1.261).** Any Strandworks flow that generates a mermaid/plantuml/kroki URL for viewing (currently: none known, but any future architecture-diagram scout skill would) will now prompt in auto mode. This is a **feature, not a friction** — it enforces the `CLAUDE.md` "third-party web tools publish it" rule at the CLI level. No config change needed; just be aware next time a diagram-URL step runs and prompts.

3. **If Strandworks uses agent-team teammates in iTerm2 panes for long sessions** (per prior scout mentions), the v2.1.261 in-process-teammate + v2.1.265 resumed-subagent prompt-cache-reuse fixes will show up as measurably-improved cache hit rate on turn 2+ of any teammate/subagent flow. Cross-check via `claude cost` (per-session cache line added last week, v2.1.251) after the next multi-teammate run. If the hit rate on subagent turns 2+ jumps meaningfully, that's the fix landing.

4. **Add `bashOutputMaxChars: 131072` and `taskOutputMaxChars: 131072` to user-scope `~/.claude/settings.json` for Bash-heavy scout / verify runs (v2.1.261).** Prior: truncated inline → Claude re-reads the file → double read cost. New: full inline up to 128K per output. Direct token-efficiency win for scout runs that dump large git logs, big JSON, or full changelogs (like today's fetch).

5. **Skim ant `apply` docs + note the file conventions** ([docs](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/apply)) so that when MedSim-Game backend agents need hosting (post-MVP), the migration to Managed Agents is a known path instead of a scramble. Not a today-action. Bookmark: file conventions are `agents/*.md`, `environments/*.yaml`, `memory_stores/*.yaml`, `deployments/*.md`, `skills/<name>/SKILL.md`. Frontmatter = body of the API create call. Skill ref by `../skills/name` OR GitHub URL. Auth via WIF, not stored API key.

6. **Note the `keybindingFlavor` no-op break (v2.1.261).** If Jonathan set `keybindingFlavor` in user or project `.claude/settings.json`, it now has no effect. Word-editing keys are Bash-style: `Ctrl+W` deletes back to whitespace, `Alt+F`/`Alt+D` stop at word end, punctuation separates words. Check `~/.claude/settings.json` — remove the setting to reduce config noise.

7. **Verify Strandworks doesn't rely on the v2.1.265 non-interactive `cd`-persistence reset for anything** (it shouldn't — the fix is a straight-up improvement — but any headless script that was working around the reset by re-`cd`ing every turn can be simplified). Direct fit if any `_ops/lib/` shell wrapper wraps `claude -p` and used to re-`cd` between messages.

8. **Consider `--append-subagent-system-prompt-file` for the scout skill (v2.1.261)** — the scout `prompt.md` is ~200 lines and would fit better read from file than passed as an arg if the skill is ever invoked programmatically outside the current interactive-slash-command path.

9. **Cross-check `git --version` on the MacBook** — `--worktree` parallel checkout (v2.1.265) needs git 2.32+. macOS default git is 2.39+ so this should be a free speedup, but confirm if Xcode CLT was reset recently.

10. **If Strandworks has any `plugin.json` metadata that isn't also in the marketplace entry** (per v2.1.265 changed behavior — marketplace entry now preferred), be aware that `/plugin` Discover/Browse + `claude plugin list --json --available` will show the marketplace-entry version, with `plugin.json` only filling gaps. No action needed unless a plugin's display metadata unexpectedly changed.

---

## Pricing / Cost Watch

- **No pricing changes in window.** Fable 5.1 remains $10/$50 per MTok with $0.25/MTok cache reads (75% cache-read discount vs other models); pricing landed 9/1, unchanged this week.
- **No model deprecations** in window. Fable 5.1 remains the default `fable` in Claude Code v2.1.257+; Fable 5 remains alias behind Claude apps gateways not yet configured for 5.1.
- **Passive cost wins landed in Claude Code this week**:
  - **Prompt-cache reuse across resumed subagents fixed** (v2.1.265): resuming a foreground-spawned subagent used to punch a cache hole on turn 1; fixed. Direct hit for scout/babysit-prs/code-review.
  - **Prompt-cache reuse across agent teammates + resumed subagents on turn 2+ fixed** (v2.1.265): SubagentStart hook context + preloaded skills were being moved out of the prompt prefix; fixed. Direct hit for iTerm2 pane-based agent-team flow.
  - **In-process teammate first-turn tool+skill announcement no longer re-sent on turn 2** (v2.1.261): silent cache miss + prefix drift → fixed.
  - **Resumed session no longer loses hook output + parallel-tool-call context** (v2.1.261): `--resume` used to reshape the request → fixed.
  - **`/context` token counting uses local estimate when API is unavailable** (v2.1.261): removes extra small-model calls when token-counting API is down. Minor.
  - **Advisor tool + instructions decided once per session** (v2.1.265) instead of per-request — direct fit if Strandworks uses an advisor model. Removes a silent per-request re-decision cost.
- **Combined cost signal for the week: multiple silent prompt-cache leaks in multi-subagent flows are now closed.** Cross-refers Bouren Plan §1 monthly AI tooling line. Verify improvement empirically via `claude cost` after next multi-subagent scout run.

---

## Nothing New (Watchlist)

- **MHS spec publication + open-cohort application timeline**: research preview only, cohort-restricted. No public updates this week. Next signals: Anthropic publishing the driver spec + safety-eval framework, or partners (Doosan, Universal Robots, Tecan, QIAGEN) publishing MHS-conforming SDKs.
- **Fable 5.1 behind Claude apps gateway**: gateway-configured-for-Fable-5 gateways still reject Fable 5.1 unless configured; no known gateway partner 5.1 support announcement this week. Watch Bedrock/Vertex/Foundry config windows.
- **`/design` skill (v2.1.233, research-preview)**: no changes in window; still research-preview, still Sonnet-4.5 back-end.
- **Managed Agents advisor + budgets + inference_geo + memory stores (Platform 8/19 GA)**: `ant apply` (this week) is the biggest surface-area addition since GA. No other Managed-Agents-tier updates in window.
- **Enterprise Frontier Safeguards (9/1 preview)**: no rollout progress announcements this week. Phased starting fall 2026; no charge to customers.
- **Windows cross-session messaging GA (v2.1.239)**: not applicable to Strandworks.
- **Remote Control device cards on phone GA (Week 34)**: no changes in window.
- **Claude Code on the web (Pro/Max)**: no visible product changes in window.
- **Anthropic engineering blog**: still stuck at April 2026's Claude Code quality report post; no new pattern-guidance content since. Third consecutive week without an engineering-blog release.

---

## Parked Idea Unblocks

**No parked ideas unblocked this week.**

Cross-referenced all 23 parked-idea files in `_ops/idea-vault/`. Blockers this week fall into these categories, none of which move on this week's capability changes (`ant apply`, `/skill-doctor`, prompt-cache reuse fixes, `cd`-persistence fix, security-adjacent fixes):

- **MedCapture v1 first-pilot gate** (medcapture-hand-kinematics-robotics, medcapture-humanoid-robot-extension, medcapture-stereo-second-camera, sim-lab-mockup-print-bank, sim-lab-rfid-ultrasound-trainer, ems-event-robot-fleet, military-parallel-pipeline): no MedCapture pilot news this week; blocker unchanged.
- **MedSim-Game substrate maturity** (medical-mmo-open-world, medsim-data-gathering-analytics, medsim-marketing-gtm, medsim-revenue-angles-expansion, medsim-school-employer-custom-content, regional-ems-ecosystem-simulator): substrate work continues; capability changes this week don't accelerate scenario count or engine surface.
- **Hardware / adjacent tech gates** (3rdrider-snap-spectacles: consumer AR glasses <$800; ai-multiview-video-generator: Genie 3 multi-view API OR display-cube-six-screens shipping; haptic-mirror-d4rt: D4RT/worldbuilder release; display-cube-six-screens + swappable-shells-animated-screens: barad-dûr v2 shipping): no hardware/tech-partner announcements this week.
- **Bouren Plan portfolio-focus gates** (painting-wars-pixel-rts: MedCapture focus through July 2026; longplay-monument: everything; ai-augmented-field-sales-scaling: liaison role acceptance): unchanged.
- **Market-validation gates** (instrumented-task-marketplace-for-ai-training: AI-primes willingness-to-pay; zoll-stryker-bracket: 3+ medics 2+ services friction validation): no market signals this week.
- **Regulatory/App-Store gate** (group-matchmaking-cascading-tinder: App Store + payment processor + personal-brand triad): unchanged.
- **Money/time gate** (runway-dev-portal-exploration: paid API credits worthiness): unchanged.

**Notable non-unblock**: `ant apply` COULD look like it unblocks the `regional-ems-ecosystem-simulator` idea if that project ever needs multi-agent orchestration (scenarios, EMS-crew agents, patient-state agents). It does not — that idea's blocker is time (portfolio focus), not agent-orchestration tooling.

**One active-list check (not a parked-unblock)**: `telegram-inline-keyboard-question-protocol` (status: active, ~2-4 hour build). Nothing this week affects its build path; no update.
