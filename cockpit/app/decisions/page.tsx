import { Chrome } from "../components/Chrome";
import { readRepoFile, listRepoDir } from "@/lib/repo";
import { parseDecision, isPending, extractOptions, type Decision } from "@/lib/decisions";
import { renderMarkdown } from "@/lib/markdown";
import { DecisionCard } from "./DecisionCard";
import { writeMode } from "@/lib/rule-writer";
import Link from "next/link";
import { fetchOwnerLoopItems } from "@/lib/owner-loop-data";
import { groupOwnerLoopItems, isStalled, formatLoopAge, itemHref } from "@/lib/owner-loop";
import { LoopItemCard } from "../components/LoopItemCard";
import { formatWhen } from "@/lib/when";
import { businessForProject } from "@/lib/businesses";
import { BusinessFilters } from "../components/BusinessFilters";

export const revalidate = 60;
export const dynamic = "force-dynamic"; // rulings must disappear immediately

export default async function DecisionsPage({ searchParams }: { searchParams: Promise<{ business?: string | string[]; project?: string | string[] }> }) {
  const [allLoopItems, decisionFiles, params] = await Promise.all([
    fetchOwnerLoopItems(),
    listRepoDir("_governance/decisions").catch(() => null),
    searchParams,
  ]);
  const business = typeof params.business === "string" ? params.business : "";
  const project = typeof params.project === "string" ? params.project : "";
  const loopItems = allLoopItems === null ? null : allLoopItems.filter((item) =>
    (!business || businessForProject(item.project)?.key === business) && (!project || item.project === project));
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
      <BusinessFilters path="/decisions" selected={business} />
      <ol className="loop-lifecycle" aria-label="Owner loop lifecycle">
        <li><strong>Open</strong><span>Waiting on you</span></li>
        <li><strong>Answered</strong><span>Waiting for agent pickup</span></li>
        <li><strong>Picked up</strong><span>Agent acknowledged and acting</span></li>
        <li><strong>Done</strong><span>Agent reported outcome</span></li>
      </ol>
      {loopItems === null ? <div className="card" role="status">
        <h3>Owner loop unavailable</h3>
        <p className="meta">Could not load the owner loop. Refresh to retry; if it persists, check the server connection.</p>
      </div> : null}
      {stalledCount > 0 ? <Link href={itemHref(stalled[0].ref)} className="loop-stalled-banner" role="status">
        <strong>STALLED — {stalledCount} {stalledCount === 1 ? "answer has" : "answers have"} no agent pickup</strong>
        <span>You answered over 24 hours ago. No agent has acknowledged.</span>
      </Link> : null}
      <p className="meta">Tap a card to open it. Swipe right to respond, swipe left to archive or delete. <Link href="/decisions/archived">Archive →</Link></p>

      {board.saved.length > 0 ? <section aria-labelledby="loop-saved-title">
        <div className="section-head"><h2 id="loop-saved-title">Saved</h2><span className="meta">{board.saved.length}</span></div>
        {board.saved.map((item) => <LoopItemCard key={item.id} item={item} now={now} age={formatLoopAge(item.created_at, now)} />)}
      </section> : null}

      <div className="section-head"><h2>Needs you</h2><span className="meta">{loopItems === null ? "unavailable" : `${board.needsYou.length} open`}</span></div>
      {loopItems !== null && board.needsYou.length === 0 ? <div className="card"><div className="meta">No open decisions waiting on Jonathan.</div></div> : null}
      {board.needsYou.map((item) => <LoopItemCard key={item.id} item={item} now={now} age={formatLoopAge(item.created_at, now)} />)}

      {board.alerts.length > 0 ? <section aria-labelledby="loop-alerts-title">
        <div className="section-head"><h2 id="loop-alerts-title">Alerts</h2><span className="meta">{board.alerts.length}</span></div>
        {board.alerts.map((item) => <LoopItemCard key={item.id} item={item} now={now} age={formatLoopAge(item.created_at, now)}
          badge={isStalled(item, now) ? <span className="badge bad">Stalled</span> : null} />)}
      </section> : null}

      <section id="waiting-on-agents" aria-labelledby="waiting-on-agents-title">
        <div className="section-head"><h2 id="waiting-on-agents-title">Waiting on agents</h2><span className="meta">{loopItems === null ? "unavailable" : board.waiting.length}</span></div>
        {loopItems !== null && board.waiting.length === 0 ? <div className="card"><div className="meta">No answers awaiting agent action.</div></div> : null}
        {board.waiting.map((item) => <LoopItemCard key={item.id} item={item} now={now} age={item.ruled_at ? `answered ${formatLoopAge(item.ruled_at, now)}` : undefined}
          badge={<span className={`badge ${isStalled(item, now) ? "bad" : item.status === "picked_up" ? "good" : "warn"}`}>{isStalled(item, now) ? "Stalled" : item.status === "picked_up" ? "Agent acting" : "Awaiting pickup"}</span>} />)}
      </section>

      <details className="loop-closed"><summary className="section-head"><h2>Closed</h2><span className="meta">{board.closed.length} · last 14 days</span></summary>
      {loopItems !== null && board.closed.length === 0 ? <div className="card"><div className="meta">No outcomes or dropped items in the last 14 days.</div></div> : null}
      {board.closed.map((item) => <LoopItemCard key={item.id} item={item} now={now} age={formatWhen(item.done_at ?? item.updated_at, now)}
        badge={<span className={`badge ${item.status === "done" ? "good" : ""}`}>{item.status === "done" ? "Done" : "Dropped"}</span>} />)}
      </details>
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
