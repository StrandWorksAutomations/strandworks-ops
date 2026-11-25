import { NextRequest, NextResponse } from "next/server";
import { DRAFT_MAX } from "@/lib/kc-replies";
import { editedReply, isCorrectionReason, type CorrectionReason } from "@/lib/reply-feedback";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { sbRpc, sbSelect } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type Example = { prepared_reply: string; posted_reply: string; updated_at: string; correction_reason: CorrectionReason | null };
type Receipt = Pick<Example, "posted_reply" | "updated_at">;
const itemId = /^(?:[0-9a-f]{24}|manual-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) return json({ error: "Sign in to train your voice." }, 401);
  const id = req.nextUrl.searchParams.get("item_id");
  if (!id || !itemId.test(id)) return json({ error: "Choose a reply or start a new example." }, 400);
  try {
    const [example] = await sbSelect<Example>("kc_fb_reply_voice_examples", `select=prepared_reply,posted_reply,updated_at,correction_reason&item_id=eq.${id}&limit=1`);
    if (example || id.startsWith("manual-")) return json({ example: example ?? null });
    const [receipt] = await sbSelect<Receipt>("kc_reply_outcomes", `select=posted_reply,updated_at&item_id=eq.${id}&limit=1`);
    return json(receipt ? { example: null, receipt } : { example: null });
  } catch {
    return json({ error: "Couldn’t load the saved example. Try again." }, 502);
  }
}

export async function POST(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) return json({ error: "Sign in to train your voice." }, 401);
  // Next can normalize the request URL to its internal hostname. The browser
  // sends the public dashboard host in both Host and Origin.
  const requestOrigin = `${req.nextUrl.protocol}//${req.headers.get("host") ?? req.nextUrl.host}`;
  if (req.headers.get("origin") !== requestOrigin) return json({ error: "Save this example from the dashboard." }, 403);
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Send the example as JSON." }, 415);
  const body = await req.json().catch(() => null);
  if (typeof body?.item_id !== "string" || !itemId.test(body.item_id)) return json({ error: "Choose a reply or start a new example." }, 400);
  const { prepared_reply, posted_reply, expected_updated_at = null } = body;
  const linked = !body.item_id.startsWith("manual-");
  const invalidText = (value: unknown) => typeof value !== "string" || value.length > DRAFT_MAX || value.includes("\u0000");
  if (invalidText(posted_reply) || !posted_reply.trim()) return json({ error: `Enter what you posted, up to ${DRAFT_MAX} characters.` }, 400);
  if ((prepared_reply != null && invalidText(prepared_reply)) || (!linked && !prepared_reply?.trim())) return json({ error: `Enter the original draft, up to ${DRAFT_MAX} characters.` }, 400);
  if (expected_updated_at !== null && (typeof expected_updated_at !== "string" || !Number.isFinite(Date.parse(expected_updated_at)))) {
    return json({ error: "Reopen the example and try again." }, 400);
  }
  const hasReason = Object.hasOwn(body, "correction_reason");
  const reason = body.correction_reason;
  if (hasReason && (!linked || (reason !== null && (!isCorrectionReason(reason) || !editedReply(prepared_reply ?? "", posted_reply))))) {
    return json({ error: "Choose a correction reason only for a linked reply whose wording changed." }, 400);
  }
  try {
    const rpc = hasReason ? "kc_save_fb_posted_reply_with_reason" : linked ? "kc_save_fb_posted_reply" : "kc_save_fb_reply_voice_example";
    const [result] = await sbRpc<(Receipt & { prepared_reply: string | null; correction_reason?: CorrectionReason | null })[]>(rpc, {
      p_item_id: body.item_id, p_prepared_reply: prepared_reply?.trim() ? prepared_reply : null, p_posted_reply: posted_reply, p_expected_updated_at: expected_updated_at,
      ...(hasReason ? { p_correction_reason: reason } : {}),
    });
    if (!result) return json({ code: "revision_conflict", error: "This reply changed in another window. Reload it to see the latest wording." }, 409);
    const trainedVoice = !!result.prepared_reply && (result.correction_reason == null || result.correction_reason === "voice");
    return json({ ok: true, example: result.prepared_reply ? result : null, recordedPosted: linked, trainedVoice });
  } catch (error) {
    if (error instanceof Error && error.message.endsWith(": invalid_reply_correction_reason")) {
      return json({ error: "The selected reason requires an edited reply." }, 400);
    }
    if (error instanceof Error && error.message.endsWith(": reply_delivery_in_progress")) {
      return json({ code: "delivery_in_progress", error: "A Page delivery is in progress. Keep your wording here and retry in a moment." }, 409);
    }
    if (error instanceof Error && error.message.endsWith(": reply_missing")) {
      return json({ code: "reply_missing", error: "This reply is no longer available. Refresh the queue." }, 404);
    }
    return json({ error: "Couldn’t confirm the save. Try again." }, 502);
  }
}
