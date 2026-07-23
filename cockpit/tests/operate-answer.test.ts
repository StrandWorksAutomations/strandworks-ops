import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames } from "@/lib/session";

// Mock the data layer so the route never touches Supabase in tests.
vi.mock("@/lib/operate-data", () => ({
  submitAnswer: vi.fn().mockResolvedValue(undefined),
  getQuestionStatus: vi.fn().mockResolvedValue({ status: "pending" }),
}));

import { POST } from "../app/api/operate/answer/route";
import { submitAnswer, getQuestionStatus } from "@/lib/operate-data";

const submit = submitAnswer as unknown as ReturnType<typeof vi.fn>;
const status = getQuestionStatus as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: unknown, token?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.cookie = `${cookieNames.session}=${token}`;
  return new NextRequest("http://localhost:3111/api/operate/answer", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  submit.mockClear();
  status.mockClear();
  status.mockResolvedValue({ status: "pending" });
});

describe("POST /api/operate/answer — auth gating", () => {
  it("rejects a request with no session cookie", async () => {
    const res = await POST(makeReq({ questionId: "q1", answerValue: "ok" }));
    expect(res.status).toBe(401);
    expect(submit).not.toHaveBeenCalled();
  });

  it("rejects a forged/invalid session token", async () => {
    const res = await POST(makeReq({ questionId: "q1", answerValue: "ok" }, "not.a.valid.token"));
    expect(res.status).toBe(401);
    expect(submit).not.toHaveBeenCalled();
  });

  it("accepts a valid owner session and writes the answer", async () => {
    const token = await createSessionToken();
    const res = await POST(makeReq({ questionId: "q1", answerValue: "login" }, token));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(submit).toHaveBeenCalledWith({ questionId: "q1", answerValue: "login", freeText: undefined });
  });
});

describe("POST /api/operate/answer — validation + state", () => {
  it("rejects an invalid body even with a valid session", async () => {
    const token = await createSessionToken();
    const res = await POST(makeReq({ answerValue: "ok" }, token)); // missing questionId
    expect(res.status).toBe(400);
    expect(submit).not.toHaveBeenCalled();
  });

  it("returns 404 when the question does not exist", async () => {
    status.mockResolvedValue(null);
    const token = await createSessionToken();
    const res = await POST(makeReq({ questionId: "ghost", answerValue: "x" }, token));
    expect(res.status).toBe(404);
    expect(submit).not.toHaveBeenCalled();
  });

  it("returns 409 when the question is already answered", async () => {
    status.mockResolvedValue({ status: "answered" });
    const token = await createSessionToken();
    const res = await POST(makeReq({ questionId: "done", answerValue: "x" }, token));
    expect(res.status).toBe(409);
    expect(submit).not.toHaveBeenCalled();
  });
});
