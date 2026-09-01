// Business register — the compliance/ops tables in Supabase admin.* (entities,
// licences, obligations, contacts, people, credentials, insurance, documents,
// accounts), surfaced through service-role-only public.v_admin_* views and
// written through the guarded public.admin_update_row / admin_insert_row RPCs.
// The database is the source of truth; this module reads, shapes, and names.
import { sbSelect, supabaseConfigured } from "./supabase-rest";

export type FieldType = "text" | "date" | "number" | "select" | "textarea" | "bool";

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  required?: boolean; // for inserts
};

export type TableSpec = {
  slug: string; // URL segment under /business/
  table: string; // admin.<table>
  view: string; // public.v_admin_<...>
  title: string;
  blurb: string;
  order: string; // PostgREST order clause
  titleField: string;
  subFields: string[]; // shown under the title (joined with ·)
  statusField?: string;
  dateField?: string; // the date that drives urgency (expires/next_due)
  amountField?: string;
  detailFields: string[]; // rendered in the dl
  fields: FieldSpec[]; // editable + insertable columns
  parent?: "entity" | "person"; // FK required on insert
  insertable: boolean;
};

const ENTITY_TYPES = ["parent", "subsidiary", "separate"] as const;
const LICENSE_CATEGORIES = ["formation", "foreign_registration", "tax_account", "federal_registration", "ems_agency", "professional", "local", "other"] as const;
const LICENSE_STATUS = ["planned", "applied", "active", "expired", "not_required", "parked"] as const;
const OBLIGATION_CATEGORIES = ["filing", "tax", "payroll", "license_renewal", "insurance_renewal", "contract", "report", "registration", "task", "other"] as const;
const OBLIGATION_STATUS = ["open", "in_progress", "done", "recurring", "parked", "not_required"] as const;
export const CONTACT_CATEGORIES = ["agency", "medical_director", "cpa", "attorney", "insurance_broker", "registered_agent", "bank", "payroll", "client", "vendor", "personal", "other"] as const;
const EMPLOYMENT = ["owner", "w2", "1099", "per_diem", "volunteer"] as const;
const PEOPLE_STATUS = ["prospect", "onboarding", "active", "inactive", "terminated"] as const;
const CRED_STATUS = ["active", "expired", "pending", "revoked"] as const;
const INSURANCE_STATUS = ["planned", "quoted", "bound", "active", "lapsed", "cancelled", "not_required"] as const;

export const TABLES: TableSpec[] = [
  {
    slug: "entities", table: "entities", view: "v_admin_entities",
    title: "Entities", blurb: "LLCs and business units",
    order: "type.asc,name.asc", titleField: "name", subFields: ["legal_name", "type"],
    detailFields: ["slug", "tax_id", "is_active"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "legal_name", label: "Legal name", type: "text" },
      { key: "type", label: "Type", type: "select", options: ENTITY_TYPES },
      { key: "is_active", label: "Active", type: "bool" },
    ],
    insertable: false,
  },
  {
    slug: "licenses", table: "licenses", view: "v_admin_licenses",
    title: "Licences & registrations", blurb: "formation, tax accounts, EMS agency, vendor portals",
    order: "status.asc,expires_on.asc.nullslast,name.asc", titleField: "name",
    subFields: ["entity", "jurisdiction", "category"], statusField: "status", dateField: "expires_on", amountField: "fee_usd",
    detailFields: ["authority", "number", "issued_on", "renewal_recurrence", "trigger_condition", "url", "notes"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: LICENSE_CATEGORIES, required: true },
      { key: "jurisdiction", label: "Jurisdiction", type: "text" },
      { key: "authority", label: "Authority", type: "text" },
      { key: "number", label: "Number", type: "text" },
      { key: "status", label: "Status", type: "select", options: LICENSE_STATUS },
      { key: "issued_on", label: "Issued", type: "date" },
      { key: "expires_on", label: "Expires", type: "date" },
      { key: "renewal_recurrence", label: "Renewal recurrence", type: "text" },
      { key: "fee_usd", label: "Fee USD", type: "number" },
      { key: "trigger_condition", label: "Trigger condition", type: "text" },
      { key: "url", label: "URL", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "entity", insertable: true,
  },
  {
    slug: "obligations", table: "obligations", view: "v_admin_obligations",
    title: "Obligations", blurb: "filings, taxes, renewals, contracts, tasks",
    order: "status.asc,next_due.asc.nullslast,name.asc", titleField: "name",
    subFields: ["entity", "jurisdiction", "category"], statusField: "status", dateField: "next_due", amountField: "fee_usd",
    detailFields: ["authority", "recurrence", "recurrence_note", "last_completed", "alert_days_before", "trigger_condition", "url", "notes"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: OBLIGATION_CATEGORIES, required: true },
      { key: "authority", label: "Authority", type: "text" },
      { key: "jurisdiction", label: "Jurisdiction", type: "text" },
      { key: "status", label: "Status", type: "select", options: OBLIGATION_STATUS },
      { key: "recurrence", label: "Recurrence", type: "text" },
      { key: "recurrence_note", label: "Recurrence note", type: "text" },
      { key: "next_due", label: "Next due", type: "date" },
      { key: "last_completed", label: "Last completed", type: "date" },
      { key: "fee_usd", label: "Fee USD", type: "number" },
      { key: "alert_days_before", label: "Alert days before", type: "number" },
      { key: "trigger_condition", label: "Trigger condition", type: "text" },
      { key: "url", label: "URL", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "entity", insertable: true,
  },
  {
    slug: "contacts", table: "contacts", view: "v_admin_contacts",
    title: "Contacts", blurb: "medical directors, agencies, CPA, attorney, brokers, banks, vendors",
    order: "category.asc,organization.asc.nullslast,name.asc.nullslast", titleField: "organization",
    subFields: ["name", "title", "category", "jurisdiction"], dateField: "last_contact_at",
    detailFields: ["entity", "email", "phone", "address", "notes", "is_active"],
    fields: [
      { key: "category", label: "Category", type: "select", options: CONTACT_CATEGORIES, required: true },
      { key: "organization", label: "Organization", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "jurisdiction", label: "Jurisdiction", type: "text" },
      { key: "last_contact_at", label: "Last contact", type: "date" },
      { key: "is_active", label: "Active", type: "bool" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "entity", insertable: true,
  },
  {
    slug: "people", table: "people", view: "v_admin_people",
    title: "People", blurb: "owner, staff, contractors, per-diem",
    order: "status.asc,name.asc", titleField: "name",
    subFields: ["role", "employment_type", "entity"], statusField: "status", dateField: "end_date",
    detailFields: ["email", "phone", "home_state", "start_date", "notes"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "role", label: "Role", type: "text", required: true },
      { key: "employment_type", label: "Employment", type: "select", options: EMPLOYMENT, required: true },
      { key: "status", label: "Status", type: "select", options: PEOPLE_STATUS },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "home_state", label: "Home state", type: "text" },
      { key: "start_date", label: "Start", type: "date" },
      { key: "end_date", label: "End", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "entity", insertable: true,
  },
  {
    slug: "credentials", table: "credentials", view: "v_admin_credentials",
    title: "Credentials", blurb: "paramedic licences, NREMT, certifications — per person",
    order: "status.asc,expires_on.asc.nullslast,type.asc", titleField: "type",
    subFields: ["person", "jurisdiction"], statusField: "status", dateField: "expires_on",
    detailFields: ["number", "issued_on", "verification_url", "notes"],
    fields: [
      { key: "type", label: "Type", type: "text", required: true },
      { key: "jurisdiction", label: "Jurisdiction", type: "text" },
      { key: "number", label: "Number", type: "text" },
      { key: "status", label: "Status", type: "select", options: CRED_STATUS },
      { key: "issued_on", label: "Issued", type: "date" },
      { key: "expires_on", label: "Expires", type: "date" },
      { key: "verification_url", label: "Verification URL", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "person", insertable: true,
  },
  {
    slug: "insurance", table: "insurance_policies", view: "v_admin_insurance",
    title: "Insurance", blurb: "GL, professional/malpractice, workers' comp",
    order: "status.asc,expires_on.asc.nullslast,type.asc", titleField: "type",
    subFields: ["entity", "carrier", "broker"], statusField: "status", dateField: "expires_on", amountField: "premium_annual_usd",
    detailFields: ["policy_number", "limits", "effective_on", "required_by", "notes"],
    fields: [
      { key: "type", label: "Type", type: "text", required: true },
      { key: "carrier", label: "Carrier", type: "text" },
      { key: "policy_number", label: "Policy number", type: "text" },
      { key: "limits", label: "Limits", type: "text" },
      { key: "status", label: "Status", type: "select", options: INSURANCE_STATUS },
      { key: "premium_annual_usd", label: "Premium USD / yr", type: "number" },
      { key: "effective_on", label: "Effective", type: "date" },
      { key: "expires_on", label: "Expires", type: "date" },
      { key: "required_by", label: "Required by", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "entity", insertable: true,
  },
  {
    slug: "documents", table: "documents", view: "v_admin_documents",
    title: "Documents", blurb: "operating agreements, statutes, correspondence — where they live",
    order: "kind.asc,title.asc", titleField: "title",
    subFields: ["kind", "entity"], dateField: "expires_on",
    detailFields: ["location", "effective_on", "notes"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "kind", label: "Kind", type: "text", required: true },
      { key: "location", label: "Location", type: "text", required: true },
      { key: "effective_on", label: "Effective", type: "date" },
      { key: "expires_on", label: "Expires", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "entity", insertable: true,
  },
  {
    slug: "accounts", table: "accounts", view: "v_admin_accounts",
    title: "Accounts", blurb: "hosting, domains, email, banking, portals — where and under which login",
    order: "type.asc,name.asc", titleField: "name",
    subFields: ["type", "provider", "entity"], dateField: "last_verified_at",
    detailFields: ["login_url", "username", "notes", "is_active"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "type", label: "Type", type: "text" },
      { key: "provider", label: "Provider", type: "text" },
      { key: "login_url", label: "Login URL", type: "text" },
      { key: "username", label: "Username / email", type: "text" },
      { key: "is_active", label: "Active", type: "bool" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    parent: "entity", insertable: true,
  },
];

export function tableBySlug(slug: string): TableSpec | undefined {
  return TABLES.find((t) => t.slug === slug);
}

export function tableByName(table: string): TableSpec | undefined {
  return TABLES.find((t) => t.table === table);
}

export type Row = Record<string, unknown> & { id: string };

// null ⇒ backend not configured / unreachable (the UI says so).
export async function fetchRows(spec: TableSpec): Promise<Row[] | null> {
  if (!supabaseConfigured()) return null;
  try {
    return await sbSelect<Row>(spec.view, `select=*&order=${spec.order}&limit=500`);
  } catch {
    return null;
  }
}

export type Counts = Record<string, number | null>;

export async function fetchCounts(): Promise<Counts | null> {
  if (!supabaseConfigured()) return null;
  const out: Counts = {};
  await Promise.all(
    TABLES.map(async (t) => {
      try {
        const rows = await sbSelect<{ id: string }>(t.view, "select=id&limit=1000");
        out[t.slug] = rows.length;
      } catch {
        out[t.slug] = null;
      }
    }),
  );
  return out;
}

export function statusClass(status: unknown): string {
  const s = String(status ?? "").toLowerCase();
  if (!s) return "";
  if (/^(active|done|bound|recurring|owner)$/.test(s)) return "good";
  if (/^(expired|lapsed|revoked|cancelled|terminated)$/.test(s)) return "bad";
  if (/^(planned|applied|quoted|open|pending|in_progress|onboarding|prospect)$/.test(s)) return "warn";
  return "";
}

export function daysUntil(iso: unknown, todayIso: string): number | null {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const a = new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${todayIso}T00:00:00Z`).getTime();
  return Math.round((a - b) / 86400000);
}

export function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") return String(v);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  return String(v);
}
