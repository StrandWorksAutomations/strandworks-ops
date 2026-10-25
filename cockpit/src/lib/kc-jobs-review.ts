// Kinetic Clinician recruiter job submissions: types, review validation and the
// preview helpers. Recruiters submit on kineticclinician.com/recruiters/post/;
// rows land in kc_job_submissions as pending. Approve (rpc
// kc_job_submission_review) inserts into kc_posted_jobs, the table /admin/
// publishes to, so the job gets the same ranking and /j/posted/kc/<id>/ page.
export const KC_SITE = "https://kineticclinician.com";
export const KC_ROLE_LABEL: Record<string, string> = { rn: "RN", lpn: "LPN", cna: "CNA", emt: "EMT", paramedic: "Paramedic" };

export type KcSalary = { min: number; max: number; period: string; currency?: string };

export type KcSubmission = {
  id: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  title: string;
  role: string;
  roles: string[];
  employer: string;
  location: string;
  region: string | null;
  employment_type: string | null;
  salary: KcSalary;
  apply_url: string;
  description: string | null;
  recruiter_name: string;
  work_email: string;
  agency_name: string;
  flags: string[];
  reviewed_at: string | null;
  reject_reason: string | null;
  posted_job_id: string | null;
};

export const SUBMISSION_COLUMNS = "id,created_at,status,title,role,roles,employer,location,region,employment_type,salary,apply_url,description,recruiter_name,work_email,agency_name,flags,reviewed_at,reject_reason,posted_job_id";

// What each automatic flag asks the reviewer to check.
export const FLAG_LABEL: Record<string, string> = {
  free_mail: "Personal email address: employer says it hires directly",
  apply_domain_unverified: "Apply link domain doesn't match the employer or a known ATS",
  mlm_language: "MLM / commission-only wording",
  discriminatory_language: "Possibly discriminatory requirement",
  lead_gen_language: "Lead-gen / talent-pool wording",
  links_in_description: "Links or emails in the description",
};

// Canned reasons, matching what /recruiters/ says gets turned down.
export const REJECT_REASONS = [
  "No real pay range, or the pay doesn't match the posting.",
  "MLM, lead generation or a talent-pool post with no actual job.",
  "Couldn't confirm a real employer, or the apply link doesn't go to the employer or its application system.",
  "Discriminatory requirement.",
  "Duplicate of a job already on the site.",
  "The job is closed or the link is dead.",
] as const;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function validateReview(raw: unknown): Result<{ id: string; action: "approve" | "reject"; reason?: string }> {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== "string" || !UUID.test(r.id)) return { ok: false, error: "Unknown submission." };
  if (r.action !== "approve" && r.action !== "reject") return { ok: false, error: "Action must be approve or reject." };
  if (r.action === "approve") return { ok: true, value: { id: r.id, action: "approve" } };
  const reason = typeof r.reason === "string" ? r.reason.trim() : "";
  if (!reason) return { ok: false, error: "Give the recruiter a reason." };
  if (reason.length > 500) return { ok: false, error: "Reason is too long (500 characters)." };
  return { ok: true, value: { id: r.id, action: "reject", reason } };
}

const PERIOD_SHORT: Record<string, string> = { hour: "/hr", day: "/day", shift: "/shift", week: "/wk", month: "/mo", year: "/yr" };

function money(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  return value >= 1000 || Number.isInteger(value) ? Math.round(value).toLocaleString("en-US") : value.toFixed(2).replace(/\.00$/, "");
}

/** Same label the KC board shows (src/lib/job-share.mjs shortPay): "$28–34/hr". */
export function shortPay(salary: KcSalary | null | undefined): string | null {
  if (!salary) return null;
  const lo = money(Number(salary.min));
  const hi = money(Number(salary.max));
  if (!lo && !hi) return null;
  const amount = lo && hi && lo !== hi ? `$${lo}–${hi}` : `$${lo || hi}`;
  return `${amount}${PERIOD_SHORT[salary.period] ?? ""}`;
}

export function postedSharePath(postedJobId: string | null): string | null {
  return postedJobId && /^[a-z0-9]{6,16}$/.test(postedJobId) ? `/j/posted/kc/${postedJobId}/` : null;
}

/** Friendly text for a failed review RPC. */
export function reviewErrorMessage(message: string): string {
  if (/already posted/i.test(message)) return "That apply link is already on the site. Reject it as a duplicate.";
  if (/not pending/i.test(message)) return "Already reviewed. Refresh.";
  if (/needs a reason/i.test(message)) return "Give the recruiter a reason.";
  return "Could not save. Refresh and try again.";
}
