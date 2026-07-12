/**
 * Entry point: wire real dependencies, enforce the binding guard, listen.
 */
import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import pty from "node-pty";
import { resolveBindHost, assertNeverPublic, BindRefusedError } from "./bind.ts";
import { SessionManager, type ExecFn } from "./sessions.ts";
import { buildServer } from "./server.ts";

const execFileP = promisify(execFile);

const exec: ExecFn = async (cmd, args) => {
  const { stdout, stderr } = await execFileP(cmd, args, { maxBuffer: 1024 * 1024 });
  return { stdout, stderr };
};

const sessions = new SessionManager(exec);

const spawnAttach = (name: string, cols: number, rows: number) => {
  const { cmd, args } = sessions.attachArgs(name);
  return pty.spawn(cmd, args, {
    name: "xterm-256color",
    cols,
    rows,
    cwd: os.homedir(),
    env: process.env as Record<string, string>,
  });
};

async function main(): Promise<void> {
  const resolution = await resolveBindHost({
    env: process.env as Record<string, string | undefined>,
    tailscaleIp: async () => {
      try {
        const { stdout } = await execFileP("tailscale", ["ip", "-4"]);
        return stdout.trim();
      } catch {
        return null;
      }
    },
    interfaces: () => os.networkInterfaces() as never,
  });

  // Belt and braces: re-assert right before listen.
  assertNeverPublic(resolution.host);

  const port = Number(process.env["BROKER_PORT"] ?? 8791);
  const server = buildServer({
    sessions,
    spawnAttach,
    log: (m) => console.log(`[broker] ${m}`),
    version: "0.1.0",
  });

  server.listen(port, resolution.host, () => {
    console.log(
      `[broker] listening on http://${resolution.host}:${port} ` +
        `(mode=${resolution.mode}, source=${resolution.source})`,
    );
    if (resolution.mode === "localhost") {
      console.log("[broker] DEV MODE: localhost-only via BROKER_DEV_LOCALHOST=1 — not reachable from the tailnet");
    }
  });

  const shutdown = () => {
    console.log("[broker] shutting down (tmux sessions stay alive)");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  if (err instanceof BindRefusedError) {
    console.error(`[broker] REFUSING TO START: ${err.message}`);
  } else {
    console.error("[broker] fatal:", err);
  }
  process.exit(1);
});
