import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { listRepoDir } from "@/lib/repo";
import { REGISTERS } from "@/lib/registers";

export const revalidate = 60;

export default async function OpsHub() {
  const reportFiles = (await listRepoDir("_governance/reports")).filter((f) => f.endsWith(".md"));

  return (
    <Chrome title="Ops" sub="registers, fabric, and governance" active="/ops">
      <div className="section-head">
        <h2>Registers — the source of truth</h2>
        <span className="meta">{REGISTERS.length} files</span>
      </div>
      <div className="ledger">
        {REGISTERS.map((r) => (
          <Link key={r.name} href={`/registers/${r.name}`} className="l-row">
            <span className="l-name">
              {r.title} <span className="l-sub">{r.blurb}</span>
            </span>
            <span className="l-amount dim">→</span>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2>Fabric</h2>
      </div>
      <div className="ledger">
        <Link href="/status" className="l-row">
          <span className="l-name">
            Status <span className="l-sub">sprint + fabric state</span>
          </span>
          <span className="l-amount dim">→</span>
        </Link>
        <Link href="/spend" className="l-row">
          <span className="l-name">
            Spend ledger <span className="l-sub">autonomous-spend vs ceiling</span>
          </span>
          <span className="l-amount dim">→</span>
        </Link>
        <Link href="/dashboard" className="l-row">
          <span className="l-name">
            DASHBOARD.md <span className="l-sub">the generated flat file</span>
          </span>
          <span className="l-amount dim">→</span>
        </Link>
        <Link href="/scouts" className="l-row">
          <span className="l-name">
            Scouts <span className="l-sub">drift/audit coverage + flags</span>
          </span>
          <span className="l-amount dim">→</span>
        </Link>
      </div>

      <div className="section-head">
        <h2>Governance reports</h2>
        <Link href="/reports">all {reportFiles.length} →</Link>
      </div>
      <div className="ledger">
        {reportFiles
          .sort()
          .reverse()
          .slice(0, 8)
          .map((f) => (
            <Link key={f} href={`/reports/${encodeURIComponent(f.replace(/\.md$/, ""))}`} className="l-row">
              <span className="l-name mono" style={{ fontSize: 12.5 }}>
                {f}
              </span>
              <span className="l-amount dim">→</span>
            </Link>
          ))}
      </div>
    </Chrome>
  );
}
