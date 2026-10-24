import { Chrome } from "../components/Chrome";
import { readRepoFile, listRepoDir } from "@/lib/repo";
import { parseDecision, isPending, extractOptions, type Decision } from "@/lib/decisions";
import { renderMarkdown } from "@/lib/markdown";
import { DecisionCard } from "./DecisionCard";
import { writeMode } from "@/lib/rule-writer";
import Link from "next/link";
import { fetchOwnerLoopItems } from "@/lib/owner-loop-data";
import { groupOwnerLoopItems, isStalled, formatLoopAge, type OwnerLoopItem } from "@/lib/owner-loop";
import { OwnerLoopCard } from "./OwnerLoopCard";

export const revalidate = 60;
export const dynamic = "force-dynamic"; // rulings must disappear immediately

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";
}

function ItemMeta({ item }: { item: OwnerLoopItem }) {
  return <div className="loop-meta">
    <span className="mono">{item.ref}</span>
    <span className="chip">{item.project === "portfolio" ? "portfolio · cross-project" : item.project}</span>
    <span>{item.origin_agent ?? "agent"}</span>
    {item.repeat_count > 1 ? <span className="badge warn">asked {item.repeat_count}×</span> : null}
  </div>;
}

export default async function DecisionsPage() {
  const [loopItems, decisionFiles] = await Promise.all([
    fetchOwnerLoopItems(),
    listRepoDir("_governance/decisions").catch(() => null),
  ]);
  const now = new Date();
  const board = groupOwnerLoopItems(loopItems ?? [], now);
  const stalled = (loopItems ?? []).filter((item) => isStalled(item, now));
  const stalledCount = stalled.length;
  let governanceReadError = decisionFiles === null ? "Governance files could not be loaded. Refresh to retry." : null;
  const files = (decisionFiles ?? [])
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();

  const pending: Decision[] = [];
  const broken: string[] = [];
  for (const f of files) {
    let raw: string | null;
    try {
      raw = await readRepoFile(`_governance/decisions/${f}`);
    } catch {
      governanceReadError = "Some governance files could not be loaded. The list below may be incomplete; refresh to retry.";
      continue;
    }
    if (!raw) continue;
    try {
      const d = parseDecision(raw, f);
      if (isPending(d)) pending.push(d);
    } catch {
      broken.push(f);
    }
  }

  let mode: "dry-run" | "github" | null = null;
  let governanceError: string | null = null;
  try {
    mode = writeMode();
  } catch {
    governanceError = "Governance file rulings require GITHUB_TOKEN in production.";
  }

  return (
    <Chrome
      title="Decide"
      sub={loopItems === null ? "Owner loop unavailable" : `${board.needsYou.length} need you · ${board.waiting.length} waiting on agents`}
      active="/decisions"
    >
      <ol className="loop-lifecycle" aria-label="Owner loop lifecycle">
        <li><strong>Open</strong><span>Waiting on Jonathan</span></li>
        <li><strong>Ruled</strong><span>Waiting for agent pickup</span></li>
        <li><strong>Picked up</strong><span>Agent acknowledged and acting</span></li>
        <li><strong>Done</strong><span>Agent reported outcome</span></li>
      </ol>
      {loopItems === null ? <div className="card" role="status">
        <h3>Owner loop unavailable</h3>
        <p className="meta">Could not load the owner loop. Refresh to retry; if it persists, check the server connection.</p>
      </div> : null}
      {stalledCount > 0 ? <a href={`#${stalled[0].ref}`} className="loop-stalled-banner" role="status">
        <strong>STALLED — {stalledCount} {stalledCount === 1 ? "ruling has" : "rulings have"} no agent pickup</strong>
        <span>Jonathan decided over 24 hours ago. No agent has acknowledged.</span>
      </a> : null}

      {board.alerts.length > 0 ? <aside className="loop-alerts" aria-labelledby="loop-alerts-title">
        <h2 id="loop-alerts-title">Alerts <span className="mono">{board.alerts.length}</span></h2>
        {board.alerts.map((item) => <details key={item.id} id={item.ref} className={isStalled(item, now) ? "loop-alert-stalled" : ""}>
          <summary><span className="mono">{item.ref}</span> {item.title} <span className="chip">{item.project}</span>{isStalled(item, now) ? <strong className="loop-stalled-label">STALLED — no agent picked it up</strong> : null}</summary>
          <div className="meta">{item.origin_agent ?? "agent"} · {formatLoopAge(item.created_at, now)}</div>
          {item.ruling ? <div className="meta">Jonathan ruled: {item.ruling}{item.ruled_at ? ` · ${dateLabel(item.ruled_at)}` : ""}</div> : null}
          {item.picked_up_by ? <div className="meta">{item.picked_up_by} picked up{item.picked_up_at ? ` ${dateLabel(item.picked_up_at)}` : ""}</div> : null}
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body ?? "") }} />
        </details>)}
      </aside> : null}

      <div className="section-head"><h2>Needs you</h2><span className="meta">{loopItems === null ? "unavailable" : `${board.needsYou.length} open`}</span></div>
      {loopItems !== null && board.needsYou.length === 0 ? <div className="card"><div className="meta">No open decisions waiting on Jonathan.</div></div> : null}
      {board.needsYou.map((item) => <OwnerLoopCard key={item.id}
        item={{ ref: item.ref, project: item.project, origin_agent: item.origin_agent, title: item.title, options: item.options, recommended: item.recommended, repeat_count: item.repeat_count }}
        bodyHtml={renderMarkdown(item.body ?? "")}
        age={formatLoopAge(item.created_at, now)}
        due={item.due_at ? { iso: item.due_at, label: dateLabel(item.due_at), overdue: new Date(item.due_at).getTime() < now.getTime() } : null}
      />)}

      <section id="waiting-on-agents" aria-labelledby="waiting-on-agents-title">
        <div className="section-head"><h2 id="waiting-on-agents-title">Waiting on agents</h2><span className="meta">{loopItems === null ? "unavailable" : board.waiting.length}</span></div>
        {loopItems !== null && board.waiting.length === 0 ? <div className="card"><div className="meta">No rulings awaiting agent action.</div></div> : null}
        {board.waiting.map((item) => <article key={item.id} id={item.ref} className={`card loop-card ${isStalled(item, now) ? "loop-stalled" : ""}`}>
          <ItemMeta item={item} />
          {isStalled(item, now) ? <p className="loop-stalled-label">STALLED — no agent picked it up</p> : null}
          <h3>{item.title}</h3>
          <span className={`badge ${item.status === "picked_up" ? "good" : "warn"}`}>{item.status === "picked_up" ? "Agent acting" : "Awaiting pickup"}</span>
          <p className="loop-ruling">Jonathan ruled: <strong>{item.ruling ?? "Ruling recorded"}</strong></p>
          <div className="meta">{item.ruled_at ? `Ruled ${dateLabel(item.ruled_at)} · ${formatLoopAge(item.ruled_at, now)}` : "Ruling time not recorded"}</div>
          {item.status === "picked_up" ? <p className="ok-text">{item.picked_up_by ?? "Agent"} picked up{item.picked_up_at ? ` ${dateLabel(item.picked_up_at)}` : " · time not recorded"}</p> : <p className="meta">No agent has acknowledged this ruling yet.</p>}
          {item.ruling_note ? <p className="loop-ruling">Note: {item.ruling_note}</p> : null}
          {item.body ? <details className="loop-request"><summary>Original request</summary><div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body) }} /></details> : null}
        </article>)}
      </section>

      <div className="section-head"><h2>Closed</h2><span className="meta">last 14 days</span></div>
      {loopItems !== null && board.closed.length === 0 ? <div className="card"><div className="meta">No outcomes or dropped items in the last 14 days.</div></div> : null}
      {board.closed.map((item) => <article key={item.id} id={item.ref} className="card loop-card">
        <ItemMeta item={item} />
        <h3>{item.title}</h3>
        <span className={`badge ${item.status === "done" ? "good" : ""}`}>{item.status === "done" ? "Done · outcome reported" : "Dropped"}</span>
        <div className="meta">{dateLabel(item.done_at ?? item.updated_at)}</div>
        {item.outcome_note ? <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.outcome_note) }} /> : <p className="meta">{item.status === "dropped" ? "Closed without further action." : "No outcome note recorded."}</p>}
        {item.ruling ? <p className="loop-ruling">Ruling: {item.ruling}</p> : null}
        {item.ruling_note ? <p className="loop-ruling">Note: {item.ruling_note}</p> : null}
      </article>)}
      <p className="meta"><Link href="/timeline">View deadlines and activity on Timeline</Link></p>

      <details className="loop-governance">
        <summary>Governance files <span className="meta">{pending.length} pending{governanceReadError ? " · incomplete" : ""}</span></summary>
        <p className="meta">File-based governance decisions{mode === "dry-run" ? " · DRY-RUN mode (local only, no commits)" : ""}</p>
        {governanceReadError ? <p className="error-text" role="status">{governanceReadError}</p> : null}
        {governanceError ? <p className="error-text">{governanceError}</p> : null}
        {pending.length === 0 && !governanceReadError ? (
        <div className="card">
          <h3>Queue clear</h3>
          <div className="meta">No pending decisions.</div>
        </div>
      ) : null}
      {pending.map((d) => mode === null ? <div className="card" key={d.id}>
        <h3>{d.question || d.id}</h3>
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(d.body) }} />
      </div> : (
        <DecisionCard
          key={d.id}
          id={d.id}
          filename={d.filename}
          filed={d.filed}
          filedBy={d.filedBy}
          question={d.question}
          bodyHtml={renderMarkdown(d.body)}
          options={extractOptions(d.body)}
          dryRun={mode === "dry-run"}
        />
      ))}
      {broken.map((f) => (
        <div className="card" key={f}>
          <h3>{f}</h3>
          <div className="error-text">unparseable decision file — fix by hand in the repo</div>
        </div>
      ))}
      </details>
    </Chrome>
  );
}
