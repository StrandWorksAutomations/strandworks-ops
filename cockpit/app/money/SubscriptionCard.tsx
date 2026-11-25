"use client";
// One subscription as an editable card. Owner controls:
//   ● verdict traffic light — green approved / orange pending-cancel / red cancel
//   ✕ delete — explicit confirm popup; removes the register row (git keeps history)
//   edit — cost, plan, cadence (monthly/annually/one-time/custom), renewal date,
//          trial end (set ⇒ trial, timed alerts fire), discount note
// Every action POSTs /api/money/update and becomes ONE commit to the register.
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CADENCE_CHOICES, type EditableField, type SubscriptionEdit, type Verdict } from "@/lib/money-edit";
import { isCalendarDay } from "@/lib/subscription-calendar";
import { saveSubscription } from "./AddSubscription";

export type CardItem = {
  service: string;
  plan: string;
  costRaw: string;
  chargeRaw: string;
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

function editValues(it: CardItem) {
  const cadence = CADENCE_CHOICES.some(c => c === it.cadence) ? it.cadence : "custom";
  return { charge: it.chargeRaw, cost: it.costRaw, plan: it.plan, cadence,
    cadenceCustom: cadence === "custom" ? it.cadence : "", renewal: isCalendarDay(it.renewalRaw) ? it.renewalRaw : "",
    trialEnd: it.trialEnd ?? "", discount: it.discount };
}

export function SubscriptionCard({ it, dryRun }: { it: CardItem; dryRun: boolean }) {
  const router = useRouter();
  const discountsId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const [original, setOriginal] = useState(it);
  const [form, setForm] = useState(() => editValues(it));

  async function post(body: SubscriptionEdit & { confirm?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      await saveSubscription(body);
      setEditing(false);
      setConfirmDelete(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "update failed");
    } finally {
      setBusy(false);
    }
  }

  const setVerdict = (v: Verdict) =>
    post({ service: it.service, action: "verdict", verdict: it.verdict === v ? "" : v, expected: { verdict: it.verdict } });

  function saveEdit() {
    const fields: Partial<Record<EditableField, string>> = {};
    const expected: typeof fields = {};
    function changed(field: EditableField, next: string, before: string, displayed = before) {
      if (next !== displayed) { fields[field] = next; expected[field] = before; }
    }
    changed("plan", form.plan, original.plan);
    changed("billing_cadence", form.cadence === "custom" ? form.cadenceCustom : form.cadence, original.cadence);
    changed("charge_usd", form.charge.trim(), original.chargeRaw);
    if (!form.charge && !original.chargeRaw) changed("cost_monthly_usd", form.cost.trim(), original.costRaw);
    if ("charge_usd" in fields || "billing_cadence" in fields || "cost_monthly_usd" in fields) {
      Object.assign(expected, { charge_usd: original.chargeRaw, billing_cadence: original.cadence, cost_monthly_usd: original.costRaw });
    }
    changed("renewal_date", form.renewal, original.renewalRaw, editValues(original).renewal);
    changed("trial_end", form.trialEnd, original.trialEnd ?? "");
    changed("discount", form.discount, original.discount);
    if (Object.keys(fields).length === 0) { setEditing(false); return; }
    void post({ action: "update", service: original.service, fields, expected });
  }

  return (
    <div className={`card sub-card verdict-${it.verdict || "none"}`}>
      <div className="row1">
        <h3 style={{ margin: 0 }}>
          {it.service}
          {it.status ? <span className={`badge ${it.statusClass}`}>{it.status}</span> : null}
          {it.trialEnd ? <span className="badge warn">trial → {it.trialEnd}</span> : null}
          {it.discount ? <span className="badge brass">{it.discount}</span> : null}
        </h3>
        <span className="cost">{it.chargeRaw ? `$${it.chargeRaw} per payment` : it.costRaw !== "" ? `$${it.costRaw.replace(/^\$/, "")}/mo` : "$ ?"}</span>
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
          <button className="token-btn halt" disabled={busy} onClick={() => post({ service: original.service, action: "delete", confirm: true,
            expected: { plan: original.plan, cost_monthly_usd: original.costRaw, charge_usd: original.chargeRaw,
              renewal_date: original.renewalRaw, billing_cadence: original.cadence, discount: original.discount, verdict: original.verdict } })}>
            {busy ? "…" : `DELETE ${it.service}${it.costUsd !== null ? ` (−$${it.costUsd.toFixed(2)}/mo)` : ""}`}
          </button>
          <button className="token-btn" disabled={busy} onClick={() => setConfirmDelete(false)}>
            keep
          </button>
        </div>
      ) : editing ? (
        <form className="edit-form" aria-label={`Edit ${it.service}`} onSubmit={(event) => { event.preventDefault(); saveEdit(); }}>
          <label>
            Price per payment (USD)
            <input value={form.charge} type="number" step="0.01" min="0" inputMode="decimal" placeholder="Unknown"
              onChange={(e) => setForm({ ...form, charge: e.target.value })} />
          </label>
          {!original.chargeRaw && !form.charge && <label>Monthly estimate (USD)
            <input value={form.cost} inputMode="decimal" placeholder="Unknown" onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </label>}
          <label>
            plan
            <input value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
          </label>
          <label>
            billing
            <select value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
              {CADENCE_CHOICES.map((c) => (
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
            <input type="date" min="0001-01-01" max="9999-12-31" value={form.renewal}
              onChange={(e) => setForm({ ...form, renewal: e.target.value })} />
          </label>
          <label>
            trial ends <span className="hint">set ⇒ trial, alerts fire as it nears</span>
            <input type="date" min="0001-01-01" max="9999-12-31" value={form.trialEnd}
              onChange={(e) => setForm({ ...form, trialEnd: e.target.value })} />
          </label>
          <label>
            discount
            <input value={form.discount} list={discountsId} placeholder="student / small-business / promo…"
              onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </label>
          <datalist id={discountsId}>
            <option value="student" />
            <option value="small-business" />
            <option value="nonprofit" />
            <option value="annual-prepay" />
            <option value="promo" />
          </datalist>
          <div className="confirm-row">
            <button className="token-btn approve" disabled={busy} type="submit">
              {busy ? "…" : "SAVE"}
            </button>
            <button className="token-btn" disabled={busy} type="button" onClick={() => setEditing(false)}>
              cancel
            </button>
          </div>
        </form>
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
          <button className="v-btn" disabled={busy} onClick={() => { setOriginal(it); setForm(editValues(it)); setError(null); setEditing(true); }} title="edit entry">
            edit
          </button>
          <button className="v-btn v-bad" disabled={busy} onClick={() => { setOriginal(it); setConfirmDelete(true); }} title="delete entry">
            ✕
          </button>
        </div>
      )}

      {error ? <p className="error-text" role="alert">{error}{dryRun ? " (dry-run mode)" : ""}</p> : null}
    </div>
  );
}
