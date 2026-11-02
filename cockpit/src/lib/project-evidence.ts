import { checksForProject, latestCheck, type CheckRow } from "./checks";
import { ownerDay } from "./owner-loop";
import { portfolioAttention, sameProject, type Portfolio } from "./portfolio";
import type { ProjectDef } from "./projects";

type Phase = { label: string; detail?: string };
const PHASES = {
  local: { in_progress: "In progress (reported)", review_candidate: "Review candidate (reported)", complete: "Complete (reported)", blocked: "Blocked (reported)" },
  deployment: { not_deployed: "Not deployed (reported)", private_review: "Private review (reported)", production_deployed: "Production deployed (reported)", production_verified: "Production verified (reported)", blocked: "Blocked (reported)" },
  owner_acceptance: { pending: "Pending owner review", accepted: "Accepted (reported)", changes_requested: "Changes requested (reported)" },
};
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function delivery(validation: string | undefined) {
  let data: Record<string, unknown> = {};
  try { data = object(object(JSON.parse(validation || "{}")).delivery); } catch { /* unstructured reports remain unstructured */ }
  const phase = (key: keyof typeof PHASES): Phase => {
    const value = object(data[key]);
    const labels: Record<string, string> = PHASES[key];
    const label = typeof value.status === "string" && Object.hasOwn(labels, value.status) ? labels[value.status] : "Not recorded";
    return { label, ...(label !== "Not recorded" && typeof value.detail === "string" ? { detail: value.detail } : {}) };
  };
  return { local: phase("local"), deployment: phase("deployment"), owner_acceptance: phase("owner_acceptance") };
}
function validDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(`${day}T12:00:00Z`))
    && new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day;
}

export function projectEvidence(project: ProjectDef, checks: CheckRow[], portfolio: Portfolio | null, now: Date) {
  const today = ownerDay(now.toISOString());
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6); // today and the six preceding Eastern calendar dates
  const since = start.toISOString().slice(0, 10);
  const objectives = (portfolio?.objectives ?? []).filter((o) => sameProject(project.path || project.slug, o.project));
  const ids = new Set(objectives.map((o) => o.id));
  const reports = (portfolio?.reports ?? []).filter((r) => r.objective_id && ids.has(r.objective_id));
  const usable = (value: string) => Number.isFinite(Date.parse(value)) && Date.parse(value) <= now.getTime();
  const report = reports.filter((r) => usable(r.created_at))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id)[0] ?? null;
  const check = latestCheck(checks, project);
  const checkAge = !check ? "none" : !validDay(check.date) ? "invalid" : check.date > today ? "future" : check.date >= since ? "recent" : "historical";
  const recent = Boolean(report && ownerDay(report.created_at) >= since)
    || checksForProject(checks, project).some((row) => validDay(row.date) && row.date >= since && row.date <= today);
  const scoped = portfolio ? { ...portfolio, objectives, metrics: portfolio.metrics.filter((m) => ids.has(m.objective_id)),
    reports: reports.filter((r) => usable(r.created_at)), leases: portfolio.leases.filter((l) => sameProject(project.path || project.slug, l.project)) } : null;
  return { objectives, report, recent, check, checkAge, delivery: delivery(report?.validation),
    reportTimeInvalid: reports.some((r) => !usable(r.created_at)), attention: scoped ? portfolioAttention(scoped, now) : [] };
}
