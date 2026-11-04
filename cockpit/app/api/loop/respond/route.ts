// The owner's response to any item. The database stores it as an outbox row;
// the relay posts it to Linear and dispatches it when urgent.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { sbRpc } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
const MAX_TEXT = 4000;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("shape");
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const message = text(raw.text, MAX_TEXT + 1);
  if (message.length > MAX_TEXT) return NextResponse.json({ error: `Keep the response under ${MAX_TEXT} characters.` }, { status: 400 });
  const urgent = raw.urgent === true;
  try {
    if (typeof raw.ref === "string") {
      if (!/^D-\d{4,}$/.test(raw.ref)) return NextResponse.json({ error: "Ref must look like D-0001." }, { status: 400 });
      const option = text(raw.option, 100);
      if (!option && !message) return NextResponse.json({ error: "Pick an option or write a response." }, { status: 400 });
      const item = await sbRpc<{ ref: string }>("owner_loop_respond", { p_ref: raw.ref, p_option: option || null, p_text: message || null, p_urgent: urgent });
      return NextResponse.json({ ok: true, ref: item.ref });
    }
    const title = text(raw.title, 300);
    if (!title || !message) return NextResponse.json({ error: "Write a response." }, { status: 400 });
    const item = await sbRpc<{ ref: string }>("owner_loop_note", {
      p_project: text(raw.project, 120) || "portfolio", p_title: title, p_body: text(raw.detail, 4000) || null,
      p_cwd: null, p_text: message, p_urgent: urgent,
    });
    return NextResponse.json({ ok: true, ref: item.ref });
  } catch {
    return NextResponse.json({ error: "Unable to save the response. Try again." }, { status: 502 });
  }
}
