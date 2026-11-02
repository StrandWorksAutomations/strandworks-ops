import "server-only";
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import { sameProject, type Objective, type Observation, type Portfolio, type WorkLease, type WorkReport } from "./portfolio";

async function all<T>(table: string, query: string): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; ; offset += 200) {
    const rows = await sbSelect<T>(table, `${query}&limit=200&offset=${offset}`);
    result.push(...rows);
    if (rows.length < 200) return result;
  }
}
export async function fetchPortfolio(project?: string): Promise<Portfolio | null> {
  if (!supabaseConfigured()) return null;
  try {
    const [objectives, metrics, leases, reports] = await Promise.all([
      all<Objective>("portfolio_objectives", "select=*&order=priority.asc,target_at.asc"),
      all<Observation>("portfolio_metrics", "select=*&order=observed_at.desc,id.desc"),
      all<WorkLease>("portfolio_work_leases", "select=*&released_at=is.null&order=expires_at.asc"),
      all<WorkReport>("portfolio_work_reports", `select=*&created_at=gte.${encodeURIComponent(new Date(Date.now() - 30 * 86400000).toISOString())}&order=created_at.desc,id.desc`),
    ]);
    const selected = project ? objectives.filter((o) => sameProject(o.project, project)) : objectives;
    const ids = new Set(selected.map((o) => o.id));
    return { checked_at: new Date().toISOString(), objectives: selected,
      metrics: metrics.filter((m) => ids.has(m.objective_id)),
      leases: leases.filter((l) => !project || sameProject(l.project, project)),
      reports: reports.filter((r) => !project || (r.objective_id && ids.has(r.objective_id))) };
  } catch { return null; }
}
