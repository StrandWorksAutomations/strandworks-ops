import { describe, expect, it } from "vitest";
import {
  buildTimelineUpcoming,
  eventSummary,
  formatLoopAge,
  groupOwnerLoopItems,
  groupTimelineEvents,
  isStalled,
  validateOwnerLoopRuleInput,
  type OwnerLoopEvent,
  type OwnerLoopItem,
} from "../src/lib/owner-loop";
import type { DueItem } from "../src/lib/due-items";

const NOW = new Date("2026-10-24T12:00:00Z");

function item(over: Partial<OwnerLoopItem> = {}): OwnerLoopItem {
  return {
    id: "item-1", ref: "D-0001", kind: "decision", project: "portfolio", title: "Choose a direction",
    body: "Owner input needed", options: [{ key: "A", label: "Continue" }], recommended: "A",
    origin_agent: "codex", due_at: null, status: "open", ruling: null, ruling_note: null,
    ruled_via: null, ruled_at: null, picked_up_at: null, picked_up_by: null, outcome_note: null,
    done_at: null, repeat_count: 1, created_at: "2026-10-22T08:00:00Z", updated_at: "2026-10-22T08:00:00Z",
    ...over,
  };
}

function due(over: Partial<DueItem> = {}): DueItem {
  return {
    entity: "Medical Resources", kind: "obligation", item: "Annual report", jurisdiction: "KY",
    dueOn: "2026-10-27", daysLeft: 3, status: "open", feeUsd: 15, alertDaysBefore: 30,
    ...over,
  };
}

function event(over: Partial<OwnerLoopEvent> = {}): OwnerLoopEvent {
  return {
    id: "event-1", item_id: "item-1", at: "2026-10-23T12:00:00Z", actor: "owner", type: "ruled", note: "A",
    item: { ref: "D-0004", title: "Choose a direction", project: "portfolio" },
    ...over,
  };
}

describe("owner-loop ruling validation", () => {
  it("accepts option keys, free text, DROP/PARK and longer valid refs", () => {
    for (const ruling of ["A", "Use the smaller package", "DROP", "PARK"]) {
      expect(validateOwnerLoopRuleInput({ ref: "D-10000", ruling })).toEqual({
        ok: true, value: { ref: "D-10000", ruling },
      });
    }
  });

  it("trims valid ruling/note strings and omits empty optional notes", () => {
    expect(validateOwnerLoopRuleInput({ ref: "D-0001", ruling: " A ", note: " Ship it " })).toEqual({
      ok: true, value: { ref: "D-0001", ruling: "A", note: "Ship it" },
    });
    expect(validateOwnerLoopRuleInput({ ref: "D-0001", ruling: "A", note: " " })).toEqual({
      ok: true, value: { ref: "D-0001", ruling: "A" },
    });
  });

  it("rejects malformed bodies, refs, blank rulings, and incorrect field types", () => {
    for (const raw of [
      null, [], "A", 1, {},
      { ref: "D-123", ruling: "A" }, { ref: "d-0001", ruling: "A" },
      { ref: "D-0001 ", ruling: "A" }, { ref: "D-0001\n", ruling: "A" },
      { ref: "D-0001", ruling: " " }, { ref: "D-0001", ruling: 1 },
      { ref: "D-0001", ruling: "A", note: null }, { ref: "D-0001", ruling: "A", note: {} },
    ]) {
      expect(validateOwnerLoopRuleInput(raw).ok).toBe(false);
    }
  });

  it("enforces the 500/2000 character limits before trimming", () => {
    expect(validateOwnerLoopRuleInput({ ref: "D-0001", ruling: "A".repeat(500), note: "N".repeat(2000) }).ok).toBe(true);
    expect(validateOwnerLoopRuleInput({ ref: "D-0001", ruling: "A".repeat(501) }).ok).toBe(false);
    expect(validateOwnerLoopRuleInput({ ref: "D-0001", ruling: ` ${"A".repeat(500)}` }).ok).toBe(false);
    expect(validateOwnerLoopRuleInput({ ref: "D-0001", ruling: "A", note: "N".repeat(2001) }).ok).toBe(false);
  });
});

describe("isStalled", () => {
  it("becomes stalled strictly after 24 hours without pickup", () => {
    expect(isStalled(item({ status: "ruled", ruled_at: "2026-10-23T11:59:59.999Z" }), NOW)).toBe(true);
    expect(isStalled(item({ status: "ruled", ruled_at: "2026-10-23T12:00:00Z" }), NOW)).toBe(false);
    expect(isStalled(item({ status: "ruled", ruled_at: "2026-10-23T12:00:00.001Z" }), NOW)).toBe(false);
  });

  it("uses the lifecycle status and tolerates missing, invalid, or future dates", () => {
    for (const status of ["open", "picked_up", "done", "dropped"] as const) {
      expect(isStalled(item({ status, ruled_at: "2026-09-01T00:00:00Z" }), NOW)).toBe(false);
    }
    for (const ruled_at of [null, "invalid", "2026-10-25T00:00:00Z"]) {
      expect(isStalled(item({ status: "ruled", ruled_at }), NOW)).toBe(false);
    }
  });
});

describe("groupOwnerLoopItems", () => {
  it("sorts open decisions by due date, then creation, with undated last", () => {
    const groups = groupOwnerLoopItems([
      item({ id: "undated-new", created_at: "2026-10-23T00:00:00Z" }),
      item({ id: "due-new", due_at: "2026-10-26T12:00:00Z", created_at: "2026-10-23T00:00:00Z" }),
      item({ id: "first", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "undated-old" }),
      item({ id: "due-old", due_at: "2026-10-26T12:00:00Z" }),
      item({ id: "deadline", kind: "deadline" }),
    ], NOW);
    expect(groups.needsYou.map((i) => i.id)).toEqual(["first", "due-old", "due-new", "undated-old", "undated-new"]);
  });

  it("ranks stalled rulings, then remaining rulings, then work in progress", () => {
    const groups = groupOwnerLoopItems([
      item({ id: "pickup-new", kind: "milestone", status: "picked_up", picked_up_at: "2026-10-24T11:00:00Z" }),
      item({ id: "ruled-new", status: "ruled", ruled_at: "2026-10-24T10:00:00Z" }),
      item({ id: "stalled-new", status: "ruled", ruled_at: "2026-10-23T00:00:00Z" }),
      item({ id: "pickup-old", kind: "deadline", status: "picked_up", picked_up_at: "2026-10-24T01:00:00Z" }),
      item({ id: "stalled-old", status: "ruled", ruled_at: "2026-10-22T00:00:00Z" }),
      item({ id: "ruled-old", status: "ruled", ruled_at: "2026-10-23T12:00:00Z" }),
    ], NOW);
    expect(groups.waiting.map((i) => i.id)).toEqual([
      "stalled-old", "stalled-new", "ruled-old", "ruled-new", "pickup-old", "pickup-new",
    ]);
  });

  it("closes within the last 14 days using done_at, with updated_at for dropped items", () => {
    const groups = groupOwnerLoopItems([
      item({ id: "boundary", status: "done", done_at: "2026-10-10T12:00:00Z" }),
      item({ id: "drop", status: "dropped", updated_at: "2026-10-23T12:00:00Z" }),
      item({ id: "latest", status: "done", done_at: "2026-10-24T12:00:00Z" }),
      item({ id: "old", status: "done", done_at: "2026-10-10T11:59:59Z" }),
      item({ id: "future", status: "done", done_at: "2026-10-25T00:00:00Z" }),
    ], NOW);
    expect(groups.closed.map((i) => i.id)).toEqual(["latest", "drop", "boundary"]);
  });

  it("keeps active alerts in their own strip, excluding closed alerts everywhere", () => {
    const groups = groupOwnerLoopItems([
      item({ id: "open-alert", kind: "alert" }),
      item({ id: "ruled-alert", kind: "alert", status: "ruled", ruled_at: "2026-10-01T00:00:00Z" }),
      item({ id: "picked-alert", kind: "alert", status: "picked_up" }),
      item({ id: "done-alert", kind: "alert", status: "done", done_at: NOW.toISOString() }),
      item({ id: "dropped-alert", kind: "alert", status: "dropped", updated_at: NOW.toISOString() }),
    ], NOW);
    expect(groups.alerts.map((i) => i.id)).toEqual(["open-alert", "ruled-alert", "picked-alert"]);
    expect(groups.needsYou).toEqual([]);
    expect(groups.waiting).toEqual([]);
    expect(groups.closed).toEqual([]);
  });
});

describe("buildTimelineUpcoming", () => {
  it("merges both sources chronologically with all overdue items first", () => {
    const result = buildTimelineUpcoming([
      item({ id: "decision", due_at: "2026-10-26T12:00:00Z" }),
      item({ id: "very-old", kind: "deadline", due_at: "2025-01-01T00:00:00Z" }),
      item({ id: "milestone", kind: "milestone", status: "picked_up", due_at: "2026-10-28T00:00:00Z" }),
    ], [due(), due({ item: "Late filing", dueOn: "2026-10-20", daysLeft: -4 })], NOW);
    expect(result.map((entry) => entry.title)).toEqual([
      "Choose a direction", "Late filing", "Choose a direction", "Annual report", "Choose a direction",
    ]);
    expect(result.map((entry) => entry.overdue)).toEqual([true, true, false, false, false]);
    expect(result[0].id).toBe("owner-loop:very-old");
    expect(result[0].href).toBe("/decisions#D-0001");
    expect(result[3]).toMatchObject({ source: "business", project: "Medical Resources", ref: null, href: "/business" });
    expect(result[3].detail).toContain("$15.00");
  });

  it("includes the exact 30-day boundary and excludes later/invalid/undated rows", () => {
    const result = buildTimelineUpcoming([
      item({ id: "edge", due_at: "2026-11-23T12:00:00Z" }),
      item({ id: "too-late", due_at: "2026-11-23T12:00:00.001Z" }),
      item({ id: "invalid", due_at: "invalid" }),
      item({ id: "undated" }),
    ], [due({ dueOn: null }), due({ dueOn: "invalid" }), due({ dueOn: "2026-11-24" })], NOW);
    expect(result.map((entry) => entry.id)).toEqual(["owner-loop:edge"]);
  });

  it("includes active deadlines/milestones and open decisions, excluding alerts and closed work", () => {
    const result = buildTimelineUpcoming([
      item({ id: "open", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "ruled-deadline", kind: "deadline", status: "ruled", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "picked-milestone", kind: "milestone", status: "picked_up", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "ruled-decision", status: "ruled", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "picked-decision", status: "picked_up", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "alert", kind: "alert", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "done", kind: "deadline", status: "done", due_at: "2026-10-25T12:00:00Z" }),
      item({ id: "dropped", kind: "milestone", status: "dropped", due_at: "2026-10-25T12:00:00Z" }),
    ], [], NOW);
    expect(result.map((entry) => entry.id)).toEqual(["owner-loop:open", "owner-loop:ruled-deadline", "owner-loop:picked-milestone"]);
  });

  it("filters resolved business statuses case-insensitively and falls back to a business project", () => {
    const result = buildTimelineUpcoming([], [
      ...["done", "dropped", "closed", "complete", "Completed", "CANCELLED", "canceled", "resolved", "waived", "archived", "DONE 2026-10-20"]
        .map((status) => due({ status })),
      due({ entity: "", status: "pending", item: "Unassigned business item", feeUsd: null }),
    ], NOW);
    expect(result).toHaveLength(1);
    expect(result[0].project).toBe("business");
  });

  it("treats a business date due today as upcoming, while timestamped deadlines can be overdue today", () => {
    const result = buildTimelineUpcoming([
      item({ due_at: "2026-10-24T11:59:59Z" }),
      item({ id: "exact-now", due_at: NOW.toISOString() }),
    ], [due({ dueOn: "2026-10-24", daysLeft: 0 })], NOW);
    expect(result.map((entry) => [entry.source, entry.overdue])).toEqual([
      ["owner-loop", true], ["business", false], ["owner-loop", false],
    ]);
  });
});

describe("groupTimelineEvents", () => {
  it("includes last 30 days through now, groups by Eastern day and sorts newest first", () => {
    const result = groupTimelineEvents([
      event({ id: "earlier-today", at: "2026-10-24T01:00:00Z" }),
      event({ id: "boundary", at: "2026-09-24T12:00:00Z" }),
      event({ id: "now", at: NOW.toISOString() }),
      event({ id: "utc-day", at: "2026-10-23T23:30:00-02:00" }),
      event({ id: "yesterday", at: "2026-10-23T01:00:00Z" }),
      event({ id: "too-old", at: "2026-09-24T11:59:59Z" }),
      event({ id: "future", at: "2026-10-24T12:00:01Z" }),
      event({ id: "invalid", at: "invalid" }),
    ], NOW);
    expect(result.map((group) => group.day)).toEqual(["2026-10-24", "2026-10-23", "2026-10-22", "2026-09-24"]);
    expect(result[0].events.map((entry) => entry.id)).toEqual(["now"]);
    expect(result[1].events.map((entry) => entry.id)).toEqual(["utc-day", "earlier-today"]);
    expect(result[3].events[0].id).toBe("boundary");
  });
});

describe("eventSummary", () => {
  it("describes rulings, agent acknowledgment and reported outcome", () => {
    expect(eventSummary(event())).toBe("Owner ruled D-0004 → A");
    expect(eventSummary(event({ actor: "codex", type: "pickup", note: null }))).toBe("codex picked up D-0004");
    expect(eventSummary(event({ actor: "claude", type: "done", note: "Delivered the change" })))
      .toBe("claude done D-0004: Delivered the change");
  });

  it("supports all event types with safe fallbacks for missing join/note", () => {
    for (const [type, verb] of [["filed", "filed"], ["repeated", "asked again"], ["drop", "dropped"], ["resolve", "resolved"], ["other", "other"]]) {
      expect(eventSummary(event({ actor: "codex", type, item: null, note: "  " }))).toBe(`codex ${verb} item`);
    }
    expect(eventSummary(event({ note: null }))).toBe("Owner ruled D-0004");
  });
});

describe("formatLoopAge", () => {
  it("formats minutes, hours and days deterministically", () => {
    expect(formatLoopAge("2026-10-24T11:59:30Z", NOW)).toBe("just now");
    expect(formatLoopAge("2026-10-24T11:30:00Z", NOW)).toBe("30m ago");
    expect(formatLoopAge("2026-10-24T09:00:00Z", NOW)).toBe("3h ago");
    expect(formatLoopAge("2026-10-22T12:00:00Z", NOW)).toBe("2d ago");
    expect(formatLoopAge("invalid", NOW)).toBe("unknown age");
  });
});

describe("pure owner-loop views", () => {
  it("does not reorder or edit the source arrays/rows", () => {
    const items = [item({ id: "later", due_at: "2026-10-27T00:00:00Z" }), item({ id: "earlier", due_at: "2026-10-25T00:00:00Z" })];
    const events = [event({ id: "older", at: "2026-10-22T00:00:00Z" }), event({ id: "newer" })];
    const business = [due()];
    const before = JSON.stringify({ items, events, business });
    groupOwnerLoopItems(items, NOW);
    buildTimelineUpcoming(items, business, NOW);
    groupTimelineEvents(events, NOW);
    expect(JSON.stringify({ items, events, business })).toBe(before);
  });
});
