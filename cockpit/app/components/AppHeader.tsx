"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation } from "./Navigation";
import { TextSize } from "./TextSize";
import { ThemeToggle } from "./ThemeToggle";

// One header, including Operate and the sign-in screens. Native dialog keeps
// keyboard focus inside the menu and returns focus to its opener on dismissal.
export function AppHeader({ title, sub, active = "", locked = false }: {
  title: string; sub?: string; active?: string; locked?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => { dialog.current?.close(); setOpen(false); };
  useEffect(() => {
    const dismiss = () => { dialog.current?.close(); setOpen(false); };
    window.addEventListener("popstate", dismiss);
    return () => window.removeEventListener("popstate", dismiss);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="topbar">
      <button type="button" className="header-button menu-toggle" aria-haspopup="dialog"
        aria-expanded={open} aria-controls="cockpit-menu" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        Menu
      </button>
      <div className="sw-brand">
        <div className="sw-wordmark">Strandworks</div>
        <h1>{title}</h1>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      <ThemeToggle />
    </header>
    <dialog ref={dialog} id="cockpit-menu" className="menu-drawer" aria-labelledby="menu-title"
      onClose={() => setOpen(false)} onClick={(event) => { if (event.target === dialog.current) close(); }}>
      <div className="menu-drawer-inner">
        <div className="menu-heading"><h2 id="menu-title">Menu</h2><button type="button" className="header-button" onClick={close} autoFocus>Close <span aria-hidden="true">×</span></button></div>
        <Navigation active={active} drawer onNavigate={close} />
        <div className="menu-settings">
          <span>Text size</span><TextSize />
          {!locked ? <form action="/api/auth/logout" method="post"><button type="submit" className="header-button">Lock dashboard</button></form> : null}
        </div>
      </div>
    </dialog>
  </>;
}
