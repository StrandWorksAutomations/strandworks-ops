---
date: 2026-09-30
time: 09:12 CDT
host: droplet
source: Claude-Capability Scout
title: Claude-Capability Scout — 2026-09-30
attachment: briefings/attachments/2026-09-30-141236-droplet-claude-capability-scout.md
attachment_name: scout-2026-09-30.md
---

Claude-Capability Scout — 2026-09-30

Headline: Claude Sonnet 5.5 shipped 9/28 (`claude-sonnet-5-5`) — new default Sonnet, same base pricing as Sonnet 5 ($2/$10 per MTok, cache reads $0.20/MTok), but massive capability jumps (Terminal-Bench 4.0: 70.6% vs Sonnet 5's 10.3%; GDPval-AA v2.1: 1844, essentially tied with Opus 5.5). "Up to 30% less" comes from fewer tokens + tighter batching + >30% faster output, NOT a rate cut. 5 breaking changes (biggest: `disabled` thinking → `between_tools`; forced tool use → 400; thinking now conversation+account-bound). Also this week: interactive/`-p`/SDK sessions now default to auto mode on every plan/provider (v2.1.284), `/doctor prompt-audit` for CLAUDE.md/skills/agents (v2.1.283 — direct fit for the 23-file portfolio), MEMORY.md auto-memory sanitizer against invisible-char + fake-markup injection (v2.1.284, native-memory security fix), background Bash/PS now cap 30min default/2h max (v2.1.285), `allowedProviders` + `deniedModels` + `availableModelsMatch` managed settings, refusal billing resumed for `bio`/`frontier_llm`/`reasoning_extraction` pre-output (9/24). 4 Claude Code releases in window (v2.1.282-.285). No engineering blog post (7th consecutive week). No new MCP servers. No parked ideas unblocked.
