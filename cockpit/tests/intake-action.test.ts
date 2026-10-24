import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames } from "../src/lib/session";
import { EMAIL_ID } from "./inbox-fixtures";

vi.mock("../src/lib/supabase-rest", () => ({ sbRpc: vi.fn() }));
import { sbRpc } from "../src/lib/supabase-rest";
import { POST } from "../app/api/inbox/action/route";
import { middleware } from "../middleware";

const rpc = vi.mocked(sbRpc);
function request(body: unknown, token?: string, raw = false) {
  return new NextRequest("http://localhost:3111/api/inbox/action", { method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { cookie: `${cookieNames.session}=${token}` } : {}) },
    body: raw ? String(body) : JSON.stringify(body) });
}
beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue(null); });

describe("inbox action endpoint", () => {
  it.each([undefined, "forged.token"])("requires an owner session (%s)", async (token) => {
    expect((await POST(request({ id: EMAIL_ID, action: "done" }, token))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("passes the final edited reply to the RPC only after authentication", async () => {
    const token = await createSessionToken();
    const response = await POST(request({ id: EMAIL_ID, action: "approve_reply", reply: "Edited reply\nSecond line" }, token));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("intake_owner_action", {
      p_id: EMAIL_ID, p_action: "approve_reply", p_reply: "Edited reply\nSecond line",
    });
  });
  it.each(["done", "dismiss", "keep_in_inbox"])("supports %s without a reply", async (action) => {
    const response = await POST(request({ id: EMAIL_ID, action }, await createSessionToken()));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("intake_owner_action", { p_id: EMAIL_ID, p_action: action, p_reply: null });
  });
  it.each([{}, { id: "x", action: "done" }, { id: EMAIL_ID, action: "move_to_review" },
    { id: EMAIL_ID, action: "approve_reply", reply: "x".repeat(6001) }])("validates before calling the RPC %#", async (body) => {
    expect((await POST(request(body, await createSessionToken()))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("handles malformed JSON", async () => {
    expect((await POST(request("{", await createSessionToken(), true))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns a safe error without leaking database details", async () => {
    rpc.mockRejectedValue(new Error("private SQL details and service key"));
    const response = await POST(request({ id: EMAIL_ID, action: "done" }, await createSessionToken()));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Could not save email action. Refresh and try again." });
  });
  it("protects the inbox page and action endpoint in middleware", async () => {
    expect((await middleware(new NextRequest("http://localhost:3111/inbox"))).status).toBe(307);
    expect((await middleware(request({ id: EMAIL_ID, action: "done" }))).status).toBe(401);
  });
});
