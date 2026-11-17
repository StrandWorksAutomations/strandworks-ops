// Instagram: comments on the business account linked to the Kinetic Clinician Page (Graph API v25.0).
import { SendHeld, TEXT_MAX, excerpt, fresh, httpsUrl, missing, toIso } from "../lib/http.mjs";
import { PAGE_ID, graphContext, graphGet, graphPages, graphPost } from "../lib/graph.mjs";

export const network = "instagram";
export const label = "Instagram";
const API = "Instagram Graph API";

export const SIGN_IN_NOTE = "Instagram uses the same Page token as Facebook (KC_FB_PAGE_TOKEN). Sign in again as the Page admin and grant instagram_basic, instagram_manage_comments and pages_read_engagement, "
  + "and make sure the Kinetic Clinician Instagram professional account is linked to the Facebook Page.";
export const REJECTED_NOTE = `Instagram access was refused for the saved Page token. ${SIGN_IN_NOTE}`;
const NOT_LINKED_NOTE = "No Instagram professional account is linked to the Kinetic Clinician Facebook Page. In Meta Business Suite, link the Instagram account to the Page, "
  + "then sign in again and grant instagram_basic, instagram_manage_comments and pages_read_engagement.";

export function checkCredentials(env) {
  return (env.KC_FB_PAGE_TOKEN ?? "").trim() ? { ok: true } : { ok: false, note: `Not connected. ${SIGN_IN_NOTE}` };
}

function same(a, b) {
  return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();
}

/** Turn one media item's comments into inbox items plus the ids the account has already answered. */
export function parseComments(media, comments, ownUsername, now) {
  const items = [];
  const answered = [];
  for (const comment of comments ?? []) {
    const text = String(comment?.text ?? "").trim();
    const commented_at = toIso(comment?.timestamp);
    if (!comment?.id || !text || same(comment.username, ownUsername) || !fresh(commented_at, now)) continue;
    if ((comment.replies?.data ?? []).some((reply) => same(reply?.username, ownUsername))) { answered.push(String(comment.id)); continue; }
    items.push({
      network, external_id: String(comment.id), post_external_id: String(media.id), post_url: httpsUrl(media.permalink),
      post_excerpt: excerpt(media.caption), author_name: String(comment.username ?? "").slice(0, 200),
      text: text.slice(0, TEXT_MAX), commented_at,
    });
  }
  return { items, answered };
}

export async function read({ env, fetchImpl, now }) {
  const credentials = checkCredentials(env);
  if (!credentials.ok) return missing(credentials.note);
  const ctx = graphContext(env, fetchImpl);
  const page = await graphGet(ctx, PAGE_ID, { fields: "instagram_business_account{id,username}" }, API);
  const account = page.instagram_business_account;
  if (!account?.id) return missing(NOT_LINKED_NOTE);
  const media = await graphGet(ctx, `${account.id}/media`, { fields: "id,caption,permalink,timestamp,comments_count", limit: "25" }, API);
  const out = { connected: true, note: "Approved replies are sent from the Instagram account by the sync job.", items: [], answered: [], posts: 0 };
  for (const entry of media.data ?? []) {
    if (!entry?.id || !entry.comments_count) continue;
    out.posts += 1;
    const comments = await graphPages(ctx, `${entry.id}/comments`, { fields: "id,text,timestamp,username,replies{username}", limit: "50" }, API);
    const parsed = parseComments(entry, comments, account.username, now);
    out.items.push(...parsed.items);
    out.answered.push(...parsed.answered);
  }
  return out;
}

export function canSend(env) {
  return checkCredentials(env).ok;
}

/** Post the owner-approved reply under the comment, after confirming the comment text is unchanged. */
export async function send({ env, fetchImpl, item, text }) {
  const ctx = graphContext(env, fetchImpl);
  const current = await graphGet(ctx, item.external_id, { fields: "text" }, API);
  if (String(current.text ?? "").trim().slice(0, TEXT_MAX) !== String(item.text).trim()) throw new SendHeld("The comment changed since approval; review it again.");
  const reply = await graphPost(ctx, `${item.external_id}/replies`, { message: text }, API);
  return { id: String(reply.id ?? "") };
}
