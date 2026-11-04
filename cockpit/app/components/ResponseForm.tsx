"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { itemHref } from "@/lib/owner-loop";

type Target = { ref: string } | { project: string; title: string; detail: string };

export function ResponseForm({ target, options = [], recommended, focus }: {
  target: Target; options?: { key: string; label: string }[]; recommended?: string | null; focus?: boolean;
}) {
  const router = useRouter();
  const [option, setOption] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focus) box.current?.focus();
  }, [focus]);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/loop/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, option, text, urgent }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSent(true);
      setOption(null);
      setText("");
      setUrgent(false);
      if ("ref" in target) router.refresh();
      else router.push(itemHref(json.ref));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Unable to send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section id="respond" className="respond-form" aria-label="Respond">
    <h2>Respond</h2>
    {sent ? <p className="ok-text" role="status">Sent. Agents see it on their next check. The Linear link appears here once it is posted.</p> : null}
    {options.length ? <div className="loop-options" role="radiogroup" aria-label="Options">
      {options.map((o) => <button key={o.key} type="button" role="radio" aria-checked={option === o.key}
        className={`token-btn loop-option${option === o.key ? " selected" : ""}`} onClick={() => setOption(option === o.key ? null : o.key)}>
        <span className="loop-option-key">{o.key}</span>
        <span>{o.label}{o.key === recommended ? <small>Recommended</small> : null}</span>
      </button>)}
    </div> : null}
    <label className="loop-note" htmlFor="response-text">{options.length ? "Add a message, or write your own answer" : "Your message"}</label>
    <textarea id="response-text" ref={box} className="answer-input" rows={4} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} />
    <label className="urgent-toggle">
      <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
      <span><strong>Urgent</strong><small>Send to the requesting agent now. If it is not working, start a new agent in the project folder.</small></span>
    </label>
    <button type="button" className="token-btn approve respond-send" disabled={busy || (!option && !text.trim())} onClick={send}>{busy ? "Sending…" : urgent ? "Send urgent response" : "Send response"}</button>
    {error ? <p className="error-text" role="alert">{error}</p> : null}
  </section>;
}
