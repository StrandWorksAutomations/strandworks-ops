"use client";

import Link from "next/link";
import { TABS } from "./tabs";

export function Navigation({ active, drawer = false, onNavigate }: { active: string; drawer?: boolean; onNavigate?: () => void }) {
  return (
    <nav className={`sw-nav${drawer ? " drawer-nav" : " desktop-nav"}`} aria-label="Cockpit sections">
      <ul>
        {TABS.map((tab) => {
          const current = tab.href === active;
          const props = {
            href: tab.href,
            className: current ? "active" : "",
            "aria-current": current ? "page" as const : undefined,
            onClick: onNavigate,
          };
          const label = <><span className="sw-dot" aria-hidden="true" />{tab.label}</>;
          return <li key={tab.href}>{tab.boundary ? <a {...props}>{label}</a> : <Link {...props}>{label}</Link>}</li>;
        })}
      </ul>
    </nav>
  );
}
