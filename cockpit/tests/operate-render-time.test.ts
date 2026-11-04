import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperateClient } from "../app/operate/OperateClient";
import { bandOf, formatOperateTime, type OperateSnapshot } from "../src/lib/operate";

vi.stubGlobal("React", React);
afterEach(() => vi.useRealTimers());

describe("Operate server/phone time consistency", () => {
  it("renders identical Eastern clocks and calendar bands under different host time zones", () => {
    const require = createRequire(import.meta.url);
    const source = fileURLToPath(new URL("../src/lib/operate.ts", import.meta.url));
    // Separate Node processes establish genuinely different default time zones;
    // changing process.env.TZ inside a Vitest worker does not reliably do that.
    const script = `
      const fs = require("node:fs");
      const ts = require(${JSON.stringify(require.resolve("typescript"))});
      require.extensions[".ts"] = (module, filename) => module._compile(
        ts.transpileModule(fs.readFileSync(filename, "utf8"), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
        }).outputText, filename);
      const {formatOperateTime, bandOf} = require(${JSON.stringify(source)});
      console.log(JSON.stringify({
        zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        winter: formatOperateTime("2026-11-03T13:42:05Z"),
        summer: formatOperateTime("2026-07-23T18:00:00Z"),
        previousEasternDay: bandOf("2026-11-03T04:30:00Z", Date.parse("2026-11-03T06:30:00Z")),
        sameEasternDay: bandOf("2026-11-03T23:30:00Z", Date.parse("2026-11-04T02:30:00Z"))
      }));`;
    const outputs = ["UTC", "America/Los_Angeles", "Asia/Tokyo"].map((zone) => {
      const result = spawnSync(process.execPath, ["-e", script], {
        env: { ...process.env, TZ: zone }, encoding: "utf8",
      });
      expect(result.status, result.stderr).toBe(0);
      const { zone: actualZone, ...values } = JSON.parse(result.stdout);
      expect(actualZone).toBe(zone);
      return values;
    });
    for (const output of outputs) expect(output).toEqual({
      winter: "08:42:05", summer: "14:00:00",
      previousEasternDay: "earlier", sameEasternDay: "today",
    });
  });

  it("uses the snapshot cutoff even when hydration crosses the five-minute boundary", () => {
    vi.useFakeTimers();
    const snapshot: OperateSnapshot = {
      now: "2026-11-03T13:00:00Z",
      events: [{ id: "near-cutoff", ts: "2026-11-03T12:55:01Z", agent: "codex",
        category: "report", severity: "info", proj: "ops", msg: "A recent event" }],
      pending: [], agents: [], systems: [], reportsAvailable: true, ownerActivityAvailable: true,
      treasury: { burnUsd: 0, runwayMonths: null, pendingNote: null },
    };
    vi.setSystemTime(new Date(snapshot.now));
    const server = renderToStaticMarkup(React.createElement(OperateClient, { initial: snapshot }));
    vi.setSystemTime(new Date("2026-11-03T13:00:03Z"));
    const phone = renderToStaticMarkup(React.createElement(OperateClient, { initial: snapshot }));
    expect(phone).toBe(server);
    expect(phone).toContain("A recent event");
    expect(phone).not.toContain("Last hour");
  });

  it("formats Eastern midnight without 24-hour rollover and handles invalid timestamps", () => {
    expect(formatOperateTime("2026-11-03T05:00:00Z")).toBe("00:00:00");
    expect(formatOperateTime("invalid")).toBe("--:--:--");
    expect(bandOf("invalid", Date.parse("2026-11-03T06:30:00Z"))).toBe("earlier");
  });
});
