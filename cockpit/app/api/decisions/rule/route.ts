// The only write endpoint. Middleware already requires an authenticated owner
// session for every /api route except /api/auth/* — rulings can only come
// from the owner's session (SPEC non-goal: no automation presses tokens).
import { NextRequest, NextResponse } from "next/server";
import { isOwnerToken, parseDecision, isPending, sanitizeAnswer, ANSWER_MAX_LENGTH } from "@/lib/decisions";
import { readRepoFile } from "@/lib/repo";
import { commitRuling } from "@/lib/rule-writer";

export async function POST(req: NextRequest) {
  let body: { filename?: string; ruling?: string; answer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { filename, ruling, answer } = body;
  if (!filename || !/^[A-Za-z0-9._-]+\.md$/.test(filename) || filename === "README.md") {
    return NextResponse.json({ error: "invalid decision filename" }, { status: 400 });
  }
  if (!ruling || !isOwnerToken(ruling)) {
    return NextResponse.json({ error: "ruling must be one of the six owner tokens" }, { status: 400 });
  }
  if (answer !== undefined && (typeof answer !== "string" || answer.length > ANSWER_MAX_LENGTH)) {
    return NextResponse.json(
      { error: `answer must be a string of at most ${ANSWER_MAX_LENGTH} characters` },
      { status: 400 }
    );
  }

  const raw = await readRepoFile(`_governance/decisions/${filename}`);
  if (raw === null) {
    return NextResponse.json({ error: "decision not found (already ruled?)" }, { status: 404 });
  }

  let decision;
  try {
    decision = parseDecision(raw, filename);
  } catch {
    return NextResponse.json({ error: "decision file unparseable" }, { status: 422 });
  }
  if (!isPending(decision)) {
    return NextResponse.json({ error: `already ruled: ${decision.ruling}` }, { status: 409 });
  }

  try {
    const result = await commitRuling(
      filename,
      raw,
      ruling,
      new Date().toISOString(),
      answer ? sanitizeAnswer(answer) : undefined
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    // Error messages from rule-writer never contain token material.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "commit failed" },
      { status: 502 }
    );
  }
}
