"use client";

import { useState } from "react";
import { addDays } from "@/lib/money";
import { isCalendarDay } from "@/lib/subscription-calendar";
import { CHANNELS, CHANNEL_LABEL, replyCsv, replyRange, total, weeklyDraftEdits, type Channel, type DraftEditDay, type Pageviews, type ReplyCounts } from "@/lib/reply-stats";

const ANALYTICS_URL = "https://vercel.com/strandworks/highest-paying/analytics";
const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
const label = (day: string) => dateLabel.format(new Date(day + "T12:00:00Z"));
const display = (n: number) => n.toLocaleString("en-US");

export function ReplyStatsPanel({ counts, views, clicks, draftEdits, today, facebookAvailable, engagementAvailable }: {
  counts: ReplyCounts; views: Pageviews; clicks: Record<string, number> | null; today: string; facebookAvailable: boolean; engagementAvailable: boolean;
  draftEdits: DraftEditDay[] | null;
}) {
  const [start, setStart] = useState(() => addDays(today, -29));
  const [end, setEnd] = useState(today);
  const valid = isCalendarDay(start) && isCalendarDay(end) && start <= end && end <= today;
  const range = valid ? replyRange(counts, views, start, end, clicks ?? {}) : null;
  const edits = valid && draftEdits ? weeklyDraftEdits(draftEdits, start, end) : null;
  const allTime = Object.values(counts.dated).reduce((n, day) => n + total(day), total(counts.undated));
  const viewDates = Object.keys(views).sort();
  const included = (c: Channel) => c === "facebook_page" ? facebookAvailable || engagementAvailable :
    c.startsWith("facebook_") ? facebookAvailable : engagementAvailable;
  const liveChannels = CHANNELS.filter(included);
  const startDates = [...Object.keys(counts.dated), ...viewDates, ...Object.keys(clicks ?? {}), ...(draftEdits ?? []).map(r => r.day).filter(d => d !== "undated"), today].sort();
  function period(days?: number) {
    setStart(days ? addDays(today, 1 - days) : startDates[0]);
    setEnd(today);
  }
  return <div className="card">
    <div className="confirm-row" style={{ flexWrap: "wrap" }}>
      <label>From <input type="date" value={start} max={today} onChange={e => setStart(e.target.value)} /></label>
      <label>Through <input type="date" value={end} max={today} onChange={e => setEnd(e.target.value)} /></label>
      <button type="button" className="token-btn" onClick={() => period(7)}>7 days</button>
      <button type="button" className="token-btn" onClick={() => period(30)}>30 days</button>
      <button type="button" className="token-btn" onClick={() => period()}>All dates</button>
    </div>
    {range ? <>
      <p><strong>Answered in range: {display(range.answered)}</strong> · All time: {display(allTime)}</p>
      {total(counts.undated) > 0 && <p className="meta">All time includes {display(total(counts.undated))} with no recorded posting date.</p>}
      <ul className="share-history" aria-label="Answers by platform">{liveChannels.map((c) =>
        <li key={c}>{CHANNEL_LABEL[c]} · {display(range.totals[c] ?? 0)}</li>)}</ul>
      <h3>Posted as drafted vs. edited</h3>
      {!edits ? <p role="status" className="meta">Draft comparisons are unavailable.</p> : <>
        {edits.weeks.length ? <>
          <p>{edits.totals.as_drafted + edits.totals.edited > 0
            ? `${display(edits.totals.as_drafted)} of ${display(edits.totals.as_drafted + edits.totals.edited)} comparable replies posted as drafted · ${display(edits.totals.edited)} edited`
            : "No comparable replies"} · {display(edits.totals.missing)} missing an original or posted text.</p>
          <details>
            <summary>Weekly draft comparisons</summary>
            <div style={{ overflowX: "auto" }}><table className="group-table">
              <thead><tr><th scope="col">Week of</th><th scope="col">As drafted</th><th scope="col">Edited</th><th scope="col">Missing</th></tr></thead>
              <tbody>{edits.weeks.map(w => <tr key={w.day}><th scope="row">{label(w.day)}</th>
                <td>{display(w.as_drafted)}</td><td>{display(w.edited)}</td><td>{display(w.missing)}</td></tr>)}</tbody>
            </table></div>
          </details>
        </> : <p>No posted replies recorded in this range.</p>}
        {edits.undated > 0 && <p className="meta">{display(edits.undated)} posted replies have no recorded date and are outside the weekly totals.</p>}
        <p className="meta">Compares the original draft with the wording recorded as posted in Replies. Weeks start Monday and include only the selected dates.</p>
      </>}
      <details>
        <summary>Daily replies and website traffic</summary>
        {range.days.length ? <div style={{ overflowX: "auto" }}><table className="group-table">
          <thead><tr><th scope="col">Date (Eastern)</th><th scope="col">Answered</th><th scope="col">Website pageviews</th><th scope="col">Website job clicks</th></tr></thead>
          <tbody>{range.days.slice(-31).reverse().map(d => <tr key={d.day}><th scope="row">{label(d.day)}</th>
            <td>{display(d.answered)}</td><td>{d.pageviews === null ? "Unavailable" : display(d.pageviews)}</td>
            <td>{d.jobClicks === null ? (clicks ? "No record" : "Unavailable") : display(d.jobClicks)}</td></tr>)}</tbody>
        </table>{range.days.length > 31 && <p className="meta">Showing the latest 31 days. The CSV includes the full range.</p>}</div> :
          <p>No dated replies or traffic records in this range.</p>}
      </details>
      <p><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(replyCsv(range.days, liveChannels))}`}
        download={`reply-statistics-${start}-to-${end}.csv`}>Download daily CSV</a></p>
    </> : <p role="status">Choose a start and end date through today.</p>}
    {counts.ambiguous > 0 && <p className="meta">{display(counts.ambiguous)} Facebook Page records omitted because the comment identity could not be matched reliably.</p>}
    <p className="meta">Counts include answers recorded in Replies and Engagement.
      {" "}{clicks ? "Website job clicks show how often people click an employer’s original posting from Kinetic Clinician. Today’s total includes clicks recorded so far." : "Website job click data is unavailable."}
      {" "}{viewDates.length ? `Kinetic Clinician pageviews are available through ${label(viewDates[viewDates.length - 1])}.` : "Website pageview data is unavailable."}
      {" "}<a href={ANALYTICS_URL} target="_blank" rel="noreferrer">Open live website analytics</a></p>
  </div>;
}
