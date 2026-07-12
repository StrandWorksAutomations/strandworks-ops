# 2026-07-12 — broker lists its own hosting tmux session (note, not directive)
The broker runs inside tmux session "strandworks-broker" and its own session
appears in the session list — killing it from the phone UI kills the broker.
Candidate fix for a future micro-sprint: SessionManager filters its own
hosting session (or a reserved-name prefix). Owner/intake decides.
