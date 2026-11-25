import { NextRequest, NextResponse } from "next/server";
import { cookieNames, matchesBrowserOrigin, sessionCookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if ((site && site !== "same-origin") || (origin && origin !== "null" && !matchesBrowserOrigin(req))) {
    return new NextResponse(null, { status: 403 });
  }
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  const res = NextResponse.redirect(login, 303);
  res.cookies.delete(cookieNames.session);
  // A delayed activity response from another tab cannot undo an explicit lock.
  res.cookies.set(cookieNames.locked, "1", sessionCookieOptions());
  return res;
}
