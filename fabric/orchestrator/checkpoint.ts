// checkpoint.ts — persist the stage of a HIGH-oversight (checkpointed) run.
//
// A HIGH-ruled sprint pauses for owner checkpoints (SPEC WS-C): after the coder
// finishes and after the review. Each pause exits with a distinct code; the
// owner resumes the next stage explicitly (--resume-stage). Because each resume
// is a FRESH process, the loop persists just enough state between stages here.
//
// This state is LOCAL and operational — it lives beside the run's JSONL audit in
// runs/ (gitignored), never in the tracked tree, exactly like the audit log.

import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Verdict } from "./verdict.ts";

/** The stages an owner resumes into. "start" is the implicit first invocation. */
export type ResumeStage = "after-coder" | "after-review";

export interface CheckpointState {
  slug: string;
  branch: string;
  base: string;
  stage: ResumeStage; // the checkpoint the run is PAUSED at (what to resume next)
  lastVerdict?: Verdict; // set once the review has run (stage after-review)
  lastFindings?: string; // the reviewer's findings, carried to the finalize stage
  coderRuns: number;
  reviews: number;
}

/** runs/<date>-<slug>.checkpoint.json — beside the audit JSONL, also gitignored. */
export function checkpointPath(runsDir: string, date: string, slug: string): string {
  return join(runsDir, `${date}-${slug}.checkpoint.json`);
}

export function readCheckpoint(path: string): CheckpointState | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CheckpointState;
  } catch {
    return undefined;
  }
}

export function writeCheckpoint(path: string, state: CheckpointState): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n");
}

export function clearCheckpoint(path: string): void {
  if (existsSync(path)) rmSync(path);
}
