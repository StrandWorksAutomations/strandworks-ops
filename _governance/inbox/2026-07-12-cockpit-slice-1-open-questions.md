# Cockpit slice 1 — open questions (filed by build agent, 2026-07-12)

Non-directive notes from building `cockpit/` (branch `cockpit-slice-1-fable`).
Sprint instruction explicitly authorized this note; inbox is canon's landing
place for dated notes (repo CLAUDE.md rule 2).

1. **Prod passkey enrollment window.** WebAuthn credentials are bound to the
   RP ID (domain), so a passkey enrolled on localhost cannot authenticate on
   `dashboard.strandautomationworks.com`. The supported path: deploy, then
   the owner opens `/setup` on the live domain ONCE and enrolls immediately —
   until that moment, anyone who discovered the fresh URL could enroll first.
   Acceptable as a deploy-checklist item, or should enrollment additionally
   require a one-time setup code env var?

2. **Signature counter not persisted.** With no database, the passkey's
   signature counter can't be updated after each login, so clone detection
   via counters isn't enforced. Apple platform authenticators report 0
   anyway — mostly theoretical, flagged for the record.

3. **Rulings commit straight to `main`.** SPEC reads that way ("a decision
   tapped on the phone is ... committed") and the app does exactly that via
   the trees API (one commit, message `ruling: TOKEN — id (source: cockpit)`).
   Confirm main-direct is intended rather than a rulings branch.

4. **Second passkey / device loss.** One credential is stored. iCloud
   Keychain syncs it across the owner's Apple devices, but a true second
   independent credential (e.g., hardware-key backup) would need the store
   extended from a single credential to an array.
