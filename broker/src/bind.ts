/**
 * Binding guard — SPEC v1.0.0 security floor.
 *
 * The broker binds ONLY to a Tailscale interface address or (dev override
 * only) 127.0.0.1. It REFUSES to start on anything else — in particular a
 * public 0.0.0.0 / :: bind is rejected unconditionally. If no tailnet
 * interface exists, the broker refuses to start unless BROKER_DEV_LOCALHOST=1
 * explicitly downgrades to localhost-only.
 *
 * All inputs are injected so the logic is unit-testable without a tailnet.
 */

export interface IfaceAddr {
  address: string;
  family: string; // "IPv4" | "IPv6"
}

export interface BindDeps {
  env: Record<string, string | undefined>;
  /** Runs `tailscale ip -4`; resolves to stdout or null if unavailable. */
  tailscaleIp: () => Promise<string | null>;
  /** os.networkInterfaces()-shaped map. */
  interfaces: () => Record<string, IfaceAddr[] | undefined>;
}

export interface BindResolution {
  host: string;
  mode: "tailnet" | "localhost";
  source: "tailscale-cli" | "tailscale-iface" | "env-pin" | "dev-override";
}

export class BindRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BindRefusedError";
  }
}

const PUBLIC_WILDCARDS = new Set(["0.0.0.0", "::", "::0", "*", ""]);
const LOCALHOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const IPV4_RE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/** Throws if the host is a wildcard / public-catch-all bind. Final backstop. */
export function assertNeverPublic(host: string): void {
  if (PUBLIC_WILDCARDS.has(host.trim())) {
    throw new BindRefusedError(
      `refusing public bind address ${JSON.stringify(host)} — the broker never listens on all interfaces`,
    );
  }
}

function isTailnetV4(ip: string): boolean {
  // Tailscale hands out CGNAT-range addresses: 100.64.0.0/10.
  if (!IPV4_RE.test(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  return a === 100 && b >= 64 && b <= 127;
}

async function detectTailnetV4(deps: BindDeps): Promise<{ ip: string; source: "tailscale-cli" | "tailscale-iface" } | null> {
  // 1. Ask the tailscale CLI.
  const cliOut = await deps.tailscaleIp().catch(() => null);
  if (cliOut) {
    const first = cliOut.split(/\s+/).find((l) => l.length > 0) ?? "";
    if (isTailnetV4(first)) return { ip: first, source: "tailscale-cli" };
  }
  // 2. Fall back to scanning for a tailscale* interface.
  const ifaces = deps.interfaces();
  for (const [name, addrs] of Object.entries(ifaces)) {
    if (!name.startsWith("tailscale") && !name.startsWith("ts")) continue;
    for (const a of addrs ?? []) {
      if (a.family === "IPv4" && isTailnetV4(a.address)) {
        return { ip: a.address, source: "tailscale-iface" };
      }
    }
  }
  return null;
}

/**
 * Decide the one address the broker may bind, or throw BindRefusedError.
 *
 * Rules, in order:
 *  - BROKER_HOST, if set, must be either the detected tailnet address or
 *    127.0.0.1 (the latter only with BROKER_DEV_LOCALHOST=1). Anything else —
 *    especially 0.0.0.0/:: — is refused.
 *  - Otherwise bind the detected tailnet IPv4.
 *  - No tailnet: refuse, unless BROKER_DEV_LOCALHOST=1 → 127.0.0.1.
 */
export async function resolveBindHost(deps: BindDeps): Promise<BindResolution> {
  const devLocalhost = deps.env["BROKER_DEV_LOCALHOST"] === "1";
  const pinned = deps.env["BROKER_HOST"]?.trim();
  const tailnet = await detectTailnetV4(deps);

  if (pinned !== undefined) {
    assertNeverPublic(pinned);
    if (tailnet && pinned === tailnet.ip) {
      return { host: pinned, mode: "tailnet", source: "env-pin" };
    }
    if (LOCALHOSTS.has(pinned)) {
      if (devLocalhost) {
        return { host: "127.0.0.1", mode: "localhost", source: "dev-override" };
      }
      throw new BindRefusedError(
        "BROKER_HOST pins localhost but BROKER_DEV_LOCALHOST=1 is not set — localhost-only is a deliberate dev downgrade, not a default",
      );
    }
    throw new BindRefusedError(
      `BROKER_HOST=${pinned} is not this machine's tailnet address${tailnet ? ` (${tailnet.ip})` : " (no tailnet detected)"} and not localhost — refusing`,
    );
  }

  if (tailnet) {
    assertNeverPublic(tailnet.ip);
    return { host: tailnet.ip, mode: "tailnet", source: tailnet.source };
  }

  if (devLocalhost) {
    return { host: "127.0.0.1", mode: "localhost", source: "dev-override" };
  }

  throw new BindRefusedError(
    "no Tailscale interface found (tried `tailscale ip -4` and tailscale* interfaces) — " +
      "the broker refuses to start off-tailnet. Set BROKER_DEV_LOCALHOST=1 to run localhost-only for development.",
  );
}
