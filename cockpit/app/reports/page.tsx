import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { listRepoDir } from "@/lib/repo";

export const revalidate = 60;

export default async function ReportsIndex() {
  const files = (await listRepoDir("_governance/reports"))
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();
  return (
    <Chrome title="Reports" sub="_governance/reports" active="/reports">
      {files.length === 0 ? <div className="card">no reports</div> : null}
      {files.map((f) => (
        <Link key={f} href={`/reports/${encodeURIComponent(f.replace(/\.md$/, ""))}`}>
          <div className="card">
            <h3>{f.replace(/\.md$/, "")}</h3>
          </div>
        </Link>
      ))}
    </Chrome>
  );
}
