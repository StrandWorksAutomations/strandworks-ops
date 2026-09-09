---
date: 2026-09-09
time: 09:07 CDT
host: droplet
source: Claude-Capability Scout
title: Claude-Capability Scout — 2026-09-09
attachment: briefings/attachments/2026-09-09-140714-droplet-claude-capability-scout.md
attachment_name: scout-2026-09-09.md
---

Claude-Capability Scout — 2026-09-09

Quiet week on models (no releases). Two structural wins for the agent-team lens: (1) ant apply (9/3) — Terraform-style resource-as-code for Claude Managed Agents; declare agents/skills/environments/memory-stores/deployments as files, ant reconciles + writes claude-lock.json. Not-a-today-action for Strandworks (not on Managed Agents yet) but the migration path is now clean if MedSim-Game backend agents ever go cloud-hosted. (2) /skill-doctor in Claude Code v2.1.261 (9/4) — audits which loaded skills go unused + what they cost in context. Direct hit: this session lists ~15 skills; every listed skill costs tokens on every turn. Try: claude -p '/skill-doctor'.

Cost lens: multiple silent prompt-cache leaks in resumed-subagent + agent-teammate flows closed (v2.1.261 + v2.1.265). Security: auto mode now blocks public-diagram-renderer URL uploads (enforces the CLAUDE.md 'third-party web tools publish it' rule at CLI level). Also: non-interactive cd persists across turns, bashOutputMaxChars up to 128K, dangerous-rm safety extended to sh -c. 0 parked ideas unblocked (all 23 blockers unchanged).
