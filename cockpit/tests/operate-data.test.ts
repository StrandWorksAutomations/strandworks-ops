import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, cookieNames } from "@/lib/session";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-rest", () => ({ sbSelect: vi.fn(), supabaseConfigured: vi.fn() }));
vi.mock("@/lib/repo", () => ({ readRepoFile: vi.fn() }));

import { GET } from "../app/api/operate/activity/route";
import { getOperateSnapshot } from "@/lib/operate-data";
import { sbSelect, supabaseConfigured } from "@/lib/supabase-rest";
import { readRepoFile } from "@/lib/repo";

const select = vi.mocked(sbSelect);
const read = vi.mocked(readRepoFile);
const url = "http://localhost:3111/api/operate/activity";

beforeEach(() => {
  select.mockReset().mockResolvedValue([]);
  read.mockReset().mockResolvedValue(null);
  vi.mocked(supabaseConfigured).mockReturnValue(true);
});

afterEach(() => vi.useRealTimers());

describe("Operate data and auth", () => {
  it("requires a session for activity and reads only the current tables after authentication", async () => {
    expect((await GET(new NextRequest(url))).status).toBe(401);
    expect(select).not.toHaveBeenCalled();
    const token = await createSessionToken();
    const response = await GET(new NextRequest(url, { headers: { cookie: `${cookieNames.session}=${token}` } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(select.mock.calls.map(([table]) => table).sort()).toEqual([
      "owner_loop_events", "owner_loop_items", "portfolio_recent_reports",
    ]);
    await expect(response.json()).resolves.toMatchObject({
      events: [], pending: [], reportsAvailable: true, ownerActivityAvailable: true,
    });
  });

  it("preserves current data if independent sources fail and distinguishes a missing register from an empty one", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T02:00:00Z"));
    select.mockImplementation(async (table) => {
      if (table === "owner_loop_items") throw new Error("private backend error");
      if (table === "portfolio_recent_reports") return [{
        id: 1, agent: "codex", result: "Reviewed", created_at: "2026-11-04T01:00:00Z",
      }];
      return [];
    });
    read.mockImplementation(async (path) => {
      if (path === "registers/services.csv") return "service,environment\n";
      throw new Error("private repository error");
    });
    await expect(getOperateSnapshot()).resolves.toMatchObject({
      events: [{ id: "report:1", msg: "Reviewed" }], pending: null,
      systems: [], treasury: null, reportsAvailable: true, ownerActivityAvailable: true,
    });
  });

  it("leaves unavailable database records unknown and avoids requests without credentials", async () => {
    vi.mocked(supabaseConfigured).mockReturnValue(false);
    await expect(getOperateSnapshot()).resolves.toMatchObject({
      events: [], pending: null, reportsAvailable: false, ownerActivityAvailable: false,
    });
    expect(select).not.toHaveBeenCalled();
  });
});
