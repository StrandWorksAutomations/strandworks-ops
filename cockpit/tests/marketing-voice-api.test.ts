import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames } from "../src/lib/session";
vi.mock("@/lib/marketing-voice-data", () => ({ loadVoiceStore: vi.fn(), saveVoiceMutation: vi.fn() }));
import { GET, POST } from "../app/api/marketing/voice/route";
import { loadVoiceStore, saveVoiceMutation } from "../src/lib/marketing-voice-data";
import { VoiceError } from "../src/lib/marketing-voice";
import { emptyVoice, FEEDBACK } from "./marketing-voice-fixtures";
const load = vi.mocked(loadVoiceStore); const save = vi.mocked(saveVoiceMutation);
const URL = "http://localhost:3188/api/marketing/voice?brand_id=7530099";
async function request(body: unknown, options: { authed?: boolean; origin?: string | null; raw?: string; method?: string } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.authed !== false) headers.Cookie = `${cookieNames.session}=${await createSessionToken()}`;
  if (options.origin !== null) headers.Origin = options.origin ?? "http://localhost:3188";
  const method = options.method ?? "POST";
  return new NextRequest(URL, { method, headers, ...(method === "GET" ? {} : { body: options.raw ?? JSON.stringify(body) }) });
}
beforeEach(() => {
  load.mockReset(); save.mockReset(); load.mockResolvedValue(emptyVoice());
  save.mockResolvedValue({ store: { ...emptyVoice(), revision: 1 }, mode: "dry-run" });
});
describe("owner voice API", () => {
  it("requires an owner session for reads and writes", async () => {
    expect((await GET(await request(null, { method: "GET", authed: false }))).status).toBe(401);
    expect((await POST(await request(FEEDBACK, { authed: false }))).status).toBe(401);
    expect(load).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
  });
  it.each(["https://another-site.example", null])("refuses a write without this dashboard origin (%s)", async (origin) => {
    expect((await POST(await request(FEEDBACK, { origin }))).status).toBe(403);
    expect(save).not.toHaveBeenCalled();
  });
  it("returns current guidance with no cache and no automatic training claim", async () => {
    const response = await GET(await request(null, { method: "GET" }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: true, store: { revision: 0 }, prompt: expect.stringContaining("wording preferences") });
  });
  it("rejects malformed and oversized bodies before any save", async () => {
    expect((await POST(await request(null, { raw: "{broken" }))).status).toBe(400);
    expect((await POST(await request(null, { raw: "x".repeat(128 * 1024 + 1) }))).status).toBe(413);
    expect(save).not.toHaveBeenCalled();
  });
  it("returns the durable-save result with the updated revision", async () => {
    const response = await POST(await request(FEEDBACK));
    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ action: "save_feedback", expected_revision: 0, scope: "brand" }));
    expect(await response.json()).toMatchObject({ ok: true, store: { revision: 1 }, mode: "dry-run" });
  });
  it("returns revision conflicts explicitly and does not expose raw backend errors", async () => {
    save.mockRejectedValueOnce(new VoiceError("Reload the latest version.", 409, "revision_conflict"));
    const conflict = await POST(await request(FEEDBACK));
    expect(conflict.status).toBe(409); expect(await conflict.json()).toMatchObject({ code: "revision_conflict" });
    save.mockRejectedValueOnce(new Error("GITHUB_TOKEN=secret"));
    const failed = await POST(await request(FEEDBACK));
    expect(failed.status).toBe(503); expect(JSON.stringify(await failed.json())).not.toContain("secret");
  });
});
