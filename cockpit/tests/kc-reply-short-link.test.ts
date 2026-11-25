import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "../app/r/[code]/route";
import { sbSelect } from "@/lib/supabase-rest";

vi.mock("@/lib/supabase-rest", () => ({ sbSelect: vi.fn() }));
const lookup = vi.mocked(sbSelect);
const follow = (code: string) => GET(new Request("https://kineticclinician.com/r/" + code), { params: Promise.resolve({ code }) });
beforeEach(() => { lookup.mockReset(); });

it("redirects readers to the exact stored listing or filtered first-party page", async () => {
  const destination = "https://kineticclinician.com/jobs/?state=TX&role=rn#search";
  lookup.mockResolvedValue([{ destination }]);
  const response = await follow("012345abcd");
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(destination);
  expect(lookup).toHaveBeenCalledWith("kc_reply_short_links", "select=destination&code=eq.012345abcd&limit=1");
});

it("keeps private routes, foreign destinations and unknown codes off the public redirect", async () => {
  expect((await follow("missing")).status).toBe(404);
  expect(lookup).not.toHaveBeenCalled();
  for (const destination of ["https://kineticclinician.com.example.org/j/vendor/job/", "https://kineticclinician.com/j/../api/posting?id=x"]) {
    lookup.mockResolvedValue([{ destination }]);
    expect((await follow("012345abcd")).status).toBe(404);
  }
  lookup.mockResolvedValue([]);
  expect((await follow("012345abcd")).status).toBe(404);
  lookup.mockRejectedValue(new Error("offline"));
  const response = await follow("012345abcd");
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
