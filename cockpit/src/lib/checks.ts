// Project checks & status reports — registers/checks.csv.
//
// This register is the landing strip for automated project reporting: any
// agent (today's sessions, the future persistent checks-and-balances
// instance) appends a row per report — a commit, like every register write.
// The cockpit renders them as per-project status timelines. Schema:
//   date    — YYYY-MM-DD
//   project — project name/tokens (matched like every other register)
//   source  — who reported (cockpit-session, scout, ci, persistent-ai, owner)
//   kind    — progress | check | deploy | balance | alert
//   status  — ok | warn | fail | info
//   summary — one line, human-readable
//   link    — optional URL or repo path with the full report

import { parseCsv } from "./csv";
import { type ProjectDef } from "./projects";

export type CheckRow = {
  date: string;
  project: string;
  source: string;
  kind: string;
  status: string;
  summary: string;
  link: string;
};

export function parseChecks(csvText: string | null): CheckRow[] {
  if (!csvText) return [];
  return parseCsv(csvText)
    .rows.map((r) => ({
      date: r["date"] ?? "",
      project: r["project"] ?? "",
      source: r["source"] ?? "",
      kind: r["kind"] ?? "",
      status: r["status"] ?? "",
      summary: r["summary"] ?? "",
      link: r["link"] ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first
}

export function checksForProject(rows: CheckRow[], proj: ProjectDef): CheckRow[] {
  return rows.filter((r) => {
    const p = r.project.toLowerCase();
    return proj.tokens.some((t) => p.includes(t.toLowerCase()));
  });
}

export function latestCheck(rows: CheckRow[], proj: ProjectDef): CheckRow | undefined {
  return checksForProject(rows, proj)[0];
}

export function checkStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (/^(ok|pass|green|healthy|done)$/.test(s)) return "good";
  if (/^(warn|degraded|stale|pending)$/.test(s)) return "warn";
  if (/^(fail|red|blocked|down|error)$/.test(s)) return "bad";
  return "";
}
