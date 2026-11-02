import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadVoiceStore, saveVoiceMutation, VOICE_REGISTER } from "../src/lib/marketing-voice-data";
import { parseVoiceMutation } from "../src/lib/marketing-voice";
import { emptyVoice, FEEDBACK, postSnapshot, SOURCE } from "./marketing-voice-fixtures";
let root: string;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "cockpit-voice-test-"));
  await fs.mkdir(path.join(root, "registers"));
  await fs.writeFile(path.join(root, VOICE_REGISTER), JSON.stringify(emptyVoice()));
  await fs.writeFile(path.join(root, "registers/marketing-snapshot.json"), JSON.stringify(postSnapshot()));
  vi.stubEnv("COCKPIT_REPO_ROOT", root); vi.stubEnv("COCKPIT_DATA_BACKEND", "fs"); vi.stubEnv("COCKPIT_WRITE_MODE", "dry-run");
});
afterEach(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); await fs.rm(root, { recursive: true, force: true }); });
const input = () => parseVoiceMutation(FEEDBACK);
function asGhFile(value: unknown, sha: string) { return new Response(JSON.stringify({ encoding: "base64", sha, content: Buffer.from(JSON.stringify(value)).toString("base64") }), { status: 200 }); }
function githubMock(putStatus = 200) {
  vi.stubEnv("COCKPIT_WRITE_MODE", "github"); vi.stubEnv("COCKPIT_DATA_BACKEND", "github"); vi.stubEnv("GITHUB_TOKEN", "unit-test-token");
  const fetcher = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
    if (options?.method === "PUT") return new Response(JSON.stringify({ commit: { sha: "commit-sha" } }), { status: putStatus });
    if (String(url).includes("marketing-voice.json")) return asGhFile(emptyVoice(), "voice-blob-sha");
    return asGhFile(postSnapshot(), "posts-blob-sha");
  });
  vi.stubGlobal("fetch", fetcher); return fetcher;
}

describe("voice persistence and concurrency", () => {
  it("persists locally across reads with a server-calculated original hash", async () => {
    const saved = await saveVoiceMutation(input());
    expect(saved.mode).toBe("dry-run");
    expect((await loadVoiceStore()).feedback[0]).toMatchObject({ original_sha256: SOURCE.original_sha256, original_text: SOURCE.original_text, post_uuid: null });
    expect((await loadVoiceStore()).revision).toBe(1);
  });
  it("allows only one of two simultaneous saves from the same revision", async () => {
    const results = await Promise.allSettled([saveVoiceMutation(input()), saveVoiceMutation(input())]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason).toMatchObject({ status: 409, code: "revision_conflict" });
    expect((await loadVoiceStore()).feedback).toHaveLength(1);
  });
  it("rejects forged post provenance without writing anything", async () => {
    await expect(saveVoiceMutation({ ...input(), original_text: "Forged source" })).rejects.toMatchObject({ status: 409, code: "source_changed" });
    expect((await loadVoiceStore()).revision).toBe(0);
  });
  it("captures a source UUID server-side and refuses a different UUID on edit", async () => {
    const posts = postSnapshot();
    Object.assign(posts.posts[0], { post_uuid: "-6680925676838301738" });
    await fs.writeFile(path.join(root, "registers/marketing-snapshot.json"), JSON.stringify(posts));
    const saved = await saveVoiceMutation({ ...input(), post_uuid: null });
    expect(saved.store.feedback[0].post_uuid).toBe("-6680925676838301738");
    await expect(saveVoiceMutation({ ...input(), id: saved.store.feedback[0].id, expected_revision: 1, post_uuid: "forged-uuid" })).rejects.toMatchObject({ status: 409, code: "source_changed" });
    expect((await loadVoiceStore()).revision).toBe(1);
  });
  it("fails closed for missing or hash-corrupted voice data", async () => {
    const saved = await saveVoiceMutation(input());
    saved.store.feedback[0].original_text = "Tampered";
    await fs.writeFile(path.join(root, VOICE_REGISTER), JSON.stringify(saved.store));
    await expect(loadVoiceStore()).rejects.toMatchObject({ status: 503 });
    await fs.unlink(path.join(root, VOICE_REGISTER));
    await expect(saveVoiceMutation(input())).rejects.toMatchObject({ status: 503 });
  });
  it("can edit saved preferences with the source queue unavailable, but cannot invent a new original", async () => {
    const saved = await saveVoiceMutation(input());
    await fs.unlink(path.join(root, "registers/marketing-snapshot.json"));
    const record = saved.store.feedback[0];
    const edited = await saveVoiceMutation({ ...input(), id: record.id, expected_revision: 1, note: "A clearer note" });
    expect(edited.store.feedback[0].note).toBe("A clearer note");
    await expect(saveVoiceMutation({ ...input(), expected_revision: 2 })).rejects.toMatchObject({ code: "post_source_unavailable" });
  });
  it("commits to GitHub using the current blob SHA and returns the commit receipt", async () => {
    const fetcher = githubMock();
    const result = await saveVoiceMutation(input());
    expect(result).toMatchObject({ mode: "github", commitSha: "commit-sha", store: { revision: 1 } });
    const put = fetcher.mock.calls.find(([, options]) => options?.method === "PUT")!;
    const body = JSON.parse(put[1]!.body as string);
    expect(body.sha).toBe("voice-blob-sha");
    expect(body.branch).toBe("main");
    expect(body.force).toBeUndefined();
    expect(JSON.parse(Buffer.from(body.content, "base64").toString()).feedback[0].original_sha256).toBe(SOURCE.original_sha256);
  });
  it("treats a GitHub concurrent blob change as a conflict, never a successful save", async () => {
    githubMock(409);
    await expect(saveVoiceMutation(input())).rejects.toMatchObject({ status: 409, code: "revision_conflict" });
  });
  it("checks the owner revision before sending a GitHub update", async () => {
    const fetcher = githubMock();
    await expect(saveVoiceMutation({ ...input(), expected_revision: 9 })).rejects.toMatchObject({ status: 409 });
    expect(fetcher.mock.calls.some(([, options]) => options?.method === "PUT")).toBe(false);
  });
  it("refuses unconfigured production writes without falling back to local persistence", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("COCKPIT_WRITE_MODE", "github"); vi.stubEnv("GITHUB_TOKEN", "");
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(saveVoiceMutation(input())).rejects.toMatchObject({ status: 503, code: "voice_writer_unavailable" });
    expect(fetcher).not.toHaveBeenCalled();
    expect((await loadVoiceStore()).revision).toBe(0);
  });
});
