// Read-side data source. Two backends:
//  - "fs": local checkout (dev; repo root is the parent of cockpit/).
//  - "github": GitHub contents API (prod on Vercel), same fine-grained token
//    as the write path. Pages using this are ISR'd (revalidate 60) so views
//    are current within a minute of a push, per SPEC acceptance.
// The token is read from env only, and never logged or returned to clients.
import fs from "node:fs/promises";
import path from "node:path";

const OWNER_REPO = process.env.COCKPIT_REPO ?? "StrandWorksAutomations/strandworks-ops";
const BRANCH = process.env.COCKPIT_BRANCH ?? "main";

export function repoRoot(): string {
  return process.env.COCKPIT_REPO_ROOT ?? path.resolve(process.cwd(), "..");
}

export function dataBackend(): "fs" | "github" {
  if (process.env.COCKPIT_DATA_BACKEND === "github") return "github";
  if (process.env.COCKPIT_DATA_BACKEND === "fs") return "fs";
  return process.env.VERCEL ? "github" : "fs";
}

function ghHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghGetFile(relPath: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${OWNER_REPO}/contents/${encodeURI(relPath)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(), next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}) for ${relPath}`);
  const json = (await res.json()) as { content?: string; encoding?: string };
  if (json.encoding !== "base64" || !json.content) throw new Error(`unexpected GitHub payload for ${relPath}`);
  return Buffer.from(json.content, "base64").toString("utf-8");
}

async function ghListDir(relPath: string): Promise<string[]> {
  const url = `https://api.github.com/repos/${OWNER_REPO}/contents/${encodeURI(relPath)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(), next: { revalidate: 60 } });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub list failed (${res.status}) for ${relPath}`);
  const json = (await res.json()) as Array<{ name: string; type: string }>;
  return json.filter((e) => e.type === "file").map((e) => e.name);
}

export async function readRepoFile(relPath: string): Promise<string | null> {
  if (dataBackend() === "github") return ghGetFile(relPath);
  try {
    return await fs.readFile(path.join(repoRoot(), relPath), "utf-8");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function listRepoDir(relPath: string): Promise<string[]> {
  if (dataBackend() === "github") return ghListDir(relPath);
  try {
    const entries = await fs.readdir(path.join(repoRoot(), relPath), { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}
