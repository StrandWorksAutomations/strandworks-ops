import type { DueItem } from "./due-items";

export type OwnerLoopKind = "decision" | "deadline" | "milestone" | "alert";
export type OwnerLoopStatus = "open" | "ruled" | "picked_up" | "done" | "dropped";

// Public fields only. Routing metadata and dedupe keys never enter a view.
export type OwnerLoopItem = {
  id: string;
  ref: string;
  kind: OwnerLoopKind;
  project: string;
  title: string;
  body: string | null;
  options: { key: string; label: string }[];
  recommended: string | null;
  origin_agent: string | null;
  due_at: string | null;
  status: OwnerLoopStatus;
  ruling: string | null;
  ruling_note: string | null;
  ruled_via: string | null;
  ruled_at: string | null;
  picked_up_at: string | null;
  picked_up_by: string | null;
  outcome_note: string | null;
  done_at: string | null;
  repeat_count: number;
  created_at: string;
  updated_at: string;
};

export type OwnerLoopEvent = {
  id: string;
  item_id: string;
  at: string;
  actor: string;
  type: string;
  note: string | null;
  item?: { ref: string; title: string; project: string } | null;
};

export type OwnerLoopRuleInput = { ref: string; ruling: string; note?: string };
export type OwnerLoopRuleValidation =
  | { ok: true; value: OwnerLoopRuleInput }
  | { ok: false; error: string };

export function validateOwnerLoopRuleInput(raw: unknown): OwnerLoopRuleValidation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Expected a ruling object." };
  }
  const input = raw as Record<string, unknown>;
  if (typeof input.ref !== "string" || !/^D-\d{4,}$/.test(input.ref)) {
    return { ok: false, error: "Ref must look like D-0001." };
  }
  if (typeof input.ruling !== "string" || !input.ruling.trim() || input.ruling.length > 500) {
    return { ok: false, error: "Ruling must contain 1–500 characters." };
  }
  if (input.note !== undefined && (typeof input.note !== "string" || input.note.length > 2000)) {
    return { ok: false, error: "Note must be text of at most 2000 characters." };
  }
  const value: OwnerLoopRuleInput = { ref: input.ref, ruling: input.ruling.trim() };
  if (typeof input.note === "string" && input.note.trim()) value.note = input.note.trim();
  return { ok: true, value };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function timestamp(iso: string | null): number {
  const value = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(value) ? value : Infinity;
}

export function isStalled(item: OwnerLoopItem, now: Date): boolean {
  return item.status === "ruled" && now.getTime() - timestamp(item.ruled_at) > DAY_MS;
}

function compareDueThenCreated(a: OwnerLoopItem, b: OwnerLoopItem): number {
  const dueA = timestamp(a.due_at);
  const dueB = timestamp(b.due_at);
  if (dueA !== dueB) return dueA - dueB;
  return timestamp(a.created_at) - timestamp(b.created_at);
}

export type OwnerLoopGroups = {
  needsYou: OwnerLoopItem[];
  waiting: OwnerLoopItem[];
  closed: OwnerLoopItem[];
  alerts: OwnerLoopItem[];
};

export function groupOwnerLoopItems(items: OwnerLoopItem[], now: Date): OwnerLoopGroups {
  const result: OwnerLoopGroups = { needsYou: [], waiting: [], closed: [], alerts: [] };
  const cutoff = now.getTime() - 14 * DAY_MS;
  for (const item of items) {
    const closed = item.status === "done" || item.status === "dropped";
    if (item.kind === "alert") {
      if (!closed) result.alerts.push(item);
      continue;
    }
    if (item.kind === "decision" && item.status === "open") result.needsYou.push(item);
    if (item.status === "ruled" || item.status === "picked_up") result.waiting.push(item);
    if (closed) {
      const closedAt = timestamp(item.done_at ?? item.updated_at);
      if (closedAt >= cutoff && closedAt <= now.getTime()) result.closed.push(item);
    }
  }
  result.needsYou.sort(compareDueThenCreated);
  result.waiting.sort((a, b) => {
    const stalled = Number(isStalled(b, now)) - Number(isStalled(a, now));
    if (stalled !== 0) return stalled;
    const status = Number(a.status === "picked_up") - Number(b.status === "picked_up");
    if (status !== 0) return status;
    const aAt = a.status === "picked_up" ? a.picked_up_at : a.ruled_at;
    const bAt = b.status === "picked_up" ? b.picked_up_at : b.ruled_at;
    return timestamp(aAt ?? a.created_at) - timestamp(bAt ?? b.created_at);
  });
  result.closed.sort((a, b) => timestamp(b.done_at ?? b.updated_at) - timestamp(a.done_at ?? a.updated_at));
  result.alerts.sort(compareDueThenCreated);
  return result;
}

export type TimelineEntry = {
  id: string;
  source: "owner-loop" | "business";
  ref: string | null;
  title: string;
  project: string;
  kind: string;
  dueAt: string;
  overdue: boolean;
  href: string;
  detail: string;
};

function businessClosed(status: string): boolean {
  return /^(done|dropped|closed|complete|completed|cancelled|canceled|resolved|waived|archived)\b/i.test(status.trim());
}

export function buildTimelineUpcoming(items: OwnerLoopItem[], dueItems: DueItem[], now: Date): TimelineEntry[] {
  const result: TimelineEntry[] = [];
  const nowMs = now.getTime();
  const through = nowMs + 30 * DAY_MS;
  const today = now.toISOString().slice(0, 10);
  for (const item of items) {
    if (!item.due_at || item.status === "done" || item.status === "dropped") continue;
    if (item.kind !== "deadline" && item.kind !== "milestone"
      && !(item.kind === "decision" && item.status === "open")) continue;
    const due = timestamp(item.due_at);
    if (!Number.isFinite(due) || due > through) continue;
    result.push({
      id: `owner-loop:${item.id}`,
      source: "owner-loop",
      ref: item.ref,
      title: item.title,
      project: item.project,
      kind: item.kind,
      dueAt: item.due_at,
      overdue: due < nowMs,
      href: `/decisions#${item.ref}`,
      detail: [item.ref, item.origin_agent, item.status.replace("_", " ")].filter(Boolean).join(" · "),
    });
  }
  for (const [index, item] of dueItems.entries()) {
    if (!item.dueOn || businessClosed(item.status)) continue;
    const due = timestamp(item.dueOn);
    if (!Number.isFinite(due) || due > through) continue;
    result.push({
      id: `business:${item.entity}:${item.kind}:${item.item}:${item.dueOn}:${index}`,
      source: "business",
      ref: null,
      title: item.item,
      project: item.entity || "business",
      kind: item.kind || "business",
      dueAt: item.dueOn,
      overdue: item.dueOn < today,
      href: "/business",
      detail: [item.entity, item.jurisdiction, item.status, item.feeUsd !== null ? `$${item.feeUsd.toFixed(2)}` : null]
        .filter(Boolean).join(" · "),
    });
  }
  return result.sort((a, b) => Number(b.overdue) - Number(a.overdue) || timestamp(a.dueAt) - timestamp(b.dueAt));
}

export type TimelineEventDay = { day: string; events: OwnerLoopEvent[] };

export function groupTimelineEvents(events: OwnerLoopEvent[], now: Date): TimelineEventDay[] {
  const cutoff = now.getTime() - 30 * DAY_MS;
  const ordered = events.filter((event) => {
    const at = timestamp(event.at);
    return at >= cutoff && at <= now.getTime();
  }).sort((a, b) => timestamp(b.at) - timestamp(a.at));
  const days = new Map<string, OwnerLoopEvent[]>();
  for (const event of ordered) {
    const day = new Date(event.at).toISOString().slice(0, 10);
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(event);
  }
  return [...days].map(([day, grouped]) => ({ day, events: grouped }));
}

export function eventSummary(event: OwnerLoopEvent): string {
  const actor = event.actor === "owner" ? "Owner" : event.actor;
  const ref = event.item?.ref ?? "item";
  const note = event.note?.trim();
  switch (event.type) {
    case "ruled": return `${actor} ruled ${ref}${note ? ` → ${note}` : ""}`;
    case "pickup": return `${actor} picked up ${ref}${note ? `: ${note}` : ""}`;
    case "done": return `${actor} done ${ref}${note ? `: ${note}` : ""}`;
    case "filed": return `${actor} filed ${ref}${note ? `: ${note}` : ""}`;
    case "repeated": return `${actor} asked again ${ref}${note ? `: ${note}` : ""}`;
    case "drop": return `${actor} dropped ${ref}${note ? `: ${note}` : ""}`;
    case "resolve": return `${actor} resolved ${ref}${note ? `: ${note}` : ""}`;
    default: return `${actor} ${event.type} ${ref}${note ? `: ${note}` : ""}`;
  }
}

export function formatLoopAge(iso: string, now: Date): string {
  const age = now.getTime() - timestamp(iso);
  if (!Number.isFinite(age)) return "unknown age";
  if (age < 60 * 1000) return "just now";
  if (age < 60 * 60 * 1000) return `${Math.floor(age / (60 * 1000))}m ago`;
  if (age < DAY_MS) return `${Math.floor(age / (60 * 60 * 1000))}h ago`;
  return `${Math.floor(age / DAY_MS)}d ago`;
}
