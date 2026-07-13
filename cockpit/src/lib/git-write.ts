// Generic single-file register write — same rules as rule-writer.ts:
// every cockpit write is a commit (GitHub trees API, direct to the write
// branch) in production, and a local-checkout write in dev dry-run only.
// writeMode() is shared with rule-writer so production always refuses to
// write without GITHUB_TOKEN.
import fs from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "./repo";
import { writeMode } from "./rule-writer";

export type WriteResult = {
  mode: "github" | "dry-run";
  commitSha?: string;
  path: string;
};

export async function commitFileUpdate(
  filePath: string,
  content: string,
  message: string
): Promise<WriteResult> {
  if (writeMode() === "dry-run") {
    const abs = path.join(repoRoot(), filePath);
    await fs.writeFile(abs, content, "utf-8");
    return { mode: "dry-run", path: filePath };
  }
  const commitSha = await githubUpdateCommit(filePath, content, message);
  return { mode: "github", commitSha, path: filePath };
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
    // No response body/headers in the error — keeps token material out of logs.
    throw new Error(`GitHub API ${pathname} failed with status ${res.status}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

async function githubUpdateCommit(
  filePath: string,
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
      tree: [{ path: filePath, mode: "100644", type: "blob", content }],
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
