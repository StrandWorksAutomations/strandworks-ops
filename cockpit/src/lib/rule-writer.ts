// Write path: apply an owner ruling to a decision file and move it to
// _governance/decisions/resolved/ — as ONE commit via the GitHub git-data
// (trees) API. The fine-grained token comes from GITHUB_TOKEN (env), scoped
// to this repo only; it is never committed, logged, or sent to the client.
//
// Modes:
//  - "github": real commit to COCKPIT_WRITE_BRANCH (default main).
//  - "dry-run": local dev / no token — applies the move on the local
//    checkout so the flow is fully testable without touching GitHub.
import fs from "node:fs/promises";
import path from "node:path";
import { applyRuling, type OwnerToken } from "./decisions";
import { repoRoot } from "./repo";

const DECISIONS_DIR = "_governance/decisions";
const RESOLVED_DIR = "_governance/decisions/resolved";

export type RuleResult = {
  mode: "github" | "dry-run";
  commitSha?: string;
  movedTo: string;
};

export function writeMode(): "github" | "dry-run" {
  if (process.env.COCKPIT_WRITE_MODE === "dry-run") return "dry-run";
  if (process.env.COCKPIT_WRITE_MODE === "github") return "github";
  return process.env.GITHUB_TOKEN ? "github" : "dry-run";
}

export async function commitRuling(
  filename: string,
  originalContent: string,
  ruling: OwnerToken,
  ruledAtIso: string
): Promise<RuleResult> {
  const updated = applyRuling(originalContent, ruling, ruledAtIso, "cockpit");
  const fromPath = `${DECISIONS_DIR}/${filename}`;
  const toPath = `${RESOLVED_DIR}/${filename}`;
  const message = `ruling: ${ruling} — ${filename.replace(/\.md$/, "")} (source: cockpit)`;

  if (writeMode() === "dry-run") {
    const root = repoRoot();
    await fs.mkdir(path.join(root, RESOLVED_DIR), { recursive: true });
    await fs.writeFile(path.join(root, toPath), updated, "utf-8");
    await fs.unlink(path.join(root, fromPath));
    return { mode: "dry-run", movedTo: toPath };
  }

  const commitSha = await githubMoveCommit(fromPath, toPath, updated, message);
  return { mode: "github", commitSha, movedTo: toPath };
}

async function gh(pathname: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const repo = process.env.COCKPIT_REPO ?? "StrandWorksAutomations/strandworks-ops";
  const res = await fetch(`https://api.github.com/repos/${repo}${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    // Deliberately do NOT include response body or headers — avoids any
    // chance of token/scope details reaching logs.
    throw new Error(`GitHub API ${pathname} failed with status ${res.status}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

// One atomic commit: new tree = base tree + resolved file added + original
// file deleted (sha: null), then update the branch ref.
async function githubMoveCommit(
  fromPath: string,
  toPath: string,
  content: string,
  message: string
): Promise<string> {
  const branch = process.env.COCKPIT_WRITE_BRANCH ?? "main";
  const ref = (await gh(`/git/ref/heads/${branch}`)) as { object: { sha: string } };
  const headSha = ref.object.sha;
  const headCommit = (await gh(`/git/commits/${headSha}`)) as { tree: { sha: string } };

  const tree = (await gh(`/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: headCommit.tree.sha,
      tree: [
        { path: toPath, mode: "100644", type: "blob", content },
        { path: fromPath, mode: "100644", type: "blob", sha: null },
      ],
    }),
  })) as { sha: string };

  const commit = (await gh(`/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
  })) as { sha: string };

  await gh(`/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}
