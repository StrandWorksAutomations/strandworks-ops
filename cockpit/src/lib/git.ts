// Git I/O for the status view. Kept OUT of status.ts so the derivation stays
// pure/testable. Two backends, mirroring repo.ts:
//   - "fs": local checkout — real `git` commands via child_process.
//   - "github": prod on Vercel. Tags for THIS repo come from the GitHub API
//     (git/refs/tags). Last-touched for OTHER repos is NOT reachable — the
//     cockpit token is scoped to strandworks-ops only (SPEC Slice-1 #5), so we
//     say so honestly rather than invent a date.
import { dataBackend, repoRoot } from "./repo";
import type { RepoTouch } from "./status";

// Tracked repos per PORTFOLIO/services registers. Only strandworks-ops is
// reachable from the cockpit; the rest are surfaced with an honest note.
export const TRACKED_REPOS = [
  "strandworks-ops",
  "3rdrider",
  "haptic-mirror",
  "MedSim-Game",
  "liaison-dashboard",
  "ai-governance-kit",
] as const;

const OWNER_REPO = process.env.COCKPIT_REPO ?? "StrandWorksAutomations/strandworks-ops";
const BRANCH = process.env.COCKPIT_BRANCH ?? "main";

function ghHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// --- review tags ---

export async function readReviewTags(): Promise<string[]> {
  if (dataBackend() === "github") {
    try {
      const url = `https://api.github.com/repos/${OWNER_REPO}/git/matching-refs/tags/review/`;
      const res = await fetch(url, { headers: ghHeaders(), next: { revalidate: 60 } });
      if (!res.ok) return [];
      const json = (await res.json()) as Array<{ ref: string }>;
      return json.map((r) => r.ref.replace(/^refs\/tags\//, ""));
    } catch {
      return [];
    }
  }
  // fs backend
  try {
    const { execFileSync } = await import("node:child_process");
    const out = execFileSync("git", ["-C", repoRoot(), "tag", "-l", "review/*"], {
      encoding: "utf8",
    });
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

// --- last-touched per repo ---

async function ghLastCommitDate(): Promise<string | null> {
  try {
    const url = `https://api.github.com/repos/${OWNER_REPO}/commits?sha=${BRANCH}&per_page=1`;
    const res = await fetch(url, { headers: ghHeaders(), next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ commit?: { committer?: { date?: string } } }>;
    const date = json[0]?.commit?.committer?.date;
    return date ? date.slice(0, 10) : null;
  } catch {
    return null;
  }
}

function fsLastCommitDate(cwd: string): string | null {
  try {
    // Lazy require to stay off the client bundle path.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
    const out = execFileSync("git", ["-C", cwd, "log", "-1", "--format=%cd", "--date=short"], {
      encoding: "utf8",
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

// Build the per-repo last-touched list. Only strandworks-ops is reachable; the
// rest carry a clear note instead of a fabricated date (register-truth rule).
export async function readRepoTouches(): Promise<RepoTouch[]> {
  const backend = dataBackend();
  const out: RepoTouch[] = [];
  for (const repo of TRACKED_REPOS) {
    if (repo === "strandworks-ops") {
      const last =
        backend === "github" ? await ghLastCommitDate() : fsLastCommitDate(repoRoot());
      out.push({ repo, lastCommit: last, note: last ? undefined : "no commit data" });
    } else {
      out.push({
        repo,
        lastCommit: null,
        note: "not reachable from cockpit token (scoped to strandworks-ops)",
      });
    }
  }
  return out;
}

// Does a HALTED marker exist at repo root? (VISION security / CLAUDE.md rule.)
export async function readHalted(): Promise<boolean> {
  if (dataBackend() === "github") {
    try {
      const url = `https://api.github.com/repos/${OWNER_REPO}/contents/HALTED?ref=${BRANCH}`;
      const res = await fetch(url, { headers: ghHeaders(), next: { revalidate: 60 } });
      return res.ok;
    } catch {
      return false;
    }
  }
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    await fs.access(path.join(repoRoot(), "HALTED"));
    return true;
  } catch {
    return false;
  }
}

// Load the autonomous-spend ceiling from fabric/spend-gate/ceiling.json.
// Default 200 if unreadable/malformed — the display never fabricates a ceiling.
export async function readCeilingUsd(): Promise<number> {
  const DEFAULT = 200;
  try {
    if (dataBackend() === "github") {
      const url = `https://api.github.com/repos/${OWNER_REPO}/contents/fabric/spend-gate/ceiling.json?ref=${BRANCH}`;
      const res = await fetch(url, { headers: ghHeaders(), next: { revalidate: 60 } });
      if (!res.ok) return DEFAULT;
      const json = (await res.json()) as { content?: string; encoding?: string };
      if (json.encoding !== "base64" || !json.content) return DEFAULT;
      const parsed = JSON.parse(Buffer.from(json.content, "base64").toString("utf8"));
      return typeof parsed.ceiling_usd === "number" ? parsed.ceiling_usd : DEFAULT;
    }
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const raw = await fs.readFile(
      path.join(repoRoot(), "fabric/spend-gate/ceiling.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw);
    return typeof parsed.ceiling_usd === "number" ? parsed.ceiling_usd : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
