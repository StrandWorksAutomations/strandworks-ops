// Kinetic Clinician group job posts: types, input validation and server reads.
// Drafts are generated in highest-paying (tools/job-posts.mjs); nothing here posts
// to Facebook. Jonathan copies a draft, posts it by hand and marks it posted.
export const KC_ROLES = ["rn", "lpn", "cna", "emt", "paramedic"] as const;
export const KC_ROLE_LABEL: Record<string, string> = { rn: "RN", lpn: "LPN", cna: "CNA", emt: "EMT", paramedic: "Paramedic" };
export const KC_EMPLOYMENT = ["travel", "contract", "full-time", "part-time"] as const;

export type KcGroup = {
  id: string;
  name: string;
  url: string;
  roles: string[];
  employment_types: string[];
  regions: string[];
  allows_job_posts: boolean | null;
  rules_note: string | null;
  rules_checked_on: string | null;
  weekly_cap: number;
  min_days_between: number;
  active: boolean;
};

export type KcDraft = {
  id: string;
  group_id: string;
  job_title: string;
  job_role: string;
  job_region: string | null;
  pay_label: string | null;
  share_url: string;
  body: string;
  status: "ready" | "posted" | "skipped" | "expired";
  skip_reason: string | null;
  created_at: string;
  posted_at: string | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateDraftMark(raw: unknown): Result<{ id: string; status: "posted" | "skipped"; reason?: string }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== "string" || !/^[0-9a-f-]{36}$/.test(r.id)) return { ok: false, error: "Unknown draft." };
  if (r.status !== "posted" && r.status !== "skipped") return { ok: false, error: "Status must be posted or skipped." };
  if (r.reason !== undefined && (typeof r.reason !== "string" || r.reason.length > 300)) return { ok: false, error: "Reason is too long." };
  return { ok: true, value: { id: r.id, status: r.status, ...(typeof r.reason === "string" && r.reason.trim() ? { reason: r.reason.trim() } : {}) } };
}

const GROUP_ID = /^[0-9A-Za-z._-]{3,64}$/;

export function validateGroupPatch(raw: unknown): Result<{ id: string; patch: Record<string, unknown> }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== "string" || !GROUP_ID.test(r.id)) return { ok: false, error: "Unknown group." };
  const p = (r.patch ?? {}) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if ("allows_job_posts" in p) {
    if (typeof p.allows_job_posts !== "boolean") return { ok: false, error: "Rules answer must be yes or no." };
    patch.allows_job_posts = p.allows_job_posts;
  }
  if ("roles" in p) {
    if (!Array.isArray(p.roles) || p.roles.some((x) => !(KC_ROLES as readonly string[]).includes(String(x)))) return { ok: false, error: "Unknown profession." };
    patch.roles = p.roles;
  }
  if ("employment_types" in p) {
    if (!Array.isArray(p.employment_types) || p.employment_types.some((x) => !(KC_EMPLOYMENT as readonly string[]).includes(String(x)))) return { ok: false, error: "Unknown job type." };
    patch.employment_types = p.employment_types;
  }
  if ("regions" in p) {
    if (!Array.isArray(p.regions) || p.regions.some((x) => !/^[A-Za-z]{2}$/.test(String(x)))) return { ok: false, error: "States must be two-letter codes." };
    patch.regions = p.regions.map((x) => String(x).toUpperCase());
  }
  for (const [key, lo, hi] of [["weekly_cap", 0, 7], ["min_days_between", 1, 14]] as const) {
    if (key in p) {
      const n = Number(p[key]);
      if (!Number.isInteger(n) || n < lo || n > hi) return { ok: false, error: `${key} must be ${lo}–${hi}.` };
      patch[key] = n;
    }
  }
  if ("active" in p) {
    if (typeof p.active !== "boolean") return { ok: false, error: "Active must be yes or no." };
    patch.active = p.active;
  }
  if ("rules_note" in p) {
    if (typeof p.rules_note !== "string" || p.rules_note.length > 1000) return { ok: false, error: "Note is too long." };
    patch.rules_note = p.rules_note;
  }
  if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to change." };
  return { ok: true, value: { id: r.id, patch } };
}

/** "https://www.facebook.com/groups/123/" → "123"; null for anything that is not a group link. */
export function groupIdFromUrl(url: string): string | null {
  const m = /^https:\/\/(?:www\.|m\.)?facebook\.com\/groups\/([0-9A-Za-z._-]{3,64})\/?(?:[?#].*)?$/.exec(url.trim());
  return m ? m[1] : null;
}

export function validateGroupAdd(raw: unknown): Result<{ id: string; name: string; url: string; roles: string[] }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const url = typeof r.url === "string" ? r.url.trim() : "";
  const id = groupIdFromUrl(url);
  if (!id) return { ok: false, error: "Paste the group's facebook.com/groups/… link." };
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name || name.length > 200) return { ok: false, error: "Group name is required." };
  const roles = Array.isArray(r.roles) ? r.roles.map(String) : [];
  if (roles.length === 0 || roles.some((x) => !(KC_ROLES as readonly string[]).includes(x))) return { ok: false, error: "Pick the professions this group is for." };
  return { ok: true, value: { id, name, url: `https://www.facebook.com/groups/${id}/`, roles } };
}
