"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { TABS } from "./tabs";

// Left rail on wide screens; a sideways-scrolling strip under the top bar on phones.
export function Navigation({ active }: { active: string }) {
  const activeLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeLink.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }, [active]);

  return (
    <nav className="sw-nav" aria-label="Cockpit sections">
      <ul>
        {TABS.map((tab) => {
          const current = tab.href === active;
          const props = {
            href: tab.href,
            className: current ? "active" : "",
            "aria-current": current ? "page" as const : undefined,
            ref: current ? activeLink : undefined,
          };
          const label = <><span className="sw-dot" aria-hidden="true" />{tab.label}</>;
          return <li key={tab.href}>{tab.boundary ? <a {...props}>{label}</a> : <Link {...props}>{label}</Link>}</li>;
        })}
      </ul>
    </nav>
  );
}
