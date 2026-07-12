// Register view models. Registers are rendered AS-IS (already last-4-only per
// repo canon) — this layer only shapes columns for phone-first display, it
// never adds or derives sensitive data.
import { parseCsv, type CsvTable } from "./csv";

export type RegisterName =
  | "subscriptions"
  | "services"
  | "assets"
  | "access"
  | "calendar"
  | "models";

export const REGISTERS: { name: RegisterName; title: string; blurb: string }[] = [
  { name: "subscriptions", title: "Subscriptions", blurb: "Recurring spend" },
  { name: "services", title: "Services", blurb: "What runs where" },
  { name: "assets", title: "Assets", blurb: "Files & artifacts" },
  { name: "access", title: "Access", blurb: "Key locations (never keys)" },
  { name: "calendar", title: "Calendar", blurb: "Dates & deadlines" },
  { name: "models", title: "Models", blurb: "Model lanes" },
];

export function isRegisterName(v: string): v is RegisterName {
  return REGISTERS.some((r) => r.name === v);
}

// A register rendered for mobile: each row becomes a card with a title field,
// an optional status field, an optional cost, and the remaining fields as
// label/value pairs.
export type RegisterCard = {
  title: string;
  status?: string;
  cost?: string;
  fields: { label: string; value: string }[];
};

export type RegisterView = {
  name: RegisterName;
  title: string;
  headers: string[];
  cards: RegisterCard[];
  totalMonthlyUsd?: number;
  incompleteCosts?: number;
};

const TITLE_FIELD: Record<RegisterName, string> = {
  subscriptions: "service",
  services: "service",
  assets: "asset",
  access: "system",
  calendar: "item",
  models: "name",
};

export function buildRegisterView(name: RegisterName, csvText: string): RegisterView {
  const table: CsvTable = parseCsv(csvText);
  const titleField = TITLE_FIELD[name];
  const cards: RegisterCard[] = table.rows.map((row) => {
    const title = row[titleField] || "(unnamed)";
    const status = row["status"] || row["type"] || undefined;
    const cost = row["cost_monthly_usd"]
      ? `$${row["cost_monthly_usd"]}/mo`
      : undefined;
    const fields = table.headers
      .filter((h) => h !== titleField && h !== "status" && h !== "cost_monthly_usd")
      .map((h) => ({ label: h.replace(/_/g, " "), value: row[h] ?? "" }))
      .filter((f) => f.value !== "");
    return { title, status, cost, fields };
  });

  const view: RegisterView = {
    name,
    title: REGISTERS.find((r) => r.name === name)?.title ?? name,
    headers: table.headers,
    cards,
  };

  if (name === "subscriptions") {
    let total = 0;
    let incomplete = 0;
    for (const row of table.rows) {
      const rawCost = row["cost_monthly_usd"] ?? "";
      const n = parseFloat(rawCost.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(n)) total += n;
      else if ((row["status"] ?? "") !== "" && !/dead|cancelled|expiring|owned/.test(row["status"] ?? "")) incomplete++;
    }
    view.totalMonthlyUsd = Math.round(total * 100) / 100;
    view.incompleteCosts = incomplete;
  }
  return view;
}
