import Link from "next/link";
import { ObjectiveActions } from "./ObjectiveActions";
import { formatWhen, toLocalInput } from "@/lib/when";
import { latestMetric, leaseState, metricValue, providerUsageReading, safeEvidence, type Observation, type Portfolio } from "@/lib/portfolio";

export function portfolioDate(iso: string | number) { return formatWhen(iso).replace(/ ET$/, ""); }
function ProviderReading({ label, value, now }: { label: string; value: unknown; now: Date }) {
  const reading = providerUsageReading(value, now);
  return <div>
    <div>{label} · {reading.state === "current" ? `${reading.used}% used` : "Current usage unknown"}</div>
    {reading.state === "previous" ? <div className="meta">Previous period ended {portfolioDate(reading.resetAt)} ET.</div> : null}
    {reading.state === "stale" ? <div className="meta">Last reading is over two hours old.</div> : null}
    {reading.state === "current" || reading.state === "stale" ? (
      <div className="meta">Observed {portfolioDate(reading.observedAt)} ET · provider reset {portfolioDate(reading.resetAt)} ET</div>
    ) : null}
  </div>;
}

function ProviderUsage({ label, metric, now }: { label: string; metric: Observation | undefined; now: Date }) {
  const value = metric?.value;
  const additional = value && typeof value === "object" && "additional_limits" in value ? value.additional_limits : null;
  const additionalWindows = additional && typeof additional === "object" && !Array.isArray(additional)
    ? Object.entries(additional)
    : [];
  return <>
    <ProviderReading label={label} value={value} now={now} />
    {additionalWindows.map(([name, window]) => <ProviderReading key={name} label={name} value={window} now={now} />)}
    {metric ? <div className="meta">{metric.source}</div> : null}
    {value != null ? <details><summary>View recorded provider receipt</summary>
      <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(value, null, 2)}</pre>
    </details> : null}
  </>;
}

export function PortfolioObjectives({ data }: { data: Portfolio | null }) {
  if (!data) return <div className="card" role="status">Shared work records are unavailable. Goals and completion cannot be inferred from this outage.</div>;
  const now = new Date();
  return <>
    <p className="meta">Checked {portfolioDate(data.checked_at)} ET · task status lives in Linear · evidence remains separate from deployment and acceptance.</p>
    {data.objectives.length === 0 ? <div className="card">No shared objectives recorded for this selection.</div> : null}
    {data.objectives.map((o) => {
      const reports = data.reports.filter((r) => r.objective_id === o.id).slice(0, 3);
      const leases = data.leases.filter((l) => l.objective_id === o.id);
      return <article className="card" id={o.id} key={o.id}>
        <div className="chips"><span className="badge">{o.project}</span><span className={`badge ${o.status === "complete" ? "good" : ""}`}>{o.status}</span><span className="meta">{o.accountable_owner}</span></div>
        <h3>{o.title}</h3><p>{o.outcome}</p>
        <dl><div><dt>Delivery</dt><dd>{portfolioDate(o.target_at)} ET</dd></div><div><dt>Next review</dt><dd>{portfolioDate(o.review_at)} ET</dd></div></dl>
        <ObjectiveActions id={o.id} project={o.project} title={o.title} outcome={o.outcome} reviewInput={toLocalInput(o.review_at)} targetInput={toLocalInput(o.target_at)} />
        <div className="chips">{(o.issue_ids ?? []).map((issue) => <a className="chip" key={issue} href={`https://linear.app/strandautomationworks/issue/${encodeURIComponent(issue)}`} target="_blank" rel="noreferrer">{issue}</a>)}</div>
        {(o.metric_definitions ?? []).length ? <details><summary>Scorecard · {o.metric_definitions.filter((def) => latestMetric(data.metrics, o.id, def.id) != null).length} recorded / {o.metric_definitions.length} tracked</summary><dl>{o.metric_definitions.map((def) => {
          const m = latestMetric(data.metrics, o.id, def.id);
          if (o.id === "portfolio-control" && (def.id === "codex_budget" || def.id === "claude_budget")) {
            const isCodex = def.id === "codex_budget";
            return <div key={def.id}>
              <dt>{isCodex ? "Codex usage" : "Claude usage"}</dt>
              <dd style={{ overflowWrap: "anywhere" }}><ProviderUsage label={isCodex ? "Weekly window" : "All models"} metric={m} now={now} /></dd>
            </div>;
          }
          const sourceTime = m?.value && typeof m.value === "object" && "source_observed_at" in m.value ? (m.value as { source_observed_at: string | null }).source_observed_at : m?.observed_at;
          const ageHours = typeof def.max_age_hours === "number" ? def.max_age_hours : 24;
          const stale = sourceTime && Date.parse(sourceTime) < Date.now() - ageHours * 3600000;
          return <div key={def.id}><dt>{def.label || def.id}</dt><dd style={{ overflowWrap: "anywhere" }}>{m?.value && typeof m.value === "object" ? <details><summary>View observation</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(m.value, null, 2)}</pre></details> : metricValue(m?.value)}{def.target ? <div className="meta">Target: {def.target}</div> : null}<div className="meta">{m ? `${stale ? "STALE · " : ""}${sourceTime ? portfolioDate(sourceTime) + " ET" : "Source time unknown"} · ${m.source}` : "No observation recorded"}</div></dd></div>;
        })}</dl></details> : null}
        {leases.map((l) => <div key={l.issue_id}><b>{l.issue_id} · {leaseState(l, new Date())}</b><div className="meta">{l.agent} · checkpoint: {l.checkpoint || "none yet"}</div><p>{l.next_action}</p></div>)}
        {reports.map((r) => <details key={r.id}><summary>{portfolioDate(r.created_at)} ET · {r.agent}: {r.result.length > 140 ? r.result.slice(0, 137) + "…" : r.result}</summary><p><Link href={`/work/${r.id}`}>Open full report →</Link></p><p>{r.result}</p><p>{r.validation}</p><p>{r.remaining}</p><p>Next: {r.next_action}</p><div className="chips">{(r.evidence ?? []).map(safeEvidence).filter((e) => e !== null).map((e, i) => <a key={i} href={e.url} target="_blank" rel="noreferrer" className="chip">{e.label}</a>)}</div></details>)}
        <div className="meta"><Link href={`/focus?project=${encodeURIComponent(o.project)}`}>Project focus →</Link></div>
      </article>;
    })}
  </>;
}
