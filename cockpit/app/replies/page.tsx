import { Chrome } from "../components/Chrome";
import { fetchReplies } from "@/lib/kc-replies-data";
import { pendingDecision, resultLine, snoozedUntil } from "@/lib/kc-replies";
import { OWNER_TIME_ZONE } from "@/lib/owner-loop";
import { ReplyCard } from "./ReplyCard";
import { PagePostCard } from "./PagePostCard";
import { GroupsPanel } from "./GroupsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Replies — Strandworks Cockpit" };

const ACTION_LABEL: Record<string, string> = { save: "save edit", approve: "approve", posted: "mark posted", dismiss: "dismiss", snooze: "snooze" };

function when(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: OWNER_TIME_ZONE }) + " ET";
}

export default async function RepliesPage() {
  const data = await fetchReplies();
  if (!data) {
    return <Chrome title="Replies" sub="Kinetic Clinician Facebook replies" active="/replies">
      <section className="card"><p className="error-text">Replies could not be loaded. Refresh to retry.</p></section>
    </Chrome>;
  }
  const decided = (id: string) => pendingDecision(data.actions, id);
  const live = data.replies.filter((r) => ["needs_review", "needs_context", "approved"].includes(r.status) && !r.delivery_state && decided(r.id) !== "closed");
  const later = live.filter((r) => snoozedUntil(r, data.actions));
  const open = live.filter((r) => !later.includes(r));
  const done = data.replies.filter((r) => !live.includes(r));
  const weekly = data.pagePosts.find((p) => p.status === "draft" || p.status === "approved");
  const waiting = (id: string) => data.actions.filter((a) => a.item_id === id && !a.applied_at).map((a) => ACTION_LABEL[a.action]).join(", ") || null;
  const closedAs = (id: string) => data.actions.some((a) => a.item_id === id && !a.applied_at && a.action === "posted") ? "posted" : "dismissed";
  const lastResult = (id: string) => data.actions.find((a) => a.item_id === id && a.applied_at)?.result ?? null;
  const synced = data.replies.reduce((latest, r) => (r.synced_at > latest ? r.synced_at : latest), "");
  return (
    <Chrome title="Replies" sub={`${open.length} waiting · Kinetic Clinician Facebook · synced ${when(synced) || "never"}`} active="/replies">
      <section className="section">
        <div className="section-head"><h2>Waiting for you</h2><span className="meta">group replies are posted by hand</span></div>
        {open.length === 0 ? <p className="meta card">Nothing waiting. The group scan runs at 8am, 1pm and 7pm.</p>
          : open.map((r) => <ReplyCard key={`${r.id}-${r.revision}`} reply={r} approvedPending={decided(r.id) === "approved"} waiting={waiting(r.id)} lastResult={lastResult(r.id)} received={when(r.created_at)} />)}
        {later.length ? <details className="card">
          <summary className="meta">Snoozed ({later.length})</summary>
          <ul className="share-history">{later.map((r) => <li key={r.id}>{r.title} <span className="meta"> · back {when(snoozedUntil(r, data.actions))}</span></li>)}</ul>
        </details> : null}
      </section>
      {weekly ? <section className="section">
        <div className="section-head"><h2>Weekly Page post</h2><span className="meta">best-paid jobs posted in the last 7 days</span></div>
        <PagePostCard key={weekly.id} post={weekly} />
      </section> : null}
      <section className="section">
        <div className="section-head"><h2>Done</h2><span className="meta">last 14 days</span></div>
        {done.length === 0 ? <p className="meta">None yet.</p> : <ul className="share-history">
          {done.map((r) => <li key={r.id}>
            <span className={`badge ${r.status === "posted" || r.delivery_state === "sent" ? "ok" : ""}`}>{r.delivery_state ?? (decided(r.id) === "closed" ? closedAs(r.id) : r.status)}</span>{" "}
            {r.title} <span className="meta"> · {r.source_name} · <a href={r.source_url} target="_blank" rel="noopener noreferrer">post</a></span>
            {r.status === "posted" ? <span className="meta reply-results"> · {resultLine(r.results) ?? "results after 2 days"}</span> : null}
          </li>)}
        </ul>}
      </section>
      {data.groups.length ? <section className="section">
        <div className="section-head"><h2>Groups</h2><span className="meta">what each scanned group has given back</span></div>
        <GroupsPanel groups={data.groups} />
      </section> : null}
    </Chrome>
  );
}
