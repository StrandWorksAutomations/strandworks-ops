"use client";

import { useEffect, useState } from "react";
import type { BridgeConnectionStatus } from "@/lib/dashboard-bridge-status";

export type BridgeStatusResponse = BridgeConnectionStatus;

function initialStatus(): BridgeStatusResponse {
  return { state: "yellow", label: "Checking", detail: "Checking the connection to this PC.", lastSeenAt: null, checkedAt: new Date().toISOString(), pending: null };
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export async function fetchBridgeStatus(signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<BridgeStatusResponse> {
  const response = await fetchImpl("/api/loop/agent-status", {
    method: "GET", cache: "no-store", credentials: "same-origin", signal,
  });
  if (!response.ok) throw new Error("Bot status is unavailable.");
  const raw: unknown = await response.json();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid bot status.");
  const status = raw as Record<string, unknown>;
  if (!["green", "yellow", "red"].includes(String(status.state))
    || typeof status.label !== "string" || !status.label.trim() || status.label.length > 120
    || typeof status.detail !== "string" || !status.detail.trim() || status.detail.length > 2000
    || !(status.lastSeenAt === null || validDate(status.lastSeenAt)) || !(status.checkedAt === null || validDate(status.checkedAt))
    || !(status.pending === null || (Number.isSafeInteger(status.pending) && Number(status.pending) >= 0))) throw new Error("Invalid bot status.");
  return status as BridgeStatusResponse;
}

type PollingRuntime = {
  fetchImpl?: typeof fetch;
  events?: EventTarget;
  visibilityEvents?: EventTarget;
  isVisible?: () => boolean;
  isOnline?: () => boolean;
};

// A completion-scheduled timer avoids overlapping requests. The browser's online
// and visibility events invalidate old green state before starting a fresh read.
export function startBridgeStatusPolling(update: (status: BridgeStatusResponse) => void, runtime: PollingRuntime = {}) {
  const events = runtime.events ?? window;
  const visibilityEvents = runtime.visibilityEvents ?? document;
  const isVisible = runtime.isVisible ?? (() => document.visibilityState !== "hidden");
  const isOnline = runtime.isOnline ?? (() => navigator.onLine);
  let status = initialStatus();
  let stopped = false;
  let inFlight = false;
  let restartRequested = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | null = null;
  const publish = (next: BridgeStatusResponse) => { status = next; update(next); };
  const clearTimer = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const offline = (detail: string) => publish({ ...status, state: "red", label: "This device offline", detail, checkedAt: new Date().toISOString() });
  const unavailable = () => publish({ ...status, state: "yellow", label: "Status unavailable", detail: "Cannot check the bot connection right now. Check this device's connection and try again.", checkedAt: new Date().toISOString() });
  const schedule = () => {
    clearTimer();
    if (!stopped && isVisible() && isOnline()) timer = setTimeout(() => { void refresh(); }, 15000);
  };
  async function refresh() {
    if (stopped || !isVisible() || inFlight) return;
    if (!isOnline()) { offline("This device is offline. Reconnect to check the bot."); return; }
    inFlight = true;
    const request = new AbortController();
    controller = request;
    const timeout = setTimeout(() => request.abort(), 10000);
    try {
      const next = await fetchBridgeStatus(request.signal, runtime.fetchImpl);
      if (!stopped && controller === request && !request.signal.aborted && isVisible() && isOnline()) publish(next);
    } catch {
      if (!stopped && controller === request && isVisible() && isOnline()) unavailable();
    } finally {
      clearTimeout(timeout);
      inFlight = false;
      if (controller === request) controller = null;
      if (!stopped && restartRequested) { restartRequested = false; void refresh(); }
      else schedule();
    }
  }
  const recheck = () => {
    clearTimer();
    if (stopped || !isVisible()) { controller?.abort(); return; }
    if (!isOnline()) { controller?.abort(); offline("This device is offline. Reconnect to check the bot."); return; }
    publish({ ...status, state: "yellow", label: "Checking", detail: "Checking the current bot connection.", checkedAt: new Date().toISOString() });
    if (inFlight) { restartRequested = true; controller?.abort(); }
    else void refresh();
  };
  events.addEventListener("online", recheck);
  events.addEventListener("offline", recheck);
  visibilityEvents.addEventListener("visibilitychange", recheck);
  void refresh();
  return () => {
    stopped = true;
    clearTimer();
    controller?.abort();
    events.removeEventListener("online", recheck);
    events.removeEventListener("offline", recheck);
    visibilityEvents.removeEventListener("visibilitychange", recheck);
  };
}

function contactTime(value: string | null) {
  if (!value) return "No contact recorded";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(value)) + " ET";
}

export function DashboardBridgeStatus() {
  const [status, setStatus] = useState<BridgeStatusResponse>(initialStatus);
  useEffect(() => startBridgeStatusPolling(setStatus), []);

  return <details className={`dashboard-bridge-status bridge-status-${status.state}`} onKeyDown={(event) => {
    if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
  }}>
    <summary className="header-button bridge-status-toggle" aria-label={`Bot status: ${status.label}. Show connection details.`}>
      <span className="bridge-status-dot" aria-hidden="true" />
      <span className="bridge-status-label" role="status" aria-live="polite" aria-atomic="true">Bot: {status.label}</span>
      <span className="bridge-status-chevron" aria-hidden="true">⌄</span>
    </summary>
    <div className="bridge-status-panel" role="region" aria-label="Bot connection details" tabIndex={0}>
      <strong>Bot: {status.label}</strong>
      <p>{status.detail}</p>
      <dl>
        <div><dt>Last contact</dt><dd>{contactTime(status.lastSeenAt)}</dd></div>
        {typeof status.pending === "number" ? <div><dt>Pending replies</dt><dd>{status.pending}</dd></div> : null}
      </dl>
      <p>Green confirms the connection; project progress is tracked separately.</p>
      <ul className="bridge-status-legend" aria-label="Connection status colors">
        <li><span className="bridge-status-dot bridge-status-green" aria-hidden="true" />Green — connected</li>
        <li><span className="bridge-status-dot bridge-status-yellow" aria-hidden="true" />Yellow — needs attention</li>
        <li><span className="bridge-status-dot bridge-status-red" aria-hidden="true" />Red — offline</li>
      </ul>
      <p className="bridge-status-help">Starts after Windows sign-in. Keep this PC awake, online, and Codex open. Locking the screen and closing the dashboard are fine.</p>
    </div>
  </details>;
}
