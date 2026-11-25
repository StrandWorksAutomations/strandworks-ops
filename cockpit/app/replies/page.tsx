import { Chrome } from "../components/Chrome";
import { fetchReplies } from "@/lib/kc-replies-data";
import { PAGE_URL, facebookGroupId, isManual, pageAccessReady, pendingDecision, pendingReplyEdit, replyGroupIds, replyPageAccess, replyLinkRule, resultLine, snoozedUntil } from "@/lib/kc-replies";
import { OWNER_TIME_ZONE } from "@/lib/owner-loop";
import { ReplyCard } from "./ReplyCard";
import { PagePostCard } from "./PagePostCard";
import { GroupsPanel } from "./GroupsPanel";
import { TrainVoiceButton, VoiceTrainer } from "./VoiceTrainer";
import { ReplyStats } from "./ReplyStats";

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
      <VoiceTrainer replies={[]}><TrainVoiceButton />
        <section className="card"><p className="error-text">Replies could not be loaded. Refresh to retry.</p></section>
      </VoiceTrainer>
      <ReplyStats />
    </Chrome>;
  }
  const decided = (id: string) => pendingDecision(data.actions, id);
  const live = data.replies.filter((r) => ["needs_review", "needs_context", "approved"].includes(r.status) && !r.delivery_state && decided(r.id) !== "closed");
  const later = live.filter((r) => snoozedUntil(r, data.actions));
  const open = live.filter((r) => !later.includes(r));
  const usable = open.filter((r) => !isManual(r) || pageAccessReady(replyPageAccess(r, data.groups), facebookGroupId(r.source_url), replyGroupIds(r, data.groups)));
  const blocked = open.filter((r) => !usable.includes(r));
  const done = data.replies.filter((r) => !live.includes(r));
  const weekly = data.pagePosts.find((p) => p.status === "draft" || p.status === "approved");
  const waiting = (id: string) => data.actions.filter((a) => a.item_id === id && !a.applied_at).map((a) => ACTION_LABEL[a.action]).join(", ") || null;
  const closedAs = (id: string) => data.actions.some((a) => a.item_id === id && !a.applied_at && a.action === "posted") ? "posted" : "dismissed";
  const wasPosted = (r: typeof data.replies[number]) => r.status === "posted" || r.delivery_state === "sent" || (decided(r.id) === "closed" && closedAs(r.id) === "posted");
  const postedWording = (r: typeof data.replies[number]) => wasPosted(r) ? r.approved_draft || (r.status === "posted" ? r.draft : null) : null;
  const lastResult = (id: string) => data.actions.find((a) => a.item_id === id && a.applied_at)?.result ?? null;
  const synced = data.replies.reduce((latest, r) => (r.synced_at > latest ? r.synced_at : latest), "");
  const trainerReplies = [...usable, ...done, ...blocked, ...later].map((r) => ({
    id: r.id, label: `${r.source_name} · ${r.title || r.post_text.slice(0, 80)}`, prepared: r.results?.prepared_reply ?? null, posted: wasPosted(r), wording: postedWording(r),
  }));
  return (
    <Chrome title="Replies" sub={`${usable.length} ready to review · ${blocked.length} held for Page access · synced ${when(synced) || "never"}`} active="/replies">
      <VoiceTrainer replies={trainerReplies}>
      <section className="section">
        <div className="section-head"><h2>Waiting for you</h2><div className="reply-tools"><a href="#reply-statistics-heading">Reply statistics</a><TrainVoiceButton /></div></div>
        <p className="meta">Group replies are posted by hand. Before pasting, use Facebook’s account picture → See all profiles → <a href={PAGE_URL} target="_blank" rel="noopener noreferrer">Kinetic Clinician</a>. The comment box must show the Page’s name.</p>
        {usable.length === 0 ? <p className="meta card">No replies ready to post as Kinetic Clinician. {blocked.length ? "Replies held for group access are below." : "The group scan is scheduled at 8am, 1pm and 7pm."}</p>
          : usable.map((r) => <ReplyCard key={`${r.id}-${r.revision}`} reply={r} pageAccess={replyPageAccess(r, data.groups)} linkRule={replyLinkRule(r, data.groups)} groupAliases={replyGroupIds(r, data.groups)} pendingEdit={pendingReplyEdit(data.actions, r)} waiting={waiting(r.id)} lastResult={lastResult(r.id)} received={when(r.created_at)} />)}
        {later.length ? <details className="card">
          <summary className="meta">Snoozed ({later.length})</summary>
          <ul className="share-history">{later.map((r) => <li key={r.id}>{r.title} <span className="meta"> · back {when(snoozedUntil(r, data.actions))}</span>{" "}<TrainVoiceButton itemId={r.id} /></li>)}</ul>
        </details> : null}
      </section>
      {blocked.length ? <section className="section">
        <div className="section-head"><h2>Held for Page access ({blocked.length})</h2><span className="meta">drafts preserved until Kinetic Clinician can comment</span></div>
        {blocked.map((r) => <ReplyCard key={`${r.id}-${r.revision}`} reply={r} pageAccess={replyPageAccess(r, data.groups)} linkRule={replyLinkRule(r, data.groups)} groupAliases={replyGroupIds(r, data.groups)} pendingEdit={pendingReplyEdit(data.actions, r)} waiting={waiting(r.id)} lastResult={lastResult(r.id)} received={when(r.created_at)} />)}
      </section> : null}
      {weekly ? <section className="section">
        <div className="section-head"><h2>Weekly Page post</h2><span className="meta">best-paid jobs posted in the last 7 days</span></div>
        <PagePostCard key={weekly.id} post={weekly} />
      </section> : null}
      <section className="section" aria-labelledby="replies-done">
        <div className="section-head"><h2 id="replies-done">Done</h2><span className="meta">last 14 days</span></div>
        {done.length === 0 ? <p className="meta">None yet.</p> : <ul className="share-history">
          {done.map((r) => {
            const posted = wasPosted(r);
            const wording = postedWording(r);
            return <li key={r.id}>
              <span className={`badge ${posted ? "ok" : ""}`}>{posted ? "Posted" : r.delivery_state ?? (decided(r.id) === "closed" ? closedAs(r.id) : r.status)}</span>{" "}
              {r.title} <span className="meta"> · {r.source_name} · <a href={r.source_url} target="_blank" rel="noopener noreferrer">post</a></span>
              {r.results?.posted_at && <span className="meta"> · {when(r.results.posted_at)}</span>}
              {r.status === "posted" ? <span className="meta reply-results"> · {resultLine(r.results) ?? "results after 2 days"}</span> : null}
              {wording ? <blockquote className="reply-post" aria-label="Posted wording">{wording}</blockquote> : null}
              {" "}<TrainVoiceButton itemId={r.id} />
            </li>;
          })}
        </ul>}
      </section>
      <ReplyStats />
      {data.groups.length ? <section className="section">
        <div className="section-head"><h2>Groups</h2><span className="meta">Kinetic Clinician Page access and results</span></div>
        <GroupsPanel groups={data.groups} />
      </section> : null}
      </VoiceTrainer>
    </Chrome>
  );
}
