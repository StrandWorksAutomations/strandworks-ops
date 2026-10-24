import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { email, loopItem, dueItem, NOW } from "./inbox-fixtures";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../src/lib/owner-loop-data", () => ({ fetchOwnerLoopItems: vi.fn(), fetchOwnerLoopEvents: vi.fn() }));
vi.mock("../src/lib/intake-data", () => ({ fetchIntake: vi.fn() }));
vi.mock("../src/lib/due-items", () => ({ fetchDueItems: vi.fn() }));
vi.mock("../src/lib/repo", () => ({ readRepoFile: vi.fn().mockResolvedValue(null), listRepoDir: vi.fn().mockResolvedValue([]) }));
vi.mock("../src/lib/rule-writer", () => ({ writeMode: () => "dry-run" }));
import { fetchOwnerLoopItems, fetchOwnerLoopEvents } from "../src/lib/owner-loop-data";
import { fetchIntake } from "../src/lib/intake-data";
import { fetchDueItems } from "../src/lib/due-items";
import InboxPage from "../app/inbox/page";
import DecisionsPage from "../app/decisions/page";
import TimelinePage from "../app/timeline/page";

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NOW);
  vi.mocked(fetchOwnerLoopItems).mockResolvedValue([]);
  vi.mocked(fetchOwnerLoopEvents).mockResolvedValue([]);
  vi.mocked(fetchDueItems).mockResolvedValue([]);
  vi.mocked(fetchIntake).mockResolvedValue({ items: [], linkCounts: {} });
});
afterEach(() => { vi.useRealTimers(); });

describe("business-filtered destination pages", () => {
  it("filters Inbox reviews, alerts and noise by the same business key", async () => {
    vi.mocked(fetchIntake).mockResolvedValue({ items: [
      email({ subject: "Company email" }), email({ business: "strandworks-medical", subject: "Medical email" }),
      email({ id: "job", status: "done", category: "job_alert", subject: "Company job" }),
      email({ id: "noise", status: "noise", subject: "Company noise", reply_status: "none" }),
    ], linkCounts: { job: 3 } });
    const html = renderToStaticMarkup(await InboxPage({ searchParams: Promise.resolve({ business: "strandworks" }) }));
    expect(html).toContain("Company email");
    expect(html).not.toContain("Medical email");
    expect(html).toContain("3 links extracted");
    expect(html).toContain("Company noise");
    expect(html).not.toContain("Move to review");
  });
  it("keeps unavailable Inbox distinct from a clear queue", async () => {
    vi.mocked(fetchIntake).mockResolvedValue(null);
    const html = renderToStaticMarkup(await InboxPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Inbox unavailable");
    expect(html).not.toContain("No emails need review");
  });
  it("shows decisions from every mapped repo, excluding the separate medical company", async () => {
    vi.mocked(fetchOwnerLoopItems).mockResolvedValue([
      loopItem({ title: "Operations choice" }), loopItem({ id: "two", ref: "D-0002", project: "portfolio", title: "Portfolio choice" }),
      loopItem({ id: "three", ref: "D-0003", project: "contracting-startup", title: "Medical choice" }),
    ]);
    const html = renderToStaticMarkup(await DecisionsPage({ searchParams: Promise.resolve({ business: "strandworks" }) }));
    expect(html).toContain("Operations choice");
    expect(html).toContain("Portfolio choice");
    expect(html).not.toContain("Medical choice");
    expect(html).toContain("2 need you");
  });
  it("matches the board's 14-day window, mapped repos and loosely named business entities", async () => {
    vi.mocked(fetchOwnerLoopItems).mockResolvedValue([
      loopItem({ kind: "deadline", title: "Company deadline", due_at: "2026-10-25T12:00:00Z" }),
      loopItem({ project: "contracting-startup", kind: "milestone", title: "Medical milestone", due_at: "2026-11-07T12:00:00Z" }),
      loopItem({ project: "wildfire", kind: "deadline", title: "Later medical deadline", due_at: "2026-11-08T12:00:00Z" }),
      loopItem({ project: "wildfire", title: "Medical decision", due_at: "2026-10-25T12:00:00Z" }),
    ]);
    vi.mocked(fetchDueItems).mockResolvedValue([dueItem({ entity: "Strandworks Medical Resources, LLC", item: "Medical annual report" })]);
    const html = renderToStaticMarkup(await TimelinePage({ searchParams: Promise.resolve({ business: "strandworks-medical", days: "14" }) }));
    expect(html).toContain("Medical milestone");
    expect(html).toContain("Medical annual report");
    expect(html).not.toContain("Company deadline");
    expect(html).not.toContain("Later medical deadline");
    expect(html).not.toContain("Medical decision");
    expect(html).toContain("2 dates");
  });
});
