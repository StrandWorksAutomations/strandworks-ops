import Link from "next/link";
import { Chrome } from "./components/Chrome";
import { readRepoFile, listRepoDir } from "@/lib/repo";
import { buildRegisterView } from "@/lib/registers";
import { parseDecision, isPending } from "@/lib/decisions";

export const revalidate = 60;

export default async function Overview() {
  const [subsCsv, calCsv, decisionFiles] = await Promise.all([
    readRepoFile("registers/subscriptions.csv"),
    readRepoFile("registers/calendar.csv"),
    listRepoDir("_governance/decisions"),
  ]);

  const subs = subsCsv ? buildRegisterView("subscriptions", subsCsv) : null;

  let pendingCount = 0;
  for (const f of decisionFiles.filter((f) => f.endsWith(".md") && f !== "README.md")) {
    const raw = await readRepoFile(`_governance/decisions/${f}`);
    if (!raw) continue;
    try {
      if (isPending(parseDecision(raw, f))) pendingCount++;
    } catch {
      // unparseable decision files are surfaced on the Decide tab, not here
    }
  }

  const upcoming = calCsv
    ? buildRegisterView("calendar", calCsv)
        .cards.filter((c) => {
          const d = c.fields.find((f) => f.label === "date")?.value;
          return d && d >= new Date().toISOString().slice(0, 10);
        })
        .slice(0, 5)
    : [];

  return (
    <Chrome title="Strandworks" sub="operations cockpit" active="/">
      <div className="grid">
        <Link href="/registers/subscriptions" className="tile">
          <div className="big">${subs?.totalMonthlyUsd ?? "—"}</div>
          <div className="label">
            known monthly spend
            {subs?.incompleteCosts ? ` · ${subs.incompleteCosts} uncosted` : ""}
          </div>
        </Link>
        <Link href="/decisions" className="tile">
          <div className="big">{pendingCount}</div>
          <div className="label">pending decisions</div>
        </Link>
      </div>

      <div className="card">
        <h3>Upcoming dates</h3>
        {upcoming.length === 0 ? (
          <div className="meta">nothing dated ahead</div>
        ) : (
          <dl>
            {upcoming.map((c, i) => (
              <div key={i}>
                <dt>{c.fields.find((f) => f.label === "date")?.value}</dt>
                <dd>{c.title}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="card">
        <h3>Views</h3>
        <dl>
          <dt>Dashboard</dt>
          <dd>
            <Link href="/dashboard">DASHBOARD.md (generated)</Link>
          </dd>
          <dt>Registers</dt>
          <dd>
            <Link href="/registers">all six registers</Link>
          </dd>
          <dt>Reports</dt>
          <dd>
            <Link href="/reports">governance reports</Link>
          </dd>
        </dl>
      </div>
    </Chrome>
  );
}
