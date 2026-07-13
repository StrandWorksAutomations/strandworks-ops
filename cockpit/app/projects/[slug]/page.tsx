import { notFound } from "next/navigation";
import { Chrome } from "../../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { redactForDisplay } from "@/lib/redact";
import {
  PROJECTS,
  projectBySlug,
  buildProjectFootprint,
  type AttributedRow,
  type RegisterInputs,
} from "@/lib/projects";
import { parseScouts, scoutForTokens } from "@/lib/scouts";
import { extractSurfaces } from "@/lib/projects";
import { parseChecks, checksForProject, checkStatusClass } from "@/lib/checks";

export const revalidate = 60;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

// A footprint section: attributed register rows shown as cards. Empty ⇒ an
// honest "nothing attributed" note (never an invented value).
function Section({
  title,
  note,
  titleField,
  rows,
  emptyNote,
}: {
  title: string;
  note?: string;
  titleField: string;
  rows: AttributedRow[];
  emptyNote: string;
}) {
  return (
    <>
      <div className="section-head">
        <h2>{title}</h2>
        {note ? <span className="meta">{note}</span> : null}
      </div>
      {rows.length === 0 ? (
        <div className="card">
          <div className="meta">{emptyNote}</div>
        </div>
      ) : (
        rows.map(({ row, scope }, i) => {
          // Every rendered register cell passes through redactForDisplay: the
          // security floor as a CODE guarantee, not a content convention.
          const heading = redactForDisplay(row[titleField] || "(unnamed)", titleField);
          const fields = Object.entries(row)
            .filter(([k, v]) => k !== titleField && v !== "")
            .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: redactForDisplay(v, k) }));
          return (
            <div className="card" key={i}>
              <h3>
                {heading}
                <span className={`badge ${scope === "shared" ? "" : "good"}`}>{scope}</span>
              </h3>
              <dl>
                {fields.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })
      )}
    </>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proj = projectBySlug(slug);
  if (!proj) notFound();

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
  const fp = buildProjectFootprint(proj, inputs);
  const scouts = parseScouts(dashboardMd);
  const scout = scoutForTokens(scouts, proj.tokens);
  const checks = checksForProject(parseChecks(checksCsv), proj);
  const surfaces = extractSurfaces(fp.infra);

  return (
    <Chrome
      title={proj.name}
      sub={`$${fp.spendMonthlyUsd}/mo dedicated${fp.sharedMonthlyUsd > 0 ? ` + $${fp.sharedMonthlyUsd} shared` : ""}${fp.spendHasUncosted ? " (+uncosted)" : ""}`}
      active="/projects"
    >
      <div className="card">
        <div className="meta">{proj.role}</div>
        <div className="chips">
          <span className="chip">{fp.infra.length} infra</span>
          <span className="chip">{fp.assets.length} assets</span>
          <span className="chip">{fp.access.length} access</span>
          <span className="chip">{fp.models.length} models</span>
          <span className="chip">{fp.subscriptions.length} subs</span>
          {scout ? (
            <>
              <span className="chip">audit: {scout.latestAudit.replace(/^audit-|\.md$/g, "")}</span>
              <span className="chip">drift: {scout.latestDrift.replace(/^drift-|\.md$/g, "")}</span>
            </>
          ) : null}
        </div>
        <div className="meta" style={{ marginTop: 8 }}>
          Rows marked <b>shared</b> are portfolio/all-scope infrastructure this
          project uses but doesn&apos;t own; <b>dedicated</b> rows name this
          project directly. Everything below is register content, unmodified.
        </div>
      </div>

      <div className="section-head">
        <h2>Status &amp; checks</h2>
        <span className="meta">registers/checks.csv</span>
      </div>
      {checks.length === 0 ? (
        <div className="card">
          <div className="meta">
            No status reports yet. Any agent — session, scout, or the
            persistent checks-and-balances instance — appends reports to
            registers/checks.csv and they land here.
          </div>
        </div>
      ) : (
        <div className="ledger">
          {checks.slice(0, 10).map((c, i) => (
            <div key={i} className="l-row" style={{ alignItems: "flex-start" }}>
              <span className="l-date">{c.date.slice(5)}</span>
              <span className="l-name" style={{ whiteSpace: "normal" }}>
                <span className={`badge ${checkStatusClass(c.status)}`} style={{ marginLeft: 0, marginRight: 8 }}>
                  {c.status || c.kind}
                </span>
                {redactForDisplay(c.summary)}
                <span className="l-sub"> — {c.source}{c.kind ? ` · ${c.kind}` : ""}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {surfaces.length > 0 ? (
        <>
          <div className="section-head">
            <h2>Deployed surfaces</h2>
            <span className="meta">from the services register</span>
          </div>
          <div className="card">
            <div className="chips">
              {surfaces.map((s) => (
                <a key={s} className="chip" href={`https://${s}`} target="_blank" rel="noreferrer">
                  {s}
                </a>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <Section
        title="Infrastructure"
        note="services.csv — what runs it, where it lives"
        titleField="service"
        rows={fp.infra}
        emptyNote="No services register rows attributed to this project."
      />
      <Section
        title="Assets"
        note="assets.csv — where its files live"
        titleField="asset"
        rows={fp.assets}
        emptyNote="No asset register rows attributed to this project."
      />
      <Section
        title="Access (key LOCATIONS only)"
        note="access.csv — never keys, only where they live"
        titleField="system"
        rows={fp.access}
        emptyNote="No access register rows attributed to this project."
      />
      <Section
        title="Models"
        note="models.csv — model lanes"
        titleField="name"
        rows={fp.models}
        emptyNote="No model register rows attributed to this project."
      />
      <Section
        title="Spend slice"
        note="subscriptions.csv — recurring spend touching this project"
        titleField="service"
        rows={fp.subscriptions}
        emptyNote="No subscription rows attributed to this project."
      />
    </Chrome>
  );
}
