import { NextRequest, NextResponse } from "next/server";
import { DRAFT_MAX } from "@/lib/kc-replies";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { sbRpc, sbSelect } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type Example = { prepared_reply: string; posted_reply: string; updated_at: string };
const itemId = /^(?:[0-9a-f]{24}|manual-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) return json({ error: "Sign in to train your voice." }, 401);
  const id = req.nextUrl.searchParams.get("item_id");
  if (!id || !itemId.test(id)) return json({ error: "Choose a reply or start a new example." }, 400);
  try {
    const [example] = await sbSelect<Example>("kc_fb_reply_voice_examples", `select=prepared_reply,posted_reply,updated_at&item_id=eq.${id}&limit=1`);
    return json({ example: example ?? null });
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
  if ([prepared_reply, posted_reply].some(text => typeof text !== "string" || !text.trim() || text.length > DRAFT_MAX || text.includes("\u0000"))) {
    return json({ error: `Enter both replies, up to ${DRAFT_MAX} characters each.` }, 400);
  }
  if (expected_updated_at !== null && (typeof expected_updated_at !== "string" || !Number.isFinite(Date.parse(expected_updated_at)))) {
    return json({ error: "Reopen the example and try again." }, 400);
  }
  try {
    const [example] = await sbRpc<Example[]>("kc_save_fb_reply_voice_example", {
      p_item_id: body.item_id, p_prepared_reply: prepared_reply.trim(), p_posted_reply: posted_reply.trim(), p_expected_updated_at: expected_updated_at,
    });
    if (!example) return json({ error: "This example changed in another window. Reopen it to see the latest wording." }, 409);
    return json({ ok: true, example });
  } catch {
    return json({ error: "Couldn’t save this example. Try again." }, 502);
  }
}
