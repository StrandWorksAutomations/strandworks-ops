"use client";
// One business-register row as an editable card. Edit ⇒ POST /api/business/update
// ⇒ public.admin_update_row (allow-listed columns only) ⇒ router.refresh().
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldSpec, TableSpec } from "@/lib/business";

type Row = Record<string, unknown> & { id: string };

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  return String(v);
}

function initial(f: FieldSpec, v: unknown): string {
  if (v === null || v === undefined) return f.type === "bool" ? "false" : "";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string" && f.type === "date") return v.slice(0, 10);
  return String(v);
}

export function FieldInput({
  f,
  value,
  onChange,
}: {
  f: FieldSpec;
  value: string;
  onChange: (v: string) => void;
}) {
  if (f.type === "select" || f.type === "bool") {
    const opts = f.type === "bool" ? ["true", "false"] : [...(f.options ?? [])];
    return (
      <label>
        {f.label}
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {f.type !== "bool" && !f.required ? <option value="">—</option> : null}
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (f.type === "textarea") {
    return (
      <label style={{ gridColumn: "1 / -1" }}>
        {f.label}
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  return (
    <label>
      {f.label}
      <input
        type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
        step={f.type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function RowCard({
  spec,
  row,
  badges,
}: {
  spec: TableSpec;
  row: Row;
  badges: { text: string; cls: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.fields.map((f) => [f.key, initial(f, row[f.key])])),
  );

  async function save() {
    setBusy(true);
    setError(null);
    const patch: Record<string, string> = {};
    for (const f of spec.fields) {
      if (form[f.key] !== initial(f, row[f.key])) patch[f.key] = form[f.key];
    }
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/business/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: spec.table, id: row.id, patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "update failed");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "update failed");
    } finally {
      setBusy(false);
    }
  }

  const title = show(row[spec.titleField]);
  const sub = spec.subFields.map((k) => row[k]).filter((v) => v !== null && v !== undefined && v !== "").map(show).join(" · ");
  const amount = spec.amountField ? row[spec.amountField] : null;

  return (
    <div className="card">
      <h3 style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span>{title}</span>
        {badges.map((b, i) => (
          <span key={i} className={`badge ${b.cls}`}>
            {b.text}
          </span>
        ))}
        <button
          type="button"
          className="chip"
          style={{ marginLeft: "auto", cursor: "pointer", background: "transparent" }}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "close" : "edit"}
        </button>
      </h3>
      {sub ? <div className="meta">{sub}</div> : null}
      {amount !== null && amount !== undefined && amount !== "" ? (
        <div className="cost">${Number(amount).toLocaleString()}</div>
      ) : null}
      {!editing ? (
        <dl>
          {spec.detailFields
            .filter((k) => row[k] !== null && row[k] !== undefined && row[k] !== "")
            .map((k) => (
              <div key={k}>
                <dt>{k.replace(/_/g, " ")}</dt>
                <dd style={{ wordBreak: "break-word" }}>
                  {typeof row[k] === "string" && /^https?:\/\//.test(row[k] as string) ? (
                    <a href={row[k] as string} target="_blank" rel="noreferrer">
                      {row[k] as string}
                    </a>
                  ) : (
                    show(row[k])
                  )}
                </dd>
              </div>
            ))}
        </dl>
      ) : (
        <div className="edit-form">
          {spec.fields.map((f) => (
            <FieldInput key={f.key} f={f} value={form[f.key] ?? ""} onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} />
          ))}
          <div className="confirm-row">
            <button type="button" className="btn-primary" disabled={busy} onClick={save}>
              {busy ? "saving…" : "Save"}
            </button>
            {error ? <div className="error-text">{error}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
}
