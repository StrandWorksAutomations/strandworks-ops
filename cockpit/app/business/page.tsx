// Business dates — every obligation the compliance register knows about,
// grouped by urgency. Source: Supabase admin.* (see registers/calendar.csv row
// "Strandworks LLC filings/renewal dates"). Read-only here; edits happen in the
// database.
import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { fetchDueItems, inAlertWindow, sumFees, type DueItem } from "@/lib/due-items";
import { redactForDisplay } from "@/lib/redact";

export const dynamic = "force-dynamic";

function band(d: DueItem): "overdue" | "window" | "later" {
  if (d.daysLeft !== null && d.daysLeft < 0) return "overdue";
  if (inAlertWindow(d)) return "window";
  return "later";
}

function Row({ d }: { d: DueItem }) {
  const cls = d.daysLeft !== null && d.daysLeft < 0 ? "bad" : d.daysLeft !== null && d.daysLeft <= 7 ? "warn" : "";
  return (
    <div className="l-row" style={{ alignItems: "flex-start" }}>
      <span className="l-date">{d.dueOn ? d.dueOn.slice(5) : "—"}</span>
      <span className="l-name" style={{ whiteSpace: "normal" }}>
        {redactForDisplay(d.item)}
        <span className="l-sub" style={{ display: "block" }}>
          {[d.entity, d.jurisdiction, d.status].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className={`l-amount ${cls || (d.feeUsd ? "" : "dim")}`}>
        {d.daysLeft !== null ? `${d.daysLeft}d` : ""}
        {d.feeUsd ? <span className="l-sub" style={{ display: "block" }}>${d.feeUsd.toFixed(0)}</span> : null}
      </span>
    </div>
  );
}

export default async function BusinessPage() {
  const items = await fetchDueItems();
  if (items === null) {
    return (
      <Chrome title="Business" sub="compliance register" active="/ops">
        <div className="card">
          <div className="meta">
            The compliance register (Supabase admin.v_due_items) is not reachable from
            this cockpit instance — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset or the
            query failed. Nothing is shown rather than an empty list that would read as
            &quot;nothing due&quot;.
          </div>
        </div>
      </Chrome>
    );
  }
  const overdue = items.filter((d) => band(d) === "overdue");
  const window = items.filter((d) => band(d) === "window");
  const later = items.filter((d) => band(d) === "later");
  const entities = Array.from(new Set(items.map((d) => d.entity))).filter(Boolean);
  const feesWindow = sumFees([...overdue, ...window]);

  return (
    <Chrome
      title="Business"
      sub={`${items.length} obligations · ${overdue.length} overdue · ${window.length} in window`}
      active="/ops"
    >
      <div className="grid">
        <div className={`tile ${overdue.length > 0 ? "hot" : window.length > 0 ? "warm" : "calm"}`}>
          <div className="big">{overdue.length + window.length}</div>
          <div className="label">due inside alert window</div>
        </div>
        <div className="tile calm">
          <div className="big">${feesWindow.toFixed(0)}</div>
          <div className="label">fees due in window</div>
        </div>
      </div>
      <div className="card">
        <div className="meta">
          Entities: {entities.join(" · ")}. Source: Supabase <span className="mono">admin.v_due_items</span>{" "}
          (live). Each row alerts inside its own <span className="mono">alert_days_before</span>; recurring
          rows roll forward in the database. See also the{" "}
          <Link href="/registers/calendar">calendar register</Link>.
        </div>
      </div>

      {overdue.length > 0 ? (
        <>
          <div className="section-head"><h2>Overdue</h2><span className="meta">{overdue.length}</span></div>
          <div className="ledger">{overdue.map((d, i) => <Row key={i} d={d} />)}</div>
        </>
      ) : null}
      <div className="section-head"><h2>In window</h2><span className="meta">{window.length}</span></div>
      {window.length === 0 ? (
        <div className="card"><div className="meta">Nothing inside its alert window.</div></div>
      ) : (
        <div className="ledger">{window.map((d, i) => <Row key={i} d={d} />)}</div>
      )}
      <div className="section-head"><h2>Later</h2><span className="meta">{later.length}</span></div>
      <div className="ledger">{later.map((d, i) => <Row key={i} d={d} />)}</div>
    </Chrome>
  );
}
