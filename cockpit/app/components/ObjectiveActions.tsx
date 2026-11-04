"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fromLocalInput } from "@/lib/when";

export function ObjectiveActions({ id, project, title, outcome, reviewInput, targetInput }: {
  id: string; project: string; title: string; outcome: string; reviewInput: string; targetInput: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [review, setReview] = useState(reviewInput);
  const [target, setTarget] = useState(targetInput);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const review_at = fromLocalInput(review);
    const target_at = fromLocalInput(target);
    if (!review_at || !target_at) { setError("Enter both dates."); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/objective", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, review_at, target_at }) });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      setError("That did not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="item-toolbar">
    <div className="item-buttons">
      <button type="button" className="token-btn" aria-expanded={editing} onClick={() => setEditing(!editing)}>Edit dates</button>
      <Link className="token-btn" href={`/respond?${new URLSearchParams({ project, title, detail: outcome })}`}>Respond</Link>
    </div>
    {editing ? <div className="item-edit">
      <label htmlFor={`${id}-review`}>Next review (Eastern)</label>
      <input id={`${id}-review`} type="datetime-local" className="answer-input" value={review} onChange={(e) => setReview(e.target.value)} />
      <label htmlFor={`${id}-target`}>Delivery (Eastern)</label>
      <input id={`${id}-target`} type="datetime-local" className="answer-input" value={target} onChange={(e) => setTarget(e.target.value)} />
      <div className="confirm-row">
        <button type="button" className="token-btn approve" disabled={busy} onClick={save}>Save dates</button>
        <button type="button" className="token-btn" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div> : null}
    {error ? <p className="error-text" role="alert">{error}</p> : null}
  </div>;
}
