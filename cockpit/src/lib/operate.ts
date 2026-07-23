// Operate page — pure transform/merge/sort logic for the live event river,
// the decision dock, agent presence, and the systems/treasury tiles.
//
// This module does NO I/O: it takes already-fetched Supabase rows (and register
// text shaped elsewhere) and turns them into the view models the page renders.
// All Supabase access lives in supabase-rest.ts / operate-data.ts so this file
// stays unit-testable without a network or a service key.
//
// Severity grammar (the ONLY thing colour encodes, per the design reference):
//   ok    — signal blue  (routine / a resolved decision reading as done)
//   info  — ice blue      (system / deploy / scout awareness)
//   warn  — amber         (needs you: any open decision, flagged health)
//   crit  — red           (errors / failures only)
//   quiet — muted ink      (idle / no-op)

export type Severity = "ok" | "info" | "warn" | "crit" | "quiet";
export type RiverCategory = "agent" | "deploy" | "decision" | "scout" | "system";
export type Tier = "urgent" | "normal" | "fyi";

// ---------- Raw Supabase row shapes (only the columns we read) ----------

export type FeedRow = {
  id: string;
  kind: string;
  lane: string | null;
  importance: number;
  agent: string;
  title: string | null;
  body_md: string | null;
  created_at: string;
};

export type QuestionRow = {
  question_id: string;
  title: string | null;
  body: string;
  tier: string;
  agent: string;
  status: string;
  options: unknown;
  asker_session: string | null;
  created_at: string;
};

export type AnswerRow = {
  question_id: string;
  answer_value: string | null;
  free_text: string | null;
  answered_at: string;
  // title/tier/agent joined in from the question, when available
  title?: string | null;
  agent?: string | null;
};

// ---------- View models ----------

export type RiverEvent = {
  id: string; // stable across polls so the client can diff for arrivals
  ts: string; // ISO
  agent: string;
  category: RiverCategory;
  severity: Severity;
  proj: string;
  msg: string;
  detail?: { head: string; body: string };
};

export type PendingDecision = {
  questionId: string;
  tier: Tier;
  agent: string;
  title: string;
  bodyMd: string;
  options: { label: string; value: string }[];
  source: string; // asker_session, or the agent name as a fallback
  createdAt: string;
  ageLabel: string;
};

export type AgentPresence = {
  agent: string;
  active: boolean;
  status: string; // "ACTIVE" | "IDLE · 41M" | "OFFLINE"
  lastSeenIso: string | null;
  detail: string; // last activity summary, or "no recorded activity"
};

export type SystemStatus = {
  name: string;
  note: string;
  severity: Severity;
};

export type Treasury = {
  burnUsd: number;
  uncostedCount: number;
  runwayMonths: number | null;
  reserveUsd: number | null;
  pendingNote: string | null;
};

export type OperateSnapshot = {
  now: string;
  events: RiverEvent[];
  pending: PendingDecision[];
  agents: AgentPresence[];
  systems: SystemStatus[];
  treasury: Treasury;
  feedOk: boolean; // false when Supabase is unreachable/unconfigured
};

// ---------- Constants ----------

export const AGENT_ROSTER = ["claude", "codex", "antigravity"] as const;
export const RIVER_CAP = 120;
export const PRESENCE_ACTIVE_MS = 10 * 60 * 1000; // "active" if seen in last 10 min
const SCOUT_KINDS = new Set(["claude-scout", "tech-scout"]);
const ERROR_RE = /\b(fail|failed|error|down|crash|broken|critical)\b|🔴/i;
const DEPLOY_RE = /\b(deploy|deployed|build|vercel|rollback|release|shipped)\b/i;

// ---------- Feed mapping ----------

export function feedCategory(kind: string, title: string): RiverCategory {
  if (SCOUT_KINDS.has(kind) || /scout/i.test(kind)) return "scout";
  if (DEPLOY_RE.test(kind) || DEPLOY_RE.test(title)) return "deploy";
  return "agent";
}

export function feedSeverity(kind: string, importance: number, title: string): Severity {
  if (ERROR_RE.test(title) || ERROR_RE.test(kind)) return "crit";
  if (SCOUT_KINDS.has(kind)) return "info";
  if (importance >= 4) return "warn";
  if (importance <= 1) return "quiet";
  return "info";
}

// A short, single-line project/lane label for the river's project column.
export function laneLabel(lane: string | null): string {
  if (!lane) return "—";
  return lane.charAt(0).toUpperCase() + lane.slice(1);
}

// Strip YAML frontmatter and markdown noise to a short plain-text excerpt.
export function excerpt(md: string | null, max = 160): string {
  if (!md) return "";
  let s = md.replace(/^---\n[\s\S]*?\n---\n?/, ""); // drop frontmatter block
  s = s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

export function feedToEvent(f: FeedRow): RiverEvent {
  const title = f.title ?? "(untitled)";
  const category = feedCategory(f.kind, title);
  const severity = feedSeverity(f.kind, f.importance, title);
  const ev: RiverEvent = {
    id: `feed:${f.id}`,
    ts: f.created_at,
    agent: f.agent || "claude",
    category,
    severity,
    proj: laneLabel(f.lane),
    msg: title,
  };
  // Only attach a rich card for things that warrant a second glance, matching
  // the reference's restraint (it never cards routine rows).
  if ((severity === "warn" || severity === "crit") && f.body_md) {
    const body = excerpt(f.body_md, 220);
    if (body) ev.detail = { head: title, body };
  }
  return ev;
}

// ---------- Question mapping ----------

export function parseOptions(raw: unknown): { label: string; value: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { label: string; value: string }[] = [];
  for (const o of raw) {
    if (o && typeof o === "object") {
      const rec = o as Record<string, unknown>;
      const label = typeof rec.label === "string" ? rec.label : undefined;
      const value =
        typeof rec.value === "string"
          ? rec.value
          : typeof rec.value === "number"
            ? String(rec.value)
            : label;
      if (label && value) out.push({ label, value });
    }
  }
  return out;
}

export function normalizeTier(tier: string): Tier {
  return tier === "urgent" || tier === "fyi" ? tier : "normal";
}

export function questionRaisedEvent(q: QuestionRow): RiverEvent {
  const title = q.title ?? q.question_id;
  return {
    id: `q-raised:${q.question_id}`,
    ts: q.created_at,
    agent: q.agent || "claude",
    category: "decision",
    severity: "warn", // an open decision needs you
    proj: decisionSource(q),
    msg: `Raised decision — "${title}"`,
  };
}

export function answerToEvent(a: AnswerRow): RiverEvent {
  const title = a.title ?? a.question_id;
  const chosen = a.answer_value || (a.free_text ? "replied" : "answered");
  return {
    id: `q-answered:${a.question_id}:${a.answered_at}`,
    ts: a.answered_at,
    agent: a.agent || "claude",
    category: "decision",
    severity: "ok", // resolved reads as routine
    proj: "—",
    msg: `Decision answered — "${title}" → ${chosen}`,
  };
}

function decisionSource(q: QuestionRow): string {
  const s = (q.asker_session ?? "").trim();
  if (s && s !== "claude-cli") return s;
  return "—";
}

// ---------- River assembly ----------

export function mergeRiver(
  feeds: FeedRow[],
  pendingQuestions: QuestionRow[],
  answers: AnswerRow[],
  cap = RIVER_CAP
): RiverEvent[] {
  const events: RiverEvent[] = [
    ...feeds.map(feedToEvent),
    ...pendingQuestions.map(questionRaisedEvent),
    ...answers.map(answerToEvent),
  ];
  events.sort((a, b) => b.ts.localeCompare(a.ts));
  return events.slice(0, cap);
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
  if (new Date(t).toDateString() === new Date(nowMs).toDateString()) return "today";
  return "earlier";
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

// ---------- Decision dock ----------

const TIER_RANK: Record<Tier, number> = { urgent: 0, normal: 1, fyi: 2 };

export function sortPending(questions: QuestionRow[], nowMs: number): PendingDecision[] {
  return questions
    .map((q) => {
      const tier = normalizeTier(q.tier);
      return {
        questionId: q.question_id,
        tier,
        agent: q.agent || "claude",
        title: q.title ?? q.question_id,
        bodyMd: q.body ?? "",
        options: parseOptions(q.options),
        source: decisionSource(q),
        createdAt: q.created_at,
        ageLabel: ageLabel(q.created_at, nowMs),
      };
    })
    .sort((a, b) => {
      const t = TIER_RANK[a.tier] - TIER_RANK[b.tier];
      if (t !== 0) return t;
      return a.createdAt.localeCompare(b.createdAt); // older first within a tier
    });
}

// ---------- Agent presence ----------

export function deriveAgentPresence(
  feeds: FeedRow[],
  questions: QuestionRow[],
  nowMs: number,
  roster: readonly string[] = AGENT_ROSTER
): AgentPresence[] {
  const last = new Map<string, { ts: number; iso: string; label: string }>();
  const consider = (agent: string, iso: string, label: string) => {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return;
    const prev = last.get(agent);
    if (!prev || t > prev.ts) last.set(agent, { ts: t, iso, label });
  };
  for (const f of feeds) consider(f.agent || "claude", f.created_at, f.title ?? f.kind);
  for (const q of questions)
    consider(q.agent || "claude", q.created_at, `Raised: ${q.title ?? q.question_id}`);

  const agents = new Set<string>([...roster, ...last.keys()]);
  return [...agents]
    .map((agent) => {
      const seen = last.get(agent);
      if (!seen) {
        return {
          agent,
          active: false,
          status: "OFFLINE",
          lastSeenIso: null,
          detail: "no recorded activity",
        };
      }
      const active = nowMs - seen.ts <= PRESENCE_ACTIVE_MS;
      return {
        agent,
        active,
        status: active ? "ACTIVE" : `IDLE · ${ageLabel(seen.iso, nowMs)}`,
        lastSeenIso: seen.iso,
        detail: seen.label,
      };
    })
    .sort((a, b) => {
      // Active first, then most-recently-seen, then roster order.
      if (a.active !== b.active) return a.active ? -1 : 1;
      const at = a.lastSeenIso ? new Date(a.lastSeenIso).getTime() : -Infinity;
      const bt = b.lastSeenIso ? new Date(b.lastSeenIso).getTime() : -Infinity;
      return bt - at;
    });
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

// ---------- Answer input validation (shared by the API route + tests) ----------

export const ANSWER_VALUE_MAX = 200;
export const FREE_TEXT_MAX = 4000;
const QUESTION_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export type AnswerInput = { questionId: string; answerValue?: string; freeText?: string };
export type ValidateResult =
  | { ok: true; value: AnswerInput }
  | { ok: false; error: string; status: number };

export function validateAnswerInput(body: unknown): ValidateResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid JSON body", status: 400 };
  }
  const b = body as Record<string, unknown>;
  const questionId = b.questionId;
  if (typeof questionId !== "string" || !QUESTION_ID_RE.test(questionId)) {
    return { ok: false, error: "questionId must be a valid slug", status: 400 };
  }
  let answerValue: string | undefined;
  if (b.answerValue !== undefined && b.answerValue !== null) {
    if (typeof b.answerValue !== "string" || b.answerValue.length > ANSWER_VALUE_MAX) {
      return { ok: false, error: "answerValue must be a short string", status: 400 };
    }
    answerValue = b.answerValue;
  }
  let freeText: string | undefined;
  if (b.freeText !== undefined && b.freeText !== null) {
    if (typeof b.freeText !== "string" || b.freeText.length > FREE_TEXT_MAX) {
      return { ok: false, error: "freeText must be a string", status: 400 };
    }
    const trimmed = b.freeText.trim();
    freeText = trimmed.length ? trimmed : undefined;
  }
  if (!answerValue && !freeText) {
    return { ok: false, error: "an answer value or free text is required", status: 400 };
  }
  return { ok: true, value: { questionId, answerValue, freeText } };
}

// ---------- Small helpers ----------

export function ageLabel(iso: string, nowMs: number): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const sec = Math.max(0, Math.round((nowMs - t) / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  return `${day}d`;
}
