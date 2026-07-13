#!/usr/bin/env node
// dispatch.ts — the orchestrator dispatch + monitor loop (SPEC WS-A slice 1).
//
// Drives the proven pattern:  spawn coder → adversarial review → revise → merge.
// The occupant of every role comes ONLY from config.json; this file names no
// vendor (an adversarial test greps this source for vendor strings and requires
// it clean). The review gate is non-optional and fail-closed: a missing or
// malformed verdict is treated as FLAGS, never as a pass, and an exhausted
// revise budget files an owner decision card and exits non-zero WITHOUT merging.
//
//   node fabric/orchestrator/dispatch.ts <work-order.md> [--dry-run]
//        [--repo-root <dir>] [--config <file>] [--runs <dir>]
//        [--decisions <dir>] [--branch <name>]
//
// Exit codes: 0 merged (ALIGNED), 3 flags-exhausted (card filed), 2 HALTED
// refusal, 1 usage/error. Distinct codes let a shell caller branch on outcome.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadConfig, buildCommand, type OrchestratorConfig } from "./config.ts";
import { parseWorkOrder, type WorkOrder } from "./workorder.ts";
import { parseVerdict, type Verdict } from "./verdict.ts";
import { appendAudit, runFilePath, type AuditEntry } from "./audit.ts";
import { fileRevisionExhaustedCard } from "./decision-card.ts";
import { checkoutWorkBranch, branchDiff, mergeBranchToBase } from "./git.ts";

// ---- occupant invocation (injectable so the loop is testable without spawning) ----

export interface Invocation {
  role: string;
  argv: string[];
  promptContent: string;
  promptFile: string;
  cwd: string;
}

export interface RunnerResult {
  stdout: string;
  stderr: string;
  code: number;
}

export type OccupantRunner = (inv: Invocation) => RunnerResult;

/**
 * Default runner: spawn argv[0] with the rest as args, in the repo, and pipe the
 * prompt on stdin. The occupant is entirely determined by `inv.argv` (built from
 * config) — this function has no vendor knowledge. A null exit (signal) is
 * reported as a failure code so the loop fails closed.
 */
export const defaultRunner: OccupantRunner = (inv) => {
  const r = spawnSync(inv.argv[0], inv.argv.slice(1), {
    cwd: inv.cwd,
    input: inv.promptContent,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    code: r.status === null ? 1 : r.status,
  };
};

// ---- options / result ----

export interface RunDispatchOptions {
  workOrderPath: string;
  repoRoot: string;
  configPath?: string;
  runsDir?: string;
  decisionsDir?: string;
  canonPointers?: string[];
  branchOverride?: string;
  dryRun?: boolean;
  runner?: OccupantRunner;
  now?: Date;
  /** where to write throwaway prompt/diff files (default: a fresh os tmpdir) */
  workDir?: string;
}

export type Outcome =
  | "merged"
  | "flags-exhausted"
  | "halted"
  | "dry-run"
  | "error";

export interface DispatchResult {
  outcome: Outcome;
  exitCode: number;
  branch?: string;
  coderRuns: number;
  reviews: number;
  finalVerdict?: Verdict;
  decisionCardPath?: string;
  runFile?: string;
  /** dry-run only: the exact commands that WOULD run */
  plannedCommands?: { role: string; argv: string[] }[];
  message?: string;
}

const HALTED_MARKER = "HALTED";

function isoNow(now: Date): string {
  return now.toISOString();
}

function dateStamp(now: Date): string {
  const y = now.getUTCFullYear();
  const m = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = now.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultCanonPointers(repoRoot: string): string[] {
  // Authority order: PORTFOLIO wins, then VISION, then SPEC. PORTFOLIO lives
  // outside the repo (~/work/PORTFOLIO.md) and is cited by path.
  return [
    "~/work/PORTFOLIO.md (company canon — wins all conflicts)",
    join(repoRoot, "VISION.md"),
    join(repoRoot, "SPEC.md"),
  ];
}

function coderPrompt(wo: WorkOrder, findings: string | undefined): string {
  const base =
    `You are the CODER sub-agent. Implement the following work-order on the ` +
    `branch it names, committing your work to that branch. Honor canon: ` +
    `PORTFOLIO.md → VISION.md → SPEC.md (higher wins).\n\n` +
    `----- WORK ORDER -----\n${wo.raw}\n----- END WORK ORDER -----\n`;
  if (findings && findings.trim().length > 0) {
    return (
      base +
      `\nA prior revision FAILED adversarial review. Address every finding ` +
      `below, then commit the fixes to the same branch:\n\n` +
      `----- REVIEWER FINDINGS -----\n${findings.trim()}\n` +
      `----- END REVIEWER FINDINGS -----\n`
    );
  }
  return base;
}

function reviewPrompt(
  wo: WorkOrder,
  diffFile: string,
  canonPointers: string[],
): string {
  return (
    `You are the ADVERSARIAL REVIEWER. Read the branch diff at ${diffFile} and ` +
    `judge whether it honors canon and satisfies the work-order. Canon, in ` +
    `authority order (higher wins):\n` +
    canonPointers.map((p) => `  - ${p}`).join("\n") +
    `\n\n----- WORK ORDER -----\n${wo.raw}\n----- END WORK ORDER -----\n\n` +
    `Emit EXACTLY ONE authoritative verdict line, then your findings:\n` +
    `  VERDICT: ALIGNED   (diff honors canon and meets acceptance — merge)\n` +
    `  VERDICT: FLAGS     (misalignments — list every finding below the line)\n` +
    `A missing or ambiguous verdict is treated as FLAGS. Be adversarial.\n`
  );
}

function audit(runFile: string | undefined, entry: AuditEntry): void {
  if (runFile) appendAudit(runFile, entry);
}

/**
 * THE dispatch loop. Runnable and testable: pass a `runner` to drive it without
 * spawning a real occupant, and point runsDir/decisionsDir at temp dirs.
 */
export function runDispatch(opts: RunDispatchOptions): DispatchResult {
  const now = opts.now ?? new Date();
  const repoRoot = resolve(opts.repoRoot);
  const runner = opts.runner ?? defaultRunner;
  const configPath =
    opts.configPath ?? join(repoRoot, "fabric", "orchestrator", "config.json");
  const runsDir = opts.runsDir ?? join(repoRoot, "fabric", "orchestrator", "runs");
  const decisionsDir =
    opts.decisionsDir ?? join(repoRoot, "_governance", "decisions");
  const canonPointers = opts.canonPointers ?? defaultCanonPointers(repoRoot);

  // 1. HALTED marker → refuse to run at all (fail closed).
  if (existsSync(join(repoRoot, HALTED_MARKER))) {
    const msg = `HALTED marker present at ${repoRoot}; refusing to dispatch (fail closed).`;
    return { outcome: "halted", exitCode: 2, coderRuns: 0, reviews: 0, message: msg };
  }

  // 2. Load config + work-order.
  const cfg: OrchestratorConfig = loadConfig(configPath);
  const wo = parseWorkOrder(opts.workOrderPath);
  const branch = opts.branchOverride ?? wo.branch;
  if (!branch) {
    throw new Error(
      `work-order ${opts.workOrderPath} declares no branch and no --branch was given ` +
        `(add a "branch:" line or "**Branch:** <name>")`,
    );
  }
  const base = cfg.baseBranch;

  const workDir = opts.workDir ?? mkdtempSync(join(tmpdir(), "orch-"));
  const coderPromptFile = join(workDir, "coder-prompt.txt");
  const reviewPromptFile = join(workDir, "review-prompt.txt");
  const diffFile = join(workDir, "branch.diff");

  // 3. Dry-run: print the EXACT commands, mutate nothing.
  if (opts.dryRun) {
    const subsCoder = { REPO: repoRoot, BRANCH: branch, BASE: base, PROMPT_FILE: coderPromptFile };
    const subsReview = {
      REPO: repoRoot,
      BRANCH: branch,
      BASE: base,
      PROMPT_FILE: reviewPromptFile,
      DIFF_FILE: diffFile,
    };
    const planned = [
      { role: "coder", argv: buildCommand("coder", cfg, subsCoder) },
      { role: "reviewer", argv: buildCommand("reviewer", cfg, subsReview) },
    ];
    const out =
      `# dry-run for work-order ${opts.workOrderPath}\n` +
      `# branch: ${branch}  base: ${base}  maxReviseCycles: ${cfg.maxReviseCycles}\n` +
      `git checkout -B ${branch} ${base}\n` +
      planned
        .map((p) => `[${p.role}] ${p.argv.join(" ")}   (prompt piped on stdin)`)
        .join("\n") +
      `\n# on ALIGNED: git checkout ${base} && git merge --no-ff ${branch}\n` +
      `# on exhausted FLAGS: file decision card in ${decisionsDir}, exit 3 (no merge)\n`;
    process.stdout.write(out);
    return {
      outcome: "dry-run",
      exitCode: 0,
      branch,
      coderRuns: 0,
      reviews: 0,
      plannedCommands: planned,
    };
  }

  // 4. Real run. Establish the run file + branch.
  const date = dateStamp(now);
  const runFile = runFilePath(runsDir, date, wo.slug);
  audit(runFile, {
    ts: isoNow(now),
    run: wo.slug,
    step: "start",
    note: `branch=${branch} base=${base} maxReviseCycles=${cfg.maxReviseCycles}`,
  });

  checkoutWorkBranch(repoRoot, branch, base);

  const N = cfg.maxReviseCycles;
  let coderRuns = 0;
  let reviews = 0;
  let lastFindings = "";
  let finalVerdict: Verdict = "FLAGS";

  // Initial coder run (findings undefined).
  const runCoder = (findings: string | undefined, cycle: number): void => {
    const prompt = coderPrompt(wo, findings);
    writeFileSync(coderPromptFile, prompt);
    const argv = buildCommand("coder", cfg, {
      REPO: repoRoot,
      BRANCH: branch,
      BASE: base,
      PROMPT_FILE: coderPromptFile,
    });
    const res = runner({ role: "coder", argv, promptContent: prompt, promptFile: coderPromptFile, cwd: repoRoot });
    coderRuns++;
    audit(runFile, {
      ts: isoNow(now),
      run: wo.slug,
      step: cycle === 0 ? "coder" : "revise",
      role: "coder",
      command: argv,
      exitCode: res.code,
      cycle,
    });
    if (res.code !== 0) {
      throw new Error(
        `coder occupant exited ${res.code} on cycle ${cycle} (fail closed; not merging). stderr: ${res.stderr.trim().slice(0, 500)}`,
      );
    }
  };

  runCoder(undefined, 0);

  // Review, then optionally revise, bounded by N revise cycles.
  for (let round = 0; round <= N; round++) {
    writeFileSync(diffFile, branchDiff(repoRoot, base, branch));
    const rprompt = reviewPrompt(wo, diffFile, canonPointers);
    writeFileSync(reviewPromptFile, rprompt);
    const rargv = buildCommand("reviewer", cfg, {
      REPO: repoRoot,
      BRANCH: branch,
      BASE: base,
      PROMPT_FILE: reviewPromptFile,
      DIFF_FILE: diffFile,
    });
    const rres = runner({
      role: "reviewer",
      argv: rargv,
      promptContent: rprompt,
      promptFile: reviewPromptFile,
      cwd: repoRoot,
    });
    reviews++;
    const v = parseVerdict(rres.stdout);
    finalVerdict = v.verdict;
    lastFindings = v.findings;
    audit(runFile, {
      ts: isoNow(now),
      run: wo.slug,
      step: "reviewer",
      role: "reviewer",
      command: rargv,
      exitCode: rres.code,
      verdict: v.malformed ? "FLAGS(malformed)" : v.verdict,
      cycle: round,
    });

    if (v.verdict === "ALIGNED") {
      const message = `orchestrator: merge ${branch} (VERDICT: ALIGNED after ${round} revise ${round === 1 ? "cycle" : "cycles"})`;
      mergeBranchToBase(repoRoot, base, branch, message);
      audit(runFile, {
        ts: isoNow(now),
        run: wo.slug,
        step: "merge",
        note: `merged ${branch} into ${base} (local, no push)`,
      });
      audit(runFile, { ts: isoNow(now), run: wo.slug, step: "done", note: "merged" });
      return {
        outcome: "merged",
        exitCode: 0,
        branch,
        coderRuns,
        reviews,
        finalVerdict,
        runFile,
      };
    }

    // FLAGS. Revise if budget remains; else file a card and stop (never merge).
    if (round < N) {
      runCoder(v.findings, round + 1);
    } else {
      const card = fileRevisionExhaustedCard({
        decisionsDir,
        date,
        branch,
        slug: wo.slug,
        reviseCycles: N,
        runFile,
        lastFindings,
      });
      audit(runFile, {
        ts: isoNow(now),
        run: wo.slug,
        step: "decision-card",
        note: `revise budget (${N}) exhausted; filed ${card.id}; NOT merged`,
      });
      audit(runFile, { ts: isoNow(now), run: wo.slug, step: "done", note: "flags-exhausted" });
      return {
        outcome: "flags-exhausted",
        exitCode: 3,
        branch,
        coderRuns,
        reviews,
        finalVerdict,
        decisionCardPath: card.path,
        runFile,
      };
    }
  }

  // Unreachable: the loop always returns inside. Fail closed if control escapes.
  throw new Error("dispatch loop exited without a decision (should be unreachable)");
}

// ---- CLI ----

function parseCliArgs(argv: string[]): {
  workOrderPath?: string;
  flags: Record<string, string | boolean>;
} {
  const flags: Record<string, string | boolean> = {};
  let workOrderPath: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else if (workOrderPath === undefined) {
      workOrderPath = a;
    }
  }
  return { workOrderPath, flags };
}

function usage(): void {
  process.stderr.write(
    `orchestrator dispatch — spawn coder → adversarial review → revise → merge\n\n` +
      `Usage:\n` +
      `  node fabric/orchestrator/dispatch.ts <work-order.md> [--dry-run]\n` +
      `       [--repo-root <dir>] [--config <file>] [--runs <dir>]\n` +
      `       [--decisions <dir>] [--branch <name>]\n\n` +
      `Exit codes: 0 merged, 3 flags-exhausted (card filed), 2 HALTED, 1 usage/error.\n`,
  );
}

function main(): number {
  const { workOrderPath, flags } = parseCliArgs(process.argv.slice(2));
  if (!workOrderPath) {
    usage();
    return 1;
  }
  const HERE = dirname(fileURLToPath(import.meta.url));
  const defaultRepoRoot = resolve(HERE, "..", "..");
  const repoRoot =
    typeof flags["repo-root"] === "string" ? resolve(flags["repo-root"]) : defaultRepoRoot;

  try {
    const res = runDispatch({
      workOrderPath: resolve(workOrderPath),
      repoRoot,
      configPath: typeof flags.config === "string" ? resolve(flags.config) : undefined,
      runsDir: typeof flags.runs === "string" ? resolve(flags.runs) : undefined,
      decisionsDir: typeof flags.decisions === "string" ? resolve(flags.decisions) : undefined,
      branchOverride: typeof flags.branch === "string" ? flags.branch : undefined,
      dryRun: flags["dry-run"] === true,
    });
    if (!flags["dry-run"]) {
      process.stdout.write(
        `${res.outcome.toUpperCase()}  branch=${res.branch ?? "-"}  ` +
          `coderRuns=${res.coderRuns} reviews=${res.reviews}` +
          (res.decisionCardPath ? `\n  decision card: ${res.decisionCardPath}` : "") +
          (res.runFile ? `\n  audit: ${res.runFile}` : "") +
          (res.message ? `\n  ${res.message}` : "") +
          `\n`,
      );
    }
    return res.exitCode;
  } catch (err) {
    process.stderr.write(`dispatch error: ${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
}

// Run only when invoked directly (not when imported by tests).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(main());
}
