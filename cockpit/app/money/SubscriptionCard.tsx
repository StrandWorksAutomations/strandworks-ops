"use client";
// One subscription as an editable card. Owner controls:
//   ● verdict traffic light — green approved / orange pending-cancel / red cancel
//   ✕ delete — explicit confirm popup; removes the register row (git keeps history)
//   edit — cost, plan, cadence (monthly/annually/one-time/custom), renewal date,
//          trial end (set ⇒ trial, timed alerts fire), discount note
// Every action POSTs /api/money/update and becomes ONE commit to the register.
import { useState } from "react";
import { useRouter } from "next/navigation";

export type CardItem = {
  service: string;
  plan: string;
  costRaw: string;
  costUsd: number | null;
  cadence: string;
  renewalRaw: string;
  renewalIso: string | null;
  status: string;
  statusClass: string;
  verdict: string;
  trialEnd: string | null;
  discount: string;
  notesRedacted: string;
};

const VERDICTS = [
  { value: "approved", label: "✓", title: "correct / approved", cls: "v-good" },
  { value: "pending-cancel", label: "◐", title: "edit / pending cancellation", cls: "v-warn" },
  { value: "cancel", label: "✗", title: "incorrect / cancel", cls: "v-bad" },
] as const;

const CADENCES = ["monthly", "annually", "one-time", "custom"] as const;

export function SubscriptionCard({ it, dryRun }: { it: CardItem; dryRun: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const knownCadence = (CADENCES as readonly string[]).includes(it.cadence)
    ? it.cadence
    : it.cadence === ""
      ? "monthly"
      : "custom";
  const [form, setForm] = useState({
    cost: it.costRaw,
    plan: it.plan,
    cadence: knownCadence,
    cadenceCustom: knownCadence === "custom" ? it.cadence : "",
    renewal: it.renewalIso ?? "",
    trialEnd: it.trialEnd ?? "",
    discount: it.discount,
  });

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/money/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: it.service, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "update failed");
      setEditing(false);
      setConfirmDelete(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "update failed");
    } finally {
      setBusy(false);
    }
  }

  const setVerdict = (v: string) =>
    post({ action: "verdict", verdict: it.verdict === v ? "" : v });

  const saveEdit = () =>
    post({
      action: "update",
      fields: {
        cost_monthly_usd: form.cost.trim(),
        plan: form.plan,
        billing_cadence: form.cadence === "custom" ? form.cadenceCustom : form.cadence,
        renewal_date: form.renewal,
        trial_end: form.trialEnd,
        discount: form.discount,
      },
    });

  return (
    <div className={`card sub-card verdict-${it.verdict || "none"}`}>
      <div className="row1">
        <h3 style={{ margin: 0 }}>
          {it.service}
          {it.status ? <span className={`badge ${it.statusClass}`}>{it.status}</span> : null}
          {it.trialEnd ? <span className="badge warn">trial → {it.trialEnd}</span> : null}
          {it.discount ? <span className="badge brass">{it.discount}</span> : null}
        </h3>
        <span className="cost">{it.costRaw !== "" ? `$${it.costRaw.replace(/^\$/, "")}` : "$ ?"}</span>
      </div>
      <div className="plan">
        {[it.plan, it.cadence, it.renewalRaw ? `renews ${it.renewalRaw}` : ""]
          .filter(Boolean)
          .join(" · ") || "no plan details on record"}
      </div>

      {it.notesRedacted ? (
        <details>
          <summary>notes</summary>
          <div className="notes">{it.notesRedacted}</div>
        </details>
      ) : null}

      {confirmDelete ? (
        <div className="confirm-row">
          <button className="token-btn halt" disabled={busy} onClick={() => post({ action: "delete", confirm: true })}>
            {busy ? "…" : `DELETE ${it.service}${it.costUsd !== null ? ` (−$${it.costUsd.toFixed(2)}/mo)` : ""}`}
          </button>
          <button className="token-btn" disabled={busy} onClick={() => setConfirmDelete(false)}>
            keep
          </button>
        </div>
      ) : editing ? (
        <div className="edit-form">
          <label>
            cost $/mo
            <input value={form.cost} inputMode="decimal" placeholder="blank = unknown"
              onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </label>
          <label>
            plan
            <input value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
          </label>
          <label>
            billing
            <select value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
              {CADENCES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          {form.cadence === "custom" ? (
            <label>
              custom billing
              <input value={form.cadenceCustom} placeholder="e.g. monthly (7th) + top-ups"
                onChange={(e) => setForm({ ...form, cadenceCustom: e.target.value })} />
            </label>
          ) : null}
          <label>
            renews
            <input type="date" value={form.renewal}
              onChange={(e) => setForm({ ...form, renewal: e.target.value })} />
          </label>
          <label>
            trial ends <span className="hint">set ⇒ trial, alerts fire as it nears</span>
            <input type="date" value={form.trialEnd}
              onChange={(e) => setForm({ ...form, trialEnd: e.target.value })} />
          </label>
          <label>
            discount
            <input value={form.discount} list="discount-kinds" placeholder="student / small-business / promo…"
              onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </label>
          <datalist id="discount-kinds">
            <option value="student" />
            <option value="small-business" />
            <option value="nonprofit" />
            <option value="annual-prepay" />
            <option value="promo" />
          </datalist>
          <div className="confirm-row">
            <button className="token-btn approve" disabled={busy} onClick={saveEdit}>
              {busy ? "…" : "SAVE"}
            </button>
            <button className="token-btn" disabled={busy} onClick={() => setEditing(false)}>
              cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="verdict-row">
          {VERDICTS.map((v) => (
            <button
              key={v.value}
              className={`v-btn ${v.cls} ${it.verdict === v.value ? "on" : ""}`}
              title={v.title}
              disabled={busy}
              onClick={() => setVerdict(v.value)}
            >
              {v.label}
            </button>
          ))}
          <span className="v-spacer" />
          <button className="v-btn" disabled={busy} onClick={() => setEditing(true)} title="edit entry">
            edit
          </button>
          <button className="v-btn v-bad" disabled={busy} onClick={() => setConfirmDelete(true)} title="delete entry">
            ✕
          </button>
        </div>
      )}

      {error ? <p className="error-text">{error}{dryRun ? " (dry-run mode)" : ""}</p> : null}
    </div>
  );
}
