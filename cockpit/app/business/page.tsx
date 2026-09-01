// Business — the whole-company register in one place: entities (LLCs),
// licences, obligations, contacts (medical directors, CPA, attorney, brokers),
// people + credentials, insurance, documents, accounts. Source: Supabase
// admin.* through service-role views; every table is editable at /business/<slug>.
// Dates section = admin.v_due_items (what is due, grouped by urgency).
import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { fetchDueItems, inAlertWindow, sumFees, type DueItem } from "@/lib/due-items";
import { fetchCounts, fetchRows, tableBySlug, TABLES, type Row } from "@/lib/business";
import { redactForDisplay } from "@/lib/redact";

export const dynamic = "force-dynamic";

const KEY_CONTACT_CATEGORIES = ["medical_director", "cpa", "attorney", "registered_agent", "insurance_broker", "payroll", "bank"] as const;

function band(d: DueItem): "overdue" | "window" | "later" {
  if (d.daysLeft !== null && d.daysLeft < 0) return "overdue";
  if (inAlertWindow(d)) return "window";
  return "later";
}

function DueRow({ d }: { d: DueItem }) {
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
  const contactsSpec = tableBySlug("contacts")!;
  const entitiesSpec = tableBySlug("entities")!;
  const [items, counts, contacts, entities] = await Promise.all([
    fetchDueItems(),
    fetchCounts(),
    fetchRows(contactsSpec),
    fetchRows(entitiesSpec),
  ]);

  if (items === null && counts === null) {
    return (
      <Chrome title="Business" sub="company register" active="/business">
        <div className="card">
          <div className="meta">
            The business register (Supabase admin.*) is not reachable from this cockpit
            instance — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset or the query failed.
            Nothing is shown rather than an empty register that would read as &quot;nothing on file&quot;.
          </div>
        </div>
      </Chrome>
    );
  }

  const due = items ?? [];
  const overdue = due.filter((d) => band(d) === "overdue");
  const window = due.filter((d) => band(d) === "window");
  const later = due.filter((d) => band(d) === "later");
  const feesWindow = sumFees([...overdue, ...window]);

  const keyContacts: Row[] = (contacts ?? []).filter((c) =>
    (KEY_CONTACT_CATEGORIES as readonly string[]).includes(String(c.category)),
  );
  const missingKey = KEY_CONTACT_CATEGORIES.filter((k) => !keyContacts.some((c) => c.category === k));

  const sub = [
    `${(entities ?? []).length} entities`,
    `${due.length} dated obligations`,
    overdue.length ? `${overdue.length} overdue` : null,
    window.length ? `${window.length} in window` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Chrome title="Business" sub={sub} active="/business">
      <div className="section-head">
        <h2>Entities</h2>
        <Link href="/business/entities">edit →</Link>
      </div>
      <div className="ledger">
        {(entities ?? []).map((e) => (
          <Link key={e.id} href="/business/entities" className="l-row">
            <span className="l-name">
              {String(e.name)}
              <span className="l-sub" style={{ display: "block" }}>
                {[e.legal_name, e.type].filter(Boolean).map(String).join(" · ")}
              </span>
            </span>
            <span className={`l-amount ${e.is_active ? "" : "dim"}`}>{e.is_active ? "active" : "inactive"}</span>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2>Register</h2>
        <span className="meta">edit any table</span>
      </div>
      <div className="grid">
        {TABLES.map((t) => {
          const n = counts?.[t.slug];
          return (
            <Link key={t.slug} href={`/business/${t.slug}`} className={`tile ${n === 0 ? "warm" : "calm"}`}>
              <div className="big">{n === null || n === undefined ? "—" : n}</div>
              <div className="label">{t.title}</div>
              <div className="meta" style={{ marginTop: 4 }}>{t.blurb}</div>
            </Link>
          );
        })}
      </div>

      <div className="section-head">
        <h2>Key people</h2>
        <Link href="/business/contacts">contacts →</Link>
      </div>
      {keyContacts.length === 0 ? (
        <div className="card">
          <div className="meta">No medical director, CPA, attorney, registered agent, broker, payroll, or bank contact on file.</div>
        </div>
      ) : (
        <div className="ledger">
          {keyContacts.map((c) => (
            <Link key={c.id} href="/business/contacts" className="l-row">
              <span className="l-name" style={{ whiteSpace: "normal" }}>
                {String(c.organization ?? c.name ?? "—")}
                <span className="l-sub" style={{ display: "block" }}>
                  {[c.name !== c.organization ? c.name : null, c.title, c.email, c.phone].filter(Boolean).map(String).join(" · ")}
                </span>
              </span>
              <span className="l-amount dim">{String(c.category).replace(/_/g, " ")}</span>
            </Link>
          ))}
        </div>
      )}
      {missingKey.length ? (
        <div className="chips">
          {missingKey.map((k) => (
            <Link key={k} href="/business/contacts" className="chip">
              no {k.replace(/_/g, " ")} on file
            </Link>
          ))}
        </div>
      ) : null}

      <div className="section-head">
        <h2>Dates</h2>
        <span className="meta">
          {feesWindow ? `$${feesWindow.toFixed(0)} due in window · ` : ""}
          <Link href="/business/obligations">obligations →</Link>
        </span>
      </div>
      {items === null ? (
        <div className="card">
          <div className="meta">Due-items view unreachable.</div>
        </div>
      ) : null}
      {overdue.length > 0 ? (
        <>
          <div className="section-head"><h2>Overdue</h2><span className="meta">{overdue.length}</span></div>
          <div className="ledger">{overdue.map((d, i) => <DueRow key={i} d={d} />)}</div>
        </>
      ) : null}
      <div className="section-head"><h2>In window</h2><span className="meta">{window.length}</span></div>
      {window.length === 0 ? (
        <div className="card"><div className="meta">Nothing inside its alert window.</div></div>
      ) : (
        <div className="ledger">{window.map((d, i) => <DueRow key={i} d={d} />)}</div>
      )}
      <div className="section-head"><h2>Later</h2><span className="meta">{later.length}</span></div>
      <div className="ledger">{later.map((d, i) => <DueRow key={i} d={d} />)}</div>
    </Chrome>
  );
}
