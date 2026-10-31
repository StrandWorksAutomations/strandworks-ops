"use client";

import { useRef, useState } from "react";
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

// Copies synchronously (select + execCommand) so it still counts as part of the click,
// then opens the post; both must happen inside the click for the browser to allow them.
function copyAndOpen(field: HTMLTextAreaElement | null, text: string, url: string): boolean {
  let copied = false;
  if (field) {
    field.focus();
    field.select();
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    field.setSelectionRange(0, 0);
  }
  navigator.clipboard?.writeText(text).catch(() => undefined);
  window.open(url, "_blank", "noopener,noreferrer");
  return copied || !!navigator.clipboard;
}

export function ReplyCard({ reply, approvedPending = false, waiting, lastResult, received }: { reply: KcReply; approvedPending?: boolean; waiting: string | null; lastResult: string | null; received: string }) {
  const router = useRouter();
  const field = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(reply.approved_draft ?? reply.draft);
  const [approvedText, setApprovedText] = useState<string | null>(approvedPending ? reply.draft : reply.status === "approved" ? reply.approved_draft : null);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const manual = isManual(reply);
  const approved = approvedText !== null;
  const edited = draft.trim() !== (approvedText ?? reply.draft).trim();
  const finished = reply.status === "posted" || reply.status === "dismissed" || !!reply.delivery_state;

  async function act(action: ReplyActionKind): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/replies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reply.id, action, revision: reply.revision, ...(action === "save" || action === "approve" ? { draft } : {}) }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    if (!res?.ok) { setError(json?.error ?? "Network error. Try again."); return false; }
    return true;
  }

  async function approve() {
    const text = draft.trim();
    if (manual) {
      const copied = copyAndOpen(field.current, text, reply.source_url);
      setDone(copied ? "Copied and opened the post. Paste it as a comment, then tap “I posted it”." : "Opened the post. Copy failed; select the reply and copy it.");
    }
    if (!(await act("approve"))) { setDone(null); return; }
    setApprovedText(text);
    if (!manual) setDone("Approved. The Page sends it within 15 minutes.");
  }

  async function close(action: "dismiss" | "posted") {
    if (await act(action)) { setGone(true); router.refresh(); }
  }

  if (gone) return null;

  return (
    <article className="card share-card" id={reply.id}>
      <div className="loop-meta">
        <span className={`badge ${approved ? "ok" : reply.status === "needs_context" ? "warn" : ""}`}>{reply.delivery_state ?? (approved ? "approved" : STATUS_LABEL[reply.status] ?? reply.status)}</span>
        <span>{reply.source_name}</span>
        <span>{received}</span>
        {reply.promotion !== "allowed" ? <span className="chip">help only, no links</span> : null}
      </div>
      <blockquote className="reply-post">{reply.post_text}</blockquote>
      <a href={reply.source_url} target="_blank" rel="noopener noreferrer">Open the post on Facebook ↗</a>
      <label className="meta reply-label" htmlFor={`draft-${reply.id}`}>{approved ? "Approved reply" : "Suggested reply"}</label>
      <textarea ref={field} id={`draft-${reply.id}`} className="answer-input reply-draft" value={draft} maxLength={DRAFT_MAX} rows={7}
        readOnly={finished || busy} onChange={(e) => setDraft(e.target.value)} />
      <JobLinks reply={reply} />
      {reply.evidence.length ? (
        <details><summary className="meta">Facts given to the drafter ({reply.evidence.length})</summary>
          {reply.evidence.map((e) => <p key={e.claim} className="meta">{e.claim}</p>)}
        </details>
      ) : null}
      {lastResult ? <p className="meta">Last change: {lastResult}</p> : null}
      {finished ? null : (
        <div className="confirm-row">
          {approved && !edited ? <>
            {manual ? <button className="token-btn" disabled={busy} onClick={() => setDone(copyAndOpen(field.current, approvedText ?? draft, reply.source_url) ? "Copied and opened the post." : "Opened the post. Copy failed; select the reply and copy it.")}>Copy and open again</button> : null}
            {manual ? <button className="token-btn approve" disabled={busy} onClick={() => close("posted")}>I posted it</button>
              : <span className="meta">Sends from the Page automatically.</span>}
          </> : <>
            <button className="token-btn approve" disabled={busy || !draft.trim()} onClick={approve}>{manual ? "Approve, copy and open post" : edited ? "Save and approve" : "Approve"}</button>
            {edited ? <button className="token-btn" disabled={busy} onClick={() => act("save").then((ok) => ok && setDone("Edit saved."))}>Save edit</button> : null}
          </>}
          <button className="token-btn halt" disabled={busy} onClick={() => close("dismiss")}>Dismiss</button>
        </div>
      )}
      {waiting && !done ? <p className="meta" role="status">Queued for the Mac: {waiting}</p> : null}
      {done ? <p className="ok-text" role="status">{done}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
