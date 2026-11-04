import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/supabase-rest", () => ({
  sbSelect: vi.fn(),
  supabaseConfigured: vi.fn(),
}));

import { fetchDueItems, inAlertWindow } from "../src/lib/due-items";
import { sbSelect, supabaseConfigured } from "../src/lib/supabase-rest";

const obligation = {
  entity: "Fixture business", kind: "obligation", item: "Annual filing", jurisdiction: null,
  due_on: "2026-11-06", status: "open", fee_usd: "45", alert_days_before: 0,
};

beforeEach(() => {
  vi.mocked(supabaseConfigured).mockReturnValue(true);
  vi.mocked(sbSelect).mockResolvedValue([obligation]);
});

describe("Eastern compliance urgency", () => {
  it.each([
    ["2026-11-06T04:59:00Z", 1, false],
    ["2026-11-06T05:00:00Z", 0, true],
    ["2026-11-07T04:59:00Z", 0, true],
    ["2026-11-07T05:00:00Z", -1, true],
  ])("uses the local date at %s instead of the UTC date", async (now, daysLeft, alert) => {
    const rows = await fetchDueItems(new Date(now));
    expect(rows?.[0]).toMatchObject({ dueOn: "2026-11-06", daysLeft, feeUsd: 45, status: "open" });
    expect(inAlertWindow(rows![0])).toBe(alert);
  });

  it.each([
    ["2026-11-01T04:00:00Z", 1],
    ["2026-11-02T04:59:00Z", 1],
    ["2026-11-02T05:00:00Z", 0],
  ])("uses whole calendar days across the fall clock change at %s", async (now, daysLeft) => {
    vi.mocked(sbSelect).mockResolvedValue([{ ...obligation, due_on: "2026-11-02" }]);
    const rows = await fetchDueItems(new Date(now));
    expect(rows?.[0].daysLeft).toBe(daysLeft);
  });

  it("keeps missing dates and unavailable data distinct", async () => {
    vi.mocked(sbSelect).mockResolvedValue([{ ...obligation, due_on: null }]);
    const rows = await fetchDueItems(new Date("2026-11-06T05:00:00Z"));
    expect(rows?.[0].daysLeft).toBeNull();
    expect(inAlertWindow(rows![0])).toBe(false);
    vi.mocked(sbSelect).mockRejectedValueOnce(new Error("fixture unavailable"));
    expect(await fetchDueItems()).toBeNull();
  });
});
