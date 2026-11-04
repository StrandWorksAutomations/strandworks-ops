// Server-only I/O for the owner loop. Only server pages import this module;
// client cards receive display props and send rulings through /api/loop/rule.
// Select public display fields explicitly: never send dedupe or host/session
// metadata to the browser. The service key stays in supabase-rest.ts.
import "server-only";
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import type { OwnerLoopItem, OwnerLoopEvent, OwnerLoopResponse } from "./owner-loop";
import { BUSINESSES } from "./businesses";

const PAGE_SIZE = 200;
const ITEM_FIELDS = [
  "id", "ref", "kind", "project", "title", "body", "options", "recommended",
  "origin_agent", "due_at", "status", "ruling", "ruling_note", "ruled_via",
  "ruled_at", "picked_up_at", "picked_up_by", "outcome_note", "done_at",
  "repeat_count", "created_at", "updated_at", "saved_at", "archived_at", "deleted_at", "brief_slug", "origin_cwd",
].join(",");

async function readAll<T>(table: string, query: string): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const rows = await sbSelect<T>(table, `${query}&limit=${PAGE_SIZE}&offset=${offset}`);
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
}

// null means unavailable, distinct from an empty queue. Recent closed rows
// use updated_at here; pure grouping applies the actual completion date.
export async function fetchOwnerLoopItems(): Promise<OwnerLoopItem[] | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 14 * 86400_000).toISOString());
  try {
    return await readAll<OwnerLoopItem>(
      "owner_loop_items",
      `select=${ITEM_FIELDS}&archived_at=is.null&deleted_at=is.null&or=(status.in.(open,ruled,picked_up),updated_at.gte.${since})` +
        "&order=created_at.asc,id.asc"
    );
  } catch {
    return null;
  }
}

export async function fetchOwnerLoopItem(ref: string): Promise<OwnerLoopItem | null> {
  const rows = await sbSelect<OwnerLoopItem>("owner_loop_items", `select=${ITEM_FIELDS}&ref=eq.${encodeURIComponent(ref)}&limit=1`);
  return rows[0] ?? null;
}

export async function fetchArchivedItems(): Promise<OwnerLoopItem[] | null> {
  if (!supabaseConfigured()) return null;
  try {
    return await readAll<OwnerLoopItem>("owner_loop_items",
      `select=${ITEM_FIELDS}&or=(archived_at.not.is.null,deleted_at.not.is.null)&order=updated_at.desc,id.desc`);
  } catch {
    return null;
  }
}

export async function fetchItemEvents(itemId: string): Promise<OwnerLoopEvent[]> {
  return sbSelect<OwnerLoopEvent>("owner_loop_events", `select=id,item_id,at,actor,type,note&item_id=eq.${itemId}&order=at.desc,id.desc&limit=100`);
}

export async function fetchItemResponses(itemId: string): Promise<OwnerLoopResponse[]> {
  return sbSelect<OwnerLoopResponse>("owner_loop_responses",
    "select=id,option_key,body,urgent,created_at,linear_issue_key,linear_issue_url,linear_synced_at,linear_error,dispatch_state,dispatch_target,dispatch_note,dispatch_at" +
    `&item_id=eq.${itemId}&order=created_at.desc`);
}

export async function fetchOwnerLoopEvents(days = 30): Promise<OwnerLoopEvent[] | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - days * 86400_000).toISOString());
  try {
    return await readAll<OwnerLoopEvent>(
      "owner_loop_events",
      "select=id,item_id,at,actor,type,note,item:owner_loop_items(ref,title,project)" +
        `&at=gte.${since}&order=at.desc,id.desc`
    );
  } catch {
    return null;
  }
}

// The board needs the latest event even when it predates Timeline's 30 days.
export async function fetchBusinessLatestEvents(): Promise<OwnerLoopEvent[] | null> {
  if (!supabaseConfigured()) return null;
  try {
    const rows = await Promise.all(BUSINESSES.filter((business) => business.projects.length).map((business) =>
      sbSelect<OwnerLoopEvent>("owner_loop_events",
        "select=id,item_id,at,actor,type,note,item:owner_loop_items!inner(ref,title,project)" +
        `&item.project=in.(${business.projects.map(encodeURIComponent).join(",")})&order=at.desc,id.desc&limit=1`),
    ));
    return rows.flat();
  } catch {
    return null;
  }
}
