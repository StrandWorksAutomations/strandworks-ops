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

// The canonical project list: PORTFOLIO ecosystem apps + the ops/governance
// repos that the fabric tracks. Slugs are URL-safe. `tokens` are the strings we
// match against register text (lowercased on both sides). `shared` marks the
// company-wide "project" buckets that are not a single product.
export type ProjectDef = {
  slug: string;
  name: string;
  role: string; // one-line role from PORTFOLIO / VISION
  tokens: string[];
};

export const PROJECTS: ProjectDef[] = [
  {
    slug: "3rdrider",
    name: "3rdrider",
    role: "Smart-glasses copilot for patient interactions; feeds billing + inventory",
    tokens: ["3rdrider", "3rd rider", "command-station", "command station"],
  },
  {
    slug: "haptic-mirror",
    name: "haptic-mirror",
    role: "Medical Simulation — FIELD mode (real-environment AR)",
    tokens: ["haptic-mirror", "haptic mirror", "haptic"],
  },
  {
    slug: "medsim-game",
    name: "MedSim-Game",
    role: "Medical Simulation — GAME mode (Tenetrix Intervention, virtual world)",
    tokens: ["medsim-game", "medsim game", "medsim", "tenetrix intervention"],
  },
  {
    slug: "liaison-dashboard",
    name: "liaison-dashboard",
    role: "Liaison web dashboard (genericization pending Unified exit)",
    tokens: ["liaison-dashboard", "liaison dashboard", "liaison"],
  },
  {
    slug: "tenetrix-insight",
    name: "Tenetrix Insight",
    role: "Deployed phone app (SmartBadge / BadgeMedia); vetted calculators",
    tokens: ["tenetrix-insight", "tenetrix insight", "smartbadge", "badgemedia"],
  },
  {
    slug: "sw-billing-integrations",
    name: "SW Billing Integrations",
    role: "Billing app (receives from Insight + 3rdrider)",
    tokens: ["sw-billing", "sw billing", "billing-integration", "billing integration"],
  },
  {
    slug: "chekov",
    name: "Chekov",
    role: 'Inventory management ("Check Off")',
    tokens: ["chekov", "check off", "check-off"],
  },
  {
    slug: "medcapture",
    name: "MedCapture",
    role: "Paused Supabase project (owner-ruled PAUSE)",
    tokens: ["medcapture"],
  },
  {
    slug: "strandworks-ops",
    name: "strandworks-ops",
    role: "The operations cockpit + Orchestration Fabric (this repo)",
    tokens: ["strandworks-ops", "strandworks ops", "cockpit", "ops", "broker", "orchestration"],
  },
];

export function projectBySlug(slug: string): ProjectDef | undefined {
  return PROJECTS.find((p) => p.slug === slug);
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
      const namesAnotherProject = PROJECTS.some(
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
): ProjectFootprint {
  const infra = inputs.services
    ? attributeRows(inputs.services, proj, ["service", "what_it_runs", "project", "notes"], "project")
    : [];
  const assets = inputs.assets
    ? attributeRows(inputs.assets, proj, ["asset", "type", "location", "project", "notes"], "project")
    : [];
  const access = inputs.access
    ? attributeRows(inputs.access, proj, ["system", "account", "machines_with_access", "key_location", "notes"], "notes")
    : [];
  const models = inputs.models
    ? attributeRows(inputs.models, proj, ["name", "kind", "where", "notes"], "notes")
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
      const matched = PROJECTS.filter((p) => matchesProject(text, p));
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
