"use client";

import { useState } from "react";
import { GROUP_FILTERS, defaultGroupScope, filterGroups, groupAccessStatus, groupFilterCounts, groupsInScope, latestJoinLimit, pageAccessHelp, pageAccessLabel, publicGroupTarget, type GroupFilter, type GroupScope, type KcGroup } from "@/lib/kc-replies";

// Every saved group is considered; Page commenting access determines readiness.
export function GroupsPanel({ groups }: { groups: KcGroup[] }) {
  const targets = groupsInScope(groups, "public_targets");
  const [scope, setScope] = useState<GroupScope>(() => defaultGroupScope(groups));
  const scoped = groupsInScope(groups, scope);
  const counts = groupFilterCounts(scoped);
  const allCounts = groupFilterCounts(groups);
  const [filter, setFilter] = useState<GroupFilter>(() => groupFilterCounts(groupsInScope(groups, defaultGroupScope(groups))).ready ? "ready" : "all");
  const [query, setQuery] = useState("");
  const visible = filterGroups(scoped, filter, query, scope === "public_targets" ? "target_priority" : "activity");
  const personal = groups.filter((g) => g.stats.personal_member_observed).length;
  const pageMembers = groups.filter((g) => g.stats.page_member_observed).length;
  const joinLimit = latestJoinLimit(groups);
  const targetJobs = targets.filter((group) => publicGroupTarget(group)?.type === "jobs").length;
  const earlierScans = targets.filter((group) => publicGroupTarget(group)?.earlier_scan).length;

  function searchFullInventory() {
    setScope("all");
    setFilter("all");
  }

  return (
    <>
      <p className="meta">{allCounts.ready} groups checked for commenting as Kinetic Clinician · {groups.length} groups in the full inventory.
        {personal ? <> {personal} personal memberships recorded.</> : null}
        {pageMembers ? <> {pageMembers} Page memberships recorded.</> : null}
      </p>
      {joinLimit ? <p className="card meta" role="status">
        <strong>Last observed group join limit.</strong> Facebook limited the last group join attempt on <time dateTime={joinLimit.observed_at}>{new Date(joinLimit.observed_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET</time>.
        {" "}It gave no end time. Further join attempts were stopped after that notice.
      </p> : null}
      <div className="group-controls">
        {targets.length ? <nav className="chips timeline-filters group-filters" aria-label="Group inventory scope">
          <button type="button" className={`chip ${scope === "public_targets" ? "on" : ""}`} aria-pressed={scope === "public_targets"} onClick={() => setScope("public_targets")}>
            {targets.length === 100 ? "100 public targets" : `Public targets (${targets.length}/100)`}
          </button>
          <button type="button" className={`chip ${scope === "all" ? "on" : ""}`} aria-pressed={scope === "all"} onClick={() => setScope("all")}>Full inventory ({groups.length})</button>
        </nav> : null}
        {scope === "public_targets" ? <p className="meta">
          {counts.ready} of {targets.length} targets have checked Page commenting access. {targetJobs} job groups come first in this list.
          {" "}Public status, member counts and activity are reported from Nov 1, 2026 search results{earlierScans ? <> or {earlierScans} earlier saved scans</> : null}. Page access is checked separately.
        </p> : null}
        <label className="meta" htmlFor="group-search">Find a group</label>
        <input id="group-search" className="answer-input group-search" type="search" placeholder="Group name, topic or Facebook ID" value={query} onChange={(event) => setQuery(event.target.value)} />
        <nav className="chips timeline-filters group-filters" aria-label="Filter groups by Kinetic Clinician Page access">
          {GROUP_FILTERS.map((option) => <button key={option.id} type="button" className={`chip ${filter === option.id ? "on" : ""}`} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
            {option.label} ({counts[option.id]})
          </button>)}
        </nav>
        <p className="meta" role="status">Showing {visible.length} of {scoped.length} {scope === "public_targets" ? "targets" : "groups"}{query.trim() ? <> matching “{query.trim()}”</> : null}.</p>
      </div>
      {visible.length ? <div className="group-wrap card">
        <table className="group-table">
          <thead><tr><th>Group / Page access</th><th className="num">Posted</th><th className="num">Replies back</th><th className="num">Reactions</th><th className="num">Dismissed</th></tr></thead>
          <tbody>
            {visible.map((g) => {
              const target = publicGroupTarget(g);
              return <tr key={g.id}>
              <td><a href={g.url} target="_blank" rel="noopener noreferrer">{g.name}</a>
                {g.stats.quiet ? <span className="chip" title="4+ dismissals in 30 days and nothing posted: no longer queued"> paused</span> : null}
                {target ? <>
                  <div className="meta">Target {target.priority} · {target.role} · {target.type}</div>
                  <div className="meta">Reported public · {target.reported_members} members{target.reported_posts_per_day ? <> · {target.reported_posts_per_day} posts/day reported</> : null} · {target.earlier_scan ? "Earlier saved scan" : "Nov 1, 2026 search"}</div>
                  {target.source_group_label && target.source_group_label !== g.name ? <div className="meta">Listed as: {target.source_group_label}</div> : null}
                </> : null}
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
            </tr>;
            })}
          </tbody>
        </table>
      </div> : <div className="card">
        <p className="meta">{query.trim() ? "No groups match this search and access filter."
          : filter === "ready" ? "No groups currently have checked commenting access as Kinetic Clinician."
          : `No groups match the “${GROUP_FILTERS.find((option) => option.id === filter)?.label}” filter.`}</p>
        {filter !== "all" ? <button type="button" className="token-btn" onClick={() => setFilter("all")}>Search all {scoped.length} {scope === "public_targets" ? "targets" : "groups"}</button> : null}
        {scope !== "all" ? <button type="button" className="token-btn" onClick={searchFullInventory}>Search full inventory ({groups.length})</button> : null}
        {query ? <button type="button" className="token-btn" onClick={() => setQuery("")}>Clear search</button> : null}
      </div>}
      <p className="meta">Groups with confirmed Kinetic Clinician commenting access are included automatically. Use Facebook as Kinetic Clinician and wait for any group admin approval to join or participate. Personal membership does not give the Page access.</p>
    </>
  );
}
