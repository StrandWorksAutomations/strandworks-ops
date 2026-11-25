"use client";

import { useEffect, useState, type FormEvent } from "react";
import { REPLY_INSTRUCTIONS_MAX, type ReplyInstructions } from "@/lib/reply-instructions";

const endpoint = "/api/replies/voice/instructions";

export function ReplyInstructionsEditor({ active, saving, setSaving }: {
  active: boolean; saving: boolean; setSaving: (saving: boolean) => void;
}) {
  const [saved, setSaved] = useState<ReplyInstructions | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"loading" | "ready" | "failed" | "conflict">("loading");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!active && phase === "ready" && saved?.instructions === text) {
      setPhase("loading");
      setMessage("");
    }
  }, [active, phase, saved, text]);

  useEffect(() => {
    if (!active || phase !== "loading") return;
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn’t load your instructions.");
        if (!controller.signal.aborted) { setSaved(data); setText(data.instructions); setPhase("ready"); }
      } catch (reason) {
        if (!controller.signal.aborted) { setPhase("failed"); setError(reason instanceof Error ? reason.message : "Couldn’t load your instructions."); }
      }
    }
    void load();
    return () => controller.abort();
  }, [active, phase]);

  function loadSaved() {
    setError("");
    setMessage("");
    setPhase("loading");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!saved || phase !== "ready" || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: text, expected_updated_at: saved.updated_at }) });
      const data = await res.json();
      if (res.status === 409) setPhase("conflict");
      if (!res.ok) throw new Error(data.error || "Couldn’t save your instructions.");
      setSaved(data);
      setText(data.instructions);
      setMessage(data.instructions ? "Reply instructions saved." : "Reply instructions cleared.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Couldn’t confirm the save. Try again."); }
    finally { setSaving(false); }
  }

  if (!active) return null;
  const locked = phase !== "ready" || saving;
  return <form onSubmit={submit}>
    <label className="reply-label" htmlFor="reply-instructions">Reply instructions</label>
    <p className="meta" id="reply-instructions-help">Tell the writer how you want future replies to sound.</p>
    <textarea id="reply-instructions" className="answer-input reply-draft" rows={5} maxLength={REPLY_INSTRUCTIONS_MAX} value={text}
      aria-describedby="reply-instructions-help" readOnly={locked} onChange={e => { setText(e.target.value); setMessage(""); }} />
    {phase === "loading" && <p role="status" className="meta">Loading instructions…</p>}
    {error && <p role="alert" className="error-text">{error}</p>}
    {message && <p role="status" className="ok-text">{message}</p>}
    <div className="confirm-row">
      <button type="submit" className="token-btn approve" disabled={locked || text === saved?.instructions}>{saving ? "Saving…" : "Save instructions"}</button>
      <button type="button" className="token-btn" disabled={locked || !text} onClick={() => { setText(""); setMessage("Save instructions to clear them."); }}>Clear</button>
      {(phase === "failed" || phase === "conflict") && <button type="button" className="token-btn" onClick={loadSaved}>
        {phase === "conflict" ? "Reload saved instructions" : "Retry loading"}
      </button>}
    </div>
  </form>;
}
