"use client";
// Owner edits for one project row: tier (the classification the whole cockpit
// sorts by), role, and the infra pointers. POSTs /api/projects/update → one
// commit to registers/projects.csv. Derived columns are shown read-only upstream.
import { useState } from "react";
import { useRouter } from "next/navigation";

const TIERS = ["flagship", "ops", "tier-2", "tier-3", "tool", "reference", "fork", "frozen"] as const;

export type EditorFields = {
  name: string;
  role: string;
  tier: string;
  tokens: string;
  domains: string;
  surfaces: string;
  supabase_ref: string;
  vercel_project: string;
  linear_project: string;
  notes: string;
};

export function ProjectEditor({ slug, initial, dryRun }: { slug: string; initial: EditorFields; dryRun: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditorFields>(initial);

  async function post(fields: Partial<EditorFields>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fields }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "update failed");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "update failed");
    } finally {
      setBusy(false);
    }
  }

  const field = (k: keyof EditorFields, label: string, placeholder = "") => (
    <label key={k}>
      {label}
      <input value={form[k]} placeholder={placeholder} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </label>
  );

  return (
    <div className="card">
      <div className="verdict-row">
        {TIERS.map((t) => (
          <button
            key={t}
            className={`v-btn ${initial.tier === t ? "v-good" : ""}`}
            title={`set tier ${t}`}
            disabled={busy}
            onClick={() => post({ tier: initial.tier === t ? "" : t })}
          >
            {t}
          </button>
        ))}
        <button className="token-btn" style={{ marginLeft: "auto" }} disabled={busy} onClick={() => setOpen(!open)}>
          {open ? "close" : "edit"}
        </button>
      </div>
      {open ? (
        <div className="edit-form">
          {field("name", "name")}
          {field("role", "role (one line)")}
          {field("tokens", "match tokens (; separated)", "how register rows name this project")}
          {field("domains", "domains (; separated)")}
          {field("surfaces", "deployed surfaces (; separated)", "host names only")}
          {field("supabase_ref", "supabase ref", "20-letter ref")}
          {field("vercel_project", "vercel project")}
          {field("linear_project", "linear project id", "uuid")}
          {field("notes", "notes")}
          <div className="confirm-row">
            <button className="btn-primary" disabled={busy} onClick={() => post(form)}>
              {busy ? "…" : dryRun ? "save (dry-run)" : "save → commit"}
            </button>
            <button className="token-btn" disabled={busy} onClick={() => { setForm(initial); setOpen(false); }}>
              cancel
            </button>
          </div>
        </div>
      ) : null}
      {error ? <div className="error-text">{error}</div> : null}
      <div className="meta" style={{ marginTop: 6 }}>
        Tier drives ordering everywhere; path / remote / last-commit are refreshed by generate.py, not here.
        {dryRun ? " Dry-run: edits apply to the local checkout only." : " Every save is one commit to registers/projects.csv."}
      </div>
    </div>
  );
}
