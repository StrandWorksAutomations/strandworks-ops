"use client";

import { useState } from "react";
import { GROUP_FILTERS, filterGroups, groupAccessStatus, groupFilterCounts, latestJoinLimit, pageAccessHelp, pageAccessLabel, type GroupFilter, type KcGroup } from "@/lib/kc-replies";

// Every saved group is considered; Page commenting access determines readiness.
export function GroupsPanel({ groups }: { groups: KcGroup[] }) {
  const counts = groupFilterCounts(groups);
  const [filter, setFilter] = useState<GroupFilter>(() => counts.ready ? "ready" : "all");
  const [query, setQuery] = useState("");
  const visible = filterGroups(groups, filter, query);
  const personal = groups.filter((g) => g.stats.personal_member_observed).length;
  const pageMembers = groups.filter((g) => g.stats.page_member_observed).length;
  const joinLimit = latestJoinLimit(groups);

  return (
    <>
      <p className="meta">{counts.ready} groups checked for commenting as Kinetic Clinician · {groups.length} groups in the full inventory.
        {personal ? <> {personal} personal memberships recorded.</> : null}
        {pageMembers ? <> {pageMembers} Page memberships recorded.</> : null}
      </p>
      {joinLimit ? <p className="card meta" role="status">
        <strong>Last observed group join limit.</strong> Facebook limited the last group join attempt on <time dateTime={joinLimit.observed_at}>{new Date(joinLimit.observed_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET</time>.
        {" "}It gave no end time. Further join attempts were stopped after that notice.
      </p> : null}
      <div className="group-controls">
        <label className="meta" htmlFor="group-search">Find a group</label>
        <input id="group-search" className="answer-input group-search" type="search" placeholder="Group name, topic or Facebook ID" value={query} onChange={(event) => setQuery(event.target.value)} />
        <nav className="chips timeline-filters group-filters" aria-label="Filter groups by Kinetic Clinician Page access">
          {GROUP_FILTERS.map((option) => <button key={option.id} type="button" className={`chip ${filter === option.id ? "on" : ""}`} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
            {option.label} ({counts[option.id]})
          </button>)}
        </nav>
        <p className="meta" role="status">Showing {visible.length} of {groups.length} groups{query.trim() ? <> matching “{query.trim()}”</> : null}.</p>
      </div>
      {visible.length ? <div className="group-wrap card">
        <table className="group-table">
          <thead><tr><th>Group / Page access</th><th className="num">Posted</th><th className="num">Replies back</th><th className="num">Reactions</th><th className="num">Dismissed</th></tr></thead>
          <tbody>
            {visible.map((g) => <tr key={g.id}>
              <td><a href={g.url} target="_blank" rel="noopener noreferrer">{g.name}</a>
                {g.stats.quiet ? <span className="chip" title="4+ dismissals in 30 days and nothing posted: no longer queued"> paused</span> : null}
                <div className={groupAccessStatus(g) === "ready" ? "ok-text" : "meta"}>{pageAccessLabel(g.stats.page_access)}</div>
                <div className="meta">{[
                  g.stats.personal_member_observed ? "Personal membership recorded" : null,
                  g.stats.page_member_observed ? "Page membership recorded" : null,
                  !g.stats.personal_member_observed && !g.stats.page_member_observed ? g.status === "to_join" ? "Candidate group" : "Saved group" : null,
                ].filter(Boolean).join(" · ")}</div>
                <details><summary className="meta">Access details</summary>
                  <p className="meta">{pageAccessHelp(g.stats.page_access)} {g.stats.page_access?.note}</p>
                  {g.stats.page_access?.checked_at ? <p className="meta">Checked {new Date(g.stats.page_access.checked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}</p> : null}
                  {g.stats.personal_member_observed ? <p className="meta">Personal membership observed {g.stats.personal_member_observed}</p> : null}
                  {g.stats.page_member_observed ? <p className="meta">Page membership observed {g.stats.page_member_observed}</p> : null}
                </details>
              </td>
              <td className="num">{g.stats.posted ?? 0}</td>
              <td className="num">{g.stats.replies_back ?? 0}</td>
              <td className="num">{g.stats.reactions ?? 0}</td>
              <td className="num">{g.stats.dismissed ?? 0}</td>
            </tr>)}
          </tbody>
        </table>
      </div> : <div className="card">
        <p className="meta">{query.trim() ? "No groups match this search and access filter."
          : filter === "ready" ? "No groups currently have checked commenting access as Kinetic Clinician."
          : `No groups match the “${GROUP_FILTERS.find((option) => option.id === filter)?.label}” filter.`}</p>
        {filter !== "all" ? <button type="button" className="token-btn" onClick={() => setFilter("all")}>Search all {groups.length} groups</button> : null}
        {query ? <button type="button" className="token-btn" onClick={() => setQuery("")}>Clear search</button> : null}
      </div>}
      <p className="meta">Groups with confirmed Kinetic Clinician commenting access are included automatically. Use Facebook as Kinetic Clinician and wait for any group admin approval to join or participate. Personal membership does not give the Page access.</p>
    </>
  );
}
