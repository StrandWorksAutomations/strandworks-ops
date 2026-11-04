import Link from "next/link";
import { notFound } from "next/navigation";
import { Chrome } from "../../components/Chrome";
import { ResponseForm } from "../../components/ResponseForm";
import { ItemToolbar } from "./ItemToolbar";
import { fetchItemEvents, fetchItemResponses, fetchOwnerLoopItem } from "@/lib/owner-loop-data";
import { dispatchLabel, eventSummary, projectFolder } from "@/lib/owner-loop";
import { linkedBriefs } from "@/lib/brief-links";
import { renderMarkdown } from "@/lib/markdown";
import { fetchPortfolio } from "@/lib/portfolio-data";
import { formatWhen, humanizeDates, toLocalInput } from "@/lib/when";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { open: "Waiting on you", ruled: "Answered · waiting for an agent", picked_up: "Agent working on it", done: "Done", dropped: "Dropped" };

export default async function ItemPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ respond?: string }> }) {
  const [{ ref: rawRef }, query] = await Promise.all([params, searchParams]);
  const ref = decodeURIComponent(rawRef).toUpperCase();
  if (!/^D-\d{4,}$/.test(ref)) notFound();
  const item = await fetchOwnerLoopItem(ref);
  if (!item) notFound();
  const now = new Date();
  const [events, responses, briefs, portfolio] = await Promise.all([
    fetchItemEvents(item.id).catch(() => []), fetchItemResponses(item.id).catch(() => []),
    linkedBriefs(item).catch(() => ({ attached: null, related: [] })), fetchPortfolio(item.project).catch(() => null),
  ]);
  const closed = item.status === "done" || item.status === "dropped";
  const latest = responses[0];
  const reports = (portfolio?.reports ?? []).slice(0, 3);
  return <Chrome title={item.ref} sub={STATUS[item.status] ?? item.status} active={item.kind === "decision" || item.kind === "alert" ? "/decisions" : "/timeline"}>
    <article className="card item-page">
      <h2 className="item-title">{humanizeDates(item.title)}</h2>
      <dl className="item-facts">
        <div><dt>Status</dt><dd>{STATUS[item.status] ?? item.status}</dd></div>
        {item.due_at ? <div><dt>Due</dt><dd className={!closed && Date.parse(item.due_at) < now.getTime() ? "error-text" : ""}>{formatWhen(item.due_at, now)}</dd></div> : null}
        <div><dt>Project</dt><dd>{item.project === "portfolio" ? "All projects" : item.project}</dd></div>
        <div><dt>Folder</dt><dd className="mono">{projectFolder(item)}</dd></div>
        <div><dt>Asked by</dt><dd>{item.origin_agent ?? "agent"} · {formatWhen(item.created_at, now)}</dd></div>
      </dl>
      <ItemToolbar refId={item.ref} title={item.title} dueInput={toLocalInput(item.due_at)} dueLabel={item.due_at ? formatWhen(item.due_at, now) : null}
        saved={Boolean(item.saved_at)} archived={Boolean(item.archived_at)} deleted={Boolean(item.deleted_at)} closed={closed}
        canMarkUrgent={latest?.dispatch_state === "none"} />
      {briefs.attached ? <Link className="item-brief" href={`/briefings/${encodeURIComponent(briefs.attached.slug)}`}><span className="meta">Full brief</span><strong>{humanizeDates(briefs.attached.title)}</strong></Link> : null}
      {item.body ? <div className="prose item-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body) }} /> : <p className="meta">The agent filed no further detail.</p>}
    </article>

    {responses.length ? <section aria-label="Your responses">
      <div className="section-head"><h2>Your responses</h2><span className="meta">{responses.length}</span></div>
      {responses.map((response) => <div key={response.id} className="card">
        <div className="meta">{formatWhen(response.created_at, now)}</div>
        {response.option_key ? <p><strong>{response.option_key}</strong>{item.options?.find((o) => o.key === response.option_key)?.label ? ` · ${item.options.find((o) => o.key === response.option_key)?.label}` : ""}</p> : null}
        {response.body ? <p>{response.body}</p> : null}
        <div className="chips">
          {response.linear_issue_url ? <a className="chip" href={response.linear_issue_url} target="_blank" rel="noreferrer">Linear {response.linear_issue_key}</a>
            : response.linear_error ? <span className="badge bad">Linear failed, retrying</span> : <span className="badge">Linear · posting</span>}
        </div>
        {dispatchLabel(response) ? <p className={response.dispatch_state === "failed" ? "error-text" : "meta"}>{dispatchLabel(response)}</p> : null}
      </div>)}
    </section> : item.ruling ? <div className="card"><div className="meta">Answered {item.ruled_at ? formatWhen(item.ruled_at, now) : ""}</div><p><strong>{humanizeDates(item.ruling)}</strong></p>{item.ruling_note ? <p>{item.ruling_note}</p> : null}</div> : null}

    {item.outcome_note ? <div className="card"><div className="meta">Outcome{item.done_at ? ` · ${formatWhen(item.done_at, now)}` : ""}</div><div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.outcome_note) }} /></div> : null}

    {!item.deleted_at ? <div className="card"><ResponseForm target={{ ref: item.ref }} options={item.options ?? []} recommended={item.recommended} focus={query.respond === "1"} /></div> : null}

    {briefs.related.length ? <section aria-label="Possibly related briefs">
      <div className="section-head"><h2>Possibly related briefs</h2></div>
      <div className="ledger">{briefs.related.map((brief) => <Link key={brief.slug} className="l-row" href={`/briefings/${encodeURIComponent(brief.slug)}`}>
        <span className="l-name" style={{ whiteSpace: "normal" }}>{humanizeDates(brief.title)}</span><span className="l-amount dim">→</span>
      </Link>)}</div>
    </section> : null}

    {reports.length ? <section aria-label="Recent work on this project">
      <div className="section-head"><h2>Recent work on this project</h2></div>
      <div className="ledger">{reports.map((report) => <Link key={report.id} className="l-row" href={`/work/${report.id}`}>
        <span className="l-name" style={{ whiteSpace: "normal" }}>{humanizeDates(report.result.length > 140 ? `${report.result.slice(0, 139)}…` : report.result)} <span className="l-sub">{report.agent} · {formatWhen(report.created_at, now)}</span></span>
        <span className="l-amount dim">→</span>
      </Link>)}</div>
    </section> : null}

    {events.length ? <details className="card"><summary>History · {events.length}</summary>
      <ol className="item-history">{events.map((event) => <li key={event.id}><span className="meta">{formatWhen(event.at, now)}</span> {humanizeDates(eventSummary({ ...event, item: { ref: item.ref, title: item.title, project: item.project } }))}</li>)}</ol>
    </details> : null}
    <p className="meta"><Link href="/decisions">← Decide</Link> · <Link href="/timeline">Timeline</Link></p>
  </Chrome>;
}
