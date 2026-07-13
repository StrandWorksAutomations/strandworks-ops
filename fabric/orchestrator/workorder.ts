// workorder.ts — parse a sprint work-order markdown file.
//
// A work-order is the orchestrator's dispatch instruction: goal, scope, the
// branch to work on, and acceptance criteria. The one field the loop MUST have
// is the branch — it declares where the coder works and what gets reviewed and
// merged. We accept a few common ways to write it (frontmatter or a body line);
// if none is present and no --branch override was given, the caller fails closed.

import { readFileSync } from "node:fs";
import { basename } from "node:path";

export interface WorkOrder {
  path: string;
  raw: string;
  branch: string | undefined;
  slug: string;
  title: string | undefined;
  /**
   * The raw `audience:` field, verbatim, or undefined if the work-order omits
   * it. The oversight classification (see classifyAudience) is derived from
   * this — a MISSING field is never silently treated as safe; it classifies
   * HERO (fail toward more oversight). Kept raw here so the derivation stays in
   * one place (classifyAudience) and the parser makes no policy judgment.
   */
  audience: string | undefined;
}

/** hero = a human or a client will see/touch this; internal = reversible plumbing. */
export type Classification = "hero" | "internal";

export interface AudienceClassification {
  classification: Classification;
  /** the normalized audience value that drove the decision (or "" when absent) */
  audience: string;
  /** human-readable reason, for the pre-sprint alert card */
  reason: string;
}

// Words that mark work as internal / reversible plumbing. EVERYTHING else —
// missing, hero-ish, or unrecognized — resolves to hero, so the failure mode is
// always MORE oversight, never less (SPEC WS-C, VISION Autonomy Floor).
const INTERNAL_AUDIENCES = new Set([
  "internal",
  "reversible",
  "plumbing",
  "infra",
  "infrastructure",
  "internal-only",
]);

// Words that explicitly mark hero (human-/client-facing) work. Used only to give
// the alert card a precise reason; the result is hero regardless (default path).
const HERO_AUDIENCES = new Set([
  "hero",
  "human",
  "client",
  "client-facing",
  "human-facing",
  "public",
  "external",
  "customer",
  "user-facing",
]);

const BRANCH_PATTERNS: RegExp[] = [
  // frontmatter or plain line:  branch: feature/foo   /   branch = feature/foo
  /(?:^|\n)[ \t]*branch[ \t]*[:=][ \t]*[`"']?([^\s`"'\n]+)/i,
  // markdown emphasis / list:   **Branch:** feature/foo   /   - Branch: feature/foo
  /(?:^|\n)[ \t]*(?:[-*][ \t]*)?\*\*branch\*\*[ \t]*[:=]?[ \t]*[`"']?([^\s`"'\n]+)/i,
];

function extractBranch(raw: string): string | undefined {
  for (const re of BRANCH_PATTERNS) {
    const m = raw.match(re);
    if (m && m[1]) return m[1];
  }
  return undefined;
}

function extractTitle(raw: string): string | undefined {
  const m = raw.match(/^[ \t]*#[ \t]+(.+)$/m);
  return m ? m[1].trim() : undefined;
}

const AUDIENCE_PATTERNS: RegExp[] = [
  // frontmatter or plain line:  audience: hero   /   audience = internal
  /(?:^|\n)[ \t]*audience[ \t]*[:=][ \t]*[`"']?([^\s`"'\n]+)/i,
  // markdown emphasis / list:   **Audience:** hero   /   - Audience: internal
  /(?:^|\n)[ \t]*(?:[-*][ \t]*)?\*\*audience\*\*[ \t]*[:=]?[ \t]*[`"']?([^\s`"'\n]+)/i,
];

function extractAudience(raw: string): string | undefined {
  for (const re of AUDIENCE_PATTERNS) {
    const m = raw.match(re);
    if (m && m[1]) return m[1];
  }
  return undefined;
}

/**
 * Mechanical hero-vs-internal classification. This is deliberately NOT a
 * judgment call: internal ONLY when the audience field is present AND names a
 * known internal/reversible value; every other case — field missing, field
 * present but unrecognized, or an explicit hero value — resolves to hero. The
 * invariant (SPEC WS-C): classification failure always defaults toward MORE
 * oversight, never less.
 */
export function classifyAudience(audience: string | undefined): AudienceClassification {
  const norm = (audience ?? "").trim().toLowerCase();
  if (norm.length === 0) {
    return {
      classification: "hero",
      audience: "",
      reason:
        "no `audience:` field on the work-order — classified HERO (fail toward more oversight).",
    };
  }
  if (INTERNAL_AUDIENCES.has(norm)) {
    return {
      classification: "internal",
      audience: norm,
      reason: `audience "${norm}" is internal / reversible plumbing.`,
    };
  }
  if (HERO_AUDIENCES.has(norm)) {
    return {
      classification: "hero",
      audience: norm,
      reason: `audience "${norm}" is human- or client-facing.`,
    };
  }
  return {
    classification: "hero",
    audience: norm,
    reason: `audience "${norm}" is not a recognized internal value — classified HERO (fail toward more oversight).`,
  };
}

/** Filesystem-safe slug (shared shape with the spend gate's slugify). */
export function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return s.length > 0 ? s : "work-order";
}

export function parseWorkOrder(path: string): WorkOrder {
  const raw = readFileSync(path, "utf8");
  const branch = extractBranch(raw);
  const title = extractTitle(raw);
  const audience = extractAudience(raw);
  // Slug preference: branch (stable, unique) → title → filename.
  const slugSource = branch ?? title ?? basename(path).replace(/\.md$/i, "");
  return { path, raw, branch, slug: slugify(slugSource), title, audience };
}
