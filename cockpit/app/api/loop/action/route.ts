// Save, archive, delete, restore, close and edit. Agents never reach this path.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { OWNER_ACTIONS, type OwnerAction } from "@/lib/owner-loop";
import { sbRpc } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let raw: { ref?: unknown; action?: unknown; title?: unknown; due_at?: unknown };
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (typeof raw.ref !== "string" || !/^D-\d{4,}$/.test(raw.ref)) return NextResponse.json({ error: "Ref must look like D-0001." }, { status: 400 });
  if (!OWNER_ACTIONS.includes(raw.action as OwnerAction)) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const args: Record<string, string | null> = {};
  if (raw.action === "edit") {
    if (raw.title !== undefined) {
      if (typeof raw.title !== "string" || !raw.title.trim() || raw.title.length > 300) return NextResponse.json({ error: "Title must contain 1–300 characters." }, { status: 400 });
      args.title = raw.title.trim();
    }
    if (raw.due_at !== undefined) {
      if (raw.due_at !== null && (typeof raw.due_at !== "string" || !Number.isFinite(Date.parse(raw.due_at)))) return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
      args.due_at = raw.due_at as string | null;
    }
  }
  try {
    await sbRpc("owner_loop_owner_action", { p_ref: raw.ref, p_action: raw.action, p_args: args });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "That did not save. Try again." }, { status: 502 });
  }
}
