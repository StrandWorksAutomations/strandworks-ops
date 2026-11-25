import { sbSelect } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

// The public site rewrites /r/<code> here. Never accept a destination from a request.
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const unavailable = (status: number) => new Response(status === 503 ? "Please try this link again shortly." : "Link not found.", {
    status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
  if (!/^[0-9a-f]{10,64}$/.test(code)) return unavailable(404);
  try {
    const [row] = await sbSelect<{ destination: string }>("kc_reply_short_links", `select=destination&code=eq.${code}&limit=1`);
    if (!row) return unavailable(404);
    const url = new URL(row.destination);
    if (url.origin !== "https://kineticclinician.com" || url.username || url.password ||
        !/^\/(?:j|jobs|employers|training|resources|pathways|nurse|ems|calculator|[a-z]{2})(?:\/|$)/.test(url.pathname)) return unavailable(404);
    return new Response(null, { status: 302, headers: { Location: url.href, "Cache-Control": "public, max-age=3600" } });
  } catch {
    return unavailable(503);
  }
}
