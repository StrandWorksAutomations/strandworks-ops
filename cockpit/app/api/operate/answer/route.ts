// Answer a pending decision from the Operate dock. Inserts into qa_answers with
// the service key (server-side only); a DB trigger flips the question to
// answered and logs the event.
//
// Auth: middleware gates every /api route behind the owner session, and this
// handler re-verifies the session cookie itself — no answer is ever written
// without a valid owner session.
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, cookieNames } from "@/lib/session";
import { validateAnswerInput } from "@/lib/operate";
import { submitAnswer, getQuestionStatus } from "@/lib/operate-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authed = await verifySessionToken(req.cookies.get(cookieNames.session)?.value);
  if (!authed) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = validateAnswerInput(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  // Clean 404/409 instead of a raw FK / trigger error.
  const existing = await getQuestionStatus(parsed.value.questionId);
  if (!existing) {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: `already ${existing.status}` },
      { status: 409 }
    );
  }

  try {
    await submitAnswer(parsed.value);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "answer failed" },
      { status: 502 }
    );
  }
}
