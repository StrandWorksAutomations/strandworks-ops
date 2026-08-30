import { notFound } from "next/navigation";
import Link from "next/link";
import { Chrome } from "../../components/Chrome";
import { readBriefing, readAttachment } from "@/lib/briefings";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 60;

export default async function BriefingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await readBriefing(slug);
  if (!b) notFound();
  const attachment = await readAttachment(b);

  return (
    <Chrome title={b.title} sub={`${b.source} · ${b.date} ${b.time} · ${b.host}`} active="/briefings">
      <div className="meta" style={{ marginBottom: 10 }}>
        <Link href="/briefings">← all briefs</Link>
      </div>
      <div className="card">
        <div className="prose table-scroll" dangerouslySetInnerHTML={{ __html: renderMarkdown(b.body) }} />
      </div>
      {attachment !== null ? (
        <>
          <div className="section-head">
            <h2>{b.attachmentName ?? "attachment"}</h2>
            <span className="meta mono">{b.attachment}</span>
          </div>
          <div className="card">
            <div className="prose table-scroll" dangerouslySetInnerHTML={{ __html: renderMarkdown(attachment) }} />
          </div>
        </>
      ) : b.attachmentNote ? (
        <div className="meta" style={{ marginTop: 10 }}>📎 {b.attachmentNote}</div>
      ) : null}
    </Chrome>
  );
}
