// dispatch.test.ts — the orchestrator dispatch loop, verdict parsing, fail-closed
// guarantees, revise-bound + card filing, config-driven (vendor-free) command
// construction, dry-run shape, and audit-log append.
//
// Filesystem tests use temp dirs (real git repos in os tmp); nothing here ever
// touches the real _governance/decisions or the real runs/ directory.
//
// Run:  node --test "fabric/orchestrator/dispatch.test.ts"

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseVerdict } from "./verdict.ts";
import { loadConfig, buildCommand } from "./config.ts";
import {
  runDispatch,
  type OccupantRunner,
  type RunnerResult,
} from "./dispatch.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---- helpers ----

function tmp(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function git(repo: string, args: string[]): { code: number; stdout: string } {
  const r = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  return { code: r.status === null ? 1 : r.status, stdout: r.stdout ?? "" };
}

/** Fresh git repo on branch `main` with one commit. */
function initRepo(): string {
  const repo = tmp("orch-repo-");
  assert.equal(git(repo, ["init", "-b", "main"]).code, 0);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test"]);
  writeFileSync(join(repo, "README.md"), "seed\n");
  git(repo, ["add", "-A"]);
  assert.equal(git(repo, ["commit", "-m", "seed"]).code, 0);
  return repo;
}

/** Write a work-order that declares a branch. */
function writeWorkOrder(dir: string, branch: string): string {
  const p = join(dir, "work-order.md");
  writeFileSync(
    p,
    `# Test work order\n\nbranch: ${branch}\n\nGoal: make impl.txt.\nAcceptance: file exists.\n`,
  );
  return p;
}

/** A vendor-free test config (placeholder-rich commands). */
function writeTestConfig(dir: string, maxReviseCycles: number): string {
  const p = join(dir, "config.json");
  writeFileSync(
    p,
    JSON.stringify({
      maxReviseCycles,
      baseBranch: "main",
      roles: {
        coder: {
          provider: "test-provider",
          command: ["run-coder", "--repo", "{REPO}", "--branch", "{BRANCH}", "--prompt", "{PROMPT_FILE}"],
        },
        reviewer: {
          provider: "test-provider",
          command: ["run-review", "--repo", "{REPO}", "--diff", "{DIFF_FILE}"],
        },
      },
    }),
  );
  return p;
}

/**
 * A runner that: on "coder" makes a real commit on the current branch (so a
 * diff exists), and on "reviewer" returns the next scripted stdout. Tracks call
 * counts.
 */
function scriptedRunner(repo: string, reviewerOutputs: string[]) {
  const calls: { role: string; argv: string[] }[] = [];
  let coderCycle = 0;
  let reviewIdx = 0;
  const runner: OccupantRunner = (inv): RunnerResult => {
    calls.push({ role: inv.role, argv: inv.argv });
    if (inv.role === "coder") {
      writeFileSync(join(repo, "impl.txt"), `work cycle ${coderCycle}\n`);
      coderCycle++;
      git(repo, ["add", "-A"]);
      git(repo, ["commit", "-m", `coder cycle ${coderCycle}`]);
      return { stdout: "", stderr: "", code: 0 };
    }
    const out = reviewerOutputs[Math.min(reviewIdx, reviewerOutputs.length - 1)];
    reviewIdx++;
    return { stdout: out, stderr: "", code: 0 };
  };
  return { runner, calls };
}

function currentBranchOf(repo: string): string {
  return git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
}

function baseHasImpl(repo: string): boolean {
  return git(repo, ["cat-file", "-e", "main:impl.txt"]).code === 0;
}

// ---- verdict parsing (fail closed) ----

test("parseVerdict: clean ALIGNED merges", () => {
  const r = parseVerdict("Looks good.\nVERDICT: ALIGNED\n");
  assert.equal(r.verdict, "ALIGNED");
  assert.equal(r.malformed, false);
});

test("parseVerdict: FLAGS captures findings after the line", () => {
  const r = parseVerdict("VERDICT: FLAGS\n- missing test\n- spec drift\n");
  assert.equal(r.verdict, "FLAGS");
  assert.equal(r.malformed, false);
  assert.match(r.findings, /missing test/);
  assert.match(r.findings, /spec drift/);
});

test("parseVerdict: no verdict line → malformed → FLAGS (fail closed)", () => {
  const r = parseVerdict("I think it is probably fine, ship it.");
  assert.equal(r.verdict, "FLAGS");
  assert.equal(r.malformed, true);
});

test("parseVerdict: ambiguous (both ALIGNED and FLAGS) → FLAGS", () => {
  const r = parseVerdict("VERDICT: ALIGNED\n...but also\nVERDICT: FLAGS\n");
  assert.equal(r.verdict, "FLAGS");
  assert.equal(r.malformed, false);
});

test("parseVerdict: empty / non-string input → FLAGS malformed", () => {
  // deliberately pass a non-string through an any-cast to prove fail-closed
  const r = parseVerdict(undefined as unknown as string);
  assert.equal(r.verdict, "FLAGS");
  assert.equal(r.malformed, true);
});

// ---- HALTED refusal ----

test("HALTED marker at repo root → refuse, exit 2, no occupant call, no merge", () => {
  const repo = initRepo();
  const cfgDir = tmp("orch-cfg-");
  const cfg = writeTestConfig(cfgDir, 3);
  const wo = writeWorkOrder(cfgDir, "feature/halt-test");
  writeFileSync(join(repo, "HALTED"), "stop\n");

  const { runner, calls } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);
  const res = runDispatch({
    workOrderPath: wo,
    repoRoot: repo,
    configPath: cfg,
    runsDir: join(tmp("orch-runs-"), "runs"),
    decisionsDir: join(tmp("orch-dec-"), "decisions"),
    runner,
  });

  assert.equal(res.outcome, "halted");
  assert.equal(res.exitCode, 2);
  assert.equal(calls.length, 0, "no occupant should be invoked when HALTED");
  assert.equal(currentBranchOf(repo), "main", "branch must not have been created");
  assert.equal(baseHasImpl(repo), false);
});

// ---- ALIGNED merges ----

test("ALIGNED on first review → merges into main locally, exit 0", () => {
  const repo = initRepo();
  const cfgDir = tmp("orch-cfg-");
  const cfg = writeTestConfig(cfgDir, 3);
  const wo = writeWorkOrder(cfgDir, "feature/aligned");
  const runsDir = join(tmp("orch-runs-"), "runs");
  const { runner, calls } = scriptedRunner(repo, ["all good\nVERDICT: ALIGNED"]);

  const res = runDispatch({
    workOrderPath: wo,
    repoRoot: repo,
    configPath: cfg,
    runsDir,
    decisionsDir: join(tmp("orch-dec-"), "decisions"),
    runner,
  });

  assert.equal(res.outcome, "merged");
  assert.equal(res.exitCode, 0);
  assert.equal(res.coderRuns, 1);
  assert.equal(res.reviews, 1);
  assert.equal(baseHasImpl(repo), true, "main should contain the merged work");
  assert.equal(calls.filter((c) => c.role === "coder").length, 1);
  assert.equal(calls.filter((c) => c.role === "reviewer").length, 1);
});

// ---- revise bound + decision card on exhaustion ----

test("persistent FLAGS → bounded revises, files card, exit 3, NEVER merges", () => {
  const repo = initRepo();
  const cfgDir = tmp("orch-cfg-");
  const N = 2;
  const cfg = writeTestConfig(cfgDir, N);
  const wo = writeWorkOrder(cfgDir, "feature/exhaust");
  const runsDir = join(tmp("orch-runs-"), "runs");
  const decisionsDir = join(tmp("orch-dec-"), "decisions");
  // reviewer always FLAGS
  const { runner, calls } = scriptedRunner(repo, ["VERDICT: FLAGS\n- still wrong"]);

  const res = runDispatch({
    workOrderPath: wo,
    repoRoot: repo,
    configPath: cfg,
    runsDir,
    decisionsDir,
    runner,
  });

  assert.equal(res.outcome, "flags-exhausted");
  assert.equal(res.exitCode, 3);
  // N=2 → 1 initial + 2 revises = 3 coder runs; N+1 = 3 reviews.
  assert.equal(res.coderRuns, 3);
  assert.equal(res.reviews, 3);
  assert.equal(calls.filter((c) => c.role === "coder").length, 3);
  assert.equal(calls.filter((c) => c.role === "reviewer").length, 3);
  assert.equal(baseHasImpl(repo), false, "must NOT merge on exhausted revisions");

  // a PENDING decision card was filed
  assert.ok(res.decisionCardPath && existsSync(res.decisionCardPath));
  const card = readFileSync(res.decisionCardPath!, "utf8");
  assert.match(card, /ruling: PENDING/);
  assert.match(card, /review-exhausted/);
  assert.match(card, /feature\/exhaust/);
  assert.match(card, /APPROVE \/ REVISE \/ PARK/);
});

test("malformed verdict is fail-closed: N=0 garbage review → exhausted, no merge", () => {
  const repo = initRepo();
  const cfgDir = tmp("orch-cfg-");
  const cfg = writeTestConfig(cfgDir, 0);
  const wo = writeWorkOrder(cfgDir, "feature/malformed");
  const decisionsDir = join(tmp("orch-dec-"), "decisions");
  const { runner } = scriptedRunner(repo, ["ship it, looks fine to me"]);

  const res = runDispatch({
    workOrderPath: wo,
    repoRoot: repo,
    configPath: cfg,
    runsDir: join(tmp("orch-runs-"), "runs"),
    decisionsDir,
    runner,
  });

  assert.equal(res.outcome, "flags-exhausted");
  assert.equal(res.exitCode, 3);
  assert.equal(res.reviews, 1);
  assert.equal(baseHasImpl(repo), false);
});

test("coder non-zero exit → throws, never merges (fail closed)", () => {
  const repo = initRepo();
  const cfgDir = tmp("orch-cfg-");
  const cfg = writeTestConfig(cfgDir, 3);
  const wo = writeWorkOrder(cfgDir, "feature/coder-fail");
  const failingRunner: OccupantRunner = (inv) =>
    inv.role === "coder"
      ? { stdout: "", stderr: "boom", code: 7 }
      : { stdout: "VERDICT: ALIGNED", stderr: "", code: 0 };

  assert.throws(
    () =>
      runDispatch({
        workOrderPath: wo,
        repoRoot: repo,
        configPath: cfg,
        runsDir: join(tmp("orch-runs-"), "runs"),
        decisionsDir: join(tmp("orch-dec-"), "decisions"),
        runner: failingRunner,
      }),
    /coder occupant exited 7/,
  );
  assert.equal(baseHasImpl(repo), false);
});

test("REGRESSION: run log INSIDE the repo (gitignored) does not break the merge", () => {
  // Reproduces the live-test bug: the audit log lives under the repo
  // (fabric/orchestrator/runs/), a coder does `git add -A`, and without the
  // gitignore the log gets committed then dirtied, aborting `git checkout base`.
  // The fix is fabric/orchestrator/.gitignore ignoring runs/; here we mirror it.
  const repo = initRepo();
  writeFileSync(join(repo, ".gitignore"), "runs/\n");
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "ignore runs"]);

  const cfgDir = tmp("orch-cfg-");
  const cfg = writeTestConfig(cfgDir, 3);
  const wo = writeWorkOrder(cfgDir, "feature/inrepo-runs");
  const runsDir = join(repo, "runs"); // INSIDE the repo, on purpose
  const { runner } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);

  const res = runDispatch({
    workOrderPath: wo,
    repoRoot: repo,
    configPath: cfg,
    runsDir,
    decisionsDir: join(tmp("orch-dec-"), "decisions"),
    runner,
  });

  assert.equal(res.outcome, "merged");
  assert.equal(res.exitCode, 0);
  assert.equal(baseHasImpl(repo), true);
  // the run log exists but was never committed (ignored)
  assert.equal(git(repo, ["ls-files", "runs/"]).stdout.trim(), "");
});

// ---- config-driven command construction (no vendor string in the loop) ----

test("buildCommand substitutes placeholders from config only", () => {
  const cfgDir = tmp("orch-cfg-");
  const cfg = loadConfig(writeTestConfig(cfgDir, 3));
  const argv = buildCommand("coder", cfg, {
    REPO: "/x/repo",
    BRANCH: "feature/z",
    PROMPT_FILE: "/tmp/p.txt",
  });
  assert.deepEqual(argv, [
    "run-coder",
    "--repo",
    "/x/repo",
    "--branch",
    "feature/z",
    "--prompt",
    "/tmp/p.txt",
  ]);
});

test("ADVERSARIAL: the loop source names no vendor — occupants come only from config", () => {
  const vendorRe = /\b(claude|anthropic|glm|zhipu|gpt|openai|gemini|fable|opus|sonnet|haiku|mistral|cohere|llama)\b/i;
  const sources = readdirSync(HERE).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  );
  assert.ok(sources.includes("dispatch.ts"));
  for (const f of sources) {
    const text = readFileSync(join(HERE, f), "utf8");
    const m = text.match(vendorRe);
    assert.equal(m, null, `${f} must contain no vendor string, found: ${m?.[0]}`);
  }
});

test("the real config.json loads and defines the required + six layer roles", () => {
  const cfg = loadConfig(join(HERE, "config.json"));
  assert.ok(cfg.roles.coder && cfg.roles.reviewer && cfg.roles.orchestrator);
  for (const layer of ["research", "front-end", "back-end", "content", "business"]) {
    assert.ok(cfg.roles[layer], `missing layer role ${layer}`);
  }
  assert.equal(typeof cfg.maxReviseCycles, "number");
  // GLM slot is documented as an alternate, disabled until WS-D.
  assert.ok(cfg.alternates && cfg.alternates.coder);
  assert.equal(cfg.alternates.coder.enabled, false);
});

// ---- dry-run shape ----

test("--dry-run prints exact commands, mutates nothing", () => {
  const repo = initRepo();
  const cfgDir = tmp("orch-cfg-");
  const cfg = writeTestConfig(cfgDir, 3);
  const wo = writeWorkOrder(cfgDir, "feature/dry");
  let called = 0;
  const runner: OccupantRunner = () => {
    called++;
    return { stdout: "", stderr: "", code: 0 };
  };

  const res = runDispatch({
    workOrderPath: wo,
    repoRoot: repo,
    configPath: cfg,
    runsDir: join(tmp("orch-runs-"), "runs"),
    decisionsDir: join(tmp("orch-dec-"), "decisions"),
    dryRun: true,
    runner,
  });

  assert.equal(res.outcome, "dry-run");
  assert.equal(res.exitCode, 0);
  assert.equal(called, 0, "dry-run must not invoke an occupant");
  assert.ok(res.plannedCommands);
  const roles = res.plannedCommands!.map((p) => p.role);
  assert.deepEqual(roles, ["coder", "reviewer"]);
  // {REPO} substituted to the repo path in both planned commands
  for (const p of res.plannedCommands!) {
    assert.ok(p.argv.includes(repo), `${p.role} argv should include repo path`);
    assert.ok(!p.argv.join(" ").includes("{REPO}"), "no unsubstituted {REPO}");
  }
  // no branch created, no run file written
  assert.equal(currentBranchOf(repo), "main");
});

// ---- audit-log append ----

test("audit JSONL is appended, one parseable object per step, no secrets", () => {
  const repo = initRepo();
  const cfgDir = tmp("orch-cfg-");
  const cfg = writeTestConfig(cfgDir, 3);
  const wo = writeWorkOrder(cfgDir, "feature/audit");
  const runsDir = join(tmp("orch-runs-"), "runs");
  const { runner } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);

  const res = runDispatch({
    workOrderPath: wo,
    repoRoot: repo,
    configPath: cfg,
    runsDir,
    decisionsDir: join(tmp("orch-dec-"), "decisions"),
    runner,
  });

  assert.ok(res.runFile && existsSync(res.runFile));
  const lines = readFileSync(res.runFile!, "utf8").trim().split("\n");
  const entries = lines.map((l) => JSON.parse(l));
  const steps = entries.map((e) => e.step);
  assert.ok(steps.includes("start"));
  assert.ok(steps.includes("coder"));
  assert.ok(steps.includes("reviewer"));
  assert.ok(steps.includes("merge"));
  assert.ok(steps.includes("done"));
  // every entry has ts + run; commands are argv arrays (from config, no secrets)
  for (const e of entries) {
    assert.equal(typeof e.ts, "string");
    assert.equal(e.run, "feature-audit");
    if (e.command) assert.ok(Array.isArray(e.command));
  }
});
