import { Chrome } from "../components/Chrome";
import { fetchJobSubmissions } from "@/lib/kc-jobs-review-data";
import { KC_SITE, postedSharePath } from "@/lib/kc-jobs-review";
import { OWNER_TIME_ZONE } from "@/lib/owner-loop";
import { ReviewCard } from "./ReviewCard";

export const dynamic = "force-dynamic";

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: OWNER_TIME_ZONE }) + " ET";
}

export default async function JobsReviewPage() {
  const data = await fetchJobSubmissions();
  if (!data) {
    return <Chrome title="Job review" sub="Kinetic Clinician recruiter posts" active="/jobs-review">
      <section className="card"><p className="error-text">Submissions could not be loaded. Refresh to retry.</p></section>
    </Chrome>;
  }
  return (
    <Chrome title="Job review" sub={`${data.pending.length} recruiter job${data.pending.length === 1 ? "" : "s"} waiting · Kinetic Clinician`} active="/jobs-review">
      <section className="section">
        <div className="section-head"><h2>Waiting for review</h2><span className="meta">oldest first · same rules as every job</span></div>
        {data.pending.length === 0 ? <p className="meta card">Nothing waiting. Recruiters post at {KC_SITE}/recruiters/post/.</p>
          : data.pending.map((s) => <ReviewCard key={s.id} s={s} received={when(s.created_at)} />)}
      </section>
      <section className="section">
        <div className="section-head"><h2>Recent decisions</h2><span className="meta">last 14 days</span></div>
        {data.recent.length === 0 ? <p className="meta">None yet.</p> : <ul className="share-history">
          {data.recent.map((s) => {
            const share = postedSharePath(s.posted_job_id);
            return <li key={s.id}>
              <span className={`badge ${s.status === "approved" ? "ok" : ""}`}>{s.status}</span>{" "}
              {s.title} · {s.employer} · {s.agency_name}
              <span className="meta"> · {when(s.reviewed_at ?? s.created_at)}{s.reject_reason ? ` · ${s.reject_reason}` : ""}</span>
              {share ? <> · <a href={`${KC_SITE}${share}`} target="_blank" rel="noreferrer">job page</a></> : null}
            </li>;
          })}
        </ul>}
      </section>
    </Chrome>
  );
}
