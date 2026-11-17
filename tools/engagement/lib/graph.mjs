// Facebook Graph API v25.0 access shared by the Facebook and Instagram readers.
// The Page token travels only in the Authorization header, never in a URL.
import { createHmac } from "node:crypto";
import { ApiError, requestJson } from "./http.mjs";

export const GRAPH = "https://graph.facebook.com/v25.0";
export const PAGE_ID = "1428142013710264"; // Graph API Page id (the public profile id is 61595378964295).
export const PAGE_PROFILE_ID = "61595378964295";
const MAX_PAGES = 20;

export function graphContext(env, fetchImpl) {
  const token = (env.KC_FB_PAGE_TOKEN ?? "").trim();
  const appSecret = (env.KC_FB_APP_SECRET ?? "").trim();
  return { token, appSecret, fetchImpl, secrets: [token, appSecret] };
}

function proof(ctx) {
  // Required only when the Facebook app enforces "Require app secret".
  return ctx.appSecret ? { appsecret_proof: createHmac("sha256", ctx.appSecret).update(ctx.token).digest("hex") } : {};
}

function options(ctx, label, extra = {}) {
  return { label, secrets: ctx.secrets, ...extra, headers: { Authorization: `Bearer ${ctx.token}`, ...(extra.headers ?? {}) } };
}

export async function graphGet(ctx, path, params = {}, label = "Facebook Graph API") {
  const url = path.startsWith("https://") ? path : `${GRAPH}/${path.replace(/^\//, "")}?${new URLSearchParams({ ...params, ...proof(ctx) })}`;
  // A paging link is followed only on the Graph host, so the token is never sent anywhere else.
  if (!url.startsWith("https://graph.facebook.com/")) throw new ApiError(`${label}: unexpected paging address`);
  return (await requestJson(ctx.fetchImpl, url, options(ctx, label))).json;
}

/** Follow cursor pagination so coverage is complete, with a hard bound. */
export async function graphPages(ctx, path, params = {}, label = "Facebook Graph API") {
  let result = await graphGet(ctx, path, params, label);
  const rows = [...(result.data ?? [])];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const next = result.paging?.next;
    if (!next) return rows;
    result = await graphGet(ctx, next, {}, label);
    rows.push(...(result.data ?? []));
  }
  throw new ApiError(`${label}: too many result pages; coverage is incomplete`);
}

export async function graphPost(ctx, path, params, label = "Facebook Graph API") {
  const body = new URLSearchParams({ ...params, ...proof(ctx) }).toString();
  return (await requestJson(ctx.fetchImpl, `${GRAPH}/${path.replace(/^\//, "")}`, options(ctx, label, {
    method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } }))).json;
}
