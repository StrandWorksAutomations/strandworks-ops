import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { readCeilingUsd } from "@/lib/git";
import { buildSpendView } from "@/lib/spend";

export const revalidate = 60;

export default async function SpendPage() {
  const [csv, ceilingUsd] = await Promise.all([
    readRepoFile("registers/autonomous-spend.csv"),
    readCeilingUsd(),
  ]);
  const view = buildSpendView(csv, ceilingUsd);

  const barPct = Math.min(100, view.pctUsed);
  const barClass = view.over ? "bad" : view.pctUsed >= 80 ? "warn" : "good";

  return (
    <Chrome
      title="Autonomous spend"
      sub={`month-to-date vs $${view.ceilingUsd} ceiling · ${view.month}`}
      active="/money"
    >
      <div className="card">
        <div className="cost" style={{ fontSize: 26 }}>
          ${view.spentUsd.toFixed(2)}{" "}
          <span className="meta" style={{ fontSize: 13, fontWeight: 400 }}>
            of ${view.ceilingUsd.toFixed(2)}
          </span>
        </div>
        <div className={`bar ${barClass}`}>
          <div className="bar-fill" style={{ width: `${barPct}%` }} />
        </div>
        <div className="meta" style={{ marginTop: 8 }}>
          {view.over ? (
            <span style={{ color: "var(--bad)" }}>
              OVER by ${Math.abs(view.headroomUsd).toFixed(2)} — the gate refuses further
              autonomous spend this month.
            </span>
          ) : (
            <>
              ${view.headroomUsd.toFixed(2)} headroom · {view.pctUsed}% used
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="meta">
          This surfaces the WS-B autonomous-spend ledger
          (registers/autonomous-spend.csv). It shows NEW spend the fabric
          incurs on its own — blessed subscriptions are outside this ceiling.
          The gate itself (fabric/spend-gate) is what enforces; this view only
          reports headroom.
        </div>
      </div>

      <div className="section-head">
        <h2>Allowed this month</h2>
        <span className="meta">{view.allowedThisMonth.length} charges</span>
      </div>
      {view.allowedThisMonth.length === 0 ? (
        <div className="card">
          <div className="meta">no autonomous spend recorded this month.</div>
        </div>
      ) : (
        view.allowedThisMonth.map((r, i) => (
          <div className="card" key={i}>
            <h3>
              ${r.amount_usd}
              <span className="badge good">allowed</span>
            </h3>
            <dl>
              <div>
                <dt>date</dt>
                <dd>{r.date}</dd>
              </div>
              {r.project ? (
                <div>
                  <dt>project</dt>
                  <dd>{r.project}</dd>
                </div>
              ) : null}
              {r.purpose ? (
                <div>
                  <dt>purpose</dt>
                  <dd>{r.purpose}</dd>
                </div>
              ) : null}
              {r.requested_by ? (
                <div>
                  <dt>requested by</dt>
                  <dd>{r.requested_by}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ))
      )}

      {view.refusedThisMonth.length > 0 ? (
        <>
          <div className="section-head">
            <h2>Refused this month</h2>
            <span className="meta">gate blocked · owner alert</span>
          </div>
          {view.refusedThisMonth.map((r, i) => (
            <div className="card" key={i}>
              <h3>
                ${r.amount_usd}
                <span className="badge bad">refused</span>
              </h3>
              <dl>
                <div>
                  <dt>date</dt>
                  <dd>{r.date}</dd>
                </div>
                {r.purpose ? (
                  <div>
                    <dt>purpose</dt>
                    <dd>{r.purpose}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ))}
        </>
      ) : null}
    </Chrome>
  );
}
