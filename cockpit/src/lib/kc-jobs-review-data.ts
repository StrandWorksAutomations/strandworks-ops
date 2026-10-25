import "server-only";
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import { SUBMISSION_COLUMNS, type KcSubmission } from "./kc-jobs-review";

export async function fetchJobSubmissions(): Promise<{ pending: KcSubmission[]; recent: KcSubmission[] } | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 14 * 86400_000).toISOString());
  try {
    const [pending, recent] = await Promise.all([
      sbSelect<KcSubmission>("kc_job_submissions", `select=${SUBMISSION_COLUMNS}&status=eq.pending&order=created_at.asc&limit=100`),
      sbSelect<KcSubmission>("kc_job_submissions", `select=${SUBMISSION_COLUMNS}&status=neq.pending&reviewed_at=gte.${since}&order=reviewed_at.desc&limit=30`),
    ]);
    return { pending, recent };
  } catch {
    return null;
  }
}

/** Pending count for the Today board; null when unavailable. */
export async function countPendingJobSubmissions(): Promise<number | null> {
  if (!supabaseConfigured()) return null;
  try {
    return (await sbSelect<{ id: string }>("kc_job_submissions", "select=id&status=eq.pending&limit=100")).length;
  } catch {
    return null;
  }
}
