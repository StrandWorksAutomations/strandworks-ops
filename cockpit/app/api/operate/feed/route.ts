// Live snapshot for the Operate page. Middleware already requires an owner
// session for every /api route except /api/auth/*; we re-check here so the
// endpoint is self-contained and unit-testable. Read-only.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { getOperateSnapshot } from "@/lib/operate-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const snapshot = await getOperateSnapshot();
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "snapshot failed" },
      { status: 502 }
    );
  }
}
