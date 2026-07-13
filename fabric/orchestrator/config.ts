// config.ts — load and validate the role-occupant config, and build a concrete
// argv from a role's command template.
//
// THE INVARIANT THIS FILE PROTECTS: occupants are DATA, never code. This module
// contains no vendor name. It reads config.json (which is the only place an
// occupant is named) and turns a role's argv template into a concrete command by
// substituting placeholders. Failover = editing config.json; nothing here
// changes. If the role or its command template is missing/ill-typed, we THROW
// (fail closed) — the loop must never run an occupant it cannot construct.

import { readFileSync } from "node:fs";

export interface RoleConfig {
  provider: string;
  occupant?: string;
  command: string[];
  enabled?: boolean;
}

export interface OrchestratorConfig {
  maxReviseCycles: number;
  baseBranch: string;
  roles: Record<string, RoleConfig>;
  alternates?: Record<string, RoleConfig>;
}

/** Placeholder substitutions the loop supplies when building a command. */
export interface Substitutions {
  REPO?: string;
  BRANCH?: string;
  BASE?: string;
  PROMPT_FILE?: string;
  DIFF_FILE?: string;
}

export const DEFAULT_MAX_REVISE_CYCLES = 3;

function validateRole(role: string, rc: unknown): RoleConfig {
  if (typeof rc !== "object" || rc === null) {
    throw new Error(`config role "${role}" is not an object`);
  }
  const r = rc as Record<string, unknown>;
  if (typeof r.provider !== "string" || r.provider.length === 0) {
    throw new Error(`config role "${role}" missing string "provider"`);
  }
  if (
    !Array.isArray(r.command) ||
    r.command.length === 0 ||
    !r.command.every((a) => typeof a === "string")
  ) {
    throw new Error(
      `config role "${role}" must have a non-empty "command" array of strings`,
    );
  }
  return {
    provider: r.provider,
    occupant: typeof r.occupant === "string" ? r.occupant : undefined,
    command: r.command as string[],
    enabled: typeof r.enabled === "boolean" ? r.enabled : undefined,
  };
}

/** Load + validate config.json. Throws (fail closed) on any malformed input. */
export function loadConfig(path: string): OrchestratorConfig {
  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`orchestrator config ${path} is not valid JSON: ${String(err)}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`orchestrator config ${path} is not an object`);
  }
  const cfg = parsed as Record<string, unknown>;

  const maxReviseCycles =
    cfg.maxReviseCycles === undefined
      ? DEFAULT_MAX_REVISE_CYCLES
      : cfg.maxReviseCycles;
  if (
    typeof maxReviseCycles !== "number" ||
    !Number.isInteger(maxReviseCycles) ||
    maxReviseCycles < 0
  ) {
    throw new Error(
      `orchestrator config "maxReviseCycles" must be a non-negative integer`,
    );
  }

  const baseBranch =
    typeof cfg.baseBranch === "string" && cfg.baseBranch.length > 0
      ? cfg.baseBranch
      : "main";

  if (typeof cfg.roles !== "object" || cfg.roles === null) {
    throw new Error(`orchestrator config ${path} missing "roles" object`);
  }
  const rolesIn = cfg.roles as Record<string, unknown>;
  const roles: Record<string, RoleConfig> = {};
  for (const [name, rc] of Object.entries(rolesIn)) {
    roles[name] = validateRole(name, rc);
  }
  // The dispatch loop needs at least these two occupants.
  for (const required of ["coder", "reviewer"]) {
    if (!roles[required]) {
      throw new Error(`orchestrator config ${path} missing required role "${required}"`);
    }
  }

  let alternates: Record<string, RoleConfig> | undefined;
  if (typeof cfg.alternates === "object" && cfg.alternates !== null) {
    alternates = {};
    for (const [name, rc] of Object.entries(cfg.alternates as Record<string, unknown>)) {
      alternates[name] = validateRole(`alternates.${name}`, rc);
    }
  }

  return { maxReviseCycles, baseBranch, roles, alternates };
}

/** Substitute {TOKEN} placeholders in one arg. Unknown tokens are left intact. */
function substitute(arg: string, subs: Substitutions): string {
  return arg.replace(/\{([A-Z_]+)\}/g, (whole, key: string) => {
    const v = (subs as Record<string, string | undefined>)[key];
    return v === undefined ? whole : v;
  });
}

/**
 * Build the concrete argv for a role from config, substituting placeholders.
 * The occupant is entirely determined by config[role].command — this function
 * never names one. Throws if the role is absent (fail closed).
 */
export function buildCommand(
  role: string,
  cfg: OrchestratorConfig,
  subs: Substitutions,
): string[] {
  const rc = cfg.roles[role];
  if (!rc) throw new Error(`no role "${role}" in orchestrator config`);
  return rc.command.map((arg) => substitute(arg, subs));
}
