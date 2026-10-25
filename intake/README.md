# Owner email intake

Owner direction 24 Oct 2026: every important email about the businesses, Jonathan's own job and his licenses reaches the dashboard; replies to business contacts are drafted for his approval; scanned job-alert emails are archived with a label (never deleted).

```
Gmail (each account) ── watcher.gs every 15 min ──► Supabase intake_items (bniuiwbwumpymxiesyyt)
                                                         │
             scheduled Claude run 5×/day (CLASSIFIER.md) ┤ sort, summarise, draft reply, job links → intake_job_links
                                                         │
             dashboard /inbox: Approve & send · Save · Done · Dismiss · Keep in inbox
                                                         │
Gmail ◄── watcher.gs sends approved reply from that account, archives handled mail (labels SW-handled / KC/Jobs scanned)
```

- The watcher only reads the Primary and Updates tabs (never Promotions, Social, Forums); the classifier marks personal or generic mail as noise and clears its body. Noise is not archived.
- Nothing is sent without an approval click on the dashboard. Nothing is deleted. Email bodies of handled mail are cleared after 45 days (`intake_purge_bodies`).
- Job links feed the Kinetic Clinician importer through `intake_job_links_recent` (highest-paying branch `feature/intake-job-links`).

## Install the watcher in a Gmail account (about 2 minutes per account)

1. Signed in to that Gmail account, open https://script.google.com → New project → name it "Strandworks inbox watcher".
2. Replace the editor contents with `watcher.gs`. Save. Optional: Services (+) → Gmail API → Add.
3. Run `setup` and approve Google's permission screen (Gmail read/send/modify, external requests, triggers). The log prints the mailbox and a token fingerprint.
4. Register the fingerprint: `insert into owner_loop_agent_tokens(token_sha256,label) values ('<fingerprint>','Gmail watcher <mailbox>')` (project bniuiwbwumpymxiesyyt). The token itself never leaves the script.
5. Run `test`: the log shows how many messages were sent to the dashboard.

## admin@kineticclinician.com (Namecheap Private Email)

Not Gmail. In Private Email webmail → Settings → Forwarding, forward a copy to strandautomationworks@gmail.com (keep a local copy). Replies are then drafted against the forwarded message; send business replies from admin@ by hand until a direct IMAP path is added.
