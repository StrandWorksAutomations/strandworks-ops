import { NextRequest, NextResponse } from "next/server";
import { buildMoneyView } from "@/lib/money";
import { ownerDay } from "@/lib/owner-loop";
import { readRepoFile } from "@/lib/repo";
import { cookieNames, verifySessionToken } from "@/lib/session";
import { calendarSubscriptions } from "@/lib/subscription-calendar";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) {
    return NextResponse.json({ error: "Sign in to view subscriptions." }, { status: 401, headers });
  }
  try {
    const csv = await readRepoFile("registers/subscriptions.csv");
    if (!csv?.trim()) throw new Error("Missing subscription register");
    return NextResponse.json({
      today: ownerDay(new Date().toISOString()), subscriptions: calendarSubscriptions(buildMoneyView(csv)),
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Couldn’t load subscriptions. Try again." }, { status: 503, headers });
  }
}
