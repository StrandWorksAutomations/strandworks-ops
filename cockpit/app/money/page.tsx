import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { buildMoneyView, upcomingRenewals, SPEND_CLASSES, type MoneyItem, type SpendClass } from "@/lib/money";
import { buildSpendView } from "@/lib/spend";
import { readCeilingUsd } from "@/lib/git";
import { redactForDisplay } from "@/lib/redact";

export const revalidate = 60;

const STATUS_CLASS: Record<SpendClass, string> = {
  core: "good",
  hidden: "warn",
  flagged: "bad",
  review: "warn",
  ending: "",
  owned: "",
  personal: "",
};

function Item({ it }: { it: MoneyItem }) {
  return (
    <div className="card sub-card">
      <div className="row1">
        <h3 style={{ margin: 0 }}>
          {it.service}
          {it.status ? <span className={`badge ${STATUS_CLASS[it.cls]}`}>{it.status}</span> : null}
        </h3>
        <span className="cost">
          {it.costUsd !== null ? `$${it.costUsd.toFixed(2)}${it.costApprox ? "≈" : ""}` : "$ ?"}
        </span>
      </div>
      <div className="plan">
        {[it.plan, it.cadence, it.renewalRaw ? `renews ${it.renewalRaw}` : ""]
          .filter(Boolean)
          .join(" · ") || "no plan details on record"}
      </div>
      {it.notes ? (
        <details>
          <summary>notes</summary>
          <div className="notes">{redactForDisplay(it.notes)}</div>
        </details>
      ) : null}
    </div>
  );
}

export default async function MoneyPage() {
  const [subsCsv, spendCsv, ceilingUsd] = await Promise.all([
    readRepoFile("registers/subscriptions.csv"),
    readRepoFile("registers/autonomous-spend.csv"),
    readCeilingUsd(),
  ]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const money = buildMoneyView(subsCsv);
  const spend = buildSpendView(spendCsv, ceilingUsd);
  const renewals60 = upcomingRenewals(money, todayIso, 60);

  return (
    <Chrome
      title="Money"
      sub={`$${money.knownMonthlyUsd.toFixed(2)}/mo known · ${money.uncostedCount} uncosted · ${money.approxCount} approximate`}
      active="/money"
    >
      <div className="grid">
        {SPEND_CLASSES.filter((c) => ["core", "hidden", "flagged", "review"].includes(c.cls)).map((c) => (
          <a key={c.cls} href={`#${c.cls}`} className={`tile ${c.cls === "core" ? "brass" : c.cls === "flagged" ? "hot" : "warm"}`}>
            <div className="big">
              ${Math.round(money.byClass[c.cls].totalUsd)}
              {money.byClass[c.cls].uncosted ? <small>+?</small> : null}
            </div>
            <div className="label">
              {c.label} · {money.byClass[c.cls].count}
            </div>
          </a>
        ))}
      </div>

      <div className="section-head">
        <h2>Renewals · next 60 days</h2>
        <span className="meta">{renewals60.length} dated</span>
      </div>
      {renewals60.length === 0 ? (
        <div className="card">
          <div className="meta">No dated renewals inside 60 days.</div>
        </div>
      ) : (
        <div className="ledger">
          {renewals60.map((r, i) => (
            <div key={i} className="l-row">
              <span className="l-date">{r.renewalIso}</span>
              <span className="l-name">
                {r.service} <span className="l-sub">{r.status}</span>
              </span>
              <span className={`l-amount ${r.costUsd === null ? "dim" : ""}`}>
                {r.costUsd !== null ? `$${r.costUsd.toFixed(2)}` : "$ ?"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>Autonomous spend gate</h2>
        <Link href="/spend">ledger →</Link>
      </div>
      <Link href="/spend">
        <div className="card">
          <div className="cost">
            ${spend.spentUsd.toFixed(2)}{" "}
            <span className="meta" style={{ fontWeight: 400 }}>
              of ${spend.ceilingUsd.toFixed(2)} agent ceiling · {spend.month}
            </span>
          </div>
          <div className={`bar ${spend.over ? "bad" : spend.pctUsed >= 80 ? "warn" : "good"}`}>
            <div className="bar-fill" style={{ width: `${Math.min(100, spend.pctUsed)}%` }} />
          </div>
        </div>
      </Link>

      {SPEND_CLASSES.map((c) => {
        const items = money.items.filter((it) => it.cls === c.cls);
        if (items.length === 0) return null;
        const sorted = [...items].sort((a, b) => (b.costUsd ?? -1) - (a.costUsd ?? -1));
        return (
          <section key={c.cls} id={c.cls}>
            <div className="section-head">
              <h2>
                {c.label} — {c.blurb}
              </h2>
              <span className="meta">
                ${money.byClass[c.cls].totalUsd.toFixed(2)}
                {money.byClass[c.cls].uncosted ? ` + ${money.byClass[c.cls].uncosted}?` : ""}
              </span>
            </div>
            {sorted.map((it, i) => (
              <Item key={i} it={it} />
            ))}
          </section>
        );
      })}

      <div className="card">
        <div className="meta">
          Every figure above is read from registers/subscriptions.csv — the known total is a floor;
          uncosted services make it understated, never overstated. Edit the register to correct
          anything here.
        </div>
      </div>
    </Chrome>
  );
}
