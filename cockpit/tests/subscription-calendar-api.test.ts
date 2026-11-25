import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { GET } from "../app/api/money/calendar/route";
import { cookieNames, createSessionToken } from "../src/lib/session";
import { readRepoFile } from "../src/lib/repo";

vi.mock("@/lib/repo", () => ({ readRepoFile: vi.fn() }));
const columns = "service,plan,cost_monthly_usd,charge_usd,billing_cadence,renewal_date,status,notes,payment_last4\n";

async function request() {
  return new NextRequest("https://dashboard.example/api/money/calendar", {
    headers: { cookie: `${cookieNames.session}=${await createSessionToken()}` },
  });
}

afterEach(() => { vi.resetAllMocks(); vi.useRealTimers(); });

it("keeps the payment calendar behind owner sign-in", async () => {
  const response = await GET(new NextRequest("https://dashboard.example/api/money/calendar"));
  expect(response.status).toBe(401);
  expect(readRepoFile).not.toHaveBeenCalled();
});

it("returns the owner's local day and billing details without the private notes or card digits", async () => {
  vi.useFakeTimers().setSystemTime(new Date("2027-01-01T03:30:00Z"));
  vi.mocked(readRepoFile).mockResolvedValue(columns + "Test,Annual,10,120,annually,2027-01-02,active,internal note,1234\n");
  const response = await GET(await request());
  expect(response.headers.get("cache-control")).toContain("no-store");
  const body = await response.json();
  expect(body).toMatchObject({ today: "2026-12-31", subscriptions: [{ service: "Test", chargeUsd: 120, anchor: "2027-01-02" }] });
  expect(JSON.stringify(body)).not.toMatch(/internal note|1234/);
});

it("distinguishes an empty calendar from an unavailable register", async () => {
  vi.mocked(readRepoFile).mockResolvedValueOnce(columns).mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("GitHub unavailable"));
  expect((await (await GET(await request())).json()).subscriptions).toEqual([]);
  expect((await GET(await request())).status).toBe(503);
  expect((await GET(await request())).status).toBe(503);
});
