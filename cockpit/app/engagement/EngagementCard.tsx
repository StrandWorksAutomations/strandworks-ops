"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NETWORK_LABEL, REPLY_MAX, SNOOZE_HOURS, safeUrl, type EngagementActionKind, type EngagementItem } from "@/lib/kc-engagement";

export function EngagementCard({ item, autoSend, approvedPending = false, waiting, lastResult, received }: {
  item: EngagementItem;
  /** The sync job posts an approved reply on this network; otherwise the owner posts it by hand. */
  autoSend: boolean;
  approvedPending?: boolean;
  waiting: string | null;
  lastResult: string | null;
  received: string;
}) {
  const router = useRouter();
  const saved = item.approved_reply ?? item.reply_draft ?? "";
  const [draft, setDraft] = useState(saved);
  const [approvedText, setApprovedText] = useState<string | null>(item.status === "approved" || approvedPending ? saved : null);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const network = NETWORK_LABEL[item.network] ?? item.network;
  const link = safeUrl(item.post_url);
  const approved = approvedText !== null;
  const edited = draft.trim() !== (approvedText ?? saved).trim();

  async function act(action: EngagementActionKind, extra: { hours?: number } = {}): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/engagement", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, action, revision: item.revision, ...extra, ...(action === "save" || action === "approve" ? { draft } : {}) }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    if (!res?.ok) { setError(json?.error ?? "Network error. Try again."); return false; }
    return true;
  }

  async function approve() {
    if (!(await act("approve"))) return;
    setApprovedText(draft.trim());
    setDone(autoSend ? `Approved. The sync job sends it on ${network} on its next run.`
      : `Approved and saved. ${network} replies are posted by hand: open the comment, paste this reply, then dismiss it here.`);
  }

  async function close(action: "dismiss" | "snooze", extra: { hours?: number } = {}) {
    if (await act(action, extra)) { setGone(true); router.refresh(); }
  }

  if (gone) return null;

  return (
    <article className="card share-card" id={item.id}>
      <div className="loop-meta">
        <span className={`badge ${item.status === "failed" ? "warn" : approved ? "ok" : ""}`}>{item.status === "failed" ? "send failed" : approved ? "approved" : "to review"}</span>
        <span className="chip">{network}</span>
        <span>{item.author_name || "Unknown author"}</span>
        <span>{received}</span>
      </div>
      {item.post_excerpt ? <p className="meta reply-summary">On: {item.post_excerpt}</p> : null}
      <blockquote className="reply-post">{item.text}</blockquote>
      {link ? <a href={link} target="_blank" rel="noopener noreferrer">Open on {network} ↗</a> : null}
      {item.status === "failed" && item.delivery_result ? <p className="error-text" role="status">{item.delivery_result}</p> : null}
      <label className="meta reply-label" htmlFor={`reply-${item.id}`}>{approved ? "Approved reply" : "Your reply"}</label>
      <textarea id={`reply-${item.id}`} className="answer-input reply-draft" value={draft} maxLength={REPLY_MAX} rows={5}
        readOnly={busy} onChange={(e) => setDraft(e.target.value)} />
      {lastResult ? <p className="meta">Last change: {lastResult}</p> : null}
      <div className="confirm-row">
        {approved && !edited ? <span className="meta">{autoSend ? `Sends on ${network} on the next sync run.` : `Post this reply by hand on ${network}, then dismiss.`}</span> : <>
          <button className="token-btn approve" disabled={busy || !draft.trim()} onClick={approve}>{approved ? "Save and approve" : "Approve"}</button>
          {edited && draft.trim() ? <button className="token-btn" disabled={busy} onClick={() => act("save").then((ok) => ok && setDone("Reply saved."))}>Save reply</button> : null}
        </>}
        <button className="token-btn halt" disabled={busy} onClick={() => close("dismiss")}>Dismiss</button>
      </div>
      <div className="reply-reasons">
        {SNOOZE_HOURS.map((h) => <button key={h} className="chip" disabled={busy} onClick={() => close("snooze", { hours: h })}>Snooze {h === 24 ? "a day" : `${h / 24} days`}</button>)}
      </div>
      {waiting && !done ? <p className="meta" role="status">Queued for the sync job: {waiting}</p> : null}
      {done ? <p className="ok-text" role="status">{done}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
