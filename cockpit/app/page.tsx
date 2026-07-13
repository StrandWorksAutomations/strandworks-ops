import Link from "next/link";
import { Chrome } from "./components/Chrome";
import { readRepoFile, listRepoDir } from "@/lib/repo";
import { parseDecision, isPending } from "@/lib/decisions";
import { buildSpendView } from "@/lib/spend";
import { readCeilingUsd } from "@/lib/git";
import { buildMoneyView } from "@/lib/money";
import { buildAttentionQueue, type AttentionItem } from "@/lib/attention";
import { PROJECTS, buildProjectFootprint, type RegisterInputs } from "@/lib/projects";
import { parseChecks, latestCheck, checkStatusClass } from "@/lib/checks";
import { parseScouts } from "@/lib/scouts";
import { redactForDisplay } from "@/lib/redact";

export const revalidate = 60;

const KIND_TAG: Record<AttentionItem["kind"], string> = {
  decision: "DECIDE",
  deadline: "DATE",
  money: "MONEY",
  asset: "ASSET",
};

function shortDate(iso: string | null): string | null {
  return iso ? iso.slice(5) : null; // MM-DD
}

function daysAgo(iso: string, todayIso: string): number {
  return Math.round(
    (new Date(`${todayIso}T00:00:00Z`).getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86400000
  );
}

export default async function Today() {
  const [subsCsv, calCsv, assetsCsv, servicesCsv, accessCsv, modelsCsv, checksCsv, dashboardMd, decisionFiles, spendCsv, ceilingUsd] =
    await Promise.all([
      readRepoFile("registers/subscriptions.csv"),
      readRepoFile("registers/calendar.csv"),
      readRepoFile("registers/assets.csv"),
      readRepoFile("registers/services.csv"),
      readRepoFile("registers/access.csv"),
      readRepoFile("registers/models.csv"),
      readRepoFile("registers/checks.csv"),
      readRepoFile("DASHBOARD.md"),
      listRepoDir("_governance/decisions"),
      readRepoFile("registers/autonomous-spend.csv"),
      readCeilingUsd(),
    ]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const money = buildMoneyView(subsCsv);
  const spend = buildSpendView(spendCsv, ceilingUsd);
  const checks = parseChecks(checksCsv);
  const scouts = parseScouts(dashboardMd);

  const pendingDecisions: { title: string; file: string }[] = [];
  for (const f of decisionFiles.filter((f) => f.endsWith(".md") && f !== "README.md")) {
    const raw = await readRepoFile(`_governance/decisions/${f}`);
    if (!raw) continue;
    try {
      const d = parseDecision(raw, f);
      if (isPending(d)) pendingDecisions.push({ title: d.question || d.id, file: f });
    } catch {
      // unparseable decision files are surfaced on the Decide tab, not here
    }
  }

  const queue = buildAttentionQueue({
    calendarCsv: calCsv,
    subscriptionsCsv: subsCsv,
    assetsCsv,
    pendingDecisions,
    todayIso,
  });
  const nowCount = queue.filter((q) => q.severity === "now").length;

  const inputs: RegisterInputs = {
    services: servicesCsv,
    assets: assetsCsv,
    access: accessCsv,
    models: modelsCsv,
    subscriptions: subsCsv,
  };
  const board = PROJECTS.map((p) => ({
    p,
    fp: buildProjectFootprint(p, inputs),
    check: latestCheck(checks, p),
  })).sort((a, b) => {
    const d = (b.check?.date ?? "").localeCompare(a.check?.date ?? "");
    if (d !== 0) return d;
    return b.fp.spendMonthlyUsd - a.fp.spendMonthlyUsd;
  });
  const reporting = board.filter((b) => b.check && daysAgo(b.check.date, todayIso) <= 7).length;

  return (
    <Chrome title="Today" sub="the whole operation, triaged" active="/">
      <div className="grid">
        <div className={`tile ${nowCount > 0 ? "hot" : "calm"}`}>
          <div className="big">{nowCount}</div>
          <div className="label">need you now</div>
        </div>
        <Link href="/decisions" className={`tile ${pendingDecisions.length > 0 ? "hot" : "calm"}`}>
          <div className="big">{pendingDecisions.length}</div>
          <div className="label">pending decisions</div>
        </Link>
        <Link href="/projects" className={`tile ${reporting === 0 ? "warm" : "calm"}`}>
          <div className="big">
            {reporting}
            <small>/{board.length}</small>
          </div>
          <div className="label">projects reporting · 7d</div>
        </Link>
        <Link href="/money" className="tile brass">
          <div className="big">
            ${Math.round(money.knownMonthlyUsd)}
            <small>/mo</small>
          </div>
          <div className="label">
            burn{money.uncostedCount ? ` · ${money.uncostedCount} uncosted` : ""}
          </div>
        </Link>
      </div>

      <div className="cols">
        <div>
          <div className="section-head">
            <h2>Needs you</h2>
            <span className="meta">{queue.length} open</span>
          </div>
          {queue.length === 0 ? (
            <div className="card">
              <div className="meta">Nothing needs you. The registers report no open actions.</div>
            </div>
          ) : (
            <div className="queue">
              {queue.slice(0, 10).map((q, i) => (
                <Link key={i} href={q.href} className={`q-item ${q.severity}`}>
                  <span className="q-rail" />
                  <span className="q-date">
                    {shortDate(q.dateIso) ?? KIND_TAG[q.kind]}
                    {q.dateIso && q.dateIso < todayIso ? "\nOVERDUE" : ""}
                  </span>
                  <span className="q-body">
                    <span className="q-title">{redactForDisplay(q.title)}</span>
                    <span className="q-detail" style={{ display: "block" }}>
                      {redactForDisplay(q.detail)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          {queue.length > 10 ? (
            <div className="meta" style={{ textAlign: "center" }}>
              + {queue.length - 10} more across <Link href="/money">Money</Link> and{" "}
              <Link href="/registers/calendar">Calendar</Link>
            </div>
          ) : null}

          <div className="section-head">
            <h2>Projects</h2>
            <Link href="/projects">all →</Link>
          </div>
          <div className="ledger">
            {board.map(({ p, fp, check }) => (
              <Link key={p.slug} href={`/projects/${p.slug}`} className="l-row" style={{ alignItems: "flex-start" }}>
                <span className="l-name" style={{ whiteSpace: "normal" }}>
                  {p.name}
                  {check ? (
                    <span className={`badge ${checkStatusClass(check.status)}`}>{check.status || check.kind}</span>
                  ) : (
                    <span className="badge">no reports</span>
                  )}
                  <span className="l-sub" style={{ display: "block" }}>
                    {check
                      ? `${check.date.slice(5)} · ${redactForDisplay(check.summary).slice(0, 90)}`
                      : p.role.slice(0, 90)}
                  </span>
                </span>
                <span className={`l-amount ${fp.spendMonthlyUsd === 0 ? "dim" : ""}`}>
                  ${fp.spendMonthlyUsd}
                  {fp.sharedMonthlyUsd > 0 ? <span className="l-sub"> +shared</span> : null}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2>Money</h2>
            <Link href="/money">breakdown →</Link>
          </div>
          <Link href="/money">
            <div className="card">
              <div className="cost" style={{ fontSize: 17 }}>
                ${money.knownMonthlyUsd.toFixed(2)}
                <span className="meta" style={{ fontWeight: 400 }}> /mo known floor</span>
              </div>
              {money.cancelMarkedUsd > 0 ? (
                <div className="meta">−${money.cancelMarkedUsd.toFixed(2)} marked to cancel</div>
              ) : null}
              <div className={`bar ${spend.over ? "bad" : spend.pctUsed >= 80 ? "warn" : "good"}`}>
                <div className="bar-fill" style={{ width: `${Math.min(100, spend.pctUsed)}%` }} />
              </div>
              <div className="meta" style={{ marginTop: 4 }}>
                agent spend ${spend.spentUsd.toFixed(2)} of ${spend.ceilingUsd.toFixed(0)} ceiling · {spend.month}
              </div>
            </div>
          </Link>

          <div className="section-head">
            <h2>Governance scouts</h2>
            <span className="meta">{scouts.generated ? `swept ${scouts.generated}` : ""}</span>
          </div>
          {scouts.rows.length === 0 ? (
            <div className="card">
              <div className="meta">No scout table in DASHBOARD.md yet.</div>
            </div>
          ) : (
            <div className="ledger">
              {scouts.rows.map((r) => (
                <div key={r.repo} className="l-row">
                  <span className="l-name">{r.repo}</span>
                  <span className={`l-amount ${r.latestAudit === "never" ? "dim" : ""}`}>
                    {r.latestAudit === "never" ? "never" : r.latestAudit.replace(/^audit-|\.md$/g, "")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="section-head">
            <h2>Fabric</h2>
          </div>
          <div className="ledger">
            <Link href="/status" className="l-row">
              <span className="l-name">Status <span className="l-sub">sprint + fabric state</span></span>
              <span className="l-amount dim">→</span>
            </Link>
            <Link href="/reports" className="l-row">
              <span className="l-name">Reports <span className="l-sub">governance reviews</span></span>
              <span className="l-amount dim">→</span>
            </Link>
            <Link href="/registers" className="l-row">
              <span className="l-name">Registers <span className="l-sub">the source of truth</span></span>
              <span className="l-amount dim">→</span>
            </Link>
          </div>
        </div>
      </div>
    </Chrome>
  );
}
