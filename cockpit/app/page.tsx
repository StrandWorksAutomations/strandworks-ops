import Link from "next/link";
import { Chrome } from "./components/Chrome";
import { readRepoFile, listRepoDir } from "@/lib/repo";
import { parseDecision, isPending } from "@/lib/decisions";
import { buildSpendView } from "@/lib/spend";
import { readCeilingUsd } from "@/lib/git";
import { buildMoneyView, upcomingRenewals } from "@/lib/money";
import { buildAttentionQueue, type AttentionItem } from "@/lib/attention";
import { PROJECTS, buildProjectFootprint, type RegisterInputs } from "@/lib/projects";
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

export default async function Today() {
  const [subsCsv, calCsv, assetsCsv, servicesCsv, accessCsv, modelsCsv, decisionFiles, spendCsv, ceilingUsd] =
    await Promise.all([
      readRepoFile("registers/subscriptions.csv"),
      readRepoFile("registers/calendar.csv"),
      readRepoFile("registers/assets.csv"),
      readRepoFile("registers/services.csv"),
      readRepoFile("registers/access.csv"),
      readRepoFile("registers/models.csv"),
      listRepoDir("_governance/decisions"),
      readRepoFile("registers/autonomous-spend.csv"),
      readCeilingUsd(),
    ]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const money = buildMoneyView(subsCsv);
  const spend = buildSpendView(spendCsv, ceilingUsd);

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
  const renewals30 = upcomingRenewals(money, todayIso, 30);

  const inputs: RegisterInputs = {
    services: servicesCsv,
    assets: assetsCsv,
    access: accessCsv,
    models: modelsCsv,
    subscriptions: subsCsv,
  };
  const footprints = PROJECTS.map((p) => buildProjectFootprint(p, inputs))
    .sort((a, b) => b.spendMonthlyUsd - a.spendMonthlyUsd);

  const burnClasses = [
    { key: "core" as const, cssClass: "g-core", label: "core" },
    { key: "hidden" as const, cssClass: "g-hidden", label: "hidden" },
    { key: "flagged" as const, cssClass: "g-flagged", label: "flagged" },
    { key: "review" as const, cssClass: "g-review", label: "review" },
  ];
  const burnTotal = burnClasses.reduce((s, c) => s + money.byClass[c.key].totalUsd, 0) || 1;

  return (
    <Chrome title="Today" sub="the whole operation, triaged" active="/">
      <div className="grid">
        <Link href="/money" className="tile brass">
          <div className="big">
            ${Math.round(money.knownMonthlyUsd)}
            <small>/mo</small>
          </div>
          <div className="label">
            known burn{money.uncostedCount ? ` · ${money.uncostedCount} uncosted` : ""}
          </div>
        </Link>
        <div className={`tile ${nowCount > 0 ? "hot" : "calm"}`}>
          <div className="big">{nowCount}</div>
          <div className="label">need you now</div>
        </div>
        <Link href="/decisions" className={`tile ${pendingDecisions.length > 0 ? "hot" : "calm"}`}>
          <div className="big">{pendingDecisions.length}</div>
          <div className="label">pending decisions</div>
        </Link>
        <Link href="/money" className={`tile ${renewals30.length > 0 ? "warm" : "calm"}`}>
          <div className="big">{renewals30.length}</div>
          <div className="label">renewals · 30 days</div>
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
              {queue.slice(0, 12).map((q, i) => (
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
          {queue.length > 12 ? (
            <div className="meta" style={{ textAlign: "center" }}>
              + {queue.length - 12} more across <Link href="/money">Money</Link> and{" "}
              <Link href="/registers/calendar">Calendar</Link>
            </div>
          ) : null}
        </div>

        <div>
          <div className="section-head">
            <h2>Burn</h2>
            <Link href="/money">breakdown →</Link>
          </div>
          <div className="card">
            <div className="cost" style={{ fontSize: 18 }}>
              ${money.knownMonthlyUsd.toFixed(2)}
              <span className="meta" style={{ fontWeight: 400 }}> /mo known — a floor, not a ceiling</span>
            </div>
            <div className="gauge" role="img" aria-label="burn by class">
              {burnClasses.map((c) => (
                <span
                  key={c.key}
                  className={c.cssClass}
                  style={{ width: `${(money.byClass[c.key].totalUsd / burnTotal) * 100}%` }}
                />
              ))}
            </div>
            <div className="legend">
              {burnClasses.map((c) => (
                <span key={c.key} className="key">
                  <span className={`swatch ${c.cssClass}`} />
                  {c.label} <span className="num">${Math.round(money.byClass[c.key].totalUsd)}</span>
                </span>
              ))}
            </div>
          </div>

          <Link href="/spend">
            <div className="card">
              <h3>
                Autonomous spend
                <span className={`badge ${spend.over ? "bad" : spend.pctUsed >= 80 ? "warn" : "good"}`}>
                  {spend.pctUsed}%
                </span>
              </h3>
              <div className="meta">
                ${spend.spentUsd.toFixed(2)} of ${spend.ceilingUsd.toFixed(2)} ceiling · {spend.month}
              </div>
              <div className={`bar ${spend.over ? "bad" : spend.pctUsed >= 80 ? "warn" : "good"}`}>
                <div className="bar-fill" style={{ width: `${Math.min(100, spend.pctUsed)}%` }} />
              </div>
            </div>
          </Link>

          <div className="section-head">
            <h2>Renewals · 30 days</h2>
            <Link href="/money">all →</Link>
          </div>
          {renewals30.length === 0 ? (
            <div className="card">
              <div className="meta">No dated renewals in the next 30 days.</div>
            </div>
          ) : (
            <div className="ledger">
              {renewals30.slice(0, 6).map((r, i) => (
                <div key={i} className="l-row">
                  <span className="l-date">{shortDate(r.renewalIso)}</span>
                  <span className="l-name">{r.service}</span>
                  <span className={`l-amount ${r.costUsd === null ? "dim" : ""}`}>
                    {r.costUsd !== null ? `$${r.costUsd.toFixed(2)}` : "$ ?"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="section-head">
            <h2>Projects</h2>
            <Link href="/projects">all →</Link>
          </div>
          <div className="ledger">
            {footprints.slice(0, 6).map((fp) => (
              <Link key={fp.project.slug} href={`/projects/${fp.project.slug}`} className="l-row">
                <span className="l-name">
                  {fp.project.name}{" "}
                  <span className="l-sub">
                    {fp.infra.length} infra · {fp.subscriptions.length} subs
                  </span>
                </span>
                <span className={`l-amount ${fp.spendMonthlyUsd === 0 ? "dim" : ""}`}>
                  ${fp.spendMonthlyUsd}
                  {fp.spendHasUncosted ? "+" : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Chrome>
  );
}
