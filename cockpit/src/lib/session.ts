// Stateless HMAC-signed session + challenge cookies. No database — the only
// server-side secret is SESSION_SECRET (env). Sessions are short-lived per
// SPEC. Uses Web Crypto so it also runs in the Edge runtime (middleware).

const SESSION_COOKIE = "cockpit_session";
const CHALLENGE_COOKIE = "cockpit_challenge";
export const SESSION_TTL_SECONDS = 60 * 60; // 1 hour
const CHALLENGE_TTL_SECONDS = 5 * 60;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.VERCEL) throw new Error("SESSION_SECRET must be set in production");
  // Dev fallback: fixed only for the local process lifetime is overkill —
  // a static dev secret is fine because the app is on localhost only.
  return "dev-only-secret-not-for-production";
}

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(new Uint8Array(sig));
}

async function signToken(data: Record<string, unknown>, ttlSeconds: number): Promise<string> {
  const payload = b64url(
    new TextEncoder().encode(JSON.stringify({ ...data, exp: Date.now() + ttlSeconds * 1000 }))
  );
  return `${payload}.${await hmac(payload)}`;
}

async function verifyToken(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return null;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createSessionToken(): Promise<string> {
  return signToken({ sub: "owner" }, SESSION_TTL_SECONDS);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const data = await verifyToken(token);
  return data?.sub === "owner";
}

export async function createChallengeToken(challenge: string, purpose: "auth" | "register"): Promise<string> {
  return signToken({ challenge, purpose }, CHALLENGE_TTL_SECONDS);
}

export async function verifyChallengeToken(
  token: string | undefined,
  purpose: "auth" | "register"
): Promise<string | null> {
  const data = await verifyToken(token);
  if (!data || data.purpose !== purpose || typeof data.challenge !== "string") return null;
  return data.challenge;
}

export const cookieNames = { session: SESSION_COOKIE, challenge: CHALLENGE_COOKIE };

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function challengeCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  };
}
