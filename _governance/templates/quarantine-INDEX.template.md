<!-- TEMPLATE: _quarantine/INDEX.md — the ONLY readable surface of quarantine.
     One block per quarantined file. Written by the Cleanse ritual. -->

# QUARANTINE INDEX — {{PROJECT_NAME}}

Contents live in `files/` and are read-blocked to agents. This manifest exists so
no idea is ever lost: every entry records what the file was and the idea inside it.

**Restoring a file** = owner approval + `git mv` back + INDEX update + intake-log
entry. There is no other path out.

---

## {{FILENAME}}
- Original path: {{ORIGINAL_PATH}}
- Quarantined: {{DATE}} (cleanse #{{N}})
- Why: {{one-sentence reason — e.g. "describes infrastructure that was never
  built" / "contradicts blessed VISION non-goal #2" / "abandoned plan from
  {{MONTH}} sessions"}}
- Idea, one line: {{the salvageable idea, so it can be found and re-proposed
  via Intake if it's ever wanted}}

<!-- repeat block per file -->
