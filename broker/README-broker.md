# Session Broker

SPEC v1.0.0 slice 2, item 6. A small Node/TypeScript service for an always-on
Strandworks machine (VAIO now, Shadow VM later) that starts, lists, attaches
to, and stops AI terminal sessions from a phone browser — **inside the
tailnet only**.

## How it works

- **tmux is the state.** Every session is a tmux session (`tmux new-session
  -d`). The broker holds no session registry of its own, so sessions survive
  broker restarts; on restart the broker simply lists/reattaches whatever
  tmux still has alive. Killing the broker never kills sessions.
- **Web terminal.** Phone-first UI (xterm.js) served by the broker itself. A
  WebSocket bridges the browser to a `tmux attach-session` running in a pty
  (node-pty). Closing the page detaches; the session keeps running.
- **Binding guard (security floor).** On startup the broker resolves its bind
  address by cross-checking TWO signals: `tailscale ip -4` (invoked only via
  an absolute-path allowlist — `/usr/bin/tailscale`, `/usr/sbin/tailscale` —
  never PATH, which could be shimmed) and the OS interface table (a CGNAT
  address on an interface strictly named `tailscale<N>`). It binds ONLY when
  both signals agree on the same address; CLI-only, interface-only, or
  disagreeing signals refuse to start (100.64.0.0/10 alone proves nothing —
  it is also carrier CGNAT space). If no verified tailnet exists it
  **refuses to start**, unless `BROKER_DEV_LOCALHOST=1` explicitly downgrades
  to `127.0.0.1`. A `0.0.0.0` / `::` bind is rejected unconditionally, even
  via `BROKER_HOST`. Terminals are therefore unreachable at the network layer
  without the owner's Tailscale identity.
- **Auth (v1).** Per SPEC, tailnet membership IS the auth — the tailnet is
  single-owner and the broker never listens off it. All requests still flow
  through one `authorize()` seam in `src/server.ts` so an application-level
  auth layer (e.g. `tailscale whois` verification or a passkey-derived token)
  can be added later without touching route logic. The broker holds **no
  secrets** of its own.

## Requirements

- Node.js >= 23.6 (runs TypeScript directly via type stripping; VAIO has 24.x)
- tmux (3.x)
- Tailscale up, installed at `/usr/bin/tailscale` or `/usr/sbin/tailscale`
  (the broker never resolves the binary via PATH), with its interface named
  `tailscale<N>` (the Linux default, e.g. `tailscale0`)
- Build essentials for the `node-pty` native module (`gcc`, `make`, Python)

## Run

```sh
cd broker
npm install        # once; builds node-pty
npm test           # unit tests (session manager + binding guard)
npm run typecheck  # tsc --noEmit
npm start          # binds <tailnet-ip>:8791
```

Dev, off-tailnet only:

```sh
BROKER_DEV_LOCALHOST=1 npm start   # binds 127.0.0.1:8791, clearly labeled
```

Then open `http://<tailnet-ip>:8791/` on any tailnet device (phone included).

### Environment

| Var | Default | Meaning |
|---|---|---|
| `BROKER_PORT` | `8791` | Listen port |
| `BROKER_HOST` | auto | Optional pin; accepted only if it equals the detected tailnet address, or `127.0.0.1` together with the dev flag. Anything else refuses. |
| `BROKER_DEV_LOCALHOST` | unset | `1` = allow localhost-only when no tailnet exists (dev). Never binds beyond loopback. |

### API (all tailnet-only)

| Route | Purpose |
|---|---|
| `GET /api/status` | Read-only JSON: broker version/start time + session `name`, `status` (attached/detached), `ageSeconds`. **Never terminal content.** |
| `GET /api/sessions` | Same payload as `/api/status` |
| `POST /api/sessions` | `{"name": "...", "kind": "shell"\|"claude"}` → `tmux new-session -d` |
| `DELETE /api/sessions/:name` | `tmux kill-session` (exact-match) |
| `WS /ws/attach?session=NAME&cols=&rows=` | Terminal bridge (JSON frames: `i` input, `o` output, `r` resize) |
| `GET /healthz` | Liveness |

Session names: `[A-Za-z0-9][A-Za-z0-9_-]{0,31}`, validated before any tmux
call; tmux targets always use `=name` exact matching.

## systemd unit (example)

`/etc/systemd/system/strandworks-broker.service`:

```ini
[Unit]
Description=Strandworks session broker (tailnet-only)
After=network-online.target tailscaled.service
Wants=network-online.target

[Service]
Type=simple
User=jonathan
WorkingDirectory=/home/jonathan/work/strandworks-ops/broker
ExecStart=/usr/bin/env node src/index.ts
Restart=on-failure
RestartSec=5
Environment=BROKER_PORT=8791
# No secrets: tailnet-only is the auth (SPEC security floor).
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now strandworks-broker
journalctl -u strandworks-broker -f
```

If Tailscale is down at boot the broker exits nonzero and systemd retries
every 5 s until the tailnet is up — it never falls back to a public bind.

## What this deliberately does not do (v1)

- No app-level auth secrets (SPEC: network-layer identity; seam exists).
- No public exposure of terminals, ever — the Vercel cockpit must not proxy
  terminal I/O (SPEC security floor). How the public cockpit consumes the
  read-only status feed across the tailnet boundary is an OPEN QUESTION,
  filed as options in `_governance/inbox/2026-07-12-cockpit-status-across-tailnet-boundary.md`.
- No TLS: traffic rides Tailscale's WireGuard encryption inside the tailnet.
