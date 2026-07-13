// git.ts — the git operations the dispatch loop needs, via `git` subprocess.
//
// No dependency; just spawnSync. Every helper fails loud (throws) on a non-zero
// git exit so the loop can fail closed. The loop merges into the base branch
// LOCALLY ONLY — there is intentionally NO push helper here (pushing/deploying
// stays a human-or-higher step, VISION Autonomy Floor #2).

import { spawnSync } from "node:child_process";

function git(repo: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  return {
    code: r.status === null ? 1 : r.status,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
  };
}

function gitOrThrow(repo: string, args: string[]): string {
  const r = git(repo, args);
  if (r.code !== 0) {
    throw new Error(`git ${args.join(" ")} failed (${r.code}): ${r.stderr.trim()}`);
  }
  return r.stdout;
}

export function currentBranch(repo: string): string {
  return gitOrThrow(repo, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
}

export function branchExists(repo: string, branch: string): boolean {
  return git(repo, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]).code === 0;
}

/**
 * Check out the work-order's branch, creating it from `base` if it does not
 * exist. Existing branches are checked out as-is (never reset — that would
 * discard prior work).
 */
export function checkoutWorkBranch(repo: string, branch: string, base: string): void {
  if (branchExists(repo, branch)) {
    gitOrThrow(repo, ["checkout", branch]);
  } else {
    gitOrThrow(repo, ["checkout", "-b", branch, base]);
  }
}

/** The diff a reviewer sees: what `branch` adds on top of the merge-base with base. */
export function branchDiff(repo: string, base: string, branch: string): string {
  return gitOrThrow(repo, ["diff", `${base}...${branch}`]);
}

/**
 * Merge `branch` into `base` LOCALLY (no push). Uses --no-ff so the merge is an
 * explicit, revertible commit. Throws on conflict/failure (fail closed).
 */
export function mergeBranchToBase(
  repo: string,
  base: string,
  branch: string,
  message: string,
): void {
  gitOrThrow(repo, ["checkout", base]);
  gitOrThrow(repo, ["merge", "--no-ff", branch, "-m", message]);
}
