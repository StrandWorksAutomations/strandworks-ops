// audit.ts — append-only JSONL audit trail, one line per dispatch step.
//
// Every run writes fabric/orchestrator/runs/<date>-<slug>.jsonl. Each step
// (start, coder, reviewer, revise, merge, decision-card, halt-refused, done)
// appends one JSON line: timestamps, role, the exact command argv, exit code,
// and verdict. NO SECRETS are ever logged — the command argv comes from
// config.json (which holds no secrets), and we never log prompt bodies, diffs,
// or reviewer output text. This is the tamper-evident record the cockpit reads.

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export interface AuditEntry {
  ts: string; // ISO timestamp
  run: string; // run slug
  step:
    | "start"
    | "coder"
    | "reviewer"
    | "revise"
    | "merge"
    | "decision-card"
    | "halt-refused"
    | "done"
    | "error";
  role?: string;
  command?: string[];
  exitCode?: number;
  verdict?: string;
  cycle?: number;
  note?: string;
}

/** runs/<date>-<slug>.jsonl */
export function runFilePath(runsDir: string, date: string, slug: string): string {
  return join(runsDir, `${date}-${slug}.jsonl`);
}

/** Append one audit line. Creates the runs dir if needed. */
export function appendAudit(runFile: string, entry: AuditEntry): void {
  mkdirSync(dirname(runFile), { recursive: true });
  appendFileSync(runFile, JSON.stringify(entry) + "\n");
}
