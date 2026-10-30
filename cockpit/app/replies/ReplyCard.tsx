"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DRAFT_MAX, STATUS_LABEL, isManual, safeLinks, type KcReply, type ReplyActionKind } from "@/lib/kc-replies";

// The employer pages behind the facts in the draft. Shown to the owner only; never part of the reply.
export function JobLinks({ reply }: { reply: Pick<KcReply, "job_links"> }) {
  const links = safeLinks(reply.job_links);
  if (!links.length) return null;
  return (
    <div className="reply-jobs">
      <div className="meta">Check the jobs this reply mentions (not part of the reply)</div>
      <ul>
        {links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer nofollow">{l.label} ↗</a></li>)}
      </ul>
    </div>
  );
}

export function ReplyCard({ reply, waiting, lastResult, received }: { reply: KcReply; waiting: string | null; lastResult: string | null; received: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState(reply.draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const manual = isManual(reply);
  const approved = reply.status === "approved" && reply.approved_draft !== null;
  const edited = draft.trim() !== reply.draft.trim();
  const finished = reply.status === "posted" || reply.status === "dismissed" || !!reply.delivery_state;

  async function act(action: ReplyActionKind) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/replies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reply.id, action, revision: reply.revision, ...(action === "save" || action === "approve" ? { draft } : {}) }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    if (!res?.ok) { setError(json?.error ?? "Network error. Try again."); return; }
    setDone(action === "approve" && manual ? "Approved. Copy the reply, post it in the group, then tap “I posted it”." : "Sent to the Mac. It applies within 15 minutes.");
    router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(reply.approved_draft ?? draft).catch(() => setError("Copy failed; select the text instead."));
    setDone("Copied.");
  }

  return (
    <article className="card share-card" id={reply.id}>
      <div className="loop-meta">
        <span className={`badge ${approved ? "ok" : reply.status === "needs_context" ? "warn" : ""}`}>{reply.delivery_state ?? STATUS_LABEL[reply.status] ?? reply.status}</span>
        <span>{reply.source_name}</span>
        <span>{received}</span>
        {reply.promotion !== "allowed" ? <span className="chip">help only, no links</span> : null}
      </div>
      <blockquote className="reply-post">{reply.post_text}</blockquote>
      <a href={reply.source_url} target="_blank" rel="noopener noreferrer">Open the post on Facebook ↗</a>
      <label className="meta reply-label" htmlFor={`draft-${reply.id}`}>{approved ? "Approved reply" : "Suggested reply"}</label>
      <textarea id={`draft-${reply.id}`} className="answer-input reply-draft" value={draft} maxLength={DRAFT_MAX} rows={7}
        readOnly={finished || busy} onChange={(e) => setDraft(e.target.value)} />
      <JobLinks reply={reply} />
      {reply.evidence.length ? (
        <details><summary className="meta">Facts given to the drafter ({reply.evidence.length})</summary>
          {reply.evidence.map((e) => <p key={e.claim} className="meta">{e.claim}</p>)}
        </details>
      ) : null}
      {waiting ? <p className="meta" role="status">Waiting for the Mac: {waiting}</p> : null}
      {lastResult ? <p className="meta">Last change: {lastResult}</p> : null}
      {finished ? null : (
        <div className="confirm-row">
          {approved && !edited ? <>
            {manual ? <button className="token-btn" disabled={busy} onClick={copy}>Copy reply</button> : null}
            {manual ? <button className="token-btn approve" disabled={busy} onClick={() => act("posted")}>I posted it</button>
              : <span className="meta">Sends from the Page automatically.</span>}
          </> : <>
            <button className="token-btn approve" disabled={busy || !draft.trim()} onClick={() => act("approve")}>{edited ? "Save and approve" : "Approve"}</button>
            {edited ? <button className="token-btn" disabled={busy} onClick={() => act("save")}>Save edit</button> : null}
          </>}
          <button className="token-btn halt" disabled={busy} onClick={() => act("dismiss")}>Dismiss</button>
        </div>
      )}
      {done ? <p className="ok-text" role="status">{done}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
