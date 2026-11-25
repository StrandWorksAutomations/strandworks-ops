import type { MoneyView } from "./money";

export type Recurrence = "weekly" | "monthly" | "quarterly" | "annually";

export type CalendarSubscription = {
  service: string;
  plan: string;
  cadence: string;
  status: string;
  billingNote: string | null;
  chargeUsd: number | null;
  approximate: boolean;
  anchor: string | null;
  renewalRaw: string;
  active: boolean;
  recurrence: Recurrence | null;
};

export type CalendarEvent = { date: string; subscription: CalendarSubscription };

const MONTHLY_WITH_DAY = /^monthly\s*\(([1-9]|[12]\d|3[01])(?:st|nd|rd|th)\)$/i;
const MONTHS_PER_CYCLE = { monthly: 1, quarterly: 3, annually: 12 };
const WEEK_MS = 7 * 86_400_000;
const BILLING_NOTES = new Map([
  ["paused-but-billing", "Paused, still billing"],
  ["refund-requested", "Refund requested"],
  ["do-not-renew", "Do not renew"],
]);

export function parseBillingCadence(raw: string): Recurrence | null {
  const value = raw.trim().toLowerCase();
  if (value === "weekly" || value === "monthly" || value === "quarterly") return value;
  if (value === "annual" || value === "annually" || value === "yearly") return "annually";
  return MONTHLY_WITH_DAY.test(value) ? "monthly" : null;
}

// Dates in the register are billing calendar days, independent of the host time zone.
export function isCalendarDay(value: string): boolean {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value + "T");
}

export function calendarSubscriptions(view: MoneyView): CalendarSubscription[] {
  return view.items.map((item) => {
    const rawDay = item.renewalRaw.trim();
    const anchor = isCalendarDay(rawDay) ? rawDay : null;
    const dayHint = item.cadence.trim().match(MONTHLY_WITH_DAY);
    const cadence = parseBillingCadence(item.cadence);
    const dayConflict = dayHint && anchor && Number(dayHint[1]) !== Number(anchor.slice(-2));
    const status = item.status.trim().toLowerCase();
    const verdict = item.verdict.trim().toLowerCase();
    const cancellationNote = verdict === "pending-cancel" ? "Cancellation pending" : verdict === "cancel" ? "Marked for cancellation" : null;
    const statusNote = BILLING_NOTES.get(status);
    const billingNote = cancellationNote ?? statusNote ?? null;
    const recurrence = dayConflict || cancellationNote || status === "do-not-renew" ? null : cadence;
    // The legacy register stores a monthly equivalent, even for annual plans.
    const monthlyFallback = !item.chargeRaw && cadence === "monthly" && /^~?\$?\d+(?:\.\d{1,2})?\+?$/.test(item.costRaw);
    const billable = /^active(?:$|[- ])/.test(status) || status === "keep" || !!statusNote;
    return {
      service: item.service, plan: item.plan, cadence: item.cadence, status: item.status, billingNote,
      chargeUsd: monthlyFallback ? item.costUsd : item.chargeUsd,
      approximate: monthlyFallback && item.costApprox,
      anchor, renewalRaw: item.renewalRaw,
      active: billable && !item.oneTime,
      recurrence,
    };
  });
}

// Compute each month from the original billing day, so a January 31 charge
// returns to the 31st in March and a leap-day charge returns to February 29.
function paymentOnOrAfter(sub: CalendarSubscription, since: string): string | null {
  if (!sub.active || !sub.anchor) return null;
  if (sub.anchor >= since) return sub.anchor;
  if (!sub.recurrence) return null;
  const anchor = new Date(sub.anchor + "T00:00:00Z");
  const start = new Date(since + "T00:00:00Z");
  let due: Date;
  if (sub.recurrence === "weekly") {
    const weeks = Math.ceil((start.getTime() - anchor.getTime()) / WEEK_MS);
    due = new Date(anchor.getTime() + weeks * WEEK_MS);
  } else {
    const interval = MONTHS_PER_CYCLE[sub.recurrence];
    const months = (start.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + start.getUTCMonth() - anchor.getUTCMonth();
    const monthDue = (offset: number) => {
      const end = new Date(anchor);
      end.setUTCMonth(anchor.getUTCMonth() + offset + 1, 0);
      end.setUTCDate(Math.min(anchor.getUTCDate(), end.getUTCDate()));
      return end;
    };
    const offset = Math.floor(months / interval) * interval;
    due = monthDue(offset);
    if (due < start) due = monthDue(offset + interval);
  }
  return due.getUTCFullYear() <= 9999 ? due.toISOString().slice(0, 10) : null;
}

function orderEvents(a: CalendarEvent, b: CalendarEvent): number {
  return a.date.localeCompare(b.date) || a.subscription.service.localeCompare(b.subscription.service);
}

export function calendarEvents(subs: CalendarSubscription[], startIso: string, endIso: string): CalendarEvent[] {
  if (!isCalendarDay(startIso) || !isCalendarDay(endIso) || startIso > endIso) return [];
  const events: CalendarEvent[] = [];
  for (const subscription of subs) {
    let date = paymentOnOrAfter(subscription, startIso);
    while (date && date <= endIso) {
      events.push({ date, subscription });
      if (!subscription.recurrence || date === endIso) break;
      const tomorrow = new Date(date + "T00:00:00Z");
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      date = paymentOnOrAfter(subscription, tomorrow.toISOString().slice(0, 10));
    }
  }
  return events.sort(orderEvents);
}

export function nextPayments(subs: CalendarSubscription[], todayIso: string): CalendarEvent[] {
  if (!isCalendarDay(todayIso)) return [];
  const events: CalendarEvent[] = [];
  for (const subscription of subs) {
    const date = paymentOnOrAfter(subscription, todayIso);
    if (date) events.push({ date, subscription });
  }
  events.sort(orderEvents);
  return events.filter((event) => event.date === events[0].date);
}
