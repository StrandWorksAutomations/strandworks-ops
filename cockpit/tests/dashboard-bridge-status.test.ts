import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({ verifySessionToken: vi.fn(), cookieNames: { session: "cockpit-session" } }));
vi.mock("@/lib/supabase-rest", () => ({ supabaseConfigured: vi.fn() }));
import { verifySessionToken } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase-rest";
import {
  BRIDGE_HOST, BRIDGE_BUCKET, BRIDGE_OBJECT, BRIDGE_TOKEN_LABEL_PREFIX,
  authenticateBridgeHeartbeatToken, classifyBridgeStatus, readBridgeHeartbeat,
  validateBridgeHeartbeat, writeBridgeHeartbeat, type BridgeHeartbeatInput, type BridgeHeartbeatRecord,
} from "@/lib/dashboard-bridge-status";
import { POST } from "../app/api/loop/agent/heartbeat/route";
import { GET } from "../app/api/loop/agent-status/route";
import { middleware } from "../middleware";

const NOW = "2026-11-06T16:00:00.000Z";
const token = "test-only-heartbeat-token-not-a-live-credential";
const serviceKey = "TEST_ONLY_SERVER_KEY";
const configured = vi.mocked(supabaseConfigured);
const session = vi.mocked(verifySessionToken);
const payload = (): BridgeHeartbeatInput => ({
  version: 1, host: BRIDGE_HOST, checkedAt: NOW, sourceAvailable: true, desktopReady: true,
  counts: { queued: 0, ambiguous: 0, blocked: 0, started: 0, delivered: 1 },
  oldestQueuedAt: null, intervalSeconds: 15,
});
const stored = (changes: Partial<BridgeHeartbeatRecord> = {}): BridgeHeartbeatRecord => ({ ...payload(), receivedAt: NOW, ...changes });
it("manual collection is ready without a loaded desktop and waiting answers do not launch themselves", () => {
  const snapshot = stored({ deliveryMode: "manual", desktopReady: null, counts: { ...payload().counts, awaiting_launch: 2 } });
  const { receivedAt: _receivedAt, ...input } = snapshot;
  expect(validateBridgeHeartbeat(input).ok).toBe(true);
  expect(classifyBridgeStatus(snapshot, new Date(NOW))).toMatchObject({ state: "green", label: "Manual launch", pending: 2, deliveryMode: "manual" });
  expect(classifyBridgeStatus({ ...snapshot, manualLaunchError: true }, new Date(NOW))).toMatchObject({ state: "yellow", label: "Launch service needs attention" });
  expect(classifyBridgeStatus(snapshot, new Date(Date.parse(NOW) + 121000)).state).toBe("red");
  expect(validateBridgeHeartbeat({ ...input, deliveryMode: ["manual"] }).ok).toBe(false);
  expect(validateBridgeHeartbeat({ ...input, deliveryMode: "automatic" }).ok).toBe(false);
});
function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }
function post(body: unknown = payload(), authorization: string | null = `Bearer ${token}`) {
  return new NextRequest("http://localhost:3111/api/loop/agent/heartbeat", { method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) }, body: JSON.stringify(body) });
}
function get() { return new NextRequest("http://localhost:3111/api/loop/agent-status", { headers: { Cookie: "cockpit-session=test-owner-session" } }); }
function permitToken() { vi.mocked(fetch).mockResolvedValueOnce(response([{ label: `${BRIDGE_TOKEN_LABEL_PREFIX}test` }])); }

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(NOW));
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", serviceKey);
  vi.stubGlobal("fetch", vi.fn()); configured.mockReset().mockReturnValue(true); session.mockReset().mockResolvedValue(false);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("fixed scoped heartbeat payload", () => {
  it("accepts only the documented fixed shape", () => {
    expect(validateBridgeHeartbeat(payload())).toEqual({ ok: true, value: payload() });
    expect(validateBridgeHeartbeat({ ...payload(), desktopReady: null }).ok).toBe(true);
  });
  it.each([
    null, [], { ...payload(), host: "OTHER-PC" }, { ...payload(), version: 2 },
    { ...payload(), checkedAt: "yesterday" }, { ...payload(), checkedAt: "2026-11-06T16:00:00" },
    { ...payload(), sourceAvailable: "true" }, { ...payload(), desktopReady: "running" },
    { ...payload(), counts: { ...payload().counts, queued: -1 } },
    { ...payload(), counts: { ...payload().counts, queued: 0.5 } },
    { ...payload(), counts: { ...payload().counts, queued: 1_000_001 } },
    { ...payload(), counts: { ...payload().counts, privateText: "not allowed" } },
    { ...payload(), oldestQueuedAt: "tomorrow" }, { ...payload(), intervalSeconds: 0 },
    { ...payload(), projectText: "never persist a project answer here" },
    { ...payload(), receivedAt: "caller cannot set server freshness" },
  ])("rejects malformed or unapproved fields %#", (body) => { expect(validateBridgeHeartbeat(body).ok).toBe(false); });
});

describe("host-bound authentication and private persistence", () => {
  it("uses an exact active-token hash lookup and checks the dedicated host label", async () => {
    permitToken(); expect(await authenticateBridgeHeartbeatToken(token)).toBe(true);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("owner_loop_agent_tokens?select=label&token_sha256=eq.");
    expect(String(url)).toContain("revoked_at=is.null"); expect(String(url)).not.toContain(token);
    expect(options?.cache).toBe("no-store"); expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.headers).toEqual(expect.objectContaining({ Authorization: `Bearer ${serviceKey}` }));
  });
  it.each([{ rows: [] }, { rows: [{ label: "claude-mac-owner-token" }] }, { rows: [{ label: "codex-windows-OTHERHOST-test" }] }])("refuses revoked/missing and cross-host tokens %#", async ({ rows }) => {
    vi.mocked(fetch).mockResolvedValueOnce(response(rows)); expect(await authenticateBridgeHeartbeatToken(token)).toBe(false);
  });
  it("writes only the fixed private object with a server-controlled receivedAt", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}));
    const result = await writeBridgeHeartbeat(payload());
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`https://example.supabase.co/storage/v1/object/${BRIDGE_BUCKET}/${BRIDGE_OBJECT}`);
    expect(options).toEqual(expect.objectContaining({ method: "POST", cache: "no-store" }));
    expect(options?.headers).toEqual(expect.objectContaining({ "x-upsert": "true", "Content-Type": "application/json", "Cache-Control": "no-store", Authorization: `Bearer ${serviceKey}` }));
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(options?.body))).toEqual({ ...payload(), receivedAt: NOW });
    expect(result.receivedAt).toBe(NOW); expect(String(options?.body)).not.toContain(token); expect(String(options?.body)).not.toContain(serviceKey);
  });
  it("reads through the authenticated private path with cache bypass", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(stored()));
    expect(await readBridgeHeartbeat()).toEqual(stored());
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain(`/object/authenticated/${BRIDGE_BUCKET}/${BRIDGE_OBJECT}?snapshot=`);
    expect(String(url)).not.toContain("/public/"); expect(options?.cache).toBe("no-store");
    expect(options?.headers).toEqual(expect.objectContaining({ "Cache-Control": "no-cache, no-store" }));
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });
  it("distinguishes absent snapshots from failed reads", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, 404)); expect(await readBridgeHeartbeat()).toBeNull();
    vi.mocked(fetch).mockResolvedValueOnce(response({ privateError: "hidden" }, 500)); await expect(readBridgeHeartbeat()).rejects.toThrow("storage read failed");
  });
  it("recognizes only explicit legacy semantic missing-object errors transported as HTTP 400", async () => {
    for (const error of [{ statusCode: "404", error: "not_found", message: "Object not found" }, { code: "NoSuchKey", message: "The specified key does not exist." }]) {
      vi.mocked(fetch).mockResolvedValueOnce(response(error, 400)); expect(await readBridgeHeartbeat()).toBeNull();
    }
    for (const [status, error] of [[400, { statusCode: "401", error: "InvalidJWT" }], [400, { error: "InvalidRequest" }], [400, { statusCode: "404", error: "not_found", message: "Bucket not found" }], [404, { code: "NoSuchBucket" }], [500, { code: "NoSuchKey" }]] as const) {
      vi.mocked(fetch).mockResolvedValueOnce(response(error, status)); await expect(readBridgeHeartbeat()).rejects.toThrow("storage read failed");
    }
  });
  it("uses a four-second abort deadline for token lookup and storage requests", async () => {
    const deadline=vi.spyOn(AbortSignal,"timeout");
    permitToken();await authenticateBridgeHeartbeatToken(token);
    vi.mocked(fetch).mockResolvedValueOnce(response({}));await writeBridgeHeartbeat(payload());
    vi.mocked(fetch).mockResolvedValueOnce(response(stored()));await readBridgeHeartbeat();
    expect(deadline).toHaveBeenCalledTimes(3);for(const call of deadline.mock.calls)expect(call[0]).toBe(4000);
  });
});

describe("truthful red/yellow/green classification", () => {
  it("green is fresh connection readiness, not project completion", () => {
    const status = classifyBridgeStatus(stored(), new Date(NOW));
    expect(status.state).toBe("green"); expect(status.detail).toContain("completion are tracked separately");
    expect(Object.keys(status).sort()).toEqual(["checkedAt", "detail", "label", "lastSeenAt", "pending", "state"]);
  });
  it.each([[60_000, "green"], [60_001, "yellow"], [120_000, "yellow"], [120_001, "red"]] as const)("applies the freshness boundary at %i ms", (age, color) => {
    const date = new Date(Date.parse(NOW) - age).toISOString();
    expect(classifyBridgeStatus(stored({ receivedAt: date, checkedAt: date }), new Date(NOW)).state).toBe(color);
  });
  it("missing heartbeat is red with unknown pending count", () => {
    expect(classifyBridgeStatus(null, new Date(NOW))).toEqual(expect.objectContaining({ state: "red", pending: null, lastSeenAt: null }));
  });
  it.each([
    { sourceAvailable: false }, { desktopReady: false }, { desktopReady: null },
    { counts: { ...payload().counts, ambiguous: 1 } }, { counts: { ...payload().counts, blocked: 1 } },
    { counts: { ...payload().counts, started: 1 } },
  ] satisfies Partial<BridgeHeartbeatRecord>[])("a fresh known issue never turns green %#", (change) => {
    expect(classifyBridgeStatus(stored(change), new Date(NOW)).state).toBe("yellow");
  });
  it("closed Codex and unknown Codex are distinguished from an offline relay", () => {
    expect(classifyBridgeStatus(stored({ desktopReady: false }), new Date(NOW)).label).toBe("Open Codex on the PC");
    expect(classifyBridgeStatus(stored({ desktopReady: null }), new Date(NOW)).label).toBe("Checking Codex availability");
  });
  it("newly queued work can be green, overdue or undated pending work is yellow", () => {
    const queued = { ...payload().counts, queued: 1 };
    expect(classifyBridgeStatus(stored({ counts: queued, oldestQueuedAt: new Date(Date.parse(NOW) - 90_000).toISOString() }), new Date(NOW)).state).toBe("green");
    expect(classifyBridgeStatus(stored({ counts: queued, oldestQueuedAt: new Date(Date.parse(NOW) - 90_001).toISOString() }), new Date(NOW)).state).toBe("yellow");
    expect(classifyBridgeStatus(stored({ counts: queued }), new Date(NOW)).state).toBe("yellow");
  });
  it("future received/check/pending times and stale PC checks cannot create false green", () => {
    const future = new Date(Date.parse(NOW) + 300_000).toISOString();
    for (const change of [{ receivedAt: future }, { checkedAt: future }, { oldestQueuedAt: future }, { checkedAt: new Date(Date.parse(NOW) - 120_001).toISOString() }]) {
      expect(classifyBridgeStatus(stored(change), new Date(NOW)).state).toBe("yellow");
    }
  });
  it("a fresh upload of a PC health check older than sixty seconds is yellow",()=>{
    expect(classifyBridgeStatus(stored({checkedAt:new Date(Date.parse(NOW)-61_000).toISOString()}),new Date(NOW)).state).toBe("yellow");
  });
  it("pending counts queued and delivery-confirmation work, not completed transport or unrelated blocked decisions", () => {
    expect(classifyBridgeStatus(stored({ counts: { queued: 2, started: 1, ambiguous: 3, blocked: 4, delivered: 50 } }), new Date(NOW)).pending).toBe(3);
  });
});

describe("machine heartbeat and owner-only status routes", () => {
  it.each([null, "Basic abc", "Bearer short"])("rejects absent or invalid machine authentication %s", async (auth) => {
    expect((await POST(post(payload(), auth))).status).toBe(401); expect(fetch).not.toHaveBeenCalled();
  });
  it("stores a valid host-scoped snapshot and returns no private metadata", async () => {
    permitToken(); vi.mocked(fetch).mockResolvedValueOnce(response({}));
    const result = await POST(post()); expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ ok: true, receivedAt: NOW });
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
  it.each([{rows:[]}, {rows:[{ label: "other-machine" }]}])("rejects missing/revoked or cross-host credentials without a storage write %#", async ({rows}) => {
    vi.mocked(fetch).mockResolvedValueOnce(response(rows));
    expect((await POST(post())).status).toBe(401); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed JSON, oversized bodies and host substitution before upstream calls", async () => {
    const malformed = new NextRequest("http://localhost/api/loop/agent/heartbeat", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: "{" });
    expect((await POST(malformed)).status).toBe(400);
    expect((await POST(post({ ...payload(), secretText: "x".repeat(33000) }))).status).toBe(400);
    expect((await POST(post({ ...payload(), host: "ANOTHER-HOST" }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("fails closed on missing configuration or private upstream errors", async () => {
    configured.mockReturnValue(false); expect((await POST(post())).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
    configured.mockReturnValue(true); permitToken(); vi.mocked(fetch).mockResolvedValueOnce(response({ error: `${token} ${serviceKey}` }, 500));
    const result = await POST(post()); expect(result.status).toBe(503);
    expect(await result.text()).toBe('{"error":"Connection status service is unavailable."}');
  });
  it("requires an owner session for the status read", async () => {
    expect((await GET(get())).status).toBe(401); expect(fetch).not.toHaveBeenCalled();
  });
  it("returns only the fixed UI contract and disables browser caches", async () => {
    session.mockResolvedValue(true); vi.mocked(fetch).mockResolvedValueOnce(response(stored()));
    const result = await GET(get()); expect(result.status).toBe(200); expect(result.headers.get("cache-control")).toBe("no-store");
    const body = await result.json(); expect(body.state).toBe("green");
    const serialized = JSON.stringify(body); expect(serialized).not.toContain(BRIDGE_HOST); expect(serialized).not.toContain(BRIDGE_BUCKET); expect(serialized).not.toContain(serviceKey); expect(serialized).not.toContain(token);
  });
  it("returns explicit unavailable yellow on read failure, never a cached healthy result", async () => {
    session.mockResolvedValue(true); vi.mocked(fetch).mockResolvedValueOnce(response({}, 500));
    const result = await GET(get()); expect(result.status).toBe(503);
    await expect(result.json()).resolves.toEqual(expect.objectContaining({ state: "yellow", pending: null, lastSeenAt: null }));
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
  it("exempts only the exact machine POST route from the browser session middleware", async () => {
    expect((await middleware(post())).headers.get("x-middleware-next")).toBe("1");
    const heartbeatGet = new NextRequest("http://localhost/api/loop/agent/heartbeat");
    expect((await middleware(heartbeatGet)).status).toBe(401);
    const nested = new NextRequest("http://localhost/api/loop/agent/heartbeat/anything", { method: "POST" });
    expect((await middleware(nested)).status).toBe(401);
    expect((await middleware(get())).status).toBe(401);
  });
});
