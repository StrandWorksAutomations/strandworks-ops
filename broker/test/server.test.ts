/**
 * Server-layer tests: injected fake session-manager and fake pty, no tmux,
 * no node-pty, no tailnet. Everything binds 127.0.0.1:0 (ephemeral).
 */
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { WebSocket } from "ws";
import { buildServer, type PtyLike, type SpawnAttachFn } from "../src/server.ts";
import type { SessionManager } from "../src/sessions.ts";
import { start } from "../src/index.ts";
import { BindRefusedError } from "../src/bind.ts";

// ---------- fakes ----------

/** Duck-typed SessionManager whose list() deliberately returns EXTRA fields. */
function fakeSessions(): SessionManager {
  const fake = {
    list: async () => [
      // createdAt (and a decoy secret-ish field) must NOT leak into /api/status.
      { name: "alpha", status: "attached", createdAt: 1111, ageSeconds: 42, cwd: "/home/owner" },
      { name: "beta", status: "detached", createdAt: 2222, ageSeconds: 7, cwd: "/home/owner" },
    ],
    exists: async () => true,
    create: async (name: string) => ({ name, status: "detached", createdAt: 0, ageSeconds: 0 }),
    kill: async () => {},
    attachArgs: (name: string) => ({ cmd: "tmux", args: ["attach-session", "-t", `=${name}`] }),
  };
  return fake as unknown as SessionManager;
}

class FakePty implements PtyLike {
  written: string[] = [];
  resized: Array<{ cols: number; rows: number }> = [];
  killed = false;
  private dataCb: ((data: string) => void) | null = null;
  onData(cb: (data: string) => void): void {
    this.dataCb = cb;
  }
  onExit(_cb: (ev: { exitCode: number }) => void): void {}
  write(data: string): void {
    this.written.push(data);
  }
  resize(cols: number, rows: number): void {
    this.resized.push({ cols, rows });
  }
  kill(): void {
    this.killed = true;
  }
  emitData(data: string): void {
    this.dataCb?.(data);
  }
}

// ---------- helpers ----------

const openServers: http.Server[] = [];
afterEach(() => {
  for (const s of openServers.splice(0)) s.close();
});

async function listen(server: http.Server): Promise<number> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  openServers.push(server);
  const addr = server.address();
  assert.ok(typeof addr === "object" && addr !== null);
  return addr.port;
}

function request(
  port: number,
  path: string,
  method = "GET",
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path, method }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

/** Attempt a WS upgrade; resolve "open" or the failure ("403"/destroyed). */
function tryUpgrade(port: number, path: string): Promise<{ outcome: "open" | "rejected"; detail: string; ws: WebSocket }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    ws.on("open", () => resolve({ outcome: "open", detail: "", ws }));
    ws.on("error", (err) => resolve({ outcome: "rejected", detail: err.message, ws }));
  });
}

// ---------- tests ----------

describe("GET /api/status payload shape", () => {
  test("session entries contain ONLY {name, status, ageSeconds}", async () => {
    const server = buildServer({
      sessions: fakeSessions(),
      spawnAttach: () => new FakePty(),
    });
    const port = await listen(server);
    const res = await request(port, "/api/status");
    assert.equal(res.status, 200);
    const payload = JSON.parse(res.body) as { broker: unknown; sessions: Array<Record<string, unknown>> };

    // No extra top-level keys either.
    assert.deepEqual(Object.keys(payload).sort(), ["broker", "sessions"]);

    assert.equal(payload.sessions.length, 2);
    for (const s of payload.sessions) {
      assert.deepEqual(
        Object.keys(s).sort(),
        ["ageSeconds", "name", "status"],
        `extra/missing keys leaked into status payload: ${JSON.stringify(s)}`,
      );
    }
    // deepEqual is strict about key sets: createdAt/cwd must be gone.
    assert.deepEqual(payload.sessions, [
      { name: "alpha", status: "attached", ageSeconds: 42 },
      { name: "beta", status: "detached", ageSeconds: 7 },
    ]);
  });

  test("/api/sessions alias returns the same restricted shape", async () => {
    const server = buildServer({ sessions: fakeSessions(), spawnAttach: () => new FakePty() });
    const port = await listen(server);
    const res = await request(port, "/api/sessions");
    const payload = JSON.parse(res.body) as { sessions: Array<Record<string, unknown>> };
    for (const s of payload.sessions) {
      assert.deepEqual(Object.keys(s).sort(), ["ageSeconds", "name", "status"]);
    }
  });
});

describe("WebSocket upgrade gate", () => {
  test("upgrades on any path other than /ws/attach are destroyed", async () => {
    let spawned = 0;
    const spawnAttach: SpawnAttachFn = () => {
      spawned += 1;
      return new FakePty();
    };
    const server = buildServer({ sessions: fakeSessions(), spawnAttach });
    const port = await listen(server);

    for (const path of ["/ws/other", "/ws", "/", "/api/status"]) {
      const r = await tryUpgrade(port, path);
      assert.equal(r.outcome, "rejected", `upgrade on ${path} must be destroyed`);
      assert.match(r.detail, /403|socket hang up|closed before/i);
    }
    assert.equal(spawned, 0, "no pty may be spawned for rejected upgrades");
  });

  test("/ws/attach bridges to the injected pty (sanity: seam is live)", async () => {
    const pty = new FakePty();
    const server = buildServer({ sessions: fakeSessions(), spawnAttach: () => pty });
    const port = await listen(server);

    const r = await tryUpgrade(port, "/ws/attach?session=alpha&cols=11&rows=5");
    assert.equal(r.outcome, "open");

    const gotOutput = new Promise<string>((resolve) => {
      r.ws.on("message", (raw) => {
        const msg = JSON.parse(String(raw)) as { t: string; d: string };
        if (msg.t === "o") resolve(msg.d);
      });
    });
    pty.emitData("hello from tmux");
    assert.equal(await gotOutput, "hello from tmux");

    r.ws.send(JSON.stringify({ t: "i", d: "ls\n" }));
    r.ws.send(JSON.stringify({ t: "r", cols: 120, rows: 40 }));
    // Wait for the frames to land server-side.
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.deepEqual(pty.written, ["ls\n"]);
    assert.deepEqual(pty.resized, [{ cols: 120, rows: 40 }]);

    r.ws.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(pty.killed, true, "closing the socket must kill the attach pty");
  });
});

describe("authorize seam", () => {
  test("deny-all authorize yields 403 on every HTTP route", async () => {
    const consulted: string[] = [];
    const server = buildServer({
      sessions: fakeSessions(),
      spawnAttach: () => new FakePty(),
      authorize: (req) => {
        consulted.push(req.url ?? "");
        return { ok: false, status: 403, reason: "denied by test" };
      },
    });
    const port = await listen(server);

    for (const [method, path] of [
      ["GET", "/healthz"],
      ["GET", "/api/status"],
      ["POST", "/api/sessions"],
      ["DELETE", "/api/sessions/alpha"],
      ["GET", "/"],
    ] as const) {
      const res = await request(port, path, method);
      assert.equal(res.status, 403, `${method} ${path} must be denied`);
      assert.deepEqual(JSON.parse(res.body), { error: "denied by test" });
    }
    assert.equal(consulted.length, 5, "authorize must be consulted once per request");
  });

  test("deny-all authorize destroys even a well-formed /ws/attach upgrade", async () => {
    let spawned = 0;
    let wsConsulted = 0;
    const server = buildServer({
      sessions: fakeSessions(),
      spawnAttach: () => {
        spawned += 1;
        return new FakePty();
      },
      authorize: () => {
        wsConsulted += 1;
        return { ok: false, status: 403, reason: "denied" };
      },
    });
    const port = await listen(server);

    const r = await tryUpgrade(port, "/ws/attach?session=alpha");
    assert.equal(r.outcome, "rejected");
    assert.match(r.detail, /403|socket hang up|closed before/i);
    assert.ok(wsConsulted >= 1, "authorize must be consulted on WS upgrade");
    assert.equal(spawned, 0, "denied upgrade must never reach the pty");
  });
});

describe("startup path (start())", () => {
  test("refuses to listen when resolveBindHost refuses — nothing binds", async () => {
    let interfacesAsked = false;
    await assert.rejects(
      () =>
        start({
          env: {},
          tailscaleIp: async () => null,
          interfaces: () => {
            interfacesAsked = true;
            return {};
          },
          sessions: fakeSessions(),
          spawnAttach: () => new FakePty(),
          log: () => {},
        }),
      BindRefusedError,
    );
    assert.equal(interfacesAsked, true, "the binding guard must run (it gates listen)");
  });

  test("resolves the bind host BEFORE listening, then serves on it", async () => {
    const order: string[] = [];
    const { server, resolution, host, port } = await start({
      env: { BROKER_DEV_LOCALHOST: "1", BROKER_PORT: "0" },
      tailscaleIp: async () => {
        order.push("resolve");
        return null;
      },
      interfaces: () => ({}),
      sessions: fakeSessions(),
      spawnAttach: () => new FakePty(),
      log: (m) => {
        if (m.startsWith("listening")) order.push("listen");
      },
    });
    openServers.push(server);

    assert.deepEqual(order, ["resolve", "listen"], "resolveBindHost must precede listen");
    assert.deepEqual(resolution, { host: "127.0.0.1", mode: "localhost", source: "dev-override" });
    assert.equal(host, "127.0.0.1");
    assert.ok(port > 0);

    const res = await request(port, "/healthz");
    assert.equal(res.status, 200);
    assert.deepEqual(JSON.parse(res.body), { ok: true });
  });
});
