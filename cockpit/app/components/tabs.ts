// The menu has five sections. Each section's pages share one strip of
// sub-tabs under the header, so the menu stays short and every page is still
// one tap from its neighbours.
// `boundary` marks a path served by another app through a rewrite
// (next.config.ts), which needs a full page load instead of a client Link.
export type Tab = { href: string; label: string; boundary?: true };
export type Section = { label: string; tabs: Tab[] };

export const SECTIONS: Section[] = [
  { label: "Daily view", tabs: [
    { href: "/operate", label: "Overview" },
    { href: "/", label: "Today" },
    { href: "/focus", label: "Goals" },
    { href: "/timeline", label: "Timeline" },
  ] },
  { label: "Needs you", tabs: [
    { href: "/decisions", label: "Decisions" },
    { href: "/inbox", label: "Email" },
    { href: "/agent-inbox", label: "Agent queue" },
  ] },
  { label: "Kinetic Clinician", tabs: [
    { href: "/jobs-review", label: "Job review" },
    { href: "/replies", label: "Replies" },
    { href: "/engagement", label: "Comments" },
    { href: "/share", label: "Posts to share" },
  ] },
  { label: "Marketing", tabs: [
    { href: "/marketing", label: "Posts" },
    { href: "/orchard", label: "Orchard", boundary: true },
  ] },
  { label: "Company", tabs: [
    { href: "/business", label: "Business" },
    { href: "/money", label: "Money" },
    { href: "/projects", label: "Projects" },
    { href: "/briefings", label: "Briefs" },
    { href: "/ops", label: "Records" },
  ] },
];

export const TABS: Tab[] = SECTIONS.flatMap((section) => section.tabs);

export function sectionOf(active: string): Section | undefined {
  return SECTIONS.find((section) => section.tabs.some((tab) => tab.href === active));
}
