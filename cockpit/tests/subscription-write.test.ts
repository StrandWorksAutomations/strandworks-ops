import { afterEach, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { updateSubscriptionRegister } from "../src/lib/git-write";
import { applySubscriptionEdit } from "../src/lib/money-edit";
import { parseCsv } from "../src/lib/csv";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("writes complete local revisions and preserves the register on validation failure", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subscriptions-test-"));
  vi.stubEnv("COCKPIT_WRITE_MODE", "dry-run");
  vi.stubEnv("COCKPIT_REPO_ROOT", root);
  const directory = path.join(root, "registers");
  const register = path.join(directory, "subscriptions.csv");
  try {
    await fs.mkdir(directory);
    await fs.writeFile(register, "service,plan,cost_monthly_usd,billing_cadence,renewal_date,status\n");
    const add = (name: string) => updateSubscriptionRegister(csv => applySubscriptionEdit(csv, { action: "add", service: name,
      fields: { charge_usd: "11.23", renewal_date: "2026-12-31", billing_cadence: "weekly" } }));
    await add("Cloud");
    await add("Studio");
    const saved = await fs.readFile(register, "utf8");
    expect(parseCsv(saved).rows.map(row => row.service)).toEqual(["Cloud", "Studio"]);
    await expect(add("cloud")).rejects.toThrow(/already exists/);
    expect(await fs.readFile(register, "utf8")).toBe(saved);
    expect(await fs.readdir(directory)).toEqual(["subscriptions.csv"]);
  } finally {
    await fs.rm(register, { force: true });
    await fs.rmdir(directory);
    await fs.rmdir(root);
  }
});

it("reapplies the edit to the latest register when a concurrent GitHub save wins", async () => {
  vi.stubEnv("COCKPIT_WRITE_MODE", "github");
  vi.stubEnv("COCKPIT_WRITE_BRANCH", "test");
  const initial = "service,plan,cost_monthly_usd,billing_cadence,renewal_date,status\nFirst,,,,,active\n";
  const latest = initial + "Other,,,,,active\n";
  const version = (csv: string, sha: string) => Response.json({ encoding: "base64", content: Buffer.from(csv).toString("base64"), sha });
  const request = vi.fn()
    .mockResolvedValueOnce(version(initial, "old")).mockResolvedValueOnce(new Response(null, { status: 409 }))
    .mockResolvedValueOnce(version(latest, "other-edit")).mockResolvedValueOnce(Response.json({ commit: { sha: "saved" } }));
  vi.stubGlobal("fetch", request);
  const saved = await updateSubscriptionRegister(csv => applySubscriptionEdit(csv, { action: "update", service: "First", fields: { plan: "Paid" } }));
  expect(saved.commitSha).toBe("saved");
  const [, last] = request.mock.calls[3];
  const body = JSON.parse(last.body);
  expect(body).toMatchObject({ branch: "test", sha: "other-edit" });
  expect(parseCsv(Buffer.from(body.content, "base64").toString()).rows).toEqual([
    expect.objectContaining({ service: "First", plan: "Paid" }), expect.objectContaining({ service: "Other" }),
  ]);
  expect(request.mock.calls[0][1].cache).toBe("no-store");
});
