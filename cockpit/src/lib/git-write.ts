// Generic single-file register write — same rules as rule-writer.ts:
// every cockpit write is a commit (GitHub trees API, direct to the write
// branch) in production, and a local-checkout write in dev dry-run only.
// writeMode() is shared with rule-writer so production always refuses to
// write without GITHUB_TOKEN.
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { repoRoot } from "./repo";
import { writeMode } from "./rule-writer";

export type WriteResult = {
  mode: "github" | "dry-run";
  commitSha?: string;
  path: string;
};

export class RegisterConflict extends Error {}
export class RegisterNotFound extends Error {}

/** Transform the same version that GitHub compares on write. Busy or changed files can be retried. */
export async function updateSubscriptionRegister(
  change: (text: string) => { csv: string; summary: string }
): Promise<WriteResult & { summary: string }> {
  const filePath = "registers/subscriptions.csv";
  if (writeMode() === "dry-run") {
    const file = path.join(repoRoot(), filePath);
    const lockPath = file + ".lock";
    const temporary = file + "." + randomUUID() + ".tmp";
    const lock = await fs.open(lockPath, "wx").catch((error: NodeJS.ErrnoException) => {
      if (error.code === "EEXIST") throw new RegisterConflict("A save is in progress. Try again.");
      throw error;
    });
    try {
      const current = await fs.readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") throw new RegisterNotFound("Subscriptions register not found.");
        throw error;
      });
      const { csv, summary } = change(current);
      await fs.writeFile(temporary, csv, { flag: "wx" });
      await fs.rename(temporary, file);
      return { mode: "dry-run", path: filePath, summary };
    } finally {
      await fs.rm(temporary, { force: true });
      await lock.close();
      await fs.unlink(lockPath);
    }
  }
  const branch = process.env.COCKPIT_WRITE_BRANCH ?? process.env.COCKPIT_BRANCH ?? "main";
  const location = `/contents/${filePath}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const source = await gh(location + "?ref=" + encodeURIComponent(branch));
    if (source.encoding !== "base64" || typeof source.content !== "string" || typeof source.sha !== "string") {
      throw new Error("The subscription register could not be read.");
    }
    const { csv, summary } = change(Buffer.from(source.content, "base64").toString("utf8"));
    try {
      const saved = await gh(location, { method: "PUT", body: JSON.stringify({
        branch, sha: source.sha, message: `money: ${summary} (source: cockpit)`, content: Buffer.from(csv).toString("base64"),
      }) }) as { commit?: { sha?: string } };
      if (!saved.commit?.sha) throw new Error("The register save could not be confirmed. Refresh before retrying.");
      return { mode: "github", path: filePath, commitSha: saved.commit.sha, summary };
    } catch (error) {
      if (!(error instanceof RegisterConflict) || attempt === 2) throw error;
    }
  }
  throw new RegisterConflict("The register changed. Refresh before saving again.");
}

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
    if (res.status === 404 && pathname.startsWith("/contents/registers/subscriptions.csv?")) {
      throw new RegisterNotFound("Subscriptions register not found.");
    }
    if (res.status === 409) throw new RegisterConflict("The register changed. Refresh before saving again.");
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
