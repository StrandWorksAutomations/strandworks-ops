#!/usr/bin/env node
// cli.ts — command-line front-end to the spend gate, so any orchestrator (or a
// human) can invoke the gate without importing the library.
//
// Usage:
//   node fabric/spend-gate/cli.ts check --amount 60 --project 3rdrider \
//        --purpose "RunPod render burst" [--requested-by orchestrator] [--json]
//   node fabric/spend-gate/cli.ts status [--json]
//
// Paths default to the repo root inferred from this file's location; override
// with --repo-root <dir> or the individual --ledger / --ceiling / --decisions.
//
// Exit codes: 0 = allowed, 3 = refused (over ceiling), 1 = usage/error.
// The distinct refused code lets a shell caller branch on the gate outcome.

import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { checkSpend, defaultPaths, monthOf, type SpendGatePaths } from "./gate.ts";
import { readLedger, monthAllowedTotalCents } from "./ledger.ts";
import { loadCeilingCents } from "./config.ts";
import { centsToDollarString } from "./money.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
// fabric/spend-gate/ -> repo root is two levels up.
const DEFAULT_REPO_ROOT = resolve(HERE, "..", "..");

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

function resolvePaths(args: Record<string, string | boolean>): SpendGatePaths {
  const repoRoot =
    typeof args["repo-root"] === "string"
      ? resolve(args["repo-root"])
      : DEFAULT_REPO_ROOT;
  const base = defaultPaths(repoRoot);
  return {
    ledgerPath:
      typeof args.ledger === "string" ? resolve(args.ledger) : base.ledgerPath,
    ceilingPath:
      typeof args.ceiling === "string" ? resolve(args.ceiling) : base.ceilingPath,
    decisionsDir:
      typeof args.decisions === "string"
        ? resolve(args.decisions)
        : base.decisionsDir,
  };
}

function usage(): void {
  process.stderr.write(
    `spend-gate — mechanical cumulative spend gate\n\n` +
      `Commands:\n` +
      `  check --amount <usd> --project <p> --purpose <text> [--requested-by <who>] [--json]\n` +
      `  status [--json]\n\n` +
      `Common flags: --repo-root <dir> | --ledger <file> --ceiling <file> --decisions <dir>\n` +
      `Exit codes: 0 allowed, 3 refused (over ceiling), 1 usage/error.\n`,
  );
}

function cmdCheck(args: Record<string, string | boolean>): number {
  const amount = args.amount;
  const project = args.project;
  const purpose = args.purpose;
  if (typeof amount !== "string" || typeof project !== "string" || typeof purpose !== "string") {
    usage();
    return 1;
  }
  const paths = resolvePaths(args);
  const requestedBy =
    typeof args["requested-by"] === "string" ? args["requested-by"] : "cli";

  const res = checkSpend({ amount, project, purpose, requestedBy }, paths);

  if (args.json) {
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  } else {
    const line =
      res.status === "allowed"
        ? `ALLOWED  $${centsToDollarString(res.amountCents)}  ` +
          `(month ${res.month}: $${centsToDollarString(res.priorMonthTotalCents)} -> ` +
          `$${centsToDollarString(res.projectedMonthTotalCents)} of $${centsToDollarString(res.ceilingCents)})`
        : `REFUSED  $${centsToDollarString(res.amountCents)}  would make month ${res.month} ` +
          `total $${centsToDollarString(res.projectedMonthTotalCents)} > ceiling ` +
          `$${centsToDollarString(res.ceilingCents)}\n` +
          `  owner decision card filed: ${res.decisionCardPath}`;
    process.stdout.write(line + "\n");
  }
  return res.status === "allowed" ? 0 : 3;
}

function cmdStatus(args: Record<string, string | boolean>): number {
  const paths = resolvePaths(args);
  const month = monthOf(new Date());
  const ceilingCents = loadCeilingCents(paths.ceilingPath);
  const entries = readLedger(paths.ledgerPath);
  const totalCents = monthAllowedTotalCents(entries, month);
  const remainingCents = ceilingCents - totalCents;

  if (args.json) {
    process.stdout.write(
      JSON.stringify(
        {
          month,
          allowedTotalCents: totalCents,
          ceilingCents,
          remainingCents,
        },
        null,
        2,
      ) + "\n",
    );
  } else {
    process.stdout.write(
      `month ${month}: allowed autonomous spend $${centsToDollarString(totalCents)} ` +
        `/ ceiling $${centsToDollarString(ceilingCents)} ` +
        `(remaining $${centsToDollarString(remainingCents)})\n`,
    );
  }
  return 0;
}

function main(): number {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));
  switch (cmd) {
    case "check":
      return cmdCheck(args);
    case "status":
      return cmdStatus(args);
    case "help":
    case "--help":
    case undefined:
      usage();
      return cmd === undefined ? 1 : 0;
    default:
      process.stderr.write(`unknown command: ${cmd}\n`);
      usage();
      return 1;
  }
}

process.exit(main());
