import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  resolveBindHost,
  assertNeverPublic,
  BindRefusedError,
  type BindDeps,
} from "../src/bind.ts";

const TS_IP = "100.75.203.127";

function deps(overrides: Partial<BindDeps> = {}): BindDeps {
  return {
    env: {},
    tailscaleIp: async () => null,
    interfaces: () => ({}),
    ...overrides,
  };
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

describe("resolveBindHost — tailnet detection", () => {
  test("uses `tailscale ip -4` output when available", async () => {
    const r = await resolveBindHost(deps({ tailscaleIp: async () => `${TS_IP}\n` }));
    assert.deepEqual(r, { host: TS_IP, mode: "tailnet", source: "tailscale-cli" });
  });

  test("takes the first address when the CLI prints several", async () => {
    const r = await resolveBindHost(deps({ tailscaleIp: async () => `${TS_IP}\n100.99.1.2\n` }));
    assert.equal(r.host, TS_IP);
  });

  test("falls back to a tailscale0 interface address when the CLI is missing", async () => {
    const r = await resolveBindHost(
      deps({
        interfaces: () => ({
          lo: [{ address: "127.0.0.1", family: "IPv4" }],
          eth0: [{ address: "192.168.1.20", family: "IPv4" }],
          tailscale0: [
            { address: "fd7a:115c::1", family: "IPv6" },
            { address: TS_IP, family: "IPv4" },
          ],
        }),
      }),
    );
    assert.deepEqual(r, { host: TS_IP, mode: "tailnet", source: "tailscale-iface" });
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
      () => resolveBindHost(deps({ tailscaleIp: async () => "0.0.0.0\n" })),
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

  test("tailnet wins over the dev override when both are present", async () => {
    const r = await resolveBindHost(
      deps({ env: { BROKER_DEV_LOCALHOST: "1" }, tailscaleIp: async () => TS_IP }),
    );
    assert.equal(r.mode, "tailnet");
    assert.equal(r.host, TS_IP);
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

  test("pin matching the detected tailnet address is accepted", async () => {
    const r = await resolveBindHost(
      deps({ env: { BROKER_HOST: TS_IP }, tailscaleIp: async () => TS_IP }),
    );
    assert.deepEqual(r, { host: TS_IP, mode: "tailnet", source: "env-pin" });
  });

  test("pin of some other LAN address is refused", async () => {
    await assert.rejects(
      () =>
        resolveBindHost(
          deps({ env: { BROKER_HOST: "192.168.1.20" }, tailscaleIp: async () => TS_IP }),
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
