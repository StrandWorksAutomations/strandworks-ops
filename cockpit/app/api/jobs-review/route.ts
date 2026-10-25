// Approve (publish into kc_posted_jobs) or reject a recruiter job submission.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { reviewErrorMessage, validateReview } from "@/lib/kc-jobs-review";
import { sbRpc } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = validateReview(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const row = await sbRpc<{ status: string; posted_job_id: string | null }>("kc_job_submission_review", {
      p_id: parsed.value.id, p_action: parsed.value.action, p_reason: parsed.value.reason ?? null, p_reviewer: "owner (cockpit)",
    });
    return NextResponse.json({ ok: true, status: row.status, posted_job_id: row.posted_job_id });
  } catch (error) {
    return NextResponse.json({ error: reviewErrorMessage(error instanceof Error ? error.message : "") }, { status: 502 });
  }
}
