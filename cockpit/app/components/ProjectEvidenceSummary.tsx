import Link from "next/link";
import { projectEvidence } from "@/lib/project-evidence";
import { intakeDate } from "@/lib/intake";
import { redactForDisplay } from "@/lib/redact";

export function ProjectEvidenceSummary({ evidence, available, compact = false }: {
  evidence: ReturnType<typeof projectEvidence>; available: { checks: boolean; portfolio: boolean }; compact?: boolean;
}) {
  const { report, check, checkAge, attention, objectives } = evidence;
  return <div className="project-evidence">
    {!available.portfolio ? <p className="meta" role="status">Shared reports unavailable; delivery and acceptance are unknown.</p>
      : objectives.length ? <>
        <div className="meta">Shared handoff · {report ? intakeDate(report.created_at) : "none recorded"}</div>
        {evidence.reportTimeInvalid ? <p className="meta" role="status">Some report times are invalid or in the future; those reports are excluded.</p> : null}
        {report ? <p className="meta">{redactForDisplay(report.result).slice(0, compact ? 240 : 600)}{report.result.length > (compact ? 240 : 600) ? "…" : ""}</p> : null}
        <dl className="project-delivery">
          {([ ["local", "Local result"], ["deployment", "Deployment"], ["owner_acceptance", "Owner acceptance"] ] as const).map(([key, label]) => <div key={key}>
            <dt>{label}</dt><dd>{evidence.delivery[key].label}{evidence.delivery[key].detail ? <span className="meta"> · {redactForDisplay(evidence.delivery[key].detail!)}</span> : null}</dd>
          </div>)}
        </dl>
        {attention.length ? <><span className="badge bad">Needs attention · {attention.length}</span><ul className="project-attention">{attention.map((item) => <li key={item.id}><strong>{redactForDisplay(item.title)}</strong><span className="meta"> · {redactForDisplay(item.detail)}</span></li>)}</ul></> : null}
        {report?.remaining ? <p className="meta"><strong>Remaining / blockers:</strong> {redactForDisplay(report.remaining).slice(0, compact ? 180 : 320)}{report.remaining.length > (compact ? 180 : 320) ? "…" : ""}</p> : null}
        {report ? <details className="meta"><summary>Report, remaining work and next action</summary>
          <p>{redactForDisplay(report.result)}</p>
          <p><strong>Remaining work / blockers:</strong> {report.remaining ? redactForDisplay(report.remaining) : "Not recorded"}</p>
          <p><strong>Next action:</strong> {report.next_action ? redactForDisplay(report.next_action) : "Not recorded"}</p>
          <div>Reported by {report.agent} · {report.issue_id || "no linked issue"}</div>
        </details> : null}
        <div className="meta">Reported progress does not establish deployment or owner acceptance. <Link href={`/focus?project=${encodeURIComponent(objectives[0].project)}#${objectives[0].id}`}>Current goals and evidence →</Link></div>
      </> : null}
    {!available.checks ? <p className="meta" role="status">Register checks unavailable.</p> : check ? <div className="meta project-register-check">
      Register check · {check.date || "date unknown"} · {check.source || "source unknown"} · {check.status || check.kind}
      {checkAge === "historical" ? " · historical" : checkAge === "future" || checkAge === "invalid" ? " · unusable date" : ""}
      <div>{redactForDisplay(check.summary).slice(0, compact ? 110 : 300)}</div>
    </div> : <div className="meta">No register check recorded.</div>}
  </div>;
}
