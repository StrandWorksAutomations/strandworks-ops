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
}

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
  // Slug preference: branch (stable, unique) → title → filename.
  const slugSource = branch ?? title ?? basename(path).replace(/\.md$/i, "");
  return { path, raw, branch, slug: slugify(slugSource), title };
}
