import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { PortfolioObjectives } from "../components/PortfolioObjectives";
import { fetchPortfolio } from "@/lib/portfolio-data";
import { portfolioAttention } from "@/lib/portfolio";

export const dynamic = "force-dynamic";
export default async function Focus({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const params = await searchParams;
  const all = await fetchPortfolio();
  const data = params.project ? await fetchPortfolio(params.project) : all;
  const attention = data ? portfolioAttention(data, new Date()) : [];
  return <Chrome title="Focus" sub="shared goals · active work · evidence · recovery" active="/focus">
    <nav className="chips" aria-label="Project focus"><Link className={`chip${params.project ? "" : " on"}`} href="/focus">All projects</Link>{Array.from(new Set(all?.objectives.map((o) => o.project) ?? [])).map((project) => <Link className={`chip${params.project === project ? " on" : ""}`} key={project} href={`/focus?project=${encodeURIComponent(project)}`}>{project}</Link>)}</nav>
    {attention.length ? <section aria-label="Work needing attention"><div className="section-head"><h2>Needs attention</h2><span className="meta">{attention.length}</span></div>{attention.map((a) => <div className="card" key={a.id}><b>{a.title}</b><div className="meta">{a.project} · {a.detail}</div></div>)}</section> : null}
    <div className="section-head"><h2>Committed outcomes</h2><Link href="/timeline" className="meta">Timeline →</Link></div>
    <PortfolioObjectives data={data} />
  </Chrome>;
}
