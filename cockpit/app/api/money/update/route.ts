// Money-register write endpoint. Middleware already requires an authenticated
// owner session for every /api route except /api/auth/* — edits can only come
// from the owner's session, and every edit is a commit (or a dev dry-run).
import { NextRequest, NextResponse } from "next/server";
import { readRepoFile } from "@/lib/repo";
import { commitFileUpdate } from "@/lib/git-write";
import { applySubscriptionEdit, EditError, type SubscriptionEdit } from "@/lib/money-edit";

const REGISTER = "registers/subscriptions.csv";

export async function POST(req: NextRequest) {
  let body: Partial<SubscriptionEdit> & { confirm?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.service || typeof body.service !== "string" || body.service.length > 200) {
    return NextResponse.json({ error: "missing service" }, { status: 400 });
  }
  if (!["verdict", "update", "delete"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "action must be verdict, update, or delete" }, { status: 400 });
  }
  // Deletion is destructive to the register (history stays in git): the client
  // shows a confirm popup, and the server refuses without the explicit flag.
  if (body.action === "delete" && body.confirm !== true) {
    return NextResponse.json({ error: "delete requires confirm: true" }, { status: 400 });
  }

  const csv = await readRepoFile(REGISTER);
  if (csv === null) {
    return NextResponse.json({ error: "subscriptions register not found" }, { status: 404 });
  }

  try {
    const { csv: updated, summary } = applySubscriptionEdit(csv, body as SubscriptionEdit);
    const result = await commitFileUpdate(
      REGISTER,
      updated,
      `money: ${summary} (source: cockpit)`
    );
    return NextResponse.json({ ok: true, summary, ...result });
  } catch (e) {
    if (e instanceof EditError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "write failed" },
      { status: 502 }
    );
  }
}
