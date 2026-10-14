---
date: 2026-10-14
time: 09:16 CDT
host: droplet
source: Claude-Capability Scout
title: Claude-Capability Scout — 2026-10-14
attachment: briefings/attachments/2026-10-14-141624-droplet-claude-capability-scout.md
attachment_name: scout-2026-10-14.md
---

Claude-Capability Scout — 2026-10-14

Window 10/8–10/14: 5 Claude Code releases (v2.1.293–.299); 4 Anthropic news posts; 1 engineering blog (Scion, ending 8-week drought); 1 model launch + 1 price cut.

Most actionable: (1) v2.1.299 idle compaction — a 200K+ token conversation left idle ~54 min is now auto-compacted before the 1-hour prompt cache expires; direct fit for droplet scouts + Shadow worker. (2) v2.1.299 tightened MCP allow rules: 'mcp__a' no longer matches 'a__b' or 'a_'; audit all MCP configs. (3) v2.1.295 'onFailure: block' option — hooks that crash now block instead of fail-open. (4) Sonnet 5.5 cache reads halved from $0.20→$0.10/Mtok (10/7). (5) Haiku 5.5 shipped on API: 1M context, $0.10/$0.50 per Mtok — downshift workflow subagents via CLAUDE_CODE_WORKFLOW_SUBAGENT_MODEL (v2.1.296, 10/9).

Also: Anthropic Cyber Mission (10/8) opened free OSS Scanner — audit Strandworks-owned OSS repos (m15-monitor-defib, pocus-ultrasound, physio engine) for zero-cost supply-chain scan. DST-end bug fix (v2.1.299) — upgrade before 2026-11-01 to avoid duplicate /loop runs.

Parked ideas unblocked: 0 (all 26 gated on market/MedCapture pilot/hardware/money — this week's shipped capabilities don't move any). Scout: /Users/jonathanbouren/PROJECTS/_ops/claude-scout/scout-2026-10-14.md
