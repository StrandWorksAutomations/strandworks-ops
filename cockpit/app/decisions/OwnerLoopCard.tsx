"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OwnerLoopItem } from "@/lib/owner-loop";

// Match the governance card's two-tap confirmation. An option may carry a
// note; Other uses the same field as the ruling itself.
export function OwnerLoopCard({ item, bodyHtml, age, due }: {
  item: Pick<OwnerLoopItem, "ref" | "project" | "origin_agent" | "title" | "options" | "recommended" | "repeat_count">;
  bodyHtml: string;
  age: string;
  due: { label: string; iso: string; overdue: boolean } | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rule() {
    if (!armed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/loop/rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: item.ref, ruling: armed, ...(note.trim() ? { note: note.trim() } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ruling could not be recorded. Try again.");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ruling could not be recorded. Try again.");
      setArmed(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card loop-card" id={item.ref} aria-labelledby={`${item.ref}-title`}>
      <div className="loop-meta">
        <span className="mono">{item.ref}</span>
        <span className="chip">{item.project === "portfolio" ? "portfolio · cross-project" : item.project}</span>
        <span>{item.origin_agent ?? "agent"}</span>
        <span>{age}</span>
        {item.repeat_count > 1 ? <span className="badge warn">asked {item.repeat_count}×</span> : null}
      </div>
      {due ? <div className={due.overdue ? "loop-due error-text" : "loop-due meta"}>
        {due.overdue ? "OVERDUE · " : "Due "}<time dateTime={due.iso}>{due.label}</time>
      </div> : null}
      <h3 id={`${item.ref}-title`}>{item.title}</h3>
      <div className="prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {done ? (
        <p className="ok-text" role="status">{armed === "DROP" || armed === "PARK" ? "Dropped." : "Ruling recorded. Waiting for an agent to pick it up."}</p>
      ) : armed ? (
        <div className="loop-confirm">
          <p className="meta">Record ruling <strong className="loop-ruling">{armed}</strong>{note.trim() && note.trim() !== armed ? ` with note: ${note.trim()}` : ""}?</p>
          <div className="confirm-row">
            <button className={`token-btn ${armed === "DROP" || armed === "PARK" ? "halt" : "approve"}`} disabled={busy} onClick={rule}>
              {busy ? "Recording…" : `CONFIRM ${armed === "DROP" ? "DROP" : "RULING"}`}
            </button>
            <button className="token-btn" disabled={busy} onClick={() => setArmed(null)}>cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="loop-options">
            {(item.options ?? []).map((o) => (
              <button key={o.key} className={`token-btn loop-option ${o.key === item.recommended ? "blessed" : ""}`} onClick={() => setArmed(o.key)}>
                <span className="loop-option-key">{o.key}</span>
                <span>{o.label}{o.key === item.recommended ? <small>Recommended</small> : null}</span>
              </button>
            ))}
          </div>
          <label className="loop-note" htmlFor={`${item.ref}-note`}>Other / note</label>
          <textarea id={`${item.ref}-note`} className="answer-input" rows={2} maxLength={500} value={note}
            placeholder="Your own ruling, or a note with your choice"
            onChange={(e) => setNote(e.target.value)} />
          <div className="confirm-row">
            <button className="token-btn" disabled={!note.trim()} onClick={() => setArmed(note.trim())}>Use other ruling</button>
            <button className="token-btn halt" onClick={() => setArmed("DROP")}>DROP</button>
          </div>
        </div>
      )}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
