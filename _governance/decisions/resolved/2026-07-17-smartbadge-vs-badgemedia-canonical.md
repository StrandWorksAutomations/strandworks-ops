---
id: 2026-07-17-smartbadge-vs-badgemedia-canonical
filed: 2026-07-17
filed-by: orchestrator (medical-repos governance fan-out, discovery)
question: Two repos exist for the SmartBadge / Tenetrix Insight product — which is canonical, and what happens to the other?
ruling: CLEAR
ruled: 2026-07-23T16:59:24.183Z
source: cockpit
---

**Context:** Both governed on `governance/install-vaio` branches this session:
- **smartbadge** (renamed remotely → `SmartBadge`; HEAD f835a40, install e6202b2)
  — appears to be the CURRENT combined home: React Native/Expo app (30+
  clinical screens, 279 tests, CI+Claude-review) AND device firmware
  (`esp32/`, BLE); most recent commit is firmware (2026-06-28). 26-file
  proposed quarantine. Naming lineage LinkWay → SmartBadge (+ LinkwayLite
  sibling sharing `packages/linkway-shared/`).
- **Badgemedia** (HEAD ed688bf, install 5df83a3) — governed as "Tenetrix
  Insight, live App Store app"; 5-file proposed quarantine; free-vs-paid
  contradiction.

Both map to PORTFOLIO's "Tenetrix Insight (SmartBadge / wt. BadgeMedia)". This
cannot be resolved from inside either repo — only the owner can compare and
declare the canonical home. NOTE: "Badge Media" is ALSO an in-app feature
inside smartbadge (`BadgeMediaScreen.tsx`) — don't conflate it with the repo.

**Options / what I need:** Which repo is canonical (smartbadge / Badgemedia)?
For the other: ARCHIVE, keep-as-device-vs-app-split, or reconcile/merge? Only
the canonical one should get a blessed VISION; the other's disposition follows
your ruling. Reply with the call (and I'll merge/archive/govern accordingly).
