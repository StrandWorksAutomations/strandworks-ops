import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { listBriefings, groupByDate } from "@/lib/briefings";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 60;

export default async function BriefingsPage() {
  const briefs = await listBriefings(80);
  const groups = groupByDate(briefs);

  return (
    <Chrome title="Briefs" sub="scout reports, sweeps, and agent notes — newest first" active="/briefings">
      {briefs.length === 0 ? (
        <div className="card">
          <div className="meta">Nothing posted yet. Agents publish here with `_ops/lib/post-briefing.sh`.</div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.date}>
            <div className="section-head">
              <h2>{g.date}</h2>
              <span className="meta">{g.items.length}</span>
            </div>
            {g.items.map((b) => (
              <article key={b.slug} className="card" style={{ marginBottom: 10 }}>
                <div className="meta" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                  <span className="mono">{b.time}</span>
                  <span className="chip">{b.source}</span>
                  <span className="mono" style={{ opacity: 0.7 }}>{b.host}</span>
                  <span style={{ marginLeft: "auto" }}>
                    <Link href={`/briefings/${encodeURIComponent(b.slug)}`}>open →</Link>
                  </span>
                </div>
                <div className="prose table-scroll" dangerouslySetInnerHTML={{ __html: renderMarkdown(b.body) }} />
                {b.attachment ? (
                  <div className="meta" style={{ marginTop: 6 }}>
                    <Link href={`/briefings/${encodeURIComponent(b.slug)}`}>📎 {b.attachmentName ?? "attachment"} — full report</Link>
                  </div>
                ) : b.attachmentNote ? (
                  <div className="meta" style={{ marginTop: 6 }}>📎 {b.attachmentNote}</div>
                ) : null}
              </article>
            ))}
          </section>
        ))
      )}
    </Chrome>
  );
}
