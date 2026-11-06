// Server-side manual launch ledger. All objects live in the existing private
// runtime bucket. Conditional creates fence retries and overlapping selections;
// neither a pending request nor a claim is evidence that project work finished.
import { createHash } from "node:crypto";
import { BRIDGE_BUCKET, BRIDGE_HOST } from "./dashboard-bridge-status";

export const MANUAL_BATCH_START_AT = "2026-11-06T15:05:14.747638Z";
export const MANUAL_BATCH_EXCLUDED_RESPONSES = ["7bd3812d-d8e3-46de-b97f-03fbfe525f7f"];
export const MAX_MANUAL_BATCH_BODY_BYTES = 16 * 1024;
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const PREFIX = "manual-batches";
const LIMIT = 50;
const ACTIVE_SCAN_LIMIT = 1000;
const ANSWER_LIMIT = 200;
const TIMEOUT_MS = 4000;
type Options = { fetchImpl?: typeof fetch; now?: Date };
type ObjectRecord = Record<string, unknown>;

export class ManualBatchError extends Error {
  constructor(message: string, public status = 503) { super(message); this.name = "ManualBatchError"; }
}
export type ManualBatchAnswer = {
  responseId: string; ref: string; title: string; optionKey: string | null;
  optionLabel: string | null; text: string | null; createdAt: string;
};
export type ManualBatchRequest = {
  version: 1; id: string; project: string; responseIds: string[]; createdAt: string; answerDigest: string;
};
export type ManualBatchWork = ManualBatchRequest & { answers: ManualBatchAnswer[] };
export type ManualBatchResultInput = {
  id: string; claimId: string; status: "launched" | "completed" | "needs_attention" | "failed" | "ambiguous";
  threadId?: string | null; note?: string | null;
  usage?: { input_tokens: number; cached_input_tokens: number; output_tokens: number };
};
type Claim = { id: string; claimId: string; claimedAt: string };
type Result = { id: string; claimId: string; status: ManualBatchResultInput["status"]; threadId: string | null; note: string | null; finishedAt: string; usage?: ManualBatchResultInput["usage"] };
export type ManualBatchStatus = {
  id: string; project: string; responseIds: string[]; createdAt: string;
  status: "pending" | "claimed" | "launched" | "completed" | "needs_attention" | "failed" | "ambiguous" | "blocked";
  claimedAt: string | null; finishedAt: string | null; threadId: string | null; note: string | null;
  usage?: ManualBatchResultInput["usage"];
};
type SourceRow = {
  id: string; item_id: string; option_key: string | null; body: string | null; urgent: boolean; created_at: string;
  dispatch_state: string; dispatch_at: string | null; dispatch_target: string | null; dispatch_note: string | null;
  item: { id: string; ref: string; project: string; title: string; body: string | null; status: string; ruling: string | null;
    ruled_at: string | null; origin_host: string | null; archived_at: string | null; deleted_at: string | null;
    options: { key: string; label: string }[] };
};
function record(value: unknown): value is ObjectRecord { return value !== null && typeof value === "object" && !Array.isArray(value); }
function uuid(value: unknown): value is string { return typeof value === "string" && UUID.test(value); }
function timestampKey(value: unknown): string | null {
  const match = typeof value === "string" && value.match(/^(.*T\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?(Z|[+-]\d\d:\d\d)$/);
  if (!match) return null;
  const seconds = Date.parse(match[1] + match[3]);
  return Number.isFinite(seconds) ? `${seconds}:${(match[2] ?? "").padEnd(9, "0")}` : null;
}
function iso(value: unknown): value is string { return typeof value === "string" && value.length <= 40 && timestampKey(value) !== null; }
function atOrAfter(value: string, watermark: string): boolean {
  const key = timestampKey(value), boundary = timestampKey(watermark);
  if (!key || !boundary) return false;
  const nanos = (stamp: string) => { const [milliseconds, fraction] = stamp.split(":"); return BigInt(milliseconds) * 1_000_000n + BigInt(fraction); };
  return nanos(key) >= nanos(boundary);
}
function only(value: ObjectRecord, keys: string[]): boolean { return Object.keys(value).every((key) => keys.includes(key)); }
function safeProject(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 120 && !/[\x00-\x1f\x7f]/.test(value);
}
export function validateManualBatchInput(value: unknown): { project: string; responseIds: string[] } | null {
  if (!record(value) || !only(value, ["project", "responseIds"]) || !safeProject(value.project)
    || !Array.isArray(value.responseIds) || value.responseIds.length < 1 || value.responseIds.length > 3
    || !value.responseIds.every(uuid) || new Set(value.responseIds.map((id) => id.toLowerCase())).size !== value.responseIds.length) return null;
  return { project: value.project, responseIds: value.responseIds.map((id) => id.toLowerCase()).sort() };
}
export function validateManualBatchResult(value: unknown): ManualBatchResultInput | null {
  if (!record(value) || !only(value, ["id", "claimId", "status", "threadId", "note", "usage"])
    || !uuid(value.id) || !uuid(value.claimId) || !["launched", "completed", "needs_attention", "failed", "ambiguous"].includes(String(value.status))
    || (value.threadId !== undefined && value.threadId !== null && !uuid(value.threadId))
    || (["launched", "completed"].includes(String(value.status)) && !uuid(value.threadId))
    || (value.usage !== undefined && (!record(value.usage) || Object.keys(value.usage).length !== 3
      || !only(value.usage, ["input_tokens", "cached_input_tokens", "output_tokens"])
      || Object.values(value.usage).some((count) => !Number.isSafeInteger(count) || Number(count) < 0 || Number(count) > 1_000_000_000)
      || Number(value.usage.cached_input_tokens) > Number(value.usage.input_tokens)))
    || (value.note !== undefined && value.note !== null && (typeof value.note !== "string" || value.note.length > 2000))) return null;
  return { id: value.id.toLowerCase(), claimId: value.claimId.toLowerCase(), status: value.status as ManualBatchResultInput["status"], threadId: value.threadId as string | null | undefined, note: value.note as string | null | undefined,
    ...(value.usage === undefined ? {} : { usage: value.usage as ManualBatchResultInput["usage"] }) };
}
export function validManualBatchUuid(value: unknown): value is string { return uuid(value); }
function settings() {
  const base = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new ManualBatchError("Manual launch service is unavailable.");
  return { base: base.replace(/\/$/, ""), headers: { apikey: key, Authorization: `Bearer ${key}` } };
}
async function request(url: string, init: RequestInit, options: Options) {
  return (options.fetchImpl ?? fetch)(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
}
function missing(status: number, failure: unknown): boolean {
  if (!record(failure)) return false;
  if (failure.code === "NoSuchBucket" || failure.error === "NoSuchBucket" || (typeof failure.message === "string" && /^bucket not found[.!]?$/i.test(failure.message))) return false;
  return (status === 400 || status === 404) && (failure.code === "NoSuchKey" || failure.error === "NoSuchKey"
    || (String(failure.statusCode) === "404" && failure.error === "not_found" && typeof failure.message === "string" && /^object not found[.!]?$/i.test(failure.message)));
}
async function readObject(kind: string, id: string, options: Options): Promise<unknown | null> {
  const { base, headers } = settings();
  const response = await request(`${base}/storage/v1/object/authenticated/${BRIDGE_BUCKET}/${PREFIX}/${kind}/${id}.json?snapshot=${(options.now ?? new Date()).getTime()}`, { headers: { ...headers, Accept: "application/json", "Cache-Control": "no-cache, no-store" } }, options);
  if (!response.ok) {
    const failure: unknown = await response.json().catch(() => null);
    if (missing(response.status, failure)) return null;
    throw new ManualBatchError("Manual launch storage is unavailable.");
  }
  return response.json();
}
/** Storage's unique (bucket_id,name) constraint is the cross-process fence. */
async function createObject(kind: string, id: string, value: unknown, options: Options): Promise<boolean> {
  const { base, headers } = settings();
  const response = await request(`${base}/storage/v1/object/${BRIDGE_BUCKET}/${PREFIX}/${kind}/${id}.json`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json", "x-upsert": "false", "Cache-Control": "no-store" }, body: JSON.stringify(value),
  }, options);
  if (response.ok) return true;
  const failure: unknown = await response.json().catch(() => null);
  if (response.status === 409 || (response.status === 400 && record(failure) && (failure.code === "Duplicate" || failure.error === "Duplicate" || String(failure.statusCode) === "409"))) return false;
  throw new ManualBatchError("Manual launch storage is unavailable.");
}
async function listIds(kind: "active" | "archive", options: Options): Promise<string[]> {
  const { base, headers } = settings();
  const response = await request(`${base}/storage/v1/object/list/${BRIDGE_BUCKET}`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: `${PREFIX}/${kind}`, limit: kind === "active" ? ACTIVE_SCAN_LIMIT + 1 : 20, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
  }, options);
  if (!response.ok) throw new ManualBatchError("Manual launch storage is unavailable.");
  const rows: unknown = await response.json();
  // Admission stops at 50. A larger scan permits racing submissions or an
  // interrupted cleanup to drain instead of stranding all pending work.
  if (!Array.isArray(rows) || (kind === "active" && rows.length > ACTIVE_SCAN_LIMIT)) throw new ManualBatchError("The active manual launch queue is full. Review existing batches first.");
  return rows.map((row: unknown) => {
    if (!record(row) || typeof row.name !== "string" || !row.name.endsWith(".json") || !uuid(row.name.slice(0, -5))) throw new ManualBatchError("Manual launch storage is unavailable.");
    return row.name.slice(0, -5).toLowerCase();
  });
}
async function removeActive(id: string, options: Options): Promise<void> {
  const { base, headers } = settings();
  const response = await request(`${base}/storage/v1/object/${BRIDGE_BUCKET}`, {
    method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [`${PREFIX}/active/${id}.json`] }),
  }, options);
  if (!response.ok) throw new ManualBatchError("Manual launch storage is unavailable.");
}
async function mapBounded<T, U>(values: T[], fn: (value: T) => Promise<U>): Promise<U[]> {
  const result = new Array<U>(values.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(6, values.length) }, async () => { while (next < values.length) { const index = next++; result[index] = await fn(values[index]); } }));
  return result;
}
function parseRequest(value: unknown): ManualBatchRequest {
  if (!record(value) || !only(value, ["version", "id", "project", "responseIds", "createdAt", "answerDigest"]) || value.version !== 1 || !uuid(value.id) || !iso(value.createdAt)
    || typeof value.answerDigest !== "string" || !/^[a-f\d]{64}$/.test(value.answerDigest)) throw new ManualBatchError("Manual launch storage is unavailable.");
  const input = validateManualBatchInput({ project: value.project, responseIds: value.responseIds });
  if (!input) throw new ManualBatchError("Manual launch storage is unavailable.");
  return { version: 1, id: value.id.toLowerCase(), ...input, createdAt: value.createdAt, answerDigest: value.answerDigest };
}
async function readRequest(id: string, options: Options): Promise<ManualBatchRequest | null> {
  const raw = await readObject("requests", id, options); if (raw === null) return null;
  const value = parseRequest(raw); if (value.id !== id) throw new ManualBatchError("Manual launch storage is unavailable."); return value;
}
async function readClaim(id: string, options: Options): Promise<Claim | null> {
  const raw = await readObject("claims", id, options); if (raw === null) return null;
  if (!record(raw) || !only(raw, ["id", "claimId", "claimedAt"]) || raw.id !== id || !uuid(raw.claimId) || !iso(raw.claimedAt)) throw new ManualBatchError("Manual launch storage is unavailable.");
  return { id, claimId: raw.claimId, claimedAt: raw.claimedAt };
}
async function readResult(id: string, options: Options, kind = "results"): Promise<Result | null> {
  const raw = await readObject(kind, id, options); if (raw === null) return null;
  if (!record(raw) || !iso(raw.finishedAt)) throw new ManualBatchError("Manual launch storage is unavailable.");
  const { finishedAt, ...input } = raw, parsed = validateManualBatchResult(input);
  if (!parsed || parsed.id !== id) throw new ManualBatchError("Manual launch storage is unavailable.");
  return { ...parsed, finishedAt, threadId: parsed.threadId ?? null, note: parsed.note ?? null };
}
async function ready(id: string, options: Options): Promise<boolean> {
  const raw = await readObject("ready", id, options);
  if (raw === null) return false;
  if (!record(raw) || !only(raw, ["id"]) || raw.id !== id) throw new ManualBatchError("Manual launch storage is unavailable.");
  return true;
}
async function reservation(responseId: string, options: Options): Promise<string | null> {
  const raw = await readObject("responses", responseId, options); if (raw === null) return null;
  if (!record(raw) || !only(raw, ["batchId", "responseId"]) || raw.responseId !== responseId || !uuid(raw.batchId)) throw new ManualBatchError("Manual launch storage is unavailable.");
  return raw.batchId;
}
function eligible(row: SourceRow): boolean {
  const item = row.item;
  return !!item && uuid(row.id) && item.origin_host === BRIDGE_HOST && item.status === "ruled"
    && !item.archived_at && !item.deleted_at && safeProject(item.project) && /^D-\d{4,}$/.test(item.ref)
    && typeof item.title === "string" && item.title.length <= 300
    && (item.body === null || typeof item.body === "string")
    && iso(row.created_at) && atOrAfter(row.created_at, MANUAL_BATCH_START_AT)
    && timestampKey(row.created_at) === timestampKey(item.ruled_at)
    && !MANUAL_BATCH_EXCLUDED_RESPONSES.includes(row.id.toLowerCase())
    && ![row.option_key, item.ruling].some((value) => typeof value === "string" && ["DROP", "PARK"].includes(value.trim().toUpperCase()))
    && (row.option_key === null || typeof row.option_key === "string" && row.option_key.length <= 100)
    && (row.body === null || typeof row.body === "string" && row.body.length <= 4000)
    && (Boolean(row.option_key) || Boolean(row.body?.trim()))
    && ((row.urgent === false && row.dispatch_state === "none") || (row.urgent === true && row.dispatch_state === "queued"))
    && row.dispatch_at === null && row.dispatch_target === null && row.dispatch_note === null;
}
async function sourceRows(options: Options, responseIds?: string[]): Promise<SourceRow[]> {
  const { base, headers } = settings();
  const fields = "id,item_id,option_key,body,urgent,created_at,dispatch_state,dispatch_at,dispatch_target,dispatch_note,item:owner_loop_items!inner(id,ref,project,title,body,status,ruling,ruled_at,origin_host,archived_at,deleted_at,options)";
  const params = new URLSearchParams({ select: fields, "item.origin_host": `eq.${BRIDGE_HOST}`, "item.status": "eq.ruled", "item.archived_at": "is.null", "item.deleted_at": "is.null", created_at: `gte.${MANUAL_BATCH_START_AT}`, order: "created_at.desc,id.desc", limit: String(ANSWER_LIMIT + 1) });
  if (responseIds) params.set("id", `in.(${responseIds.join(",")})`);
  const response = await request(`${base}/rest/v1/owner_loop_responses?${params}`, { headers: { ...headers, Accept: "application/json" } }, options);
  if (!response.ok) throw new ManualBatchError("Dashboard answers are unavailable.");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length > ANSWER_LIMIT || rows.some((row) => !record(row) || !record(row.item))) throw new ManualBatchError("Dashboard answers are unavailable.");
  return (rows as SourceRow[]).filter(eligible);
}
function answer(row: SourceRow): ManualBatchAnswer {
  const choice = Array.isArray(row.item.options) ? row.item.options.find((option) => option && option.key === row.option_key) : null;
  return { responseId: row.id.toLowerCase(), ref: row.item.ref, title: row.item.title, optionKey: row.option_key,
    optionLabel: choice && typeof choice.label === "string" ? choice.label.slice(0, 2000) : null, text: row.body, createdAt: row.created_at };
}
function packetFits(rows: SourceRow[]): boolean {
  // The local runner also includes the original question, handoff, and bound
  // callback commands. Reserve for those before reserving any answer IDs.
  // Count full strings as UTF-8 JSON; never truncate a question or owner answer
  // to squeeze it into a job. The question body stays private to this check.
  const data = rows.map((row) => {
    const choice = Array.isArray(row.item.options) ? row.item.options.find((option) => option && option.key === row.option_key) : null;
    return { ...answer(row), optionLabel: choice && typeof choice.label === "string" ? choice.label : null,
      originalQuestion: { title: row.item.title, body: row.item.body } };
  });
  return Buffer.byteLength(JSON.stringify(data), "utf8") + 2048 + 2048 + 1536 * rows.length <= 12 * 1024;
}
function digest(answers: ManualBatchAnswer[]): string { return createHash("sha256").update(JSON.stringify(answers)).digest("hex"); }
function batchId(project: string, responseIds: string[]): string {
  const h = createHash("sha256").update(JSON.stringify({ project, responseIds })).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function work(batch: ManualBatchRequest, options: Options): Promise<ManualBatchWork | null> {
  const rows = await sourceRows(options, batch.responseIds);
  const selected = batch.responseIds.map((id) => rows.find((row) => row.id.toLowerCase() === id)).filter((row): row is SourceRow => !!row && row.item.project === batch.project);
  const answers = selected.map(answer);
  if (answers.length !== batch.responseIds.length || digest(answers) !== batch.answerDigest || !packetFits(selected)) return null;
  return { ...batch, answers };
}
async function summary(batch: ManualBatchRequest, options: Options): Promise<ManualBatchStatus> {
  const [claim, terminal, launch, committed] = await Promise.all([readClaim(batch.id, options), readResult(batch.id, options), readResult(batch.id, options, "launches"), ready(batch.id, options)]);
  const result = terminal ?? launch;
  if (result && (!claim || result.claimId !== claim.claimId)) throw new ManualBatchError("Manual launch storage is unavailable.");
  const status = result?.status ?? (claim ? "claimed" : committed ? "pending" : "blocked");
  return { id: batch.id, project: batch.project, responseIds: batch.responseIds, createdAt: batch.createdAt, status,
    claimedAt: claim?.claimedAt ?? null, finishedAt: terminal?.finishedAt ?? null, threadId: result?.threadId ?? null,
    note: result?.note ?? (status === "blocked" ? "Launch preparation did not finish. Review before trying again." : null),
    ...(result?.usage ? { usage: result.usage } : {}) };
}
async function archiveTerminal(batch: ManualBatchRequest, state: ManualBatchStatus, options: Options): Promise<void> {
  if (!["completed", "needs_attention", "failed", "ambiguous"].includes(state.status)) return;
  // Archive is durable before removing the active pointer. A crash can only
  // leave an extra terminal pointer, never hide an unfinished batch.
  await createObject("archive", batch.id, { id: batch.id }, options);
  await removeActive(batch.id, options);
}
export async function createManualBatch(input: { project: string; responseIds: string[] }, options: Options = {}): Promise<ManualBatchStatus> {
  const parsed = validateManualBatchInput(input); if (!parsed) throw new ManualBatchError("Choose one to three answers from one project.", 400);
  const id = batchId(parsed.project, parsed.responseIds), previous = await readRequest(id, options);
  if (previous && await ready(id, options)) {
    const state = await summary(previous, options);
    if (["pending", "claimed", "launched"].includes(state.status)) await createObject("active", id, { id }, options);
    else await archiveTerminal(previous, state, options);
    return state;
  }
  const rows = await sourceRows(options, parsed.responseIds);
  const selected = parsed.responseIds.map((responseId) => rows.find((row) => row.id.toLowerCase() === responseId)).filter((row): row is SourceRow => !!row && row.item.project === parsed.project);
  const answers = selected.map(answer);
  if (answers.length !== parsed.responseIds.length) throw new ManualBatchError("An answer changed or is no longer eligible. Refresh the list.", 409);
  if (!packetFits(selected)) throw new ManualBatchError("Batch too large; choose fewer answers or handle this separately.", 400);
  const batch: ManualBatchRequest = previous ?? { version: 1, id, ...parsed, createdAt: (options.now ?? new Date()).toISOString(), answerDigest: digest(answers) };
  if (batch.answerDigest !== digest(answers)) throw new ManualBatchError("An answer changed. Refresh the list.", 409);
  if (!previous) {
    // The limit applies to active work; terminal records are archived forever.
    if ((await listIds("active", options)).length >= LIMIT) throw new ManualBatchError("The active manual launch queue is full. Review existing batches first.");
    await createObject("requests", id, batch, options);
  }
  await createObject("active", id, { id }, options);
  for (const responseId of parsed.responseIds) {
    if (!await createObject("responses", responseId, { batchId: id, responseId }, options) && await reservation(responseId, options) !== id) throw new ManualBatchError("An answer is already reserved by another batch.", 409);
  }
  await createObject("ready", id, { id }, options);
  return summary(batch, options);
}
export async function readManualBatchDashboard(options: Options = {}): Promise<{ projects: { project: string; answers: ManualBatchAnswer[] }[]; batches: ManualBatchStatus[] }> {
  const [rows, activeIds, archivedIds] = await Promise.all([sourceRows(options), listIds("active", options), listIds("archive", options)]);
  const active = new Set(activeIds);
  const batches = await mapBounded([...new Set([...activeIds, ...archivedIds])], async (id) => {
    const batch = await readRequest(id, options); if (!batch) throw new ManualBatchError("Manual launch storage is unavailable.");
    const state = await summary(batch, options);
    if (active.has(id)) await archiveTerminal(batch, state, options);
    if (state.status === "pending") {
      const selected = batch.responseIds.map((responseId) => rows.find((row) => row.id.toLowerCase() === responseId)).filter((row): row is SourceRow => !!row && row.item.project === batch.project);
      const answers = selected.map(answer);
      if (answers.length !== batch.responseIds.length || digest(answers) !== batch.answerDigest) return { ...state, status: "blocked" as const, note: "An answer changed or is no longer eligible. This batch will not launch." };
      if (!packetFits(selected)) return { ...state, status: "blocked" as const, note: "The source questions now exceed this reserved batch's size limit. Review the batch or handle it separately." };
    }
    return state;
  });
  const available = await mapBounded(rows, async (row) => await reservation(row.id.toLowerCase(), options) ? null : row);
  const groups = new Map<string, ManualBatchAnswer[]>();
  for (const row of available) { if (!row) continue; const answers = groups.get(row.item.project) ?? []; answers.push(answer(row)); groups.set(row.item.project, answers); }
  return { projects: [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([project, answers]) => ({ project, answers })), batches: batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}
export async function pollManualBatches(options: Options = {}): Promise<ManualBatchWork[]> {
  const ids = await listIds("active", options), pending: ManualBatchWork[] = [];
  // Polling reads metadata only. Models are launched only after an explicit
  // owner request and a successful one-time claim of that request.
  for (const id of ids.reverse()) {
    const batch = await readRequest(id, options); if (!batch) throw new ManualBatchError("Manual launch storage is unavailable.");
    const state = await summary(batch, options); if (state.status !== "pending") { await archiveTerminal(batch, state, options); continue; }
    const expanded = await work(batch, options); if (expanded) pending.push(expanded);
    if (pending.length === 10) break;
  }
  return pending;
}
export async function claimManualBatch(id: string, claimId: string, options: Options = {}): Promise<{ claimed: boolean; batch: ManualBatchWork | null }> {
  if (!uuid(id) || !uuid(claimId)) throw new ManualBatchError("Invalid launch claim.", 400);
  const batch = await readRequest(id.toLowerCase(), options); if (!batch) throw new ManualBatchError("Batch was not found.", 404);
  if (!await ready(batch.id, options)) throw new ManualBatchError("Batch preparation is incomplete.", 409);
  const expanded = await work(batch, options); if (!expanded) throw new ManualBatchError("An answer changed or is no longer eligible.", 409);
  for (const responseId of batch.responseIds) if (await reservation(responseId, options) !== batch.id) throw new ManualBatchError("Batch reservations could not be verified.", 409);
  const created = await createObject("claims", batch.id, { id: batch.id, claimId: claimId.toLowerCase(), claimedAt: (options.now ?? new Date()).toISOString() }, options);
  return { claimed: created, batch: created ? expanded : null };
}
export async function recordManualBatchResult(input: ManualBatchResultInput, options: Options = {}): Promise<ManualBatchStatus> {
  const parsed = validateManualBatchResult(input); if (!parsed) throw new ManualBatchError("Invalid launch result.", 400);
  const batch = await readRequest(parsed.id, options), claim = await readClaim(parsed.id, options);
  if (!batch) throw new ManualBatchError("Batch was not found.", 404);
  if (!claim || claim.claimId !== parsed.claimId) throw new ManualBatchError("This claim does not own the batch.", 409);
  const [launch, terminal] = await Promise.all([readResult(batch.id, options, "launches"), readResult(batch.id, options)]);
  if ((launch?.threadId && parsed.threadId && launch.threadId !== parsed.threadId)
    || (terminal?.threadId && parsed.threadId && terminal.threadId !== parsed.threadId)) throw new ManualBatchError("This result names a different project chat.", 409);
  const result: Result = { ...parsed, finishedAt: (options.now ?? new Date()).toISOString(), threadId: parsed.threadId ?? null, note: parsed.note ?? null };
  const kind = parsed.status === "launched" ? "launches" : "results";
  if (!await createObject(kind, batch.id, result, options)) {
    const prior = await readResult(batch.id, options, kind);
    if (!prior || prior.claimId !== result.claimId || prior.status !== result.status || prior.threadId !== result.threadId || prior.note !== result.note || JSON.stringify(prior.usage) !== JSON.stringify(result.usage)) throw new ManualBatchError("A different result is already recorded.", 409);
  }
  const state = await summary(batch, options);
  await archiveTerminal(batch, state, options);
  return state;
}
