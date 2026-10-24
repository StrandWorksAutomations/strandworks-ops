import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { email, NOW } from "./inbox-fixtures";
import { BUSINESSES } from "../src/lib/businesses";

vi.mock("server-only", () => ({}));
vi.mock("../src/lib/supabase-rest", () => ({ sbSelect: vi.fn(), supabaseConfigured: vi.fn() }));
import { sbSelect, supabaseConfigured } from "../src/lib/supabase-rest";
import { fetchIntake, fetchIntakeOverview } from "../src/lib/intake-data";
import { fetchBusinessLatestEvents } from "../src/lib/owner-loop-data";

const select = vi.mocked(sbSelect);
const configured = vi.mocked(supabaseConfigured);
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NOW);
  configured.mockReset(); configured.mockReturnValue(true);
  select.mockReset(); select.mockResolvedValue([]);
});
afterEach(() => { vi.useRealTimers(); });

describe("intake data sources", () => {
  it("distinguishes unavailable from empty, without exposing errors", async () => {
    configured.mockReturnValue(false);
    expect(await fetchIntake()).toBeNull();
    expect(await fetchIntakeOverview()).toBeNull();
    expect(await fetchBusinessLatestEvents()).toBeNull();
    expect(select).not.toHaveBeenCalled();
    configured.mockReturnValue(true);
    expect(await fetchIntake()).toEqual({ items: [], linkCounts: {} });
    select.mockRejectedValue(new Error("credential detail"));
    expect(await fetchIntake()).toBeNull();
    expect(await fetchIntakeOverview()).toBeNull();
    expect(await fetchBusinessLatestEvents()).toBeNull();
  });
  it("loads all review pages and seven days of scanned mail, including pending replies", async () => {
    const first = Array.from({ length: 200 }, (_, index) => email({ id: String(index) }));
    const last = email({ id: "last" });
    select.mockResolvedValueOnce(first).mockResolvedValueOnce([last]);
    expect((await fetchIntake())?.items).toHaveLength(201);
    const query = new URLSearchParams(select.mock.calls[0][1]);
    expect(query.get("or")).toBe("(status.eq.review,reply_status.in.(approved,failed),received_at.gte.2026-10-17T12:00:00.000Z)");
    expect(query.get("select")).not.toContain("*");
    expect(new URLSearchParams(select.mock.calls[1][1]).get("offset")).toBe("200");
  });
  it("counts extracted job links across multiple pages", async () => {
    const job = email({ category: "job_alert" });
    select.mockResolvedValueOnce([job])
      .mockResolvedValueOnce(Array.from({ length: 200 }, (_, index) => ({ item_id: job.id, url: `https://example.com/${index}` })))
      .mockResolvedValueOnce([{ item_id: job.id, url: "https://example.com/last" }]);
    expect((await fetchIntake())?.linkCounts[job.id]).toBe(201);
    expect(select.mock.calls[1][0]).toBe("intake_job_links");
  });
  it("does not return partial results when a later page fails", async () => {
    select.mockResolvedValueOnce(Array.from({ length: 200 }, () => email())).mockRejectedValueOnce(new Error("later page"));
    expect(await fetchIntake()).toBeNull();
  });
  it("reads review metadata without bodies and latest email per business without a time cutoff", async () => {
    await fetchIntakeOverview();
    const query = new URLSearchParams(select.mock.calls[0][1]);
    expect(query.get("status")).toBe("eq.review");
    expect(query.get("select")).not.toMatch(/body_text|draft_reply|\*/);
    expect(select.mock.calls).toHaveLength(1 + BUSINESSES.length);
    for (const [, rawQuery] of select.mock.calls.slice(1)) {
      const latest = new URLSearchParams(rawQuery);
      expect(latest.get("limit")).toBe("1");
      expect(latest.get("received_at")).toBeNull();
    }
  });
  it("reads the latest event for each business across its projects without the history cutoff", async () => {
    await fetchBusinessLatestEvents();
    expect(select.mock.calls).toHaveLength(8);
    const query = new URLSearchParams(select.mock.calls[0][1]);
    expect(query.get("item.project")).toBe("in.(highest-paying,kinetic-clinician)");
    expect(query.get("select")).toContain("!inner(ref,title,project)");
    expect(query.get("at")).toBeNull();
    expect(query.get("limit")).toBe("1");
  });
});
