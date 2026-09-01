// One business-register table (licences, obligations, contacts, …): every row
// as an editable card, grouped by status, with a new-row form. Data: Supabase
// admin.* via service-role views; writes via guarded RPCs.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chrome } from "../../components/Chrome";
import { daysUntil, fetchRows, statusClass, tableBySlug, TABLES, type Row } from "@/lib/business";
import { sbSelect, supabaseConfigured } from "@/lib/supabase-rest";
import { RowCard } from "../RowCard";
import { NewRowForm } from "../NewRowForm";

export const dynamic = "force-dynamic";

async function parentsFor(kind: "entity" | "person" | undefined): Promise<{ id: string; name: string }[]> {
  if (!kind || !supabaseConfigured()) return [];
  try {
    if (kind === "entity") {
      return await sbSelect<{ id: string; name: string }>("v_admin_entities", "select=id,name&order=type.asc,name.asc");
    }
    return await sbSelect<{ id: string; name: string }>("v_admin_people", "select=id,name&order=name.asc");
  } catch {
    return [];
  }
}

export default async function BusinessTablePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spec = tableBySlug(slug);
  if (!spec) notFound();

  const [rows, parents] = await Promise.all([fetchRows(spec), parentsFor(spec.parent)]);
  const todayIso = new Date().toISOString().slice(0, 10);

  if (rows === null) {
    return (
      <Chrome title={spec.title} sub="business register" active="/business">
        <div className="card">
          <div className="meta">
            Supabase admin.* is not reachable from this cockpit instance (SUPABASE_URL /
            SUPABASE_SERVICE_ROLE_KEY unset or the query failed). Nothing is shown rather than
            an empty list that would read as &quot;nothing on file&quot;.
          </div>
        </div>
      </Chrome>
    );
  }

  const badgesFor = (r: Row) => {
    const out: { text: string; cls: string }[] = [];
    if (spec.statusField && r[spec.statusField]) {
      out.push({ text: String(r[spec.statusField]), cls: statusClass(r[spec.statusField]) });
    }
    if (spec.dateField) {
      const d = daysUntil(r[spec.dateField], todayIso);
      if (d !== null && spec.dateField !== "last_contact_at" && spec.dateField !== "last_verified_at") {
        out.push({ text: d < 0 ? `${-d}d overdue` : `${d}d`, cls: d < 0 ? "bad" : d <= 30 ? "warn" : "" });
      }
    }
    return out;
  };

  // Group by status (spec order) when the table has one; else one flat list.
  const groups: { key: string; rows: Row[] }[] = [];
  if (spec.statusField) {
    const order = spec.fields.find((f) => f.key === spec.statusField)?.options ?? [];
    const seen = new Set<string>();
    for (const s of [...order, ...rows.map((r) => String(r[spec.statusField!] ?? ""))]) {
      if (seen.has(s)) continue;
      seen.add(s);
      const g = rows.filter((r) => String(r[spec.statusField!] ?? "") === s);
      if (g.length) groups.push({ key: s || "(no status)", rows: g });
    }
  } else if (slug === "contacts") {
    const cats = spec.fields.find((f) => f.key === "category")?.options ?? [];
    for (const c of cats) {
      const g = rows.filter((r) => r.category === c);
      if (g.length) groups.push({ key: c.replace(/_/g, " "), rows: g });
    }
  } else {
    groups.push({ key: "all", rows });
  }

  const sub = spec.statusField
    ? groups.map((g) => `${g.rows.length} ${g.key}`).join(" · ")
    : `${rows.length} on file`;

  return (
    <Chrome title={spec.title} sub={sub} active="/business">
      <div className="chips" style={{ marginTop: 0, marginBottom: 12 }}>
        <Link href="/business" className="chip">
          ← business
        </Link>
        {TABLES.filter((t) => t.slug !== slug).map((t) => (
          <Link key={t.slug} href={`/business/${t.slug}`} className="chip">
            {t.title.toLowerCase()}
          </Link>
        ))}
      </div>

      {spec.insertable ? <NewRowForm spec={spec} parents={parents} /> : null}

      {rows.length === 0 ? (
        <div className="card">
          <div className="meta">Nothing on file yet.</div>
        </div>
      ) : null}

      {groups.map((g) => (
        <section key={g.key}>
          <div className="section-head">
            <h2>{g.key}</h2>
            <span className="meta">{g.rows.length}</span>
          </div>
          {g.rows.map((r) => (
            <RowCard key={r.id} spec={spec} row={r} badges={badgesFor(r)} />
          ))}
        </section>
      ))}
    </Chrome>
  );
}
