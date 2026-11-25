// Every route is authenticated (SPEC slice 1, item 2). The exact machine relay
// POST authenticates its revocable agent token in its handler; browser routes
// continue to require the owner's session.
import { NextRequest, NextResponse } from "next/server";
import { authOpenUntil, hasOwnerSession, createSessionToken, matchesBrowserOrigin, cookieNames, sessionCookieOptions } from "@/lib/session";

const PUBLIC_PATHS = [/^\/login$/, /^\/setup$/, /^\/api\/auth\//];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) return NextResponse.next();
  if ((req.method === "GET" || req.method === "HEAD") && /^\/r\/[0-9a-f]{10,64}$/.test(pathname)) return NextResponse.next();
  if (["/api/loop/agent", "/api/loop/agent/heartbeat", "/api/loop/batches/agent"].includes(pathname) && req.method === "POST") return NextResponse.next();

  // Dev-only bridge: `?dev-session=<HMAC-signed token>` sets the session
  // cookie so the owner can open the local cockpit straight from a terminal.
  // Hard-guarded out of production, and the token must verify against the
  // same HMAC as any session — this adds no new trust, only a delivery path.
  if (process.env.NODE_ENV !== "production") {
    const t = req.nextUrl.searchParams.get("dev-session");
    if (t && (await hasOwnerSession(t))) {
      const clean = req.nextUrl.clone();
      clean.searchParams.delete("dev-session");
      const res = NextResponse.redirect(clean);
      // Lax (not Strict) on purpose: this dev bridge exists to be opened from
      // a clicked link that originates off-site (a terminal, a chat). A Strict
      // cookie set during that redirect is withheld by the browser on the
      // immediate follow, bouncing the owner back to the passkey page. Lax is
      // sent on top-level GET navigations, so the clicked link authenticates.
      // Dev-only path (hard-guarded above); production sessions are unaffected.
      res.cookies.set(cookieNames.session, t, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
      res.cookies.delete(cookieNames.locked);
      return res;
    }
  }

  if (!req.cookies.has(cookieNames.locked)) {
    if (await hasOwnerSession(req.cookies.get(cookieNames.session)?.value)) {
      const response = NextResponse.next();
      // Existing dashboard tabs also renew on deliberate navigation and owner edits.
      // Background reads, Next prefetches and the agent relays do not renew cookies.
      const navigation = req.method === "GET" && req.headers.get("sec-fetch-mode") === "navigate" && req.headers.get("sec-fetch-user") === "?1";
      const ownerEdit = req.method === "POST" && pathname.startsWith("/api/") && matchesBrowserOrigin(req);
      if (navigation || ownerEdit) response.cookies.set(cookieNames.session, await createSessionToken(), sessionCookieOptions());
      return response;
    }
    if (authOpenUntil() !== null) return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
