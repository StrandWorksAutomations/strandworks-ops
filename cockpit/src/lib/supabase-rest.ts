// Minimal server-only PostgREST client for the shared QA/feed Supabase project
// (bniuiwbwumpymxiesyyt). The codebase carries no @supabase/supabase-js dep and
// reaches other backends with plain fetch (see repo.ts), so this follows suit:
// two tiny helpers, zero new dependencies.
//
// SECURITY: the service-role key is read from env at call time and used only in
// the Authorization header. It is never returned to a client, logged, or placed
// in a URL. Every caller of this module is a server component or an /api route
// that middleware has already gated behind the owner's WebAuthn session.

function baseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return url.replace(/\/$/, "");
}

function serviceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return key;
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function authHeaders(): Record<string, string> {
  const key = serviceKey();
  return { apikey: key, Authorization: `Bearer ${key}` };
}

// GET rows. `query` is a raw PostgREST query string (already URL-safe), e.g.
// "select=id,title&archived_at=is.null&order=created_at.desc&limit=60".
export async function sbSelect<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${baseUrl()}/rest/v1/${table}?${query}`, {
    headers: { ...authHeaders(), Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`supabase select ${table} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T[];
}

// INSERT a single row, returning the created representation.
export async function sbInsert<T>(table: string, row: Record<string, unknown>): Promise<T[]> {
  const res = await fetch(`${baseUrl()}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`supabase insert ${table} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T[];
}
