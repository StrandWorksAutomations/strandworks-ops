import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { PROJECTS, buildProjectFootprint, type RegisterInputs } from "@/lib/projects";

export const revalidate = 60;

export default async function ProjectsIndex() {
  const [services, assets, access, models, subscriptions] = await Promise.all([
    readRepoFile("registers/services.csv"),
    readRepoFile("registers/assets.csv"),
    readRepoFile("registers/access.csv"),
    readRepoFile("registers/models.csv"),
    readRepoFile("registers/subscriptions.csv"),
  ]);
  const inputs: RegisterInputs = { services, assets, access, models, subscriptions };

  const rows = PROJECTS.map((p) => ({
    p,
    fp: buildProjectFootprint(p, inputs),
  }));

  return (
    <Chrome title="Projects" sub="footprint from the registers" active="/projects">
      <div className="card">
        <div className="meta">
          Each project aggregates the registers (services, assets, access
          locations, models, subscriptions) attributed to it. Data is rendered
          as-is from the registers — blank stays blank.
        </div>
      </div>
      {rows.map(({ p, fp }) => (
        <Link key={p.slug} href={`/projects/${p.slug}`}>
          <div className="card">
            <h3>
              {p.name}
              {fp.spendMonthlyUsd > 0 || fp.spendHasUncosted ? (
                <span className="badge">
                  ${fp.spendMonthlyUsd}/mo{fp.spendHasUncosted ? "+" : ""}
                </span>
              ) : null}
            </h3>
            <div className="meta">{p.role}</div>
            <div className="chips">
              <span className="chip">{fp.infra.length} infra</span>
              <span className="chip">{fp.assets.length} assets</span>
              <span className="chip">{fp.access.length} access</span>
              <span className="chip">{fp.models.length} models</span>
              <span className="chip">{fp.subscriptions.length} subs</span>
            </div>
          </div>
        </Link>
      ))}
    </Chrome>
  );
}
