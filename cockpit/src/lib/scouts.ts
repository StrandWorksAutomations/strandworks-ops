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
