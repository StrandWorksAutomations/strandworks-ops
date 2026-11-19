import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { isCurrentReview, validateClearOlder } from "@/lib/intake";
import { sbRpc, sbSelect } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

// Marks older review emails as handled on the dashboard without touching
// Gmail (the same "Keep in inbox" action as the single-email button). Each ID
// is re-read first, so only emails still in review and past the current
// window are cleared.
export async function POST(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const parsed = validateClearOlder(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const now = new Date();
    const eligible: string[] = [];
    for (let start = 0; start < parsed.ids.length; start += 50) {
      const rows = await sbSelect<{ id: string; received_at: string; due_at: string | null }>("intake_items",
        `select=id,received_at,due_at&status=eq.review&id=in.(${parsed.ids.slice(start, start + 50).join(",")})&limit=50`);
      eligible.push(...rows.filter((row) => !isCurrentReview(row, now)).map((row) => row.id));
    }
    let cleared = 0;
    let failed = 0;
    for (let start = 0; start < eligible.length; start += 10) {
      const results = await Promise.allSettled(eligible.slice(start, start + 10).map((id) =>
        sbRpc("intake_owner_action", { p_id: id, p_action: "keep_in_inbox", p_reply: null })));
      for (const result of results) result.status === "fulfilled" ? cleared++ : failed++;
    }
    return NextResponse.json({ ok: true, cleared, failed });
  } catch {
    return NextResponse.json({ error: "Could not clear older emails. Refresh and try again." }, { status: 502 });
  }
}
