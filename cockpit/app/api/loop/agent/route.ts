// Machine-to-machine owner-loop relay. This exact POST route uses the existing
// revocable owner-loop agent token, not the owner's browser session. The service
// role stays server-side; every permitted RPC validates p_token in the database.
import { NextRequest, NextResponse } from "next/server";
import { sbRpc, supabaseConfigured } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 32 * 1024;
const REF = /^D-\d{4,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FUNCTIONS = new Set([
  "owner_loop_outbox", "owner_loop_get", "owner_loop_inbox",
  "owner_loop_transition", "owner_loop_ask", "owner_loop_outbox_mark",
]);
const KEYS: Record<string, readonly string[]> = {
  owner_loop_outbox: ["p_mode"],
  owner_loop_get: ["p_ref"],
  owner_loop_inbox: ["p_project"],
  owner_loop_transition: ["p_ref", "p_action", "p_actor", "p_note", "p_ruling"],
  owner_loop_ask: ["p_item"],
  owner_loop_outbox_mark: ["p_id", "p_patch"],
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function bounded(value: unknown, max: number, required = false): boolean {
  return typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);
}

function optionalText(value: unknown, max: number): boolean {
  return value === undefined || value === null || bounded(value, max);
}

function validArgs(fn: string, args: Record<string, unknown>): boolean {
  // A supplied p_token is deliberately ignored, then replaced from the header.
  // No other caller-selected argument or function can reach the service role.
  if (Object.keys(args).some((key) => key !== "p_token" && !KEYS[fn].includes(key))) return false;
  switch (fn) {
    case "owner_loop_outbox":
      return ["linear", "watch", "dispatch"].includes(String(args.p_mode));
    case "owner_loop_get":
      return typeof args.p_ref === "string" && REF.test(args.p_ref);
    case "owner_loop_inbox":
      return args.p_project === undefined || args.p_project === null || bounded(args.p_project, 120, true);
    case "owner_loop_transition":
      return typeof args.p_ref === "string" && REF.test(args.p_ref)
        && ["pickup", "done"].includes(String(args.p_action))
        && bounded(args.p_actor, 160, true) && optionalText(args.p_note, 8000)
        && (args.p_ruling === undefined || args.p_ruling === null);
    case "owner_loop_ask": {
      const item = args.p_item;
      if (!record(item) || !["decision", "deadline", "milestone", "alert"].includes(String(item.kind))) return false;
      if (!bounded(item.title, 300, true) || !optionalText(item.body, 12000)
        || !optionalText(item.project, 120) || !optionalText(item.origin_agent, 120)
        || !optionalText(item.origin_session, 160) || !optionalText(item.origin_host, 255)
        || !optionalText(item.origin_cwd, 4096) || !optionalText(item.due_at, 100)
        || !optionalText(item.recommended, 100)) return false;
      if (item.options !== undefined && (!Array.isArray(item.options) || item.options.length > 30
        || item.options.some((option) => !record(option) || !bounded(option.key, 100, true) || !bounded(option.label, 2000, true)))) return false;
      return true;
    }
    case "owner_loop_outbox_mark": {
      const patch = args.p_patch;
      return typeof args.p_id === "string" && UUID.test(args.p_id) && record(patch)
        && Object.keys(patch).length > 0
        && Object.keys(patch).every((key) => ["dispatch_state", "dispatch_target", "dispatch_note"].includes(key))
        && (patch.dispatch_state === undefined || ["delivered", "failed"].includes(String(patch.dispatch_state)))
        && optionalText(patch.dispatch_target, 500) && optionalText(patch.dispatch_note, 2000);
    }
    default:
      return false;
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", Vary: "Authorization" } });
}

export async function POST(req: NextRequest) {
  const match = /^Bearer ([A-Za-z0-9._~+\/-]{24,512}={0,2})$/i.exec(req.headers.get("authorization") || "");
  if (!match) return json({ error: "unauthenticated" }, 401);
  const token = match[1];
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 400);
  let raw: unknown;
  try {
    const body = await req.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 400);
    raw = JSON.parse(body);
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  if (!record(raw) || typeof raw.function !== "string" || !FUNCTIONS.has(raw.function)
    || Object.keys(raw).some((key) => !["function", "args"].includes(key))
    || !record(raw.args) || !validArgs(raw.function, raw.args)) {
    return json({ error: "Unsupported owner-loop function or arguments." }, 400);
  }
  if (!supabaseConfigured()) return json({ error: "Owner-loop service is unavailable." }, 503);
  try {
    const result = await sbRpc(raw.function, { ...raw.args, p_token: token });
    return json({ result });
  } catch (error) {
    // The helper may include PostgREST details in its error. Never return them
    // (or token values) to the caller; distinguish revoked tokens from outages.
    if (error instanceof Error && /owner_loop:\s*invalid agent token/i.test(error.message)) {
      return json({ error: "unauthenticated" }, 401);
    }
    return json({ error: "Owner-loop request failed. Try again." }, 502);
  }
}
