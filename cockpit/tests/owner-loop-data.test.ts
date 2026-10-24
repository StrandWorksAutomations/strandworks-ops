import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// These tests never connect to Supabase; even the server-only marker is local.
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/supabase-rest", () => ({
  sbSelect: vi.fn(),
  supabaseConfigured: vi.fn(),
}));

import { fetchOwnerLoopEvents, fetchOwnerLoopItems } from "../src/lib/owner-loop-data";
import { sbSelect, supabaseConfigured } from "../src/lib/supabase-rest";
import type { OwnerLoopEvent, OwnerLoopItem } from "../src/lib/owner-loop";

const select = vi.mocked(sbSelect);
const configured = vi.mocked(supabaseConfigured);
const NOW = new Date("2026-10-24T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  select.mockReset();
  select.mockResolvedValue([]);
  configured.mockReset();
  configured.mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

function queryForCall(index = 0): URLSearchParams {
  return new URLSearchParams(select.mock.calls[index][1]);
}

describe("owner-loop server data", () => {
  it("returns null when unconfigured without trying a query", async () => {
    configured.mockReturnValue(false);
    await expect(fetchOwnerLoopItems()).resolves.toBeNull();
    await expect(fetchOwnerLoopEvents()).resolves.toBeNull();
    expect(select).not.toHaveBeenCalled();
  });

  it("distinguishes configured empty queues from unavailable data", async () => {
    await expect(fetchOwnerLoopItems()).resolves.toEqual([]);
    await expect(fetchOwnerLoopEvents()).resolves.toEqual([]);
    expect(select).toHaveBeenCalledTimes(2);
  });

  it("selects only display item fields and all active or recently changed work", async () => {
    await fetchOwnerLoopItems();
    expect(select.mock.calls[0][0]).toBe("owner_loop_items");
    const query = queryForCall();
    expect(query.get("select")?.split(",")).toEqual([
      "id", "ref", "kind", "project", "title", "body", "options", "recommended",
      "origin_agent", "due_at", "status", "ruling", "ruling_note", "ruled_via",
      "ruled_at", "picked_up_at", "picked_up_by", "outcome_note", "done_at",
      "repeat_count", "created_at", "updated_at",
    ]);
    expect(query.get("select")).not.toMatch(/\*|dedupe_key|origin_host|origin_session|origin_cwd/);
    expect(query.get("or")).toBe("(status.in.(open,ruled,picked_up),updated_at.gte.2026-10-10T12:00:00.000Z)");
    expect(query.get("order")).toBe("created_at.asc,id.asc");
    expect(query.get("limit")).toBe("200");
    expect(query.get("offset")).toBe("0");
  });

  it("paginates item queries without losing or reordering results", async () => {
    const first = Array.from({ length: 200 }, (_, index) => ({ id: `item-${index}` }) as OwnerLoopItem);
    const last = [{ id: "item-200" } as OwnerLoopItem];
    select.mockResolvedValueOnce(first).mockResolvedValueOnce(last);
    await expect(fetchOwnerLoopItems()).resolves.toEqual([...first, ...last]);
    expect(select).toHaveBeenCalledTimes(2);
    expect(queryForCall(1).get("offset")).toBe("200");
    expect(queryForCall(1).get("select")).toBe(queryForCall().get("select"));
    expect(queryForCall(1).get("or")).toBe(queryForCall().get("or"));
  });

  it("checks another page when the last page is exactly full", async () => {
    const page = Array.from({ length: 200 }, (_, index) => ({ id: `item-${index}` }) as OwnerLoopItem);
    select.mockResolvedValueOnce(page).mockResolvedValueOnce([]);
    await expect(fetchOwnerLoopItems()).resolves.toEqual(page);
    expect(select).toHaveBeenCalledTimes(2);
    expect(queryForCall(1).get("offset")).toBe("200");
  });

  it("joins only item ref, title and project into the last 30 days of events", async () => {
    const rows: OwnerLoopEvent[] = [{
      id: "event-1", item_id: "item-1", actor: "codex", type: "pickup",
      at: NOW.toISOString(), note: "Starting", item: { ref: "D-0001", title: "Act", project: "portfolio" },
    }];
    select.mockResolvedValueOnce(rows);
    await expect(fetchOwnerLoopEvents()).resolves.toEqual(rows);
    expect(select.mock.calls[0][0]).toBe("owner_loop_events");
    const query = queryForCall();
    expect(query.get("select")).toBe("id,item_id,at,actor,type,note,item:owner_loop_items(ref,title,project)");
    expect(query.get("select")).not.toMatch(/\*|dedupe_key|origin_host|origin_session|origin_cwd/);
    expect(query.get("at")).toBe("gte.2026-09-24T12:00:00.000Z");
    expect(query.get("order")).toBe("at.desc,id.desc");
  });

  it("paginates event history past multiple full pages", async () => {
    const first = Array.from({ length: 200 }, (_, index) => ({ id: `event-${index}` }) as OwnerLoopEvent);
    const second = Array.from({ length: 200 }, (_, index) => ({ id: `event-${200 + index}` }) as OwnerLoopEvent);
    const last = [{ id: "event-400", item: null } as OwnerLoopEvent];
    select.mockResolvedValueOnce(first).mockResolvedValueOnce(second).mockResolvedValueOnce(last);
    await expect(fetchOwnerLoopEvents()).resolves.toEqual([...first, ...second, ...last]);
    expect(select).toHaveBeenCalledTimes(3);
    expect(select.mock.calls.map((_, index) => queryForCall(index).get("offset"))).toEqual(["0", "200", "400"]);
  });

  it("returns null on backend failure without exposing the underlying error", async () => {
    select.mockRejectedValue(new Error("private credential detail"));
    await expect(fetchOwnerLoopItems()).resolves.toBeNull();
    await expect(fetchOwnerLoopEvents()).resolves.toBeNull();
  });

  it("discards incomplete partial results if a later page fails", async () => {
    select.mockResolvedValueOnce(Array.from({ length: 200 }, () => ({ id: "item" })))
      .mockRejectedValueOnce(new Error("second page unavailable"));
    await expect(fetchOwnerLoopItems()).resolves.toBeNull();
    expect(select).toHaveBeenCalledTimes(2);
  });
});
