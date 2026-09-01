// Pure validation for business-register writes. The database RPC enforces the
// same allow-list; this layer turns form strings into typed JSON (empty ⇒ null,
// numbers ⇒ numbers, bools ⇒ bools) and rejects anything off-list before the
// request leaves the cockpit. No I/O — unit-tested.
import { tableByName, type FieldSpec, type TableSpec } from "./business";

export class BusinessEditError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

function coerce(f: FieldSpec, raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "boolean") {
    if (f.type !== "bool") throw new BusinessEditError(`${f.key}: expected ${f.type}`);
    return raw;
  }
  if (typeof raw === "number") {
    if (f.type !== "number") throw new BusinessEditError(`${f.key}: expected ${f.type}`);
    return raw;
  }
  if (typeof raw !== "string") throw new BusinessEditError(`${f.key}: unsupported value`);
  const s = raw.trim();
  if (s === "") return null;
  if (s.length > 4000) throw new BusinessEditError(`${f.key}: too long`);
  switch (f.type) {
    case "number": {
      const n = Number(s);
      if (!Number.isFinite(n)) throw new BusinessEditError(`${f.key}: not a number`);
      return n;
    }
    case "date":
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new BusinessEditError(`${f.key}: date must be YYYY-MM-DD`);
      return s;
    case "bool":
      if (s === "true" || s === "yes") return true;
      if (s === "false" || s === "no") return false;
      throw new BusinessEditError(`${f.key}: not a boolean`);
    case "select":
      if (f.options && !f.options.includes(s)) throw new BusinessEditError(`${f.key}: not one of ${f.options.join(", ")}`);
      return s;
    default:
      return s;
  }
}

export function resolveTable(table: unknown): TableSpec {
  if (typeof table !== "string") throw new BusinessEditError("missing table");
  const spec = tableByName(table);
  if (!spec) throw new BusinessEditError(`unknown table ${table}`);
  return spec;
}

// Update: only editable fields, at least one, typed.
export function sanitizePatch(table: unknown, patch: unknown): { spec: TableSpec; patch: Record<string, unknown> } {
  const spec = resolveTable(table);
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new BusinessEditError("patch must be an object");
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const f = spec.fields.find((x) => x.key === k);
    if (!f) throw new BusinessEditError(`${k} is not editable on ${spec.table}`);
    out[k] = coerce(f, v);
  }
  if (Object.keys(out).length === 0) throw new BusinessEditError("empty patch");
  return { spec, patch: out };
}

// Insert: editable fields plus the parent FK; required fields present.
export function sanitizeInsert(table: unknown, row: unknown): { spec: TableSpec; row: Record<string, unknown> } {
  const spec = resolveTable(table);
  if (!spec.insertable) throw new BusinessEditError(`${spec.table} does not accept new rows here`);
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new BusinessEditError("row must be an object");
  const src = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of spec.fields) {
    if (f.key in src) {
      const v = coerce(f, src[f.key]);
      if (v !== null) out[f.key] = v;
    }
    if (f.required && (out[f.key] === undefined || out[f.key] === null)) {
      throw new BusinessEditError(`${f.label} is required`);
    }
  }
  const fk = spec.parent === "entity" ? "entity_id" : spec.parent === "person" ? "person_id" : null;
  if (fk) {
    if (!isUuid(src[fk])) throw new BusinessEditError(`${fk} is required`);
    out[fk] = src[fk];
  }
  return { spec, row: out };
}
