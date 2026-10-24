import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames } from "@/lib/session";

// Ruling tests never send a write to the live database.
vi.mock("@/lib/supabase-rest", () => ({ sbRpc: vi.fn() }));

import { POST } from "../app/api/loop/rule/route";
import { sbRpc } from "@/lib/supabase-rest";

const rpc = vi.mocked(sbRpc);

function request(body: unknown, token?: string): NextRequest {
  return rawRequest(JSON.stringify(body), token);
}

function rawRequest(body: string, token?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.cookie = `${cookieNames.session}=${token}`;
  return new NextRequest("http://localhost:3111/api/loop/rule", { method: "POST", headers, body });
}

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue(null);
});

describe("POST /api/loop/rule", () => {
  it.each([undefined, "forged.token"])("requires an owner session (%s)", async (token) => {
    const response = await POST(request({ ref: "D-0001", ruling: "A" }, token));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("submits the normalized ruling through the owner-loop RPC", async () => {
    const token = await createSessionToken();
    const response = await POST(request({ ref: "D-0001", ruling: " A ", note: " Proceed today " }, token));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("owner_loop_rule", {
      p_ref: "D-0001", p_ruling: "A", p_note: "Proceed today",
    });
  });

  it.each(["DROP", "PARK", "Use the second proposal after review"])("supports %s without an optional note", async (ruling) => {
    const token = await createSessionToken();
    const response = await POST(request({ ref: "D-10000", ruling }, token));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("owner_loop_rule", { p_ref: "D-10000", p_ruling: ruling, p_note: null });
  });

  it("rejects malformed JSON before the RPC", async () => {
    const token = await createSessionToken();
    const response = await POST(rawRequest("{", token));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid JSON" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    null, [], "A", 4,
    {}, { ref: "D-001", ruling: "A" }, { ref: " D-0001", ruling: "A" },
    { ref: "D-0001", ruling: "" }, { ref: "D-0001", ruling: "   " },
    { ref: "D-0001", ruling: 4 }, { ref: "D-0001", ruling: "A".repeat(501) },
    { ref: "D-0001", ruling: "A", note: null },
    { ref: "D-0001", ruling: "A", note: {} },
    { ref: "D-0001", ruling: "A", note: "x".repeat(2001) },
  ])("rejects an invalid payload %#", async (body) => {
    const token = await createSessionToken();
    const response = await POST(request(body, token));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a safe error without exposing database or credential details", async () => {
    rpc.mockRejectedValue(new Error("SUPABASE_SERVICE_ROLE_KEY=secret; internal database error"));
    const token = await createSessionToken();
    const response = await POST(request({ ref: "D-0001", ruling: "A" }, token));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Unable to save ruling. Try again." });
  });
});
