// Business-register write endpoint (one row, allow-listed columns). Middleware
// already requires the owner's WebAuthn session for every /api route except
// /api/auth/*. The database RPC re-checks the allow-list, so a bad column is
// rejected twice.
import { NextRequest, NextResponse } from "next/server";
import { sbRpc, supabaseConfigured } from "@/lib/supabase-rest";
import { BusinessEditError, isUuid, sanitizePatch } from "@/lib/business-edit";

export async function POST(req: NextRequest) {
  let body: { table?: unknown; id?: unknown; patch?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!isUuid(body.id)) return NextResponse.json({ error: "id must be a uuid" }, { status: 400 });
  if (!supabaseConfigured()) return NextResponse.json({ error: "business register backend not configured" }, { status: 503 });

  try {
    const { spec, patch } = sanitizePatch(body.table, body.patch);
    const result = await sbRpc<{ ok: boolean }>("admin_update_row", { p_table: spec.table, p_id: body.id, p_patch: patch });
    return NextResponse.json({ ...result, fields: Object.keys(patch) });
  } catch (e) {
    if (e instanceof BusinessEditError) return NextResponse.json({ error: e.message }, { status: 422 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "write failed" }, { status: 502 });
  }
}
