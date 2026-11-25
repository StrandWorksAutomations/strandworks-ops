import { NextRequest, NextResponse } from "next/server";
import { cookieNames, verifySessionToken } from "@/lib/session";
import { httpsUrl, sourceIdForLink } from "@/lib/reply-link-editor";
import type { KcJobDetail } from "@/lib/kc-replies";

const headers = { "Cache-Control": "private, no-store" };
const plain = (value: unknown, limit = 300) => typeof value === "string" ? value.trim().slice(0, limit) : "";

/** Read the site's public, exact-ID listing for older queue entries without a synced job snapshot. */
export async function GET(req: NextRequest) {
  if (!await verifySessionToken(req.cookies.get(cookieNames.session)?.value)) {
    return NextResponse.json({ error: "Sign in to view jobs." }, { status: 401, headers });
  }
  const id = sourceIdForLink(req.nextUrl.searchParams.get("url") ?? "");
  if (!id) return NextResponse.json({ error: "Unknown job link." }, { status: 400, headers });
  try {
    const response = await fetch("https://kineticclinician.com/api/job?" + new URLSearchParams({ source_id: id }), {
      headers: { Accept: "application/json" }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) return NextResponse.json({ state: "closed" }, { headers });
    if (!response.ok) throw new Error();
    const { job } = await response.json();
    if (job?.source_id !== id || !plain(job.title)) throw new Error();
    const details = Array.isArray(job.assignment_details) ? job.assignment_details.slice(0, 20)
      .map((d: { label?: unknown; value?: unknown } | null) => ({ label: plain(d?.label, 100), value: plain(d?.value, 500) }))
      .filter((d: { label: string; value: string }) => d.label && d.value) : [];
    const salary = job.salary;
    const periods: Record<string, string> = { hour: "hour", week: "week", month: "month", year: "year", day: "day", shift: "shift" };
    let pay = "";
    if (salary && (!salary.currency || salary.currency === "USD") && Object.hasOwn(periods, salary.period)) {
      const amounts = [salary.min, salary.max].filter(n => typeof n === "number" && Number.isFinite(n) && n > 0);
      if (amounts.length) {
        const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 });
        pay = [...new Set(amounts)].map(n => dollars.format(n)).join("–") + "/" + periods[salary.period];
        if (salary.basis === "gross_package") pay += " gross package";
        if (salary.estimated) pay += " (estimated)";
      }
    }
    const detail: KcJobDetail = { source_id: id, title: plain(job.title), employer: plain(job.employer), location: plain(job.location),
      pay, employment_type: plain(job.employment_type), details, source_url: httpsUrl(job.source_url)?.href, checked_at: new Date().toISOString() };
    return NextResponse.json({ state: "current", job: detail }, { headers });
  } catch {
    return NextResponse.json({ error: "Kinetic Clinician’s job details could not be loaded." }, { status: 503, headers });
  }
}
