import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "../app/api/money/update/route";
import { cookieNames, createSessionToken } from "../src/lib/session";
import { updateSubscriptionRegister } from "../src/lib/git-write";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/git-write", async (original) => ({ ...await original<typeof import("../src/lib/git-write")>(), updateSubscriptionRegister: vi.fn() }));

const edit = { action: "add", service: "Fixture", fields: { charge_usd: "13.57", billing_cadence: "weekly", renewal_date: "2027-03-11" } };
async function request(headers: Record<string, string> = {}, signedIn = true, payload = JSON.stringify(edit)) {
  return new NextRequest("https://internal.local/api/money/update", { method: "POST", headers: {
    host: "dashboard.example", origin: "https://dashboard.example", "content-type": "application/json; charset=utf-8",
    ...(signedIn ? { cookie: `${cookieNames.session}=${await createSessionToken()}` } : {}), ...headers,
  }, body: payload });
}

beforeEach(() => vi.resetAllMocks());
it("requires an owner session, matching public host and JSON", async () => {
  expect((await POST(await request({}, false))).status).toBe(401);
  expect((await POST(await request({ origin: "https://elsewhere.example" }))).status).toBe(403);
  expect((await POST(await request({ "content-type": "text/plain" }))).status).toBe(415);
  expect((await POST(await request({}, true, "null"))).status).toBe(400);
  expect(updateSubscriptionRegister).not.toHaveBeenCalled();
});
it("refreshes the calendar source and Money view after a confirmed write", async () => {
  vi.mocked(updateSubscriptionRegister).mockResolvedValue({ mode: "github", path: "registers/subscriptions.csv", summary: "add Fixture", commitSha: "commit" });
  const response = await POST(await request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, commitSha: "commit" });
  expect(revalidatePath).toHaveBeenCalledWith("/money");
  expect(revalidateTag).toHaveBeenCalledWith("registers/subscriptions.csv");
});
