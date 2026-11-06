import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { classifyBridgeStatus, readBridgeHeartbeat, unavailableBridgeStatus } from "@/lib/dashboard-bridge-status";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", Vary: "Cookie" } });
}
export async function GET(req: NextRequest) {
  if (!(await verifySessionToken(req.cookies.get(cookieNames.session)?.value))) return json({ error: "unauthenticated" }, 401);
  try { return json(classifyBridgeStatus(await readBridgeHeartbeat())); }
  catch { return json(unavailableBridgeStatus(), 503); }
}
