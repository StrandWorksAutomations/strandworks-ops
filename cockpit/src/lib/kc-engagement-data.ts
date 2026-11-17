import "server-only";
import { sbInsert, sbSelect, supabaseConfigured } from "./supabase-rest";
import { ACTION_COLUMNS, EngagementConflictError, ITEM_COLUMNS, type EngagementAction, type EngagementActionInput, type EngagementItem, type EngagementSync } from "./kc-engagement";

export type EngagementData = { items: EngagementItem[]; done: EngagementItem[]; actions: EngagementAction[]; sync: EngagementSync[] };

export async function fetchEngagement(): Promise<EngagementData | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 2 * 86400_000).toISOString());
  try {
    const [items, done, actions, sync] = await Promise.all([
      sbSelect<EngagementItem>("kc_engagement_items", `select=${ITEM_COLUMNS}&status=in.(open,approved,snoozed,failed)&order=commented_at.desc.nullslast&limit=300`),
      sbSelect<EngagementItem>("kc_engagement_items", `select=${ITEM_COLUMNS}&status=in.(sent,dismissed)&order=updated_at.desc&limit=30`),
      sbSelect<EngagementAction>("kc_engagement_actions", `select=${ACTION_COLUMNS}&or=(applied_at.is.null,created_at.gte.${since})&order=id.desc&limit=300`),
      sbSelect<EngagementSync>("kc_engagement_sync", "select=network,connected,last_synced_at,last_error,note&limit=10"),
    ]);
    return { items, done, actions, sync };
  } catch {
    return null;
  }
}

/**
 * Queue the owner's decision for the sync job. Nothing here contacts a social network.
 * The current row is read back first so a stale page cannot act on a changed or closed comment.
 */
export async function queueEngagementAction(v: EngagementActionInput): Promise<void> {
  const [item] = await sbSelect<Pick<EngagementItem, "id" | "status" | "revision">>("kc_engagement_items", `select=id,status,revision&id=eq.${v.id}&limit=1`);
  if (!item) throw new EngagementConflictError("This comment is no longer available. Refresh the page.");
  if (item.status === "sent" || item.status === "dismissed") throw new EngagementConflictError(`This comment is already ${item.status}. Refresh the page.`);
  if (item.revision !== v.revision) throw new EngagementConflictError("This comment changed since the page loaded. Refresh and try again.");
  await sbInsert("kc_engagement_actions", { item_id: v.id, action: v.action, base_revision: v.revision, draft: v.draft ?? null, snooze_until: v.snooze_until ?? null });
}
