import { NextRequest, NextResponse } from "next/server";
import { authOpenUntil, cookieNames, createSessionToken, hasOwnerSession, matchesBrowserOrigin, sessionCookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!matchesBrowserOrigin(req)) return new NextResponse(null, { status: 403, headers });
  if (req.cookies.has(cookieNames.locked)) return new NextResponse(null, { status: 401, headers });
  if (!await hasOwnerSession(req.cookies.get(cookieNames.session)?.value)) {
    return new NextResponse(null, { status: authOpenUntil() === null ? 401 : 204, headers });
  }
  const res = new NextResponse(null, { status: 204, headers });
  res.cookies.set(cookieNames.session, await createSessionToken(), sessionCookieOptions());
  return res;
}
