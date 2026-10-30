"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { businessName } from "@/lib/businesses";
import { intakeDate, replyStatusLabel, type IntakeItem, type IntakeAction } from "@/lib/intake";

export function InboxCard({ item }: { item: IntakeItem }) {
  const router = useRouter();
  const [reply, setReply] = useState(item.draft_reply ?? "");
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handled, setHandled] = useState(false);
  const [approved, setApproved] = useState(item.reply_status === "approved");
  const locked = approved || item.reply_status === "sent";

  async function act(action: IntakeAction) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/inbox/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action, ...(["approve_reply", "save_draft"].includes(action) ? { reply } : {}) }),
      });
      if (!response.ok) throw new Error("Could not save email action. Refresh and try again.");
      const messages: Record<IntakeAction, string> = {
        approve_reply: "Approved. Waiting to send from your Gmail within about 15 minutes.",
        save_draft: "Draft saved.", done: "Done. Archive requested.", dismiss: "Dismissed. Archive requested.",
        keep_in_inbox: "Kept in your Gmail inbox.",
      };
      setMessage(messages[action]);
      if (action === "approve_reply") setApproved(true);
      if (action === "done" || action === "dismiss") setHandled(true);
      setArmed(false);
      router.refresh();
    } catch {
      setError("Could not save email action. Refresh and try again.");
      setArmed(false);
    } finally { setBusy(false); }
  }

  return <article id={item.id} className={`card inbox-card${item.priority === "high" ? " inbox-high" : ""}`} aria-labelledby={`${item.id}-subject`}>
    <div className="loop-meta">
      <span className="chip">{businessName(item.business)}</span>
      <span>{item.category.replace(/_/g, " ")}</span>
      {item.priority === "high" ? <span className="badge bad">High priority</span> : null}
    </div>
    <p className="inbox-sender">{item.from_name ? <strong>{item.from_name} </strong> : null}{item.from_addr}</p>
    <div className="meta"><time dateTime={item.received_at}>{intakeDate(item.received_at)}</time> · to {item.account}</div>
    <h3 id={`${item.id}-subject`}>{item.subject || "(No subject)"}</h3>
    <p className="inbox-text">{item.summary || item.snippet || "No summary available."}</p>
    {item.action_needed ? <p className="inbox-text"><strong>Action needed: </strong>{item.action_needed}</p> : null}
    {item.due_at ? <p className="meta">Due <time dateTime={item.due_at}>{intakeDate(item.due_at)}</time></p> : null}
    <details className="loop-request"><summary>Original email</summary>
      <pre className="inbox-original" tabIndex={0} aria-label="Original email text">{item.body_text?.replace(/\r\n?/g, "\n").replace(/^\n+/, "") || `Original text is unavailable.${item.snippet ? ` Preview:\n\n${item.snippet}` : ""}`}</pre>
    </details>
    {replyStatusLabel(item) ? <p className={item.reply_status === "failed" ? "error-text" : "meta"} role="status">{replyStatusLabel(item)}</p> : null}
    {!handled ? <>
      {item.draft_reply ? <>
        <label className="loop-note" htmlFor={`${item.id}-reply`}>Draft reply</label>
        <textarea id={`${item.id}-reply`} className="answer-input inbox-reply" rows={7} maxLength={6000} value={reply}
          disabled={busy || locked || armed} onChange={(event) => { setReply(event.target.value); setMessage(null); }} />
        <div className="meta">{reply.length}/6000 characters</div>
        {armed ? <div className="loop-confirm">
          <p>Send this reply from <strong>{item.account}</strong>?</p>
          <p className="meta">After approval, the watcher sends it from your Gmail within about 15 minutes.</p>
          <div className="confirm-row">
            <button className="token-btn approve" disabled={busy} onClick={() => act("approve_reply")}>{busy ? "Approving…" : "Confirm send"}</button>
            <button className="token-btn" disabled={busy} onClick={() => setArmed(false)}>Cancel</button>
          </div>
        </div> : !locked ? <div className="confirm-row">
          <button className="token-btn approve" disabled={busy || !reply.trim()} onClick={() => setArmed(true)}>Approve &amp; send</button>
          <button className="token-btn" disabled={busy || !reply.trim()} onClick={() => act("save_draft")}>Save draft</button>
        </div> : null}
      </> : null}
      {!armed ? <div className="confirm-row inbox-actions">
        <button className="token-btn" disabled={busy} onClick={() => act("done")}>Done (archive)</button>
        <button className="token-btn" disabled={busy} onClick={() => act("dismiss")}>Dismiss (archive)</button>
        <button className="token-btn" disabled={busy} onClick={() => act("keep_in_inbox")}>Keep in inbox</button>
      </div> : null}
    </> : null}
    {message ? <p className="ok-text" role="status">{message}</p> : null}
    {error ? <p className="error-text" role="alert">{error}</p> : null}
  </article>;
}
