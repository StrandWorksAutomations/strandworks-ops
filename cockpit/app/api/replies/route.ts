// Queue an owner action on a Facebook reply draft. The Mac applies it on its
// next sync (page_api.py run, every 15 minutes); nothing here posts.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { validateReplyAction } from "@/lib/kc-replies";
import { queueReplyAction } from "@/lib/kc-replies-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = validateReplyAction(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await queueReplyAction(parsed.value);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't save that. Try again." }, { status: 502 });
  }
}
