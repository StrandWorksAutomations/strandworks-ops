// presprint.ts — pre-sprint alerts + oversight levels (SPEC WS-C).
//
// Before a sprint runs, the orchestrator FILES a pre-sprint alert as a decision
// card in _governance/decisions/ (YYYY-MM-DD-presprint-<slug>.md): what / why /
// scope / risk, a mechanical hero-vs-internal classification (workorder.ts), and
// a proposed oversight level (hero → HIGH, internal → LOW). The owner RULES the
// card; agents never rule. The dispatch loop then reads the ruling to decide how
// much oversight the sprint gets.
//
// THE INVARIANTS (SPEC WS-C, VISION Autonomy Floor):
//   - Silence on hero work always HOLDS (dispatch refuses to start).
//   - Classification failure defaults to more oversight (HERO), never less.
//   - Agents FILE cards; only the owner RULES. Oversight is set by an owner
//     ruling, exactly like the spend gate's over-ceiling cards.
//
// Owner channels for the ruling (both honored by parseOversightRuling):
//   1. A direct level token — ruling: HIGH | LOW | HALT (typed in a session).
//   2. The cockpit's EXISTING generic mechanism: it renders the card's lettered
//      options (A/B/C) as one-tap buttons that commit `ruling: APPROVE` with the
//      chosen letter as `answer:`. The `oversight-options:` frontmatter line maps
//      each letter back to a level (A=HIGH, B=LOW, C=HALT). HALT is also a native
//      owner-token button, so it can be tapped directly.

import { writeFileSync, appendFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { classifyAudience, type Classification } from "./workorder.ts";

export type OversightLevel = "HIGH" | "LOW" | "HALT" | "PENDING";

export interface FiledCard {
  id: string;
  path: string;
}

export interface PresprintAlertInput {
  decisionsDir: string; // absolute path to _governance/decisions/
  date: string; // YYYY-MM-DD
  slug: string;
  branch: string;
  audience: string | undefined; // the work-order's raw audience field
  title?: string; // work-order title, for the alert prose
  what?: string; // one-line summary of the work (falls back to title/slug)
  scope?: string; // optional scope note
  risk?: string; // optional risk note
}

// The fixed letter → level map the card advertises and parseOversightRuling
// honors. Kept in one place so the card text and the parser never drift.
const OVERSIGHT_OPTION_MAP: Record<string, OversightLevel> = {
  A: "HIGH",
  B: "LOW",
  C: "HALT",
};
const OVERSIGHT_OPTIONS_LINE = "A=HIGH, B=LOW, C=HALT";

/** hero → HIGH, internal → LOW (the default oversight the alert proposes). */
export function proposedOversight(classification: Classification): OversightLevel {
  return classification === "hero" ? "HIGH" : "LOW";
}

function presprintPath(decisionsDir: string, date: string, slug: string): { id: string; path: string } {
  let id = `${date}-presprint-${slug}`;
  let path = join(decisionsDir, `${id}.md`);
  let n = 2;
  while (existsSync(path)) {
    id = `${date}-presprint-${slug}-${n}`;
    path = join(decisionsDir, `${id}.md`);
    n++;
  }
  return { id, path };
}

/**
 * File the pre-sprint alert card. Returns its id + path. A numeric suffix is
 * added if a same-id card already exists, so a pending alert is never clobbered.
 */
export function filePresprintAlert(input: PresprintAlertInput): FiledCard {
  const { decisionsDir, date, slug, branch, audience, title } = input;
  mkdirSync(decisionsDir, { recursive: true });

  const { classification, reason } = classifyAudience(audience);
  const proposed = proposedOversight(classification);
  const { id, path } = presprintPath(decisionsDir, date, slug);

  const what = (input.what ?? title ?? slug).trim();
  const scope = (input.scope ?? `Branch \`${branch}\`.`).trim();
  const risk = (
    input.risk ??
    (classification === "hero"
      ? "Human- or client-facing — a mistake is visible outside the fabric."
      : "Internal / reversible plumbing — contained and revertible.")
  ).trim();

  const body = `---
id: ${id}
filed: ${date}
filed-by: orchestrator (fabric, pre-sprint alert)
question: Pre-sprint alert — set the oversight level for "${what}" (branch "${branch}").
classification: ${classification}
proposed-oversight: ${proposed}
oversight-options: ${OVERSIGHT_OPTIONS_LINE}
ruling: PENDING
---

**A sprint is about to run. Set its oversight level before it starts.**

- **What:** ${what}
- **Why:** ${title ? `Work-order "${title}".` : "See the work-order for the full goal."}
- **Scope:** ${scope}
- **Risk:** ${risk}
- **Classification:** ${classification.toUpperCase()} — ${reason}
- **Proposed oversight:** ${proposed}${
    proposed === "HIGH"
      ? " (eyes-on: the loop pauses for your checkpoints)"
      : " (autorun: runs to completion under the review gate)"
  }

**Options:**
- **A — HIGH** — eyes-on. The loop pauses for owner checkpoints (after the coder
  finishes and after the review) and will not merge without you resuming it.
- **B — LOW** — autorun. The sprint runs to completion under the standard,
  non-optional adversarial review gate.
- **C — HALT** — do not run this sprint at all.

Reply A / B / C (or type HIGH / LOW / HALT).
`;

  writeFileSync(path, body);
  return { id, path };
}

// ---- reading the owner's ruling ----

export interface OversightRuling {
  level: OversightLevel; // HIGH / LOW / HALT, or PENDING when no level is set
  ruled: boolean; // true if the card carries a non-PENDING ruling of any kind
  cardPath?: string; // the card the ruling came from, if one exists
  rawRuling: string; // the verbatim frontmatter ruling value ("" when no card)
}

/** Minimal frontmatter reader — same shape the cockpit's decisions lib uses. */
function readFrontmatter(raw: string): Record<string, string> {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm: Record<string, string> = {};
  if (!m) return fm;
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return fm;
}

/**
 * Locate the pre-sprint card for a slug. Searches decisionsDir and its
 * resolved/ subdir (a ruled card is moved to resolved/ by the cockpit). Returns
 * the newest-id match, or undefined if none exists. Ignores README.md.
 */
export function findPresprintCard(decisionsDir: string, slug: string): string | undefined {
  const prefixMatch = new RegExp(`-presprint-${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:-\\d+)?\\.md$`);
  const candidates: string[] = [];
  for (const dir of [decisionsDir, join(decisionsDir, "resolved")]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f === "README.md") continue;
      if (prefixMatch.test(f) && f.includes("-presprint-")) candidates.push(join(dir, f));
    }
  }
  if (candidates.length === 0) return undefined;
  // Newest by filename (date-prefixed ids sort lexically); a numeric suffix
  // (…-2) sorts after the unsuffixed one, so the latest filed card wins.
  candidates.sort();
  return candidates[candidates.length - 1];
}

/**
 * Interpret a card's frontmatter into an oversight level. Precedence:
 *   - no ruling / PENDING          → PENDING, ruled=false (this is SILENCE)
 *   - ruling HIGH / LOW / HALT     → that level, ruled=true
 *   - ruling APPROVE + answer L    → oversight-options[L] (else proposed), ruled=true
 *   - ruling APPROVE (no answer)   → proposed-oversight, ruled=true
 *   - ruling PARK                  → HALT (hold — do not run), ruled=true
 *   - any other ruling             → PENDING, ruled=true (owner spoke, but not a
 *                                     level — dispatch HOLDS; never guesses)
 * A ruled=true PENDING is NOT silence: the owner ruled something, just not a
 * level, so the fail-toward-oversight hold applies to hero AND internal.
 */
export function parseOversightRuling(cardRaw: string): OversightRuling {
  const fm = readFrontmatter(cardRaw);
  const rawRuling = (fm.ruling ?? "").trim();
  const ruling = rawRuling.toUpperCase();

  if (ruling === "" || ruling === "PENDING") {
    return { level: "PENDING", ruled: false, rawRuling };
  }
  if (ruling === "HIGH" || ruling === "LOW" || ruling === "HALT") {
    return { level: ruling as OversightLevel, ruled: true, rawRuling };
  }
  if (ruling === "PARK") {
    return { level: "HALT", ruled: true, rawRuling };
  }
  if (ruling === "APPROVE") {
    const optionMap = parseOptionMap(fm["oversight-options"]);
    const answer = (fm.answer ?? "").trim().toUpperCase();
    const viaAnswer = answer ? optionMap[answer] : undefined;
    if (viaAnswer) return { level: viaAnswer, ruled: true, rawRuling };
    const proposed = (fm["proposed-oversight"] ?? "").trim().toUpperCase();
    if (proposed === "HIGH" || proposed === "LOW" || proposed === "HALT") {
      return { level: proposed as OversightLevel, ruled: true, rawRuling };
    }
    // APPROVE with nothing to approve against → fail toward oversight.
    return { level: "PENDING", ruled: true, rawRuling };
  }
  // REVISE / BLESSED / CLEAR / anything else: a ruling, but not a level.
  return { level: "PENDING", ruled: true, rawRuling };
}

/** Parse an "A=HIGH, B=LOW, C=HALT" line into a letter→level map (falls back to the default). */
function parseOptionMap(line: string | undefined): Record<string, OversightLevel> {
  if (!line || line.trim().length === 0) return { ...OVERSIGHT_OPTION_MAP };
  const out: Record<string, OversightLevel> = {};
  for (const pair of line.split(/[,;]/)) {
    const m = pair.trim().match(/^([A-Za-z])\s*=\s*(HIGH|LOW|HALT)$/i);
    if (m) out[m[1].toUpperCase()] = m[2].toUpperCase() as OversightLevel;
  }
  return Object.keys(out).length > 0 ? out : { ...OVERSIGHT_OPTION_MAP };
}

/** Read + interpret the pre-sprint card for a slug (undefined card → silence). */
export function readOversight(decisionsDir: string, slug: string): OversightRuling {
  const cardPath = findPresprintCard(decisionsDir, slug);
  if (!cardPath) return { level: "PENDING", ruled: false, rawRuling: "" };
  const raw = readFileSync(cardPath, "utf8");
  return { ...parseOversightRuling(raw), cardPath };
}

/**
 * Append a fabric note to a card's body WITHOUT touching its frontmatter or
 * ruling. Used to record checkpoint pauses and proceed-on-silence events on the
 * card the owner sees. No-ops (returns false) if the card does not exist.
 */
export function notePresprintCard(cardPath: string, iso: string, note: string): boolean {
  if (!existsSync(cardPath)) return false;
  appendFileSync(cardPath, `\n<!-- fabric-note ${iso} -->\n> **[fabric ${iso}]** ${note}\n`);
  return true;
}
