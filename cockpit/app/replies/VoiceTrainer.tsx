"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DRAFT_MAX } from "@/lib/kc-replies";
import { CORRECTION_REASONS, editedReply, isCorrectionReason, postedReplyConfirmation, type CorrectionReason } from "@/lib/reply-feedback";
import { ReplyInstructionsEditor } from "./ReplyInstructionsEditor";

export type VoiceReply = { id: string; label: string; prepared: string | null; posted: boolean; wording: string | null };
type Example = { prepared_reply: string; posted_reply: string; updated_at: string | null; correction_reason?: CorrectionReason | null };
const OpenTrainer = createContext<((id?: string) => void) | null>(null);

export function TrainVoiceButton({ itemId }: { itemId?: string }) {
  const open = useContext(OpenTrainer);
  return <button type="button" className={`token-btn train-voice-button${itemId ? "" : " blessed"}`}
    aria-haspopup="dialog" aria-controls="reply-voice-trainer" onClick={() => open?.(itemId)}>Train Voice</button>;
}

export function VoiceTrainer({ replies, children }: { replies: VoiceReply[]; children: ReactNode }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const manualId = useRef<string | null>(null);
  const drafts = useRef(new Map<string, Example>());
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const reply = replies.find((r) => r.id === selected);
  const busy = saving || !!confirmation;

  useEffect(() => {
    if (confirmation && !refreshing) {
      dialog.current?.close();
      setNotice(confirmation);
      setConfirmation("");
    }
  }, [confirmation, refreshing]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function manualExample() {
    return manualId.current ??= `manual-${crypto.randomUUID()}`;
  }

  function open(id?: string) {
    setInstructions(false);
    setSelected(id ?? manualId.current ?? replies.find((r) => r.prepared)?.id ?? replies[0]?.id ?? manualExample());
    setNotice("");
    dialog.current?.showModal();
  }

  function saved(recordedPosted: boolean, trainedVoice: boolean, reason: CorrectionReason | null) {
    if (selected) drafts.current.delete(selected);
    if (!recordedPosted) {
      if (selected === manualId.current) manualId.current = null;
      dialog.current?.close();
      setNotice(reply ? "Voice example saved." : "Standalone voice example saved.");
      return;
    }
    setConfirmation(postedReplyConfirmation(!!reply?.posted, trainedVoice, reason));
    startRefresh(() => router.refresh());
  }

  return <OpenTrainer.Provider value={open}>
    {children}
    <p className="voice-save-notice ok-text" role="status">{notice}</p>
    <dialog id="reply-voice-trainer" ref={dialog} className="voice-dialog" aria-labelledby="voice-trainer-title"
      onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => setSelected(null)}>
      <div className="section-head"><h2 id="voice-trainer-title" tabIndex={-1} autoFocus>Train Voice</h2>
        <button type="button" className="header-button" disabled={busy} onClick={() => dialog.current?.close()}>Close</button>
      </div>
      {selected && <div className="confirm-row" role="group" aria-label="Train Voice options">
        <button type="button" className={instructions ? "token-btn" : "token-btn blessed"} aria-pressed={!instructions} disabled={busy} onClick={() => setInstructions(false)}>Reply example</button>
        <button type="button" className={instructions ? "token-btn blessed" : "token-btn"} aria-pressed={instructions} disabled={busy} onClick={() => setInstructions(true)}>Reply instructions</button>
      </div>}
      <ReplyInstructionsEditor active={!!selected && instructions} saving={busy} setSaving={setSaving} />
      {selected && !instructions && <>
        {replies.length > 0 && <label className="reply-label">Reply
          <select className="answer-input" disabled={busy} value={reply?.id ?? "manual"}
            onChange={(event) => setSelected(event.target.value === "manual" ? manualExample() : event.target.value)}>
            {replies.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            <option value="manual">Standalone voice example</option>
          </select>
        </label>}
        {!reply && <p className="meta">Use a standalone example to train future replies.</p>}
        <VoiceExampleForm key={selected} id={selected} prepared={reply?.prepared ?? ""} wording={reply?.wording ?? ""} manual={!reply} posted={!!reply?.posted}
          pendingDraft={drafts.current.get(selected)} saving={busy} setSaving={setSaving} onSaved={saved}
          onDraft={(value) => { if (value) drafts.current.set(selected, value); else drafts.current.delete(selected); }} />
      </>}
    </dialog>
  </OpenTrainer.Provider>;
}

function VoiceExampleForm({ id, prepared, wording, manual, posted, pendingDraft, saving, setSaving, onDraft, onSaved }: {
  id: string; prepared: string; wording: string; manual: boolean; posted: boolean; pendingDraft?: Example; saving: boolean;
  setSaving: (value: boolean) => void; onDraft: (value: Example | null) => void;
  onSaved: (recordedPosted: boolean, trainedVoice: boolean, reason: CorrectionReason | null) => void;
}) {
  const [value, setValue] = useState<Example>(pendingDraft ?? { prepared_reply: prepared, posted_reply: wording, updated_at: null });
  const [phase, setPhase] = useState<"loading" | "ready" | "load-failed">(pendingDraft || manual ? "ready" : "loading");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const canLabel = !manual && editedReply(value.prepared_reply, value.posted_reply);

  useEffect(() => {
    if (phase !== "loading") return;
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/replies/voice?item_id=${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Couldn’t load the saved example.");
        if (!controller.signal.aborted) {
          setValue(json.example ?? { prepared_reply: prepared, posted_reply: json.receipt?.posted_reply ?? wording, updated_at: json.receipt?.updated_at ?? null });
          setPhase("ready");
        }
      } catch (err) {
        if (!controller.signal.aborted) { setPhase("load-failed"); setError(err instanceof Error ? err.message : "Couldn’t load the saved example. Try again."); }
      }
    }
    void load();
    return () => controller.abort();
  }, [id, phase, prepared, wording]);

  function edit(field: "prepared_reply" | "posted_reply", text: string) {
    update({ ...value, [field]: text });
  }

  function update(next: Example) {
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
        body: JSON.stringify({ item_id: id, prepared_reply: value.prepared_reply, posted_reply: value.posted_reply, expected_updated_at: value.updated_at,
          ...(canLabel ? { correction_reason: value.correction_reason ?? null } : {}) }) });
      const json = await res.json();
      if (res.status === 409 && json.code !== "delivery_in_progress") setConflict(true);
      if (res.ok && json.ok) {
        const reason = json.example?.correction_reason;
        onSaved(json.recordedPosted === true, json.trainedVoice === true, isCorrectionReason(reason) ? reason : null);
      } else setError(json.error || "Couldn’t save the voice example. Try again.");
    } catch { setError("Couldn’t confirm the save. Try again."); }
    finally { setSaving(false); }
  }

  const locked = phase !== "ready" || saving;
  return <form onSubmit={save}>
    <label className="reply-label" htmlFor="voice-prepared">AI-prepared reply{!manual && !prepared ? " (optional)" : ""}</label>
    <textarea id="voice-prepared" className="answer-input reply-draft" rows={5} value={value.prepared_reply}
      placeholder={manual ? "Paste the original draft" : "Paste the original draft if you have it"} required={manual} maxLength={DRAFT_MAX} readOnly={locked || !!prepared}
      onChange={(event) => edit("prepared_reply", event.target.value)} />
    <label className="reply-label" htmlFor="voice-posted">What you actually posted</label>
    <textarea id="voice-posted" className="answer-input reply-draft" rows={5} value={value.posted_reply}
      placeholder="Paste your posted wording" required maxLength={DRAFT_MAX} readOnly={locked}
      onChange={(event) => edit("posted_reply", event.target.value)} />
    {canLabel && <label className="reply-label" htmlFor="voice-reason">What did you change? (optional)
      <select id="voice-reason" className="answer-input" value={value.correction_reason ?? ""} disabled={locked}
        onChange={event => update({ ...value, correction_reason: isCorrectionReason(event.target.value) ? event.target.value : null })}>
        <option value="">No reason selected</option>
        {Object.entries(CORRECTION_REASONS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>}
    {phase === "loading" && <p className="meta" role="status">Loading example…</p>}
    {error && <p className="error-text" role="alert">{error}</p>}
    <div className="confirm-row">
      {phase === "load-failed" || conflict ? <button type="button" className="token-btn" onClick={reload}>
        {conflict ? (manual ? "Reload saved example" : "Reload saved wording") : "Retry loading"}
      </button> : null}
      <button type="submit" className="token-btn approve" disabled={locked || conflict || (manual && !value.prepared_reply.trim()) || !value.posted_reply.trim()}>
        {saving ? "Saving…" : manual ? "Save voice example" : posted ? "Save posted wording" : "Save and mark as posted"}
      </button>
    </div>
  </form>;
}
