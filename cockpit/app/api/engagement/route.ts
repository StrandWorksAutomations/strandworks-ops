// Queue an owner action on a comment from any network. tools/engagement/sync.mjs
// applies it on its next run; nothing here posts to a social network.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { EngagementConflictError, validateEngagementAction } from "@/lib/kc-engagement";
import { queueEngagementAction } from "@/lib/kc-engagement-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = validateEngagementAction(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await queueEngagementAction(parsed.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EngagementConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: "Couldn't save that. Try again." }, { status: 502 });
  }
}
