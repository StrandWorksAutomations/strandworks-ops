import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { PROJECTS, buildProjectFootprint, type RegisterInputs } from "@/lib/projects";
import { parseScouts, scoutForTokens } from "@/lib/scouts";

export const revalidate = 60;

export default async function ProjectsIndex() {
  const [services, assets, access, models, subscriptions, dashboardMd] = await Promise.all([
    readRepoFile("registers/services.csv"),
    readRepoFile("registers/assets.csv"),
    readRepoFile("registers/access.csv"),
    readRepoFile("registers/models.csv"),
    readRepoFile("registers/subscriptions.csv"),
    readRepoFile("DASHBOARD.md"),
  ]);
  const inputs: RegisterInputs = { services, assets, access, models, subscriptions };
  const scouts = parseScouts(dashboardMd);

  const rows = PROJECTS.map((p) => ({
    p,
    fp: buildProjectFootprint(p, inputs),
    scout: scoutForTokens(scouts, p.tokens),
  })).sort((a, b) => b.fp.spendMonthlyUsd - a.fp.spendMonthlyUsd);

  return (
    <Chrome title="Projects" sub="footprint from the registers" active="/projects">
      {rows.map(({ p, fp, scout }) => (
        <Link key={p.slug} href={`/projects/${p.slug}`}>
          <div className="card">
            <h3>
              {p.name}
              {fp.spendMonthlyUsd > 0 || fp.spendHasUncosted ? (
                <span className="badge brass">
                  ${fp.spendMonthlyUsd}/mo{fp.spendHasUncosted ? "+" : ""}
                </span>
              ) : null}
            </h3>
            <div className="meta">{p.role}</div>
            <div className="chips">
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
          </div>
        </Link>
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
