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
    vi.mocked(sbSelect).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([pair]).mockRejectedValueOnce(new Error());
    expect(await (await GET(await request())).json()).toEqual({ example: null });
    expect(await (await GET(await request())).json()).toEqual({ example: pair });
    expect((await GET(await request())).status).toBe(502);
  });
  it("reopens a linked posting receipt without inventing a training example", async () => {
    const receipt = { posted_reply: "My actual reply.", updated_at: "2026-11-25T00:01:00Z" };
    vi.mocked(sbSelect).mockResolvedValueOnce([]).mockResolvedValueOnce([receipt]);
    expect(await (await GET(await request())).json()).toEqual({ example: null, receipt });
  });
  it("records exact posted wording alone for a linked reply and keeps its revision", async () => {
    const posted_reply = "  My reply.\n\n  Second line.  ";
    const expected_updated_at = "2026-11-25T00:01:00Z";
    vi.mocked(sbRpc).mockResolvedValue([{ prepared_reply: null, posted_reply, updated_at: "2026-11-25T00:02:00Z" }]);
    const response = await POST(await request({ item_id: id, posted_reply, expected_updated_at }));
    expect(await response.json()).toMatchObject({ ok: true, recordedPosted: true, trainedVoice: false, example: null });
    expect(sbRpc).toHaveBeenCalledWith("kc_save_fb_posted_reply", { p_item_id: id, p_prepared_reply: null, p_posted_reply: posted_reply, p_expected_updated_at: expected_updated_at });
  });
  it("requires a genuine original for a standalone voice example", async () => {
    expect((await POST(await request({ ...pair, item_id: "manual-12cb07fa-571a-492c-b01c-414d04dbc465", prepared_reply: "   " }))).status).toBe(400);
    expect(sbRpc).not.toHaveBeenCalled();
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
    expect(sbRpc).toHaveBeenCalledWith(item_id === id ? "kc_save_fb_posted_reply" : "kc_save_fb_reply_voice_example", {
      p_item_id: item_id, p_prepared_reply: pair.prepared_reply, p_posted_reply: "Glad to help.", p_expected_updated_at: null,
    });
  });
  it("records the literal posted text and distinguishes a linked reply from a standalone example", async () => {
    vi.mocked(sbRpc).mockResolvedValue([pair]);
    const posted_reply = "First line.\n\n  Second line.";
    expect(await (await POST(await request({ ...pair, posted_reply }))).json()).toMatchObject({ recordedPosted: true });
    expect(sbRpc).toHaveBeenCalledWith("kc_save_fb_posted_reply", expect.objectContaining({ p_posted_reply: posted_reply }));
    expect(await (await POST(await request({ ...pair, item_id: "manual-12cb07fa-571a-492c-b01c-414d04dbc465" }))).json()).toMatchObject({ recordedPosted: false, trainedVoice: true });
  });
  it("saves, reloads and clears a linked correction reason using the version of the pair", async () => {
    const version = "2026-11-25T08:00:00.123456Z";
    const saved = { ...pair, correction_reason: "voice", updated_at: version };
    vi.mocked(sbSelect).mockResolvedValueOnce([saved]);
    expect(await (await GET(await request())).json()).toEqual({ example: saved });
    for (const reason of ["voice", "job_match", "job_details", "link", "other", null]) {
      vi.mocked(sbRpc).mockResolvedValueOnce([{ ...saved, correction_reason: reason }]);
      const input = { ...pair, correction_reason: reason, expected_updated_at: version };
      expect(await (await POST(await request(input))).json()).toMatchObject({
        example: { correction_reason: reason }, recordedPosted: true, trainedVoice: reason === "voice" || reason === null,
      });
      expect(sbRpc).toHaveBeenLastCalledWith("kc_save_fb_posted_reply_with_reason",
        expect.objectContaining({ p_correction_reason: reason, p_expected_updated_at: version }));
    }
    vi.mocked(sbRpc).mockResolvedValueOnce([]);
    expect((await POST(await request({ ...pair, correction_reason: "job_match", expected_updated_at: version }))).status).toBe(409);
  });
  it("uses the stored reason when a caller omits the reason on a linked save", async () => {
    vi.mocked(sbRpc).mockResolvedValueOnce([{ ...pair, correction_reason: "job_match" }]);
    expect(await (await POST(await request(pair))).json()).toMatchObject({
      example: { correction_reason: "job_match" }, recordedPosted: true, trainedVoice: false,
    });
  });
  it("rejects reasons on incomplete, unchanged or standalone examples and rejects unknown reason codes", async () => {
    for (const input of [{ ...pair, correction_reason: "surprise" }, { ...pair, correction_reason: "toString" },
      { ...pair, correction_reason: "voice", prepared_reply: null }, { ...pair, correction_reason: "other", prepared_reply: "  a\r\nb ", posted_reply: "a\nb" },
      { ...pair, correction_reason: "link", item_id: "manual-12cb07fa-571a-492c-b01c-414d04dbc465" }]) {
      expect((await POST(await request(input))).status).toBe(400);
    }
    expect(sbRpc).not.toHaveBeenCalled();
  });
  it("keeps a delivery conflict retryable and a missing source distinct from a stale edit", async () => {
    vi.mocked(sbRpc).mockRejectedValueOnce(new Error("rpc: reply_delivery_in_progress")).mockRejectedValueOnce(new Error("rpc: reply_missing"));
    const busy = await POST(await request(pair));
    expect(busy.status).toBe(409);
    expect(await busy.json()).toMatchObject({ code: "delivery_in_progress" });
    expect((await POST(await request(pair))).status).toBe(404);
  });
  it("reports an edit conflict and storage failures without claiming a save", async () => {
    vi.mocked(sbRpc).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error());
    expect((await POST(await request(pair))).status).toBe(409);
    expect((await POST(await request(pair))).status).toBe(502);
  });
});
