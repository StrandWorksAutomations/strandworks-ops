import "server-only";
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import { BUSINESSES } from "./businesses";
import type { IntakeItem, IntakeReview } from "./intake";

const FIELDS = "id,account,received_at,from_addr,from_name,subject,snippet,body_text,status,category,business,priority,summary,action_needed,due_at,draft_reply,reply_status,reply_error,archive_requested,archived_at";
const PAGE_SIZE = 200;
async function readAll<T>(table: string, query: string): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const rows = await sbSelect<T>(table, `${query}&limit=${PAGE_SIZE}&offset=${offset}`);
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
}

export async function fetchIntake(): Promise<{ items: IntakeItem[]; linkCounts: Record<string, number> } | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 7 * 86400_000).toISOString());
  try {
    const items = await readAll<IntakeItem>("intake_items", `select=${FIELDS}&or=(status.eq.review,reply_status.in.(approved,failed),received_at.gte.${since})&order=received_at.desc,id.desc`);
    const jobIds = items.filter((item) => item.category === "job_alert").map((item) => item.id);
    const linkCounts: Record<string, number> = {};
    for (let start = 0; start < jobIds.length; start += 100) {
      const ids = jobIds.slice(start, start + 100);
      const links = await readAll<{ item_id: string; url: string }>("intake_job_links", `select=item_id,url&item_id=in.(${ids.join(",")})&order=item_id.asc,url.asc`);
      for (const link of links) linkCounts[link.item_id] = (linkCounts[link.item_id] ?? 0) + 1;
    }
    return { items, linkCounts };
  } catch {
    return null;
  }
}

// Board reads exclude bodies/drafts. Latest activity has no seven-day cutoff.
export async function fetchIntakeOverview(): Promise<{
  reviews: IntakeReview[]; latest: { business: string; received_at: string }[];
} | null> {
  if (!supabaseConfigured()) return null;
  try {
    const [reviews, latest] = await Promise.all([
      readAll<IntakeReview>("intake_items", "select=id,business,status,priority,received_at,subject,from_name,from_addr,summary,action_needed,due_at&status=eq.review&order=received_at.desc,id.desc"),
      Promise.all(BUSINESSES.map((business) => sbSelect<{ business: string; received_at: string }>(
        "intake_items", `select=business,received_at&business=eq.${business.key}&order=received_at.desc,id.desc&limit=1`,
      ))),
    ]);
    return { reviews, latest: latest.flat() };
  } catch {
    return null;
  }
}
