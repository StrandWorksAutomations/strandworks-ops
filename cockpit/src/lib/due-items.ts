// Business dates — the compliance/ops register in Supabase (admin.obligations
// et al., surfaced through admin.v_due_items → public.v_admin_due_items). The
// database is the source of truth for these rows (registered in
// registers/calendar.csv); this module only reads and shapes them.
import { sbSelect, supabaseConfigured } from "./supabase-rest";

export type DueItem = {
  entity: string;
  kind: string;
  item: string;
  jurisdiction: string | null;
  dueOn: string | null; // YYYY-MM-DD
  daysLeft: number | null;
  status: string;
  feeUsd: number | null;
  alertDaysBefore: number | null;
};

type Row = {
  entity: string | null;
  kind: string | null;
  item: string | null;
  jurisdiction: string | null;
  due_on: string | null;
  days_left: number | null;
  status: string | null;
  fee_usd: string | number | null;
  alert_days_before: number | null;
};

export function shapeDueItem(r: Row): DueItem {
  const fee = r.fee_usd === null || r.fee_usd === undefined ? null : Number(r.fee_usd);
  return {
    entity: r.entity ?? "",
    kind: r.kind ?? "",
    item: r.item ?? "",
    jurisdiction: r.jurisdiction,
    dueOn: r.due_on,
    daysLeft: r.days_left,
    status: r.status ?? "",
    feeUsd: Number.isFinite(fee as number) ? (fee as number) : null,
    alertDaysBefore: r.alert_days_before,
  };
}

// null ⇒ the backend isn't configured or unreachable; the UI says so rather
// than rendering an empty list as if nothing were due.
export async function fetchDueItems(): Promise<DueItem[] | null> {
  if (!supabaseConfigured()) return null;
  try {
    const rows = await sbSelect<Row>(
      "v_admin_due_items",
      "select=entity,kind,item,jurisdiction,due_on,days_left,status,fee_usd,alert_days_before&order=due_on.asc.nullslast&limit=200",
    );
    return rows.map(shapeDueItem);
  } catch {
    return null;
  }
}

// Alerting window: an item is "in window" when days_left ≤ its own
// alert_days_before (default 30). Overdue ⇒ days_left < 0.
export function inAlertWindow(d: DueItem): boolean {
  if (d.daysLeft === null) return false;
  return d.daysLeft <= (d.alertDaysBefore ?? 30);
}

export function sumFees(items: DueItem[]): number {
  return Math.round(items.reduce((s, d) => s + (d.feeUsd ?? 0), 0) * 100) / 100;
}
