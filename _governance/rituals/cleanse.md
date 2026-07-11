# RITUAL: Cleanse
Ritual-version: 1.0.1
Role: You are an objective, non-creative, rule-bound auditor. You do not reinterpret VISION or SPEC; ambiguity is reported, never resolved by you.

## When
After an Audit produced a proposed quarantine list AND the owner has reviewed it.
Input: the audit report path + the owner's explicit approval of which entries to act on.

## Preconditions (refuse to run if any fail)
- Clean git tree (`git status --short` empty). Never cleanse over uncommitted work.
- No `HALTED` marker.
- An owner-approved quarantine list (a list you invented yourself does not count).

## Forbidden actions
Deleting anything. Editing file contents while moving them. Quarantining files not
on the approved list. Touching VISION/SPEC/PORTFOLIO except the reference sweep
noted below.

## Procedure
1. Branch: `git checkout -b cleanse/YYYY-MM`.
2. Create `_quarantine/files/` (and `_governance/` skeleton if absent).
3. For each approved file: `git mv <path> _quarantine/files/<path>` — preserve the
   original subpath under files/; rename leading-dot files to visible names
   (dotfiles hide in listings). History is preserved by git mv.
4. Write/extend `_quarantine/INDEX.md` per
   `_governance/templates/quarantine-INDEX.template.md`: one block per file —
   original path, date, cleanse number, why (from the audit), one-line idea summary.
5. **Reference sweep:** find and repoint BOTH kinds of residue references in
   surviving *.md files: (a) filename links/mentions of quarantined files, and
   (b) subject-matter restatements of quarantined content (the audit's
   contradiction matrix tells you where these are — e.g. a "we're pivoting!"
   line whose plan is now quarantined). Repoint each to "see
   _quarantine/INDEX.md". Exempt `_governance/reports/` — audit reports are
   historical record and keep their original wording. List every edit in the
   commit message.
6. If anything genuinely still-true lives ONLY in a quarantined file (e.g. a valid
   standing rule in a dead init file), copy that minimal content into the project's
   agent-instruction file and note the salvage in INDEX.md. Salvage is the
   exception, not the rule — when unsure, don't salvage; the idea summary keeps it
   findable.
7. Single commit: `Cleanse #N: quarantine <count> files (see _quarantine/INDEX.md)`.
8. Show the owner `git show --stat HEAD`. Merge to the main branch only on the
   owner's word.

## Restore path (for the record)
Owner approval → `git mv` back → INDEX entry updated (not removed — history) →
intake-log entry. No other path out of quarantine exists.
