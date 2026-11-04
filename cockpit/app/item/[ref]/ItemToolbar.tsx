"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fromLocalInput } from "@/lib/when";

export function ItemToolbar({ refId, title, dueInput, dueLabel, saved, archived, deleted, closed, canMarkUrgent }: {
  refId: string; title: string; dueInput: string; dueLabel: string | null; saved: boolean; archived: boolean; deleted: boolean; closed: boolean; canMarkUrgent: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDue, setDraftDue] = useState(dueInput);

  async function act(action: string, extra: Record<string, unknown> = {}, done?: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/loop/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: refId, action, ...extra }) });
      if (!res.ok) throw new Error();
      setEditing(false);
      setConfirmDelete(false);
      if (done) setNotice(done);
      router.refresh();
    } catch {
      setError("That did not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function saveEdit() {
    const due = draftDue ? fromLocalInput(draftDue) : null;
    if (draftDue && !due) { setError("Enter a valid date."); return; }
    act("edit", { title: draftTitle, due_at: due }, "Saved.");
  }

  return <div className="item-toolbar">
    <div className="item-buttons">
      {deleted || archived ? <button type="button" className="token-btn" disabled={busy} onClick={() => act(deleted ? "restore" : "unarchive", {}, "Restored.")}>Restore</button> : <>
        <button type="button" className={`token-btn${saved ? " blessed" : ""}`} aria-pressed={saved} disabled={busy} onClick={() => act(saved ? "unsave" : "save")}>{saved ? "Saved" : "Save"}</button>
        <button type="button" className="token-btn" disabled={busy} onClick={() => setEditing(!editing)} aria-expanded={editing}>Edit</button>
        {canMarkUrgent ? <button type="button" className="token-btn" disabled={busy} onClick={() => act("urgent", {}, "Marked urgent.")}>Mark urgent</button> : null}
        {!closed ? <button type="button" className="token-btn" disabled={busy} onClick={() => act("done", {}, "Closed.")}>Close</button> : null}
        <button type="button" className="token-btn" disabled={busy} onClick={() => act("archive", {}, "Archived.")}>Archive</button>
        {confirmDelete
          ? <button type="button" className="token-btn halt" disabled={busy} onClick={() => act("delete", {}, "Deleted. Restore is above.")}>Confirm delete</button>
          : <button type="button" className="token-btn halt" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</button>}
      </>}
    </div>
    {editing ? <div className="item-edit">
      <label htmlFor="edit-title">Title</label>
      <input id="edit-title" className="answer-input" value={draftTitle} maxLength={300} onChange={(e) => setDraftTitle(e.target.value)} />
      <label htmlFor="edit-due">Date and time (Eastern){dueLabel ? ` · now ${dueLabel}` : ""}</label>
      <input id="edit-due" type="datetime-local" className="answer-input" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} />
      <div className="confirm-row">
        <button type="button" className="token-btn approve" disabled={busy || !draftTitle.trim()} onClick={saveEdit}>Save changes</button>
        {draftDue ? <button type="button" className="token-btn" disabled={busy} onClick={() => setDraftDue("")}>Clear date</button> : null}
        <button type="button" className="token-btn" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div> : null}
    {notice ? <p className="ok-text" role="status">{notice}</p> : null}
    {error ? <p className="error-text" role="alert">{error}</p> : null}
  </div>;
}
