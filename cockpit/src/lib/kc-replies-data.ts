import "server-only";
import { sbInsert, sbSelect, sbUpdate, supabaseConfigured } from "./supabase-rest";
import { REPLY_COLUMNS, type KcGroup, type KcPagePost, type KcReply, type KcReplyAction, type PagePostAction, type ReplyActionInput } from "./kc-replies";

export type RepliesData = { replies: KcReply[]; actions: KcReplyAction[]; groups: KcGroup[]; pagePosts: KcPagePost[] };

export async function fetchReplies(): Promise<RepliesData | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 2 * 86400_000).toISOString());
  try {
    const [replies, actions, groups, pagePosts] = await Promise.all([
      sbSelect<KcReply>("kc_fb_replies", `select=${REPLY_COLUMNS}&order=created_at.desc&limit=200`),
      sbSelect<KcReplyAction>("kc_fb_reply_actions", `select=id,item_id,action,created_at,applied_at,result,snooze_until&created_at=gte.${since}&order=id.desc&limit=200`),
      sbSelect<KcGroup>("kc_fb_groups", "select=id,name,meta,lane,status,url,stats&order=name.asc&limit=200").catch(() => []),
      sbSelect<KcPagePost>("kc_fb_page_posts", "select=id,draft,links,status,created_at&order=id.desc&limit=2").catch(() => []),
    ]);
    return { replies, actions, groups, pagePosts };
  } catch {
    return null;
  }
}

export async function queueReplyAction(v: ReplyActionInput): Promise<void> {
  await sbInsert("kc_fb_reply_actions", { item_id: v.id, action: v.action, base_revision: v.revision, draft: v.draft ?? null,
    reason: v.reason ?? null, snooze_until: v.snooze_until ?? null });
}

/** The weekly Page post lives only in the dashboard; nothing on the Mac posts it. */
export async function updatePagePost(v: { id: string; action: PagePostAction; draft?: string }): Promise<void> {
  const status = { save: undefined, approve: "approved", posted: "posted", dismiss: "dismissed" }[v.action];
  await sbUpdate("kc_fb_page_posts", `id=eq.${v.id}`, { ...(v.draft ? { draft: v.draft } : {}), ...(status ? { status } : {}), updated_at: new Date().toISOString() });
}

/** The owner joined a group by hand; the Mac moves it onto the scan list on its next sync. */
export async function queueGroupJoined(groupId: string): Promise<void> {
  await sbInsert("kc_fb_group_actions", { group_id: groupId, action: "joined" });
}

/** Replies waiting for the owner, for the Today board; null when unavailable. */
export async function countRepliesToReview(): Promise<number | null> {
  if (!supabaseConfigured()) return null;
  try {
    const [open, closing] = await Promise.all([
      sbSelect<{ id: string; snoozed_until: string | null }>("kc_fb_replies", "select=id,snoozed_until&status=in.(needs_review,needs_context,approved)&delivery_state=is.null&limit=200"),
      sbSelect<{ item_id: string }>("kc_fb_reply_actions", "select=item_id&applied_at=is.null&action=in.(dismiss,posted,snooze)&limit=200"),
    ]);
    const closed = new Set(closing.map((a) => a.item_id));
    const now = Date.now();
    return open.filter((r) => !closed.has(r.id) && !(r.snoozed_until && Date.parse(r.snoozed_until) > now)).length;
  } catch {
    return null;
  }
}
