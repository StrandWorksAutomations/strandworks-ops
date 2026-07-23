"use client";
// The Operate page's interactive island: renders the three-rail cockpit
// (left rail, live event river, decision dock) from a snapshot, polls
// /api/operate/feed for fresh data, animates newly-arrived river rows, and
// posts answers to /api/operate/answer. All colour comes from event severity.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  groupIntoBands,
  type OperateSnapshot,
  type RiverEvent,
  type RiverCategory,
  type PendingDecision,
} from "@/lib/operate";

const POLL_MS = 7000;
const NAV = [
  { label: "Operate", href: "/operate", active: true },
  { label: "Projects", href: "/projects", active: false },
  { label: "Decisions", href: "/decisions", active: false },
  { label: "Records", href: "/registers", active: false },
  { label: "Systems", href: "/ops", active: false },
];
const FILTERS: { key: "all" | RiverCategory; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "agent", label: "AGENTS" },
  { key: "deploy", label: "DEPLOYS" },
  { key: "decision", label: "DECISIONS" },
  { key: "scout", label: "SCOUTS" },
];

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fmtClock(d: Date): string {
  const p = (n: number) => (n < 10 ? "0" + n : "" + n);
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function fmtEventTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return fmtClock(d);
}

export function OperateClient({ initial }: { initial: OperateSnapshot }) {
  const [snap, setSnap] = useState<OperateSnapshot>(initial);
  const [filter, setFilter] = useState<"all" | RiverCategory>("all");
  const [clock, setClock] = useState<string>("");
  const [entering, setEntering] = useState<Set<string>>(new Set());
  // Locally resolved decisions (optimistic): questionId -> chosen label.
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const seenIds = useRef<Set<string>>(new Set(initial.events.map((e) => e.id)));
  const reduce = useRef<boolean>(false);

  useEffect(() => {
    reduce.current = prefersReducedMotion();
  }, []);

  // Clock tick.
  useEffect(() => {
    const tick = () => setClock(fmtClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Poll for fresh snapshots.
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/operate/feed", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const next = (await res.json()) as OperateSnapshot;
        if (!alive) return;
        // Flag genuinely new river rows for the arrival animation.
        const fresh = next.events.filter((e) => !seenIds.current.has(e.id)).map((e) => e.id);
        for (const e of next.events) seenIds.current.add(e.id);
        setSnap(next);
        // Drop optimistic resolutions the server now confirms as gone.
        setResolved((prev) => {
          const stillPending = new Set(next.pending.map((p) => p.questionId));
          const out: Record<string, string> = {};
          for (const [qid, label] of Object.entries(prev)) if (stillPending.has(qid)) out[qid] = label;
          return out;
        });
        if (fresh.length && !reduce.current) {
          setEntering(new Set(fresh));
          setTimeout(() => setEntering(new Set()), 700);
        }
      } catch {
        /* transient; next poll retries */
      }
    };
    const id = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const filteredEvents = useMemo(
    () => (filter === "all" ? snap.events : snap.events.filter((e) => e.category === filter)),
    [snap.events, filter]
  );
  const bands = useMemo(() => groupIntoBands(filteredEvents, Date.now()), [filteredEvents]);

  const pendingCount = snap.pending.filter((p) => !resolved[p.questionId]).length;
  const allSystemsNominal = snap.systems.every((s) => s.severity !== "warn" && s.severity !== "crit");

  return (
    <div className="op-root">
      <header className="op-topbar">
        <div className="op-brand">
          <span className="op-wordmark">
            STRANDWORKS <span>// OPERATE</span>
          </span>
          <span className="op-wordmark-sub">dashboard.strandautomationworks.com</span>
        </div>
        <div className="op-topbar-right">
          <span className={`op-status-pill${allSystemsNominal && snap.feedOk ? "" : " op-degraded"}`}>
            <span className={`op-led${allSystemsNominal && snap.feedOk ? "" : " op-amber"}`} />
            {snap.feedOk ? (allSystemsNominal ? "ALL SYSTEMS NOMINAL" : "ATTENTION") : "FEED OFFLINE"}
          </span>
          <span className="op-clock" suppressHydrationWarning>
            {clock || "--:--:--"}
          </span>
          <form action="/api/auth/logout" method="post">
            <button className="op-lock-btn" type="submit">
              LOCK
            </button>
          </form>
        </div>
      </header>

      <div className="op-shell">
        {/* LEFT RAIL */}
        <div className="op-rail-left">
          <nav className="op-card op-nav-card" aria-label="Sections">
            <ul className="op-nav-list">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className={n.active ? "op-active" : ""}>
                    <span className="op-n-dot" />
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="op-card">
            <p className="op-card-title">
              <span className="op-led" />
              Agent Presence
            </p>
            {snap.agents.map((a) => (
              <div key={a.agent} className={`op-agent-row${a.active ? " op-active" : ""}`}>
                <div className="op-agent-head">
                  <span className="op-agent-heartbeat" />
                  <span className="op-agent-name">{a.agent.toUpperCase()}</span>
                  <span className="op-agent-status">{a.status}</span>
                </div>
                <div className="op-agent-task">{a.detail}</div>
              </div>
            ))}
          </section>

          <section className="op-card">
            <p className="op-card-title">
              <span className="op-led" />
              Systems
            </p>
            {snap.systems.length === 0 ? (
              <div className="op-dock-empty">No services registered.</div>
            ) : (
              snap.systems.map((s) => (
                <div
                  key={s.name}
                  className={`op-sys-row${s.severity === "warn" || s.severity === "crit" ? " op-warn" : ""}`}
                >
                  <span className={`op-led${ledMod(s.severity)}`} />
                  <span className="op-sys-name">{s.name}</span>
                  <span className="op-sys-note">{s.note}</span>
                </div>
              ))
            )}
          </section>

          <section className="op-card">
            <p className="op-card-title">
              <span className="op-led" />
              Treasury
            </p>
            <div className="op-treasury-figure">
              <span className="op-label">Known burn</span>
              <span className="op-value">${snap.treasury.burnUsd.toFixed(0)}/mo</span>
            </div>
            <div className="op-treasury-figure">
              <span className="op-label">Runway</span>
              <span className="op-value">
                {snap.treasury.runwayMonths !== null ? `${snap.treasury.runwayMonths} mo` : "—"}
              </span>
            </div>
            <div className="op-runway-bar">
              <div
                className="op-runway-bar-fill"
                style={{ width: `${runwayPct(snap.treasury.runwayMonths)}%` }}
              />
            </div>
            {snap.treasury.pendingNote ? (
              <div className="op-treasury-pending">
                <span className="op-led op-amber" />
                {snap.treasury.pendingNote}
              </div>
            ) : null}
          </section>
        </div>

        {/* CENTER: THE RIVER */}
        <div className="op-river-col">
          <div className="op-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`op-filter-chip${filter === f.key ? " op-active" : ""}`}
                onClick={() => setFilter(f.key)}
                type="button"
              >
                {f.label}
              </button>
            ))}
            <span className={`op-live-indicator${snap.feedOk ? "" : " op-paused"}`}>
              <span className="op-led" />
              {snap.feedOk ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          <div className="op-river-bezel">
            <div className="op-river-screen">
              <div className="op-river-frame">
                {filteredEvents.length === 0 ? (
                  <div className="op-river-empty">
                    {snap.feedOk ? "No events in this view." : "Event feed unavailable."}
                  </div>
                ) : (
                  bands.map((band) => (
                    <div key={band.key}>
                      <div className={`op-band-divider${band.key === "now" ? " op-now-band" : ""}`}>
                        {band.label}
                      </div>
                      {band.events.length === 0 && band.key === "now" ? (
                        <div className="op-river-empty" style={{ padding: "8px 20px" }}>
                          quiet
                        </div>
                      ) : (
                        band.events.map((ev) => <EventRow key={ev.id} ev={ev} entering={entering.has(ev.id)} />)
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: DECISION DOCK */}
        <div className="op-rail-right">
          <section className="op-card">
            <div className="op-decisions-head">
              <p className="op-card-title">
                <span className={`op-led${pendingCount ? " op-amber" : ""}`} />
                Pending Decisions
              </p>
              <span className={`op-decisions-count${pendingCount ? "" : " op-zero"}`}>{pendingCount}</span>
            </div>
            <div className="op-decisions-scroll">
              {snap.pending.length === 0 ? (
                <div className="op-dock-empty">Nothing waiting on you.</div>
              ) : (
                snap.pending.map((d) => (
                  <DecisionCard
                    key={d.questionId}
                    d={d}
                    resolvedLabel={resolved[d.questionId]}
                    onResolved={(label) =>
                      setResolved((prev) => ({ ...prev, [d.questionId]: label }))
                    }
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ledMod(sev: RiverEvent["severity"]): string {
  if (sev === "warn" || sev === "crit") return " op-amber";
  if (sev === "info") return " op-ice";
  if (sev === "quiet") return " op-dim";
  return "";
}

function runwayPct(months: number | null): number {
  if (months === null) return 0;
  return Math.max(4, Math.min(100, Math.round((months / 24) * 100)));
}

function EventRow({ ev, entering }: { ev: RiverEvent; entering: boolean }) {
  return (
    <>
      <div className={`op-event-row op-sev-${ev.severity}${entering ? " op-entering" : ""}`}>
        <span className={`op-ev-bar op-sev-${ev.severity}`} />
        <span className="op-ev-time">{fmtEventTime(ev.ts)}</span>
        <span className="op-ev-chip">{ev.agent.toUpperCase()}</span>
        <span className="op-ev-proj">{ev.proj}</span>
        <span className="op-ev-msg">{ev.msg}</span>
      </div>
      {ev.detail ? (
        <div className={`op-event-card${entering ? " op-entering" : ""}`}>
          <div className="op-event-card-head">
            <b>{ev.detail.head}</b>
          </div>
          <div className="op-event-card-body">{ev.detail.body}</div>
        </div>
      ) : null}
    </>
  );
}

function DecisionCard({
  d,
  resolvedLabel,
  onResolved,
}: {
  d: PendingDecision;
  resolvedLabel?: string;
  onResolved: (label: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");

  const send = useCallback(
    async (opts: { answerValue?: string; freeText?: string; label: string }) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/operate/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: d.questionId,
            answerValue: opts.answerValue,
            freeText: opts.freeText,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `failed (${res.status})`);
        }
        onResolved(opts.label);
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed");
      } finally {
        setBusy(false);
      }
    },
    [d.questionId, onResolved]
  );

  const resolved = resolvedLabel !== undefined;

  return (
    <div className={`op-decision-card op-tier-${d.tier}${resolved ? " op-resolved" : ""}`}>
      <span className="op-decision-tier">{d.tier.toUpperCase()}</span>
      <div className="op-decision-q">{d.title}</div>
      <div className="op-decision-meta">
        <span className="op-source-chip">{d.agent.toUpperCase()}</span>
        {d.source !== "—" ? (
          <>
            <span className="op-dot-sep">·</span>
            <span>{d.source}</span>
          </>
        ) : null}
        <span className="op-dot-sep">·</span>
        <span>{d.ageLabel}</span>
      </div>

      {resolved ? (
        <div className="op-decision-resolved-note">✓ Sent — {resolvedLabel}</div>
      ) : (
        <>
          <div className="op-decision-actions">
            {d.options.length > 0 ? (
              d.options.map((o, i) => (
                <button
                  key={o.value + i}
                  className={`op-btn${i === 0 ? " op-primary" : ""}`}
                  disabled={busy}
                  type="button"
                  onClick={() => send({ answerValue: o.value, label: o.label })}
                >
                  {o.label}
                </button>
              ))
            ) : (
              <button
                className="op-btn op-primary"
                disabled={busy}
                type="button"
                onClick={() => send({ answerValue: "ack", label: "Acknowledged" })}
              >
                Acknowledge
              </button>
            )}
          </div>
          <div className="op-free-row">
            <input
              className="op-free-input"
              placeholder="Reply…"
              value={freeText}
              disabled={busy}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && freeText.trim()) send({ freeText, label: "Reply" });
              }}
            />
            <button
              className="op-btn"
              disabled={busy || !freeText.trim()}
              type="button"
              onClick={() => send({ freeText, label: "Reply" })}
            >
              Send
            </button>
          </div>
          {error ? <div className="op-decision-error">{error}</div> : null}
        </>
      )}
    </div>
  );
}
