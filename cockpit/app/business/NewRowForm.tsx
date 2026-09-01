"use client";
// Add a row to a business-register table. POST /api/business/insert ⇒
// public.admin_insert_row. Parent (entity or person) is chosen from a list.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TableSpec } from "@/lib/business";
import { FieldInput } from "./RowCard";

export function NewRowForm({
  spec,
  parents,
}: {
  spec: TableSpec;
  parents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parent, setParent] = useState(parents[0]?.id ?? "");
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      spec.fields.map((f) => [f.key, f.type === "bool" ? "true" : f.type === "select" && f.required ? (f.options?.[0] ?? "") : ""]),
    ),
  );
  const fk = spec.parent === "entity" ? "entity_id" : spec.parent === "person" ? "person_id" : null;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const row: Record<string, string> = { ...form };
      if (fk) row[fk] = parent;
      const res = await fetch("/api/business/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: spec.table, row }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "insert failed");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "insert failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        + New {spec.title.toLowerCase().replace(/s$/, "").replace(/ & registration$/, "")}
      </button>
    );
  }

  return (
    <div className="card">
      <h3>New row · {spec.title}</h3>
      <div className="edit-form">
        {fk ? (
          <label>
            {spec.parent === "entity" ? "Entity" : "Person"}
            <select value={parent} onChange={(e) => setParent(e.target.value)}>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {spec.fields.map((f) => (
          <FieldInput key={f.key} f={f} value={form[f.key] ?? ""} onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} />
        ))}
        <div className="confirm-row">
          <button type="button" className="btn-primary" disabled={busy || (Boolean(fk) && !parent)} onClick={submit}>
            {busy ? "saving…" : "Add"}
          </button>
          <button type="button" className="chip" style={{ marginTop: 8, cursor: "pointer", background: "transparent" }} onClick={() => setOpen(false)}>
            cancel
          </button>
          {error ? <div className="error-text">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}
