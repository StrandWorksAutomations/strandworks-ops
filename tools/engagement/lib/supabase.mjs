// Minimal PostgREST client (fetch only). The service-role key is used only in request
// headers; it is never logged, returned, or placed in a URL.

export function supabaseCredentials(env) {
  const url = (env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const key = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return url && key ? { url, key } : null;
}

export function createDb({ url, key }, fetchImpl) {
  async function call(method, table, query, body, prefer) {
    const response = await fetchImpl(`${url}/rest/v1/${table}${query ? `?${query}` : ""}`, {
      method,
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(prefer ? { Prefer: prefer } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`supabase ${method} ${table} failed (${response.status}): ${text.slice(0, 200).split(key).join("[redacted]")}`);
    }
    const text = await response.text().catch(() => "");
    return text ? JSON.parse(text) : [];
  }
  return {
    select: (table, query) => call("GET", table, query),
    insert: (table, row) => call("POST", table, "", row, "return=representation"),
    /** Insert or update on the given unique columns. Columns absent from the rows keep their stored values. */
    upsert: (table, rows, onConflict) => call("POST", table, `on_conflict=${onConflict}`, rows, "resolution=merge-duplicates,return=minimal"),
    /** Update rows matching the PostgREST filter and return them, so the caller can tell whether anything matched. */
    patch: (table, query, patch) => call("PATCH", table, query, patch, "return=representation"),
  };
}
