import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({ verifySessionToken: vi.fn(), cookieNames: { session: "cockpit-session" } }));
vi.mock("@/lib/supabase-rest", () => ({ supabaseConfigured: vi.fn(() => true) }));
import { verifySessionToken } from "@/lib/session";
import { BRIDGE_HOST, BRIDGE_TOKEN_LABEL_PREFIX } from "@/lib/dashboard-bridge-status";
import {
  claimManualBatch, createManualBatch, MANUAL_BATCH_EXCLUDED_RESPONSES, pollManualBatches,
  readManualBatchDashboard, recordManualBatchResult, validateManualBatchInput, validateManualBatchResult,
} from "@/lib/dashboard-manual-batches";
import { GET, POST } from "../app/api/loop/batches/route";
import { POST as AGENT_POST } from "../app/api/loop/batches/agent/route";

const NOW = "2026-11-06T20:00:00.000Z";
const ID = "11111111-1111-4111-a111-111111111111";
const ID2 = "22222222-2222-4222-a222-222222222222";
const CLAIM = "33333333-3333-4333-a333-333333333333";
const THREAD = "44444444-4444-4444-a444-444444444444";
const token = "test-only-manual-batch-token-never-live";
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
function source(id = ID, changes: Record<string, unknown> = {}) {
  return { id, item_id: "55555555-5555-4555-a555-555555555555", option_key: "A", body: "Implement the selected change.", urgent: false, created_at: NOW,
    dispatch_state: "none", dispatch_at: null, dispatch_target: null, dispatch_note: null,
    item: { id: "55555555-5555-4555-a555-555555555555", ref: "D-0999", project: "alpha", title: "Ship the change?", body: "Original question context, kept private." as string | null, status: "ruled", ruling: "A", ruled_at: NOW,
      origin_host: BRIDGE_HOST, archived_at: null, deleted_at: null, options: [{ key: "A", label: "Implement it" }] }, ...changes };
}
function harness(rows = [source()]) {
  const objects = new Map<string, unknown>();
  const operations: { method: string; path: string; body: unknown }[] = [];
  let authorized = true;
  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input)), method = init?.method ?? "GET", body = init?.body ? JSON.parse(String(init.body)) : null;
    operations.push({ method, path: url.pathname, body });
    if (url.pathname === "/rest/v1/owner_loop_agent_tokens") return json(authorized ? [{ label: `${BRIDGE_TOKEN_LABEL_PREFIX}test` }] : []);
    if (url.pathname === "/rest/v1/owner_loop_responses") {
      const filter = url.searchParams.get("id"), ids = filter?.slice(4, -1).split(",");
      return json(rows.filter((row) => !ids || ids.includes(row.id)));
    }
    if (url.pathname === "/storage/v1/object/list/owner-loop-runtime") {
      const prefix = `${body.prefix}/`;
      return json([...objects.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ name: key.slice(prefix.length) })).slice(0, body.limit));
    }
    if (method === "DELETE") {
      for (const key of body.prefixes) {
        if (key.includes("/active/")) expect(objects.has(key.replace("/active/", "/archive/"))).toBe(true);
        objects.delete(key);
      }
      return json([]);
    }
    const path = url.pathname.replace(/^\/storage\/v1\/object\/(?:authenticated\/)?owner-loop-runtime\//, "");
    if (method === "POST") {
      expect((init?.headers as Record<string, string>)["x-upsert"]).toBe("false");
      if (objects.has(path)) return json({ statusCode: "409", error: "Duplicate" }, 400);
      objects.set(path, body); return json({});
    }
    if (!objects.has(path)) return json({ code: "NoSuchKey" }, 404);
    return json(objects.get(path));
  });
  return { rows, objects, operations, fetcher: fetcher as unknown as typeof fetch, options: { fetchImpl: fetcher as unknown as typeof fetch, now: new Date(NOW) }, revoke: () => { authorized = false; } };
}
function ownerPost(body: unknown, origin?: string) {
  return new NextRequest("http://localhost/api/loop/batches", { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
}
function agentPost(body: unknown, auth = `Bearer ${token}`) {
  return new NextRequest("http://localhost/api/loop/batches/agent", { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "TEST_SERVER_KEY");
  vi.mocked(verifySessionToken).mockReset().mockResolvedValue(false);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("explicit one-project batch validation", () => {
  it("requires one to three unique UUIDs and rejects caller-controlled host, status, or paths", () => {
    expect(validateManualBatchInput({ project: "alpha", responseIds: [ID] })).toEqual({ project: "alpha", responseIds: [ID] });
    for (const input of [{ project: "alpha", responseIds: [] }, { project: "alpha", responseIds: [ID, ID] }, { project: "alpha", responseIds: [ID, ID2, CLAIM, THREAD] },
      { project: "alpha", responseIds: ["bad"] }, { project: "alpha", responseIds: [ID], host: BRIDGE_HOST }, { project: "alpha", responseIds: [ID], cwd: "C:/private" }]) expect(validateManualBatchInput(input)).toBeNull();
  });
  it("validates terminal status and measured usage without implying successful work from usage", () => {
    expect(validateManualBatchResult({ id: ID, claimId: CLAIM, status: "completed", threadId: THREAD, usage: { input_tokens: 100, cached_input_tokens: 80, output_tokens: 10 } })).not.toBeNull();
    for (const result of [{ id: ID, claimId: CLAIM, status: "completed" }, { id: ID, claimId: CLAIM, status: "queued" },
      { id: ID, claimId: CLAIM, status: "failed", usage: { input_tokens: 1, cached_input_tokens: 2, output_tokens: 0 } }, { id: ID, claimId: CLAIM, status: "failed", note: "x".repeat(2001) }]) expect(validateManualBatchResult(result)).toBeNull();
  });
});

describe("durable manual launch ledger", () => {
  it("reading answers never creates a request or launches work; selected owner requests are idempotent", async () => {
    const h = harness();
    const view = await readManualBatchDashboard(h.options); expect(view.projects[0].answers[0].responseId).toBe(ID);
    expect(h.objects.size).toBe(0); expect(await pollManualBatches(h.options)).toEqual([]);
    const batch = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    const again = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    expect(again.id).toBe(batch.id); expect(batch.status).toBe("pending");
    expect([...h.objects.keys()].filter((key) => key.includes("/requests/"))).toHaveLength(1);
    const pending = await pollManualBatches(h.options); expect(pending).toHaveLength(1);
    expect(pending[0].answers[0]).toEqual({ responseId: ID, ref: "D-0999", title: "Ship the change?", optionKey: "A", optionLabel: "Implement it", text: "Implement the selected change.", createdAt: NOW });
    expect(JSON.stringify(pending)).not.toContain("origin_session"); expect(JSON.stringify(pending)).not.toContain("origin_cwd");
    expect(JSON.stringify(view)).not.toContain("Original question context"); expect(JSON.stringify(pending)).not.toContain("Original question context");
    expect((await readManualBatchDashboard(h.options)).projects).toEqual([]);
  });
  it("atomically accepts one claim and refuses concurrent and repeated claims even with the same claim ID", async () => {
    const h = harness(), batch = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    const attempts = await Promise.all([claimManualBatch(batch.id, CLAIM, h.options), claimManualBatch(batch.id, CLAIM, h.options)]);
    expect(attempts.filter((attempt) => attempt.claimed)).toHaveLength(1);
    expect(attempts.find((attempt) => !attempt.claimed)?.batch).toBeNull();
    expect((await claimManualBatch(batch.id, THREAD, h.options)).claimed).toBe(false);
    expect(await pollManualBatches(h.options)).toEqual([]);
    expect((await readManualBatchDashboard(h.options)).batches[0].status).toBe("claimed");
  });
  it("never reserves one answer for overlapping batches", async () => {
    const h = harness([source(), source(ID2)]), original = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    await expect(createManualBatch({ project: "alpha", responseIds: [ID, ID2] }, h.options)).rejects.toMatchObject({ status: 409 });
    const pending = await pollManualBatches(h.options); expect(pending.map((batch) => batch.id)).toEqual([original.id]);
    expect((await readManualBatchDashboard(h.options)).batches.some((batch) => batch.status === "blocked")).toBe(true);
  });
  it("revalidates latest ruling at claim time, preserving nanosecond timestamp precision", async () => {
    const h = harness(), batch = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    h.rows[0].item.ruled_at = "2026-11-06T20:00:00.000001Z";
    await expect(claimManualBatch(batch.id, CLAIM, h.options)).rejects.toMatchObject({ status: 409 });
    expect(await pollManualBatches(h.options)).toEqual([]);
    expect((await readManualBatchDashboard(h.options)).batches[0].status).toBe("blocked");
    expect([...h.objects.keys()].some((key) => key.includes("/claims/"))).toBe(false);
  });
  it("keeps the exact microsecond watermark instead of admitting an earlier answer from the same millisecond", async () => {
    const row = source(); row.created_at = row.item.ruled_at = "2026-11-06T15:05:14.747637Z";
    const h = harness([row]);
    await expect(createManualBatch({ project: "alpha", responseIds: [ID] }, h.options)).rejects.toMatchObject({ status: 409 });
    expect(h.objects.size).toBe(0);
  });
  it.each(["other-host", "excluded", "old", "inactive", "picked-up", "parked", "prior-dispatch", "mixed-project"])("rejects %s answers on the server", async (condition) => {
    const row = source();
    if (condition === "other-host") row.item.origin_host = "MAC";
    if (condition === "excluded") row.id = MANUAL_BATCH_EXCLUDED_RESPONSES[0];
    if (condition === "old") row.created_at = row.item.ruled_at = "2026-11-05T20:00:00Z";
    if (condition === "inactive") row.item.status = "done";
    if (condition === "picked-up") row.item.status = "picked_up";
    if (condition === "parked") row.item.ruling = "PARK";
    if (condition === "prior-dispatch") row.dispatch_state = "delivered";
    if (condition === "mixed-project") row.item.project = "beta";
    const h = harness([row]);
    await expect(createManualBatch({ project: "alpha", responseIds: [row.id] }, h.options)).rejects.toMatchObject({ status: 409 });
    expect(h.objects.size).toBe(0);
  });
  it("accepts launched then one explicit terminal result; archives only after durable terminal evidence", async () => {
    const h = harness(), batch = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    await expect(recordManualBatchResult({ id: batch.id, claimId: CLAIM, status: "completed", threadId: THREAD }, h.options)).rejects.toMatchObject({ status: 409 });
    await claimManualBatch(batch.id, CLAIM, h.options);
    const launch = { id: batch.id, claimId: CLAIM, status: "launched" as const, threadId: THREAD };
    expect((await recordManualBatchResult(launch, h.options)).status).toBe("launched");
    expect((await recordManualBatchResult(launch, h.options)).finishedAt).toBeNull();
    const done = { ...launch, status: "completed" as const, note: "All selected responses explicitly reported done.", usage: { input_tokens: 100, cached_input_tokens: 80, output_tokens: 20 } };
    expect((await recordManualBatchResult(done, h.options)).usage).toEqual(done.usage);
    expect((await recordManualBatchResult(done, h.options)).status).toBe("completed");
    expect(h.objects.has(`manual-batches/active/${batch.id}.json`)).toBe(false);
    expect(h.objects.has(`manual-batches/archive/${batch.id}.json`)).toBe(true);
    expect(h.objects.has(`manual-batches/responses/${ID}.json`)).toBe(true);
    expect((await readManualBatchDashboard(h.options)).batches[0].status).toBe("completed");
    await expect(recordManualBatchResult({ ...done, status: "failed" }, h.options)).rejects.toMatchObject({ status: 409 });
  });
  it("rejects oversized selected packets before creating private records", async () => {
    const rows = [ID, ID2, CLAIM].map((id) => source(id, { body: "x".repeat(4000) })), h = harness(rows);
    await expect(createManualBatch({ project: "alpha", responseIds: [ID, ID2, CLAIM] }, h.options)).rejects.toMatchObject({ status: 400 }); expect(h.objects.size).toBe(0);
  });
  it("rejects large original questions before writing any request, active pointer, or response reservation", async () => {
    const rows = [ID, ID2, CLAIM].map((id) => { const row = source(id); row.item.body = "Question background ".repeat(100); return row; }), h = harness(rows);
    await expect(createManualBatch({ project: "alpha", responseIds: [ID, ID2, CLAIM] }, h.options)).rejects.toMatchObject({ status: 400, message: "Batch too large; choose fewer answers or handle this separately." });
    expect(h.objects.size).toBe(0);
    expect(h.operations.some((operation) => operation.method === "POST" && operation.path.startsWith("/storage/v1/object/"))).toBe(false);
    const single = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    expect(single.status).toBe("pending");
  });
  it("rejects one huge question with a useful size error and preserves empty or null question bodies", async () => {
    const row = source(); row.item.body = "大".repeat(3000); const h = harness([row]);
    await expect(createManualBatch({ project: "alpha", responseIds: [ID] }, h.options)).rejects.toMatchObject({ status: 400, message: "Batch too large; choose fewer answers or handle this separately." });
    expect(h.objects.size).toBe(0);
    const empty = source(); empty.item.body = "";
    expect((await createManualBatch({ project: "alpha", responseIds: [ID] }, harness([empty]).options)).status).toBe("pending");
    const absent = { ...source(), item: { ...source().item, body: null } };
    expect((await createManualBatch({ project: "alpha", responseIds: [ID] }, harness([absent]).options)).status).toBe("pending");
  });
  it("rechecks question size before polling or claiming an already requested batch", async () => {
    const h = harness(), batch = await createManualBatch({ project: "alpha", responseIds: [ID] }, h.options);
    h.rows[0].item.body = "大".repeat(3000);
    expect(await pollManualBatches(h.options)).toEqual([]);
    await expect(claimManualBatch(batch.id, CLAIM, h.options)).rejects.toMatchObject({ status: 409 });
    expect([...h.objects.keys()].some((key) => key.includes("/claims/"))).toBe(false);
    expect((await readManualBatchDashboard(h.options)).batches[0]).toMatchObject({ status: "blocked", note: "The source questions now exceed this reserved batch's size limit. Review the batch or handle it separately." });
  });
  it("fails closed at the active queue bound and never hides additional pending work", async () => {
    const h = harness(); for (let index = 0; index < 1001; index++) h.objects.set(`manual-batches/active/${String(index).padStart(8, "0")}-1111-4111-a111-111111111111.json`, {});
    await expect(pollManualBatches(h.options)).rejects.toThrow("queue is full");
  });
});

describe("owner and scoped machine routes", () => {
  it("requires owner authentication and blocks cross-origin launches", async () => {
    const h = harness(); vi.stubGlobal("fetch", h.fetcher);
    expect((await GET(new NextRequest("http://localhost/api/loop/batches"))).status).toBe(401);
    expect((await POST(ownerPost({ project: "alpha", responseIds: [ID] }))).status).toBe(401);
    vi.mocked(verifySessionToken).mockResolvedValue(true);
    expect((await POST(ownerPost({ project: "alpha", responseIds: [ID] }, "https://other.example"))).status).toBe(403);
    expect(h.operations).toHaveLength(0);
    const response = await POST(ownerPost({ project: "alpha", responseIds: [ID] })); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("authenticates the exact host-bound token before allowing only fixed batch actions", async () => {
    const h = harness(); vi.stubGlobal("fetch", h.fetcher);
    expect((await AGENT_POST(agentPost({ action: "poll" }, "Bearer short"))).status).toBe(401);
    expect((await AGENT_POST(agentPost({ action: "poll", host: "OTHER" }))).status).toBe(400);
    expect((await AGENT_POST(agentPost({ action: "claim", id: ID, claimId: CLAIM, cwd: "C:/private" }))).status).toBe(400);
    expect(h.operations).toHaveLength(0);
    const result = await AGENT_POST(agentPost({ action: "poll" })); expect(result.status).toBe(200); expect(await result.json()).toEqual({ batches: [] });
    h.revoke(); expect((await AGENT_POST(agentPost({ action: "poll" }))).status).toBe(401);
  });
  it("sanitizes private upstream failures and oversized route bodies", async () => {
    vi.mocked(verifySessionToken).mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("TEST_SERVER_KEY private upstream details")));
    const result = await GET(new NextRequest("http://localhost/api/loop/batches")); expect(result.status).toBe(503); expect(await result.text()).not.toContain("TEST_SERVER_KEY");
    expect((await AGENT_POST(agentPost({ action: "result", note: "x".repeat(17000) }))).status).toBe(400);
  });
});
