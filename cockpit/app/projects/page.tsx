import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { PROJECTS, buildProjectFootprint, type RegisterInputs } from "@/lib/projects";
import { parseScouts, scoutForTokens } from "@/lib/scouts";
import { parseChecks, latestCheck, checkStatusClass } from "@/lib/checks";
import { redactForDisplay } from "@/lib/redact";

export const revalidate = 60;

export default async function ProjectsIndex() {
  const [services, assets, access, models, subscriptions, dashboardMd, checksCsv] = await Promise.all([
    readRepoFile("registers/services.csv"),
    readRepoFile("registers/assets.csv"),
    readRepoFile("registers/access.csv"),
    readRepoFile("registers/models.csv"),
    readRepoFile("registers/subscriptions.csv"),
    readRepoFile("DASHBOARD.md"),
    readRepoFile("registers/checks.csv"),
  ]);
  const inputs: RegisterInputs = { services, assets, access, models, subscriptions };
  const scouts = parseScouts(dashboardMd);
  const checks = parseChecks(checksCsv);

  const rows = PROJECTS.map((p) => ({
    p,
    fp: buildProjectFootprint(p, inputs),
    scout: scoutForTokens(scouts, p.tokens),
    check: latestCheck(checks, p),
  })).sort((a, b) => {
    // most recently reported first, then by dedicated spend
    const d = (b.check?.date ?? "").localeCompare(a.check?.date ?? "");
    if (d !== 0) return d;
    return b.fp.spendMonthlyUsd - a.fp.spendMonthlyUsd;
  });

  return (
    <Chrome title="Projects" sub="footprint from the registers" active="/projects">
      {rows.map(({ p, fp, scout, check }) => (
        <Link key={p.slug} href={`/projects/${p.slug}`}>
          <div className="card">
            <h3>
              {p.name}
              {check ? (
                <span className={`badge ${checkStatusClass(check.status)}`}>{check.status || check.kind}</span>
              ) : null}
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
            {check ? (
              <div className="meta" style={{ marginTop: 4 }}>
                <span className="mono">{check.date.slice(5)}</span> · {redactForDisplay(check.summary)}
              </div>
            ) : null}
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
