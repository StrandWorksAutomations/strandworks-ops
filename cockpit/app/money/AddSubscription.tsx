"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RECURRING_CADENCES, type SubscriptionEdit } from "@/lib/money-edit";

export async function saveSubscription(body: SubscriptionEdit & { confirm?: boolean }) {
  const response = await fetch("/api/money/update", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? "Could not save the subscription.");
  window.dispatchEvent(new Event("subscriptions-changed"));
}

export function AddSubscription() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const service = String(data.get("service") ?? "").trim();
    setError("");
    setBusy(true);
    try {
      await saveSubscription({ action: "add", service, fields: {
        charge_usd: String(data.get("charge")), billing_cadence: String(data.get("cadence")),
        renewal_date: String(data.get("paymentDate")),
      } });
      setSaved(`Added ${service}.`);
      setOpen(false);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add subscription.");
    } finally { setBusy(false); }
  }

  return <div className="card">
    {open ? <form onSubmit={submit} aria-label="Add subscription" className="edit-form">
      <label>Subscription name<input autoFocus name="service" required maxLength={200} /></label>
      <label>Price per payment (USD)<input name="charge" required type="number" min="0" step="0.01" inputMode="decimal" /></label>
      <label>Billing frequency<select name="cadence" defaultValue="monthly">
        {RECURRING_CADENCES.map(c => <option key={c} value={c}>{c}</option>)}
      </select></label>
      <label>Next payment date<input name="paymentDate" required type="date" min="0001-01-01" max="9999-12-31" /></label>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="confirm-row">
        <button className="token-btn approve" disabled={busy} type="submit">{busy ? "Saving…" : "Save subscription"}</button>
        <button className="token-btn" disabled={busy} type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form> : <button type="button" className="token-btn approve" onClick={() => { setSaved(""); setError(""); setOpen(true); }}>Add subscription</button>}
    {saved && <p role="status">{saved}</p>}
  </div>;
}
