import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortfolioObjectives } from "../app/components/PortfolioObjectives";
import { providerUsageReading, type Portfolio } from "../src/lib/portfolio";

vi.stubGlobal("React", React);
afterEach(() => vi.useRealTimers());

const now = new Date("2026-11-04T02:56:31Z");
const current = { used_percent: 78, observed_at: "2026-11-04T02:56:09.384Z", reset_at: "2026-11-04T06:35:27Z" };
const previous = { used_percent: 65, observed_at: "2026-11-03T02:50:00Z", reset_at: "2026-11-03T10:00:00Z" };

describe("provider usage scorecard", () => {
  it("uses the native observation and exact reset boundary", () => {
    expect(providerUsageReading(current, now)).toMatchObject({ state: "current", used: 78 });
    expect(providerUsageReading(previous, now)).toEqual({
      state: "previous", observedAt: Date.parse(previous.observed_at), resetAt: Date.parse(previous.reset_at),
    });
    const reset = Date.parse(current.reset_at);
    expect(providerUsageReading({ ...current, observed_at: new Date(reset - 1000).toISOString() }, new Date(reset - 1)).state).toBe("current");
    expect(providerUsageReading(current, new Date(reset)).state).toBe("previous");
  });

  it("treats aged readings within a provider window as stale", () => {
    expect(providerUsageReading({ ...current, observed_at: "2026-11-04T00:56:31Z" }, now).state).toBe("current");
    expect(providerUsageReading({ ...current, observed_at: "2026-11-04T00:56:30Z" }, now).state).toBe("stale");
  });

  it("keeps missing, invalid, future and inconsistent receipts unknown", () => {
    for (const value of [null, { ...current, used_percent: NaN }, { ...current, used_percent: 101 },
      { ...current, used_percent: "78" }, { ...current, reset_at: null }, { ...current, reset_at: "bad time" },
      { ...current, reset_at: current.observed_at }, { ...current, observed_at: "2026-11-04T03:00:00Z" }]) {
      expect(providerUsageReading(value, now)).toEqual({ state: "unknown" });
    }
  });

  it("renders current Codex and previous Claude and Fable in the shared scorecard, retaining original receipt values", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const data: Portfolio = {
      checked_at: now.toISOString(),
      objectives: [{ id: "portfolio-control", project: "strandworks-ops", title: "Shared portfolio control",
        outcome: "Current review", priority: 1, status: "active", target_at: "2026-11-04T05:00:00Z",
        review_at: "2026-11-03T22:00:00Z", accountable_owner: "Owner", updated_at: now.toISOString(),
        issue_ids: [], metric_definitions: [{ id: "codex_budget" }, { id: "claude_budget" }] }],
      metrics: [{ id: 1, objective_id: "portfolio-control", metric_id: "codex_budget", value: current,
        observed_at: current.observed_at, source: "Codex provider rate-limit event", evidence: [] },
      { id: 2, objective_id: "portfolio-control", metric_id: "claude_budget",
        value: { ...previous, additional_limits: { fable: { ...previous, used_percent: 43 } } },
        observed_at: previous.observed_at, source: "Claude native usage snapshot", evidence: [] }],
      leases: [], reports: [],
    };
    const html = renderToStaticMarkup(React.createElement(PortfolioObjectives, { data }));
    expect(html).toContain("Weekly window · 78% used");
    expect(html).toContain("provider reset Wed, Nov 4, 1:35 AM ET");
    expect(html).toContain("All models · Current usage unknown");
    expect(html).toContain("fable · Current usage unknown");
    expect(html).toContain("Previous period ended Tue, Nov 3, 5:00 AM ET");
    expect(html).toContain("View recorded provider receipt");
    expect(html).toContain("&quot;used_percent&quot;: 65");
    expect(html).toContain("&quot;used_percent&quot;: 43");
    expect(html).not.toContain("65% used");
    expect(html).not.toContain("43% used");
  });
});
