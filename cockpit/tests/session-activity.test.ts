import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames, hasOwnerSession, SESSION_TTL_SECONDS } from "@/lib/session";
import { POST as renew } from "../app/api/auth/activity/route";
import { POST as logout } from "../app/api/auth/logout/route";
import { middleware } from "../middleware";
import { watchSessionActivity } from "../app/components/SessionActivity";

const origin = "http://localhost:3111";
const ttl = SESSION_TTL_SECONDS * 1000;
function request(path: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set("cookie", `${cookieNames.session}=${token}`);
  return new NextRequest(origin + path, { method: init.method, headers });
}
const activity = (token?: string) => request("/api/auth/activity", token, { method: "POST", headers: { origin } });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("owner session activity", () => {
  it("extends an unexpired session beyond the initial hour, then expires after an idle hour", async () => {
    vi.useFakeTimers({ now: 1000 });
    const original = await createSessionToken();
    vi.setSystemTime(1000 + ttl - 5000);
    const res = await renew(activity(original));
    const cookie = res.cookies.get(cookieNames.session)!;
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "strict", path: "/", maxAge: SESSION_TTL_SECONDS });
    vi.setSystemTime(1000 + ttl);
    expect(await hasOwnerSession(original)).toBe(false);
    expect(await hasOwnerSession(cookie.value)).toBe(true);
    vi.setSystemTime(1000 + ttl * 2);
    expect((await renew(activity(cookie.value))).status).toBe(401);
  });
  it("does not issue credentials for an open maintenance window or an offline/expired session", async () => {
    expect((await renew(activity())).status).toBe(401);
    vi.stubEnv("COCKPIT_OPEN_UNTIL", new Date(Date.now() + ttl).toISOString());
    const temporary = await renew(activity());
    expect(temporary.status).toBe(204);
    expect(temporary.cookies.get(cookieNames.session)).toBeUndefined();
  });
  it("requires the dashboard origin for renewal and honors an explicit lock across tabs", async () => {
    const token = await createSessionToken();
    const wrongOrigin = activity(token);
    wrongOrigin.headers.set("origin", "https://other.example");
    expect((await renew(wrongOrigin)).status).toBe(403);
    expect((await logout(request("/api/auth/logout", token, { method: "POST", headers: { "sec-fetch-site": "cross-site", origin: "null" } }))).status).toBe(403);
    const locked = await logout(request("/api/auth/logout", token, { method: "POST", headers: { origin } }));
    expect(locked.cookies.get(cookieNames.locked)?.value).toBe("1");
    const late = activity(token);
    late.cookies.set(cookieNames.locked, "1");
    expect((await renew(late)).status).toBe(401);
    const edit = request("/api/replies", token); edit.cookies.set(cookieNames.locked, "1");
    expect((await middleware(edit)).status).toBe(401);
  });
  it("renews older tabs on an explicit navigation or same-origin edit, and ignores background traffic", async () => {
    const token = await createSessionToken();
    for (const req of [request("/replies", token, { headers: { "sec-fetch-mode": "navigate", "sec-fetch-user": "?1" } }),
      request("/api/replies", token, { method: "POST", headers: { origin } })]) {
      expect((await middleware(req)).cookies.get(cookieNames.session)).toBeDefined();
    }
    for (const req of [request("/api/loop/agent-status", token), request("/replies", token, { headers: { "next-router-prefetch": "1" } }),
      request("/api/loop/agent/heartbeat", token, { method: "POST", headers: { origin } }),
      request("/api/replies", token, { method: "POST", headers: { origin: "https://elsewhere.example" } })]) {
      expect((await middleware(req)).cookies.get(cookieNames.session)).toBeUndefined();
    }
  });
  it("only admits GET and HEAD on the exact public link path", async () => {
    for (const method of ["GET", "HEAD"]) expect((await middleware(request("/r/abcdef1234", undefined, { method }))).status).toBe(200);
    for (const path of ["/r/abcdef123", "/r/ABcdef1234", "/r/abcdef1234/edit"]) expect((await middleware(request(path))).status).toBe(307);
    expect((await middleware(request("/r/abcdef1234", undefined, { method: "POST" }))).status).toBe(307);
  });
  it("sends throttled foreground input, never an idle timer, and signals actual expiration", async () => {
    vi.useFakeTimers({ now: 1000 });
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    const listeners = new Map<string, (e: { isTrusted: boolean }) => void>();
    const doc = { visibilityState: "hidden", addEventListener: (n: string, f: (e: { isTrusted: boolean }) => void) => listeners.set(n, f),
      removeEventListener: (n: string) => listeners.delete(n) };
    const onExpired = vi.fn();
    const stop = watchSessionActivity(doc as unknown as Document, onExpired);
    listeners.get("keydown")!({ isTrusted: true }); doc.visibilityState = "visible";
    listeners.get("input")!({ isTrusted: false }); await vi.advanceTimersByTimeAsync(ttl);
    expect(fetcher).not.toHaveBeenCalled();
    listeners.get("input")!({ isTrusted: true }); await vi.advanceTimersByTimeAsync(1000);
    listeners.get("wheel")!({ isTrusted: true }); expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000); listeners.get("pointerdown")!({ isTrusted: true });
    await vi.advanceTimersByTimeAsync(0); expect(onExpired).toHaveBeenCalledTimes(1);
    stop(); expect(listeners.size).toBe(0);
  });
});
