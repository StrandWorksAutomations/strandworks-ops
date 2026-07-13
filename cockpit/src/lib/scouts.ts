// Governance-scout freshness, read from the generated DASHBOARD.md.
//
// The per-repo scouts (audit / drift-check) write their reports into EACH
// project repo; generate.py sweeps them into DASHBOARD.md's "Governance
// scouts" table. The cockpit can only see THIS repo, so that table — stamped
// with the dashboard's own generation date — is the honest, register-derived
// view of scout coverage. Staleness is shown, never hidden: the view carries
// the generated date so the owner knows how old the sweep is.

export type ScoutRow = {
  repo: string;
  latestAudit: string; // filename or "never"
  latestDrift: string; // filename or "never"
};

export type ScoutView = {
  generated: string | null; // the dashboard's own "Generated YYYY-MM-DD" stamp
  rows: ScoutRow[];
};

export function parseScouts(dashboardMd: string | null): ScoutView {
  if (!dashboardMd) return { generated: null, rows: [] };

  const generated = dashboardMd.match(/^Generated (\d{4}-\d{2}-\d{2})/m)?.[1] ?? null;

  const start = dashboardMd.search(/^## Governance scouts/m);
  if (start === -1) return { generated, rows: [] };
  const afterHeading = dashboardMd.slice(dashboardMd.indexOf("\n", start) + 1);
  const nextSection = afterHeading.search(/^## /m);
  const section = nextSection === -1 ? afterHeading : afterHeading.slice(0, nextSection);

  const rows: ScoutRow[] = [];
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    // A table body row: | repo | latest_audit | latest_drift |
    if (cells.length >= 4 && cells[1] && cells[1] !== "repo" && !/^-+$/.test(cells[1])) {
      rows.push({ repo: cells[1], latestAudit: cells[2] ?? "", latestDrift: cells[3] ?? "" });
    }
  }
  return { generated, rows };
}

// Match a scout row to a project by token appearance in the repo name.
export function scoutForTokens(view: ScoutView, tokens: string[]): ScoutRow | undefined {
  return view.rows.find((r) => {
    const repo = r.repo.toLowerCase();
    return tokens.some((t) => repo.includes(t.toLowerCase()) || t.toLowerCase().includes(repo));
  });
}

// ---- report freshness ----
//
// Scout reports are named drift-YYYY-MM-DD.md / audit-YYYY-MM-DD.md. The DASHBOARD
// scout cells carry that filename (or "never"). Freshness is derived from the date
// in the filename; the coloring is the whole point of the coverage view, so the
// owner sees stale coverage without opening anything.

export type Freshness = "fresh" | "aging" | "stale" | "never";

// Pull the YYYY-MM-DD out of a report filename or scout cell. "never"/blank/
// unparseable ⇒ null (we never invent a date).
export function reportDate(cell: string | null | undefined): string | null {
  if (!cell) return null;
  return cell.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

function daysBetween(dateStr: string, today: string): number | null {
  const a = Date.parse(`${dateStr}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

// green (fresh) if ≤2 days old, amber (aging) if ≤7, red (stale) otherwise or
// never. `today` is passed in so the derivation stays pure/testable.
export function freshness(cell: string | null | undefined, today: string): Freshness {
  const date = reportDate(cell);
  if (!date) return "never";
  const days = daysBetween(date, today);
  if (days === null || days < 0) return "never";
  if (days <= 2) return "fresh";
  if (days <= 7) return "aging";
  return "stale";
}

// Map a freshness to the design system's badge signal class.
export function freshnessBadge(f: Freshness): string {
  return f === "fresh" ? "good" : f === "aging" ? "warn" : "bad";
}

// ---- FLAG surfacing ----
//
// Drift/audit reports end with a FLAG summary (rituals: "Reports end with a FLAG
// summary — actions are proposed to the owner, never taken"). We lift that section
// so flags show on the index without opening the file. If no FLAG section can be
// parsed we say so honestly rather than render an empty block.

export type FlagSummary = {
  found: boolean;
  heading: string | null;
  body: string; // markdown of the section (heading line excluded)
};

export function extractFlagSummary(md: string | null | undefined): FlagSummary {
  if (!md) return { found: false, heading: null, body: "" };
  const lines = md.split("\n");

  // Prefer a heading that literally reads "FLAG summary"; otherwise fall back to
  // any heading mentioning flag(s). Only markdown ATX headings (#..######) count.
  const headings = lines
    .map((line, i) => {
      const m = line.match(/^(#{1,6})\s+(.*\S)\s*$/);
      return m ? { i, level: m[1].length, text: m[2].trim() } : null;
    })
    .filter((h): h is { i: number; level: number; text: string } => h !== null);

  const start =
    headings.find((h) => /flag\s*summary/i.test(h.text)) ??
    headings.find((h) => /\bflags?\b/i.test(h.text));
  if (!start) return { found: false, heading: null, body: "" };

  // Body runs to the next heading of the same or higher level (or end of file).
  let end = lines.length;
  for (const h of headings) {
    if (h.i > start.i && h.level <= start.level) {
      end = h.i;
      break;
    }
  }
  const body = lines.slice(start.i + 1, end).join("\n").trim();
  return { found: true, heading: start.text, body };
}
