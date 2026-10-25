"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FLAG_LABEL, KC_ROLE_LABEL, KC_SITE, REJECT_REASONS, shortPay, type KcSubmission } from "@/lib/kc-jobs-review";

// How the job will look on the KC board once approved (same fields the board's job card shows).
export function JobPreview({ s }: { s: KcSubmission }) {
  return (
    <div className="job-preview" aria-label="Preview on Kinetic Clinician">
      <div className="job-preview-pay">{shortPay(s.salary) ?? "Pay not posted"}</div>
      <div>
        <h3 className="job-preview-title">{s.title}</h3>
        <p className="job-preview-line">{s.employer} · {s.location}</p>
        <div className="loop-meta">
          <span className="chip">{(s.roles?.length ? s.roles : [s.role]).map((r) => KC_ROLE_LABEL[r] ?? r).join(" / ")}</span>
          {s.employment_type ? <span className="chip">{s.employment_type}</span> : null}
          <span className="chip">Just posted</span>
        </div>
        {s.description ? <p className="job-preview-desc">{s.description}</p> : null}
        <a href={s.apply_url} target="_blank" rel="noopener noreferrer nofollow">View posting ↗</a>
      </div>
    </div>
  );
}

export function ReviewCard({ s, received }: { s: KcSubmission; received: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<string>(REJECT_REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function review(action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/jobs-review", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, action, ...(action === "reject" ? { reason } : {}) }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string; posted_job_id?: string | null } | undefined;
    setBusy(false);
    if (!res?.ok) { setError(json?.error ?? "Network error. Try again."); return; }
    setDone(action === "approve" ? `Live: ${KC_SITE}/j/posted/kc/${json?.posted_job_id}/` : "Rejected.");
    router.refresh();
  }

  return (
    <article className="card share-card" id={s.id}>
      <div className="loop-meta">
        <span className="badge warn">pending</span>
        <span>received {received}</span>
        {s.flags.map((f) => <span key={f} className="badge bad" title={f}>{FLAG_LABEL[f] ?? f}</span>)}
      </div>
      <JobPreview s={s} />
      <dl className="review-fields">
        <dt>Apply link</dt><dd><a href={s.apply_url} target="_blank" rel="noopener noreferrer nofollow" className="mono">{s.apply_url}</a></dd>
        <dt>Pay</dt><dd className="mono">{s.salary.min}–{s.salary.max} per {s.salary.period}</dd>
        <dt>Role</dt><dd>{KC_ROLE_LABEL[s.role] ?? s.role}{s.region ? ` · ${s.region}` : ""}</dd>
        <dt>Recruiter</dt><dd>{s.recruiter_name} · <a href={`mailto:${s.work_email}`}>{s.work_email}</a></dd>
        <dt>Agency</dt><dd>{s.agency_name}</dd>
      </dl>
      <p className="meta">Before approving: open the apply link, confirm the employer is real and the pay matches the posting.</p>
      {done ? <p className="ok-text" role="status">{done}</p> : rejecting ? (
        <div className="confirm-row">
          <select className="answer-input" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason">
            {REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input className="answer-input" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason sent to the recruiter" />
          <button className="token-btn halt" disabled={busy || !reason.trim()} onClick={() => review("reject")}>Reject</button>
          <button className="token-btn" onClick={() => setRejecting(false)}>cancel</button>
        </div>
      ) : (
        <div className="confirm-row">
          <button className="token-btn approve" disabled={busy} onClick={() => review("approve")}>Approve and publish</button>
          <button className="token-btn" disabled={busy} onClick={() => setRejecting(true)}>Reject…</button>
        </div>
      )}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
