"use client";

import Link from "next/link";
import { SECTIONS, sectionOf, type Tab } from "./tabs";

function TabLink({ tab, label, current, className = "", onClick }: { tab: Tab; label: React.ReactNode; current: boolean; className?: string; onClick?: () => void }) {
  const props = {
    href: tab.href,
    className: `${className}${current ? " active" : ""}`.trim(),
    "aria-current": current ? "page" as const : undefined,
    onClick,
  };
  return tab.boundary ? <a {...props}>{label}</a> : <Link {...props}>{label}</Link>;
}

// The menu: one entry per section, opening that section's first page.
export function Navigation({ active, drawer = false, onNavigate }: { active: string; drawer?: boolean; onNavigate?: () => void }) {
  const current = sectionOf(active);
  return (
    <nav className={`sw-nav${drawer ? " drawer-nav" : " desktop-nav"}`} aria-label="Cockpit sections">
      <ul>
        {SECTIONS.map((section) => (
          <li key={section.label}>
            <TabLink tab={section.tabs[0]} current={section === current} onClick={onNavigate}
              label={<><span className="sw-dot" aria-hidden="true" />{section.label}</>} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

// The pages inside the current section.
export function SectionTabs({ active }: { active: string }) {
  const section = sectionOf(active);
  if (!section || section.tabs.length < 2) return null;
  return (
    <nav className="section-tabs" aria-label={`${section.label} pages`}>
      {section.tabs.map((tab) => <TabLink key={tab.href} tab={tab} label={tab.label} current={tab.href === active} className="section-tab" />)}
    </nav>
  );
}
