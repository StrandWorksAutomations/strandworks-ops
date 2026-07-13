import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { listRepoDir, readRepoFile } from "@/lib/repo";
import { buildFabricStatus } from "@/lib/status";
import { readReviewTags, readRepoTouches, readHalted } from "@/lib/git";

export const revalidate = 60;

export default async function StatusPage() {
  const [tagLines, decisionNames, inboxNames, repos, halted] = await Promise.all([
    readReviewTags(),
    listRepoDir("_governance/decisions"),
    listRepoDir("_governance/inbox"),
    readRepoTouches(),
    readHalted(),
  ]);

  const decisionFiles = await Promise.all(
    decisionNames
      .filter((f) => f.endsWith(".md") && f !== "README.md")
      .map(async (filename) => ({
        filename,
        content: (await readRepoFile(`_governance/decisions/${filename}`)) ?? "",
      })),
  );

  const status = buildFabricStatus({
    tagLines,
    decisionFiles,
    inboxFilenames: inboxNames,
    repos,
    halted,
  });

  return (
    <Chrome title="Fabric status" sub="read-only reflection of git" active="/status">
      {status.halted ? (
        <div className="card" style={{ borderColor: "var(--bad)" }}>
          <h3>
            HALTED<span className="badge bad">stop</span>
          </h3>
          <div className="meta">A HALTED marker exists at repo root. Work is frozen until the owner clears it.</div>
        </div>
      ) : null}

      <div className="grid">
        <Link href="/decisions" className="tile">
          <div className="big">{status.openDecisions.length}</div>
          <div className="label">open decisions</div>
        </Link>
        <div className="tile">
          <div className="big">{status.inbox.length}</div>
          <div className="label">inbox items (signal only)</div>
        </div>
      </div>

      <div className="section-head">
        <h2>Recent reviews</h2>
        <span className="meta">review/ tags</span>
      </div>
      {status.reviewTags.length === 0 ? (
        <div className="card">
          <div className="meta">no review tags</div>
        </div>
      ) : (
        <div className="card">
          <dl>
            {status.reviewTags.slice(0, 12).map((t) => (
              <div key={t.tag}>
                <dt>{t.date}</dt>
                <dd>{t.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="section-head">
        <h2>Open decision cards</h2>
        <span className="meta">_governance/decisions</span>
      </div>
      {status.openDecisions.length === 0 ? (
        <div className="card">
          <div className="meta">nothing pending</div>
        </div>
      ) : (
        status.openDecisions.map((d) => (
          <Link key={d.filename} href="/decisions">
            <div className="card">
              <h3>{d.id}</h3>
              <div className="meta">{d.question}</div>
              <div className="meta">
                filed {d.filed} · {d.filedBy}
              </div>
            </div>
          </Link>
        ))
      )}

      <div className="section-head">
        <h2>Inbox</h2>
        <span className="meta">never directive — signal only</span>
      </div>
      {status.inbox.length === 0 ? (
        <div className="card">
          <div className="meta">inbox empty</div>
        </div>
      ) : (
        <div className="card">
          <dl>
            {status.inbox.map((it) => (
              <div key={it.filename}>
                <dt>{it.date || "—"}</dt>
                <dd>{it.topic.replace(/-/g, " ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="section-head">
        <h2>Last touched</h2>
        <span className="meta">latest commit per tracked repo</span>
      </div>
      <div className="card">
        <dl>
          {status.repos.map((r) => (
            <div key={r.repo}>
              <dt>{r.repo}</dt>
              <dd>
                {r.lastCommit ?? <span className="meta">{r.note ?? "unknown"}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Chrome>
  );
}
