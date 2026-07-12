---
id: 2026-07-12-export-pipeline-order
filed: 2026-07-12
filed-by: orchestrator (from 3rdrider WS3 inbox question)
question: In 3rdrider's export pipeline, what order do the two safety gates run?
ruling: PENDING
---

**Context:** two structural gates now exist and export (WS5) must pass both:
the VERIFICATION gate (provider tapped yes/no/change) and the ANONYMIZATION
gate (PII stripped). Order matters for what reviewers/providers see.

**Options:**
- **A — verify first, then anonymize at the boundary** (provider verifies
  real values; PII stripped only as data leaves the device).
- **B — anonymize first, then verify** (provider verifies already-stripped
  records; safest against leaks, but provider sees tokens not names).
- **C — both enforced independently at the export boundary** (order
  internal, export requires Verified AND Sanitized envelopes).

Reply A / B / C (or REVISE with your own rule).
