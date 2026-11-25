// Owner edits to the subscriptions register, as pure CSV→CSV transforms.
//
// The register stays the single source of truth: every edit here is applied
// to registers/subscriptions.csv text and committed by the caller (GitHub
// trees API in production, local checkout in dev dry-run) — the cockpit never
// grows a database. Owner columns are introduced on first edit:
//   verdict    — owner ruling on the row: approved | pending-cancel | cancel
//   trial_end  — YYYY-MM-DD; set ⇒ this is a trial, alerts fire as it nears
//   discount   — free-text discount note (student / small-business / …)
//   charge_usd — exact price of one payment, separate from the monthly equivalent
// Sweep-derived columns (status, notes) are never touched by edits.

import { parseCsv, stringifyCsv, type CsvTable } from "./csv";
import { isCalendarDay, parseBillingCadence } from "./subscription-calendar";

export const VERDICTS = ["approved", "pending-cancel", "cancel"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const RECURRING_CADENCES = ["weekly", "monthly", "quarterly", "annually"] as const;
export const CADENCE_CHOICES = [...RECURRING_CADENCES, "one-time", "custom"] as const;

export const OWNER_COLUMNS = ["verdict", "trial_end", "discount", "charge_usd"] as const;

// Fields the owner may edit. Everything else in the row is sweep truth.
export const EDITABLE_FIELDS = [
  "plan",
  "cost_monthly_usd",
  "charge_usd",
  "billing_cadence",
  "renewal_date",
  "trial_end",
  "discount",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

type Fields = Partial<Record<EditableField, string>>;
export type SubscriptionEdit = (
  | { action: "verdict"; service: string; verdict: Verdict | "" }
  | { action: "add" | "update"; service: string; fields: Fields }
  | { action: "delete"; service: string }
) & { expected?: Fields & { verdict?: string } };

export class EditError extends Error {}
export class EditConflict extends EditError {}

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

function validateFields(fields: Fields): Record<string, string> {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) throw new EditError("Expected subscription fields.");
  const out: Record<string, string> = {};
  for (const [k, vRaw] of Object.entries(fields)) {
    if (!(EDITABLE_FIELDS as readonly string[]).includes(k)) {
      throw new EditError(`field "${k}" is not editable`);
    }
    if (typeof vRaw !== "string" || vRaw.length > 200) throw new EditError(`Invalid value for ${k}.`);
    let v = clean(vRaw);
    if (k === "cost_monthly_usd" && v !== "" && !/^[~$]?\d+(\.\d{1,2})?\+?$/.test(v)) {
      throw new EditError(`cost "${v}" is not a number (blank is allowed — unknown stays unknown)`);
    }
    if (k === "charge_usd" && v !== "") {
      if (!/^\d+(\.\d{1,2})?$/.test(v)) throw new EditError("Enter a nonnegative USD price with up to two decimal places.");
      const [dollars, cents = ""] = v.split(".");
      const totalCents = Number(dollars + cents.padEnd(2, "0"));
      if (!Number.isSafeInteger(totalCents * 52)) throw new EditError("The price is too large.");
      v = `${Number(dollars)}.${cents.padEnd(2, "0")}`;
    }
    if ((k === "renewal_date" || k === "trial_end") && v !== "" && !isCalendarDay(v)) {
      throw new EditError(`${k} must be YYYY-MM-DD or blank`);
    }
    out[k] = v;
  }
  if (Object.keys(out).length === 0) throw new EditError("no fields to update");
  if ("cost_monthly_usd" in out && "charge_usd" in out) throw new EditError("Supply either the billing price or a monthly estimate.");
  return out;
}

export type EditResult = { csv: string; summary: string };

export function applySubscriptionEdit(csvText: string, edit: SubscriptionEdit): EditResult {
  const table = parseCsv(csvText);
  if (!table.headers.includes("service")) throw new EditError("register has no service column");
  ensureOwnerColumns(table);

  if (typeof edit.service !== "string" || !edit.service.trim() || edit.service.length > 200 || clean(edit.service) !== edit.service.trim()) {
    throw new EditError("Enter a subscription name of up to 200 characters.");
  }
  const service = edit.service.trim();
  let row: Record<string, string>;
  if (edit.action === "add") {
    if (table.rows.some((r) => r.service.trim().toLowerCase() === service.toLowerCase())) {
      throw new EditConflict(`A subscription named "${service}" already exists.`);
    }
    row = { service, status: "active" };
    table.rows.push(row);
  } else {
    row = findRow(table, service);
    if (edit.expected !== undefined) {
      if (!edit.expected || typeof edit.expected !== "object" || Array.isArray(edit.expected)) throw new EditError("Invalid original fields.");
      for (const [field, before] of Object.entries(edit.expected)) {
        if (![...EDITABLE_FIELDS, "verdict"].includes(field) || typeof before !== "string") throw new EditError("Invalid original field.");
        if ((row[field] ?? "") !== before) throw new EditConflict(`"${service}" changed. Refresh before saving again.`);
      }
    }
  }
  if (edit.action === "delete") {
    table.rows = table.rows.filter((r) => r !== row);
    return {
      csv: stringifyCsv(table),
      summary: `delete ${edit.service}`,
    };
  }

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
  if (edit.action === "add") {
    if (!fields.charge_usd || !fields.renewal_date || !RECURRING_CADENCES.some(c => c === fields.billing_cadence)) {
      throw new EditError("Enter a price, next payment date and billing frequency.");
    }
  }
  const oldMonthly = row.cost_monthly_usd;
  for (const [k, v] of Object.entries(fields)) row[k] = v;
  if ("cost_monthly_usd" in fields && fields.cost_monthly_usd !== oldMonthly) row.charge_usd = "";
  if ("charge_usd" in fields || ("billing_cadence" in fields && row.charge_usd)) {
    const cadence = parseBillingCadence(row.billing_cadence ?? "");
    const [dollars, fraction = ""] = (row.charge_usd ?? "").split(".");
    const cents = Number(dollars + fraction.padEnd(2, "0"));
    const cyclesPerYear = { weekly: 52, monthly: 12, quarterly: 4, annually: 1 };
    const exact = /^\d+(?:\.\d{1,2})?$/.test(row.charge_usd ?? "") && Number.isSafeInteger(cents * 52);
    row.cost_monthly_usd = exact && cadence ? (Math.round(cents * cyclesPerYear[cadence] / 12) / 100).toFixed(2) : "";
  }
  return {
    csv: stringifyCsv(table),
    summary: `${edit.action} ${service}: ${Object.keys(fields).join(", ")}`,
  };
}
