// Mocked fetch for the engagement tests. No test contacts a real network or Supabase.

export const NOW = Date.parse("2026-11-17T12:00:00Z");
export const SECRET = "test-credential-value-not-real";

/**
 * `routes` is a list of [matcher, reply]. The matcher is a substring of "METHOD url" or a
 * function (url, init) => boolean. The reply is a JSON body, { status, body }, or a function
 * returning either. The first match wins; an unmatched request fails the test.
 */
export function mockFetch(routes) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const method = init.method ?? "GET";
    calls.push({ url: String(url), method, headers: init.headers ?? {}, body: init.body });
    for (const [matcher, reply] of routes) {
      const hit = typeof matcher === "function" ? matcher(String(url), init) : `${method} ${url}`.includes(matcher);
      if (!hit) continue;
      const value = typeof reply === "function" ? reply(String(url), init) : reply;
      const wrapped = value && typeof value === "object" && "status" in value && "body" in value ? value : { status: 200, body: value };
      return new Response(JSON.stringify(wrapped.body), { status: wrapped.status, headers: { "Content-Type": "application/json", ...(wrapped.headers ?? {}) } });
    }
    throw new Error(`unexpected request in test: ${method} ${String(url).split("?")[0]}`);
  };
  return { fetchImpl, calls };
}

export function noFetch() {
  const calls = [];
  return { calls, fetchImpl: async (url) => { calls.push(String(url)); throw new Error("no request expected"); } };
}
