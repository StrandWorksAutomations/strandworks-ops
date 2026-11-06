import { NextRequest, NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase-rest";
import { authenticateBridgeHeartbeatToken } from "@/lib/dashboard-bridge-status";
import { claimManualBatch, pollManualBatches, recordManualBatchResult, validateManualBatchResult, validManualBatchUuid, ManualBatchError, MAX_MANUAL_BATCH_BODY_BYTES } from "@/lib/dashboard-manual-batches";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", Vary: "Authorization" } }); }
export async function POST(req: NextRequest) {
  const match = /^Bearer ([A-Za-z0-9._~+\/-]{24,512}={0,2})$/i.exec(req.headers.get("authorization") || "");
  if (!match) return json({ error: "unauthenticated" }, 401);
  if (Number(req.headers.get("content-length")) > MAX_MANUAL_BATCH_BODY_BYTES) return json({ error: "Request is too large." }, 400);
  let raw: unknown;
  try { const body = await req.text(); if (Buffer.byteLength(body, "utf8") > MAX_MANUAL_BATCH_BODY_BYTES) return json({ error: "Request is too large." }, 400); raw = JSON.parse(body); }
  catch { return json({ error: "invalid JSON" }, 400); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json({ error: "Invalid batch request." }, 400);
  const { action, ...input } = raw as Record<string, unknown>;
  const valid = action === "poll" ? Object.keys(input).length === 0
    : action === "claim" ? Object.keys(input).length === 2 && validManualBatchUuid(input.id) && validManualBatchUuid(input.claimId)
    : action === "result" && validateManualBatchResult(input) !== null;
  if (!valid) return json({ error: "Invalid batch request." }, 400);
  if (!supabaseConfigured()) return json({ error: "Manual launch service is unavailable." }, 503);
  try {
    if (!await authenticateBridgeHeartbeatToken(match[1])) return json({ error: "unauthenticated" }, 401);
    if (action === "poll") return json({ batches: await pollManualBatches() });
    if (action === "claim") return json(await claimManualBatch(input.id as string, input.claimId as string));
    return json({ batch: await recordManualBatchResult(validateManualBatchResult(input)!) });
  } catch (error) {
    return error instanceof ManualBatchError ? json({ error: error.message }, error.status) : json({ error: "Manual launch service is unavailable. Try again." }, 503);
  }
}
