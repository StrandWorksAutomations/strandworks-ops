import { describe, expect, it } from "vitest";
import { latestMetric, leaseState, metricValue, portfolioAttention, safeEvidence, sameProject, type Portfolio, type WorkLease } from "../src/lib/portfolio";
const now = new Date("2026-11-04T17:00:00Z");
const lease = { issue_id: "STR-1", objective_id: "one", project: "BadgeMedia", agent: "codex", session_id: "session", expires_at: now.toISOString(), released_at: null, checkpoint: "Build passed locally", next_action: "Review actual phone output" } as WorkLease;
function currentPortfolio(): Portfolio {
  return { checked_at: now.toISOString(), objectives: [{ id: "one", project: "BadgeMedia", title: "Pilot", status: "active", target_at: "2026-11-06T21:00:00Z", review_at: "2026-11-05T17:00:00Z", updated_at: now.toISOString(), created_at: now.toISOString(), priority: 1, outcome: "Reviewed pilot", accountable_owner: "Owner", issue_ids: [], metric_definitions: [] }], metrics: [], reports: [], leases: [] };
}
function observation(metric_id: string, value: unknown, overrides: Partial<Portfolio["metrics"][number]> = {}): Portfolio["metrics"][number] {
  return { id: 1, objective_id: "one", metric_id, value, observed_at: now.toISOString(), source: "Source receipt", evidence: [], ...overrides };
}
describe("shared portfolio behavior", () => {
  it("requires recovery at the expiry boundary; release stays released", () => {
    expect(leaseState(lease, now)).toBe("needs recovery");
    expect(leaseState({ ...lease, expires_at: "2026-11-04T17:00:01Z" }, now)).toBe("active");
    expect(leaseState({ ...lease, released_at: "2026-11-04T16:00:00Z" }, now)).toBe("released");
  });
  it("detects missed reviews, delivery, reports and ownership without chat activity", () => {
    const data = { checked_at: now.toISOString(), objectives: [{ id: "one", project: "BadgeMedia", title: "Pilot", status: "active", target_at: "2026-11-03T05:00:00Z", review_at: "2026-11-03T04:00:00Z", updated_at: "2026-11-02T12:00:00Z" }], metrics: [], reports: [], leases: [lease] } as unknown as Portfolio;
    expect(portfolioAttention(data, now).map((a) => a.id)).toEqual(["review-one", "target-one", "report-one", "lease-STR-1"]);
    data.objectives[0].status = "complete";
    data.leases = [];
    expect(portfolioAttention(data, now)).toEqual([]);
  });
  it("leaves paused objectives on the review calendar without pretending delivery is active", () => {
    const data = { objectives: [{ id: "one", project: "x", title: "Parked", status: "paused", review_at: "2026-11-01T00:00:00Z", target_at: "2026-11-01T00:00:00Z" }], reports: [], leases: [] } as unknown as Portfolio;
    expect(portfolioAttention(data, now).map((a) => a.id)).toEqual(["review-one"]);
  });
  it("selects observation time rather than arrival order and preserves unknowns", () => {
    const observations = [{ id: 2, objective_id: "one", metric_id: "quality", observed_at: "2026-11-01T00:00:00Z", value: 5 }, { id: 1, objective_id: "one", metric_id: "quality", observed_at: "2026-11-02T00:00:00Z", value: null }] as Portfolio["metrics"];
    expect(metricValue(latestMetric(observations, "one", "quality")?.value)).toBe("Unknown");
    expect(metricValue(0)).toBe("0");
  });
  it("uses latest derived status but keeps original source freshness", () => {
    const observations = [{ id: 1, objective_id: "one", metric_id: "scan", created_at: "2026-11-02T17:00:00Z", observed_at: "2026-11-02T17:00:00Z", value: { status: "ok", source_observed_at: "2026-11-02T13:00:00Z" } }, { id: 2, objective_id: "one", metric_id: "scan", created_at: "2026-11-02T17:01:00Z", observed_at: "2026-11-02T13:00:00Z", value: { status: "failed", source_observed_at: "2026-11-02T13:00:00Z" } }] as Portfolio["metrics"];
    expect(latestMetric(observations, "one", "scan")?.id).toBe(2);
    expect((latestMetric(observations, "one", "scan")?.value as { source_observed_at: string }).source_observed_at).toBe("2026-11-02T13:00:00Z");
  });
  it("shows failed scans and blocked gameplay even when review and delivery dates are in the future", () => {
    const data = currentPortfolio();
    data.objectives = [{ ...data.objectives[0], id: "kc", title: "Kinetic Clinician" }, { ...data.objectives[0], id: "ww", title: "Wobble Ward" }];
    data.metrics = [observation("scheduled_scan", { status: "failed", source_observed_at: "2026-11-04T16:00:00Z" }, { objective_id: "kc" }), observation("blocking_defects", { status: "blocked", blocker: "Asset drives unavailable" }, { objective_id: "ww" })];
    expect(portfolioAttention(data, now).map((item) => item.id)).toEqual(["metric-kc-scheduled_scan", "metric-ww-blocking_defects"]);
  });
  it("flags positive blocking defect counts and explicit errors without alarming on unmonitored unknowns", () => {
    const data = currentPortfolio();
    data.metrics = [observation("blocking_defects", 2), observation("collector", { status: "error" }), observation("confirmed_signups", null), observation("plan", { status: "unknown" })];
    expect(portfolioAttention(data, now).map((item) => item.id)).toEqual(["metric-one-blocking_defects", "metric-one-collector"]);
    data.metrics = [observation("blocking_defects", 0), observation("confirmed_signups", null), observation("spend", 0), observation("plan", { status: "unknown" })];
    expect(portfolioAttention(data, now)).toEqual([]);
  });
  it("ages the original source receipt and combines policy failures into one stable metric signal", () => {
    const data = currentPortfolio();
    data.objectives[0].metric_definitions = [{ id: "scan", label: "Scheduled scan", max_age_hours: 2, alert_statuses: ["failed"] }, { id: "scan", label: "Scheduled scan", max_age_hours: 2, alert_statuses: ["failed"] }];
    data.metrics = [observation("scan", { status: "ok", source_observed_at: "2026-11-04T16:30:00Z" }, { id: 8, created_at: "2026-11-04T16:30:00Z" }), observation("scan", { status: "FAILED", source_observed_at: "2026-11-04T13:00:00Z" }, { id: 9, observed_at: "2026-11-04T13:00:00Z", created_at: "2026-11-04T16:59:00Z" })];
    const signals = portfolioAttention(data, now);
    expect(signals).toHaveLength(1);
    expect(signals[0].id).toBe("metric-one-scan");
    expect(signals[0].detail).toContain("failed");
    expect(signals[0].detail).toContain("2026-11-04T13:00:00Z exceeds 2 hours");
    expect(new Set(signals.map((item) => item.id)).size).toBe(signals.length);
    data.metrics.push(observation("scan", { status: "ok", source_observed_at: "2026-11-04T16:59:00Z" }, { id: 10, created_at: now.toISOString() }));
    expect(portfolioAttention(data, now)).toEqual([]);
  });
  it("exposes absent, invalid and future source timestamps only when freshness is configured", () => {
    const data = currentPortfolio();
    data.objectives[0].metric_definitions = ["missing", "null", "invalid", "future", "boundary"].map((id) => ({ id, max_age_hours: 2 }));
    data.metrics = [observation("null", { status: "ok", source_observed_at: null }), observation("invalid", { status: "ok", source_observed_at: "not-a-time" }), observation("future", { status: "ok", source_observed_at: "2026-11-04T17:06:00Z" }), observation("boundary", { status: "ok", source_observed_at: "2026-11-04T15:00:00Z" })];
    const signals = portfolioAttention(data, now);
    expect(signals.map((item) => item.id)).toEqual(["metric-one-missing", "metric-one-null", "metric-one-invalid", "metric-one-future"]);
    expect(signals[0].detail).toContain("No source observation");
    expect(signals.slice(1).every((item) => item.detail.includes("Source time unknown"))).toBe(true);
  });
  it("honors configured status policies and skips metric alarms for paused and complete objectives", () => {
    const data = currentPortfolio();
    data.objectives[0].metric_definitions = [{ id: "freshness", alert_statuses: ["DEGRADED"] }, { id: "qualification", alert_statuses: ["unknown"] }];
    data.metrics = [observation("freshness", { status: "degraded" }), observation("qualification", null), observation("blocking_defects", 3)];
    expect(portfolioAttention(data, now)).toHaveLength(3);
    for (const status of ["paused", "complete"] as const) {
      data.objectives[0].status = status;
      expect(portfolioAttention(data, now)).toEqual([]);
    }
  });
  it("uses checkpoint activity and creation time rather than administrative edits for missing progress", () => {
    const data = currentPortfolio();
    data.objectives[0].created_at = "2026-11-01T12:00:00Z";
    data.reports = [{ objective_id: "one", created_at: "invalid" }] as Portfolio["reports"];
    expect(portfolioAttention(data, now).map((item) => item.id)).toEqual(["report-one"]);
    data.leases = [{ ...lease, renewed_at: "2026-11-04T16:45:00Z", expires_at: "2026-11-04T17:45:00Z" }];
    expect(portfolioAttention(data, now)).toEqual([]);
  });
  it("falls back safely from invalid derived publication times without changing generic backfill ordering", () => {
    const derived = [observation("scan", { source_observed_at: null }, { id: 1, observed_at: "2026-11-04T16:00:00Z", created_at: "invalid" }), observation("scan", { source_observed_at: null }, { id: 2, observed_at: "2026-11-04T15:00:00Z" })];
    expect(latestMetric(derived, "one", "scan")?.id).toBe(1);
    const facts = [observation("count", 10, { id: 1, observed_at: "2026-11-04T16:00:00Z" }), observation("count", 5, { id: 2, observed_at: "2026-11-04T15:00:00Z", created_at: now.toISOString() })];
    expect(latestMetric(facts, "one", "count")?.value).toBe(10);
  });
  it("maps project aliases without mixing the medical company and umbrella", () => {
    expect(sameProject("tenetrix-insight", "BadgeMedia")).toBe(true);
    expect(sameProject("kinetic-clinician", "highest-paying")).toBe(true);
    expect(sameProject("strandworks-medical", "strandworks-ops")).toBe(false);
  });
  it("renders only safe HTTPS evidence links", () => {
    expect(safeEvidence("javascript:alert(1)")).toBeNull();
    expect(safeEvidence("https://secret@example.com/")).toBeNull();
    expect(safeEvidence({ url: "https://example.com/review", label: "Build" })).toEqual({ url: "https://example.com/review", label: "Build" });
  });
});
