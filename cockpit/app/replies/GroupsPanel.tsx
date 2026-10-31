"use client";

import { useState } from "react";
import type { KcGroup } from "@/lib/kc-replies";

// How each scanned group has gone, and the groups worth joining. The owner joins by hand on
// Facebook, then taps "I joined it" so the next scan includes the group.
export function GroupsPanel({ groups }: { groups: KcGroup[] }) {
  const [joined, setJoined] = useState<Record<string, string>>({});
  const scanned = groups.filter((g) => g.status === "joined")
    .sort((a, b) => (b.stats.posted ?? 0) - (a.stats.posted ?? 0) || (b.stats.replies_back ?? 0) - (a.stats.replies_back ?? 0) || a.name.localeCompare(b.name));
  const toJoin = groups.filter((g) => g.status === "to_join" && !joined[g.id]);

  async function markJoined(id: string) {
    setJoined((j) => ({ ...j, [id]: "saving" }));
    const res = await fetch("/api/replies/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group_id: id }) }).catch(() => null);
    setJoined((j) => {
      const next = { ...j };
      if (res?.ok) next[id] = "done"; else delete next[id];
      return next;
    });
  }

  return (
    <>
      <div className="group-wrap card">
        <table className="group-table">
          <thead><tr><th>Group</th><th className="num">Posted</th><th className="num">Replies back</th><th className="num">Reactions</th><th className="num">Dismissed</th></tr></thead>
          <tbody>
            {scanned.map((g) => <tr key={g.id}>
              <td><a href={g.url} target="_blank" rel="noopener noreferrer">{g.name}</a>
                {g.stats.quiet ? <span className="chip" title="4+ dismissals in 30 days and nothing posted: no longer queued"> paused</span> : null}</td>
              <td className="num">{g.stats.posted ?? 0}</td>
              <td className="num">{g.stats.replies_back ?? 0}</td>
              <td className="num">{g.stats.reactions ?? 0}</td>
              <td className="num">{g.stats.dismissed ?? 0}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {Object.values(joined).includes("done") ? <p className="ok-text" role="status">Added. The next scan includes it.</p> : null}
      {toJoin.length ? <details className="card">
        <summary>Groups to join ({toJoin.length})</summary>
        <p className="meta">Join on Facebook yourself, then tap “I joined it”.</p>
        <ul className="join-list">
          {toJoin.map((g) => <li key={g.id}>
            <span><a href={g.url} target="_blank" rel="noopener noreferrer">{g.name} ↗</a> <span className="meta">{g.meta}</span></span>
            <button className="token-btn" disabled={joined[g.id] === "saving"} onClick={() => markJoined(g.id)}>I joined it</button>
          </li>)}
        </ul>
      </details> : null}
    </>
  );
}
