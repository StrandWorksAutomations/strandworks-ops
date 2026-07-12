// Decision-file parser/writer for _governance/decisions/*.md.
// Format (per _governance/decisions/README.md): YAML-ish frontmatter with
// id, filed, filed-by, question, ruling; markdown body with context + options.

export const OWNER_TOKENS = [
  "APPROVE",
  "REVISE",
  "PARK",
  "BLESSED",
  "HALT",
  "CLEAR",
] as const;
export type OwnerToken = (typeof OWNER_TOKENS)[number];

export function isOwnerToken(v: string): v is OwnerToken {
  return (OWNER_TOKENS as readonly string[]).includes(v);
}

export type Decision = {
  id: string;
  filed: string;
  filedBy: string;
  question: string;
  ruling: string; // "PENDING" or an owner token
  ruled?: string; // ISO timestamp, present once ruled
  source?: string; // "cockpit" when ruled via this app
  body: string; // markdown after the frontmatter
  raw: string; // full original file content
  filename: string;
};

const FM_RE = /^---\n([\s\S]*?)\n---\n?/;

export function parseDecision(raw: string, filename: string): Decision {
  const m = raw.match(FM_RE);
  if (!m) throw new Error(`decision file has no frontmatter: ${filename}`);
  const fm: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  if (!fm.id) throw new Error(`decision file missing id: ${filename}`);
  return {
    id: fm.id,
    filed: fm.filed ?? "",
    filedBy: fm["filed-by"] ?? "",
    question: fm.question ?? "",
    ruling: fm.ruling ?? "PENDING",
    ruled: fm.ruled,
    source: fm.source,
    body: raw.slice(m[0].length).trim(),
    raw,
    filename,
  };
}

export function isPending(d: Decision): boolean {
  return d.ruling.toUpperCase() === "PENDING";
}

// Writes the ruling into the frontmatter, preserving every other line and the
// body byte-for-byte. Replaces the `ruling:` line; appends `ruled:` and
// `source:` immediately after it (replacing existing ones if present).
export function applyRuling(
  raw: string,
  ruling: OwnerToken,
  ruledAtIso: string,
  source = "cockpit"
): string {
  const m = raw.match(FM_RE);
  if (!m) throw new Error("decision file has no frontmatter");
  const lines = m[1].split("\n");
  const kept = lines.filter(
    (l) => !/^\s*(ruled|source)\s*:/.test(l)
  );
  const rulingIdx = kept.findIndex((l) => /^\s*ruling\s*:/.test(l));
  const newLines = [`ruling: ${ruling}`, `ruled: ${ruledAtIso}`, `source: ${source}`];
  if (rulingIdx === -1) {
    kept.push(...newLines);
  } else {
    kept.splice(rulingIdx, 1, ...newLines);
  }
  return `---\n${kept.join("\n")}\n---\n` + raw.slice(m[0].length);
}
