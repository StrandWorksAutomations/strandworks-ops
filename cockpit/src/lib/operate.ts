// View models for the authenticated Operate activity, decision dock and register tiles.
import { eventSummary, formatLoopAge, groupOwnerLoopItems, OWNER_TIME_ZONE, ownerDay, type OwnerLoopEvent, type OwnerLoopItem } from "./owner-loop";
import type { WorkReport } from "./portfolio";

export type Severity = "ok" | "info" | "warn" | "crit" | "quiet";
export type RiverCategory = "report" | "owner-loop";
export type RecentReport = Pick<WorkReport, "id" | "issue_id" | "objective_id" | "agent" | "result" | "next_action" | "created_at">;

export type RiverEvent = {
  id: string;
  ts: string;
  agent: string;
  category: RiverCategory;
  severity: Severity;
  proj: string;
  msg: string;
  href?: string;
  detail?: string;
};

export type PendingDecision = Pick<OwnerLoopItem, "ref" | "title" | "project"> & {
  ageLabel: string;
};

export type AgentActivity = {
  agent: string;
  lastSeen: string;
  detail: string;
};

export type SystemStatus = {
  name: string;
  note: string;
  severity: Severity;
};

export type Treasury = {
  burnUsd: number;
  runwayMonths: number | null;
  pendingNote: string | null;
};

export type OperateSnapshot = {
  now: string;
  events: RiverEvent[];
  pending: PendingDecision[] | null;
  agents: AgentActivity[];
  systems: SystemStatus[] | null;
  treasury: Treasury | null;
  reportsAvailable: boolean;
  ownerActivityAvailable: boolean;
};

export const RIVER_WINDOW_DAYS = 7;
export const RIVER_CAP = 120;

function excerpt(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

export function buildOperateRiver(reports: RecentReport[], events: OwnerLoopEvent[], now: Date): RiverEvent[] {
  const reportRows: RiverEvent[] = reports.map((report) => ({
    id: `report:${report.id}`,
    ts: report.created_at,
    agent: report.agent,
    category: "report",
    severity: "info",
    proj: report.issue_id ?? report.objective_id ?? "Portfolio",
    msg: excerpt(report.result, 220),
    href: report.objective_id ? `/focus#${encodeURIComponent(report.objective_id)}` : "/focus",
    detail: report.next_action ? excerpt(report.next_action, 220) : undefined,
  }));
  const loopRows: RiverEvent[] = events.map((event) => ({
    id: `loop:${event.id}`,
    ts: event.at,
    agent: event.actor,
    category: "owner-loop",
    severity: event.type === "filed" ? "info" : "ok",
    proj: event.item?.project ?? "Owner loop",
    msg: excerpt(eventSummary({ ...event, note: null }), 120),
    href: "/timeline",
    detail: event.item ? excerpt(event.item.title, 220) : undefined,
  }));
  const cutoff = now.getTime() - RIVER_WINDOW_DAYS * 86400_000;
  return [...reportRows, ...loopRows].filter((event) => {
    const time = Date.parse(event.ts);
    return time >= cutoff && time <= now.getTime();
  }).sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, RIVER_CAP);
}

export function operatePendingDecisions(items: OwnerLoopItem[], now: Date): PendingDecision[] {
  return groupOwnerLoopItems(items, now).needsYou.map(({ ref, title, project, created_at }) => ({
    ref, title, project, ageLabel: formatLoopAge(created_at, now),
  }));
}

// This represents recorded events; chat presence is not observable here.
export function deriveAgentActivity(events: RiverEvent[], now: Date): AgentActivity[] {
  const latest = new Map<string, AgentActivity>();
  for (const event of events) {
    const agent = event.agent.toLowerCase();
    if (!agent || agent === "owner" || agent === "system" || latest.has(agent)) continue;
    latest.set(agent, { agent, lastSeen: formatLoopAge(event.ts, now), detail: event.msg });
  }
  return [...latest.values()];
}

export type BandKey = "now" | "hour" | "today" | "earlier";
export type RiverBand = { key: BandKey; label: string; events: RiverEvent[] };

const BAND_LABEL: Record<BandKey, string> = {
  now: "Now",
  hour: "Last hour",
  today: "Today",
  earlier: "Earlier",
};

export function bandOf(tsIso: string, nowMs: number): BandKey {
  const t = new Date(tsIso).getTime();
  const diffMin = (nowMs - t) / 60000;
  if (diffMin < 5) return "now";
  if (diffMin < 60) return "hour";
  if (Number.isFinite(t) && ownerDay(tsIso) === ownerDay(new Date(nowMs).toISOString())) return "today";
  return "earlier";
}

// The server and the owner's phone can use different system time zones.
// Render both the river and the live clock in the owner's Eastern time zone.
const OPERATE_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: OWNER_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatOperateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? OPERATE_CLOCK.format(date) : "--:--:--";
}

// Groups newest-first events into ordered time bands. The "Now" band is always
// present (even when empty) so the live edge of the river is always anchored.
export function groupIntoBands(events: RiverEvent[], nowMs: number): RiverBand[] {
  const buckets: Record<BandKey, RiverEvent[]> = { now: [], hour: [], today: [], earlier: [] };
  for (const ev of events) buckets[bandOf(ev.ts, nowMs)].push(ev);
  const order: BandKey[] = ["now", "hour", "today", "earlier"];
  const out: RiverBand[] = [];
  for (const key of order) {
    if (key !== "now" && buckets[key].length === 0) continue;
    out.push({ key, label: BAND_LABEL[key], events: buckets[key] });
  }
  return out;
}

// ---------- Systems (from the services register) ----------

export function serviceSeverity(environment: string): Severity {
  const e = (environment ?? "").toLowerCase();
  if (/degraded|down|error|fail/.test(e)) return "warn";
  if (/paused|inactive|frozen|stopped|retired/.test(e)) return "quiet";
  if (/production/.test(e)) return "ok";
  return "info";
}

// ---------- Treasury ----------

export function computeRunwayMonths(
  reserveUsd: number | null,
  burnUsd: number
): number | null {
  if (reserveUsd === null || !Number.isFinite(reserveUsd) || reserveUsd <= 0) return null;
  if (!Number.isFinite(burnUsd) || burnUsd <= 0) return null;
  return Math.floor(reserveUsd / burnUsd);
}
