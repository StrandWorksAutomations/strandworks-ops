import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { buildProjectFootprint, tierRank, type RegisterInputs } from "@/lib/projects";
import { loadProjectInventory } from "@/lib/projects-load";
import { parseScouts, scoutForTokens } from "@/lib/scouts";
import { parseChecks } from "@/lib/checks";
import { fetchPortfolio } from "@/lib/portfolio-data";
import { projectEvidence } from "@/lib/project-evidence";
import { ProjectEvidenceSummary } from "../components/ProjectEvidenceSummary";

export const dynamic = "force-dynamic";

export default async function ProjectsIndex() {
  const [services, assets, access, models, subscriptions, dashboardMd, checksCsv, portfolio, inventory] = await Promise.all([
    readRepoFile("registers/services.csv"),
    readRepoFile("registers/assets.csv"),
    readRepoFile("registers/access.csv"),
    readRepoFile("registers/models.csv"),
    readRepoFile("registers/subscriptions.csv"),
    readRepoFile("DASHBOARD.md"),
    readRepoFile("registers/checks.csv"),
    fetchPortfolio(),
    loadProjectInventory().catch(() => null),
  ]);
  const inputs: RegisterInputs = { services, assets, access, models, subscriptions };
  const scouts = parseScouts(dashboardMd);
  const checks = parseChecks(checksCsv);

  const now = new Date();
  const PROJECTS = inventory ?? [];
  const rows = PROJECTS.map((p) => ({
    p,
    fp: buildProjectFootprint(p, inputs, PROJECTS),
    scout: scoutForTokens(scouts, p.tokens),
    evidence: projectEvidence(p, checks, portfolio, now),
  })).sort((a, b) => {
    // tier first (flagship → frozen), then most recently touched
    const t = tierRank(a.p.tier) - tierRank(b.p.tier);
    if (t !== 0) return t;
    const time = (entry: typeof a) => Date.parse(entry.evidence.report?.created_at || entry.p.lastCommit || entry.evidence.check?.date || "") || 0;
    return time(b) - time(a);
  });
  const counts = { active: 0, idle: 0, dormant: 0 };
  for (const { p } of rows) if (p.activity in counts) counts[p.activity as keyof typeof counts]++;

  return (
    <Chrome title="Projects" sub={inventory === null ? "project inventory unavailable" : `${rows.length} repos · repo activity: ${counts.active} active · ${counts.idle} idle · ${counts.dormant} dormant`} active="/projects">
      {inventory === null ? <p className="card meta" role="status">Project inventory unavailable; coverage is unknown.</p> : null}
      {portfolio === null || checksCsv === null ? <p className="card meta" role="status">Project evidence is incomplete: {portfolio === null ? "shared reports unavailable" : ""}{portfolio === null && checksCsv === null ? "; " : ""}{checksCsv === null ? "register checks unavailable" : ""}.</p> : null}
      {rows.map(({ p, fp, scout, evidence }, i) => (
        <div key={p.slug}>
          {i === 0 || tierRank(rows[i - 1].p.tier) !== tierRank(p.tier) ? (
            <div className="section-head"><h2>{p.tier || "unclassified"}</h2></div>
          ) : null}
          <article className="card" aria-label={`${p.name} project summary`}>
            <h3>
              <Link href={`/projects/${p.slug}`}>{p.name}</Link>
              {p.activity ? <span className="badge">Repo {p.activity}{p.lastCommit ? ` · ${p.lastCommit}` : ""}</span> : null}
              {fp.spendMonthlyUsd > 0 || fp.spendHasUncosted ? (
                <span className="badge brass">
                  ${fp.spendMonthlyUsd}/mo{fp.spendHasUncosted ? "+" : ""}
                  {fp.sharedMonthlyUsd > 0 ? ` +$${Math.round(fp.sharedMonthlyUsd)} shared` : ""}
                </span>
              ) : fp.sharedMonthlyUsd > 0 ? (
                <span className="badge">${Math.round(fp.sharedMonthlyUsd)}/mo shared</span>
              ) : null}
            </h3>
            <div className="meta">{p.role}</div>
            <ProjectEvidenceSummary evidence={evidence} available={{ checks: checksCsv !== null, portfolio: portfolio !== null }} />
            <div className="chips">
              {p.surfaces.map((s) => <span key={s} className="chip">{s}</span>)}
              {p.supabaseRef ? <span className="chip">supabase</span> : null}
              {p.vercelProject ? <span className="chip">vercel</span> : null}
              <span className="chip">{fp.infra.length} infra</span>
              <span className="chip">{fp.assets.length} assets</span>
              <span className="chip">{fp.access.length} access</span>
              <span className="chip">{fp.models.length} models</span>
              <span className="chip">{fp.subscriptions.length} subs</span>
              {scout ? (
                <span className={`chip ${scout.latestAudit === "never" ? "" : ""}`}>
                  audit: {scout.latestAudit.replace(/^audit-|\.md$/g, "")}
                </span>
              ) : null}
            </div>
          </article>
        </div>
      ))}

      <div className="section-head">
        <h2>Governance scouts</h2>
        <span className="meta">
          {scouts.generated ? `as of dashboard ${scouts.generated}` : "no scout data"}
        </span>
      </div>
      {scouts.rows.length === 0 ? (
        <div className="card">
          <div className="meta">
            DASHBOARD.md has no scouts table — run generate.py to sweep the repos.
          </div>
        </div>
      ) : (
        <div className="ledger">
          {scouts.rows.map((r) => (
            <div key={r.repo} className="l-row">
              <span className="l-name">{r.repo}</span>
              <span className={`l-amount ${r.latestAudit === "never" ? "dim" : ""}`}>
                audit {r.latestAudit.replace(/^audit-|\.md$/g, "")}
              </span>
              <span className={`l-amount ${r.latestDrift === "never" ? "dim" : ""}`}>
                drift {r.latestDrift.replace(/^drift-|\.md$/g, "")}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <div className="meta">
          Scout reports live inside each project repo; this table is swept into
          DASHBOARD.md by generate.py, so it is only as fresh as the last sweep
          ({scouts.generated ?? "unknown"}). Register data above refreshes within
          a minute of any push to strandworks-ops.
        </div>
      </div>
    </Chrome>
  );
}
