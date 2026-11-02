export type Objective = {
  id: string; project: string; title: string; outcome: string; priority: number;
  target_at: string; review_at: string; accountable_owner: string;
  linear_project_id?: string | null; issue_ids: string[];
  metric_definitions: { id: string; label?: string; target?: string; [key: string]: unknown }[];
  status: "active" | "paused" | "complete"; updated_at: string;
};
export type Observation = { id: number; objective_id: string; metric_id: string; value: unknown; observed_at: string; source: string; evidence: unknown[]; created_at?: string };
export type WorkLease = { issue_id: string; objective_id: string | null; project: string; agent: string; session_id: string; branch: string; worktree: string; claimed_at: string; renewed_at: string; expires_at: string; released_at: string | null; checkpoint: string | null; next_action: string | null; recovery_note?: string | null };
export type WorkReport = { id: number; issue_id: string | null; objective_id: string | null; agent: string; session_id: string; result: string; validation: string; remaining: string; next_action: string; evidence: unknown[]; created_at: string };
export type Portfolio = { checked_at: string; objectives: Objective[]; metrics: Observation[]; leases: WorkLease[]; reports: WorkReport[] };

const ALIASES: Record<string, string> = { "tenetrix-insight": "badgemedia", "kinetic-clinician": "highest-paying", "strandworks-medical": "contracting-startup", "sag": "sag-international", "3rd-rider": "3rdrider", "portfolio": "strandworks-ops" };
export function projectKey(project: string) {
  const key = project.replace(/\/+$/, "").split("/").pop()!.toLowerCase();
  return ALIASES[key] ?? key;
}
export function sameProject(a: string, b: string) { return projectKey(a) === projectKey(b); }
export function latestMetric(metrics: Observation[], objective: string, metric: string) {
  const candidates = metrics.filter((m) => m.objective_id === objective && m.metric_id === metric);
  const effectiveTime = (m: Observation) => Date.parse(m.value !== null && typeof m.value === "object" && "source_observed_at" in m.value ? (m.created_at ?? m.observed_at) : m.observed_at);
  return candidates.sort((a, b) => effectiveTime(b) - effectiveTime(a) || b.id - a.id)[0];
}
export function leaseState(lease: WorkLease, now: Date): "released" | "active" | "needs recovery" {
  if (lease.released_at) return "released";
  return Date.parse(lease.expires_at) > now.getTime() ? "active" : "needs recovery";
}
export function metricValue(value: unknown): string {
  if (value === null || value === undefined) return "Unknown";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
export function safeEvidence(value: unknown): { label: string; url: string } | null {
  const url = typeof value === "string" ? value : value && typeof value === "object" ? (value as { url?: unknown }).url : null;
  if (typeof url !== "string") return null;
  try { const parsed = new URL(url); return parsed.protocol === "https:" && !parsed.username && !parsed.password ? { label: typeof value === "object" && value && "label" in value ? String(value.label) : parsed.hostname, url } : null; } catch { return null; }
}
export function portfolioAttention(data: Portfolio, now: Date) {
  const items: { id: string; project: string; title: string; detail: string }[] = [];
  for (const o of data.objectives.filter((o) => o.status !== "complete")) {
    if (Date.parse(o.review_at) < now.getTime()) items.push({ id: `review-${o.id}`, project: o.project, title: `Review overdue: ${o.title}`, detail: o.review_at });
    if (o.status === "active" && Date.parse(o.target_at) < now.getTime()) items.push({ id: `target-${o.id}`, project: o.project, title: `Delivery overdue: ${o.title}`, detail: o.target_at });
    const latest = data.reports.filter((r) => r.objective_id === o.id).map((r) => r.created_at).sort().at(-1) ?? o.updated_at;
    if (o.status === "active" && Date.parse(latest) < now.getTime() - 86400000) items.push({ id: `report-${o.id}`, project: o.project, title: `Checkpoint missing: ${o.title}`, detail: `Last evidence ${latest}` });
  }
  for (const l of data.leases.filter((l) => leaseState(l, now) === "needs recovery")) items.push({ id: `lease-${l.issue_id}`, project: l.project, title: `Recover ${l.issue_id}`, detail: l.next_action || l.checkpoint || "Inspect issue and working state before claiming." });
  return items;
}
