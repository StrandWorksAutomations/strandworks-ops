// Shared HTTP helpers for the engagement readers. Error messages are safe to store and
// print: they never contain a request URL, a header, or a credential value.

export const COMMENT_WINDOW_DAYS = 14;
export const TEXT_MAX = 12000;
export const EXCERPT_MAX = 300;

/** A failed API call. `auth` means the saved sign-in was rejected; `uncertain` means a write may have happened. */
export class ApiError extends Error {
  constructor(message, { status = 0, auth = false, uncertain = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.auth = auth;
    this.uncertain = uncertain;
  }
}

/** A reply that was deliberately not sent (the comment changed, or it is already answered). */
export class SendHeld extends Error {}

export function redact(text, secrets = []) {
  let out = String(text ?? "");
  for (const secret of secrets) if (secret && secret.length >= 6) out = out.split(secret).join("[redacted]");
  return out;
}

function errorDetail(body) {
  if (!body || typeof body !== "object") return { message: "", code: "" };
  const e = body.error && typeof body.error === "object" ? body.error : body;
  const reason = Array.isArray(e.errors) && e.errors[0]?.reason ? e.errors[0].reason : "";
  return { message: String(e.message ?? "").slice(0, 200), code: String(e.code ?? e.serviceErrorCode ?? e.status ?? ""), reason: String(reason) };
}

/**
 * Fetch JSON. `label` names the API in error messages ("Facebook Graph API").
 * A write (`method` other than GET) that fails without a clear HTTP answer is marked uncertain.
 */
export async function requestJson(fetchImpl, url, { method = "GET", headers = {}, body, label, secrets = [] } = {}) {
  const write = method !== "GET";
  let response;
  try {
    response = await fetchImpl(url, { method, headers, body, signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    throw new ApiError(`${label} unreachable: ${error?.name ?? "network error"}`, { uncertain: write });
  }
  const text = await response.text().catch(() => "");
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  if (!response.ok) {
    const detail = errorDetail(json);
    const limited = /quota|rateLimit|throttle/i.test(detail.reason) || response.status === 429;
    const auth = !limited && (response.status === 401 || response.status === 403 || ["190", "10", "200"].includes(detail.code));
    const message = redact(`${label} ${response.status}${detail.code ? ` (code ${detail.code})` : ""}: ${detail.message || "request failed"}`, secrets);
    throw new ApiError(message, { status: response.status, auth, uncertain: write && response.status >= 500 });
  }
  return { json: json ?? {}, headers: response.headers };
}

/** ISO 8601 with a UTC "Z", or null. Accepts Graph's "+0000" offsets and epoch milliseconds. */
export function toIso(value) {
  if (value === null || value === undefined || value === "") return null;
  const at = typeof value === "number" ? value : Date.parse(String(value).replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  return Number.isFinite(at) ? new Date(at).toISOString() : null;
}

export function excerpt(text, max = EXCERPT_MAX) {
  const flat = String(text ?? "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function httpsUrl(value) {
  return typeof value === "string" && /^https:\/\/[^\s]+$/.test(value) && value.length <= 1000 ? value : null;
}

/** True when the comment is inside the window the inbox imports. */
export function fresh(iso, now, days = COMMENT_WINDOW_DAYS) {
  return !!iso && Date.parse(iso) >= now - days * 86400_000;
}

export function missing(note) {
  return { connected: false, note, items: [], answered: [] };
}
