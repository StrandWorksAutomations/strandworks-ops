// Mark a Kinetic Clinician group draft as posted (Jonathan posted it by hand) or skipped.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { validateDraftMark } from "@/lib/kc-share";
import { sbRpc } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = validateDraftMark(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await sbRpc("kc_group_draft_mark", { p_id: parsed.value.id, p_status: parsed.value.status, p_reason: parsed.value.reason ?? null });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save. The draft may already be closed; refresh." }, { status: 502 });
  }
}
