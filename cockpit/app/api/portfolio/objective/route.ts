// Owner edits to an objective's review and delivery dates.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { sbUpdate } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let raw: { id?: unknown; review_at?: unknown; target_at?: unknown };
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (typeof raw.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(raw.id)) return NextResponse.json({ error: "Unknown objective." }, { status: 400 });
  const patch: Record<string, string> = {};
  for (const field of ["review_at", "target_at"] as const) {
    const value = raw[field];
    if (value === undefined) continue;
    if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
    patch[field] = new Date(value).toISOString();
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  try {
    const rows = await sbUpdate<{ id: string }>("portfolio_objectives", `id=eq.${raw.id}`, { ...patch, updated_at: new Date().toISOString() });
    if (!rows.length) return NextResponse.json({ error: "Unknown objective." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "That did not save. Try again." }, { status: 502 });
  }
}
