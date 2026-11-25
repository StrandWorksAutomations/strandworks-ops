export const CORRECTION_REASONS = {
  voice: "Tone or wording",
  job_match: "Wrong job match",
  job_details: "Incorrect job details or pay",
  link: "Link",
  other: "Other",
} as const;

export type CorrectionReason = keyof typeof CORRECTION_REASONS;
export function isCorrectionReason(value: unknown): value is CorrectionReason {
  return typeof value === "string" && Object.hasOwn(CORRECTION_REASONS, value);
}

// Match the database's definition of a comparable draft, including line endings.
export function editedReply(original: string, posted: string): boolean {
  const normalize = (s: string) => s.replace(/\r\n/g, "\n").replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
  const before = normalize(original);
  const after = normalize(posted);
  return !!before && !!after && before !== after;
}

export function postedReplyConfirmation(wasPosted: boolean, trainedVoice: boolean, reason: CorrectionReason | null) {
  const posting = wasPosted ? "Posted wording saved." : "Reply marked as posted.";
  if (trainedVoice) return `${posting} Voice example saved.`;
  if (reason) return `${posting} Correction reason saved.`;
  return posting;
}

export type ReasonDay = { day: string; reason: string; count: number };

export function reasonsInRange(rows: ReasonDay[], start: string, end: string) {
  const counts = new Map<string, number>();
  let total = 0;
  for (const row of rows) {
    if (row.day < start || row.day > end || row.count <= 0) continue;
    counts.set(row.reason, (counts.get(row.reason) ?? 0) + row.count);
    total += row.count;
  }
  const unlabeled = counts.get("unlabeled") ?? 0;
  counts.delete("unlabeled");
  const reasons = [...counts].sort(([a, n], [b, m]) => m - n || a.localeCompare(b));
  return { total, unlabeled, reasons };
}
