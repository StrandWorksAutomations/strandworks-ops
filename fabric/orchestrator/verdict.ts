// verdict.ts — parse the reviewer occupant's machine-readable verdict.
//
// The adversarial review gate emits exactly one authoritative verdict line:
//
//     VERDICT: ALIGNED     (the diff honors canon — merge)
//     VERDICT: FLAGS       (misalignments found — findings follow, revise)
//
// FAIL CLOSED is the whole point: anything we cannot read as a clean ALIGNED is
// FLAGS. A missing line, garbage, or an ambiguous both-appear output is never a
// pass. Only an unambiguous ALIGNED (at least one ALIGNED line and no FLAGS line)
// merges. This mirrors VISION: "The review gate is never traded for speed."

export type Verdict = "ALIGNED" | "FLAGS";

export interface VerdictResult {
  verdict: Verdict;
  /** true when no parseable VERDICT line was found at all */
  malformed: boolean;
  /** reviewer findings (text after the first verdict line), for the revise prompt */
  findings: string;
}

const VERDICT_LINE = /^[ \t>*_-]*VERDICT:[ \t]*(ALIGNED|FLAGS)\b/gim;

export function parseVerdict(text: string): VerdictResult {
  const src = typeof text === "string" ? text : "";
  const matches = [...src.matchAll(VERDICT_LINE)];

  if (matches.length === 0) {
    return {
      verdict: "FLAGS",
      malformed: true,
      findings:
        "No parseable 'VERDICT: ALIGNED|FLAGS' line in reviewer output. " +
        "Fail closed → treated as FLAGS (never a pass).",
    };
  }

  const hasFlags = matches.some((m) => m[1].toUpperCase() === "FLAGS");
  const hasAligned = matches.some((m) => m[1].toUpperCase() === "ALIGNED");

  // Merge ONLY on an unambiguous ALIGNED. Any FLAGS present (even alongside an
  // ALIGNED) is fail-closed to FLAGS.
  if (hasAligned && !hasFlags) {
    return { verdict: "ALIGNED", malformed: false, findings: "" };
  }

  return {
    verdict: "FLAGS",
    malformed: false,
    findings: extractFindings(src),
  };
}

/** Everything after the first verdict line, trimmed; whole text as fallback. */
function extractFindings(text: string): string {
  const idx = text.search(/^[ \t>*_-]*VERDICT:[ \t]*(ALIGNED|FLAGS)\b/im);
  if (idx < 0) return text.trim();
  const afterLine = text.slice(idx).replace(/^.*(?:\r?\n|$)/, "");
  const trimmed = afterLine.trim();
  return trimmed.length > 0 ? trimmed : text.trim();
}
