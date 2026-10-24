import "server-only";
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import type { KcDraft, KcGroup } from "./kc-share";

export async function fetchKcShare(): Promise<{ groups: KcGroup[]; drafts: KcDraft[] } | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 14 * 86400_000).toISOString());
  try {
    const [groups, drafts] = await Promise.all([
      sbSelect<KcGroup>("kc_job_groups", "select=id,name,url,roles,employment_types,regions,allows_job_posts,rules_note,rules_checked_on,weekly_cap,min_days_between,active&order=name.asc"),
      sbSelect<KcDraft>("kc_group_post_drafts", `select=id,group_id,job_title,job_role,job_region,pay_label,share_url,body,status,skip_reason,created_at,posted_at&or=(status.eq.ready,created_at.gte.${since})&order=created_at.desc&limit=200`),
    ]);
    return { groups, drafts };
  } catch {
    return null;
  }
}
