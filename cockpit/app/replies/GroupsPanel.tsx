"use client";

import { useState } from "react";
import { pageAccessHelp, pageAccessLabel, pageAccessReady, type KcGroup } from "@/lib/kc-replies";

// The scan list is distinct from the Page's right to participate in each group.
export function GroupsPanel({ groups }: { groups: KcGroup[] }) {
  const [joined, setJoined] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const ready = groups.filter((g) => pageAccessReady(g.stats.page_access, g.id));
  const scanned = groups.filter((g) => g.status === "joined")
    .sort((a, b) => (b.stats.posted ?? 0) - (a.stats.posted ?? 0) || (b.stats.replies_back ?? 0) - (a.stats.replies_back ?? 0) || a.name.localeCompare(b.name));
  const toJoin = groups.filter((g) => g.status === "to_join" && !joined[g.id]);

  async function markJoined(id: string) {
    setError(null);
    setJoined((j) => ({ ...j, [id]: "saving" }));
    const res = await fetch("/api/replies/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group_id: id }) }).catch(() => null);
    setJoined((j) => {
      const next = { ...j };
      if (res?.ok) next[id] = "done"; else delete next[id];
      return next;
    });
    if (!res?.ok) setError("The group was not added. Try again.");
  }

  return (
    <>
      <p className="meta">{ready.length} groups checked for commenting as Kinetic Clinician · {scanned.length} on the scan list. Personal group membership does not give the Page access.</p>
      <div className="group-wrap card">
        <table className="group-table">
          <thead><tr><th>Group / Page access</th><th className="num">Posted</th><th className="num">Replies back</th><th className="num">Reactions</th><th className="num">Dismissed</th></tr></thead>
          <tbody>
            {scanned.map((g) => <tr key={g.id}>
              <td><a href={g.url} target="_blank" rel="noopener noreferrer">{g.name}</a>
                {g.stats.quiet ? <span className="chip" title="4+ dismissals in 30 days and nothing posted: no longer queued"> paused</span> : null}
                <div className={pageAccessReady(g.stats.page_access, g.id) ? "ok-text" : "meta"}>{pageAccessLabel(g.stats.page_access)}</div>
                <details><summary className="meta">Access details</summary>
                  <p className="meta">{pageAccessHelp(g.stats.page_access)} {g.stats.page_access?.note}</p>
                  {g.stats.page_access?.checked_at ? <p className="meta">Checked {new Date(g.stats.page_access.checked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}</p> : null}
                </details>
              </td>
              <td className="num">{g.stats.posted ?? 0}</td>
              <td className="num">{g.stats.replies_back ?? 0}</td>
              <td className="num">{g.stats.reactions ?? 0}</td>
              <td className="num">{g.stats.dismissed ?? 0}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {Object.values(joined).includes("done") ? <p className="ok-text" role="status">Added to the scan list. Page access still needs to be checked.</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {toJoin.length ? <details className="card">
        <summary>Groups to join ({toJoin.length})</summary>
        <p className="meta">Switch Facebook to Kinetic Clinician before requesting to join. Wait for any admin approval. Adding a group to the scan list does not confirm that the Page can comment.</p>
        <ul className="join-list">
          {toJoin.map((g) => <li key={g.id}>
            <span><a href={g.url} target="_blank" rel="noopener noreferrer">{g.name} ↗</a> <span className="meta">{g.meta}</span></span>
            <button className="token-btn" disabled={joined[g.id] === "saving"} onClick={() => markJoined(g.id)}>Add to scan list</button>
          </li>)}
        </ul>
      </details> : null}
    </>
  );
}
