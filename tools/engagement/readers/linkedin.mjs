// LinkedIn: comments on the Kinetic Clinician organization's posts (versioned REST API).
// Reading and replying both need an app approved for the Community Management API.
import { COMMENT_WINDOW_DAYS, TEXT_MAX, excerpt, fresh, missing, requestJson, toIso } from "../lib/http.mjs";

export const network = "linkedin";
export const label = "LinkedIn";
export const ORGANIZATION_ID = "146763118";
export const ORGANIZATION_URN = `urn:li:organization:${ORGANIZATION_ID}`;
const API = "LinkedIn API";
const BASE = "https://api.linkedin.com/rest";
const DEFAULT_VERSION = "202610";
const PAGE_SIZE = 50;
const MAX_PAGES = 5;

export const SIGN_IN_NOTE = "Set KC_LINKEDIN_TOKEN to a LinkedIn access token for an admin of the Kinetic Clinician company page (organization 146763118) with r_organization_social and w_organization_social. "
  + "This needs a LinkedIn developer app approved for the Community Management API: request that product on the app's Products tab at linkedin.com/developers, wait for LinkedIn's approval, then sign in and copy the token. "
  + "Until then, answer LinkedIn comments on linkedin.com.";
export const REJECTED_NOTE = `LinkedIn refused the saved token. It may have expired (LinkedIn tokens last about 60 days) or the app may not yet be approved for the Community Management API. ${SIGN_IN_NOTE}`;

export function checkCredentials(env) {
  return (env.KC_LINKEDIN_TOKEN ?? "").trim() ? { ok: true } : { ok: false, note: `Not connected. ${SIGN_IN_NOTE}` };
}

function headers(env) {
  const version = /^\d{6}$/.test(env.KC_LINKEDIN_VERSION ?? "") ? env.KC_LINKEDIN_VERSION : DEFAULT_VERSION;
  return { Authorization: `Bearer ${env.KC_LINKEDIN_TOKEN.trim()}`, "LinkedIn-Version": version, "X-Restli-Protocol-Version": "2.0.0" };
}

export function commentUrn(comment) {
  const given = comment?.commentUrn ?? comment?.$URN;
  if (typeof given === "string" && given.startsWith("urn:li:comment:")) return given;
  return comment?.object && comment?.id ? `urn:li:comment:(${comment.object},${comment.id})` : null;
}

function postUrl(postUrn) {
  return /^urn:li:(share|ugcPost|activity):\d+$/.test(postUrn) ? `https://www.linkedin.com/feed/update/${postUrn}/` : null;
}

/** Turn one post's comment elements into inbox items. Replies to comments and the page's own comments are skipped. */
export function parseComments(post, comments, now) {
  const items = [];
  for (const comment of comments ?? []) {
    const text = String(comment?.message?.text ?? "").trim();
    const commented_at = toIso(comment?.created?.time);
    const urn = commentUrn(comment);
    if (!urn || !text || comment.parentComment || comment.actor === ORGANIZATION_URN || !fresh(commented_at, now)) continue;
    items.push({
      network, external_id: urn,
      // The activity the comment belongs to; LinkedIn requires it as `object` when replying.
      post_external_id: String(comment.object ?? post.id),
      post_url: postUrl(String(post.id)), post_excerpt: excerpt(post.commentary),
      // The comments API returns the author only as a member URN; resolving a name needs a further permission.
      author_name: "LinkedIn member", text: text.slice(0, TEXT_MAX), commented_at,
    });
  }
  return { items, answered: [] };
}

async function get(env, fetchImpl, path) {
  return (await requestJson(fetchImpl, `${BASE}/${path}`, { label: API, secrets: [env.KC_LINKEDIN_TOKEN.trim()], headers: headers(env) })).json;
}

export async function read({ env, fetchImpl, now }) {
  const credentials = checkCredentials(env);
  if (!credentials.ok) return missing(credentials.note);
  const posts = await get(env, fetchImpl, `posts?q=author&author=${encodeURIComponent(ORGANIZATION_URN)}&count=20&sortBy=LAST_MODIFIED`);
  const recent = (posts.elements ?? []).filter((post) => post?.id && fresh(toIso(post.lastModifiedAt ?? post.publishedAt ?? post.createdAt), now, COMMENT_WINDOW_DAYS * 2));
  const out = { connected: true, note: "Approved replies are sent from the company page by the sync job. Requires continued Community Management API approval.", items: [], answered: [], posts: recent.length };
  for (const post of recent) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await get(env, fetchImpl, `socialActions/${encodeURIComponent(post.id)}/comments?count=${PAGE_SIZE}&start=${page * PAGE_SIZE}`);
      const elements = result.elements ?? [];
      out.items.push(...parseComments(post, elements, now).items);
      if (elements.length < PAGE_SIZE) break;
    }
  }
  return out;
}

export function canSend(env) {
  return checkCredentials(env).ok;
}

/** Post the owner-approved reply as the company page, nested under the member's comment. */
export async function send({ env, fetchImpl, item, text }) {
  const body = JSON.stringify({ actor: ORGANIZATION_URN, object: item.post_external_id, parentComment: item.external_id, message: { text } });
  const { json, headers: responseHeaders } = await requestJson(fetchImpl, `${BASE}/socialActions/${encodeURIComponent(item.external_id)}/comments`, {
    method: "POST", body, label: API, secrets: [env.KC_LINKEDIN_TOKEN.trim()], headers: { ...headers(env), "Content-Type": "application/json" } });
  return { id: String(json.id ?? responseHeaders?.get?.("x-restli-id") ?? "") };
}
