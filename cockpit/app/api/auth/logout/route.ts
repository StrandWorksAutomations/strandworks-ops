import { NextRequest, NextResponse } from "next/server";
import { cookieNames } from "@/lib/session";

export async function POST(req: NextRequest) {
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  const res = NextResponse.redirect(login, 303);
  res.cookies.delete(cookieNames.session);
  return res;
}
