"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Clears older review emails from the dashboard in one step. Gmail is left
// exactly as it is: nothing is archived, sent or deleted.
export function ClearOlder({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function clear() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/inbox/clear-older", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }),
      });
      const result = await response.json().catch(() => null) as { cleared?: number; failed?: number } | null;
      if (!response.ok || !result) throw new Error();
      setMessage(result.failed ? `Cleared ${result.cleared}. ${result.failed} could not be cleared; refresh and try again.` : `Cleared ${result.cleared} older emails.`);
      setArmed(false);
      router.refresh();
    } catch {
      setError("Could not clear older emails. Refresh and try again.");
      setArmed(false);
    } finally { setBusy(false); }
  }

  return <div className="loop-confirm">
    <p className="meta">These stay in Gmail untouched. Clearing only removes them from this dashboard.</p>
    {armed ? <div className="confirm-row">
      <button className="token-btn approve" disabled={busy} onClick={clear}>{busy ? "Clearing…" : `Confirm: clear ${ids.length}`}</button>
      <button className="token-btn" disabled={busy} onClick={() => setArmed(false)}>Cancel</button>
    </div> : <div className="confirm-row">
      <button className="token-btn" disabled={busy} onClick={() => setArmed(true)}>Clear all {ids.length} older emails</button>
    </div>}
    {message ? <p className="ok-text" role="status">{message}</p> : null}
    {error ? <p className="error-text" role="alert">{error}</p> : null}
  </div>;
}
