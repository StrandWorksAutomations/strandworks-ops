import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase-rest";
import { createManualBatch, readManualBatchDashboard, validateManualBatchInput, ManualBatchError, MAX_MANUAL_BATCH_BODY_BYTES } from "@/lib/dashboard-manual-batches";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", Vary: "Cookie" } }); }
function failure(error: unknown) { return error instanceof ManualBatchError ? json({ error: error.message }, error.status) : json({ error: "Manual launch service is unavailable. Try again." }, 503); }
export async function GET(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) return json({ error: "unauthenticated" }, 401);
  if (!supabaseConfigured()) return json({ error: "Manual launch service is unavailable." }, 503);
  try { return json(await readManualBatchDashboard()); } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) return json({ error: "unauthenticated" }, 401);
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return json({ error: "Invalid request origin." }, 403);
  if (Number(req.headers.get("content-length")) > MAX_MANUAL_BATCH_BODY_BYTES) return json({ error: "Request is too large." }, 400);
  let raw: unknown;
  try { const body = await req.text(); if (Buffer.byteLength(body, "utf8") > MAX_MANUAL_BATCH_BODY_BYTES) return json({ error: "Request is too large." }, 400); raw = JSON.parse(body); }
  catch { return json({ error: "invalid JSON" }, 400); }
  const input = validateManualBatchInput(raw);
  if (!input) return json({ error: "Choose one to three answers from one project." }, 400);
  if (!supabaseConfigured()) return json({ error: "Manual launch service is unavailable." }, 503);
  try { return json({ batch: await createManualBatch(input) }); } catch (error) { return failure(error); }
}
