import { NextRequest, NextResponse } from "next/server";
import { REPLY_INSTRUCTIONS_MAX, type ReplyInstructions } from "@/lib/reply-instructions";
import { cookieNames, matchesBrowserOrigin, verifySessionToken } from "@/lib/session";
import { sbRpc, sbSelect } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });

async function owner(req: NextRequest) {
  return !req.cookies.has(cookieNames.locked) && await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
}

export async function GET(req: NextRequest) {
  if (!await owner(req)) return json({ error: "Sign in to see your reply instructions." }, 401);
  try {
    const [settings] = await sbSelect<ReplyInstructions>("kc_fb_reply_voice_settings", "select=instructions,updated_at&id=eq.global&limit=1");
    return json(settings ?? { instructions: "", updated_at: null });
  } catch {
    return json({ error: "Couldn’t load your reply instructions. Try again." }, 502);
  }
}

export async function POST(req: NextRequest) {
  if (!await owner(req)) return json({ error: "Sign in to save your reply instructions." }, 401);
  if (!matchesBrowserOrigin(req)) return json({ error: "Save your instructions from the dashboard." }, 403);
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json({ error: "Send the instructions as JSON." }, 415);
  const body = await req.json().catch(() => null);
  if (typeof body?.instructions !== "string" || body.instructions.length > REPLY_INSTRUCTIONS_MAX || body.instructions.includes("\u0000")) {
    return json({ error: `Enter up to ${REPLY_INSTRUCTIONS_MAX} characters.` }, 400);
  }
  const version = body.expected_updated_at;
  if (version !== null && (typeof version !== "string" || !Number.isFinite(Date.parse(version)))) return json({ error: "Reload your instructions and try again." }, 400);
  try {
    const [settings] = await sbRpc<ReplyInstructions[]>("kc_save_fb_reply_voice_settings", {
      p_instructions: body.instructions.trim() ? body.instructions : "", p_expected_updated_at: version,
    });
    if (!settings) return json({ error: "Your instructions changed in another window. Reload the saved instructions to see the latest version." }, 409);
    return json({ instructions: settings.instructions, updated_at: settings.updated_at });
  } catch {
    return json({ error: "Couldn’t confirm the save. Try again." }, 502);
  }
}
