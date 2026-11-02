import Link from "next/link";
import { latestMetric, leaseState, metricValue, safeEvidence, type Portfolio } from "@/lib/portfolio";

export function portfolioDate(iso: string) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(iso)); }
export function PortfolioObjectives({ data }: { data: Portfolio | null }) {
  if (!data) return <div className="card" role="status">Shared work records are unavailable. Goals and completion cannot be inferred from this outage.</div>;
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
        <div className="chips">{(o.issue_ids ?? []).map((issue) => <a className="chip" key={issue} href={`https://linear.app/strandautomationworks/issue/${encodeURIComponent(issue)}`} target="_blank" rel="noreferrer">{issue}</a>)}</div>
        {(o.metric_definitions ?? []).length ? <details><summary>Scorecard · {o.metric_definitions.filter((def) => latestMetric(data.metrics, o.id, def.id)?.value != null).length} measured / {o.metric_definitions.length} tracked</summary><dl>{o.metric_definitions.map((def) => {
          const m = latestMetric(data.metrics, o.id, def.id);
          const stale = m && Date.parse(m.observed_at) < Date.now() - 86400000;
          return <div key={def.id}><dt>{def.label || def.id}</dt><dd style={{ overflowWrap: "anywhere" }}>{m?.value && typeof m.value === "object" ? <details><summary>View observation</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(m.value, null, 2)}</pre></details> : metricValue(m?.value)}{def.target ? <div className="meta">Target: {def.target}</div> : null}<div className="meta">{m ? `${stale ? "STALE · " : ""}${portfolioDate(m.observed_at)} ET · ${m.source}` : "No observation recorded"}</div></dd></div>;
        })}</dl></details> : null}
        {leases.map((l) => <div key={l.issue_id}><b>{l.issue_id} · {leaseState(l, new Date())}</b><div className="meta">{l.agent} · checkpoint: {l.checkpoint || "none yet"}</div><p>{l.next_action}</p></div>)}
        {reports.map((r) => <details key={r.id}><summary>{portfolioDate(r.created_at)} ET · {r.agent}: {r.result.length > 140 ? r.result.slice(0, 137) + "…" : r.result}</summary><p>{r.result}</p><p>{r.validation}</p><p>{r.remaining}</p><p>Next: {r.next_action}</p><div className="chips">{(r.evidence ?? []).map(safeEvidence).filter((e) => e !== null).map((e, i) => <a key={i} href={e.url} target="_blank" rel="noreferrer" className="chip">{e.label}</a>)}</div></details>)}
        <div className="meta"><Link href={`/focus?project=${encodeURIComponent(o.project)}`}>Project focus →</Link></div>
      </article>;
    })}
  </>;
}
