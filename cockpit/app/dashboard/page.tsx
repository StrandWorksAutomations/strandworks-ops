import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 60;

export default async function DashboardPage() {
  const md = await readRepoFile("DASHBOARD.md");
  return (
    <Chrome title="Dashboard" sub="generated from registers" active="/ops">
      {md ? (
        <div className="prose table-scroll" dangerouslySetInnerHTML={{ __html: renderMarkdown(md) }} />
      ) : (
        <div className="card">DASHBOARD.md not found</div>
      )}
    </Chrome>
  );
}
