// The owner joined a Facebook group by hand: queue it for the scan list.
// The Mac applies it on its next sync; nothing here touches Facebook.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { validateGroupJoined } from "@/lib/kc-replies";
import { queueGroupJoined } from "@/lib/kc-replies-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = validateGroupJoined(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await queueGroupJoined(parsed.value.group_id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't save that. Try again." }, { status: 502 });
  }
}
