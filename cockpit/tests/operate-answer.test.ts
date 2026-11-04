import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames } from "@/lib/session";
import { POST } from "../app/api/operate/answer/route";

function makeReq(token?: string): NextRequest {
  return new NextRequest("http://localhost:3111/api/operate/answer", {
    method: "POST",
    headers: token ? { cookie: `${cookieNames.session}=${token}` } : {},
    body: JSON.stringify({ questionId: "legacy", answerValue: "ok" }),
  });
}

describe("retired Operate answer endpoint", () => {
  it.each([undefined, "forged-token"])("rejects an unauthenticated request", async (token) => {
    expect((await POST(makeReq(token))).status).toBe(401);
  });

  it("sends an authenticated caller to Decide without parsing or writing the old answer", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const request = makeReq(await createSessionToken());
      const body = vi.spyOn(request, "json");
      const response = await POST(request);
      expect(response.status).toBe(410);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({ href: "/decisions" });
      expect(body).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
