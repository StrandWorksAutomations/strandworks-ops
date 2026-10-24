import { Chrome } from "../components/Chrome";
import { fetchKcShare } from "@/lib/kc-share-data";
import { AddGroupForm, DraftCard, GroupCard } from "./ShareCards";
import { OWNER_TIME_ZONE } from "@/lib/owner-loop";

export const dynamic = "force-dynamic";

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: OWNER_TIME_ZONE }) + " ET";
}

export default async function SharePage() {
  const data = await fetchKcShare();
  if (!data) {
    return <Chrome title="Share" sub="Kinetic Clinician job posts" active="/share">
      <section className="card"><p className="error-text">Job posts could not be loaded. Refresh to retry.</p></section>
    </Chrome>;
  }
  const byId = new Map(data.groups.map((g) => [g.id, g]));
  const ready = data.drafts.filter((d) => d.status === "ready");
  const recent = data.drafts.filter((d) => d.status !== "ready").slice(0, 20);
  const unchecked = data.groups.filter((g) => g.allows_job_posts === null && g.active);

  return (
    <Chrome title="Share" sub={`${ready.length} job post${ready.length === 1 ? "" : "s"} ready · Kinetic Clinician`} active="/share">
      <section className="section">
        <div className="section-head"><h2>Ready to post</h2><span className="meta">copy · open group · post · mark</span></div>
        {ready.length === 0 ? <p className="meta card">Nothing to post. Drafts are made each morning for groups whose rules you confirmed.</p>
          : ready.map((d) => <DraftCard key={d.id} draft={d} group={byId.get(d.group_id)} />)}
      </section>

      {unchecked.length ? <section className="section">
        <div className="section-head"><h2>Check these group rules</h2><span className="meta">{unchecked.length} waiting</span></div>
        {unchecked.map((g) => <GroupCard key={g.id} group={g} />)}
      </section> : null}

      <section className="section">
        <div className="section-head"><h2>Groups</h2><span className="meta">{data.groups.length}</span></div>
        {data.groups.filter((g) => !unchecked.includes(g)).map((g) => <GroupCard key={g.id} group={g} />)}
        <AddGroupForm />
      </section>

      <section className="section">
        <div className="section-head"><h2>Recent</h2><span className="meta">last 14 days</span></div>
        {recent.length === 0 ? <p className="meta">No posts yet.</p> : <ul className="share-history">
          {recent.map((d) => <li key={d.id}>
            <span className={`badge ${d.status === "posted" ? "ok" : ""}`}>{d.status}</span>{" "}
            {byId.get(d.group_id)?.name ?? d.group_id}: {d.job_title}{d.pay_label ? ` · ${d.pay_label}` : ""}
            <span className="meta"> — {when(d.posted_at ?? d.created_at)}{d.skip_reason ? ` · ${d.skip_reason}` : ""}</span>
          </li>)}
        </ul>}
      </section>
    </Chrome>
  );
}
