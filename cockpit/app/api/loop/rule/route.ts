// Owner-loop rulings are written server-side with the service role. Middleware
// protects this path; recheck the owner's session before invoking the RPC too.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { validateOwnerLoopRuleInput } from "@/lib/owner-loop";
import { sbRpc } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = validateOwnerLoopRuleInput(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await sbRpc("owner_loop_rule", {
      p_ref: parsed.value.ref,
      p_ruling: parsed.value.ruling,
      p_note: parsed.value.note ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    // PostgREST errors can include database details; keep them server-side.
    return NextResponse.json({ error: "Unable to save ruling. Try again." }, { status: 502 });
  }
}
