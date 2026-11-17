import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { fetchEngagement } from "@/lib/kc-engagement-data";
import { NETWORKS, NETWORK_LABEL, bucketOf, filterByNetwork, networkCounts, parseNetworkFilter, pendingDecision, safeUrl, sendsAutomatically, snoozedUntil, sortNewestFirst, syncStrip, waitingLabel } from "@/lib/kc-engagement";
import { OWNER_TIME_ZONE } from "@/lib/owner-loop";
import { EngagementCard } from "./EngagementCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Engagement — Strandworks Cockpit" };

function when(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: OWNER_TIME_ZONE }) + " ET";
}

export default async function EngagementPage({ searchParams }: { searchParams: Promise<{ network?: string | string[] }> }) {
  const [params, data] = await Promise.all([searchParams, fetchEngagement()]);
  if (!data) {
    return <Chrome title="Engagement" sub="Kinetic Clinician comments on every network" active="/engagement">
      <section className="card"><p className="error-text">Comments could not be loaded. Refresh to retry.</p></section>
    </Chrome>;
  }
  const network = parseNetworkFilter(params.network);
  const now = Date.now();
  const bucket = (id: string) => bucketOf(data.items.find((i) => i.id === id)!, data.actions, now);
  const live = sortNewestFirst(data.items);
  const waitingAll = live.filter((i) => ["open", "approved"].includes(bucket(i.id)));
  const waiting = filterByNetwork(waitingAll, network);
  const counts = networkCounts(waitingAll);
  const later = filterByNetwork(live.filter((i) => bucket(i.id) === "snoozed"), network);
  const done = filterByNetwork([...live.filter((i) => bucket(i.id) === "done"), ...data.done], network);
  const lastResult = (id: string) => data.actions.find((a) => a.item_id === id && a.applied_at)?.result ?? null;
  const strip = syncStrip(data.sync);
  return (
    <Chrome title="Engagement" sub={`${counts.all} comments waiting · ${strip.filter((s) => s.state === "connected").length} of ${strip.length} networks connected`} active="/engagement">
      <section className="section" aria-labelledby="engagement-networks">
        <div className="section-head"><h2 id="engagement-networks">Networks</h2><span className="meta">read by the sync job; nothing is posted from this page</span></div>
        <ul className="share-history">
          {strip.map((s) => <li key={s.network} className="card">
            <span className={`badge ${s.state === "connected" ? "ok" : "warn"}`}>{s.state === "connected" ? "connected" : s.state === "never" ? "not checked" : "not connected"}</span>{" "}
            <strong>{s.label}</strong>
            <span className="meta"> · {s.last_synced_at ? `last synced ${when(s.last_synced_at)}` : "never synced"}</span>
            {s.detail ? <p className={s.state === "connected" ? "meta" : undefined}>{s.state === "connected" ? s.detail : `Not connected: ${s.detail}`}</p> : null}
          </li>)}
        </ul>
      </section>
      <section className="section" aria-labelledby="engagement-waiting">
        <div className="section-head"><h2 id="engagement-waiting">Waiting for you</h2><span className="meta">newest first</span></div>
        <nav className="chips timeline-filters" aria-label="Filter comments by network">
          <Link className={`chip${network === "all" ? " on" : ""}`} href="/engagement" aria-current={network === "all" ? "page" : undefined}>All ({counts.all})</Link>
          {NETWORKS.map((n) => <Link key={n} className={`chip${network === n ? " on" : ""}`} href={`/engagement?network=${n}`} aria-current={network === n ? "page" : undefined}>{NETWORK_LABEL[n]} ({counts[n]})</Link>)}
        </nav>
        {waiting.length === 0 ? <p className="meta card">No comments waiting{network === "all" ? "" : ` on ${NETWORK_LABEL[network]}`}.</p>
          : waiting.map((i) => <EngagementCard key={`${i.id}-${i.revision}`} item={i} autoSend={sendsAutomatically(i.network, data.sync)}
            approvedPending={pendingDecision(data.actions, i.id) === "approved"} waiting={waitingLabel(data.actions, i.id)} lastResult={lastResult(i.id)} received={when(i.commented_at ?? i.created_at)} />)}
        {later.length ? <details className="card">
          <summary className="meta">Snoozed ({later.length})</summary>
          <ul className="share-history">{later.map((i) => <li key={i.id}>{NETWORK_LABEL[i.network]} · {i.author_name || "Unknown author"} <span className="meta"> · back {when(snoozedUntil(i, data.actions, now))}</span></li>)}</ul>
        </details> : null}
      </section>
      <section className="section" aria-labelledby="engagement-done">
        <div className="section-head"><h2 id="engagement-done">Done</h2><span className="meta">most recent 30</span></div>
        {done.length === 0 ? <p className="meta">None yet.</p> : <ul className="share-history">
          {done.slice(0, 30).map((i) => <li key={i.id}>
            <span className={`badge ${i.status === "sent" ? "ok" : ""}`}>{i.status === "sent" ? "sent" : "dismissed"}</span>{" "}
            {NETWORK_LABEL[i.network]} · {i.author_name || "Unknown author"}
            <span className="meta"> · {when(i.commented_at ?? i.created_at)}{safeUrl(i.post_url) ? <> · <a href={safeUrl(i.post_url)!} target="_blank" rel="noopener noreferrer">comment</a></> : null}{i.delivery_result ? ` · ${i.delivery_result}` : ""}</span>
          </li>)}
        </ul>}
      </section>
    </Chrome>
  );
}
