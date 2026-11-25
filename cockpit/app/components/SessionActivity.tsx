"use client";

import { useEffect, useRef, useState } from "react";
import { signInWithPasskey } from "@/lib/passkey-login";

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "input", "click", "wheel", "touchstart", "touchmove"];
const MIN_INTERVAL = 60_000;

/** Only owner input in the foreground extends a session. */
export function watchSessionActivity(doc: Document, expired: () => void) {
  let nextAttempt = 0;
  let pending: AbortController | null = null;
  function activity(event: Event) {
    if (!event.isTrusted || doc.visibilityState !== "visible" || pending || Date.now() < nextAttempt) return;
    const controller = new AbortController();
    pending = controller;
    nextAttempt = Date.now() + MIN_INTERVAL;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    void fetch("/api/auth/activity", { method: "POST", cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(response => {
        if (controller.signal.aborted) return;
        if (response.status === 401) expired();
        else if (!response.ok) nextAttempt = Date.now() + 5000;
      }).catch(() => { nextAttempt = Date.now() + 5000; }).finally(() => { clearTimeout(timeout); pending = null; });
  }
  for (const name of ACTIVITY_EVENTS) doc.addEventListener(name, activity, { capture: true, passive: true });
  return () => {
    pending?.abort();
    for (const name of ACTIVITY_EVENTS) doc.removeEventListener(name, activity, true);
  };
}

export function SessionActivity() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (expired) dialog.current?.showModal();
    else return watchSessionActivity(document, () => setExpired(true));
  }, [expired]);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      await signInWithPasskey();
      dialog.current?.close();
      setExpired(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not sign in. Try again."); }
    finally { setBusy(false); }
  }

  return expired ? <dialog ref={dialog} className="voice-dialog" aria-labelledby="session-expired-title"
    onCancel={event => { if (busy) event.preventDefault(); }} onClose={() => { setExpired(false); setError(""); }}>
    <h2 id="session-expired-title">Sign in to continue</h2>
    <p>Your session expired. Use your passkey to continue on this page.</p>
    <button type="button" className="btn-primary" disabled={busy} onClick={signIn}>{busy ? "Waiting for passkey…" : "Sign in with passkey"}</button>
    {error && <p className="error-text" role="alert">{error}</p>}
  </dialog> : null;
}
