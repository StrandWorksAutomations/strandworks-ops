// config.ts — load the owner-adjustable ceiling.
//
// The ceiling is NEVER hardcoded in the gate logic. It is read from
// fabric/spend-gate/ceiling.json every time the gate runs, so the owner can
// adjust it case-by-case (VISION Autonomy Floor #1). The default value lives
// in the JSON file, not here.

import { readFileSync } from "node:fs";
import { dollarsToCents } from "./money.ts";

export interface CeilingConfig {
  ceiling_usd: number;
  note?: string;
}

/** Load the ceiling config from a JSON path and return the ceiling in cents. */
export function loadCeilingCents(path: string): number {
  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`ceiling config ${path} is not valid JSON: ${String(err)}`);
  }
  const cfg = parsed as CeilingConfig;
  if (typeof cfg.ceiling_usd !== "number" || !Number.isFinite(cfg.ceiling_usd)) {
    throw new Error(`ceiling config ${path} missing numeric "ceiling_usd"`);
  }
  if (cfg.ceiling_usd < 0) {
    throw new Error(`ceiling_usd must be non-negative, got ${cfg.ceiling_usd}`);
  }
  return dollarsToCents(cfg.ceiling_usd);
}
