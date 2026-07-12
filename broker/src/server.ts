/**
 * HTTP + WebSocket server.
 *
 * Auth model (v1, per SPEC): tailnet-only IS the auth — network-layer
 * identity, no app-level secrets. Every request still passes through the
 * single `authorize()` choke point below so a real auth layer (e.g. Tailscale
 * whois header check, or passkey-derived token) slots in later without
 * touching route logic.
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import type { SessionManager, SessionKind } from "./sessions.ts";

export interface PtyLike {
  onData(cb: (data: string) => void): void;
  onExit(cb: (ev: { exitCode: number }) => void): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
}

export type SpawnAttachFn = (
  sessionName: string,
  cols: number,
  rows: number,
) => PtyLike;

export interface AuthDecision {
  ok: boolean;
  status?: number;
  reason?: string;
}

export interface ServerDeps {
  sessions: SessionManager;
  spawnAttach: SpawnAttachFn;
  /**
   * AUTH SEAM. v1 always allows: reachability implies tailnet membership
   * (binding guard) and the tailnet is single-owner. Replace this one
   * function to add owner verification later.
   */
  authorize?: (req: http.IncomingMessage) => AuthDecision;
  log?: (msg: string) => void;
  version?: string;
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.join(HERE, "..", "static");
const XTERM_DIR = path.join(HERE, "..", "node_modules", "@xterm");

const VENDOR_FILES: Record<string, { file: string; type: string }> = {
  "/vendor/xterm.js": { file: path.join(XTERM_DIR, "xterm", "lib", "xterm.js"), type: "text/javascript" },
  "/vendor/xterm.css": { file: path.join(XTERM_DIR, "xterm", "css", "xterm.css"), type: "text/css" },
  "/vendor/addon-fit.js": { file: path.join(XTERM_DIR, "addon-fit", "lib", "addon-fit.js"), type: "text/javascript" },
};

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage, limit = 4096): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function buildServer(deps: ServerDeps): http.Server {
  const { sessions, spawnAttach } = deps;
  const authorize = deps.authorize ?? (() => ({ ok: true }) as AuthDecision);
  const log = deps.log ?? (() => {});
  const startedAt = Math.floor(Date.now() / 1000);

  const server = http.createServer(async (req, res) => {
    const auth = authorize(req);
    if (!auth.ok) {
      sendJson(res, auth.status ?? 403, { error: auth.reason ?? "forbidden" });
      return;
    }

    const url = new URL(req.url ?? "/", "http://broker.invalid");
    const route = `${req.method} ${url.pathname}`;

    try {
      if (route === "GET /healthz") {
        sendJson(res, 200, { ok: true });
        return;
      }

      // Read-only status: names, states, ages — NEVER terminal content.
      if (route === "GET /api/status" || route === "GET /api/sessions") {
        const list = await sessions.list();
        sendJson(res, 200, {
          broker: { version: deps.version ?? "dev", startedAt },
          sessions: list.map((s) => ({
            name: s.name,
            status: s.status,
            ageSeconds: s.ageSeconds,
          })),
        });
        return;
      }

      if (route === "POST /api/sessions") {
        const body = JSON.parse((await readBody(req)) || "{}") as {
          name?: string;
          kind?: string;
        };
        const kind: SessionKind = body.kind === "claude" ? "claude" : "shell";
        if (typeof body.name !== "string") {
          sendJson(res, 400, { error: "missing session name" });
          return;
        }
        const info = await sessions.create(body.name, kind);
        log(`created session ${info.name} (${kind})`);
        sendJson(res, 201, { name: info.name, status: info.status, ageSeconds: info.ageSeconds });
        return;
      }

      const killMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
      if (req.method === "DELETE" && killMatch) {
        const name = decodeURIComponent(killMatch[1]);
        await sessions.kill(name);
        log(`killed session ${name}`);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (route === "GET /" || route === "GET /index.html") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        res.end(readFileSync(path.join(STATIC_DIR, "index.html")));
        return;
      }

      const vendor = VENDOR_FILES[url.pathname];
      if (req.method === "GET" && vendor) {
        res.writeHead(200, { "content-type": vendor.type, "cache-control": "max-age=3600" });
        res.end(readFileSync(vendor.file));
        return;
      }

      sendJson(res, 404, { error: "not found" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = /invalid session name|body too large|Unexpected token|JSON/.test(msg) ? 400 : 500;
      sendJson(res, status, { error: msg });
    }
  });

  // WebSocket terminal bridge: /ws/attach?session=NAME
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    const auth = authorize(req);
    const url = new URL(req.url ?? "/", "http://broker.invalid");
    if (!auth.ok || url.pathname !== "/ws/attach") {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      const name = url.searchParams.get("session") ?? "";
      const cols = Number(url.searchParams.get("cols")) || 80;
      const rows = Number(url.searchParams.get("rows")) || 24;
      bridge(ws, name, cols, rows);
    });
  });

  function bridge(ws: WebSocket, name: string, cols: number, rows: number): void {
    let pty: PtyLike;
    try {
      pty = spawnAttach(name, cols, rows);
    } catch (err) {
      ws.send(JSON.stringify({ t: "err", d: err instanceof Error ? err.message : String(err) }));
      ws.close();
      return;
    }
    log(`attach ${name} (${cols}x${rows})`);
    pty.onData((data) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ t: "o", d: data }));
    });
    pty.onExit(() => {
      if (ws.readyState === ws.OPEN) ws.close(1000, "session detached");
    });
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as { t: string; d?: string; cols?: number; rows?: number };
        if (msg.t === "i" && typeof msg.d === "string") pty.write(msg.d);
        else if (msg.t === "r" && msg.cols && msg.rows) pty.resize(msg.cols, msg.rows);
      } catch {
        /* ignore malformed frames */
      }
    });
    ws.on("close", () => {
      // Kill only the attach client pty; the tmux session itself lives on.
      pty.kill();
      log(`detach ${name}`);
    });
  }

  return server;
}
