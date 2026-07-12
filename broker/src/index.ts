/**
 * Entry point: wire real dependencies, enforce the binding guard, listen.
 *
 * Exported as a `start()` function so the startup path (resolveBindHost
 * BEFORE listen) is testable with injected deps; behavior when run as the
 * entry module is unchanged.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import type http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  resolveBindHost,
  assertNeverPublic,
  BindRefusedError,
  type BindDeps,
  type BindResolution,
} from "./bind.ts";
import { SessionManager, type ExecFn } from "./sessions.ts";
import { buildServer, type SpawnAttachFn } from "./server.ts";

const execFileP = promisify(execFile);

/**
 * Absolute-path allowlist for the tailscale binary. The broker NEVER
 * resolves `tailscale` through PATH: a writable directory earlier in PATH
 * could shim the binary and spoof the tailnet address the broker binds.
 * If no allowlisted binary exists, the CLI signal is simply "unavailable"
 * (which the binding guard treats as unverified → refuse).
 */
export const TAILSCALE_BIN_ALLOWLIST: readonly string[] = [
  "/usr/bin/tailscale",
  "/usr/sbin/tailscale",
];

export function findTailscaleBin(
  exists: (p: string) => boolean = existsSync,
): string | null {
  for (const candidate of TAILSCALE_BIN_ALLOWLIST) {
    if (exists(candidate)) return candidate;
  }
  return null; // no PATH fallback, ever
}

async function tailscaleIpFromAllowlistedBin(): Promise<string | null> {
  const bin = findTailscaleBin();
  if (bin === null) return null;
  try {
    const { stdout } = await execFileP(bin, ["ip", "-4"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

const realExec: ExecFn = async (cmd, args) => {
  const { stdout, stderr } = await execFileP(cmd, args, { maxBuffer: 1024 * 1024 });
  return { stdout, stderr };
};

/** Lazy so tests injecting spawnAttach never load the native node-pty module. */
async function defaultSpawnAttach(sessions: SessionManager): Promise<SpawnAttachFn> {
  const pty = (await import("node-pty")).default;
  return (name, cols, rows) => {
    const { cmd, args } = sessions.attachArgs(name);
    return pty.spawn(cmd, args, {
      name: "xterm-256color",
      cols,
      rows,
      cwd: os.homedir(),
      env: process.env as Record<string, string>,
    });
  };
}

export interface StartDeps {
  env?: Record<string, string | undefined>;
  tailscaleIp?: BindDeps["tailscaleIp"];
  interfaces?: BindDeps["interfaces"];
  sessions?: SessionManager;
  spawnAttach?: SpawnAttachFn;
  log?: (msg: string) => void;
}

export interface Started {
  server: http.Server;
  resolution: BindResolution;
  host: string;
  port: number;
}

/**
 * Resolve the bind host (throws BindRefusedError off-tailnet), THEN build the
 * server and listen. Nothing listens unless resolveBindHost has approved a
 * host — the ordering is the security property, so it lives in one function.
 */
export async function start(deps: StartDeps = {}): Promise<Started> {
  const env = deps.env ?? (process.env as Record<string, string | undefined>);
  const log = deps.log ?? ((m: string) => console.log(`[broker] ${m}`));

  const resolution = await resolveBindHost({
    env,
    tailscaleIp: deps.tailscaleIp ?? tailscaleIpFromAllowlistedBin,
    interfaces: deps.interfaces ?? (() => os.networkInterfaces() as never),
  });

  // Belt and braces: re-assert right before listen.
  assertNeverPublic(resolution.host);

  const sessions = deps.sessions ?? new SessionManager(realExec);
  const server = buildServer({
    sessions,
    spawnAttach: deps.spawnAttach ?? (await defaultSpawnAttach(sessions)),
    log,
    version: "0.1.0",
  });

  const port = Number(env["BROKER_PORT"] ?? 8791);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolution.host, () => resolve());
  });

  const addr = server.address();
  const boundPort = typeof addr === "object" && addr !== null ? addr.port : port;
  log(
    `listening on http://${resolution.host}:${boundPort} ` +
      `(mode=${resolution.mode}, source=${resolution.source})`,
  );
  if (resolution.mode === "localhost") {
    log("DEV MODE: localhost-only via BROKER_DEV_LOCALHOST=1 — not reachable from the tailnet");
  }
  return { server, resolution, host: resolution.host, port: boundPort };
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  start()
    .then(({ server }) => {
      const shutdown = () => {
        console.log("[broker] shutting down (tmux sessions stay alive)");
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 2000).unref();
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    })
    .catch((err) => {
      if (err instanceof BindRefusedError) {
        console.error(`[broker] REFUSING TO START: ${err.message}`);
      } else {
        console.error("[broker] fatal:", err);
      }
      process.exit(1);
    });
}
