import "server-only";
// One count per queue that waits on the owner, so Overview can show every
// place needing attention in a single row. A null count means the source was
// unavailable, never zero.
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import { isCurrentReview } from "./intake";
import { countPendingJobSubmissions } from "./kc-jobs-review-data";
import { countRepliesToReview } from "./kc-replies-data";
import { fetchEngagement } from "./kc-engagement-data";
import { bucketOf } from "./kc-engagement";
import type { NeedsYouQueue } from "./operate";

async function countCurrentReviewEmails(now: Date): Promise<number | null> {
  if (!supabaseConfigured()) return null;
  try {
    let count = 0;
    for (let offset = 0; ; offset += 500) {
      const rows = await sbSelect<{ received_at: string; due_at: string | null }>("intake_items",
        `select=received_at,due_at&status=eq.review&order=received_at.desc,id.desc&limit=500&offset=${offset}`);
      count += rows.filter((row) => isCurrentReview(row, now)).length;
      if (rows.length < 500) return count;
    }
  } catch {
    return null;
  }
}

async function countWaitingComments(now: Date): Promise<number | null> {
  const data = await fetchEngagement();
  if (!data) return null;
  return data.items.filter((item) => ["open", "approved"].includes(bucketOf(item, data.actions, now.getTime()))).length;
}

async function countReadyPosts(): Promise<number | null> {
  if (!supabaseConfigured()) return null;
  try {
    return (await sbSelect<{ id: string }>("kc_group_post_drafts", "select=id&status=eq.ready&limit=200")).length;
  } catch {
    return null;
  }
}

export async function getNeedsYouQueues(decisions: number | null, now: Date): Promise<NeedsYouQueue[]> {
  const [emails, jobs, replies, comments, posts] = await Promise.all([
    countCurrentReviewEmails(now), countPendingJobSubmissions(), countRepliesToReview(), countWaitingComments(now), countReadyPosts(),
  ]);
  return [
    { key: "decisions", label: "Decisions", href: "/decisions", count: decisions },
    { key: "email", label: "Emails", href: "/inbox", count: emails },
    { key: "jobs", label: "Jobs to review", href: "/jobs-review", count: jobs },
    { key: "replies", label: "Replies", href: "/replies", count: replies },
    { key: "comments", label: "Comments", href: "/engagement", count: comments },
    { key: "posts", label: "Posts to share", href: "/share", count: posts },
  ];
}
