/**
 * Binding guard — SPEC v1.0.0 security floor.
 *
 * The broker binds ONLY to a *verified* Tailscale address or (dev override
 * only) 127.0.0.1. It REFUSES to start on anything else — in particular a
 * public 0.0.0.0 / :: bind is rejected unconditionally.
 *
 * "Verified" means TWO independent signals agree:
 *   1. the tailscale CLI (invoked via an absolute-path allowlist upstream,
 *      never PATH — see index.ts) reports a CGNAT-range (100.64.0.0/10) IPv4;
 *   2. that exact address is present on a local interface whose name strictly
 *      matches the tailscale pattern (`tailscale<digits>`, e.g. tailscale0).
 *
 * Either signal alone is spoofable: a PATH-shimmed `tailscale` binary can
 * print any address, and 100.64.0.0/10 is also carrier CGNAT space, so a
 * CGNAT address on some interface does not by itself prove a tailnet.
 * CLI-only, interface-only, or disagreeing signals ⇒ refuse to start.
 * If no verified tailnet exists, the broker refuses to start unless
 * BROKER_DEV_LOCALHOST=1 explicitly downgrades to localhost-only (binding
 * 127.0.0.1 is safe regardless of what the detection signals claim).
 *
 * All inputs are injected so the logic is unit-testable without a tailnet.
 */

export interface IfaceAddr {
  address: string;
  family: string; // "IPv4" | "IPv6"
}

export interface BindDeps {
  env: Record<string, string | undefined>;
  /**
   * Runs `tailscale ip -4`; resolves to stdout or null if unavailable.
   * The production implementation MUST invoke an allowlisted absolute path
   * (never PATH resolution) — see index.ts.
   */
  tailscaleIp: () => Promise<string | null>;
  /** os.networkInterfaces()-shaped map. */
  interfaces: () => Record<string, IfaceAddr[] | undefined>;
}

export interface BindResolution {
  host: string;
  mode: "tailnet" | "localhost";
  source: "tailscale-verified" | "env-pin" | "dev-override";
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

/**
 * Interface names we trust as tailscale interfaces: exactly "tailscale"
 * followed by digits (tailscale0, tailscale1, …). Deliberately NOT a loose
 * "ts*" prefix — that would also match unrelated interfaces.
 */
const TAILSCALE_IFACE_RE = /^tailscale\d+$/;

interface TailnetSignals {
  /** CGNAT-range IPv4 reported by the tailscale CLI, if any. */
  cliIp: string | null;
  /** CGNAT-range IPv4s present on strictly-named tailscale interfaces. */
  ifaceIps: Set<string>;
  /** The address only when BOTH signals agree on it, else null. */
  verified: string | null;
}

function tailnetIfaceAddrs(deps: BindDeps): Set<string> {
  const out = new Set<string>();
  for (const [name, addrs] of Object.entries(deps.interfaces())) {
    if (!TAILSCALE_IFACE_RE.test(name)) continue;
    for (const a of addrs ?? []) {
      if (a.family === "IPv4" && isTailnetV4(a.address)) out.add(a.address);
    }
  }
  return out;
}

async function detectTailnet(deps: BindDeps): Promise<TailnetSignals> {
  // Signal 1: the tailscale CLI (allowlisted absolute path upstream).
  const cliOut = await deps.tailscaleIp().catch(() => null);
  let cliIp: string | null = null;
  if (cliOut) {
    const first = cliOut.split(/\s+/).find((l) => l.length > 0) ?? "";
    if (isTailnetV4(first)) cliIp = first;
  }
  // Signal 2: strictly-named tailscale interfaces from the OS.
  const ifaceIps = tailnetIfaceAddrs(deps);
  // Cross-check: trust the address only when both signals agree.
  const verified = cliIp !== null && ifaceIps.has(cliIp) ? cliIp : null;
  return { cliIp, ifaceIps, verified };
}

/** Refusal message for the partial-signal (unverified) detection outcomes. */
function unverifiedRefusal(t: TailnetSignals): BindRefusedError {
  const ifaceList = [...t.ifaceIps].join(", ");
  if (t.cliIp && t.ifaceIps.size > 0) {
    return new BindRefusedError(
      `tailscale CLI reports ${t.cliIp} but the tailscale interface(s) carry ${ifaceList} — ` +
        "CLI and interface disagree; refusing to bind an unverified address",
    );
  }
  if (t.cliIp) {
    return new BindRefusedError(
      `tailscale CLI reports ${t.cliIp} but no local interface named tailscale<N> carries that address — ` +
        "a CLI answer alone is spoofable (PATH shim / carrier CGNAT); refusing",
    );
  }
  if (t.ifaceIps.size > 0) {
    return new BindRefusedError(
      `interface address(es) ${ifaceList} look tailnet-shaped but the tailscale CLI did not confirm them — ` +
        "100.64.0.0/10 is also carrier-CGNAT space; refusing without CLI confirmation",
    );
  }
  return new BindRefusedError(
    "no Tailscale detected (allowlisted `tailscale ip -4` and tailscale<N> interfaces both empty) — " +
      "the broker refuses to start off-tailnet. Set BROKER_DEV_LOCALHOST=1 to run localhost-only for development.",
  );
}

/**
 * Decide the one address the broker may bind, or throw BindRefusedError.
 *
 * Rules, in order:
 *  - BROKER_HOST, if set, must be either the VERIFIED tailnet address
 *    (CLI and interface agree) or 127.0.0.1 (the latter only with
 *    BROKER_DEV_LOCALHOST=1). Anything else — especially 0.0.0.0/:: — is
 *    refused.
 *  - Otherwise bind the verified tailnet IPv4.
 *  - No verified tailnet: BROKER_DEV_LOCALHOST=1 → 127.0.0.1 (safe bind no
 *    matter what the signals claim); otherwise refuse, with a message that
 *    says exactly which signal was missing or disagreeing.
 */
export async function resolveBindHost(deps: BindDeps): Promise<BindResolution> {
  const devLocalhost = deps.env["BROKER_DEV_LOCALHOST"] === "1";
  const pinned = deps.env["BROKER_HOST"]?.trim();
  const tailnet = await detectTailnet(deps);

  if (pinned !== undefined) {
    assertNeverPublic(pinned);
    if (tailnet.verified !== null && pinned === tailnet.verified) {
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
      `BROKER_HOST=${pinned} is not this machine's verified tailnet address` +
        `${tailnet.verified !== null ? ` (${tailnet.verified})` : " (no verified tailnet detected)"} and not localhost — refusing`,
    );
  }

  if (tailnet.verified !== null) {
    assertNeverPublic(tailnet.verified);
    return { host: tailnet.verified, mode: "tailnet", source: "tailscale-verified" };
  }

  if (devLocalhost) {
    return { host: "127.0.0.1", mode: "localhost", source: "dev-override" };
  }

  throw unverifiedRefusal(tailnet);
}
