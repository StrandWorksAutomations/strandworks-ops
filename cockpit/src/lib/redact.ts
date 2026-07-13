// Render-time secret redaction — the CODE guarantee behind the VISION security
// floor: "credentials, keys, full card or account numbers NEVER appear —
// last-4 only, locations of keys not keys."
//
// The registers are curated to already hold last-4 and key LOCATIONS, never
// secrets. This module is DEFENSE-IN-DEPTH: every register value the WS-E views
// render passes through redactForDisplay() so that IF a register cell ever held
// a full card/account number or a raw key/credential, it is masked at the render
// boundary rather than shown. It must strip real secret material while leaving
// legitimate content (dates, prices, already-truncated last-4, paths, URLs,
// plan names, locations) untouched.

// ---- Card / account numbers -------------------------------------------------
// A run of 12–19 digits (ignoring internal spaces/dashes) is card/account
// shaped. Mask to last-4 only: "4111 1111 1111 8774" -> "•••• 8774".
// We scan for such runs anywhere in the value (embedded in prose too).
const CARD_LIKE = /\b(?:\d[ -]?){12,19}\b/g;

function maskCardRun(match: string): string {
  const digits = match.replace(/[ -]/g, "");
  if (digits.length < 12 || digits.length > 19) return match; // not card-shaped after stripping
  const last4 = digits.slice(-4);
  return `•••• ${last4}`;
}

// ---- Secret / key material --------------------------------------------------
// Common key/credential prefixes. Presence of any of these => the value carries
// live secret material and is masked to a fixed placeholder.
const KEY_PREFIXES = [
  "sk-", // OpenAI-style secret keys
  "ghp_", // GitHub personal access token
  "gho_",
  "ghu_",
  "ghs_",
  "ghr_",
  "github_pat_",
  "eyJ", // JWT / base64 JSON header
  "AKIA", // AWS access key id
  "ASIA", // AWS temp access key id
  "xoxb-", // Slack bot token
  "xoxp-", // Slack user token
  "-----BEGIN", // PEM private key block
];

// A long high-entropy alphanumeric token: >=20 chars, mixed letters+digits,
// no whitespace. Catches raw keys with no recognisable prefix. Long hex strings
// (e.g. 40-char SHA) are handled here too via the hex check below.
function isHighEntropyToken(token: string): boolean {
  if (token.length < 20) return false;
  if (/\s/.test(token)) return false;
  // Must be dominated by the alphabet a secret uses: [A-Za-z0-9] plus the
  // occasional +/=_- of base64url/key formats. If it contains spaces, slashes
  // used as PATH separators, or dots used as domain/path separators, treat it
  // as structured content (URL/path/email) and let the URL/path guards decide.
  if (!/^[A-Za-z0-9+/=_-]{20,}$/.test(token)) return false;
  const hasLetter = /[A-Za-z]/.test(token);
  const hasDigit = /\d/.test(token);
  // Long pure-hex (>=32) is secret-shaped (hashes, raw keys) even without mixed
  // case variety; otherwise require BOTH letters and digits ("mixed").
  const isLongHex = /^[0-9a-fA-F]{32,}$/.test(token);
  return isLongHex || (hasLetter && hasDigit);
}

// A value that is a legitimate LOCATION (path, env-var reference, URL, host)
// must pass through untouched even though it can be long. These shapes are how
// the access register records WHERE a key lives (never the key itself).
function looksLikeLocation(value: string): boolean {
  const v = value.trim();
  if (v === "") return false;
  // Filesystem paths: ~/..., /abs/..., ./rel, C:\..., contains a slash segment.
  if (/[/\\]/.test(v)) return true;
  // Env-var references: "Vercel env GITHUB_TOKEN", "1Password: item", "env:FOO",
  // or any value that reads as words separated by spaces (a description, not a
  // dense token).
  if (/\s/.test(v)) return true;
  // Bare host / URL without a scheme: "vault.example.com".
  if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)) return true;
  return false;
}

const KEYISH_COLUMN = /(^|_)(key|token|secret|credential|password|api_?key)s?(_|$)/i;
const LOCATION_COLUMN = /location|where|path|env/i;

const SECRET_MASK = "«redacted-secret»";

// Redact one register value for display. `columnName` (raw register header, e.g.
// "key_location", "notes", "cost_monthly_usd") sharpens the check: a key-ish
// column whose value does NOT look like a location is treated as a leaked raw
// key and masked wholesale.
export function redactForDisplay(value: string, columnName = ""): string {
  if (value == null) return value;
  let out = String(value);
  if (out === "") return out;

  const col = columnName.toLowerCase();
  const isKeyishColumn = KEYISH_COLUMN.test(col);
  const isLocationColumn = LOCATION_COLUMN.test(col);

  // 1. A key-ish / key_location column must hold a LOCATION, never a value.
  //    If the cell doesn't look like a path/location/description, it's a leaked
  //    key — mask the whole cell. (A real location passes untouched.)
  if ((isKeyishColumn || isLocationColumn) && !looksLikeLocation(out)) {
    // Still allow trivially-safe scalars a location column might hold: a bare
    // last-4, empty, or a short label. Anything long/dense is a secret.
    if (out.length >= 12 || isHighEntropyToken(out)) return SECRET_MASK;
    // A short bare token in a key column that isn't a location is suspicious but
    // could be a label; only mask if it carries the shape of a secret prefix.
  }

  // 2. Known key/credential prefixes anywhere => mask the whole value.
  for (const p of KEY_PREFIXES) {
    if (out.includes(p)) return SECRET_MASK;
  }

  // 3. High-entropy standalone tokens embedded in the value => mask those tokens
  //    (leave surrounding prose intact). Split on whitespace so a note like
  //    "token committed by mistake: ghp_xxx" is handled by prefix match above,
  //    and a lone 40-char hex is masked here.
  out = out
    .split(/(\s+)/)
    .map((tok) => (isHighEntropyToken(tok) ? SECRET_MASK : tok))
    .join("");

  // 4. Card/account-number-shaped digit runs => last-4 only.
  out = out.replace(CARD_LIKE, maskCardRun);

  return out;
}
