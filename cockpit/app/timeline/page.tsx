import { fetchPortfolio } from "@/lib/portfolio-data";
import { portfolioDates } from "@/lib/portfolio";
import { OWNER_TIME_ZONE, ownerDay } from "@/lib/owner-loop";
import { businessForProject, businessForEntity } from "@/lib/businesses";
import { BusinessFilters } from "../components/BusinessFilters";
import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { fetchDueItems } from "@/lib/due-items";
import { fetchOwnerLoopItems, fetchOwnerLoopEvents } from "@/lib/owner-loop-data";
import { buildTimelineUpcoming, groupTimelineEvents, groupOwnerLoopItems, eventSummary } from "@/lib/owner-loop";

export const dynamic = "force-dynamic";

function dayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: OWNER_TIME_ZONE,
  }).format(new Date(`${day}T12:00:00Z`));
}

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: OWNER_TIME_ZONE,
  }).format(new Date(iso));
}

function timelineHref({ business, project, days }: { business: string; project: string; days: 14 | 30 }) {
  const search = new URLSearchParams();
  if (business) search.set("business", business);
  if (project) search.set("project", project);
  if (days === 14) search.set("days", "14");
  return search.size ? `/timeline?${search}` : "/timeline";
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string | string[]; business?: string | string[]; days?: string | string[] }>;
}) {
  const [params, items, events, dueItems, portfolio] = await Promise.all([
    searchParams,
    fetchOwnerLoopItems(),
    fetchOwnerLoopEvents(),
    fetchDueItems(),
    fetchPortfolio(),
  ]);
  const project = typeof params.project === "string" ? params.project : "";
  const business = typeof params.business === "string" ? params.business : "";
  const days = params.days === "14" ? 14 : 30;
  const now = new Date();
  const end = new Date(`${ownerDay(now.toISOString())}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + days);
  const endDay = end.toISOString().slice(0, 10);
  const allUpcoming = [...buildTimelineUpcoming(items ?? [], dueItems ?? [], now), ...portfolioDates(portfolio?.objectives ?? [], now)]
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.id.localeCompare(b.id));
  const allHistory = groupTimelineEvents(events ?? [], now);
  const projectScopes = [
    ...allUpcoming.map((entry) => ({ project: entry.project,
      business: (entry.source === "business" ? businessForEntity(entry.project) : businessForProject(entry.project))?.key })),
    ...allHistory.flatMap((group) => group.events.flatMap(({ item }) => item
      ? [{ project: item.project, business: businessForProject(item.project)?.key }]
      : [])),
  ];
  const projects = [...new Set(projectScopes
    .filter((scope) => scope.project && (!business || scope.business === business))
    .map((scope) => scope.project))].sort();
  const projectHref = (nextProject: string) => timelineHref({ business, project: nextProject, days });
  const businessHref = (nextBusiness: string) => {
    const compatible = !nextBusiness || nextBusiness === business
      || projectScopes.some((scope) => scope.project === project && scope.business === nextBusiness);
    return timelineHref({ business: nextBusiness, project: compatible ? project : "", days });
  };
  const upcoming = allUpcoming.filter((entry) => (!project || entry.project === project)
    && (!business || (entry.source === "business" ? businessForEntity(entry.project) : businessForProject(entry.project))?.key === business)
    && (entry.source === "business" ? entry.dueAt.slice(0, 10) : ownerDay(entry.dueAt)) <= endDay
    && !(days === 14 && entry.source === "owner-loop" && entry.kind === "decision"));
  const upcomingRefs = new Set(upcoming.map((entry) => entry.ref).filter(Boolean));
  const board = groupOwnerLoopItems(items ?? [], now);
  const boardRefs = new Set([...board.needsYou, ...board.waiting, ...board.closed, ...board.alerts].map((item) => item.ref));
  const history = groupTimelineEvents(
    (events ?? []).filter((event) => (!project || event.item?.project === project)
      && (!business || businessForProject(event.item?.project ?? "")?.key === business)),
    now,
  );
  const historyCount = history.reduce((count, group) => count + group.events.length, 0);
  const upcomingUnavailable = items === null && dueItems === null && portfolio === null;

  return (
    <Chrome title="Timeline" sub="dates ahead · rulings and agent outcomes" active="/timeline">
      <BusinessFilters path="/timeline" selected={business} businessHref={businessHref} />
      {days === 14 ? <p className="meta">Showing deadlines and milestones within 14 days, plus overdue. <Link href={timelineHref({ business, project, days: 30 })}>Show 30 days</Link></p> : null}
      <nav className="chips timeline-filters" aria-label="Filter timeline by project">
        <Link href={projectHref("")} className={`chip${project ? "" : " on"}`} aria-current={project ? undefined : "page"}>
          All projects
        </Link>
        {projects.map((name) => (
          <Link
            key={name}
            href={projectHref(name)}
            className={`chip${project === name ? " on" : ""}`}
            aria-current={project === name ? "page" : undefined}
          >
            {name}
          </Link>
        ))}
      </nav>
      {project && !projects.includes(project) ? (
        <div className="card">
          <div className="meta">No timeline entries for {project}. <Link href={projectHref("")}>Clear project filter →</Link></div>
        </div>
      ) : null}

      <section aria-labelledby="timeline-upcoming">
        <div className="section-head">
          <h2 id="timeline-upcoming">Upcoming</h2>
          <span className="meta">{upcomingUnavailable ? "unavailable" : `${upcoming.length} dates`} · next {days} days + overdue</span>
        </div>
        {items === null || dueItems === null || portfolio === null ? (
          <div className="card" role="status">
            <div className="meta">
              {portfolio === null ? "Objective dates are unavailable. " : ""}
              {items === null ? "Owner-loop dates are unavailable. " : ""}
              {dueItems === null ? "Business due dates are unavailable. " : ""}
              {upcomingUnavailable ? "The upcoming timeline could not be loaded." : "The timeline below contains only the sources that loaded."}
            </div>
          </div>
        ) : null}
        {upcoming.length === 0 && !upcomingUnavailable ? (
          <div className="card">
            <div className="meta">No overdue or upcoming dates in the next {days} days{project || business ? " for this selection" : ""}.</div>
          </div>
        ) : null}
        <ol className="timeline-list">
          {upcoming.map((entry) => (
            <li key={entry.id} id={entry.ref ?? undefined} className={`card timeline-entry${entry.overdue ? " overdue" : ""}`}>
              <div className="timeline-entry-head">
                <time dateTime={entry.dueAt} className="timeline-date">
                  {dayLabel(entry.source === "business" ? entry.dueAt.slice(0, 10) : ownerDay(entry.dueAt))}
                  {entry.source !== "business" ? ` · ${timeLabel(entry.dueAt)} ET` : ""}
                </time>
                {entry.overdue ? <span className="badge bad">OVERDUE</span> : null}
              </div>
              <div className="chips">
                <span className="badge timeline-project">{entry.project}</span>
                <span className="timeline-kind meta">{entry.source === "business" ? "Business" : entry.kind}</span>
                {entry.ref ? <span className="mono meta">{entry.ref}</span> : null}
              </div>
              <h3>{entry.source === "owner-loop" && entry.ref && !boardRefs.has(entry.ref) ? entry.title : <Link href={entry.href} className="timeline-title">{entry.title}</Link>}</h3>
              {entry.detail ? <div className="meta">{entry.detail}</div> : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="timeline-history">
        <div className="section-head">
          <h2 id="timeline-history">History</h2>
          <span className="meta">{events === null ? "unavailable" : `${historyCount} events`} · last 30 days · Eastern</span>
        </div>
        {events === null ? (
          <div className="card" role="status">
            <div className="meta">Owner-loop history is unavailable. Rulings and agent outcomes could not be loaded.</div>
          </div>
        ) : history.length === 0 ? (
          <div className="card">
            <div className="meta">No owner-loop events in the last 30 days{project ? " for this project" : ""}.</div>
          </div>
        ) : history.map((group) => (
          <div key={group.day}>
            <h3 className="timeline-day"><time dateTime={group.day}>{dayLabel(group.day)}</time></h3>
            <ol className="timeline-list">
              {group.events.map((event) => {
                const itemHref = event.item && upcomingRefs.has(event.item.ref) ? `#${event.item.ref}`
                  : event.item && boardRefs.has(event.item.ref) ? `/decisions#${event.item.ref}` : null;
                return (
                  <li key={event.id} className="card timeline-event">
                    <div className="timeline-entry-head">
                      <time dateTime={event.at} className="timeline-event-time">{timeLabel(event.at)}</time>
                      {event.item?.project ? <span className="badge timeline-project">{event.item.project}</span> : null}
                    </div>
                    <div className="timeline-event-summary">{eventSummary(event)}</div>
                    {event.item ? itemHref ? <Link href={itemHref} className="meta timeline-title">{event.item.title}</Link>
                      : <div className="meta">{event.item.title}</div> : null}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>
    </Chrome>
  );
}
