import { notFound } from "next/navigation";
import { Chrome } from "../../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 60;

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Path-traversal guard: report slugs are flat filenames only.
  if (!/^[A-Za-z0-9._-]+$/.test(slug)) notFound();
  const md = await readRepoFile(`_governance/reports/${slug}.md`);
  if (md === null) notFound();
  return (
    <Chrome title={slug} sub="governance report" active="/ops">
      <div className="prose table-scroll" dangerouslySetInnerHTML={{ __html: renderMarkdown(md) }} />
    </Chrome>
  );
}
