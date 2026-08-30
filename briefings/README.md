# briefings/ — the agent feed

One file per message. This replaced the Telegram bot on 2026-08-30 (owner: the content was
useful, the push delivery was not). Rendered at
https://dashboard.strandautomationworks.com/briefings (cockpit `/briefings`, newest first,
latest five on Today).

- Writer: `/Users/jonathanbouren/PROJECTS/_ops/lib/post-briefing.sh --text "..." [--document <report.md>] [--source <job>]`
  (same interface as the old `send_via_telegram.sh`, which now forwards here). Runs on the
  laptop and the claude-ops droplet; writes straight to `main` via the GitHub contents API.
- Filename: `<YYYY-MM-DD>-<HHMMSS>-<host>-<slug>.md`. New file every time → no merge conflicts.
- Frontmatter: `date, time, host, source, title`, optional `attachment` (a copy of the
  `--document` under `attachments/`, text ≤ 400 KB) or `attachment_note`.
- Never edit or reflow old files; they are the record of what was reported.
