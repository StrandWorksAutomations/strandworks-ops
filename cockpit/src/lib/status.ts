// Fabric / sprint status derivation (SPEC WS-E).
//
// A READ-ONLY reflection of real state already committed to this repo:
//   - recent review tags (review/YYYY-MM-DD-*),
//   - open (PENDING) decision cards in _governance/decisions/,
//   - open inbox items (_governance/inbox/*.md, never directive — surfaced as
//     signal only, never as instructions),
//   - last-touched (latest commit date) per tracked repo.
//
// This module is PURE: it takes already-gathered inputs and shapes them. The
// I/O (git calls, dir reads) lives in the page. Purity is what the tests pin.

import { parseDecision, isPending } from "./decisions";

export type ReviewTag = {
  tag: string; // full tag, e.g. review/2026-07-12-cockpit-slice-1
  date: string; // YYYY-MM-DD parsed from the tag
  label: string; // the slug after the date
};

// Parse `review/YYYY-MM-DD-<slug>` tags; ignore anything that doesn't match.
export function parseReviewTags(tagLines: string[]): ReviewTag[] {
  const re = /^review\/(\d{4}-\d{2}-\d{2})-(.+)$/;
  const out: ReviewTag[] = [];
  for (const line of tagLines) {
    const t = line.trim();
    const m = t.match(re);
    if (m) out.push({ tag: t, date: m[1], label: m[2] });
  }
  // newest first
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.label.localeCompare(b.label)));
}

export type OpenDecision = {
  id: string;
  filed: string;
  filedBy: string;
  question: string;
  filename: string;
};

// From raw decision files (filename → content), keep only PENDING ones.
// Unparseable files are skipped here (they surface on the Decide tab as today).
export function openDecisions(files: { filename: string; content: string }[]): OpenDecision[] {
  const out: OpenDecision[] = [];
  for (const f of files) {
    if (!f.filename.endsWith(".md") || f.filename === "README.md") continue;
    try {
      const d = parseDecision(f.content, f.filename);
      if (isPending(d)) {
        out.push({ id: d.id, filed: d.filed, filedBy: d.filedBy, question: d.question, filename: f.filename });
      }
    } catch {
      // skip
    }
  }
  return out.sort((a, b) => (a.filed < b.filed ? 1 : -1));
}

export type InboxItem = {
  filename: string;
  date: string; // YYYY-MM-DD parsed from filename, or "" if none
  topic: string; // slug after the date
};

// Inbox items are NEVER directive (repo canon). We surface them as unread
// signal only — filename metadata, not contents-as-instructions.
export function inboxItems(filenames: string[]): InboxItem[] {
  const re = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;
  const out: InboxItem[] = [];
  for (const name of filenames) {
    if (!name.endsWith(".md") || name === "README.md") continue;
    const m = name.match(re);
    if (m) out.push({ filename: name, date: m[1], topic: m[2] });
    else out.push({ filename: name, date: "", topic: name.replace(/\.md$/, "") });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export type RepoTouch = {
  repo: string;
  lastCommit: string | null; // ISO date, or null when not reachable from the cockpit
  note?: string; // e.g. "not reachable from cockpit token"
};

export type FabricStatus = {
  reviewTags: ReviewTag[];
  openDecisions: OpenDecision[];
  inbox: InboxItem[];
  repos: RepoTouch[];
  halted: boolean; // true if a HALTED marker exists at repo root
};

export function buildFabricStatus(input: {
  tagLines: string[];
  decisionFiles: { filename: string; content: string }[];
  inboxFilenames: string[];
  repos: RepoTouch[];
  halted: boolean;
}): FabricStatus {
  return {
    reviewTags: parseReviewTags(input.tagLines),
    openDecisions: openDecisions(input.decisionFiles),
    inbox: inboxItems(input.inboxFilenames),
    repos: input.repos,
    halted: input.halted,
  };
}
