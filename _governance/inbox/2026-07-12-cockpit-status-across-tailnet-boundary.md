# How the public cockpit consumes broker status across the tailnet boundary (filed by build agent, 2026-07-12)

Non-directive options note from building `broker/` (branch
`cockpit-slice-2-vaio`). Sprint instruction explicitly authorized filing this
as an inbox note and explicitly forbade deciding it. OPEN QUESTION — owner
decides via Intake.

Context: the broker serves a read-only status JSON (`GET /api/status` —
session names, states, ages; never terminal content) on its tailnet address
only. The Vercel-hosted cockpit at `dashboard.strandautomationworks.com` runs
on public infrastructure that is not on the tailnet, so it cannot fetch that
endpoint server-side. SPEC says the public cockpit "shows live session status
and deep-links into tailnet-served terminals". Options seen, in no order:

1. **Browser-side fetch from the owner's device.** The cockpit page fetches
   `http://<broker-tailnet-ip>:8791/api/status` client-side. The owner's
   phone IS on the tailnet, so it works exactly where it should and fails
   closed everywhere else (off-tailnet devices see "broker unreachable",
   which matches the slice-2 acceptance criterion). Caveats: mixed-content
   (HTTPS page fetching plain HTTP) likely requires Tailscale HTTPS certs
   (`tailscale cert`) or `tailscale serve` on the broker node; plus CORS
   headers on the status route.

2. **Tailscale Serve/Funnel for the status route only.** `tailscale serve`
   keeps it tailnet-internal with a proper TLS name (pairs with option 1);
   `tailscale funnel` would make the status JSON publicly reachable so
   Vercel could fetch it server-side — but that puts a (read-only, no
   terminal content) broker endpoint on the public internet, which needs an
   explicit owner ruling against the security floor's spirit.

3. **Git as transport.** Broker (or a cron) periodically commits a small
   status file to this repo; the cockpit renders it like any register. Zero
   new network paths, matches "git is the only data store", full audit
   trail — but status lags by the push interval and generates commit noise.

4. **Broker pushes to a Vercel endpoint.** Outbound HTTPS from the broker to
   a cockpit API route (e.g. every 30 s), cockpit caches it. No inbound
   public exposure, near-live status — but the push endpoint needs
   authentication, which contradicts "no auth secrets of its own in v1"
   unless the GitHub-token pattern (secret lives in env, location recorded
   in access register) is extended by owner decision.

5. **No public status at all.** Cockpit deep-links to the broker UI and the
   status is visible only once you're on the tailnet. Simplest and safest;
   reads SPEC's "public cockpit shows live session status" narrowly as
   "shows it to the owner", since the owner's devices are tailnet members
   anyway.
