import { Chrome } from "../components/Chrome";
import { ResponseForm } from "../components/ResponseForm";
import { humanizeDates } from "@/lib/when";

export const dynamic = "force-dynamic";
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 2000) : "");

// A response about something with no owner-loop item, such as an objective or business date.
export default async function RespondPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const project = one(params.project);
  const title = one(params.title) || "Instruction from Jonathan";
  const detail = one(params.detail);
  return <Chrome title="Respond" sub={project || "All projects"} active="/timeline">
    <article className="card">
      <h2 className="item-title">{humanizeDates(title)}</h2>
      {detail ? <p className="meta">{humanizeDates(detail)}</p> : null}
      <ResponseForm target={{ project, title, detail }} focus />
    </article>
  </Chrome>;
}
