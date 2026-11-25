import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { GET, POST } from "../app/api/replies/voice/instructions/route";
import { cookieNames, createSessionToken } from "../src/lib/session";
import { sbRpc, sbSelect } from "../src/lib/supabase-rest";

vi.mock("@/lib/supabase-rest", () => ({ sbRpc: vi.fn(), sbSelect: vi.fn() }));
const origin = "http://localhost:3111";
const version = "2026-11-25T10:00:00.123456Z";
async function request(body?: unknown, owner = true, from = origin) {
  const headers = new Headers({ "content-type": "application/json", origin: from });
  if (owner) headers.set("cookie", `${cookieNames.session}=${await createSessionToken()}`);
  return new NextRequest(origin + "/api/replies/voice/instructions", {
    method: body === undefined ? "GET" : "POST", headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
}
beforeEach(() => vi.resetAllMocks());

it("protects instructions from signed-out reads and writes and foreign origins", async () => {
  expect((await GET(await request(undefined, false))).status).toBe(401);
  expect((await POST(await request({}, false))).status).toBe(401);
  expect((await POST(await request({}, true, "https://other.example"))).status).toBe(403);
  expect(sbRpc).not.toHaveBeenCalled();
  expect(sbSelect).not.toHaveBeenCalled();
});

it("loads the single saved version and distinguishes a first visit from an unavailable source", async () => {
  const settings = { instructions: "Use my wording.", updated_at: version };
  vi.mocked(sbSelect).mockResolvedValueOnce([]).mockResolvedValueOnce([settings]).mockRejectedValueOnce(new Error());
  expect(await (await GET(await request())).json()).toEqual({ instructions: "", updated_at: null });
  const saved = await GET(await request());
  expect(await saved.json()).toEqual(settings);
  expect(saved.headers.get("cache-control")).toBe("no-store");
  expect((await GET(await request())).status).toBe(502);
});

it("saves exact instructions or a clear using the revision that was read", async () => {
  const instructions = "Keep it brief.\nUse contractions.";
  for (const value of [instructions, "   "]) {
    const stored = value.trim() ? value : "";
    vi.mocked(sbRpc).mockResolvedValueOnce([{ instructions: stored, updated_at: version }]);
    const req = await request({ instructions: value, expected_updated_at: version }, true, "http://127.0.0.1:3111");
    req.headers.set("host", "127.0.0.1:3111");
    expect(await (await POST(req)).json()).toEqual({ instructions: stored, updated_at: version });
    expect(sbRpc).toHaveBeenLastCalledWith("kc_save_fb_reply_voice_settings", { p_instructions: stored, p_expected_updated_at: version });
  }
});

it("validates size, content, revision and storage conflicts", async () => {
  for (const payload of [{ instructions: "missing revision" }, { instructions: "abc", expected_updated_at: "bad" },
    { instructions: "\u0000", expected_updated_at: null }, { instructions: "a".repeat(2001), expected_updated_at: null }]) {
    expect((await POST(await request(payload))).status).toBe(400);
  }
  const payload = { instructions: "a".repeat(2000), expected_updated_at: null };
  vi.mocked(sbRpc).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("private"));
  expect((await POST(await request(payload))).status).toBe(409);
  const failed = await POST(await request(payload));
  expect(failed.status).toBe(502);
  expect(await failed.text()).not.toContain("private");
});
