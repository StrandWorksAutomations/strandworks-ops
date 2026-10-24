"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const TABS = [
  { href: "/operate", label: "Operate" },
  { href: "/inbox", label: "Inbox" },
  { href: "/", label: "Today" },
  { href: "/timeline", label: "Timeline" },
  { href: "/briefings", label: "Briefs" },
  { href: "/orchard", label: "Orchard", boundary: true },
  { href: "/money", label: "Money" },
  { href: "/business", label: "Business" },
  { href: "/projects", label: "Projects" },
  { href: "/decisions", label: "Decide" },
  { href: "/share", label: "Share" },
  { href: "/ops", label: "Ops" },
];

export function Navigation({ active }: { active: string }) {
  const activeLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeLink.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }, [active]);

  return (
    <nav className="nav" aria-label="Cockpit sections">
      {TABS.map((tab) => {
        const current = tab.href === active;
        const props = {
          href: tab.href,
          className: current ? "active" : "",
          "aria-current": current ? "page" as const : undefined,
          ref: current ? activeLink : undefined,
        };
        return tab.boundary ? <a key={tab.href} {...props}>{tab.label}</a>
          : <Link key={tab.href} {...props}>{tab.label}</Link>;
      })}
    </nav>
  );
}
