// presprint.test.ts — WS-C: pre-sprint alerts + oversight levels.
//
// Covers: audience classification (incl. MISSING → HERO), alert-card filing
// shape, ruling parsing (HIGH / LOW / HALT / PENDING + the cockpit's APPROVE+
// answer mechanism), silence handling both branches (hero+unset → hold;
// internal+unset → proceeds LOW, logged), HALT refusal, the HIGH checkpoint
// pause/resume machine, and --file-alert-only. Temp dirs only — never the real
// _governance/decisions or runs/.
//
// Run:  node --test "fabric/orchestrator/presprint.test.ts"

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { classifyAudience, slugify } from "./workorder.ts";
import {
  filePresprintAlert,
  parseOversightRuling,
  findPresprintCard,
  proposedOversight,
} from "./presprint.ts";
import { runDispatch, type OccupantRunner, type RunnerResult } from "./dispatch.ts";

// ---- helpers ----

function tmp(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}
function git(repo: string, args: string[]): { code: number; stdout: string } {
  const r = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  return { code: r.status === null ? 1 : r.status, stdout: r.stdout ?? "" };
}
function initRepo(): string {
  const repo = tmp("presprint-repo-");
  assert.equal(git(repo, ["init", "-b", "main"]).code, 0);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test"]);
  writeFileSync(join(repo, ".gitignore"), "runs/\n");
  writeFileSync(join(repo, "README.md"), "seed\n");
  // config at the default path so runDispatch needs no configPath override
  mkdirSync(join(repo, "fabric", "orchestrator"), { recursive: true });
  writeTestConfig(join(repo, "fabric", "orchestrator"));
  git(repo, ["add", "-A"]);
  assert.equal(git(repo, ["commit", "-m", "seed"]).code, 0);
  return repo;
}
/** A vendor-free test config, mirroring dispatch.test.ts. */
function writeTestConfig(dir: string, maxReviseCycles = 3): string {
  const p = join(dir, "config.json");
  writeFileSync(
    p,
    JSON.stringify({
      maxReviseCycles,
      baseBranch: "main",
      roles: {
        coder: { provider: "test-provider", command: ["run-coder", "--repo", "{REPO}", "--branch", "{BRANCH}"] },
        reviewer: { provider: "test-provider", command: ["run-review", "--repo", "{REPO}", "--diff", "{DIFF_FILE}"] },
      },
    }),
  );
  return p;
}
function writeWorkOrder(dir: string, branch: string, audience?: string): string {
  const p = join(dir, `wo-${slugify(branch)}.md`);
  const aud = audience ? `audience: ${audience}\n` : "";
  writeFileSync(p, `# WS-C test\n\nbranch: ${branch}\n${aud}\nGoal: make impl.txt.\n`);
  return p;
}
/** Coder commits impl.txt; reviewer returns the next scripted stdout. */
function scriptedRunner(repo: string, reviewerOutputs: string[]) {
  const calls: { role: string }[] = [];
  let coderCycle = 0;
  let reviewIdx = 0;
  const runner: OccupantRunner = (inv): RunnerResult => {
    calls.push({ role: inv.role });
    if (inv.role === "coder") {
      writeFileSync(join(repo, "impl.txt"), `work cycle ${coderCycle}\n`);
      coderCycle++;
      git(repo, ["add", "-A"]);
      git(repo, ["commit", "-m", `coder ${coderCycle}`]);
      return { stdout: "", stderr: "", code: 0 };
    }
    const out = reviewerOutputs[Math.min(reviewIdx, reviewerOutputs.length - 1)];
    reviewIdx++;
    return { stdout: out, stderr: "", code: 0 };
  };
  return { runner, calls };
}
function currentBranch(repo: string): string {
  return git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
}
function baseHasImpl(repo: string): boolean {
  return git(repo, ["cat-file", "-e", "main:impl.txt"]).code === 0;
}
/** Write a pre-sprint card for `branch`'s slug with an owner ruling already set. */
function fileRuledCard(
  decisionsDir: string,
  branch: string,
  ruling: string,
  extra: { answer?: string; proposed?: string; options?: string } = {},
): string {
  const slug = slugify(branch);
  const id = `2026-07-13-presprint-${slug}`;
  mkdirSync(decisionsDir, { recursive: true });
  const path = join(decisionsDir, `${id}.md`);
  const answer = extra.answer ? `answer: ${extra.answer}\n` : "";
  const proposed = extra.proposed ?? "HIGH";
  const options = extra.options ?? "A=HIGH, B=LOW, C=HALT";
  writeFileSync(
    path,
    `---\nid: ${id}\nfiled: 2026-07-13\nfiled-by: orchestrator (fabric, pre-sprint alert)\n` +
      `question: set oversight\nclassification: hero\nproposed-oversight: ${proposed}\n` +
      `oversight-options: ${options}\nruling: ${ruling}\n${answer}---\n\nbody\n`,
  );
  return path;
}
const NOW = new Date("2026-07-13T12:00:00Z");
function dirs() {
  return {
    runsDir: join(tmp("presprint-runs-"), "runs"),
    decisionsDir: join(tmp("presprint-dec-"), "decisions"),
  };
}

// ---- classification ----

test("classifyAudience: explicit hero / internal, and MISSING → HERO", () => {
  assert.equal(classifyAudience("hero").classification, "hero");
  assert.equal(classifyAudience("client-facing").classification, "hero");
  assert.equal(classifyAudience("internal").classification, "internal");
  assert.equal(classifyAudience("plumbing").classification, "internal");
  // The load-bearing invariant: a missing field is HERO (fail toward oversight).
  assert.equal(classifyAudience(undefined).classification, "hero");
  assert.equal(classifyAudience("").classification, "hero");
  // Unrecognized value also fails toward HERO, never internal.
  assert.equal(classifyAudience("mystery-value").classification, "hero");
});

test("proposedOversight: hero → HIGH, internal → LOW", () => {
  assert.equal(proposedOversight("hero"), "HIGH");
  assert.equal(proposedOversight("internal"), "LOW");
});

// ---- alert card shape ----

test("filePresprintAlert writes a PENDING card with classification, proposal, and A/B/C options", () => {
  const { decisionsDir } = dirs();
  const card = filePresprintAlert({
    decisionsDir,
    date: "2026-07-13",
    slug: "feature-x",
    branch: "feature/x",
    audience: undefined, // → hero
    title: "Ship feature X",
  });
  assert.ok(existsSync(card.path));
  const raw = readFileSync(card.path, "utf8");
  assert.match(raw, /ruling: PENDING/);
  assert.match(raw, /classification: hero/);
  assert.match(raw, /proposed-oversight: HIGH/);
  assert.match(raw, /oversight-options: A=HIGH, B=LOW, C=HALT/);
  assert.match(raw, /\*\*A — HIGH\*\*/);
  assert.match(raw, /\*\*B — LOW\*\*/);
  assert.match(raw, /\*\*C — HALT\*\*/);
  assert.match(raw, /Reply A \/ B \/ C/);
  // internal work proposes LOW
  const card2 = filePresprintAlert({
    decisionsDir,
    date: "2026-07-13",
    slug: "chore-y",
    branch: "chore/y",
    audience: "internal",
  });
  assert.match(readFileSync(card2.path, "utf8"), /proposed-oversight: LOW/);
});

test("filePresprintAlert never clobbers an existing card (numeric suffix)", () => {
  const { decisionsDir } = dirs();
  const a = filePresprintAlert({ decisionsDir, date: "2026-07-13", slug: "dup", branch: "b", audience: "internal" });
  const b = filePresprintAlert({ decisionsDir, date: "2026-07-13", slug: "dup", branch: "b", audience: "internal" });
  assert.notEqual(a.path, b.path);
  assert.match(b.id, /-2$/);
});

// ---- ruling parsing ----

test("parseOversightRuling: PENDING / missing → PENDING, not ruled (silence)", () => {
  assert.deepEqual(parseOversightRuling("---\nruling: PENDING\n---\n"), {
    level: "PENDING",
    ruled: false,
    rawRuling: "PENDING",
  });
  assert.equal(parseOversightRuling("---\nid: x\n---\n").ruled, false);
});

test("parseOversightRuling: direct HIGH / LOW / HALT tokens", () => {
  assert.equal(parseOversightRuling("---\nruling: HIGH\n---\n").level, "HIGH");
  assert.equal(parseOversightRuling("---\nruling: low\n---\n").level, "LOW");
  assert.equal(parseOversightRuling("---\nruling: HALT\n---\n").level, "HALT");
});

test("parseOversightRuling: cockpit APPROVE + answer letter maps via oversight-options", () => {
  const base = "---\noversight-options: A=HIGH, B=LOW, C=HALT\nproposed-oversight: HIGH\nruling: APPROVE\n";
  assert.equal(parseOversightRuling(base + "answer: A\n---\n").level, "HIGH");
  assert.equal(parseOversightRuling(base + "answer: B\n---\n").level, "LOW");
  assert.equal(parseOversightRuling(base + "answer: C\n---\n").level, "HALT");
  // APPROVE with no answer → the proposed level.
  assert.equal(parseOversightRuling(base + "---\n").level, "HIGH");
});

test("parseOversightRuling: PARK → HALT; REVISE (non-level) → PENDING but ruled", () => {
  assert.equal(parseOversightRuling("---\nruling: PARK\n---\n").level, "HALT");
  const revise = parseOversightRuling("---\nruling: REVISE\n---\n");
  assert.equal(revise.level, "PENDING");
  assert.equal(revise.ruled, true); // owner spoke, just not a level → dispatch holds
});

// ---- silence handling (dispatch integration) ----

test("SILENCE hero: unset alert on hero work HOLDS — refuse to start, exit 4, no coder, files a card", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  const wo = writeWorkOrder(cfgDir, "feature/hero-thing", "hero");
  const { runner, calls } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);

  const res = runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner, now: NOW });

  assert.equal(res.outcome, "presprint-hold");
  assert.equal(res.exitCode, 4);
  assert.equal(res.classification, "hero");
  assert.equal(calls.length, 0, "no occupant runs when hero work is held");
  assert.equal(currentBranch(repo), "main", "held sprint must not create its branch");
  assert.equal(baseHasImpl(repo), false);
  // a pre-sprint card was filed so the owner can rule on it
  const card = findPresprintCard(decisionsDir, slugify("feature/hero-thing"));
  assert.ok(card && existsSync(card));
  assert.match(readFileSync(card!, "utf8"), /silence on hero work holds/i);
});

test("SILENCE internal: unset alert on internal work PROCEEDS at LOW, logs proceed-on-silence, merges", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  const wo = writeWorkOrder(cfgDir, "chore/plumbing", "internal");
  const { runner, calls } = scriptedRunner(repo, ["all good\nVERDICT: ALIGNED"]);

  const res = runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner, now: NOW });

  assert.equal(res.outcome, "merged");
  assert.equal(res.exitCode, 0);
  assert.equal(res.oversight, "LOW");
  assert.equal(baseHasImpl(repo), true);
  assert.equal(calls.filter((c) => c.role === "coder").length, 1);
  // the proceed-on-silence event is in the audit JSONL...
  const audit = readFileSync(res.runFile!, "utf8");
  assert.match(audit, /proceed-on-silence/);
  // ...and noted on a filed card
  const card = findPresprintCard(decisionsDir, slugify("chore/plumbing"));
  assert.ok(card && existsSync(card));
  assert.match(readFileSync(card!, "utf8"), /PROCEEDED at the LOW default/);
});

// ---- HALT refusal ----

test("HALT ruling → refuse to run, exit 5, no coder, no branch", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  fileRuledCard(decisionsDir, "feature/halt-me", "HALT");
  const wo = writeWorkOrder(cfgDir, "feature/halt-me", "hero");
  const { runner, calls } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);

  const res = runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner, now: NOW });

  assert.equal(res.outcome, "halt-ruled");
  assert.equal(res.exitCode, 5);
  assert.equal(calls.length, 0);
  assert.equal(currentBranch(repo), "main");
  assert.equal(baseHasImpl(repo), false);
});

test("a ruling that is not an oversight level (REVISE) HOLDS both hero and internal", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  fileRuledCard(decisionsDir, "chore/revise-me", "REVISE");
  const wo = writeWorkOrder(cfgDir, "chore/revise-me", "internal"); // even internal holds
  const { runner, calls } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);

  const res = runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner, now: NOW });
  assert.equal(res.outcome, "presprint-hold");
  assert.equal(res.exitCode, 4);
  assert.equal(calls.length, 0);
});

// ---- LOW ruling runs unchanged ----

test("LOW ruling → runs to completion under the review gate (merges)", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  fileRuledCard(decisionsDir, "feature/low-run", "LOW");
  const wo = writeWorkOrder(cfgDir, "feature/low-run", "hero"); // hero, but owner set LOW
  const { runner } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);

  const res = runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner, now: NOW });
  assert.equal(res.outcome, "merged");
  assert.equal(res.oversight, "LOW");
  assert.equal(baseHasImpl(repo), true);
});

// ---- HIGH checkpoint machine ----

test("HIGH: start pauses after coder (exit 6, no merge); resume runs review; resume merges on ALIGNED", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  fileRuledCard(decisionsDir, "feature/high-run", "HIGH");
  const wo = writeWorkOrder(cfgDir, "feature/high-run", "hero");

  // Stage 1: start → coder runs once, then PAUSE.
  const s1 = scriptedRunner(repo, []);
  const r1 = runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner: s1.runner, now: NOW });
  assert.equal(r1.outcome, "checkpoint");
  assert.equal(r1.exitCode, 6);
  assert.equal(r1.stage, "after-coder");
  assert.equal(s1.calls.filter((c) => c.role === "coder").length, 1);
  assert.equal(s1.calls.filter((c) => c.role === "reviewer").length, 0);
  assert.equal(baseHasImpl(repo), false, "HIGH must not merge at the first checkpoint");

  // Stage 2: resume after-coder → review runs, then PAUSE again.
  const s2 = scriptedRunner(repo, ["VERDICT: ALIGNED"]);
  const r2 = runDispatch({
    workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner: s2.runner, now: NOW,
    resumeStage: "after-coder",
  });
  assert.equal(r2.outcome, "checkpoint");
  assert.equal(r2.exitCode, 6);
  assert.equal(r2.stage, "after-review");
  assert.equal(r2.finalVerdict, "ALIGNED");
  assert.equal(s2.calls.filter((c) => c.role === "reviewer").length, 1);
  assert.equal(baseHasImpl(repo), false, "still not merged until the owner resumes the final stage");

  // Stage 3: resume after-review → merge.
  const s3 = scriptedRunner(repo, []);
  const r3 = runDispatch({
    workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner: s3.runner, now: NOW,
    resumeStage: "after-review",
  });
  assert.equal(r3.outcome, "merged");
  assert.equal(r3.exitCode, 0);
  assert.equal(baseHasImpl(repo), true);
  assert.equal(s3.calls.length, 0, "the final stage merges from checkpoint state; no occupant runs");
});

test("HIGH: FLAGS at the review checkpoint finalizes WITHOUT merging (exit 3)", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  fileRuledCard(decisionsDir, "feature/high-flags", "HIGH");
  const wo = writeWorkOrder(cfgDir, "feature/high-flags", "hero");

  runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner: scriptedRunner(repo, []).runner, now: NOW });
  runDispatch({
    workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir,
    runner: scriptedRunner(repo, ["VERDICT: FLAGS\n- not yet"]).runner, now: NOW, resumeStage: "after-coder",
  });
  const r3 = runDispatch({
    workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir,
    runner: scriptedRunner(repo, []).runner, now: NOW, resumeStage: "after-review",
  });
  assert.equal(r3.outcome, "flags-exhausted");
  assert.equal(r3.exitCode, 3);
  assert.equal(baseHasImpl(repo), false);
});

test("HIGH: restarting while a checkpoint is pending throws (must resume, not restart)", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  fileRuledCard(decisionsDir, "feature/high-guard", "HIGH");
  const wo = writeWorkOrder(cfgDir, "feature/high-guard", "hero");
  runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner: scriptedRunner(repo, []).runner, now: NOW });
  assert.throws(
    () => runDispatch({ workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner: scriptedRunner(repo, []).runner, now: NOW }),
    /already paused at stage "after-coder"/,
  );
});

// ---- --file-alert-only ----

test("--file-alert-only files the card and exits, running no work", () => {
  const repo = initRepo();
  const cfgDir = tmp("presprint-cfg-");
  const { runsDir, decisionsDir } = dirs();
  const wo = writeWorkOrder(cfgDir, "feature/alert-first", "hero");
  const { runner, calls } = scriptedRunner(repo, ["VERDICT: ALIGNED"]);

  const res = runDispatch({
    workOrderPath: wo, repoRoot: repo, runsDir, decisionsDir, runner, now: NOW, fileAlertOnly: true,
  });

  assert.equal(res.outcome, "alert-filed");
  assert.equal(res.exitCode, 0);
  assert.equal(res.classification, "hero");
  assert.ok(res.decisionCardPath && existsSync(res.decisionCardPath));
  assert.equal(calls.length, 0, "no coder/reviewer on --file-alert-only");
  assert.equal(currentBranch(repo), "main", "no branch created");
  // exactly one presprint card exists for this slug
  const found = findPresprintCard(decisionsDir, slugify("feature/alert-first"));
  assert.ok(found && existsSync(found));
});

// ---- resolved/ cards are found too ----

test("findPresprintCard locates a ruled card that was moved to resolved/", () => {
  const { decisionsDir } = dirs();
  const resolvedDir = join(decisionsDir, "resolved");
  // written straight into resolved/ to mimic the cockpit moving a ruled card
  mkdirSync(resolvedDir, { recursive: true });
  writeFileSync(join(resolvedDir, "2026-07-13-presprint-feature-moved.md"), "---\nid: x\nruling: LOW\n---\n");
  const found = findPresprintCard(decisionsDir, "feature-moved");
  assert.ok(found && found.includes("resolved"));
  assert.equal(parseOversightRuling(readFileSync(found!, "utf8")).level, "LOW");
});
