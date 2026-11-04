import { describe, it, expect } from "vitest";
import {
  bandOf, buildOperateRiver, computeRunwayMonths, deriveAgentActivity,
  groupIntoBands, operatePendingDecisions, serviceSeverity, type RecentReport,
} from "@/lib/operate";
import type { OwnerLoopEvent, OwnerLoopItem } from "@/lib/owner-loop";

const NOW = new Date("2026-11-04T02:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

function report(overrides: Partial<RecentReport> = {}): RecentReport {
  return {
    id: 1, issue_id: "STR-1069", objective_id: "portfolio-control", agent: "codex",
    result: "Candidate build ready for review", next_action: "Verify on a phone", created_at: ago(10),
    ...overrides,
  };
}

function loopEvent(overrides: Partial<OwnerLoopEvent> = {}): OwnerLoopEvent {
  return {
    id: "loop1", item_id: "item", at: ago(1), actor: "owner", type: "ruled", note: null,
    item: { ref: "D-0100", title: "Approve wording?", project: "portfolio" }, ...overrides,
  };
}

describe("Operate activity", () => {
  it("orders bounded activity from the current sources without inferring a deployment from report text", () => {
    const events = buildOperateRiver([
      report(), report({ id: 2, created_at: ago(8 * 1440) }), report({ id: 3, created_at: ago(-1) }),
    ], [loopEvent()], NOW);
    expect(events.map((event) => event.id)).toEqual(["loop:loop1", "report:1"]);
    expect(events[0]).toMatchObject({ category: "owner-loop", msg: "Owner ruled D-0100", href: "/item/D-0100" });
    expect(events[1]).toMatchObject({ category: "report", proj: "STR-1069", href: "/work/1", detail: "Verify on a phone" });
    expect(buildOperateRiver(Array.from({ length: 125 }, (_, id) => report({ id })), [], NOW)).toHaveLength(120);
  });

  it("uses observed agent records without inferring online or offline presence", () => {
    const events = buildOperateRiver([report(), report({ id: 2, created_at: ago(30) })], [loopEvent()], NOW);
    expect(deriveAgentActivity(events, NOW)).toEqual([{ agent: "codex", lastSeen: "10m ago", detail: "Candidate build ready for review" }]);
    expect(deriveAgentActivity([], NOW)).toEqual([]);
  });

  it("uses Decide ordering and includes only open decisions in the dock", () => {
    const base = { kind: "decision", status: "open", project: "portfolio", title: "Question", due_at: null, created_at: ago(60) } as OwnerLoopItem;
    const rows: OwnerLoopItem[] = [
      { ...base, ref: "D-0100" },
      { ...base, ref: "D-0101", due_at: ago(15), body: "Full context belongs in Decide" },
      { ...base, ref: "D-0102", kind: "alert" },
      { ...base, ref: "D-0103", status: "ruled" },
    ];
    expect(operatePendingDecisions(rows, NOW)).toEqual([
      { ref: "D-0101", title: "Question", project: "portfolio", ageLabel: "1h ago" },
      { ref: "D-0100", title: "Question", project: "portfolio", ageLabel: "1h ago" },
    ]);
  });
});

describe("time bands", () => {
  it("classifies by recency within the Eastern calendar day", () => {
    expect(bandOf(ago(2), NOW.getTime())).toBe("now");
    expect(bandOf(ago(30), NOW.getTime())).toBe("hour");
    expect(bandOf(ago(300), NOW.getTime())).toBe("today");
    expect(bandOf(ago(3 * 1440), NOW.getTime())).toBe("earlier");
  });

  it("keeps an anchored Now band and omits empty later bands", () => {
    const events = buildOperateRiver([report({ created_at: ago(3 * 1440) })], [], NOW);
    const bands = groupIntoBands(events, NOW.getTime());
    expect(bands.map((band) => band.key)).toEqual(["now", "earlier"]);
  });
});

describe("register tiles", () => {
  it("maps environment words to severities", () => {
    expect(serviceSeverity("production")).toBe("ok");
    expect(serviceSeverity("paused")).toBe("quiet");
    expect(serviceSeverity("degraded")).toBe("warn");
    expect(serviceSeverity("episodic")).toBe("info");
  });

  it("floors reserve / burn and returns null when either is unavailable", () => {
    expect(computeRunwayMonths(10000, 1920)).toBe(5);
    expect(computeRunwayMonths(null, 1920)).toBeNull();
    expect(computeRunwayMonths(10000, 0)).toBeNull();
  });
});
