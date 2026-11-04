import Link from "next/link";
import { notFound } from "next/navigation";
import { Chrome } from "../../components/Chrome";
import { safeEvidence, type WorkReport } from "@/lib/portfolio";
import { sbSelect } from "@/lib/supabase-rest";
import { formatWhen, humanizeDates } from "@/lib/when";

export const dynamic = "force-dynamic";

// One agent work report in full. Operate and item pages link here.
export default async function WorkReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [report] = await sbSelect<WorkReport>("portfolio_work_reports", `select=*&id=eq.${id}&limit=1`);
  if (!report) notFound();
  const evidence = (report.evidence ?? []).map(safeEvidence).filter((entry) => entry !== null);
  const sections: [string, string][] = [["Result", report.result], ["Validation", report.validation], ["Remaining", report.remaining], ["Next", report.next_action]];
  return <Chrome title="Work report" sub={`${report.agent} · ${formatWhen(report.created_at)}`} active="/operate">
    <article className="card">
      <div className="chips">
        {report.issue_id ? <a className="chip" href={`https://linear.app/strandautomationworks/issue/${encodeURIComponent(report.issue_id)}`} target="_blank" rel="noreferrer">{report.issue_id}</a> : null}
        {report.objective_id ? <Link className="chip" href={`/focus#${encodeURIComponent(report.objective_id)}`}>{report.objective_id}</Link> : null}
        {evidence.map((entry, index) => <a key={index} className="chip" href={entry.url} target="_blank" rel="noreferrer">{entry.label}</a>)}
      </div>
      {sections.filter(([, text]) => text).map(([label, text]) => <section key={label}><h3>{label}</h3><p style={{ whiteSpace: "pre-wrap" }}>{humanizeDates(text)}</p></section>)}
    </article>
    <p><Link href={`/respond?${new URLSearchParams({ title: `Work report: ${report.issue_id ?? report.objective_id ?? report.agent}`, detail: report.result.slice(0, 1500), project: report.objective_id ?? "portfolio" })}`}>Respond to this report →</Link></p>
  </Chrome>;
}
