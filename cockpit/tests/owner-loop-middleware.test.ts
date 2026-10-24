import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames } from "@/lib/session";
import { middleware, config } from "../middleware";

function request(path: string, token?: string): NextRequest {
  return new NextRequest(`http://localhost:3111${path}`, {
    headers: token ? { cookie: `${cookieNames.session}=${token}` } : undefined,
  });
}

describe("owner-loop middleware protection", () => {
  it("matches the API and pages with the general protected-route matcher", () => {
    expect(config.matcher).toEqual(["/((?!_next/static|_next/image|favicon.ico).*)"]);
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    for (const path of ["/api/loop/rule", "/decisions", "/timeline"]) expect(matcher.test(path)).toBe(true);
  });

  it("requires a session for the new ruling endpoint", async () => {
    const response = await middleware(request("/api/loop/rule"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthenticated" });
  });

  it.each(["/decisions", "/timeline"])("redirects an unauthenticated %s request to login", async (path) => {
    const response = await middleware(request(path));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3111/login");
  });

  it.each(["/api/loop/rule", "/decisions", "/timeline"])("allows the owner's authenticated %s request", async (path) => {
    const token = await createSessionToken();
    const response = await middleware(request(path, token));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
