"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DISMISS_REASONS, DRAFT_MAX, SNOOZE_HOURS, STATUS_LABEL, facebookGroupId, isManual, pageAccessHelp, pageAccessLabel, pageAccessReady, type KcPageAccess, type KcReply, type PendingReplyEdit, type ReplyActionKind } from "@/lib/kc-replies";
import { approvalLinkIssue } from "@/lib/reply-link-editor";
import { JobLinks } from "./JobLinks";
export { JobLinks } from "./JobLinks";
import { LinkRule } from "./LinkRule";
import { TrainVoiceButton } from "./VoiceTrainer";
import type { ReplyLinkRule } from "@/lib/kc-replies";

// Copies synchronously (select + execCommand) so it still counts as part of the click,
// then opens the post; both must happen inside the click for the browser to allow them.
export function copyAndOpen(field: HTMLTextAreaElement | null, text: string, url: string): boolean {
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

export function ReplyCard({ reply, pageAccess, linkRule = { policy: "unknown", note: "", checked: "" }, groupAliases = [], pendingEdit = null, waiting, lastResult, received }: { reply: KcReply; pageAccess?: KcPageAccess | null; linkRule?: ReplyLinkRule; groupAliases?: string[]; pendingEdit?: PendingReplyEdit | null; waiting: string | null; lastResult: string | null; received: string }) {
  const router = useRouter();
  const field = useRef<HTMLTextAreaElement>(null);
  const initialDraft = pendingEdit?.draft ?? reply.approved_draft ?? reply.draft;
  const [draft, setDraft] = useState(initialDraft);
  const [savedText, setSavedText] = useState(initialDraft);
  const [approvedText, setApprovedText] = useState<string | null>(pendingEdit ? (pendingEdit.action === "approve" ? pendingEdit.draft : null) : reply.status === "approved" ? initialDraft : null);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const manual = isManual(reply);
  const pageReady = !manual || pageAccessReady(pageAccess, facebookGroupId(reply.source_url), groupAliases);
  const approved = approvedText !== null;
  const edited = draft.trim() !== (approvedText ?? savedText).trim();
  const finished = reply.status === "posted" || reply.status === "dismissed" || !!reply.delivery_state;
  const linkIssue = manual ? approvalLinkIssue(draft, linkRule.policy) : null;

  async function act(action: ReplyActionKind, extra: { reason?: string; hours?: number } = {}): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/replies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reply.id, action, revision: reply.revision, ...extra, ...(action === "save" || action === "approve" ? { draft } : {}) }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    if (!res?.ok) { setError(json?.error ?? "Network error. Try again."); return false; }
    return true;
  }

  async function approve() {
    if (!pageReady || !!linkIssue) return;
    const text = draft.trim();
    if (manual) {
      const copied = copyAndOpen(field.current, text, reply.source_url);
      setDone(copied ? "Copied and opened the post. Confirm the comment box says Kinetic Clinician, paste the reply, then tap “I posted as Kinetic Clinician”." : "Opened the post. Copy failed; select the reply and copy it.");
    }
    if (!(await act("approve"))) { setDone(null); return; }
    setApprovedText(text);
    if (!manual) setDone("Approved. The Page sends it within 15 minutes.");
  }

  async function close(action: "dismiss" | "posted" | "snooze", extra: { reason?: string; hours?: number } = {}) {
    if (await act(action, extra)) { setGone(true); router.refresh(); }
  }

  if (gone) return null;

  return (
    <article className="card share-card" id={reply.id}>
      <div className="loop-meta">
        <span className={`badge ${!pageReady ? "warn" : approved && !edited ? "ok" : reply.status === "needs_context" ? "warn" : ""}`}>{reply.delivery_state ?? (!pageReady ? "held for Page access" : approved && !edited ? "approved" : reply.status === "approved" ? "to review" : STATUS_LABEL[reply.status] ?? reply.status)}</span>
        <span>{reply.source_name}</span>
        <span>{received}</span>
        {reply.kind === "follow_up" ? <span className="chip">reply to your comment</span> : null}
        <LinkRule policy={linkRule.policy} note={linkRule.note} checked={linkRule.checked} />
      </div>
      {reply.summary ? <p className="reply-summary"><span className="meta">Points to </span>{reply.summary}</p> : null}
      {reply.kind === "follow_up" && reply.context ? (
        <details><summary className="meta">The thread so far</summary><p className="meta reply-thread">{reply.context}</p></details>
      ) : null}
      <blockquote className="reply-post">{reply.post_text}</blockquote>
      <a href={reply.source_url} target="_blank" rel="noopener noreferrer">Open the post on Facebook ↗</a>
      {manual && linkRule.note ? <p className="meta"><strong>Group rules:</strong> {linkRule.note}</p> : null}
      {manual ? <p className={pageReady ? "meta" : "error-text"} role={pageReady ? undefined : "status"}>
        <strong>{pageAccessLabel(pageAccess)}.</strong> {pageAccessHelp(pageAccess)}
        {pageAccess?.note ? <> {pageAccess.note}</> : null}
      </p> : null}
      <label className="meta reply-label" htmlFor={`draft-${reply.id}`}>{approved && !edited ? "Approved reply" : "Suggested reply"}</label>
      <textarea ref={field} id={`draft-${reply.id}`} className="answer-input reply-draft" value={draft} maxLength={DRAFT_MAX} rows={7}
        readOnly={finished || busy} onChange={(e) => setDraft(e.target.value)} />
      <JobLinks reply={reply} controls={{ draft, onDraftChange: setDraft, disabled: finished || busy, group: manual }} />
      {linkIssue && <p className="meta" role="status">{linkIssue}</p>}
      {reply.evidence.length ? (
        <details><summary className="meta">Facts given to the drafter ({reply.evidence.length})</summary>
          {reply.evidence.map((e) => <p key={e.claim} className="meta">{e.claim}</p>)}
        </details>
      ) : null}
      {lastResult ? <p className="meta">Last change: {lastResult}</p> : null}
      {finished ? null : (
        <div className="confirm-row">
          {approved && !edited ? <>
            {manual ? <button className="token-btn" disabled={busy || !pageReady || !!linkIssue} onClick={() => setDone(copyAndOpen(field.current, approvedText ?? draft, reply.source_url) ? "Copied and opened the post. Confirm the comment box says Kinetic Clinician." : "Opened the post. Copy failed; select the reply and copy it.")}>Copy and open again</button> : null}
            {manual ? <button className="token-btn approve" disabled={busy || !pageReady} onClick={() => close("posted")}>I posted as Kinetic Clinician</button>
              : <span className="meta">Sends from the Page automatically.</span>}
          </> : <>
            <button className="token-btn approve" disabled={busy || !draft.trim() || !pageReady || !!linkIssue} onClick={approve}>{manual ? "Approve, copy and open post" : edited ? "Save and approve" : "Approve"}</button>
            {edited ? <button className="token-btn" disabled={busy} onClick={() => act("save").then((ok) => { if (ok) { setSavedText(draft.trim()); setApprovedText(null); setDone("Edit saved."); } })}>Save edit</button> : null}
          </>}
          <button className="token-btn halt" disabled={busy} aria-expanded={asking} onClick={() => setAsking(!asking)}>Dismiss</button>
          <TrainVoiceButton itemId={reply.id} />
        </div>
      )}
      {!finished && asking ? (
        <div className="reply-reasons" role="group" aria-label="Why dismiss it?">
          <span className="meta">Why? The drafter learns from this.</span>
          {DISMISS_REASONS.map((r) => <button key={r} className="chip" disabled={busy} onClick={() => close("dismiss", { reason: r })}>{r}</button>)}
          <button className="chip" disabled={busy} onClick={() => close("dismiss")}>Skip</button>
        </div>
      ) : null}
      {finished ? null : (
        <div className="reply-reasons">
          {SNOOZE_HOURS.map((h) => <button key={h} className="chip" disabled={busy} onClick={() => close("snooze", { hours: h })}>Snooze {h === 24 ? "a day" : `${h / 24} days`}</button>)}
        </div>
      )}
      {waiting && !done ? <p className="meta" role="status">Queued for the Mac: {waiting}</p> : null}
      {done ? <p className="ok-text" role="status">{done}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
