import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { compileVoicePrompt, parseVoiceMutation, VoiceError } from "@/lib/marketing-voice";
import { loadVoiceStore, saveVoiceMutation } from "@/lib/marketing-voice-data";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 128 * 1024;
const headers = { "Cache-Control": "no-store" };
function selectedBrand(req: NextRequest): string {
  const brand = req.nextUrl.searchParams.get("brand_id") || "7530099";
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(brand)) throw new VoiceError("Choose a valid brand.", 400);
  return brand;
}
function failure(e: unknown) {
  const error = e instanceof VoiceError ? e : new VoiceError("The writing voice is unavailable. No changes were confirmed.", 503, "voice_unavailable");
  return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers });
}
async function readBody(req: NextRequest): Promise<unknown> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new VoiceError("Send voice feedback as JSON.", 415);
  const size = req.headers.get("content-length");
  if (size && Number(size) > MAX_BODY_BYTES) throw new VoiceError("That feedback is too large.", 413, "voice_body_too_large");
  const reader = req.body?.getReader();
  if (!reader) throw new VoiceError("The feedback request is empty.", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > MAX_BODY_BYTES) { await reader.cancel(); throw new VoiceError("That feedback is too large.", 413, "voice_body_too_large"); }
    chunks.push(part.value);
  }
  const all = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(all)); }
  catch { throw new VoiceError("The feedback request is not valid JSON.", 400); }
}

export async function GET(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers });
  try {
    const brand = selectedBrand(req);
    const store = await loadVoiceStore();
    return NextResponse.json({ ok: true, store, prompt: compileVoicePrompt(store, brand) }, { headers });
  } catch (e) { return failure(e); }
}

export async function POST(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers });
  // Feedback is an owner UI action. Cross-origin writes never inherit the session.
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Save feedback from this dashboard.", code: "invalid_origin" }, { status: 403, headers });
  try {
    const brand = selectedBrand(req);
    const input = parseVoiceMutation(await readBody(req));
    const result = await saveVoiceMutation(input);
    return NextResponse.json({ ok: true, ...result, prompt: compileVoicePrompt(result.store, brand) }, { headers });
  } catch (e) { return failure(e); }
}
