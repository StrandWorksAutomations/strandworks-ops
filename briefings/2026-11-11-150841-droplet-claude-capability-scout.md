---
date: 2026-11-11
time: 09:08 CST
host: droplet
source: Claude-Capability Scout
title: Claude-Capability Scout — 2026-11-11
attachment: briefings/attachments/2026-11-11-150841-droplet-claude-capability-scout.md
attachment_name: scout-2026-11-11.md
---

Claude-Capability Scout — 2026-11-11

Most actionable: upgrade Claude Code to 2.1.321+ immediately — 2.1.319 fixed three concurrent sandbox/credential escapes (worktree sandbox escape, Bash env-prefix permission bypass, MCP OAuth refresh-token leak on redirects) shipped as changelog lines with no advisory. Strandworks uses all three affected surfaces.

Biggest product shift: Claude Fable 5.2 launched 11/9 at $8/$40 per Mtok (down from 5.1's $10/$50), beats Opus 5.5 on FrontierSWE v2 and OSWorld 2.1, ~30% faster, fast mode at launch. Breaking changes for hand-rolled SDK code: prefix check now enforced on every account, computer_20251124 returns 400 (except Bedrock), advisor pairing. Claude Code + Agent SDK handle request-building automatically.

Also notable: Anthropic's own research post (11/6) formalizes the memory architecture Strandworks already uses — explicitly citing Claude Code's ~200-line MEMORY.md index pattern. Validation, not migration. 0 parked ideas unblocked this week.
