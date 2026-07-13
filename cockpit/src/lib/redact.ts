// Render-time DISPLAY HYGIENE — NOT a universal secret scanner.
//
// The real secret-floor guarantee lives at the SOURCE: the register set is
// finite and owner-controlled, so a mechanical register-content scanner (run at
// generate/CI time over registers/*.csv) is where "credentials, keys, full card
// or account numbers NEVER appear" is actually enforced. See the next-slice
// proposal in _governance/inbox/2026-07-13-register-secret-scanner.md. Registers
// are verified clean today.
//
// This module is DEFENSE-IN-DEPTH display hygiene at the render boundary. It
// does exactly two narrow, high-precision things and NOTHING that over-masks the
// identifiers the dashboard must show (commit SHAs, dashless UUIDs, env-var and
// bucket/path names, IDs, prices, dates, plan names):
//
//   1. Structural number truncation — any run of >=10 consecutive DIGITS
//      (ignoring spaces/dashes/dots/slashes/parens between them) renders as
//      "•••• <last4>". DIGITS ONLY, so nothing letter-bearing is ever touched.
//   2. Known key-prefix masking — a token containing a recognised secret prefix
//      (ghp_, sk-, eyJ, AKIA, ...) is masked. These never appear in legit
//      dashboard content, so zero over-mask.
//
// It deliberately does NOT do high-entropy heuristics, hex-length rules, or
// "keyish column => mask wholesale" — those destroy legitimate identifiers and
// give a false guarantee. Locations/keys columns render as-is; a location is not
// a secret, and the source scanner is the guarantee.

// ---- 1. Structural long-number truncation -----------------------------------
// Match a digit run of length >=10 where the digits may be separated by any of
// space, dash, dot, slash, or parentheses (common card/account groupings). We
// require the FIRST and LAST characters of the match to be digits so we only
// consume the number itself, and we verify >=10 actual digits after stripping
// separators. Letters are never in the class, so SHAs/UUIDs/IDs are never hit.
const LONG_NUMBER = /\d(?:[ \-./()]*\d){9,}/g;

function truncateNumber(match: string): string {
  const digits = match.replace(/\D/g, "");
  if (digits.length < 10) return match; // defensive; regex already guarantees >=10
  return `•••• ${digits.slice(-4)}`;
}

// ---- 2. Known key/credential prefixes ---------------------------------------
// Presence of any of these inside a whitespace-delimited token => that token
// carries live secret material and is masked to a fixed placeholder. These
// strings never occur in legitimate dashboard content (locations, plans, IDs).
const KEY_PREFIXES = [
  "ghp_", // GitHub personal access token
  "gho_",
  "ghu_",
  "ghs_",
  "github_pat_",
  "sk-", // OpenAI-style secret key (covers sk-ant-)
  "sk-ant-", // Anthropic key (listed explicitly per spec; sk- already covers it)
  "xoxb-", // Slack bot token
  "xoxp-", // Slack user token
  "AKIA", // AWS access key id
  "ASIA", // AWS temp access key id
  "eyJ", // JWT / base64 JSON header
  "-----BEGIN", // PEM private key block
];

const SECRET_MASK = "«redacted-secret»";

function tokenHasKeyPrefix(token: string): boolean {
  return KEY_PREFIXES.some((p) => token.includes(p));
}

// Redact one register value for display. `columnName` is accepted for call-site
// compatibility (every cell in /projects/[slug] passes its header) but display
// hygiene is content-driven, not column-driven — a location column is rendered
// as-is because a location is not a secret.
export function redactForDisplay(value: string, _columnName = ""): string {
  if (value == null) return value;
  let out = String(value);
  if (out === "") return out;

  // Mask any whitespace-delimited token carrying a known secret prefix. Split on
  // whitespace, keep the separators, so surrounding prose is preserved.
  out = out
    .split(/(\s+)/)
    .map((tok) => (tok.trim() !== "" && tokenHasKeyPrefix(tok) ? SECRET_MASK : tok))
    .join("");

  // Structurally truncate any long digit run to last-4, regardless of separators
  // or word boundaries. Digits-only, so letter-bearing identifiers are untouched.
  out = out.replace(LONG_NUMBER, truncateNumber);

  return out;
}
