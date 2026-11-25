import { readRepoFile } from "@/lib/repo";
import { sbSelect } from "@/lib/supabase-rest";
import { ownerDay } from "@/lib/owner-loop";
import type { ReasonDay } from "@/lib/reply-feedback";
import { countReplies, readPageviews, type DraftEditDay, type EngagementFact, type JobClickDay, type OutcomeFact } from "@/lib/reply-stats";
import { ReplyStatsPanel } from "./ReplyStatsPanel";

async function allRows<T>(table: string, query: string, id: keyof T & string): Promise<T[]> {
  const rows: T[] = [];
  let cursor = "";
  for (;;) {
    const after = cursor ? `&${id}=gt.${encodeURIComponent(cursor)}` : "";
    const page = await sbSelect<T>(table, `${query}&order=${id}.asc&limit=500${after}`);
    rows.push(...page);
    if (page.length < 500) return rows;
    cursor = String(page[page.length - 1][id]);
  }
}

async function reasonRows(table: string): Promise<ReasonDay[]> {
  const rows: ReasonDay[] = [];
  let cursor: ReasonDay | undefined;
  for (;;) {
    const params = new URLSearchParams({ select: "day,reason,count", order: "day.asc,reason.asc", limit: "500" });
    if (cursor) params.set("or", `(day.gt.${cursor.day},and(day.eq.${cursor.day},reason.gt.${cursor.reason}))`);
    const page = await sbSelect<ReasonDay>(table, params.toString());
    rows.push(...page);
    if (page.length < 500) return rows;
    cursor = page[page.length - 1];
  }
}

export async function ReplyStats() {
  const [ledger, engagement, traffic, clicks, draftEdits, corrections, dismissals] = await Promise.allSettled([
    allRows<OutcomeFact>("kc_reply_outcomes", "select=item_id,platform,source_kind,source_url,posted_at", "item_id"),
    allRows<EngagementFact>("kc_engagement_items", "select=id,network,external_id,post_external_id,post_url,status,delivery_result&or=(status.eq.sent,and(status.eq.dismissed,delivery_result.eq.Already%20answered%20on%20the%20network.))", "id"),
    readRepoFile("registers/kc-website-pageviews.json"),
    allRows<JobClickDay>("kc_reply_site_job_click_days", "select=day,job_clicks", "day"),
    allRows<DraftEditDay>("kc_reply_draft_edit_days", "select=day,as_drafted,edited,missing", "day"),
    reasonRows("kc_fb_reply_correction_reason_days"),
    reasonRows("kc_fb_dismissal_reason_days"),
  ]);
  const missed = [ledger.status === "rejected" && "the Replies ledger", engagement.status === "rejected" && "Engagement"].filter(Boolean);
  return <section className="section" aria-labelledby="reply-statistics-heading">
    <div className="section-head"><h2 id="reply-statistics-heading">Reply statistics</h2></div>
    {missed.length === 2 ? <p className="card" role="status">Reply statistics are unavailable.</p> : <>
      {missed.length > 0 && <p role="status">Partial counts. Couldn’t load {missed.join(" and ")}.</p>}
      <ReplyStatsPanel counts={countReplies(ledger.status === "fulfilled" ? ledger.value : [], engagement.status === "fulfilled" ? engagement.value : [])}
        views={readPageviews(traffic.status === "fulfilled" ? traffic.value : null)} today={ownerDay(new Date().toISOString())}
        clicks={clicks.status === "fulfilled" ? Object.fromEntries(clicks.value.map(r => [r.day, r.job_clicks])) : null}
        draftEdits={draftEdits.status === "fulfilled" ? draftEdits.value : null}
        corrections={corrections.status === "fulfilled" ? corrections.value : null}
        dismissals={dismissals.status === "fulfilled" ? dismissals.value : null}
        facebookAvailable={ledger.status === "fulfilled"} engagementAvailable={engagement.status === "fulfilled"} />
    </>}
  </section>;
}
