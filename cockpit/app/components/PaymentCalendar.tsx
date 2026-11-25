"use client";

import { useEffect, useRef, useState } from "react";
import { calendarEvents, nextPayments, type CalendarSubscription } from "@/lib/subscription-calendar";
import { ownerDay } from "@/lib/owner-loop";

type CalendarData = { today: string; subscriptions: CalendarSubscription[] };
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dateOf = (iso: string) => new Date(`${iso}T00:00:00Z`);

function charge(s: CalendarSubscription) {
  return s.chargeUsd === null ? "Charge unknown" : `${s.approximate ? "≈" : ""}${dollars.format(s.chargeUsd)}`;
}

function moveMonth(month: string, offset: number) {
  const d = dateOf(`${month}-01`);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().slice(0, 7);
}

export function PaymentCalendar() {
  const dialog = useRef<HTMLDialogElement>(null);
  const refresh = useRef<() => void>(() => {});
  const [data, setData] = useState<CalendarData | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<string | null>(null);

  useEffect(() => {
    let request: AbortController | undefined;
    let loadedDay = "";
    function load() {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      void (async () => {
        try {
          const res = await fetch("/api/money/calendar", { cache: "no-store", signal: controller.signal });
          if (!res.ok) throw new Error();
          const next: CalendarData = await res.json();
          if (!controller.signal.aborted) { setData(next); setFailed(false); loadedDay = next.today; }
        } catch {
          if (!controller.signal.aborted) { setData(null); setFailed(true); }
        }
      })();
    }
    const visible = () => { if (!document.hidden) load(); };
    refresh.current = load;
    load();
    window.addEventListener("subscriptions-changed", load);
    document.addEventListener("visibilitychange", visible);
    const clock = window.setInterval(() => {
      if (!document.hidden && loadedDay !== ownerDay(new Date().toISOString())) load();
    }, 60_000);
    return () => {
      request?.abort();
      window.removeEventListener("subscriptions-changed", load);
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(clock);
    };
  }, []);

  const next = data ? nextPayments(data.subscriptions, data.today) : [];
  const first = next[0];
  const title = first ? `Next payment · ${shortDate.format(dateOf(first.date))}` : "Next payment";
  const summary = first ? `${first.subscription.service} · ${charge(first.subscription)}${first.subscription.billingNote ? ` · ${first.subscription.billingNote}` : ""}${next.length > 1 ? ` (+${next.length - 1} more)` : ""}`
    : failed ? "Calendar unavailable" : data ? "No payment scheduled" : "Loading calendar…";
  const visibleMonth = month ?? (first?.date ?? data?.today)?.slice(0, 7);

  return <>
    <button type="button" className="header-button next-payment-box" aria-haspopup="dialog" aria-expanded={open}
      aria-controls="payment-calendar" aria-label={`${title}. ${summary}. Open subscription calendar.`}
      onClick={() => { setMonth(null); dialog.current?.showModal(); setOpen(true); }}>
      <span className="next-payment-label">{title}</span><span className="next-payment-summary">{first ? <>
        <span className="next-payment-service">{first.subscription.service}{first.subscription.billingNote ? ` · ${first.subscription.billingNote}` : ""}</span>
        <span>· {charge(first.subscription)}{next.length > 1 ? ` (+${next.length - 1} more)` : ""}</span>
      </> : summary}</span>
    </button>
    <dialog id="payment-calendar" ref={dialog} className="payment-calendar" aria-labelledby="payment-calendar-title" onClose={() => setOpen(false)}>
      <div className="calendar-heading"><h2 id="payment-calendar-title" tabIndex={-1} autoFocus>Subscription calendar</h2>
        <button type="button" className="header-button" onClick={() => dialog.current?.close()}>Close</button>
      </div>
      {open && (data && visibleMonth ? <CalendarContents data={data} month={visibleMonth} setMonth={setMonth} /> : failed ?
        <div><p role="alert">The subscription calendar couldn’t be loaded.</p><button type="button" className="header-button" onClick={() => refresh.current()}>Retry</button></div> :
        <p role="status">Loading calendar…</p>)}
    </dialog>
  </>;
}

function CalendarContents({ data, month, setMonth }: { data: CalendarData; month: string; setMonth: (month: string) => void }) {
  const start = `${month}-01`;
  const endDate = dateOf(start);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1, 0);
  const end = endDate.toISOString().slice(0, 10);
  const events = calendarEvents(data.subscriptions, start, end);
  const byDate = new Map<string, CalendarSubscription[]>();
  for (const { date, subscription } of events) {
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(subscription);
  }
  const offset = dateOf(start).getUTCDay();
  const weeks = Math.ceil((offset + endDate.getUTCDate()) / 7);
  const label = monthName.format(dateOf(start));

  return <>
    <div className="calendar-month-nav">
      <h3 aria-live="polite">{label}</h3>
      <div><button type="button" className="header-button" aria-label="Previous month" disabled={month <= "0001-01"} onClick={() => setMonth(moveMonth(month, -1))}>‹</button>
        <button type="button" className="header-button" onClick={() => setMonth(data.today.slice(0, 7))}>This month</button>
        <button type="button" className="header-button" aria-label="Next month" disabled={month >= "9999-12"} onClick={() => setMonth(moveMonth(month, 1))}>›</button></div>
    </div>
    <table className="payment-grid" aria-label={`Payment dates for ${label}`}>
      <thead><tr>{weekdays.map((day) => <th key={day} scope="col" aria-label={day}>{day.slice(0, 3)}</th>)}</tr></thead>
      <tbody>{Array.from({ length: weeks }, (_, week) => <tr key={week}>{weekdays.map((day, col) => {
        const n = week * 7 + col - offset + 1;
        if (n < 1 || n > endDate.getUTCDate()) return <td key={day} />;
        const date = `${month}-${String(n).padStart(2, "0")}`;
        const payments = byDate.get(date);
        return <td key={day} className={date === data.today ? "calendar-today" : undefined}>
          {payments ? <button type="button" className="calendar-day" aria-current={date === data.today ? "date" : undefined}
            aria-label={`${shortDate.format(dateOf(date))}, ${payments.length} ${payments.length === 1 ? "payment" : "payments"}. Show details.`}
            onClick={() => document.getElementById(`payments-on-${date}`)?.focus()}>
            <span>{n}</span><span className="calendar-service">{payments[0].service}{payments.length > 1 ? ` +${payments.length - 1}` : ""}</span>
            <span className="calendar-count" aria-hidden="true">{payments.length}</span>
          </button> : <span className="calendar-day-number" aria-current={date === data.today ? "date" : undefined}>{n}</span>}
        </td>;
      })}</tr>)}</tbody>
    </table>
    <section aria-label="Payments this month" className="calendar-agenda">
      {byDate.size === 0 ? <p>No payments scheduled for {label}.</p> : Array.from(byDate, ([date, subscriptions]) =>
        <div key={date}><h4 id={`payments-on-${date}`} tabIndex={-1}>{shortDate.format(dateOf(date))}</h4>
          <ul>{subscriptions.map((s) => <li key={s.service}><span>{s.service}<small>{[s.cadence || "Cadence unknown", s.billingNote].filter(Boolean).join(" · ")}</small></span><strong>{charge(s)}</strong></li>)}</ul>
        </div>)}
    </section>
    <details className="calendar-inventory"><summary>All subscriptions ({data.subscriptions.length})</summary>
      {data.subscriptions.length ? <ul>{data.subscriptions.map((s) => {
        const next = nextPayments([s], data.today)[0];
        const schedule = next ? `Next ${shortDate.format(dateOf(next.date))}` : "No payment scheduled";
        const recorded = !next && s.renewalRaw ? `Recorded renewal: ${s.renewalRaw}` : "";
        return <li key={s.service}><span>{s.service}<small>{[s.plan, s.cadence || "Cadence unknown", schedule, recorded, s.billingNote || (!s.active && s.status)].filter(Boolean).join(" · ")}</small></span>
          <strong>{charge(s)}</strong></li>;
      })}</ul> : <p>No subscriptions recorded.</p>}
    </details>
    <a className="calendar-manage" href="/money">Manage subscriptions</a>
  </>;
}
