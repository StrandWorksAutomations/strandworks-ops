import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loopItem, NOW } from "./inbox-fixtures";

vi.stubGlobal("React", React);
vi.mock("../src/lib/portfolio-data", () => ({ fetchPortfolio: vi.fn().mockResolvedValue(null) }));
vi.mock("../src/lib/due-items", () => ({ fetchDueItems: vi.fn().mockResolvedValue([]) }));
vi.mock("../src/lib/owner-loop-data", () => ({ fetchOwnerLoopItems: vi.fn(), fetchOwnerLoopEvents: vi.fn().mockResolvedValue([]) }));

import Timeline from "../app/timeline/page";
import { BusinessFilters } from "../app/components/BusinessFilters";
import { fetchOwnerLoopItems } from "../src/lib/owner-loop-data";

const due_at = "2026-10-28T12:00:00Z";
const medical = { business: "strandworks-medical", days: "14" };
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.mocked(fetchOwnerLoopItems).mockResolvedValue([
    loopItem({ id: "deadline", ref: "D-0100", kind: "deadline", due_at, project: "contracting-startup", title: "Insurance quote deadline" }),
    loopItem({ id: "decision", ref: "D-0101", kind: "decision", due_at, project: "contracting-startup", title: "Include insurance estimate?" }),
    loopItem({ id: "education", ref: "D-0102", kind: "milestone", due_at, project: "BadgeMedia", title: "Review educator packet" }),
  ]);
});
afterEach(() => vi.useRealTimers());

async function render(params: { business?: string; project?: string; days?: string }) {
  return renderToStaticMarkup(await Timeline({ searchParams: Promise.resolve(params) }));
}

describe("Timeline filter navigation", () => {
  it("preserves the Today deadline scope when selecting a project and offers compatible projects", async () => {
    const html = await render(medical);
    expect(html).toContain('href="/timeline?business=strandworks-medical&amp;project=contracting-startup&amp;days=14"');
    expect(html).toContain('href="/timeline?business=strandworks-medical&amp;days=14"');
    expect(html).not.toContain('project=BadgeMedia');
    expect(html).toContain("Insurance quote deadline");
    expect(html).not.toContain("Include insurance estimate?");
    expect(await render({ ...medical, project: "contracting-startup", days: undefined })).toContain("Include insurance estimate?");
  });

  it("keeps compatible scope when changing filters and widens the date range only explicitly", async () => {
    const html = await render({ ...medical, project: "contracting-startup" });
    expect(html).toContain('href="/timeline?business=strandworks-medical&amp;project=contracting-startup">Show 30 days</a>');
    expect(html).toContain('href="/timeline?project=contracting-startup&amp;days=14">All businesses</a>');
    expect(html).toContain('href="/timeline?business=tenetrix&amp;days=14">Tenetrix</a>');
    expect(html).toContain('href="/timeline?business=strandworks-medical&amp;days=14">All projects</a>');
    const empty = await render({ ...medical, project: "BadgeMedia" });
    expect(empty).toContain('href="/timeline?business=strandworks-medical&amp;days=14">Clear project filter');
  });

  it("keeps the standalone Decide business links unchanged", () => {
    const html = renderToStaticMarkup(React.createElement(BusinessFilters, { path: "/decisions", selected: "" }));
    expect(html).toContain('href="/decisions">All businesses</a>');
    expect(html).toContain('href="/decisions?business=strandworks-medical"');
  });
});
