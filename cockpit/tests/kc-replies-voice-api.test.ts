import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/replies/voice/route";
import { createSessionToken, cookieNames } from "../src/lib/session";
import { sbRpc, sbSelect } from "../src/lib/supabase-rest";

vi.mock("@/lib/supabase-rest", () => ({ sbRpc: vi.fn(), sbSelect: vi.fn() }));
const id = "0123456789abcdef01234567";
const origin = "http://localhost:3111";
const pair = { item_id: id, prepared_reply: "  Happy to assist! ", posted_reply: "Glad to help." };

async function request(body?: unknown, authed = true, from = origin) {
  const headers = new Headers({ "content-type": "application/json", origin: from });
  if (authed) headers.set("cookie", `${cookieNames.session}=${await createSessionToken()}`);
  return new NextRequest(`${origin}/api/replies/voice?item_id=${id}`, {
    method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => vi.resetAllMocks());

describe("Replies voice examples", () => {
  it("restricts both fields to the owner and writes to the dashboard origin", async () => {
    expect((await GET(await request(undefined, false))).status).toBe(401);
    expect((await POST(await request(pair, false))).status).toBe(401);
    expect((await POST(await request(pair, true, "https://other.example"))).status).toBe(403);
    expect(sbRpc).not.toHaveBeenCalled();
  });
  it("loads the previous example and distinguishes a new example from a read error", async () => {
    vi.mocked(sbSelect).mockResolvedValueOnce([]).mockResolvedValueOnce([pair]).mockRejectedValueOnce(new Error());
    expect(await (await GET(await request())).json()).toEqual({ example: null });
    expect(await (await GET(await request())).json()).toEqual({ example: pair });
    expect((await GET(await request())).status).toBe(502);
  });
  it("accepts the dashboard host when Next normalizes its internal hostname", async () => {
    const req = await request(pair, true, "http://127.0.0.1:3111");
    req.headers.set("host", "127.0.0.1:3111");
    vi.mocked(sbRpc).mockResolvedValue([pair]);
    expect((await POST(req)).status).toBe(200);
  });
  it.each([{ ...pair, posted_reply: " " }, { ...pair, prepared_reply: "x".repeat(4001) }, { ...pair, item_id: "unknown" }])("validates each submission", async input => {
    expect((await POST(await request(input))).status).toBe(400);
    expect(sbRpc).not.toHaveBeenCalled();
  });
  it.each([id, "manual-12cb07fa-571a-492c-b01c-414d04dbc465"])("saves a pair to voice storage for %s", async item_id => {
    vi.mocked(sbRpc).mockResolvedValue([pair]);
    expect((await POST(await request({ ...pair, item_id }))).status).toBe(200);
    expect(sbRpc).toHaveBeenCalledWith("kc_save_fb_reply_voice_example", {
      p_item_id: item_id, p_prepared_reply: "Happy to assist!", p_posted_reply: "Glad to help.", p_expected_updated_at: null,
    });
  });
  it("reports an edit conflict and storage failures without claiming a save", async () => {
    vi.mocked(sbRpc).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error());
    expect((await POST(await request(pair))).status).toBe(409);
    expect((await POST(await request(pair))).status).toBe(502);
  });
});
