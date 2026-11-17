// Facebook: comments on the Kinetic Clinician Page's recent posts (Graph API v25.0).
import { COMMENT_WINDOW_DAYS, SendHeld, TEXT_MAX, excerpt, fresh, httpsUrl, missing, toIso } from "../lib/http.mjs";
import { PAGE_ID, PAGE_PROFILE_ID, graphContext, graphGet, graphPages, graphPost } from "../lib/graph.mjs";

export const network = "facebook";
export const label = "Facebook";
const OWN = new Set([PAGE_ID, PAGE_PROFILE_ID]);
const API = "Facebook Graph API";

export const SIGN_IN_NOTE = "Set KC_FB_PAGE_TOKEN to a Kinetic Clinician Page access token with pages_read_engagement, pages_read_user_content and pages_manage_engagement. "
  + "Get it by signing in as the Page admin with the existing Facebook connect step (page_api.py connect), then copy the Page token into the sync job's environment file.";
export const REJECTED_NOTE = `Facebook rejected the saved Page token. Sign in again as the Page admin and replace KC_FB_PAGE_TOKEN. ${SIGN_IN_NOTE}`;

export function checkCredentials(env) {
  return (env.KC_FB_PAGE_TOKEN ?? "").trim() ? { ok: true } : { ok: false, note: `Not connected. ${SIGN_IN_NOTE}` };
}

/** Turn one post's top-level comments into inbox items plus the ids the Page has already answered. */
export function parseComments(post, comments, now) {
  const items = [];
  const answered = [];
  for (const comment of comments ?? []) {
    const text = String(comment?.message ?? "").trim();
    const commented_at = toIso(comment?.created_time);
    if (!comment?.id || !text || OWN.has(comment.from?.id) || !fresh(commented_at, now)) continue;
    if ((comment.comments?.data ?? []).some((reply) => OWN.has(reply?.from?.id))) { answered.push(String(comment.id)); continue; }
    items.push({
      network, external_id: String(comment.id), post_external_id: String(post.id),
      post_url: httpsUrl(comment.permalink_url) ?? httpsUrl(post.permalink_url),
      post_excerpt: excerpt(post.message), author_name: String(comment.from?.name ?? "").slice(0, 200),
      text: text.slice(0, TEXT_MAX), commented_at,
    });
  }
  return { items, answered };
}

export async function read({ env, fetchImpl, now }) {
  const credentials = checkCredentials(env);
  if (!credentials.ok) return missing(credentials.note);
  const ctx = graphContext(env, fetchImpl);
  const since = Math.floor((now - COMMENT_WINDOW_DAYS * 86400_000) / 1000);
  const posts = await graphPages(ctx, `${PAGE_ID}/posts`, { fields: "id,message,permalink_url,created_time", since: String(since), limit: "25" }, API);
  const out = { connected: true, note: "Approved replies are sent from the Page by the sync job.", items: [], answered: [], posts: posts.length };
  for (const post of posts) {
    if (!post?.id) continue;
    const comments = await graphPages(ctx, `${post.id}/comments`, {
      filter: "toplevel", order: "reverse_chronological", limit: "50",
      fields: "id,message,created_time,permalink_url,from{id,name},comments.limit(100){from{id}}" }, API);
    const parsed = parseComments(post, comments, now);
    out.items.push(...parsed.items);
    out.answered.push(...parsed.answered);
  }
  return out;
}

export function canSend(env) {
  return checkCredentials(env).ok;
}

/** Post the owner-approved reply under the comment, after confirming the comment is unchanged and unanswered. */
export async function send({ env, fetchImpl, item, text }) {
  const ctx = graphContext(env, fetchImpl);
  const current = await graphGet(ctx, item.external_id, { fields: "message,comments.limit(100){from{id}}" }, API);
  if (String(current.message ?? "").trim().slice(0, TEXT_MAX) !== String(item.text).trim()) throw new SendHeld("The comment changed since approval; review it again.");
  if ((current.comments?.data ?? []).some((reply) => OWN.has(reply?.from?.id))) throw new SendHeld("The Page has already replied to this comment.");
  const reply = await graphPost(ctx, `${item.external_id}/comments`, { message: text }, API);
  return { id: String(reply.id ?? "") };
}
