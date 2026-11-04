"use client";
// A tappable card. Swipe right to respond; swipe left for archive and delete.
// The ⋯ button shows the same actions for a mouse or keyboard.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

const OPEN_LEFT = -148;
const RESPOND_AT = 72;

export function SwipeCard({ refId, href, canArchive = true, className = "", children }: {
  refId: string; href: string; canArchive?: boolean; className?: string; children: ReactNode;
}) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [gone, setGone] = useState<"archive" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const horizontal = useRef(false);
  const moved = useRef(false);

  const respondHref = `${href}?respond=1#respond`;

  async function act(action: "archive" | "delete" | "unarchive" | "restore") {
    setError(null);
    try {
      const res = await fetch("/api/loop/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: refId, action }) });
      if (!res.ok) throw new Error();
      if (action === "archive" || action === "delete") setGone(action);
      else { setGone(null); setOffset(0); router.refresh(); }
    } catch {
      setError("That did not save. Try again.");
      setOffset(0);
    }
  }

  function onDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, y: e.clientY, base: offset };
    horizontal.current = false;
    moved.current = false;
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (!horizontal.current) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { start.current = null; return; }
      if (Math.abs(dx) < 10) return;
      horizontal.current = true;
      moved.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setOffset(Math.max(OPEN_LEFT - 20, Math.min(RESPOND_AT + 40, start.current.base + dx)));
  }
  function onUp() {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    if (!horizontal.current) return;
    if (offset >= RESPOND_AT) { setOffset(0); router.push(respondHref); return; }
    setOffset(offset <= OPEN_LEFT / 2 && canArchive ? OPEN_LEFT : 0);
  }

  if (gone) {
    return <div className="card swipe-gone" role="status">
      <span>{gone === "archive" ? "Archived" : "Deleted"}. <span className="meta">{refId}</span></span>
      <button type="button" className="token-btn" onClick={() => act(gone === "archive" ? "unarchive" : "restore")}>Undo</button>
    </div>;
  }

  return <article className={`swipe ${className}`} id={refId}>
    <div className="swipe-under" aria-hidden={offset === 0} style={{ visibility: offset === 0 && !dragging ? "hidden" : "visible" }}>
      <Link href={respondHref} className="swipe-action swipe-respond" tabIndex={offset > 0 ? 0 : -1}><ReplyIcon />Respond</Link>
      {canArchive ? <span className="swipe-right">
        <button type="button" className="swipe-action swipe-archive" tabIndex={offset < 0 ? 0 : -1} onClick={() => act("archive")}><ArchiveIcon />Archive</button>
        <button type="button" className="swipe-action swipe-delete" tabIndex={offset < 0 ? 0 : -1} onClick={() => act("delete")}><TrashIcon />Delete</button>
      </span> : null}
    </div>
    <div className={`swipe-face card${dragging ? " dragging" : ""}`} style={{ transform: `translateX(${offset}px)` }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}>
      <Link href={href} className="swipe-link" draggable={false}>{children}</Link>
      {canArchive ? <button type="button" className="swipe-more" aria-label={`More actions for ${refId}`} aria-expanded={offset < 0}
        onClick={() => setOffset(offset < 0 ? 0 : OPEN_LEFT)}>⋯</button> : null}
    </div>
    {error ? <p className="error-text" role="alert">{error}</p> : null}
  </article>;
}

function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}
const ReplyIcon = () => <Icon d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5" />;
const ArchiveIcon = () => <Icon d="M3 4h18v4H3zM5 8v12h14V8M10 12h4" />;
const TrashIcon = () => <Icon d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />;
