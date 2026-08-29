// Per-project footprint aggregation (SPEC WS-E).
//
// This layer reads ONLY the existing registers and attributes each row to one
// or more projects. It INVENTS NOTHING: every value shown on a project page is
// a value already in a register. A project with no matching rows in a register
// renders that section blank with a note — never a guessed value.
//
// Attribution rule: a register row belongs to a project when the project's
// match tokens appear (case-insensitively) in the row's `project` column, or —
// for registers/rows that carry no usable project column (services w/
// "portfolio-wide"/"all", subscriptions which have none) — when a token appears
// anywhere in the row's searchable text. Portfolio-wide/all-scope infrastructure
// is surfaced on every project AND flagged as shared, so a project page is
// honest about what is dedicated vs. shared.

import { parseCsv } from "./csv";

// The canonical project list lives in registers/projects.csv (SPEC WS-E): the
// register is the source of truth, this module only parses it. Hand columns
// (slug/name/role/tokens/tier/domains/surfaces/supabase_ref/vercel_project/
// linear_project/notes) are owner-curated; path/remote/last_commit/activity are
// refreshed mechanically by generate.py from the sibling repos.
export type ProjectDef = {
  slug: string;
  name: string;
  role: string;
  tokens: string[];
  tier: string; // flagship | ops | tier-2 | tier-3 | tool | reference | fork | frozen | ""
  path: string;
  remote: string;
  lastCommit: string; // YYYY-MM-DD or ""
  activity: string; // active | idle | dormant | ""
  domains: string[];
  surfaces: string[];
  supabaseRef: string;
  vercelProject: string;
  linearProject: string;
  notes: string;
};

function list(v: string | undefined): string[] {
  return (v ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseProjects(csvText: string | null | undefined): ProjectDef[] {
  if (!csvText) return [];
  const out: ProjectDef[] = [];
  for (const r of parseCsv(csvText).rows) {
    const slug = (r["slug"] ?? "").trim();
    if (!/^[a-z0-9-]+$/.test(slug)) continue;
    const tokens = list(r["tokens"]);
    if (!tokens.includes(slug)) tokens.push(slug);
    out.push({
      slug,
      name: r["name"] || slug,
      role: r["role"] ?? "",
      tokens,
      tier: r["tier"] ?? "",
      path: r["path"] ?? "",
      remote: r["remote"] ?? "",
      lastCommit: r["last_commit"] ?? "",
      activity: r["activity"] ?? "",
      domains: list(r["domains"]),
      surfaces: list(r["surfaces"]),
      supabaseRef: r["supabase_ref"] ?? "",
      vercelProject: r["vercel_project"] ?? "",
      linearProject: r["linear_project"] ?? "",
      notes: r["notes"] ?? "",
    });
  }
  return out;
}

export const TIER_ORDER = ["flagship", "ops", "tier-2", "tier-3", "tool", "reference", "fork", "frozen", ""];

export function tierRank(tier: string): number {
  const i = TIER_ORDER.indexOf(tier);
  return i === -1 ? TIER_ORDER.length : i;
}

export function projectBySlug(projects: ProjectDef[], slug: string): ProjectDef | undefined {
  return projects.find((p) => p.slug === slug);
}

// Scope of a register row relative to a project.
//   "dedicated" — the row names this project (or a token unique to it).
//   "shared"    — the row is portfolio/all-scope infrastructure.
export type RowScope = "dedicated" | "shared";

// "Shared" scope markers = company/all-scope infra, NOT a single product.
// Deliberately excludes "ops": strandworks-ops is a real project (this repo),
// not a shared bucket, so its rows must read as dedicated, not shared.
const SHARED_SCOPE_RE = /\b(portfolio-wide|portfolio|all|mixed|company|infrastructure)\b/i;

function rowText(row: Record<string, string>, fields: string[]): string {
  return fields
    .map((f) => row[f] ?? "")
    .join(" ")
    .toLowerCase();
}

function matchesProject(text: string, proj: ProjectDef): boolean {
  return proj.tokens.some((t) => text.includes(t.toLowerCase()));
}

// A single attributed register row, carried with its scope for the view.
export type AttributedRow = {
  row: Record<string, string>;
  scope: RowScope;
};

// Attribute the rows of one register to a project. `matchFields` are the columns
// we scan for the project's tokens; `scopeField` (usually the `project` column)
// is scanned for the shared-scope markers.
export function attributeRows(
  csvText: string,
  proj: ProjectDef,
  matchFields: string[],
  scopeField: string,
  all: ProjectDef[] = [proj],
): AttributedRow[] {
  const table = parseCsv(csvText);
  const out: AttributedRow[] = [];
  for (const row of table.rows) {
    const text = rowText(row, matchFields.length ? matchFields : table.headers);
    const scopeText = (row[scopeField] ?? "").toLowerCase();
    const isShared = SHARED_SCOPE_RE.test(scopeText);
    if (matchesProject(text, proj)) {
      out.push({ row, scope: isShared ? "shared" : "dedicated" });
    } else if (isShared) {
      // Portfolio-wide infra is relevant to every project as SHARED, but only
      // if it doesn't already name a *different* single project. A row whose
      // project column is a shared marker (not a specific project) applies to all.
      const namesAnotherProject = all.some(
        (p) => p.slug !== proj.slug && matchesProject(scopeText, p) && !SHARED_SCOPE_RE.test(p.tokens.join(" ")),
      );
      if (!namesAnotherProject) out.push({ row, scope: "shared" });
    }
  }
  return out;
}

// The full footprint of one project, assembled from the registers. Each section
// is a list of attributed rows plus the header set (for label rendering). Empty
// list ⇒ the page shows "no <register> rows attributed" — never invented data.
export type ProjectFootprint = {
  project: ProjectDef;
  infra: AttributedRow[]; // services.csv
  assets: AttributedRow[]; // assets.csv
  access: AttributedRow[]; // access.csv (KEY LOCATIONS only)
  models: AttributedRow[]; // models.csv
  subscriptions: AttributedRow[]; // subscriptions.csv
  spendMonthlyUsd: number; // costed subscriptions DEDICATED to this project only
  sharedMonthlyUsd: number; // costed subs this project uses but shares with others
  spendHasUncosted: boolean; // some dedicated subs have no cost → total is a floor
};

export type RegisterInputs = {
  services?: string | null;
  assets?: string | null;
  access?: string | null;
  models?: string | null;
  subscriptions?: string | null;
};

function num(raw: string): number | null {
  const n = parseFloat((raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function buildProjectFootprint(
  proj: ProjectDef,
  inputs: RegisterInputs,
  all: ProjectDef[] = [proj],
): ProjectFootprint {
  const infra = inputs.services
    ? attributeRows(inputs.services, proj, ["service", "what_it_runs", "project", "notes"], "project", all)
    : [];
  const assets = inputs.assets
    ? attributeRows(inputs.assets, proj, ["asset", "type", "location", "project", "notes"], "project", all)
    : [];
  const access = inputs.access
    ? attributeRows(inputs.access, proj, ["system", "account", "machines_with_access", "key_location", "notes"], "notes", all)
    : [];
  const models = inputs.models
    ? attributeRows(inputs.models, proj, ["name", "kind", "where", "notes"], "notes", all)
    : [];
  // subscriptions.csv has NO project column — match on token appearance in the
  // whole row. A row whose text names MORE THAN ONE project is SHARED
  // infrastructure (e.g. the Supabase org serving several apps): its cost is
  // reported separately and never summed into any single project's dedicated
  // spend, so shared services are not double-counted across project pages.
  const subscriptions: AttributedRow[] = [];
  let spendMonthlyUsd = 0;
  let sharedMonthlyUsd = 0;
  let spendHasUncosted = false;
  if (inputs.subscriptions) {
    for (const row of parseCsv(inputs.subscriptions).rows) {
      const text = rowText(row, ["service", "plan", "notes"]);
      const matched = all.filter((p) => matchesProject(text, p));
      if (!matched.some((p) => p.slug === proj.slug)) continue;
      const scope: RowScope = matched.length > 1 ? "shared" : "dedicated";
      subscriptions.push({ row, scope });
      const n = num(row["cost_monthly_usd"] ?? "");
      if (n !== null) {
        if (scope === "shared") sharedMonthlyUsd += n;
        else spendMonthlyUsd += n;
      } else if (scope === "dedicated") {
        const status = row["status"] ?? "";
        if (status !== "" && !/dead|cancelled|expiring|owned/.test(status)) spendHasUncosted = true;
      }
    }
  }

  return {
    project: proj,
    infra,
    assets,
    access,
    models,
    subscriptions,
    spendMonthlyUsd: Math.round(spendMonthlyUsd * 100) / 100,
    sharedMonthlyUsd: Math.round(sharedMonthlyUsd * 100) / 100,
    spendHasUncosted,
  };
}

// Deployed surfaces: URL-ish tokens found in a project's attributed service
// rows — the register already records where things run; this just makes those
// locations tappable. Extraction only, never invention.
export function extractSurfaces(rows: AttributedRow[]): string[] {
  const re = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|app|net|org|io|dev|me|us)(?:\/[\w\-./?=&%]*)?/gi;
  const out: string[] = [];
  for (const { row } of rows) {
    const text = `${row["what_it_runs"] ?? ""} ${row["notes"] ?? ""}`;
    for (const m of text.match(re) ?? []) {
      const url = m.replace(/^https?:\/\//i, "").replace(/[).,;]+$/, "").toLowerCase();
      if (url.includes("@")) continue; // emails are not surfaces
      if (!out.includes(url)) out.push(url);
    }
  }
  return out.slice(0, 12);
}
