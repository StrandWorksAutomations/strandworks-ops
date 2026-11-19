import { afterEach, describe, expect, it } from "vitest";
import { authOpenUntil, verifySessionToken } from "@/lib/session";

afterEach(() => { delete process.env.COCKPIT_OPEN_UNTIL; });

describe("owner-set open window", () => {
  it("skips the passkey while the window is in the future", async () => {
    process.env.COCKPIT_OPEN_UNTIL = new Date(Date.now() + 60_000).toISOString();
    expect(authOpenUntil()).not.toBeNull();
    expect(await verifySessionToken(undefined)).toBe(true);
  });
  it("requires a session once the window has passed or is unset", async () => {
    process.env.COCKPIT_OPEN_UNTIL = new Date(Date.now() - 60_000).toISOString();
    expect(await verifySessionToken(undefined)).toBe(false);
    delete process.env.COCKPIT_OPEN_UNTIL;
    expect(await verifySessionToken("garbage")).toBe(false);
  });
});
