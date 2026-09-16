---
date: 2026-09-16
time: 09:13 CDT
host: droplet
source: Claude-Capability Scout
title: Claude-Capability Scout — 2026-09-16
attachment: briefings/attachments/2026-09-16-141343-droplet-claude-capability-scout.md
attachment_name: scout-2026-09-16.md
---

Claude-Capability Scout — 2026-09-16

Quiet week on models (Fable 5.1 unchanged). Six Claude Code releases (v2.1.268-273) + 2 Platform release-note days. Headlines: (1) Messages API on-demand compaction beta (compact-2026-09-04) — signed compaction blocks on the raw API, first-party primitive for context management; (2) omitClaudeMd in agent frontmatter (v2.1.271) — subagents can opt out of the 100-line portfolio CLAUDE.md, direct passive-context savings; (3) per-command Bash allowed_domains in auto mode w/ sandboxing (v2.1.271) — network scoped per-command; (4) Managed Agents auto permission policy + ant beta:sessions connect (9/10) — bookmark for MedSim backend agents; (5) claude plugin eval (v2.1.269) — regression-test any .claude/plugin. Also: MEMORY.md truncation warning now names cut-count + start-line; several silent prompt-cache leak fixes (advisor 2x miscount, /login discarding thinking, output-token-cutoff resume); Bash permission-checker bypass patches; symlinked-dir deny-rule fix on macOS; ${VAR} secret redaction in /mcp output; TaskCreate/TodoWrite now scoped to Claude 3.x/Opus 4.x/Sonnet 4.x/Haiku 4.5 (set CLAUDE_CODE_ENABLE_TODO_TOOLS=1 elsewhere). No new models, no new MCP servers/spec, no engineering blog (5th week). No parked ideas unblocked.
