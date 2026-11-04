"use client";
// The activity river and decision dock refresh from the current shared sources.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { Navigation } from "../components/Navigation";
import {
  formatOperateTime,
  groupIntoBands,
  type OperateSnapshot,
  type RiverEvent,
  type RiverCategory,
} from "@/lib/operate";

const POLL_MS = 30_000;
const FILTERS: { key: "all" | RiverCategory; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "report", label: "REPORTS" },
  { key: "owner-loop", label: "OWNER LOOP" },
];

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function OperateClient({ initial }: { initial: OperateSnapshot }) {
  const [snap, setSnap] = useState<OperateSnapshot>(initial);
  const [filter, setFilter] = useState<"all" | RiverCategory>("all");
  const [clock, setClock] = useState<string>("");
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [entering, setEntering] = useState<Set<string>>(new Set());
  const seenIds = useRef<Set<string>>(new Set(initial.events.map((e) => e.id)));
  const reduce = useRef<boolean>(false);

  useEffect(() => {
    reduce.current = prefersReducedMotion();
  }, []);

  // Clock tick.
  useEffect(() => {
    const tick = () => setClock(formatOperateTime(new Date().toISOString()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Poll for fresh snapshots.
  useEffect(() => {
    let alive = true;
    let inFlight = false;
    let arrivalTimer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      if (inFlight || document.hidden) return;
      inFlight = true;
      try {
        const res = await fetch("/api/operate/activity", { cache: "no-store" });
        if (!res.ok) throw new Error("activity request failed");
        if (!alive) return;
        const next = (await res.json()) as OperateSnapshot;
        if (!alive) return;
        // Flag genuinely new river rows for the arrival animation.
        const fresh = next.events.filter((e) => !seenIds.current.has(e.id)).map((e) => e.id);
        for (const e of next.events) seenIds.current.add(e.id);
        setSnap(next);
        setRefreshFailed(false);
        if (fresh.length && !reduce.current) {
          setEntering(new Set(fresh));
          clearTimeout(arrivalTimer);
          arrivalTimer = setTimeout(() => setEntering(new Set()), 700);
        }
      } catch {
        if (alive) setRefreshFailed(true);
      } finally {
        inFlight = false;
      }
    };
    const id = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
      clearTimeout(arrivalTimer);
    };
  }, []);

  const filteredEvents = useMemo(
    () => (filter === "all" ? snap.events : snap.events.filter((e) => e.category === filter)),
    [snap.events, filter]
  );
  const bands = useMemo(() => groupIntoBands(filteredEvents, Date.parse(snap.now)), [filteredEvents, snap.now]);

  const pendingCount = snap.pending?.length;
  const activityAvailable = snap.reportsAvailable || snap.ownerActivityAvailable;
  const activityComplete = snap.reportsAvailable && snap.ownerActivityAvailable;
  const sourcesUnavailable = !activityComplete || snap.pending === null || snap.systems === null || snap.treasury === null;
  const filteredSourceAvailable = filter === "report" ? snap.reportsAvailable : filter === "owner-loop" ? snap.ownerActivityAvailable : activityComplete;
  const systemsNeedAttention = snap.systems?.some((s) => s.severity === "warn" || s.severity === "crit");

  return (
    <div className="op-root">
      <AppHeader title="Operate" active="/operate" />
      <div className="op-status-line">
        <span className={`op-status-pill${refreshFailed || sourcesUnavailable || systemsNeedAttention ? " op-degraded" : ""}`}>
          <span className={`op-led${refreshFailed || sourcesUnavailable || systemsNeedAttention ? " op-amber" : ""}`} />
          {refreshFailed ? "Refresh failed · showing last check" : sourcesUnavailable ? "Some sources unavailable" : systemsNeedAttention ? "System attention" : "Sources available"}
        </span>
        <span className="op-clock">{clock || "--:--:--"} ET</span>
      </div>

      <main className="op-shell" id="main-content" tabIndex={-1}>
        {/* LEFT RAIL */}
        <div className="op-rail-left">
          <Navigation active="/operate" />

          <section className="op-card">
            <p className="op-card-title">
              <span className="op-led" />
              Agent Activity
            </p>
            {!activityAvailable ? <div className="op-dock-empty">Agent activity unavailable.</div> : null}
            {activityAvailable && snap.agents.length === 0 ? (
              <div className="op-dock-empty">{activityComplete ? "No recent agent activity recorded." : "No agent activity in the available source."}</div>
            ) : null}
            {snap.agents.map((a) => (
              <div key={a.agent} className="op-agent-row">
                <div className="op-agent-head">
                  <span className="op-agent-name">{a.agent.toUpperCase()}</span>
                  <span className="op-agent-status">{a.lastSeen}</span>
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
            {snap.systems === null ? (
              <div className="op-dock-empty">Services register unavailable.</div>
            ) : snap.systems.length === 0 ? (
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
            {snap.treasury === null ? (
              <div className="op-dock-empty">Subscriptions register unavailable.</div>
            ) : <>
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
            </>}
          </section>
        </div>

        {/* CENTER: THE RIVER */}
        <div className="op-river-col">
          <div className="op-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`op-filter-chip${filter === f.key ? " op-active" : ""}`}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                type="button"
              >
                {f.label}
              </button>
            ))}
            <span className="op-live-indicator">
              Checked {formatOperateTime(snap.now)} ET
            </span>
          </div>

          <div className="op-river-bezel">
            <div className="op-river-screen">
              <div className="op-river-frame">
                {!snap.reportsAvailable && filter !== "owner-loop" ? <div className="op-river-empty">Portfolio reports unavailable.</div> : null}
                {!snap.ownerActivityAvailable && filter !== "report" ? <div className="op-river-empty">Owner-loop activity unavailable.</div> : null}
                {filteredEvents.length === 0 && filteredSourceAvailable ? (
                  <div className="op-river-empty">No recent activity in this view.</div>
                ) : null}
                {filteredEvents.length > 0 && bands.map((band) => (
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
                ))}
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
              {pendingCount !== undefined ? <span className={`op-decisions-count${pendingCount ? "" : " op-zero"}`}>{pendingCount}</span> : null}
            </div>
            <Link className="op-dock-link" href="/decisions">Open Decide →</Link>
            <div className="op-decisions-scroll">
              {snap.pending === null ? <div className="op-dock-empty">Owner-loop decisions unavailable.</div> : null}
              {pendingCount === 0 ? <div className="op-dock-empty">No open decisions waiting on you.</div> : null}
              {snap.pending?.map((decision) => (
                <Link key={decision.ref} className="op-decision-card" prefetch={false} href={`/decisions#${encodeURIComponent(decision.ref)}`}>
                  <span className="op-decision-q">{decision.title}</span>
                  <span className="op-decision-meta">{decision.ref} · {decision.project} · {decision.ageLabel}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
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
        <span className="op-ev-time">{formatOperateTime(ev.ts)}</span>
        <span className="op-ev-chip">{ev.agent.toUpperCase()}</span>
        <span className="op-ev-proj">{ev.proj}</span>
        <span className="op-ev-msg">{ev.href ? <Link href={ev.href} prefetch={false}>{ev.msg}</Link> : ev.msg}</span>
      </div>
      {ev.detail ? (
        <div className={`op-event-card${entering ? " op-entering" : ""}`}>
          <div className="op-event-card-body">{ev.category === "report" ? "Next: " : ""}{ev.detail}</div>
        </div>
      ) : null}
    </>
  );
}
