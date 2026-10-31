"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DRAFT_MAX, PAGE_URL, type KcPagePost, type PagePostAction } from "@/lib/kc-replies";
import { JobLinks, copyAndOpen } from "./ReplyCard";

// This week's Kinetic Clinician Page post: the best-paid jobs posted in the last 7 days.
// Approve copies it and opens the Page; the owner pastes and posts it by hand.
export function PagePostCard({ post }: { post: KcPagePost }) {
  const router = useRouter();
  const field = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(post.draft);
  const [status, setStatus] = useState(post.status);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: PagePostAction): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/replies/page-post", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, action, ...(action === "save" || action === "approve" ? { draft } : {}) }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    if (!res?.ok) { setError(json?.error ?? "Network error. Try again."); return false; }
    return true;
  }

  function copy() {
    return copyAndOpen(field.current, draft.trim(), PAGE_URL)
      ? "Copied and opened the Page. Paste it as a new post, then tap “I posted it”."
      : "Opened the Page. Copy failed; select the post and copy it.";
  }

  async function approve() {
    setNote(copy());
    if (await act("approve")) setStatus("approved");
    else setNote(null);
  }

  async function finish(action: "posted" | "dismiss") {
    if (await act(action)) { setStatus(action === "posted" ? "posted" : "dismissed"); router.refresh(); }
  }

  if (status === "posted" || status === "dismissed") return null;
  return (
    <article className="card share-card">
      <div className="loop-meta">
        <span className={`badge ${status === "approved" ? "ok" : ""}`}>{status === "approved" ? "approved" : "to review"}</span>
        <span>Kinetic Clinician Page</span>
        <span>week {post.id.slice(-2)}</span>
      </div>
      <label className="meta reply-label" htmlFor={`post-${post.id}`}>Weekly post</label>
      <textarea ref={field} id={`post-${post.id}`} className="answer-input reply-draft" value={draft} maxLength={DRAFT_MAX} rows={14}
        readOnly={busy} onChange={(e) => setDraft(e.target.value)} />
      <JobLinks reply={{ job_links: post.links }} />
      <div className="confirm-row">
        {status === "approved" ? <>
          <button className="token-btn" disabled={busy} onClick={() => setNote(copy())}>Copy and open again</button>
          <button className="token-btn approve" disabled={busy} onClick={() => finish("posted")}>I posted it</button>
        </> : <>
          <button className="token-btn approve" disabled={busy || !draft.trim()} onClick={approve}>Approve, copy and open Page</button>
          {draft.trim() !== post.draft.trim() ? <button className="token-btn" disabled={busy} onClick={() => act("save").then((ok) => ok && setNote("Edit saved."))}>Save edit</button> : null}
        </>}
        <button className="token-btn halt" disabled={busy} onClick={() => finish("dismiss")}>Skip this week</button>
      </div>
      {note ? <p className="ok-text" role="status">{note}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
