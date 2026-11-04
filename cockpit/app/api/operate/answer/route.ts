import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  return NextResponse.json(
    { error: "This answer route has been retired. Open Decide to record a ruling.", href: "/decisions" },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
