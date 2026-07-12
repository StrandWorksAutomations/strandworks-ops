import { Chrome } from "../components/Chrome";
import { readRepoFile, listRepoDir } from "@/lib/repo";
import { parseDecision, isPending, type Decision } from "@/lib/decisions";
import { renderMarkdown } from "@/lib/markdown";
import { DecisionCard } from "./DecisionCard";
import { writeMode } from "@/lib/rule-writer";

export const revalidate = 60;
export const dynamic = "force-dynamic"; // rulings must disappear immediately

export default async function DecisionsPage() {
  const files = (await listRepoDir("_governance/decisions"))
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();

  const pending: Decision[] = [];
  const broken: string[] = [];
  for (const f of files) {
    const raw = await readRepoFile(`_governance/decisions/${f}`);
    if (!raw) continue;
    try {
      const d = parseDecision(raw, f);
      if (isPending(d)) pending.push(d);
    } catch {
      broken.push(f);
    }
  }

  const mode = writeMode();

  return (
    <Chrome
      title="Decide"
      sub={`${pending.length} pending${mode === "dry-run" ? " · DRY-RUN mode (no commits)" : ""}`}
      active="/decisions"
    >
      {pending.length === 0 ? (
        <div className="card">
          <h3>Queue clear</h3>
          <div className="meta">No pending decisions.</div>
        </div>
      ) : null}
      {pending.map((d) => (
        <DecisionCard
          key={d.id}
          id={d.id}
          filename={d.filename}
          filed={d.filed}
          filedBy={d.filedBy}
          question={d.question}
          bodyHtml={renderMarkdown(d.body)}
          dryRun={mode === "dry-run"}
        />
      ))}
      {broken.map((f) => (
        <div className="card" key={f}>
          <h3>{f}</h3>
          <div className="error-text">unparseable decision file — fix by hand in the repo</div>
        </div>
      ))}
    </Chrome>
  );
}
