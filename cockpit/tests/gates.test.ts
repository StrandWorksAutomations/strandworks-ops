// Tests for the three revision gates (review 2026-07-12, flags 1–3):
// 1. enrollment SETUP_CODE + exclusive-create (TOCTOU) save
// 2. production never runs dry-run rulings
// 3. SESSION_SECRET required in ANY production run
import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isSetupCodeValid } from "@/lib/setup-code";
import { saveCredentialLocally, type StoredCredential } from "@/lib/passkey";
import { writeMode } from "@/lib/rule-writer";
import { createSessionToken, verifySessionToken } from "@/lib/session";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("gate 1a: enrollment requires SETUP_CODE from env", () => {
  it("rejects when SETUP_CODE env is not set (enrollment disabled)", () => {
    expect(isSetupCodeValid("anything", undefined)).toBe(false);
    expect(isSetupCodeValid("", undefined)).toBe(false);
  });

  it("rejects a missing or empty provided code", () => {
    expect(isSetupCodeValid(undefined, "correct-code")).toBe(false);
    expect(isSetupCodeValid(null, "correct-code")).toBe(false);
    expect(isSetupCodeValid("", "correct-code")).toBe(false);
  });

  it("rejects a wrong code, including near-misses", () => {
    expect(isSetupCodeValid("wrong-code!!", "correct-code")).toBe(false);
    expect(isSetupCodeValid("correct-codE", "correct-code")).toBe(false);
    expect(isSetupCodeValid("correct-cod", "correct-code")).toBe(false);
    expect(isSetupCodeValid("correct-codee", "correct-code")).toBe(false);
  });

  it("accepts only the exact code", () => {
    expect(isSetupCodeValid("correct-code", "correct-code")).toBe(true);
  });

  it("reads the expected code from process.env.SETUP_CODE by default", () => {
    vi.stubEnv("SETUP_CODE", "env-code-123");
    expect(isSetupCodeValid("env-code-123")).toBe(true);
    expect(isSetupCodeValid("other")).toBe(false);
  });
});

describe("gate 1b: check-then-save TOCTOU closed by exclusive-create write", () => {
  const cred: StoredCredential = { id: "abc", publicKey: "def", counter: 0 };

  it("first save succeeds, second save to the same path fails with EEXIST", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cockpit-gate-"));
    const file = path.join(dir, "owner-passkey.json");
    try {
      await expect(saveCredentialLocally(cred, file)).resolves.toBe(file);
      await expect(saveCredentialLocally({ ...cred, id: "attacker" }, file)).rejects.toMatchObject({
        code: "EEXIST",
      });
      // the winner's credential is untouched
      const onDisk = JSON.parse(await fs.readFile(file, "utf-8"));
      expect(onDisk.id).toBe("abc");
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("concurrent saves: exactly one wins, the loser gets EEXIST", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cockpit-gate-"));
    const file = path.join(dir, "owner-passkey.json");
    try {
      const results = await Promise.allSettled([
        saveCredentialLocally({ ...cred, id: "one" }, file),
        saveCredentialLocally({ ...cred, id: "two" }, file),
      ]);
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason.code).toBe("EEXIST");
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe("gate 2: production never runs dry-run rulings", () => {
  it("throws in production with no GITHUB_TOKEN", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("COCKPIT_WRITE_MODE", "");
    expect(() => writeMode()).toThrow(/production requires GITHUB_TOKEN/);
  });

  it("throws in production even when dry-run is explicitly forced", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GITHUB_TOKEN", "ghp_test_token");
    vi.stubEnv("COCKPIT_WRITE_MODE", "dry-run");
    expect(() => writeMode()).toThrow(/dry-run is not allowed in production/);
  });

  it("returns github in production when the token is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GITHUB_TOKEN", "ghp_test_token");
    vi.stubEnv("COCKPIT_WRITE_MODE", "");
    expect(writeMode()).toBe("github");
  });

  it("still allows dry-run outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("COCKPIT_WRITE_MODE", "");
    expect(writeMode()).toBe("dry-run");
  });
});

describe("gate 3: SESSION_SECRET required in ANY production run", () => {
  it("hard-fails in production without SESSION_SECRET, Vercel or not", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("VERCEL", "");
    await expect(createSessionToken()).rejects.toThrow(/SESSION_SECRET/);
  });

  it("hard-fails in production when the secret is too short", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "short");
    await expect(createSessionToken()).rejects.toThrow(/SESSION_SECRET/);
  });

  it("works in production with a real secret (token round-trips)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "a-proper-secret-at-least-16-chars");
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("keeps the dev fallback outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SESSION_SECRET", "");
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });
});
