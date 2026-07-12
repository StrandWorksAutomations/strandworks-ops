import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  resolveBindHost,
  assertNeverPublic,
  BindRefusedError,
  type BindDeps,
} from "../src/bind.ts";

const TS_IP = "100.75.203.127";
const OTHER_CGNAT = "100.99.1.2";

function deps(overrides: Partial<BindDeps> = {}): BindDeps {
  return {
    env: {},
    tailscaleIp: async () => null,
    interfaces: () => ({}),
    ...overrides,
  };
}

/** Interfaces map with TS_IP on a strictly-named tailscale interface. */
function tsIfaces(ip: string = TS_IP): BindDeps["interfaces"] {
  return () => ({
    lo: [{ address: "127.0.0.1", family: "IPv4" }],
    eth0: [{ address: "192.168.1.20", family: "IPv4" }],
    tailscale0: [
      { address: "fd7a:115c::1", family: "IPv6" },
      { address: ip, family: "IPv4" },
    ],
  });
}

describe("assertNeverPublic", () => {
  test("refuses every wildcard bind", () => {
    for (const bad of ["0.0.0.0", "::", "::0", "*", "", " "]) {
      assert.throws(() => assertNeverPublic(bad), BindRefusedError, `should refuse ${JSON.stringify(bad)}`);
    }
  });

  test("allows specific addresses", () => {
    assertNeverPublic(TS_IP);
    assertNeverPublic("127.0.0.1");
  });
});

describe("resolveBindHost — cross-checked tailnet detection", () => {
  test("AGREE: CLI address confirmed by a tailscale0 interface is bound", async () => {
    const r = await resolveBindHost(
      deps({ tailscaleIp: async () => `${TS_IP}\n`, interfaces: tsIfaces() }),
    );
    assert.deepEqual(r, { host: TS_IP, mode: "tailnet", source: "tailscale-verified" });
  });

  test("AGREE: takes the first CLI address when several are printed, if confirmed", async () => {
    const r = await resolveBindHost(
      deps({ tailscaleIp: async () => `${TS_IP}\n${OTHER_CGNAT}\n`, interfaces: tsIfaces() }),
    );
    assert.equal(r.host, TS_IP);
  });

  test("CLI-only: refuses when no interface carries the CLI-reported address", async () => {
    await assert.rejects(
      () => resolveBindHost(deps({ tailscaleIp: async () => `${TS_IP}\n` })),
      (err: unknown) => {
        assert.ok(err instanceof BindRefusedError);
        assert.match(err.message, /no local interface/);
        return true;
      },
    );
  });

  test("iface-only: refuses a tailscale0 CGNAT address the CLI did not confirm", async () => {
    await assert.rejects(
      () => resolveBindHost(deps({ interfaces: tsIfaces() })),
      (err: unknown) => {
        assert.ok(err instanceof BindRefusedError);
        assert.match(err.message, /CLI did not confirm/);
        return true;
      },
    );
  });

  test("DISAGREE: refuses when CLI and interface report different addresses", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({ tailscaleIp: async () => `${OTHER_CGNAT}\n`, interfaces: tsIfaces(TS_IP) }),
        ),
      (err: unknown) => {
        assert.ok(err instanceof BindRefusedError);
        assert.match(err.message, /disagree/);
        return true;
      },
    );
  });

  test("loose ts* interface names are NOT trusted (strict tailscale<N> only)", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({
            tailscaleIp: async () => `${TS_IP}\n`,
            interfaces: () => ({ ts0: [{ address: TS_IP, family: "IPv4" }] }),
          }),
        ),
      BindRefusedError,
    );
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({
            tailscaleIp: async () => `${TS_IP}\n`,
            interfaces: () => ({ tsomething: [{ address: TS_IP, family: "IPv4" }] }),
          }),
        ),
      BindRefusedError,
    );
  });

  test("bare 'tailscale' (no digits) interface name is NOT trusted", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({
            tailscaleIp: async () => `${TS_IP}\n`,
            interfaces: () => ({ tailscale: [{ address: TS_IP, family: "IPv4" }] }),
          }),
        ),
      BindRefusedError,
    );
  });

  test("tailscale1 (higher index) is trusted when it confirms the CLI", async () => {
    const r = await resolveBindHost(
      deps({
        tailscaleIp: async () => `${TS_IP}\n`,
        interfaces: () => ({ tailscale1: [{ address: TS_IP, family: "IPv4" }] }),
      }),
    );
    assert.deepEqual(r, { host: TS_IP, mode: "tailnet", source: "tailscale-verified" });
  });

  test("ignores non-CGNAT addresses even on a tailscale-named interface", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({ interfaces: () => ({ tailscale0: [{ address: "192.168.1.5", family: "IPv4" }] }) }),
        ),
      BindRefusedError,
    );
  });

  test("ignores a CLI result that is not a tailnet CGNAT address", async () => {
    await assert.rejects(
      () => resolveBindHost(deps({ tailscaleIp: async () => "0.0.0.0\n", interfaces: tsIfaces() })),
      BindRefusedError,
    );
  });
});

describe("resolveBindHost — refusal and dev override", () => {
  test("REFUSES to start when no tailnet interface exists", async () => {
    await assert.rejects(() => resolveBindHost(deps()), BindRefusedError);
  });

  test("refuses even when the CLI itself throws", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({
            tailscaleIp: async () => {
              throw new Error("tailscale not installed");
            },
          }),
        ),
      BindRefusedError,
    );
  });

  test("BROKER_DEV_LOCALHOST=1 downgrades to 127.0.0.1 only", async () => {
    const r = await resolveBindHost(deps({ env: { BROKER_DEV_LOCALHOST: "1" } }));
    assert.deepEqual(r, { host: "127.0.0.1", mode: "localhost", source: "dev-override" });
  });

  test("BROKER_DEV_LOCALHOST must be exactly '1'", async () => {
    await assert.rejects(
      () => resolveBindHost(deps({ env: { BROKER_DEV_LOCALHOST: "true" } })),
      BindRefusedError,
    );
  });

  test("verified tailnet wins over the dev override when both are present", async () => {
    const r = await resolveBindHost(
      deps({
        env: { BROKER_DEV_LOCALHOST: "1" },
        tailscaleIp: async () => TS_IP,
        interfaces: tsIfaces(),
      }),
    );
    assert.equal(r.mode, "tailnet");
    assert.equal(r.host, TS_IP);
  });

  test("dev override still yields localhost when detection signals are partial", async () => {
    // Binding 127.0.0.1 is safe regardless of what spoofable signals claim,
    // and the explicit override must stay usable on machines where the
    // tailscale interface has a different name (e.g. macOS utun*).
    const r = await resolveBindHost(
      deps({ env: { BROKER_DEV_LOCALHOST: "1" }, tailscaleIp: async () => `${TS_IP}\n` }),
    );
    assert.deepEqual(r, { host: "127.0.0.1", mode: "localhost", source: "dev-override" });
  });
});

describe("resolveBindHost — BROKER_HOST pin", () => {
  test("0.0.0.0 pin is refused even with a tailnet present", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({ env: { BROKER_HOST: "0.0.0.0" }, tailscaleIp: async () => TS_IP }),
        ),
      BindRefusedError,
    );
  });

  test(":: pin is refused", async () => {
    await assert.rejects(
      () => resolveBindHost(deps({ env: { BROKER_HOST: "::" }, tailscaleIp: async () => TS_IP })),
      BindRefusedError,
    );
  });

  test("pin matching the VERIFIED tailnet address is accepted", async () => {
    const r = await resolveBindHost(
      deps({ env: { BROKER_HOST: TS_IP }, tailscaleIp: async () => TS_IP, interfaces: tsIfaces() }),
    );
    assert.deepEqual(r, { host: TS_IP, mode: "tailnet", source: "env-pin" });
  });

  test("pin matching an UNVERIFIED CLI-only address is refused", async () => {
    await assert.rejects(
      () => resolveBindHost(deps({ env: { BROKER_HOST: TS_IP }, tailscaleIp: async () => TS_IP })),
      BindRefusedError,
    );
  });

  test("pin of some other LAN address is refused", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({
            env: { BROKER_HOST: "192.168.1.20" },
            tailscaleIp: async () => TS_IP,
            interfaces: tsIfaces(),
          }),
        ),
      BindRefusedError,
    );
  });

  test("localhost pin requires the explicit dev override", async () => {
    await assert.rejects(
      () => resolveBindHost(deps({ env: { BROKER_HOST: "127.0.0.1" } })),
      BindRefusedError,
    );
    const r = await resolveBindHost(
      deps({ env: { BROKER_HOST: "127.0.0.1", BROKER_DEV_LOCALHOST: "1" } }),
    );
    assert.deepEqual(r, { host: "127.0.0.1", mode: "localhost", source: "dev-override" });
  });
});
