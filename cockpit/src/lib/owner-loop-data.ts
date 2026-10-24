// Server-only I/O for the owner loop. Only server pages import this module;
// client cards receive display props and send rulings through /api/loop/rule.
// Select public display fields explicitly: never send dedupe or host/session
// metadata to the browser. The service key stays in supabase-rest.ts.
import "server-only";
import { sbSelect, supabaseConfigured } from "./supabase-rest";
import type { OwnerLoopItem, OwnerLoopEvent } from "./owner-loop";

const PAGE_SIZE = 200;
const ITEM_FIELDS = [
  "id", "ref", "kind", "project", "title", "body", "options", "recommended",
  "origin_agent", "due_at", "status", "ruling", "ruling_note", "ruled_via",
  "ruled_at", "picked_up_at", "picked_up_by", "outcome_note", "done_at",
  "repeat_count", "created_at", "updated_at",
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
      `select=${ITEM_FIELDS}&or=(status.in.(open,ruled,picked_up),updated_at.gte.${since})` +
        "&order=created_at.asc,id.asc"
    );
  } catch {
    return null;
  }
}

export async function fetchOwnerLoopEvents(): Promise<OwnerLoopEvent[] | null> {
  if (!supabaseConfigured()) return null;
  const since = encodeURIComponent(new Date(Date.now() - 30 * 86400_000).toISOString());
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
