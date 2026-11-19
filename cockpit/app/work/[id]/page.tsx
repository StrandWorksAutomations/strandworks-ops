import Link from "next/link";
import { notFound } from "next/navigation";
import { Chrome } from "../../components/Chrome";
import { type WorkReport } from "@/lib/portfolio";
import { ownerReport } from "@/lib/work-report";
import { sbSelect } from "@/lib/supabase-rest";
import { formatWhen, humanizeDates } from "@/lib/when";

export const dynamic = "force-dynamic";

// One agent work report, written for the owner: what was done, what happens
// next and what is still open. Test output, raw data and code links stay
// collapsed under "Technical detail". Operate and item pages link here.
export default async function WorkReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [report] = await sbSelect<WorkReport>("portfolio_work_reports", `select=*&id=eq.${id}&limit=1`);
  if (!report) notFound();
  const view = ownerReport(report);
  const hasTechnical = view.technical.length > 0 || view.code.length > 0 || Boolean(report.issue_id);
  return <Chrome title="What was done" sub={`${view.who} · ${formatWhen(report.created_at)}`} active="/operate">
    <article className="card report-plain">
      {report.objective_id ? <p className="meta">Goal: <Link href={`/focus#${encodeURIComponent(report.objective_id)}`}>{report.objective_id.replace(/[-_]+/g, " ")}</Link></p> : null}
      {view.plain.length ? view.plain.map(({ label, text }) => <section key={label}><h2>{label}</h2><p style={{ whiteSpace: "pre-wrap" }}>{humanizeDates(text)}</p></section>)
        : <p className="meta">This report has no written summary. The recorded data is under Technical detail.</p>}
      {view.results.length ? <section><h2>See the result</h2>
        <div className="chips">{view.results.map((link) => <a key={link.url} className="chip" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}</div>
      </section> : null}
    </article>
    <p><Link href={`/respond?${new URLSearchParams({ title: `Work report: ${report.issue_id ?? report.objective_id ?? report.agent}`, detail: report.result.slice(0, 1500), project: report.objective_id ?? "portfolio" })}`}>Respond to this report →</Link></p>
    {hasTechnical ? <details className="card report-technical"><summary>Technical detail <span className="meta">tests, data and code links · for agents</span></summary>
      <div className="chips">
        {report.issue_id ? <a className="chip" href={`https://linear.app/strandautomationworks/issue/${encodeURIComponent(report.issue_id)}`} target="_blank" rel="noreferrer">Linear {report.issue_id}</a> : null}
        {view.code.map((link) => <a key={link.url} className="chip" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
      </div>
      {view.technical.map(({ label, text, raw }) => <section key={label}><h3>{label}</h3>
        {raw ? <pre className="inbox-original" tabIndex={0}>{text}</pre> : <p style={{ whiteSpace: "pre-wrap" }}>{humanizeDates(text)}</p>}
      </section>)}
    </details> : null}
    <p className="meta"><Link href="/operate">← Overview</Link></p>
  </Chrome>;
}
