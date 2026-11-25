// Money-register write endpoint. Middleware already requires an authenticated
// owner session for every /api route except /api/auth/* — edits can only come
// from the owner's session, and every edit is a commit (or a dev dry-run).
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookieNames, verifySessionToken } from "@/lib/session";
import { RegisterConflict, RegisterNotFound, updateSubscriptionRegister } from "@/lib/git-write";
import { applySubscriptionEdit, EditConflict, EditError, type SubscriptionEdit } from "@/lib/money-edit";

const REGISTER = "registers/subscriptions.csv";

export async function POST(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) {
    return NextResponse.json({ error: "Sign in to edit subscriptions." }, { status: 401 });
  }
  const origin = `${req.nextUrl.protocol}//${req.headers.get("host") ?? req.nextUrl.host}`;
  if (req.headers.get("origin") !== origin) {
    return NextResponse.json({ error: "Save subscriptions from the dashboard." }, { status: 403 });
  }
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return NextResponse.json({ error: "Send the subscription as JSON." }, { status: 415 });
  }
  let body: Partial<SubscriptionEdit> & { confirm?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || typeof body.service !== "string" || !body.service.trim() || body.service.length > 200) {
    return NextResponse.json({ error: "missing service" }, { status: 400 });
  }
  if (!["add", "verdict", "update", "delete"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "Unknown subscription action." }, { status: 400 });
  }
  // Deletion is destructive to the register (history stays in git): the client
  // shows a confirm popup, and the server refuses without the explicit flag.
  if (body.action === "delete" && body.confirm !== true) {
    return NextResponse.json({ error: "delete requires confirm: true" }, { status: 400 });
  }

  try {
    const result = await updateSubscriptionRegister(csv => applySubscriptionEdit(csv, body as SubscriptionEdit));
    revalidateTag(REGISTER);
    revalidatePath("/money");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof RegisterNotFound) return NextResponse.json({ error: e.message }, { status: 404 });
    if (e instanceof EditConflict || e instanceof RegisterConflict) return NextResponse.json({ error: e.message }, { status: 409 });
    if (e instanceof EditError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "write failed" },
      { status: 502 }
    );
  }
}
