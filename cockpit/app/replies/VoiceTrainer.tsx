"use client";

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { DRAFT_MAX } from "@/lib/kc-replies";

export type VoiceReply = { id: string; label: string; prepared: string | null };
type Example = { prepared_reply: string; posted_reply: string; updated_at: string | null };
const OpenTrainer = createContext<((id?: string) => void) | null>(null);

export function TrainVoiceButton({ itemId }: { itemId?: string }) {
  const open = useContext(OpenTrainer);
  return <button type="button" className={`token-btn train-voice-button${itemId ? "" : " blessed"}`}
    aria-haspopup="dialog" aria-controls="reply-voice-trainer" onClick={() => open?.(itemId)}>Train Voice</button>;
}

export function VoiceTrainer({ replies, children }: { replies: VoiceReply[]; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const manualId = useRef<string | null>(null);
  const drafts = useRef(new Map<string, Example>());
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const reply = replies.find((r) => r.id === selected);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function manualExample() {
    return manualId.current ??= `manual-${crypto.randomUUID()}`;
  }

  function open(id?: string) {
    setSelected(id ?? manualId.current ?? replies.find((r) => r.prepared)?.id ?? replies[0]?.id ?? manualExample());
    setNotice("");
    dialog.current?.showModal();
  }

  function saved() {
    if (selected) drafts.current.delete(selected);
    if (selected === manualId.current) manualId.current = null;
    dialog.current?.close();
    setNotice("Voice example saved for future replies.");
  }

  return <OpenTrainer.Provider value={open}>
    {children}
    <p className="voice-save-notice ok-text" role="status">{notice}</p>
    <dialog id="reply-voice-trainer" ref={dialog} className="voice-dialog" aria-labelledby="voice-trainer-title"
      onCancel={(event) => { if (saving) event.preventDefault(); }} onClose={() => setSelected(null)}>
      <div className="section-head"><h2 id="voice-trainer-title" tabIndex={-1} autoFocus>Train Voice</h2>
        <button type="button" className="header-button" disabled={saving} onClick={() => dialog.current?.close()}>Close</button>
      </div>
      {selected && <>
        {replies.length > 0 && <label className="reply-label">Reply
          <select className="answer-input" disabled={saving} value={reply?.id ?? "manual"}
            onChange={(event) => setSelected(event.target.value === "manual" ? manualExample() : event.target.value)}>
            {replies.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            <option value="manual">Paste a different reply</option>
          </select>
        </label>}
        <VoiceExampleForm key={selected} id={selected} prepared={reply?.prepared ?? ""} manual={!reply}
          pendingDraft={drafts.current.get(selected)} saving={saving} setSaving={setSaving} onSaved={saved}
          onDraft={(value) => { if (value) drafts.current.set(selected, value); else drafts.current.delete(selected); }} />
      </>}
    </dialog>
  </OpenTrainer.Provider>;
}

function VoiceExampleForm({ id, prepared, manual, pendingDraft, saving, setSaving, onDraft, onSaved }: {
  id: string; prepared: string; manual: boolean; pendingDraft?: Example; saving: boolean;
  setSaving: (value: boolean) => void; onDraft: (value: Example | null) => void; onSaved: () => void;
}) {
  const [value, setValue] = useState<Example>(pendingDraft ?? { prepared_reply: prepared, posted_reply: "", updated_at: null });
  const [phase, setPhase] = useState<"loading" | "ready" | "load-failed">(pendingDraft || manual ? "ready" : "loading");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (phase !== "loading") return;
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/replies/voice?item_id=${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Couldn’t load the saved example.");
        if (!controller.signal.aborted) {
          setValue(json.example ?? { prepared_reply: prepared, posted_reply: "", updated_at: null });
          setPhase("ready");
        }
      } catch (err) {
        if (!controller.signal.aborted) { setPhase("load-failed"); setError(err instanceof Error ? err.message : "Couldn’t load the saved example. Try again."); }
      }
    }
    void load();
    return () => controller.abort();
  }, [id, phase, prepared]);

  function edit(field: "prepared_reply" | "posted_reply", text: string) {
    const next = { ...value, [field]: text };
    setValue(next);
    onDraft(next);
  }

  function reload() {
    onDraft(null);
    setError("");
    setConflict(false);
    setPhase("loading");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/replies/voice", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: id, prepared_reply: value.prepared_reply, posted_reply: value.posted_reply, expected_updated_at: value.updated_at }) });
      const json = await res.json();
      if (res.status === 409) setConflict(true);
      if (res.ok && json.ok) onSaved();
      else setError(json.error || "Couldn’t save the voice example. Try again.");
    } catch { setError("Couldn’t confirm the save. Try again."); }
    finally { setSaving(false); }
  }

  const locked = phase !== "ready" || saving;
  return <form onSubmit={save}>
    <label className="reply-label" htmlFor="voice-prepared">AI-prepared reply</label>
    <textarea id="voice-prepared" className="answer-input reply-draft" rows={5} value={value.prepared_reply}
      placeholder="Paste the original draft" required maxLength={DRAFT_MAX} readOnly={locked || !!prepared}
      onChange={(event) => edit("prepared_reply", event.target.value)} />
    <label className="reply-label" htmlFor="voice-posted">What you actually posted</label>
    <textarea id="voice-posted" className="answer-input reply-draft" rows={5} value={value.posted_reply}
      placeholder="Paste your posted wording" required maxLength={DRAFT_MAX} readOnly={locked}
      onChange={(event) => edit("posted_reply", event.target.value)} />
    {phase === "loading" && <p className="meta" role="status">Loading example…</p>}
    {error && <p className="error-text" role="alert">{error}</p>}
    <div className="confirm-row">
      {phase === "load-failed" || conflict ? <button type="button" className="token-btn" onClick={reload}>
        {conflict ? "Reload saved example" : "Retry loading"}
      </button> : null}
      <button type="submit" className="token-btn approve" disabled={locked || conflict || !value.prepared_reply.trim() || !value.posted_reply.trim()}>
        {saving ? "Saving…" : "Save example"}
      </button>
    </div>
  </form>;
}
