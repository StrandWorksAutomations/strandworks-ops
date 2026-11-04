import "server-only";
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import { fetchOwnerLoopEvents, fetchOwnerLoopItems } from "./owner-loop-data";
import { readRepoFile } from "./repo";
import { parseCsv } from "./csv";
import { buildMoneyView } from "./money";
import {
  buildOperateRiver,
  operatePendingDecisions,
  deriveAgentActivity,
  serviceSeverity,
  computeRunwayMonths,
  RIVER_WINDOW_DAYS,
  RIVER_CAP,
  type OperateSnapshot,
  type RecentReport,
  type SystemStatus,
  type Treasury,
} from "./operate";

const SYSTEMS_MAX = 6;

async function fetchRecentReports(now: Date): Promise<RecentReport[] | null> {
  if (!supabaseConfigured()) return null;
  const since = new Date(now.getTime() - RIVER_WINDOW_DAYS * 86400_000).toISOString();
  try {
    return await sbSelect<RecentReport>("portfolio_recent_reports",
      "select=id,issue_id,objective_id,agent,result,next_action,created_at" +
      `&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc,id.desc&limit=${RIVER_CAP}`);
  } catch {
    return null;
  }
}

function buildSystems(servicesCsv: string): SystemStatus[] {
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

function buildTreasury(subsCsv: string): Treasury {
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
    runwayMonths: computeRunwayMonths(reserveUsd, money.knownMonthlyUsd),
    pendingNote,
  };
}

export async function getOperateSnapshot(): Promise<OperateSnapshot> {
  const now = new Date();
  const [reports, ownerEvents, ownerItems, subsCsv, servicesCsv] = await Promise.all([
    fetchRecentReports(now),
    fetchOwnerLoopEvents(RIVER_WINDOW_DAYS),
    fetchOwnerLoopItems(),
    readRepoFile("registers/subscriptions.csv").catch(() => null),
    readRepoFile("registers/services.csv").catch(() => null),
  ]);
  const events = buildOperateRiver(reports ?? [], ownerEvents ?? [], now);
  return {
    now: now.toISOString(),
    events,
    pending: ownerItems === null ? null : operatePendingDecisions(ownerItems, now),
    agents: deriveAgentActivity(events, now),
    systems: servicesCsv === null ? null : buildSystems(servicesCsv),
    treasury: subsCsv === null ? null : buildTreasury(subsCsv),
    reportsAvailable: reports !== null,
    ownerActivityAvailable: ownerEvents !== null,
  };
}
