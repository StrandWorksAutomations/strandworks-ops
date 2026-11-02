import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseProjects } from "../src/lib/projects";
import type { Portfolio } from "../src/lib/portfolio";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../src/lib/repo", () => ({ readRepoFile: vi.fn(), listRepoDir: vi.fn().mockResolvedValue([]) }));
vi.mock("../src/lib/projects-load", () => ({ loadProjectInventory: vi.fn() }));
vi.mock("../src/lib/portfolio-data", () => ({ fetchPortfolio: vi.fn() }));
vi.mock("../src/lib/owner-loop-data", () => ({ fetchOwnerLoopItems: vi.fn().mockResolvedValue([]), fetchBusinessLatestEvents: vi.fn().mockResolvedValue([]) }));
vi.mock("../src/lib/due-items", () => ({ fetchDueItems: vi.fn().mockResolvedValue([]), inAlertWindow: () => false }));
vi.mock("../src/lib/intake-data", () => ({ fetchIntakeOverview: vi.fn().mockResolvedValue({ reviews: [], latest: [] }) }));
vi.mock("../src/lib/kc-jobs-review-data", () => ({ countPendingJobSubmissions: vi.fn().mockResolvedValue(0) }));
vi.mock("../src/lib/kc-replies-data", () => ({ countRepliesToReview: vi.fn().mockResolvedValue(0) }));
vi.mock("../src/lib/briefings", () => ({ listBriefings: vi.fn().mockResolvedValue([]) }));
vi.mock("../src/lib/git", () => ({ readCeilingUsd: vi.fn().mockResolvedValue(200) }));

import { readRepoFile } from "../src/lib/repo";
import { loadProjectInventory } from "../src/lib/projects-load";
import { fetchPortfolio } from "../src/lib/portfolio-data";
import Today from "../app/page";
import Projects from "../app/projects/page";

const now = new Date("2026-11-02T20:35:00Z");
const projects = parseProjects("slug,name,path,tier,tokens,activity,last_commit\nwobble-ward,Wobble Ward,wobble-ward,flagship,wobble-ward,active,2026-11-02\ntenetrix-insight,Tenetrix Insight,BadgeMedia,flagship,badgemedia,active,2026-11-02");
const oldCheck = "date,project,source,kind,status,summary\n2026-07-21,wobble-ward,legacy-session,deploy,ok,Earlier accepted web loop";
function data(): Portfolio {
  return { checked_at: now.toISOString(), objectives: [{ id: "ward", project: "wobble-ward", title: "Playable loop", outcome: "Review loop", priority: 1,
    accountable_owner: "Owner", status: "active", target_at: "2026-11-04T05:00:00Z", review_at: "2026-11-03T22:00:00Z", created_at: now.toISOString(), updated_at: now.toISOString(), issue_ids: ["STR-1073"], metric_definitions: [{ id: "blocking_defects", label: "Blocking defects" }] }],
    metrics: [{ id: 1, objective_id: "ward", metric_id: "blocking_defects", value: { status: "blocked" }, observed_at: now.toISOString(), source: "Asset preflight", evidence: [] }], leases: [],
    reports: [{ id: 1, objective_id: "ward", issue_id: "STR-1073", agent: "codex", session_id: "session", created_at: "2026-11-02T18:00:00Z",
      result: 'Local candidate <script>alert(1)</script> — no new playable acceptance', remaining: "Approved asset drives unavailable", next_action: "Inspect restored sources before Unity launch",
      validation: JSON.stringify({ delivery: { local: { status: "blocked" }, deployment: { status: "not_deployed", detail: "Candidate has not been deployed" }, owner_acceptance: { status: "pending" } } }), evidence: [] }] };
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(now);
  vi.mocked(readRepoFile).mockImplementation(async (path) => path === "registers/checks.csv" ? oldCheck : null);
  vi.mocked(loadProjectInventory).mockResolvedValue(projects);
  vi.mocked(fetchPortfolio).mockResolvedValue(data());
});
afterEach(() => { vi.useRealTimers(); });

describe("project summary source reconciliation", () => {
  it.each([["Today", Today], ["Projects", Projects]] as const)("renders dated handoffs, current blockers and independent phases on %s", async (_, page) => {
    const html = renderToStaticMarkup(await page());
    expect(html).toContain("Shared handoff");
    expect(html).toContain("Nov 2, 2026, 1:00 PM ET");
    expect(html).toContain("Approved asset drives unavailable");
    expect(html).toContain("Blocking defects");
    expect(html).toContain("Blocked (reported)");
    expect(html).toContain("Not deployed (reported)");
    expect(html).toContain("Pending owner review");
    expect(html).toContain("Register check · 2026-07-21 · legacy-session · ok · historical");
    expect(html).toContain("Repo active");
    expect(html).not.toContain('<span class="badge good">ok');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('href="/focus?project=wobble-ward#ward"');
  });
  it("counts shared handoffs once and keeps the existing tracked-project denominator", async () => {
    const html = renderToStaticMarkup(await Today());
    expect(html).toContain('1<small>/2</small>');
    expect(html).toContain("projects with recent evidence · 7 Eastern days");
    expect(html).not.toContain("projects reporting · 7d");
  });
  it("shows an unknown numerator for missing evidence instead of a false zero", async () => {
    vi.mocked(fetchPortfolio).mockResolvedValue(null);
    vi.mocked(readRepoFile).mockResolvedValue(null);
    const html = renderToStaticMarkup(await Today());
    expect(html).toContain('—<small>/2</small>');
    expect(html).toContain("partial sources");
    expect(html).toContain("Shared reports unavailable; delivery and acceptance are unknown");
    expect(html).toContain("Register checks unavailable");
  });
  it("shows a partial known numerator when only the check register is unavailable", async () => {
    vi.mocked(readRepoFile).mockResolvedValue(null);
    expect(renderToStaticMarkup(await Today())).toContain('1+<small>/2</small>');
  });
  it("shows unavailable inventory without inventing a zero denominator", async () => {
    vi.mocked(loadProjectInventory).mockResolvedValue(null);
    expect(renderToStaticMarkup(await Today())).toContain('—<small>/—</small>');
    const html = renderToStaticMarkup(await Projects());
    expect(html).toContain("Project inventory unavailable; coverage is unknown");
    expect(html).not.toContain("0 repos");
  });
});
