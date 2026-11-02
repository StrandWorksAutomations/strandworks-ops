export type Objective = {
  id: string; project: string; title: string; outcome: string; priority: number;
  target_at: string; review_at: string; accountable_owner: string;
  linear_project_id?: string | null; issue_ids: string[];
  metric_definitions: { id: string; label?: string; target?: string; [key: string]: unknown }[];
  status: "active" | "paused" | "complete"; updated_at: string; created_at?: string;
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
function timestamp(value: unknown): number | null {
  const time = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
}
export function latestMetric(metrics: Observation[], objective: string, metric: string) {
  const candidates = metrics.filter((m) => m.objective_id === objective && m.metric_id === metric);
  const effectiveTime = (m: Observation) => (m.value !== null && typeof m.value === "object" && "source_observed_at" in m.value ? timestamp(m.created_at) ?? timestamp(m.observed_at) : timestamp(m.observed_at)) ?? -Infinity;
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
    const activity = [timestamp(o.created_at) ?? timestamp(o.updated_at),
      ...data.reports.filter((r) => r.objective_id === o.id).map((r) => timestamp(r.created_at)),
      ...data.leases.filter((l) => l.objective_id === o.id && l.checkpoint).map((l) => timestamp(l.renewed_at))]
      .filter((time): time is number => time !== null);
    const latest = activity.length ? Math.max(...activity) : now.getTime();
    if (o.status === "active" && latest < now.getTime() - 86400000) items.push({ id: `report-${o.id}`, project: o.project, title: `Checkpoint missing: ${o.title}`, detail: `Last evidence ${new Date(latest).toISOString()}` });
    if (o.status !== "active") continue;
    const definitions = new Map((o.metric_definitions ?? []).map((definition) => [definition.id, definition]));
    const metricIds = new Set([...definitions.keys(), ...(data.metrics ?? []).filter((m) => m.objective_id === o.id).map((m) => m.metric_id)]);
    for (const metricId of metricIds) {
      const definition = definitions.get(metricId);
      const label = definition?.label || metricId;
      const alertStatuses = new Set(Array.isArray(definition?.alert_statuses) ? definition.alert_statuses.map((value) => String(value).toLowerCase()) : []);
      const maxAge = typeof definition?.max_age_hours === "number" && Number.isFinite(definition.max_age_hours) && definition.max_age_hours > 0 ? definition.max_age_hours : null;
      const row = latestMetric(data.metrics ?? [], o.id, metricId);
      const reasons: string[] = [];
      if (!row) {
        if (alertStatuses.size || maxAge) reasons.push("No source observation published (unknown).");
      } else {
        const value = row.value;
        const structured = value !== null && typeof value === "object" ? value as Record<string, unknown> : null;
        const status = structured ? String(structured.status ?? "").toLowerCase() : value === null ? "unknown" : "";
        const observed = structured && "source_observed_at" in structured ? structured.source_observed_at : row.observed_at;
        const sourceAt = timestamp(observed);
        const sourceLabel = typeof observed === "string" && observed ? observed : "unknown";
        if (["blocked", "failed", "error"].includes(status) || alertStatuses.has(status)) reasons.push(`${status}; source observation ${sourceLabel}.`);
        if (metricId === "blocking_defects" && typeof value === "number" && Number.isFinite(value) && value > 0) reasons.push(`${value} blocking defects.`);
        if (maxAge) {
          if (sourceAt === null || sourceAt > now.getTime() + 300000) reasons.push("Source time unknown; freshness cannot be established.");
          else if (now.getTime() - sourceAt > maxAge * 3600000) reasons.push(`Source observation ${sourceLabel} exceeds ${maxAge} hours.`);
        }
      }
      if (reasons.length) items.push({ id: `metric-${o.id}-${metricId}`, project: o.project, title: `${label} needs attention: ${o.title}`, detail: reasons.join(" ") });
    }
  }
  for (const l of data.leases.filter((l) => leaseState(l, now) === "needs recovery")) items.push({ id: `lease-${l.issue_id}`, project: l.project, title: `Recover ${l.issue_id}`, detail: l.next_action || l.checkpoint || "Inspect issue and working state before claiming." });
  return items;
}
