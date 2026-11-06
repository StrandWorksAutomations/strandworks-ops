import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "../app/components/AppHeader";
import { DashboardBridgeStatus, fetchBridgeStatus, startBridgeStatusPolling, type BridgeStatusResponse } from "../app/components/DashboardBridgeStatus";

vi.stubGlobal("React", React);
const NOW = "2026-11-06T18:00:00.000Z";
const connected: BridgeStatusResponse = { state: "green", label: "Connected", detail: "The bot is ready on this PC.", lastSeenAt: NOW, checkedAt: NOW, pending: 0 };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const stops: Array<() => void> = [];

function polling(fetchImpl: typeof fetch) {
  const events = new EventTarget(), visibilityEvents = new EventTarget();
  let visible = true, online = true;
  const updates: BridgeStatusResponse[] = [];
  const stop = startBridgeStatusPolling(status => updates.push(status), {
    fetchImpl, events, visibilityEvents, isVisible: () => visible, isOnline: () => online,
  });
  stops.push(stop);
  return {
    updates, stop,
    visibility(value: boolean) { visible = value; visibilityEvents.dispatchEvent(new Event("visibilitychange")); },
    online(value: boolean) { online = value; events.dispatchEvent(new Event(value ? "online" : "offline")); },
  };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { stops.splice(0).forEach(stop => stop()); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("bot status fetch and polling", () => {
  it("requests fresh same-origin data and rejects an unavailable or malformed response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply(connected));
    const signal = new AbortController().signal;
    await expect(fetchBridgeStatus(signal, fetcher)).resolves.toEqual(connected);
    expect(fetcher).toHaveBeenCalledWith("/api/loop/agent-status", { method: "GET", cache: "no-store", credentials: "same-origin", signal });
    fetcher.mockResolvedValue(reply({}, 503));
    await expect(fetchBridgeStatus(signal, fetcher)).rejects.toThrow("unavailable");
    fetcher.mockResolvedValue(reply({ ...connected, pending: -1 }));
    await expect(fetchBridgeStatus(signal, fetcher)).rejects.toThrow("Invalid");
    fetcher.mockResolvedValue(reply({ ...connected, lastSeenAt: "not a timestamp" }));
    await expect(fetchBridgeStatus(signal, fetcher)).rejects.toThrow("Invalid");
    const noContact = { ...connected, state: "red", label: "Offline", detail: "No connection recorded yet.", lastSeenAt: null, checkedAt: null, pending: null };
    fetcher.mockResolvedValue(reply(noContact));
    await expect(fetchBridgeStatus(signal, fetcher)).resolves.toEqual(noContact);
  });

  it("polls every 15 seconds after completion and clears green after a failed fetch", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(reply(connected)).mockRejectedValueOnce(new Error("offline"));
    const h = polling(fetcher);
    await vi.advanceTimersByTimeAsync(0);
    expect(h.updates.at(-1)?.state).toBe("green");
    await vi.advanceTimersByTimeAsync(15000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(h.updates.at(-1)?.state).toBe("yellow");
    expect(h.updates.at(-1)?.label).toBe("Status unavailable");
  });

  it("invalidates green immediately when offline and ignores an aborted request's late success", async () => {
    let finish: (response: Response) => void = () => {};
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply(connected))
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
      .mockResolvedValueOnce(reply({ ...connected, state: "yellow", label: "Needs attention", detail: "A reply is waiting." }));
    const h = polling(fetcher);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(15000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    h.online(false);
    expect(h.updates.at(-1)?.state).toBe("red");
    expect(h.updates.at(-1)?.label).toBe("This device offline");
    expect(fetcher.mock.calls[1][1]?.signal?.aborted).toBe(true);
    const afterOffline = h.updates.length;
    h.online(true);
    expect(h.updates.at(-1)?.label).toBe("Checking");
    expect(fetcher).toHaveBeenCalledTimes(2);
    finish(reply(connected));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(h.updates.slice(afterOffline).some(status => status.state === "green")).toBe(false);
    expect(h.updates.at(-1)?.label).toBe("Needs attention");
  });

  it("stops polling when hidden and rechecks before displaying cached green on return", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => reply(connected));
    const h = polling(fetcher);
    await vi.advanceTimersByTimeAsync(0);
    h.visibility(false);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    h.visibility(true);
    expect(h.updates.at(-1)?.state).toBe("yellow");
    expect(h.updates.at(-1)?.label).toBe("Checking");
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(h.updates.at(-1)?.state).toBe("green");
  });

  it("times out stalled reads and aborts outstanding work on cleanup", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    const h = polling(fetcher);
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(h.updates.at(-1)?.state).toBe("yellow");
    expect(h.updates.at(-1)?.label).toBe("Status unavailable");
    await vi.advanceTimersByTimeAsync(15000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    h.stop();
    expect(fetcher.mock.calls[1][1]?.signal?.aborted).toBe(true);
    const count = h.updates.length;
    h.online(true); h.visibility(true);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(h.updates).toHaveLength(count);
  });
});

describe("bot status header", () => {
  it("uses visible labels and accessible native details instead of color alone", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardBridgeStatus));
    expect(html).toContain("<details"); expect(html).toContain("<summary");
    expect(html).toContain("Bot: Checking"); expect(html).toContain('role="status"');
    expect(html).toContain("Green — connected"); expect(html).toContain("Yellow — needs attention"); expect(html).toContain("Red — offline");
    expect(html).toContain("No contact recorded"); expect(html).not.toContain("Pending replies");
    expect(html).toContain("Green confirms the connection; project progress is tracked separately.");
    expect(html).toContain("Starts after Windows sign-in. Keep this PC awake, online, and Codex open. Locking the screen and closing the dashboard are fine.");
  });

  it("hides the status while locked and preserves menu and theme controls", () => {
    const locked = renderToStaticMarkup(React.createElement(AppHeader, { title: "Sign in", locked: true }));
    expect(locked).not.toContain("dashboard-bridge-status");
    expect(locked).toContain("Menu"); expect(locked).toContain("Light mode");
    const unlocked = renderToStaticMarkup(React.createElement(AppHeader, { title: "Operate" }));
    expect(unlocked).toContain("dashboard-bridge-status"); expect(unlocked).toContain("Light mode");
  });
});
