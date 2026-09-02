---
date: 2026-09-02
time: 09:11 CDT
host: droplet
source: Claude-Capability Scout
title: Claude-Capability Scout — 2026-09-02
attachment: briefings/attachments/2026-09-02-141116-droplet-claude-capability-scout.md
attachment_name: scout-2026-09-02.md
---

Claude-Capability Scout — 2026-09-02

Big week. Two shipped Anthropic models + one net-new physical-agent spec preview + a heavy Claude Code security-hardening wave.

Headline #1 (product-build lens): Model Hardware Standard (MHS) research preview (8/27) — 'MCP for physical devices'. Standardized read/write driver for lab microscopes, liquid handlers, robot arms. Partners include Doosan, Universal Robots, Tecan, QIAGEN, Automata, Raspberry Pi. Future rail candidate for MedSim-Game physiological-clone → high-fidelity mannequin arc AND for parked sim-lab family.

Headline #2 (cost lens): Fable 5.1 + Mythos 5.1 (9/1). Same $10/$50 base; cache reads drop 75% to $0.25/MTok (0.025× base). 1M context, 128k output, adaptive thinking. Now default 'fable' in Claude Code v2.1.257. Move interactive Strandworks work here to capture the cache discount.

Headline #3 (agent-team + security lens): Claude Code v2.1.248 → v2.1.258 hardened aggressively. --restricted flag, Containment Escape auto-mode rule, blockReadsOutsideWorkingDirectories, symlink-swap TOCTOU fix, plugin path-traversal block, .env/.tfvars upload block on /ultrareview, PreModelSwitch/PostModelSwitch hooks, per-agent experimental.cacheTtl, CLAUDE_CODE_SUBAGENT_MODEL_FORCE.

Headline #4: Files + Skills APIs GA in Anthropic SDKs (Python 1.2.0 etc.) — beta headers dropped.

Parked-idea watch: MHS touches three MedCapture/sim-lab entries but no full unblock — primary blocker on all remains MedCapture v1 pilot. 10 recommended actions in the report.
