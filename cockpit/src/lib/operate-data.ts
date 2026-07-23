// Operate page — I/O + assembly. Fetches the live rows from Supabase and the
// register/money text from the repo, then hands everything to the pure helpers
// in operate.ts to build the snapshot the page and /api/operate/feed serve.
//
// Server-only: imports the service-key REST client. Never import this from a
// client component.
import { sbSelect, sbInsert, supabaseConfigured } from "./supabase-rest";
import { readRepoFile } from "./repo";
import { parseCsv } from "./csv";
import { buildMoneyView } from "./money";
import {
  mergeRiver,
  sortPending,
  deriveAgentPresence,
  serviceSeverity,
  computeRunwayMonths,
  AGENT_ROSTER,
  type FeedRow,
  type QuestionRow,
  type AnswerRow,
  type OperateSnapshot,
  type SystemStatus,
  type Treasury,
} from "./operate";

const RIVER_WINDOW_DAYS = 7;
const SYSTEMS_MAX = 6;

function windowStartIso(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

async function fetchFeeds(sinceIso: string): Promise<FeedRow[]> {
  return sbSelect<FeedRow>(
    "qa_feeds",
    `select=id,kind,lane,importance,agent,title,body_md,created_at` +
      `&archived_at=is.null&created_at=gte.${sinceIso}` +
      `&order=created_at.desc&limit=80`
  );
}

async function fetchPendingQuestions(): Promise<QuestionRow[]> {
  return sbSelect<QuestionRow>(
    "qa_questions",
    `select=question_id,title,body,tier,agent,status,options,asker_session,created_at` +
      `&status=eq.pending&order=created_at.desc&limit=60`
  );
}

async function fetchRecentAnswers(sinceIso: string): Promise<AnswerRow[]> {
  const answers = await sbSelect<AnswerRow>(
    "qa_answers",
    `select=question_id,answer_value,free_text,answered_at` +
      `&answered_at=gte.${sinceIso}&order=answered_at.desc&limit=40`
  );
  if (answers.length === 0) return answers;
  // Enrich with the question's title/agent for the river message. One extra
  // round-trip keyed by the question_ids we actually need.
  const ids = [...new Set(answers.map((a) => a.question_id))];
  const inList = ids.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(",");
  const questions = await sbSelect<{ question_id: string; title: string | null; agent: string }>(
    "qa_questions",
    `select=question_id,title,agent&question_id=in.(${encodeURIComponent(inList)})&limit=60`
  );
  const byId = new Map(questions.map((q) => [q.question_id, q]));
  return answers.map((a) => {
    const q = byId.get(a.question_id);
    return { ...a, title: q?.title ?? null, agent: q?.agent ?? "claude" };
  });
}

function buildSystems(servicesCsv: string | null): SystemStatus[] {
  if (!servicesCsv) return [];
  const table = parseCsv(servicesCsv);
  const seen = new Set<string>();
  const out: SystemStatus[] = [];
  for (const row of table.rows) {
    const name = (row["service"] ?? "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const env = (row["environment"] ?? "").trim();
    out.push({ name, note: env || "—", severity: serviceSeverity(env) });
    if (out.length >= SYSTEMS_MAX) break;
  }
  return out;
}

function buildTreasury(subsCsv: string | null): Treasury {
  const money = buildMoneyView(subsCsv);
  const reserveRaw = process.env.COCKPIT_CASH_RESERVE_USD;
  const reserve = reserveRaw ? Number(reserveRaw) : null;
  const reserveUsd = reserve !== null && Number.isFinite(reserve) ? reserve : null;
  let pendingNote: string | null = null;
  if (money.cancelMarkedUsd > 0) {
    pendingNote = `−$${money.cancelMarkedUsd.toFixed(0)}/mo marked to cancel`;
  } else if (money.uncostedCount > 0) {
    pendingNote = `${money.uncostedCount} uncosted — floor only`;
  }
  return {
    burnUsd: money.knownMonthlyUsd,
    uncostedCount: money.uncostedCount,
    runwayMonths: computeRunwayMonths(reserveUsd, money.knownMonthlyUsd),
    reserveUsd,
    pendingNote,
  };
}

export async function getOperateSnapshot(): Promise<OperateSnapshot> {
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const sinceIso = windowStartIso(RIVER_WINDOW_DAYS);

  // Register-backed tiles never depend on Supabase — resolve them regardless.
  const [subsCsv, servicesCsv] = await Promise.all([
    readRepoFile("registers/subscriptions.csv"),
    readRepoFile("registers/services.csv"),
  ]);
  const systems = buildSystems(servicesCsv);
  const treasury = buildTreasury(subsCsv);

  if (!supabaseConfigured()) {
    return {
      now,
      events: [],
      pending: [],
      agents: deriveAgentPresence([], [], nowMs, AGENT_ROSTER),
      systems,
      treasury,
      feedOk: false,
    };
  }

  try {
    const [feeds, pendingQuestions, answers] = await Promise.all([
      fetchFeeds(sinceIso),
      fetchPendingQuestions(),
      fetchRecentAnswers(sinceIso),
    ]);
    // Only raise-events for pending questions inside the river window; the dock
    // still shows every pending question regardless of age.
    const recentPending = pendingQuestions.filter((q) => q.created_at >= sinceIso);
    return {
      now,
      events: mergeRiver(feeds, recentPending, answers),
      pending: sortPending(pendingQuestions, nowMs),
      agents: deriveAgentPresence(feeds, pendingQuestions, nowMs, AGENT_ROSTER),
      systems,
      treasury,
      feedOk: true,
    };
  } catch (err) {
    console.error("[operate] snapshot fetch failed:", err);
    return {
      now,
      events: [],
      pending: [],
      agents: deriveAgentPresence([], [], nowMs, AGENT_ROSTER),
      systems,
      treasury,
      feedOk: false,
    };
  }
}

// Insert an answer. The DB trigger flips the question to answered and logs the
// event. Throws on any non-2xx from PostgREST. Callers must already be
// session-gated.
export async function submitAnswer(input: {
  questionId: string;
  answerValue?: string;
  freeText?: string;
}): Promise<void> {
  await sbInsert("qa_answers", {
    question_id: input.questionId,
    answer_value: input.answerValue ?? null,
    free_text: input.freeText ?? null,
    client_meta: { source: "cockpit-operate" },
  });
}

// Read a single question's status — lets the answer route return a clean 404/409
// instead of surfacing a raw FK error when a question is missing or already
// answered.
export async function getQuestionStatus(
  questionId: string
): Promise<{ status: string } | null> {
  const rows = await sbSelect<{ status: string }>(
    "qa_questions",
    `select=status&question_id=eq.${encodeURIComponent(questionId)}&limit=1`
  );
  return rows[0] ?? null;
}
