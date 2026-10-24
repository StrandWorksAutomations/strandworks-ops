import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { validateIntakeAction } from "@/lib/intake";
import { sbRpc } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const parsed = validateIntakeAction(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await sbRpc("intake_owner_action", {
      p_id: parsed.value.id, p_action: parsed.value.action, p_reply: parsed.value.reply ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save email action. Refresh and try again." }, { status: 502 });
  }
}
