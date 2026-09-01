// Business-register insert endpoint. Owner-session gated by middleware; the
// allow-list of insertable tables lives in the database RPC as well.
import { NextRequest, NextResponse } from "next/server";
import { sbRpc, supabaseConfigured } from "@/lib/supabase-rest";
import { BusinessEditError, sanitizeInsert } from "@/lib/business-edit";

export async function POST(req: NextRequest) {
  let body: { table?: unknown; row?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!supabaseConfigured()) return NextResponse.json({ error: "business register backend not configured" }, { status: 503 });

  try {
    const { spec, row } = sanitizeInsert(body.table, body.row);
    const result = await sbRpc<{ ok: boolean; id: string }>("admin_insert_row", { p_table: spec.table, p_row: row });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof BusinessEditError) return NextResponse.json({ error: e.message }, { status: 422 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "write failed" }, { status: 502 });
  }
}
