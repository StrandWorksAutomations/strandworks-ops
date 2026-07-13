// The attention queue — the cockpit's triage board.
//
// One ordered list of "things that need the owner", assembled from what the
// registers and governance files ALREADY say needs action. Nothing here is
// invented: every item traces to a calendar row with an open action, a pending
// decision file, a subscription the register itself flags, or an asset the
// register marks as a single copy.

import { parseCsv } from "./csv";
import { buildMoneyView, type MoneyView } from "./money";

export type Severity = "now" | "soon" | "watch";

export type AttentionItem = {
  severity: Severity;
  dateIso: string | null; // the deadline driving urgency, if dated
  title: string;
  detail: string;
  href: string; // where in the cockpit to act on it
  kind: "decision" | "deadline" | "money" | "asset";
};

const SEVERITY_RANK: Record<Severity, number> = { now: 0, soon: 1, watch: 2 };

function dateSeverity(dateIso: string | null, todayIso: string): Severity {
  if (!dateIso) return "watch";
  if (dateIso <= addDaysIso(todayIso, 7)) return "now"; // overdue or this week
  if (dateIso <= addDaysIso(todayIso, 30)) return "soon";
  return "watch";
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type AttentionInputs = {
  calendarCsv?: string | null;
  subscriptionsCsv?: string | null;
  assetsCsv?: string | null;
  pendingDecisions?: { title: string; file: string }[];
  todayIso: string;
};

export function buildAttentionQueue(inputs: AttentionInputs): AttentionItem[] {
  const items: AttentionItem[] = [];
  const today = inputs.todayIso;

  // 1. Pending decisions — always "now": the fabric is waiting on a ruling.
  for (const d of inputs.pendingDecisions ?? []) {
    items.push({
      severity: "now",
      dateIso: null,
      title: d.title,
      detail: "pending ruling",
      href: "/decisions",
      kind: "decision",
    });
  }

  // 2. Calendar rows with an OPEN action (skip rows the register marks DONE).
  if (inputs.calendarCsv) {
    for (const row of parseCsv(inputs.calendarCsv).rows) {
      const action = (row["action_needed"] ?? "").trim();
      if (action === "" || /^done\b/i.test(action)) continue;
      const dateIso = /^\d{4}-\d{2}-\d{2}$/.test((row["date"] ?? "").trim())
        ? (row["date"] ?? "").trim()
        : null;
      items.push({
        severity: dateSeverity(dateIso, today),
        dateIso,
        title: row["item"] || "(undated item)",
        detail: action,
        href: "/registers/calendar",
        kind: "deadline",
      });
    }
  }

  // 3. Money flags straight from the subscriptions register's own statuses.
  if (inputs.subscriptionsCsv) {
    const money: MoneyView = buildMoneyView(inputs.subscriptionsCsv);
    for (const it of money.items) {
      const s = it.status.toLowerCase();
      if (/refund-requested|do-not-renew|paused-but-billing|owner-review|unswept/.test(s)) {
        items.push({
          severity: it.renewalIso ? dateSeverity(it.renewalIso, today) : "soon",
          dateIso: it.renewalIso,
          title: `${it.service} — ${it.status}`,
          detail: it.notes,
          href: "/money",
          kind: "money",
        });
      }
    }
    if (money.byClass.hidden.count > 0) {
      items.push({
        severity: "soon",
        dateIso: null,
        title: `${money.byClass.hidden.count} hidden subscriptions from the bank sweep`,
        detail: `$${money.byClass.hidden.totalUsd.toFixed(2)}/mo known across them — verify each: keep, cancel, or reclassify`,
        href: "/money",
        kind: "money",
      });
    }
    if (money.uncostedCount > 0) {
      items.push({
        severity: "watch",
        dateIso: null,
        title: `${money.uncostedCount} recurring services with no cost on record`,
        detail: "the burn floor is understated until these are costed",
        href: "/money",
        kind: "money",
      });
    }
  }

  // 4. Single-copy assets — the register's own canonical column says so.
  if (inputs.assetsCsv) {
    for (const row of parseCsv(inputs.assetsCsv).rows) {
      if (/only-copy/i.test(row["canonical"] ?? "")) {
        items.push({
          severity: "soon",
          dateIso: null,
          title: `Single copy: ${row["asset"] || "(unnamed asset)"}`,
          detail: `${row["location"] ?? ""} — not backed up anywhere else`,
          href: "/registers/assets",
          kind: "asset",
        });
      }
    }
  }

  return items.sort((a, b) => {
    const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (s !== 0) return s;
    // Pending decisions pin to the top of their band: the fabric is blocked.
    const d = (a.kind === "decision" ? 0 : 1) - (b.kind === "decision" ? 0 : 1);
    if (d !== 0) return d;
    if (a.dateIso && b.dateIso) return a.dateIso.localeCompare(b.dateIso);
    if (a.dateIso) return -1;
    if (b.dateIso) return 1;
    return 0;
  });
}
