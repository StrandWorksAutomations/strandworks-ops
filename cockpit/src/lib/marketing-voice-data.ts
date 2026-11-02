// Owner-only voice storage, using the cockpit's existing repository credential.
// A GitHub blob SHA or local lock protects the whole read/change/write operation.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { dataBackend, repoRoot } from "./repo";
import { writeMode } from "./rule-writer";
import { parseMarketingSnapshot } from "./marketing";
import { applyVoiceMutation, parseVoiceStore, VoiceError, type VoiceMutation, type VoicePostSource, type VoiceStore } from "./marketing-voice";

export const VOICE_REGISTER = "registers/marketing-voice.json";
const POSTS_REGISTER = "registers/marketing-snapshot.json";
const MAX_STORE_BYTES = 900_000;
type FileVersion = { text: string; sha?: string };
export type VoiceSaveResult = { store: VoiceStore; mode: "github" | "dry-run"; commitSha?: string };
const branch = () => process.env.COCKPIT_WRITE_BRANCH ?? process.env.COCKPIT_BRANCH ?? "main";
const repository = () => process.env.COCKPIT_REPO ?? "StrandWorksAutomations/strandworks-ops";
const unavailable = () => new VoiceError("The saved writing voice is unavailable. No changes were saved.", 503, "voice_unavailable");

export function originalCaptionHash(text: string): string { return createHash("sha256").update(text, "utf8").digest("hex"); }

function checkedStore(raw: string): VoiceStore {
  const store = parseVoiceStore(raw);
  if (!store || store.feedback.some((f) => f.original_sha256 !== originalCaptionHash(f.original_text))) throw unavailable();
  return store;
}

async function ghFile(file: string): Promise<FileVersion> {
  const url = `https://api.github.com/repos/${repository()}/contents/${file}?ref=${encodeURIComponent(branch())}`;
  const res = await fetch(url, { cache: "no-store", headers: {
    Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  } });
  if (!res.ok) throw unavailable();
  const value = await res.json() as { encoding?: string; content?: string; sha?: string };
  if (value.encoding !== "base64" || typeof value.content !== "string" || typeof value.sha !== "string") throw unavailable();
  return { text: Buffer.from(value.content, "base64").toString("utf8"), sha: value.sha };
}

async function localFile(file: string): Promise<FileVersion> {
  try { return { text: await fs.readFile(path.join(repoRoot(), file), "utf8") }; }
  catch { throw unavailable(); }
}

export async function loadVoiceStore(): Promise<VoiceStore> {
  return checkedStore((await (dataBackend() === "github" ? ghFile(VOICE_REGISTER) : localFile(VOICE_REGISTER))).text);
}

function sourceContext(raw: string | null, input: VoiceMutation, current: VoiceStore): { brandIds: string[]; source?: VoicePostSource } {
  const snapshot = parseMarketingSnapshot(raw);
  const existingBrands = [...current.rules, ...current.feedback].map((r) => r.brand_id).filter((b): b is string => !!b);
  const brandIds = [...new Set([...existingBrands, ...(snapshot?.brands.map((b) => b.id) ?? [])])];
  if (!snapshot && input.action === "save_feedback" && !input.id) throw new VoiceError("The source post check is unavailable. No changes were saved.", 503, "post_source_unavailable");
  if (input.action !== "save_feedback") return { brandIds };
  const post = snapshot?.posts.find((p) => p.id === input.post_id && p.brand_id === input.brand_id);
  if (!post) return { brandIds };
  // Current snapshots may omit UUIDs. Never invent one or trust a client-supplied UUID.
  const rawPost = post as typeof post & { post_uuid?: unknown; uuid?: unknown };
  const uuid = rawPost.post_uuid ?? rawPost.uuid;
  const postUuid = typeof uuid === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(uuid) ? uuid : null;
  return { brandIds, source: { brand_id: post.brand_id, post_id: post.id, post_uuid: postUuid,
    original_text: post.text, original_sha256: originalCaptionHash(post.text) } };
}

function updated(current: VoiceStore, input: VoiceMutation, posts: string | null): VoiceStore {
  const next = applyVoiceMutation(current, input, { at: new Date().toISOString(), newId: randomUUID(), ...sourceContext(posts, input, current) });
  if (Buffer.byteLength(JSON.stringify(next), "utf8") > MAX_STORE_BYTES) throw new VoiceError("This voice record needs archiving before more feedback can be added.", 422, "voice_record_full");
  return next;
}

async function githubSave(input: VoiceMutation): Promise<VoiceSaveResult> {
  if (!process.env.GITHUB_TOKEN) throw new VoiceError("Saving writing voice is unavailable because the repository writer is not configured.", 503, "voice_writer_unavailable");
  const [file, posts] = await Promise.all([ghFile(VOICE_REGISTER), ghFile(POSTS_REGISTER).catch(() => null)]);
  const store = updated(checkedStore(file.text), input, posts?.text ?? null);
  const response = await fetch(`https://api.github.com/repos/${repository()}/contents/${VOICE_REGISTER}`, {
    method: "PUT", cache: "no-store", headers: {
      Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json",
    }, body: JSON.stringify({ branch: branch(), sha: file.sha,
      message: `marketing voice: ${input.action} revision ${store.revision} (source: cockpit)`,
      content: Buffer.from(JSON.stringify(store, null, 2) + "\n", "utf8").toString("base64") }),
  });
  if (response.status === 409) throw new VoiceError("The voice guide changed while saving. Reload the latest version before saving again.", 409, "revision_conflict");
  if (!response.ok) throw new VoiceError("The writing voice could not be saved. Your changes have not been confirmed.", 502, "voice_write_failed");
  const result = await response.json() as { commit?: { sha?: string } };
  if (!result.commit?.sha) throw new VoiceError("The save result is unclear. Reload the latest guide before retrying.", 502, "voice_write_unconfirmed");
  return { store, mode: "github", commitSha: result.commit.sha };
}

async function localSave(input: VoiceMutation): Promise<VoiceSaveResult> {
  const file = path.join(repoRoot(), VOICE_REGISTER);
  const lock = file + ".lock";
  try { await fs.mkdir(lock); }
  catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") throw new VoiceError("Another voice save is in progress. Reload the latest guide before retrying.", 409, "revision_conflict");
    throw unavailable();
  }
  const temp = file + `.tmp-${randomUUID()}`;
  try {
    const [current, posts] = await Promise.all([localFile(VOICE_REGISTER), localFile(POSTS_REGISTER).catch(() => null)]);
    const store = updated(checkedStore(current.text), input, posts?.text ?? null);
    await fs.writeFile(temp, JSON.stringify(store, null, 2) + "\n", { encoding: "utf8", flag: "wx", mode: 0o600 });
    await fs.rename(temp, file);
    return { store, mode: "dry-run" };
  } finally {
    await fs.rm(temp, { force: true });
    await fs.rmdir(lock);
  }
}

export async function saveVoiceMutation(input: VoiceMutation): Promise<VoiceSaveResult> {
  try { return await (writeMode() === "github" ? githubSave(input) : localSave(input)); }
  catch (e) {
    if (e instanceof VoiceError) throw e;
    throw new VoiceError("Saving writing voice is unavailable. No changes were confirmed.", 503, "voice_writer_unavailable");
  }
}
