// Owner edits to the subscriptions register, as pure CSV→CSV transforms.
//
// The register stays the single source of truth: every edit here is applied
// to registers/subscriptions.csv text and committed by the caller (GitHub
// trees API in production, local checkout in dev dry-run) — the cockpit never
// grows a database. Three owner columns are introduced on first edit:
//   verdict    — owner ruling on the row: approved | pending-cancel | cancel
//   trial_end  — YYYY-MM-DD; set ⇒ this is a trial, alerts fire as it nears
//   discount   — free-text discount note (student / small-business / …)
// Sweep-derived columns (status, notes) are never touched by edits.

import { parseCsv, stringifyCsv, type CsvTable } from "./csv";

export const VERDICTS = ["approved", "pending-cancel", "cancel"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const CADENCE_CHOICES = ["monthly", "annually", "one-time", "custom"] as const;

export const OWNER_COLUMNS = ["verdict", "trial_end", "discount"] as const;

// Fields the owner may edit. Everything else in the row is sweep truth.
export const EDITABLE_FIELDS = [
  "plan",
  "cost_monthly_usd",
  "billing_cadence",
  "renewal_date",
  "trial_end",
  "discount",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

export type SubscriptionEdit =
  | { action: "verdict"; service: string; verdict: Verdict | "" }
  | { action: "update"; service: string; fields: Partial<Record<EditableField, string>> }
  | { action: "delete"; service: string };

export class EditError extends Error {}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clean(v: string): string {
  // register cells are single-line; strip control chars, cap length
  return v
    .replace(/[\r\n\t]+/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 200);
}

function ensureOwnerColumns(table: CsvTable): void {
  for (const col of OWNER_COLUMNS) {
    if (!table.headers.includes(col)) {
      table.headers.push(col);
      for (const row of table.rows) row[col] = "";
    }
  }
}

function findRow(table: CsvTable, service: string): Record<string, string> {
  const matches = table.rows.filter((r) => (r["service"] ?? "") === service);
  if (matches.length === 0) throw new EditError(`no subscription named "${service}"`);
  if (matches.length > 1) throw new EditError(`"${service}" matches ${matches.length} rows — fix the register`);
  return matches[0];
}

function validateFields(fields: Partial<Record<EditableField, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, vRaw] of Object.entries(fields)) {
    if (!(EDITABLE_FIELDS as readonly string[]).includes(k)) {
      throw new EditError(`field "${k}" is not editable`);
    }
    const v = clean(vRaw ?? "");
    if (k === "cost_monthly_usd" && v !== "" && !/^[~$]?\d+(\.\d{1,2})?\+?$/.test(v)) {
      throw new EditError(`cost "${v}" is not a number (blank is allowed — unknown stays unknown)`);
    }
    if ((k === "renewal_date" || k === "trial_end") && v !== "" && !DATE_RE.test(v)) {
      throw new EditError(`${k} must be YYYY-MM-DD or blank`);
    }
    out[k] = v;
  }
  if (Object.keys(out).length === 0) throw new EditError("no fields to update");
  return out;
}

export type EditResult = { csv: string; summary: string };

export function applySubscriptionEdit(csvText: string, edit: SubscriptionEdit): EditResult {
  const table = parseCsv(csvText);
  if (!table.headers.includes("service")) throw new EditError("register has no service column");
  ensureOwnerColumns(table);

  if (edit.action === "delete") {
    const row = findRow(table, edit.service);
    table.rows = table.rows.filter((r) => r !== row);
    return {
      csv: stringifyCsv(table),
      summary: `delete ${edit.service}`,
    };
  }

  const row = findRow(table, edit.service);

  if (edit.action === "verdict") {
    if (edit.verdict !== "" && !VERDICTS.includes(edit.verdict)) {
      throw new EditError(`verdict must be one of ${VERDICTS.join("/")} or blank to clear`);
    }
    row["verdict"] = edit.verdict;
    return {
      csv: stringifyCsv(table),
      summary: `verdict ${edit.verdict || "cleared"} — ${edit.service}`,
    };
  }

  const fields = validateFields(edit.fields);
  for (const [k, v] of Object.entries(fields)) row[k] = v;
  return {
    csv: stringifyCsv(table),
    summary: `update ${edit.service}: ${Object.keys(fields).join(", ")}`,
  };
}
