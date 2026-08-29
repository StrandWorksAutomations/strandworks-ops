// Owner edits to the projects register, as pure CSV→CSV transforms (same
// contract as money-edit): the register is the only store, every edit is one
// commit by the caller. Hand-curated columns are editable; the columns
// generate.py derives from the repos (path/remote/last_commit/activity) are not.
import { parseCsv, stringifyCsv } from "./csv";

export const TIERS = ["flagship", "ops", "tier-2", "tier-3", "tool", "reference", "fork", "frozen"] as const;

export const EDITABLE_FIELDS = [
  "name",
  "role",
  "tier",
  "tokens",
  "domains",
  "surfaces",
  "supabase_ref",
  "vercel_project",
  "linear_project",
  "notes",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

export type ProjectEdit = { slug: string; fields: Partial<Record<EditableField, string>> };

export class EditError extends Error {}

function clean(v: string): string {
  return v
    .replace(/[\r\n\t]+/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 400);
}

function validate(fields: Partial<Record<EditableField, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, raw] of Object.entries(fields)) {
    if (!(EDITABLE_FIELDS as readonly string[]).includes(k)) throw new EditError(`field "${k}" is not editable`);
    const v = clean(raw ?? "");
    if (k === "tier" && v !== "" && !(TIERS as readonly string[]).includes(v)) {
      throw new EditError(`tier must be one of ${TIERS.join("/")} or blank`);
    }
    if (k === "supabase_ref" && v !== "" && !/^[a-z]{20}$/.test(v)) {
      throw new EditError("supabase_ref must be the 20-letter project ref");
    }
    if (k === "linear_project" && v !== "" && !/^[0-9a-f-]{36}$/.test(v)) {
      throw new EditError("linear_project must be the Linear project UUID");
    }
    if ((k === "domains" || k === "surfaces" || k === "tokens") && /,/.test(v)) {
      throw new EditError(`${k} is ;-separated, not comma-separated`);
    }
    out[k] = v;
  }
  if (Object.keys(out).length === 0) throw new EditError("no fields to update");
  return out;
}

export function applyProjectEdit(csvText: string, edit: ProjectEdit): { csv: string; summary: string } {
  const table = parseCsv(csvText);
  if (!table.headers.includes("slug")) throw new EditError("register has no slug column");
  const rows = table.rows.filter((r) => (r["slug"] ?? "") === edit.slug);
  if (rows.length !== 1) throw new EditError(`slug "${edit.slug}" matches ${rows.length} rows`);
  const fields = validate(edit.fields);
  for (const [k, v] of Object.entries(fields)) rows[0][k] = v;
  return { csv: stringifyCsv(table), summary: `update ${edit.slug}: ${Object.keys(fields).join(", ")}` };
}
