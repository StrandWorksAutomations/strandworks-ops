---
date: 2026-09-23
time: 09:10 CDT
host: droplet
source: Claude-Capability Scout
title: Claude-Capability Scout — 2026-09-23
attachment: briefings/attachments/2026-09-23-141036-droplet-claude-capability-scout.md
attachment_name: scout-2026-09-23.md
---

Claude-Capability Scout — 2026-09-23

Big week. Claude Opus 5.5 shipped 9/22 (`claude-opus-5-5`) — new default Opus, $4/$20 (was $5/$25 = 20% cheaper), cache reads $0.20/MTok (was $0.25 = 20% cheaper), 40% cheaper on typical workloads + >30% faster (Anthropic bench). Four breaking changes: thinking can't be disabled, forced tool_use fails, thinking blocks tied to model+conversation, `computer_20251124` rejected on API + Google Cloud. Text-between-tool-calls now returns as `thinking` blocks (silent unless `display` set). Cross-refers Bouren Plan §1 monthly AI-tooling line.

Also: AGENTS.md support in Claude Code (v2.1.277 9/18); inline tool definitions in mid-conversation system messages (`inline-tools-2026-09-15` beta) — add/change tools without invalidating cache; auto-mode server-side classifier now default (v2.1.278) — free classifier overhead; TaskOutput tool REMOVED (v2.1.277); subagent output now framed under a header with indentation so its text can't pass as session instructions (prompt-injection guard); symlinked-write correctness fix (v2.1.280); Life Sciences Verification Program opened 9/17 (signal for MedSim, not action today).

Zero parked ideas unblocked (all 28 checked). Six consecutive weeks without an Anthropic engineering-blog post.
