import { describe, expect, it } from "vitest";
import { projectEvidence } from "../src/lib/project-evidence";
import type { CheckRow } from "../src/lib/checks";
import type { Objective, Portfolio, WorkReport } from "../src/lib/portfolio";
import type { ProjectDef } from "../src/lib/projects";

const NOW = new Date("2026-11-02T20:30:00Z");
function project(overrides: Partial<ProjectDef> = {}): ProjectDef {
  return { slug: "wobble-ward", path: "wobble-ward", name: "Wobble Ward", role: "Game",
    tokens: ["wobble-ward"], tier: "tier-2", remote: "", lastCommit: "2026-11-02", activity: "active",
    domains: [], surfaces: [], supabaseRef: "", vercelProject: "", linearProject: "", notes: "", ...overrides };
}
function objective(overrides: Partial<Objective> = {}): Objective {
  return { id: "ward", project: "wobble-ward", title: "Playable loop", outcome: "Reviewed game loop",
    priority: 1, status: "active", accountable_owner: "Owner", issue_ids: ["STR-1073"], metric_definitions: [],
    review_at: "2026-11-03T22:00:00Z", target_at: "2026-11-04T05:00:00Z",
    created_at: NOW.toISOString(), updated_at: NOW.toISOString(), ...overrides };
}
function report(overrides: Partial<WorkReport> = {}): WorkReport {
  return { id: 1, objective_id: "ward", issue_id: "STR-1073", agent: "codex", session_id: "session",
    result: "Review candidate prepared", validation: "Local checks passed; rendered review pending",
    remaining: "Owner review", next_action: "Review the evidence", evidence: [],
    created_at: "2026-11-02T18:00:00Z", ...overrides };
}
function portfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return { checked_at: NOW.toISOString(), objectives: [objective()], reports: [report()], metrics: [], leases: [], ...overrides };
}
function check(overrides: Partial<CheckRow> = {}): CheckRow {
  return { date: "2026-07-21", project: "wobble-ward", source: "legacy-session", kind: "deploy", status: "ok",
    summary: "Earlier web gameplay build deployed", link: "", ...overrides };
}
const notRecorded = { local: { label: "Not recorded" }, deployment: { label: "Not recorded" }, owner_acceptance: { label: "Not recorded" } };

describe("project evidence attribution and reporting", () => {
  it.each(["BadgeMedia", "/Users/owner/PROJECTS/BadgeMedia/", "TENETRIX-INSIGHT"])("joins %s through objective identity and keeps the medical company separate", (path) => {
    const p = project({ slug: "tenetrix-insight", path, tokens: ["tenetrix-insight", "badgemedia"] });
    const data = portfolio({ objectives: [objective({ id: "lesson", project: "tenetrix-insight" }),
      objective({ id: "medical", project: "contracting-startup" }), objective({ id: "umbrella", project: "strandworks-ops" })],
    reports: [report({ id: 1, objective_id: "lesson" }), report({ id: 2, objective_id: "medical" }),
      report({ id: 3, objective_id: "umbrella" }), report({ id: 4, objective_id: null }), report({ id: 5, objective_id: "missing" })] });
    expect(projectEvidence(p, [], data, NOW).report?.id).toBe(1);
    expect(projectEvidence(project({ path: "contracting-startup" }), [], data, NOW).report?.id).toBe(2);
    expect(projectEvidence(project({ path: "strandworks-ops" }), [], data, NOW).report?.id).toBe(3);
    expect(projectEvidence(project({ path: "unrelated" }), [], data, NOW).report).toBeNull();
  });

  it("falls back to the project slug only when no project path is recorded", () => {
    expect(projectEvidence(project({ path: "", slug: "wobble-ward" }), [], portfolio(), NOW).report?.id).toBe(1);
    expect(projectEvidence(project({ path: "unrelated", slug: "wobble-ward" }), [], portfolio(), NOW).report).toBeNull();
  });

  it("shows current blocked metrics beside a historical successful check without promoting either to accepted delivery", () => {
    const oldCheck = check();
    const data = portfolio({ metrics: [{ id: 1, objective_id: "ward", metric_id: "blocking_defects",
      value: { status: "blocked", blocker: "Approved asset drives unavailable" }, observed_at: NOW.toISOString(),
      source: "Asset preflight", evidence: [] }] });
    const evidence = projectEvidence(project(), [oldCheck], data, NOW);
    expect(evidence.check).toEqual(oldCheck);
    expect(evidence.checkAge).toBe("historical");
    expect(evidence.recent).toBe(true);
    expect(evidence.attention.map((item) => item.id)).toEqual(["metric-ward-blocking_defects"]);
    expect(evidence.delivery).toEqual(notRecorded);
  });

  it("maps attention through objective aliases and excludes another company's faults", () => {
    const data = portfolio({ objectives: [objective({ id: "lesson", project: "BadgeMedia" }),
      objective({ id: "medical", project: "contracting-startup" })], reports: [], metrics: [
      { id: 1, objective_id: "lesson", metric_id: "review", value: { status: "failed" }, observed_at: NOW.toISOString(), source: "Review", evidence: [] },
      { id: 2, objective_id: "medical", metric_id: "review", value: { status: "blocked" }, observed_at: NOW.toISOString(), source: "Review", evidence: [] },
    ] });
    expect(projectEvidence(project({ path: "tenetrix-insight" }), [], data, NOW).attention.map((item) => item.id))
      .toEqual(["metric-lesson-review"]);
  });

  it("selects the newest valid nonfuture report and then the numeric ID without mutating source order", () => {
    const reports = [report({ id: 100, created_at: "2026-11-01T18:00:00Z" }), report({ id: 2 }),
      report({ id: 9 }), report({ id: 999, created_at: "unavailable" }), report({ id: 1000, created_at: "2026-11-03T00:00:00Z" })];
    const evidence = projectEvidence(project(), [], portfolio({ reports }), NOW);
    expect(evidence.report?.id).toBe(9);
    expect(evidence.reportTimeInvalid).toBe(true);
    expect(reports.map((row) => row.id)).toEqual([100, 2, 9, 999, 1000]);
  });

  it("keeps unavailable report times visible without letting future or invalid reports establish recency", () => {
    const data = portfolio({ reports: [report({ created_at: "invalid" }), report({ id: 2, created_at: "2026-11-02T15:31:00-05:00" })] });
    const evidence = projectEvidence(project(), [], data, NOW);
    expect(evidence.report).toBeNull();
    expect(evidence.reportTimeInvalid).toBe(true);
    expect(evidence.recent).toBe(false);
    expect(evidence.delivery).toEqual(notRecorded);
  });

  it.each([
    ["2026-10-27T04:00:00Z", true],
    ["2026-10-27T03:59:59Z", false],
    ["2026-11-02T20:30:00Z", true],
  ])("uses the seven Eastern calendar dates across the DST change for report %s", (created_at, recent) => {
    const evidence = projectEvidence(project(), [], portfolio({ reports: [report({ created_at })] }), NOW);
    expect(evidence.recent).toBe(recent);
    expect(evidence.reportTimeInvalid).toBe(false);
  });

  it.each([
    ["2026-10-27", "recent", true], ["2026-10-26", "historical", false],
    ["2026-11-03", "future", false], ["invalid", "invalid", false],
  ] as const)("preserves legacy check %s with its separate age %s", (date, age, recent) => {
    const legacy = check({ date });
    const evidence = projectEvidence(project(), [legacy], null, NOW);
    expect(evidence.check).toEqual(legacy);
    expect(evidence.checkAge).toBe(age);
    expect(evidence.recent).toBe(recent);
    expect(evidence.attention).toEqual([]);
    expect(evidence.delivery).toEqual(notRecorded);
  });

  it("returns a project-level recency flag so multiple reports and a check count once", () => {
    const data = portfolio({ reports: [report(), report({ id: 2 }), report({ id: 3 })] });
    const projects = [project(), project({ slug: "other", path: "unrelated", tokens: ["unrelated"] })];
    const evidence = projects.map((p) => projectEvidence(p, [check({ date: "2026-11-02" })], data, NOW));
    expect(evidence.filter((item) => item.recent)).toHaveLength(1);
    expect(evidence[0].checkAge).toBe("recent");
    expect(evidence[0].report?.id).toBe(3);
  });

  it("does not count repository activity or an objective edit as a report", () => {
    const evidence = projectEvidence(project(), [], portfolio({ reports: [] }), NOW);
    expect(evidence).toMatchObject({ report: null, recent: false, checkAge: "none", reportTimeInvalid: false });
    expect(evidence.check).toBeUndefined();
  });
});

describe("explicit reported delivery phases", () => {
  it("does not infer deployment or owner acceptance from result, validation prose or legacy status", () => {
    const data = portfolio({ reports: [report({ result: "Build complete, deployed to production and accepted by owner",
      validation: "All tests passed; production verified; owner approved", remaining: "Nothing" })] });
    expect(projectEvidence(project(), [check({ status: "ok", kind: "deploy" })], data, NOW).delivery).toEqual(notRecorded);
  });

  it("reads each phase independently from validation JSON and retains its supplied detail", () => {
    const data = portfolio({ reports: [report({ validation: JSON.stringify({ delivery: {
      local: { status: "complete", detail: "Local tests passed" },
      deployment: { status: "private_review", detail: "Protected candidate only" },
      owner_acceptance: { status: "pending", detail: "Owner review not performed" },
    } }) })] });
    const { delivery } = projectEvidence(project(), [], data, NOW);
    expect(delivery.local).toEqual({ label: "Complete (reported)", detail: "Local tests passed" });
    expect(delivery.deployment.label).toMatch(/private review/i);
    expect(delivery.deployment.detail).toBe("Protected candidate only");
    expect(delivery.owner_acceptance.label).toMatch(/pending/i);
    expect(delivery.owner_acceptance.detail).toBe("Owner review not performed");
  });

  it.each([
    ["local", "in_progress", /in progress/i], ["local", "review_candidate", /review candidate/i], ["local", "blocked", /blocked/i],
    ["deployment", "not_deployed", /not deployed/i], ["deployment", "production_deployed", /production deployed/i],
    ["deployment", "production_verified", /production verified/i], ["deployment", "blocked", /blocked/i],
    ["owner_acceptance", "accepted", /accepted/i], ["owner_acceptance", "changes_requested", /changes requested/i],
  ] as const)("recognizes the explicit %s phase %s without filling other phases", (phase, status, label) => {
    const data = portfolio({ reports: [report({ validation: JSON.stringify({ delivery: { [phase]: { status } } }) })] });
    const { delivery } = projectEvidence(project(), [], data, NOW);
    expect(delivery[phase].label).toMatch(label);
    for (const other of ["local", "deployment", "owner_acceptance"] as const) {
      if (other !== phase) expect(delivery[other]).toEqual({ label: "Not recorded" });
    }
  });

  it.each(["{invalid", "{}", JSON.stringify({ local: { status: "complete" } }),
    JSON.stringify({ delivery: { local: { status: "production_verified" }, deployment: { status: "complete" }, owner_acceptance: { status: "approved" } } }),
    JSON.stringify({ delivery: { local: { status: "unknown" }, deployment: { status: "unknown" }, owner_acceptance: { status: "unknown" } } }),
  ])("leaves absent, malformed, wrong-phase and unknown statuses unrecorded (%s)", (validation) => {
    expect(projectEvidence(project(), [], portfolio({ reports: [report({ validation })] }), NOW).delivery).toEqual(notRecorded);
  });
});
