import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { fetchIntake } from "@/lib/intake-data";
import { BUSINESSES } from "@/lib/businesses";
import { groupIntake, intakeDate, replyStatusLabel } from "@/lib/intake";
import { InboxCard } from "./InboxCard";

export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ business?: string | string[] }> }) {
  const [params, data] = await Promise.all([searchParams, fetchIntake()]);
  const business = typeof params.business === "string" ? params.business : "";
  const now = new Date();
  const groups = groupIntake(data?.items ?? [], now, business);
  return <Chrome title="Inbox" sub="businesses · career · licenses" active="/inbox">
    <p className="meta">Updated {intakeDate(now.toISOString())}</p>
    <p>Approved replies are sent from your own Gmail by the watcher within about 15 minutes.</p>
    <nav className="chips timeline-filters" aria-label="Filter emails by business">
      <Link className={`chip${business ? "" : " on"}`} href="/inbox" aria-current={!business ? "page" : undefined}>All businesses</Link>
      {[...BUSINESSES, { key: "other", name: "Other" }].map((entry) => <Link key={entry.key}
        href={`/inbox?business=${entry.key}`} className={`chip${business === entry.key ? " on" : ""}`} aria-current={business === entry.key ? "page" : undefined}>{entry.name}</Link>)}
    </nav>
    {!data ? <div className="card" role="status"><p className="error-text">Inbox unavailable. Refresh to retry; review counts could not be loaded.</p></div> : <>
      <section aria-labelledby="inbox-needs-you">
        <div className="section-head"><h2 id="inbox-needs-you">Needs you</h2><span className="meta">{groups.needsYou.length} to review</span></div>
        {!groups.needsYou.length ? <p className="card meta">No emails need review{business ? " for this business" : ""}.</p> : null}
        {groups.needsYou.map((item) => <InboxCard key={`${item.id}:${item.reply_status}`} item={item} />)}
      </section>
      {groups.replies.length ? <section aria-labelledby="inbox-replies">
        <div className="section-head"><h2 id="inbox-replies">Reply activity</h2><span className="meta">recent sends + pending or failed</span></div>
        {groups.replies.map((item) => <div className="card" key={item.id}>
          <strong>{item.subject || "(No subject)"}</strong>
          <div className="meta">{item.account}</div>
          <p className={item.reply_status === "failed" ? "error-text" : "meta"}>{replyStatusLabel(item)}</p>
        </div>)}
      </section> : null}
      <section aria-labelledby="inbox-jobs">
        <div className="section-head"><h2 id="inbox-jobs">Job alerts scanned</h2><span className="meta">{groups.jobAlerts.length} · last 7 days</span></div>
        {!groups.jobAlerts.length ? <p className="meta">No job alerts scanned in the last 7 days.</p> : <ul className="inbox-compact">
          {groups.jobAlerts.map((item) => <li key={item.id}>
            <strong>{item.subject || "(No subject)"}</strong>
            <div className="meta">{item.from_name || item.from_addr} · {data.linkCounts[item.id] ?? 0} links extracted · Archived: {item.archived_at ? "yes" : "no"}{item.archive_requested && !item.archived_at ? " (requested)" : ""}</div>
          </li>)}
        </ul>}
      </section>
      <details className="card inbox-filtered"><summary>Filtered out <span className="meta">{groups.noise.length} · last 7 days</span></summary>
        <ul className="inbox-compact">{groups.noise.map((item) => <li key={item.id}>{item.from_name || item.from_addr} — {item.subject || "(No subject)"}</li>)}</ul>
      </details>
    </>}
  </Chrome>;
}
