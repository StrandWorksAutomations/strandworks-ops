import "server-only";
import { sbInsert, sbSelect, supabaseConfigured } from "./supabase-rest";
import { REPLY_COLUMNS, type KcReply, type KcReplyAction, type ReplyActionKind } from "./kc-replies";

export async function fetchReplies(): Promise<{ replies: KcReply[]; actions: KcReplyAction[] } | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 2 * 86400_000).toISOString());
  try {
    const [replies, actions] = await Promise.all([
      sbSelect<KcReply>("kc_fb_replies", `select=${REPLY_COLUMNS}&order=created_at.desc&limit=200`),
      sbSelect<KcReplyAction>("kc_fb_reply_actions", `select=id,item_id,action,created_at,applied_at,result&created_at=gte.${since}&order=id.desc&limit=200`),
    ]);
    return { replies, actions };
  } catch {
    return null;
  }
}

export async function queueReplyAction(v: { id: string; action: ReplyActionKind; revision: number; draft?: string }): Promise<void> {
  await sbInsert("kc_fb_reply_actions", { item_id: v.id, action: v.action, base_revision: v.revision, draft: v.draft ?? null });
}

/** Replies waiting for the owner, for the Today board; null when unavailable. */
export async function countRepliesToReview(): Promise<number | null> {
  if (!supabaseConfigured()) return null;
  try {
    return (await sbSelect<{ id: string }>("kc_fb_replies", "select=id&status=in.(needs_review,needs_context,approved)&delivery_state=is.null&limit=200")).length;
  } catch {
    return null;
  }
}
