import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { addDays, buildMoneyView, SPEND_CLASSES, type MoneyItem, type SpendClass } from "@/lib/money";
import { calendarEvents, calendarSubscriptions } from "@/lib/subscription-calendar";
import { ownerDay } from "@/lib/owner-loop";
import { buildSpendView } from "@/lib/spend";
import { readCeilingUsd } from "@/lib/git";
import { redactForDisplay } from "@/lib/redact";
import { writeMode } from "@/lib/rule-writer";
import { SubscriptionCard, type CardItem } from "./SubscriptionCard";
import { AddSubscription } from "./AddSubscription";

export const revalidate = 60;
export const dynamic = "force-dynamic"; // edits must be visible immediately

const STATUS_CLASS: Record<SpendClass, string> = {
  core: "good",
  hidden: "warn",
  flagged: "bad",
  review: "warn",
  ending: "",
  owned: "",
  personal: "",
};

function toCardItem(it: MoneyItem): CardItem {
  return {
    service: it.service,
    plan: it.plan,
    costRaw: it.costRaw,
    chargeRaw: it.chargeRaw,
    costUsd: it.costUsd,
    cadence: it.cadence,
    renewalRaw: it.renewalRaw,
    renewalIso: it.renewalIso,
    status: it.status,
    statusClass: STATUS_CLASS[it.cls],
    verdict: it.verdict,
    trialEnd: it.trialEnd,
    discount: it.discount,
    notesRedacted: it.notes ? redactForDisplay(it.notes) : "",
  };
}

export default async function MoneyPage() {
  const [subsCsv, spendCsv, ceilingUsd] = await Promise.all([
    readRepoFile("registers/subscriptions.csv"),
    readRepoFile("registers/autonomous-spend.csv"),
    readCeilingUsd(),
  ]);

  const todayIso = ownerDay(new Date().toISOString());
  const money = buildMoneyView(subsCsv);
  const spend = buildSpendView(spendCsv, ceilingUsd);
  const renewals60 = calendarEvents(calendarSubscriptions(money), todayIso, addDays(todayIso, 59));
  const dryRun = writeMode() === "dry-run";

  return (
    <Chrome
      title="Money"
      sub={`$${money.knownMonthlyUsd.toFixed(2)}/mo known · ${money.uncostedCount} uncosted${money.cancelMarkedUsd > 0 ? ` · −$${money.cancelMarkedUsd.toFixed(2)} marked to cancel` : ""}${dryRun ? " · DRY-RUN (no commits)" : ""}`}
      active="/money"
    >
      <AddSubscription />
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

      {money.trials.length > 0 ? (
        <>
          <div className="section-head">
            <h2>Trials — decide before they convert</h2>
            <span className="meta">{money.trials.length} running</span>
          </div>
          <div className="ledger">
            {money.trials.map((t) => (
              <div key={t.service} className="l-row">
                <span className="l-date">{t.trialEnd}</span>
                <span className="l-name">{t.service}</span>
                <span className={`l-amount ${t.costUsd === null ? "dim" : ""}`}>
                  {t.chargeUsd !== null ? `$${t.chargeUsd.toFixed(2)} per payment after trial`
                    : t.costUsd !== null ? `$${t.costUsd.toFixed(2)}/mo equivalent after trial` : "Price unknown"}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="section-head">
        <h2>Renewals · next 60 days</h2>
        <span className="meta">{renewals60.length} scheduled</span>
      </div>
      {renewals60.length === 0 ? (
        <div className="card">
          <div className="meta">No dated renewals inside 60 days.</div>
        </div>
      ) : (
        <div className="ledger">
          {renewals60.map(({ date, subscription: r }) => (
            <div key={`${date}/${r.service}`} className="l-row">
              <span className="l-date">{date}</span>
              <span className="l-name">
                {r.service} <span className="l-sub">{r.status}</span>
              </span>
              <span className={`l-amount ${r.chargeUsd === null ? "dim" : ""}`}>
                {r.chargeUsd !== null ? `${r.approximate ? "≈" : ""}$${r.chargeUsd.toFixed(2)}` : "Price unknown"}
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
            {sorted.map((it) => (
              <SubscriptionCard key={it.service} it={toCardItem(it)} dryRun={dryRun} />
            ))}
          </section>
        );
      })}

      <div className="card">
        <div className="meta">
          Monthly totals use each subscription’s monthly equivalent and exclude unknown prices.
        </div>
      </div>
    </Chrome>
  );
}
