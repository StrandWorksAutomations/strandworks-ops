// The one list of cockpit sections. The shared rail (Navigation) and the
// Operate page both render it, so a new page only needs adding here.
// `boundary` marks a path served by another app through a rewrite
// (next.config.ts), which needs a full page load instead of a client Link.
export type Tab = { href: string; label: string; boundary?: true };

export const TABS: Tab[] = [
  { href: "/operate", label: "Operate" },
  { href: "/", label: "Today" },
  { href: "/inbox", label: "Inbox" },
  { href: "/decisions", label: "Decide" },
  { href: "/timeline", label: "Timeline" },
  { href: "/briefings", label: "Briefs" },
  { href: "/jobs-review", label: "Job review" },
  { href: "/replies", label: "Replies" },
  { href: "/share", label: "Share" },
  { href: "/business", label: "Business" },
  { href: "/money", label: "Money" },
  { href: "/projects", label: "Projects" },
  { href: "/ops", label: "Ops" },
  { href: "/orchard", label: "Orchard", boundary: true },
];
