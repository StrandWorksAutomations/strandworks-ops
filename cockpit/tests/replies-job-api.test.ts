import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { GET } from "../app/api/replies/job/route";
import { cookieNames, createSessionToken } from "../src/lib/session";

const link = "https://kineticclinician.com/j/ats/travel/006";
async function request(url = link, signedIn = true) {
  return new NextRequest("https://dashboard.example/api/replies/job?" + new URLSearchParams({ url }), {
    headers: signedIn ? { cookie: cookieNames.session + "=" + await createSessionToken() } : {},
  });
}
afterEach(() => vi.unstubAllGlobals());

it("checks the owner session and exact first-party job route before any lookup", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await GET(await request(link, false))).status).toBe(401);
  expect((await GET(await request("https://other.example/j/ats/travel/006"))).status).toBe(400);
  expect(fetcher).not.toHaveBeenCalled();
});
it("reads public website facts for that exact source ID and preserves its pay qualifiers", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ job: { source_id: "ats:travel:006", employer: "Travel", title: "Travel RN", location: "Duluth, MN",
    assignment_details: [{ label: "Contract length", value: "13 weeks" }], salary: { min: 1200, max: 1400, period: "week", basis: "gross_package", estimated: true }, source_url: "https://employer.test/apply/006" } }));
  vi.stubGlobal("fetch", fetcher);
  const response = await GET(await request());
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(await response.json()).toMatchObject({ state: "current", job: { employer: "Travel", location: "Duluth, MN", pay: "$1,200–$1,400/week gross package (estimated)", details: [{ label: "Contract length", value: "13 weeks" }] } });
  expect(fetcher).toHaveBeenCalledWith("https://kineticclinician.com/api/job?source_id=ats%3Atravel%3A006", expect.objectContaining({ redirect: "error" }));
});
it("distinguishes a closed listing from an outage or a mismatched source ID", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 })).mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(Response.json({ job: { source_id: "wrong", title: "Unrelated" } })));
  expect((await (await GET(await request())).json()).state).toBe("closed");
  expect((await GET(await request())).status).toBe(503);
  expect((await GET(await request())).status).toBe(503);
});
