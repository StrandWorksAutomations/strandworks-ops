import { describe, expect, it } from "vitest";
import { latestMetric, leaseState, metricValue, portfolioAttention, safeEvidence, sameProject, type Portfolio, type WorkLease } from "../src/lib/portfolio";
const now = new Date("2026-11-04T17:00:00Z");
const lease = { issue_id: "STR-1", objective_id: "one", project: "BadgeMedia", agent: "codex", session_id: "session", expires_at: now.toISOString(), released_at: null, checkpoint: "Build passed locally", next_action: "Review actual phone output" } as WorkLease;
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
