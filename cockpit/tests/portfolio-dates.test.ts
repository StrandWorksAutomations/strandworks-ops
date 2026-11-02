import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { portfolioDates, type Objective } from "../src/lib/portfolio";
import { buildBusinessBoard } from "../src/lib/businesses";
import { BusinessBoard } from "../app/components/BusinessBoard";
import { loopItem, NOW } from "./inbox-fixtures";

vi.stubGlobal("React", React);
const empty = { emails: [], latestEmail: [], items: [], events: [], dueItems: [], projects: [] };
const available = { intake: true, loop: true, events: true, dates: true, portfolio: true, projects: true };
function objective(overrides: Partial<Objective> = {}): Objective {
  return { id: "ward", project: "wobble-ward", title: "Playable loop", outcome: "Reviewed complete loop",
    status: "active", priority: 1, accountable_owner: "Owner", target_at: "2026-10-26T12:00:00Z",
    review_at: "2026-10-25T12:00:00Z", issue_ids: ["STR-1073"], metric_definitions: [],
    created_at: NOW.toISOString(), updated_at: NOW.toISOString(), ...overrides };
}
function cards(objectives: Objective[]) { return buildBusinessBoard({ ...empty, objectives }, NOW); }

describe("shared portfolio dates on Today and Timeline", () => {
  it("keeps active review/delivery, paused review and no completed dates", () => {
    const dates = portfolioDates([objective(), objective({ id: "paused", status: "paused" }),
      objective({ id: "done", status: "complete" })], NOW);
    expect(dates.map((entry) => entry.id)).toEqual(["portfolio-ward-review", "portfolio-ward-delivery", "portfolio-paused-review"]);
    expect(dates[0].href).toBe("/focus?project=wobble-ward#ward");
  });
  it("deduplicates source identities while preserving distinct commitments at one instant", () => {
    const same = objective({ target_at: "2026-10-25T12:00:00Z" });
    const ward = cards([same, same, { ...same, id: "second" }]).find((card) => card.business.key === "wobble-ward")!;
    expect(ward.dates).toHaveLength(4);
    expect(new Set(ward.dates.map((entry) => entry.id)).size).toBe(4);
    const company = buildBusinessBoard({ ...empty,
      items: [loopItem({ kind: "milestone", due_at: same.review_at })],
      objectives: [objective({ project: "portfolio" })] }, NOW).find((card) => card.business.key === "strandworks")!;
    expect(company.dates).toHaveLength(3);
  });
  it("includes overdue dates and the full final Eastern day across the DST change", () => {
    const ward = cards([objective({ review_at: "2026-10-01T12:00:00Z", target_at: "2026-11-08T04:59:59Z" }),
      objective({ id: "outside", status: "paused", review_at: "2026-11-08T05:00:00Z" })])
      .find((card) => card.business.key === "wobble-ward")!;
    expect(ward.dates.map((entry) => entry.id)).toEqual(["portfolio-ward-review", "portfolio-ward-delivery"]);
    expect(ward.status).toBe("Needs you");
  });
  it("orders mixed timestamp offsets by instant and uses a strict overdue boundary", () => {
    const ward = cards([objective({ review_at: "2026-10-24T12:00:00Z", target_at: "2026-10-24T07:59:59-04:00" })])
      .find((card) => card.business.key === "wobble-ward")!;
    expect(ward.dates.map((entry) => [entry.id, entry.overdue])).toEqual([
      ["portfolio-ward-delivery", true], ["portfolio-ward-review", false],
    ]);
    expect(cards([objective()]).find((card) => card.business.key === "wobble-ward")?.status).toBe("Quiet");
  });
  it("keeps a valid delivery when the review timestamp is unavailable", () => {
    expect(portfolioDates([objective({ review_at: "unavailable" })], NOW).map((entry) => entry.id)).toEqual(["portfolio-ward-delivery"]);
  });
  it.each(["BadgeMedia", "tenetrix-insight", "/Users/owner/PROJECTS/BadgeMedia/", "TENETRIX-INSIGHT"])("maps %s to its business without mixing SMR with the umbrella", (project) => {
    const result = cards([objective({ project }), objective({ id: "medical", project: "contracting-startup" }),
      objective({ id: "company", project: "strandworks-ops" }), objective({ id: "unknown", project: "unrelated" })]);
    expect(result.find((card) => card.business.key === "tenetrix")?.dates).toHaveLength(2);
    expect(result.find((card) => card.business.key === "strandworks-medical")?.dates).toHaveLength(2);
    expect(result.find((card) => card.business.key === "strandworks")?.dates).toHaveLength(2);
    expect(result.reduce((count, card) => count + card.dates.length, 0)).toBe(6);
  });
  it("labels partial date totals and never treats a missing objective source as a clear queue", () => {
    const result = cards([objective()]);
    const html = renderToStaticMarkup(React.createElement(BusinessBoard, { cards: result, now: NOW,
      available: { ...available, portfolio: false } }));
    expect(html).toContain("objective dates");
    expect(html).toContain('href="/timeline?business=wobble-ward&amp;days=14">2+</a>');
    expect(html).toContain('href="/timeline?business=sag&amp;days=14">—</a>');
    expect(html).toContain("Status unavailable");
    expect(html).not.toContain(">Quiet<");
    const overdue = cards([objective({ review_at: "2026-10-23T12:00:00Z" })]);
    expect(renderToStaticMarkup(React.createElement(BusinessBoard, { cards: overdue.filter((card) => card.business.key === "wobble-ward"),
      now: NOW, available: { ...available, portfolio: false } }))).toContain("Needs you");
  });
  it("distinguishes three unavailable date sources from a successfully loaded empty calendar", () => {
    const result = cards([]);
    const unknown = renderToStaticMarkup(React.createElement(BusinessBoard, { cards: result, now: NOW,
      available: { ...available, loop: false, dates: false, portfolio: false } }));
    expect(unknown).toContain('href="/timeline?business=wobble-ward&amp;days=14">—</a>');
    const known = renderToStaticMarkup(React.createElement(BusinessBoard, { cards: result, now: NOW, available }));
    expect(known).toContain('href="/timeline?business=wobble-ward&amp;days=14">0</a>');
    expect(known).not.toContain("Status unavailable");
  });
});
