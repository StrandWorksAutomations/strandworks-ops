import "server-only";
import { sbInsert, sbSelect, sbUpdate, supabaseConfigured } from "./supabase-rest";
import { REPLY_COLUMNS, ReplyAccessError, facebookGroupId, isManual, pageAccessReady, replyGroupIds, replyPageAccess, type KcGroup, type KcPagePost, type KcReply, type KcReplyAction, type PagePostAction, type ReplyActionInput } from "./kc-replies";

export type RepliesData = { replies: KcReply[]; actions: KcReplyAction[]; groups: KcGroup[]; pagePosts: KcPagePost[] };

export async function fetchReplies(): Promise<RepliesData | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 2 * 86400_000).toISOString());
  try {
    const [replies, actions, groups, pagePosts] = await Promise.all([
      sbSelect<KcReply>("kc_fb_replies", `select=${REPLY_COLUMNS}&order=created_at.desc&limit=200`),
      sbSelect<KcReplyAction>("kc_fb_reply_actions", `select=id,item_id,action,created_at,applied_at,result,snooze_until&created_at=gte.${since}&order=id.desc&limit=200`),
      sbSelect<KcGroup>("kc_fb_groups", "select=id,name,meta,lane,status,url,stats&order=name.asc&limit=1000").catch(() => []),
      sbSelect<KcPagePost>("kc_fb_page_posts", "select=id,draft,links,status,created_at&order=id.desc&limit=2").catch(() => []),
    ]);
    return { replies, actions, groups, pagePosts };
  } catch {
    return null;
  }
}

export async function queueReplyAction(v: ReplyActionInput): Promise<void> {
  if (v.action === "approve" || v.action === "posted") {
    const [reply] = await sbSelect<KcReply>("kc_fb_replies", `select=${REPLY_COLUMNS}&id=eq.${v.id}&limit=1`);
    if (!reply) throw new ReplyAccessError("This reply is no longer available. Refresh the page.");
    if (isManual(reply)) {
      const groupId = facebookGroupId(reply.source_url);
      // Facebook may use a numeric ID in permalinks even when the saved group
      // uses its readable slug. Match only IDs/aliases from the synced list.
      const groups = groupId ? await sbSelect<KcGroup>("kc_fb_groups", "select=id,stats&limit=1000") : [];
      if (!pageAccessReady(replyPageAccess(reply, groups), groupId, replyGroupIds(reply, groups))) {
        throw new ReplyAccessError("Kinetic Clinician's access to comment in this group has not been confirmed. The existing draft is preserved; check the group's Page access first.");
      }
    }
  }
  await sbInsert("kc_fb_reply_actions", { item_id: v.id, action: v.action, base_revision: v.revision, draft: v.draft ?? null,
    reason: v.reason ?? null, snooze_until: v.snooze_until ?? null });
}

/** The weekly Page post lives only in the dashboard; nothing on the Mac posts it. */
export async function updatePagePost(v: { id: string; action: PagePostAction; draft?: string }): Promise<void> {
  const status = { save: undefined, approve: "approved", posted: "posted", dismiss: "dismissed" }[v.action];
  await sbUpdate("kc_fb_page_posts", `id=eq.${v.id}`, { ...(v.draft ? { draft: v.draft } : {}), ...(status ? { status } : {}), updated_at: new Date().toISOString() });
}

/** Add the group to the scan list. This is never a claim about Page membership or commenting. */
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
