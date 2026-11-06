import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase-rest", () => ({ sbRpc: vi.fn(), supabaseConfigured: vi.fn() }));
import { sbRpc, supabaseConfigured } from "@/lib/supabase-rest";
import { POST } from "../app/api/loop/agent/route";
import { middleware } from "../middleware";

const rpc = vi.mocked(sbRpc);
const configured = vi.mocked(supabaseConfigured);
const token = "test-only-revocable-agent-token-not-live";
const responseId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
function request(body: unknown, authorization: string | null = `Bearer ${token}`) {
  return new NextRequest("http://localhost:3111/api/loop/agent", {
    method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  rpc.mockReset().mockResolvedValue([]);
  configured.mockReset().mockReturnValue(true);
});

describe("scoped agent relay", () => {
  it.each([null, "Basic abc", "Bearer short", "Bearer one two three"])("requires a bearer token (%s)", async (authorization) => {
    const response = await POST(request({ function: "owner_loop_outbox", args: { p_mode: "linear" } }, authorization));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("passes the header token to a token-gated RPC and preserves its result", async () => {
    const rows = [{ id: responseId, body: "Keep my exact answer.\nSecond line." }];
    rpc.mockResolvedValue(rows);
    const response = await POST(request({ function: "owner_loop_outbox", args: { p_mode: "watch", p_token: "caller-cannot-substitute-this" } }));
    expect(rpc).toHaveBeenCalledWith("owner_loop_outbox", { p_mode: "watch", p_token: token });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ result: rows });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each(["owner_loop_rule", "owner_loop_respond", "owner_loop_note", "owner_loop_owner_action", "owner_loop_agent_tokens", "exec_sql", "constructor"])("refuses privileged or unknown %s", async (fn) => {
    const response = await POST(request({ function: fn, args: {} }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    { function: "owner_loop_outbox", args: { p_mode: "dispatch" } },
    { function: "owner_loop_get", args: { p_ref: "D-0001" } },
    { function: "owner_loop_inbox", args: { p_project: "portfolio" } },
    { function: "owner_loop_transition", args: { p_ref: "D-0001", p_action: "pickup", p_actor: "codex:test-session", p_note: null, p_ruling: null } },
    { function: "owner_loop_transition", args: { p_ref: "D-0001", p_action: "done", p_actor: "codex:test-session", p_note: "Connection acknowledged." } },
    { function: "owner_loop_ask", args: { p_item: { kind: "decision", project: "portfolio", title: "Connection test", options: [{ key: "A", label: "Test only" }, { key: "B", label: "Pause" }] } } },
    { function: "owner_loop_outbox_mark", args: { p_id: responseId, p_patch: { dispatch_state: "delivered", dispatch_target: "codex:test-session" } } },
  ])("allows the bounded relay contract $function", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(body.function, { ...body.args, p_token: token });
  });

  it.each([
    { function: "owner_loop_outbox", args: { p_mode: "all" } },
    { function: "owner_loop_get", args: { p_ref: "anything" } },
    { function: "owner_loop_inbox", args: { p_project: "portfolio", p_sql: "select 1" } },
    { function: "owner_loop_transition", args: { p_ref: "D-0001", p_action: "resolve", p_actor: "codex", p_ruling: "A" } },
    { function: "owner_loop_transition", args: { p_ref: "D-0001", p_action: "drop", p_actor: "codex" } },
    { function: "owner_loop_ask", args: { p_item: { kind: "decision", title: "" } } },
    { function: "owner_loop_outbox_mark", args: { p_id: responseId, p_patch: { urgent: true } } },
    { function: "owner_loop_outbox_mark", args: { p_id: responseId, p_patch: { dispatch_state: "queued" } } },
    { function: "owner_loop_outbox", args: [], table: "owner_loop_agent_tokens" },
  ])("rejects unsupported arguments for $function", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns invalid/revoked-token failures as 401 without exposing upstream details", async () => {
    rpc.mockRejectedValue(new Error(`supabase rpc owner_loop_outbox failed (400): owner_loop: invalid agent token ${token}`));
    const response = await POST(request({ function: "owner_loop_outbox", args: { p_mode: "linear" } }));
    expect(response.status).toBe(401);
    expect(await response.text()).toBe('{"error":"unauthenticated"}');
  });

  it("reports missing configuration and an unavailable upstream without a false empty result", async () => {
    configured.mockReturnValue(false);
    const unavailable = await POST(request({ function: "owner_loop_outbox", args: { p_mode: "linear" } }));
    expect(unavailable.status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
    configured.mockReturnValue(true);
    rpc.mockRejectedValue(new Error(`private database detail ${token}`));
    const failed = await POST(request({ function: "owner_loop_outbox", args: { p_mode: "linear" } }));
    expect(failed.status).toBe(502);
    expect(await failed.text()).not.toContain(token);
  });

  it("rejects malformed and oversized JSON before invoking the database", async () => {
    const malformed = new NextRequest("http://localhost:3111/api/loop/agent", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: "{" });
    expect((await POST(malformed)).status).toBe(400);
    expect((await POST(request({ function: "owner_loop_ask", args: { p_item: { kind: "alert", title: "test", body: "x".repeat(33000) } } }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("agent route middleware boundary", () => {
  it("lets only the exact relay POST reach its independent token handler", async () => {
    const response = await middleware(new NextRequest("http://localhost:3111/api/loop/agent", { method: "POST" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each([
    ["/api/loop/agent", "GET"], ["/api/loop/agent/", "POST"], ["/api/loop/agent/anything", "POST"],
    ["/api/loop/respond", "POST"], ["/api/loop/rule", "POST"], ["/api/loop/action", "POST"],
  ])("retains owner-session protection for %s %s", async (path, method) => {
    const response = await middleware(new NextRequest(`http://localhost:3111${path}`, { method }));
    expect(response.status).toBe(401);
    expect(response.headers.get("x-middleware-next")).toBeNull();
  });
});
