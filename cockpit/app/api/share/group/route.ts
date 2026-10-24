// Edit a Facebook group's posting rules (PATCH body {id, patch}) or add a group (POST body {url, name, roles}).
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { validateGroupAdd, validateGroupPatch } from "@/lib/kc-share";
import { sbRpc } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

async function authed(req: NextRequest) {
  return verifySessionToken(req.cookies.get(cookieNames.session)?.value);
}

export async function PATCH(req: NextRequest) {
  if (!(await authed(req))) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = validateGroupPatch(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await sbRpc("kc_job_group_update", { p_id: parsed.value.id, p_patch: parsed.value.patch });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save the group. Refresh and try again." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await authed(req))) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = validateGroupAdd(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    await sbRpc("kc_job_group_add", { p_id: parsed.value.id, p_name: parsed.value.name, p_url: parsed.value.url, p_roles: parsed.value.roles });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not add the group. It may already be listed." }, { status: 502 });
  }
}
