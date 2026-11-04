import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loopItem, NOW } from "./inbox-fixtures";

vi.stubGlobal("React", React);
vi.mock("../src/lib/portfolio-data", () => ({ fetchPortfolio: vi.fn().mockResolvedValue(null) }));
vi.mock("../src/lib/due-items", () => ({ fetchDueItems: vi.fn().mockResolvedValue([]) }));
vi.mock("../src/lib/owner-loop-data", () => ({ fetchOwnerLoopItems: vi.fn(), fetchOwnerLoopEvents: vi.fn().mockResolvedValue([]) }));

import Timeline from "../app/timeline/page";
import { fetchOwnerLoopItems } from "../src/lib/owner-loop-data";

const due_at = "2026-10-28T12:00:00Z";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.mocked(fetchOwnerLoopItems).mockResolvedValue([
    loopItem({ id: "date-1", ref: "D-0100", kind: "milestone", due_at, title: "Portfolio delivery review",
      body: "Review collector evidence.\n<script>unsafe()</script>" }),
    loopItem({ id: "date-2", ref: "D-0101", kind: "deadline", due_at, project: "BadgeMedia", title: "Education review",
      body: "Check the current educator packet." }),
    loopItem({ id: "date-3", ref: "D-0102", kind: "deadline", due_at, title: "Confirm appointment", body: " \n " }),
    loopItem({ id: "decision", ref: "D-0103", kind: "decision", due_at, title: "Choose release scope",
      body: "Decision context belongs on Decide." }),
    loopItem({ id: "closed", ref: "D-0104", kind: "milestone", due_at, status: "done", body: "Closed milestone details." }),
  ]);
});
afterEach(() => vi.useRealTimers());

describe("Timeline owner dates", () => {
  it("reveals only nonempty open deadline and milestone bodies, as escaped text, and retains Decide links", async () => {
    const html = renderToStaticMarkup(await Timeline({ searchParams: Promise.resolve({}) }));
    expect(html.match(/<summary>Filed details<\/summary>/g)).toHaveLength(2);
    expect(html).toContain('<details><summary>Filed details</summary><p class="timeline-filed-details">Review collector evidence.\n&lt;script&gt;unsafe()&lt;/script&gt;</p></details>');
    expect(html).toContain("Check the current educator packet.");
    expect(html).toContain('href="/decisions#D-0103"');
    expect(html).not.toContain("Decision context belongs on Decide.");
    expect(html).not.toContain("Closed milestone details.");
    expect(html).not.toContain("<script>unsafe()</script>");
  });

  it("keeps filed context within the selected business and date view", async () => {
    const html = renderToStaticMarkup(await Timeline({ searchParams: Promise.resolve({ business: "tenetrix", days: "14" }) }));
    expect(html).toContain("Check the current educator packet.");
    expect(html).not.toContain("Review collector evidence.");
    expect(html).not.toContain("Choose release scope");
  });
});
