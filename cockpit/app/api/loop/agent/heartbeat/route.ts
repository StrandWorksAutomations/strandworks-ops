import { NextRequest, NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase-rest";
import { authenticateBridgeHeartbeatToken, MAX_HEARTBEAT_BYTES, validateBridgeHeartbeat, writeBridgeHeartbeat } from "@/lib/dashboard-bridge-status";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", Vary: "Authorization" } });
}
export async function POST(req: NextRequest) {
  const match = /^Bearer ([A-Za-z0-9._~+\/-]{24,512}={0,2})$/i.exec(req.headers.get("authorization") || "");
  if (!match) return json({ error: "unauthenticated" }, 401);
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_HEARTBEAT_BYTES) return json({ error: "Request is too large." }, 400);
  let raw: unknown;
  try {
    const body = await req.text();
    if (Buffer.byteLength(body, "utf8") > MAX_HEARTBEAT_BYTES) return json({ error: "Request is too large." }, 400);
    raw = JSON.parse(body);
  } catch { return json({ error: "invalid JSON" }, 400); }
  const parsed = validateBridgeHeartbeat(raw);
  if (!parsed.ok) return json({ error: "Invalid connection snapshot." }, 400);
  if (!supabaseConfigured()) return json({ error: "Connection status service is unavailable." }, 503);
  try {
    if (!(await authenticateBridgeHeartbeatToken(match[1]))) return json({ error: "unauthenticated" }, 401);
    const stored = await writeBridgeHeartbeat(parsed.value);
    return json({ ok: true, receivedAt: stored.receivedAt });
  } catch { return json({ error: "Connection status service is unavailable." }, 503); }
}
