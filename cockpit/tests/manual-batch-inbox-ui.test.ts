import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ManualBatchInbox, batchPresentation, fetchManualInbox, launchManualBatch, toggleBatchAnswer,
  type InboxAnswer, type InboxBatch, type ManualInboxData,
} from "../app/components/ManualBatchInbox";
import { Navigation } from "../app/components/Navigation";

vi.stubGlobal("React", React);
const NOW = "2026-11-06T18:00:00.000Z";
const answer = (id: string, overrides: Partial<InboxAnswer> = {}): InboxAnswer => ({
  responseId: id, ref: "D-0001", title: "Choose the next project step", optionKey: "A", optionLabel: "Ship the chosen step",
  text: "Keep the exact wording.\nThen verify the result.", createdAt: NOW, ...overrides,
});
const batch = (status: InboxBatch["status"], overrides: Partial<InboxBatch> = {}): InboxBatch => ({
  id: `batch-${status}`, project: "sample-project", responseIds: ["answer-1"], createdAt: NOW, status,
  claimedAt: null, finishedAt: null, threadId: null, note: null, ...overrides,
});
const fixture: ManualInboxData = {
  projects: [{ project: "sample-project", answers: [answer("answer-1"), answer("answer-2", { ref: "D-0002", text: null })] },
    { project: "another-project", answers: [answer("answer-3")] }],
  batches: [],
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

describe("manual answer selection", () => {
  it("limits selection to three answers in one project and allows deselection", () => {
    const first = toggleBatchAnswer({ project: null, responseIds: [] }, "project-a", "1");
    const second = toggleBatchAnswer(first, "project-a", "2");
    const third = toggleBatchAnswer(second, "project-a", "3");
    expect(toggleBatchAnswer(third, "project-a", "4")).toEqual(third);
    expect(toggleBatchAnswer(first, "project-b", "5")).toEqual(first);
    expect(toggleBatchAnswer(third, "project-a", "2")).toEqual({ project: "project-a", responseIds: ["1", "3"] });
    const cleared = toggleBatchAnswer(first, "project-a", "1");
    expect(cleared).toEqual({ project: null, responseIds: [] });
    expect(toggleBatchAnswer(cleared, "project-b", "5")).toEqual({ project: "project-b", responseIds: ["5"] });
  });
});

describe("manual inbox HTTP requests with fake responses", () => {
  it("reads saved data without a launch or model request", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply(fixture));
    const signal = new AbortController().signal;
    await expect(fetchManualInbox(signal, fetcher)).resolves.toEqual(fixture);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/loop/batches", { method: "GET", cache: "no-store", credentials: "same-origin", signal });
  });

  it("posts only the explicitly selected project and answer IDs, and returns queued rather than completed", async () => {
    const queued = batch("pending");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply({ batch: queued }));
    const signal = new AbortController().signal;
    await expect(launchManualBatch({ project: "sample-project", responseIds: ["answer-1"] }, signal, fetcher)).resolves.toEqual(queued);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/loop/batches", {
      method: "POST", cache: "no-store", credentials: "same-origin", signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project: "sample-project", responseIds: ["answer-1"] }),
    });
    expect(batchPresentation(queued.status).label).toBe("Queued");
  });

  it("prevents empty, oversized and duplicate launches before making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const signal = new AbortController().signal;
    for (const responseIds of [[], ["1", "2", "3", "4"], ["1", "1"]]) {
      await expect(launchManualBatch({ project: "sample-project", responseIds }, signal, fetcher)).rejects.toThrow("one to three");
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("requires refresh after a stale selection or an unconfirmed launch without automatically retrying", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(reply({ error: "stale" }, 409)).mockResolvedValueOnce(reply({ batch: batch("pending", { project: "another-project" }) }));
    const signal = new AbortController().signal;
    const selection = { project: "sample-project", responseIds: ["answer-1"] };
    await expect(launchManualBatch(selection, signal, fetcher)).rejects.toThrow("Refresh before launching again");
    await expect(launchManualBatch(selection, signal, fetcher)).rejects.toThrow("Could not confirm");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not present unavailable or malformed data as an empty inbox", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(reply({}, 503)).mockResolvedValueOnce(reply({ projects: [], batches: [batch("completed", { usage: { input_tokens: -1, cached_input_tokens: 0, output_tokens: 0 } })] }));
    const signal = new AbortController().signal;
    await expect(fetchManualInbox(signal, fetcher)).rejects.toThrow("unavailable");
    await expect(fetchManualInbox(signal, fetcher)).rejects.toThrow("incomplete data");
  });
});

describe("manual inbox rendering", () => {
  it("groups answers by project, shows the original answer and reference, and keeps launch disabled before selection", () => {
    const html = renderToStaticMarkup(React.createElement(ManualBatchInbox, { initialData: fixture }));
    expect(html.match(/<fieldset/g)).toHaveLength(2);
    expect(html.match(/type="checkbox"/g)).toHaveLength(3);
    expect(html).toContain("sample-project"); expect(html).toContain("another-project");
    expect(html).toContain("Choose the next project step");
    expect(html).toContain("Keep the exact wording.\nThen verify the result.");
    expect(html).toContain('href="/item/D-0001"');
    expect(html).toContain("Ship the chosen step");
    expect(html).toContain("Answers stay saved until you choose them");
    expect(html).toContain("No model calls happen automatically");
    expect(html).toContain("fresh Codex chat with limited context for that project");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Launch 0 answers with Codex<\/button>/);
    expect(html).not.toContain('checked=""');
  });

  it("escapes owner text, titles and job notes", () => {
    const attack = '<img src=x onerror="alert(1)">';
    const html = renderToStaticMarkup(React.createElement(ManualBatchInbox, { initialData: {
      projects: [{ project: "sample-project", answers: [answer("answer-1", { title: attack, text: attack, optionLabel: attack })] }],
      batches: [batch("needs_attention", { note: attack })],
    } }));
    expect(html).not.toContain("<img");
    expect(html.match(/&lt;img/g)).toHaveLength(4);
  });

  it("labels queued, running, completed and attention separately and shows only recorded usage", () => {
    const html = renderToStaticMarkup(React.createElement(ManualBatchInbox, { initialData: {
      projects: [], batches: [batch("pending"), batch("claimed"), batch("launched"), batch("completed", { usage: { input_tokens: 1200, cached_input_tokens: 800, output_tokens: 25 } }), batch("ambiguous")],
    } }));
    expect(html).toContain(">Queued<"); expect(html.match(/>Running</g)).toHaveLength(2);
    expect(html).toContain(">Completed<"); expect(html).toContain(">Needs attention<");
    expect(html).toContain("Waiting for a recorded completion");
    expect(html).toContain("Completion was explicitly recorded");
    expect(html).toContain("Input tokens"); expect(html).toContain("Cached input tokens"); expect(html).toContain("1,200");
    expect(html.match(/Token usage has not been recorded/g)).toHaveLength(4);
    for (const status of ["failed", "blocked", "needs_attention"] as const) expect(batchPresentation(status).label).toBe("Needs attention");
  });

  it("has a friendly empty state and an active shared navigation entry", () => {
    const html = renderToStaticMarkup(React.createElement(ManualBatchInbox, { initialData: { projects: [], batches: [] } }));
    expect(html).toContain("Nothing waiting to launch");
    expect(html).toContain("No batches launched yet");
    expect(html).not.toContain("Launch 0 answers");
    const nav = renderToStaticMarkup(React.createElement(Navigation, { active: "/agent-inbox" }));
    expect(nav).toMatch(/<a(?=[^>]*href="\/agent-inbox")(?=[^>]*aria-current="page")[^>]*>/);
    expect(nav).toContain("Agent inbox");
  });
});
