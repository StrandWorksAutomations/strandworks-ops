// Server-only persistence for a small, private connection snapshot. This is
// connection telemetry, never evidence that project work was completed.
import { createHash } from "node:crypto";

export const BRIDGE_HOST = "DESKTOP-U6OA95F";
export const BRIDGE_BUCKET = "owner-loop-runtime";
export const BRIDGE_OBJECT = `dashboard-bridge/${BRIDGE_HOST}.json`;
export const BRIDGE_TOKEN_LABEL_PREFIX = "codex-windows-desktop-u6oa95f-";
export const MAX_HEARTBEAT_BYTES = 32 * 1024;
const REQUEST_TIMEOUT_MS = 4000;
const COUNT_KEYS = ["queued", "ambiguous", "blocked", "started", "delivered"] as const;

export type BridgeCounts = Record<(typeof COUNT_KEYS)[number], number>;
export type BridgeHeartbeatInput = {
  version: 1;
  host: typeof BRIDGE_HOST;
  checkedAt: string;
  sourceAvailable: boolean;
  desktopReady: boolean | null;
  counts: BridgeCounts;
  oldestQueuedAt: string | null;
  intervalSeconds: number;
};
export type BridgeHeartbeatRecord = BridgeHeartbeatInput & { receivedAt: string };
export type BridgeConnectionStatus = {
  state: "green" | "yellow" | "red";
  label: string;
  detail: string;
  lastSeenAt: string | null;
  checkedAt: string | null;
  pending: number | null;
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40
    && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|[+-]\d\d:\d\d)$/.test(value)
    && Number.isFinite(Date.parse(value));
}

export function validateBridgeHeartbeat(value: unknown): { ok: true; value: BridgeHeartbeatInput } | { ok: false } {
  if (!record(value) || Object.keys(value).some((key) => !["version", "host", "checkedAt", "sourceAvailable", "desktopReady", "counts", "oldestQueuedAt", "intervalSeconds"].includes(key))) return { ok: false };
  if (value.version !== 1 || value.host !== BRIDGE_HOST || !isoTimestamp(value.checkedAt)
    || typeof value.sourceAvailable !== "boolean"
    || (value.desktopReady !== null && typeof value.desktopReady !== "boolean")
    || !record(value.counts) || Object.keys(value.counts).length !== COUNT_KEYS.length
    || Object.keys(value.counts).some((key) => !(COUNT_KEYS as readonly string[]).includes(key))
    || COUNT_KEYS.some((key) => !Number.isSafeInteger(value.counts && (value.counts as Record<string, unknown>)[key])
      || Number((value.counts as Record<string, unknown>)[key]) < 0 || Number((value.counts as Record<string, unknown>)[key]) > 1_000_000)
    || (value.oldestQueuedAt !== null && !isoTimestamp(value.oldestQueuedAt))
    || !Number.isInteger(value.intervalSeconds) || Number(value.intervalSeconds) < 5 || Number(value.intervalSeconds) > 3600) return { ok: false };
  // Reconstruct the fixed shape; never persist free-form payload fields.
  return { ok: true, value: {
    version: 1, host: BRIDGE_HOST, checkedAt: value.checkedAt,
    sourceAvailable: value.sourceAvailable, desktopReady: value.desktopReady as boolean | null,
    counts: Object.fromEntries(COUNT_KEYS.map((key) => [key, Number((value.counts as Record<string, unknown>)[key])])) as BridgeCounts,
    oldestQueuedAt: value.oldestQueuedAt as string | null, intervalSeconds: Number(value.intervalSeconds),
  } };
}

/** The dedicated token label binds this one host; other valid agent tokens cannot write it. */
export async function authenticateBridgeHeartbeatToken(token: string, options: { fetchImpl?: typeof fetch } = {}): Promise<boolean> {
  const digest = createHash("sha256").update(token).digest("hex");
  const { base, headers } = storageSettings();
  const response = await (options.fetchImpl ?? fetch)(`${base}/rest/v1/owner_loop_agent_tokens?select=label&token_sha256=eq.${digest}&revoked_at=is.null&limit=2`, {
    headers: { ...headers, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("Bridge token verification is unavailable");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("Invalid bridge token verification result");
  return rows.length === 1 && typeof rows[0].label === "string" && rows[0].label.startsWith(BRIDGE_TOKEN_LABEL_PREFIX);
}

function storageSettings() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Bridge status storage is unavailable");
  return { base: base.replace(/\/$/, ""), headers: { apikey: key, Authorization: `Bearer ${key}` } };
}

/** Bucket provisioning is separate and must set public:false; no public object URL is used. */
export async function writeBridgeHeartbeat(input: BridgeHeartbeatInput, options: { fetchImpl?: typeof fetch; now?: Date } = {}): Promise<BridgeHeartbeatRecord> {
  const validated = validateBridgeHeartbeat(input);
  if (!validated.ok) throw new Error("Invalid bridge status snapshot");
  const stored: BridgeHeartbeatRecord = { ...validated.value, receivedAt: (options.now ?? new Date()).toISOString() };
  const { base, headers } = storageSettings();
  const response = await (options.fetchImpl ?? fetch)(`${base}/storage/v1/object/${BRIDGE_BUCKET}/${BRIDGE_OBJECT}`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json", "x-upsert": "true", "Cache-Control": "no-store" },
    body: JSON.stringify(stored), cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("Bridge status storage write failed");
  return stored;
}

export async function readBridgeHeartbeat(options: { fetchImpl?: typeof fetch; now?: Date } = {}): Promise<BridgeHeartbeatRecord | null> {
  const { base, headers } = storageSettings();
  const now = options.now ?? new Date();
  const response = await (options.fetchImpl ?? fetch)(`${base}/storage/v1/object/authenticated/${BRIDGE_BUCKET}/${BRIDGE_OBJECT}?snapshot=${now.getTime()}`, {
    headers: { ...headers, Accept: "application/json", "Cache-Control": "no-cache, no-store" },
    cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const failure: unknown = await response.json().catch(() => null);
    // Supabase documents NoSuchKey and the legacy not_found body code. Some
    // legacy gateways transport a semantic 404 as HTTP 400. Only an explicit
    // missing OBJECT is absence; missing buckets/auth/config remain unavailable.
    const missingBucket = record(failure) && (failure.code === "NoSuchBucket" || failure.error === "NoSuchBucket"
      || (typeof failure.message === "string" && /^bucket not found[.!]?$/i.test(failure.message)));
    const missingKey = record(failure) && (failure.code === "NoSuchKey" || failure.error === "NoSuchKey"
      || (String(failure.statusCode) === "404" && failure.error === "not_found"
        && typeof failure.message === "string" && /^object not found[.!]?$/i.test(failure.message)));
    if (!missingBucket && (response.status === 404 || (response.status === 400 && missingKey))) return null;
    throw new Error("Bridge status storage read failed");
  }
  const raw: unknown = await response.json();
  if (!record(raw) || !isoTimestamp(raw.receivedAt)) throw new Error("Invalid stored bridge snapshot");
  const { receivedAt, ...input } = raw;
  const validated = validateBridgeHeartbeat(input);
  if (!validated.ok) throw new Error("Invalid stored bridge snapshot");
  return { ...validated.value, receivedAt };
}

export function unavailableBridgeStatus(): BridgeConnectionStatus {
  return { state: "yellow", label: "Connection status unavailable", detail: "The dashboard could not verify the background connection. Try again shortly.", lastSeenAt: null, checkedAt: null, pending: null };
}

export function classifyBridgeStatus(snapshot: BridgeHeartbeatRecord | null, now = new Date()): BridgeConnectionStatus {
  if (!snapshot) return { state: "red", label: "No connection yet", detail: "No background connection check has been received from the PC.", lastSeenAt: null, checkedAt: null, pending: null };
  const pending = snapshot.counts.queued + snapshot.counts.started;
  const base = { lastSeenAt: snapshot.receivedAt, checkedAt: snapshot.checkedAt, pending };
  const age = now.getTime() - Date.parse(snapshot.receivedAt);
  const reportAge = now.getTime() - Date.parse(snapshot.checkedAt);
  const oldestAge = snapshot.oldestQueuedAt ? now.getTime() - Date.parse(snapshot.oldestQueuedAt) : null;
  if (!Number.isFinite(age) || age < -5000 || !Number.isFinite(reportAge) || reportAge < -5000 || (oldestAge !== null && oldestAge < -5000)) {
    return { ...base, state: "yellow", label: "Connection timing needs attention", detail: "The connection report time could not be verified. Check the PC clock." };
  }
  if (age > 120_000) return { ...base, state: "red", label: "PC connection offline", detail: "The PC has stopped reporting. It may be asleep, turned off, signed out, or the background service may have stopped." };
  if (age > 60_000 || reportAge > 60_000) return { ...base, state: "yellow", label: "Connection check delayed", detail: "The last connection check is getting old. Current readiness is not confirmed." };
  if (!snapshot.sourceAvailable) return { ...base, state: "yellow", label: "Dashboard connection needs attention", detail: "The background service is running but could not read new dashboard answers." };
  if (snapshot.desktopReady === false) return { ...base, state: "yellow", label: "Open Codex on the PC", detail: "The background service is online. Open Codex and keep it running so project chats can receive queued answers." };
  if (snapshot.desktopReady === null) return { ...base, state: "yellow", label: "Checking Codex availability", detail: "The background service is online, but Codex availability has not been verified." };
  if (snapshot.counts.ambiguous) return { ...base, state: "yellow", label: "Delivery needs review", detail: "An answer has an uncertain delivery result. It will not be resent automatically." };
  if (snapshot.counts.blocked) return { ...base, state: "yellow", label: "Some answers need a destination", detail: "The connection is online, but one or more answers need a confirmed project chat before delivery." };
  if (snapshot.counts.started) return { ...base, state: "yellow", label: "Confirming delivery", detail: "An answer reached Codex, but its dashboard delivery confirmation is still pending." };
  if (snapshot.counts.queued && (oldestAge === null || oldestAge > 90_000)) return { ...base, state: "yellow", label: "Waiting for Codex", detail: "Answers are queued but have not appeared in their project chat yet. Codex may still be busy." };
  return { ...base, state: "green", label: "Connected", detail: "The PC background connection is online and Codex is available. Project work and completion are tracked separately." };
}
