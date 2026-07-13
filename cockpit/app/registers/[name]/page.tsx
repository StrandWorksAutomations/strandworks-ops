import { notFound } from "next/navigation";
import { Chrome } from "../../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { buildRegisterView, isRegisterName } from "@/lib/registers";

export const revalidate = 60;

function statusClass(status?: string): string {
  if (!status) return "";
  if (/active-keep|owned|done/i.test(status)) return "good";
  if (/hidden|flag|review|refund|paused|do-not-renew|deadline/i.test(status)) return "warn";
  if (/dead|halt|cancelled/i.test(status)) return "bad";
  return "";
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  if (!isRegisterName(name)) notFound();

  const csv = await readRepoFile(`registers/${name}.csv`);
  if (csv === null) notFound();

  const view = buildRegisterView(name, csv);

  return (
    <Chrome
      title={view.title}
      sub={
        view.totalMonthlyUsd !== undefined
          ? `$${view.totalMonthlyUsd}/mo known` +
            (view.incompleteCosts ? ` · ${view.incompleteCosts} uncosted` : "")
          : `${view.cards.length} entries`
      }
      active="/ops"
    >
      {view.cards.map((card, i) => (
        <div className="card" key={i}>
          <h3>
            {card.title}
            {card.status ? <span className={`badge ${statusClass(card.status)}`}>{card.status}</span> : null}
          </h3>
          {card.cost ? <div className="cost">{card.cost}</div> : null}
          <dl>
            {card.fields.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </Chrome>
  );
}
