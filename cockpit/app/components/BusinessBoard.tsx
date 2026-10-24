import Link from "next/link";
import { buildBusinessBoard } from "@/lib/businesses";
import { formatLoopAge } from "@/lib/owner-loop";
import { intakeDate } from "@/lib/intake";

function Metric({ label, count, href, top, topHref, highPriority = 0 }: {
  label: string; count: number | string; href: string; top?: string; topHref?: string; highPriority?: number;
}) {
  return <div>
    <dt><Link href={href}>{label}</Link></dt>
    <dd><Link href={href}>{count}{highPriority ? <span className="error-text"> · {highPriority} high</span> : null}</Link></dd>
    {top ? <dd className="business-top"><Link href={topHref ?? href}>{top}</Link></dd> : null}
  </div>;
}

export function BusinessBoard({ cards, available, now }: {
  cards: ReturnType<typeof buildBusinessBoard>;
  available: { intake: boolean; loop: boolean; events: boolean; dates: boolean; projects: boolean };
  now: Date;
}) {
  const incomplete = Object.values(available).some((value) => !value);
  return <section aria-labelledby="business-board-title">
    <div className="section-head business-board-head"><h2 id="business-board-title">Your businesses</h2><span className="meta">Updated {intakeDate(now.toISOString())}</span></div>
    {incomplete ? <p className="card meta" role="status">Some sources are unavailable: {[
      !available.intake && "email", !available.loop && "owner loop", !available.events && "agent activity",
      !available.dates && "business dates", !available.projects && "project activity",
    ].filter(Boolean).join(", ")}. Counts and activity below are incomplete. Refresh to retry.</p> : null}
    <div className="business-board">
      {cards.map((card) => {
        const key = card.business.key;
        const filter = `business=${key}`;
        const status = incomplete && card.status === "Quiet" ? "Status unavailable" : card.status;
        return <article key={key} className={`card business-status ${card.status === "Needs you" ? "needs-owner" : ""}`}>
          <div className="business-status-head"><h3>{card.business.name}</h3>
            <span className={`badge ${card.status === "Needs you" ? "bad" : card.status === "Waiting on agents" ? "warn" : ""}`}>{status}</span>
          </div>
          <dl className="business-counts">
            <Metric label="Emails to review" count={available.intake ? card.emails.length : "—"} href={`/inbox?${filter}`}
              highPriority={card.highPriority} top={card.emails[0] ? card.emails[0].subject || "(No subject)" : undefined}
              topHref={card.emails[0] ? `/inbox?${filter}#${card.emails[0].id}` : undefined} />
            <Metric label="Open decisions" count={available.loop ? card.decisions.length : "—"} href={`/decisions?${filter}`}
              top={card.decisions[0]?.title} topHref={card.decisions[0] ? `/decisions?${filter}#${card.decisions[0].ref}` : undefined} />
            <Metric label="Stalled rulings" count={available.loop ? card.stalled.length : "—"} href={`/decisions?${filter}#waiting-on-agents`}
              top={card.stalled[0]?.title ?? (card.waiting[0] ? `${card.waiting[0].title} · ${card.waiting[0].status === "picked_up" ? "Agent acting" : "Awaiting pickup"}` : undefined)}
              topHref={card.stalled[0] || card.waiting[0] ? `/decisions?${filter}#${(card.stalled[0] ?? card.waiting[0]).ref}` : undefined} />
            <Metric label="Deadlines · next 14 days + overdue" count={available.loop && available.dates ? card.dates.length : card.dates.length ? `${card.dates.length}+` : "—"}
              href={`/timeline?${filter}&days=14`} top={card.dates[0] ? `${card.dates[0].title}${card.dates[0].overdue ? " · Overdue" : ""}` : undefined} />
          </dl>
          <div className="meta">Last activity: {card.lastActivity ? <time dateTime={card.lastActivity}>{formatLoopAge(card.lastActivity, now)}</time> : incomplete ? "unavailable" : "none recorded"}{incomplete && card.lastActivity ? " · partial sources" : ""}</div>
        </article>;
      })}
    </div>
  </section>;
}
