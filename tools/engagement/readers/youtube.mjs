// YouTube: comment threads on the Kinetic Clinician channel (Data API v3, read with an API key).
// Replying needs an OAuth sign-in, which this job does not hold, so YouTube is read-only here.
import { ApiError, TEXT_MAX, excerpt, fresh, missing, requestJson, toIso } from "../lib/http.mjs";

export const network = "youtube";
export const label = "YouTube";
export const CHANNEL_ID = "UCiPtWhRgHcY0FWfUcnkUW2Q";
const API = "YouTube Data API";
const BASE = "https://www.googleapis.com/youtube/v3";
const MAX_PAGES = 3;

const REPLY_NOTE = "Reading only: replying on YouTube needs an OAuth sign-in (youtube.force-ssl), which is not set up. Approve saves your wording; post the reply by hand in YouTube Studio.";
export const SIGN_IN_NOTE = "Set KC_YOUTUBE_API_KEY to a Google Cloud API key with YouTube Data API v3 enabled (Google Cloud console → APIs & Services → Credentials → Create API key, restricted to YouTube Data API v3). "
  + "The key only reads comments; replying needs an OAuth sign-in and is done by hand in YouTube Studio.";
export const REJECTED_NOTE = `Google rejected the saved API key. Check that the key exists, is not restricted away from YouTube Data API v3, and that the API is enabled. ${SIGN_IN_NOTE}`;

export function checkCredentials(env) {
  return (env.KC_YOUTUBE_API_KEY ?? "").trim() ? { ok: true } : { ok: false, note: `Not connected. ${SIGN_IN_NOTE}` };
}

/** Turn commentThreads.list items into inbox items plus the ids the channel has already answered. */
export function parseThreads(threads, titles, now) {
  const items = [];
  const answered = [];
  for (const thread of threads ?? []) {
    const top = thread?.snippet?.topLevelComment;
    const s = top?.snippet;
    const text = String(s?.textOriginal ?? s?.textDisplay ?? "").trim();
    const commented_at = toIso(s?.publishedAt);
    if (!top?.id || !text || s.authorChannelId?.value === CHANNEL_ID || !fresh(commented_at, now)) continue;
    if ((thread.replies?.comments ?? []).some((reply) => reply?.snippet?.authorChannelId?.value === CHANNEL_ID)) { answered.push(String(top.id)); continue; }
    const videoId = String(s.videoId ?? thread.snippet.videoId ?? "");
    const video = /^[\w-]{6,20}$/.test(videoId) ? videoId : "";
    items.push({
      network, external_id: String(top.id), post_external_id: video || null,
      post_url: video ? `https://www.youtube.com/watch?v=${video}&lc=${encodeURIComponent(top.id)}` : null,
      post_excerpt: excerpt(titles?.[video] ?? ""), author_name: String(s.authorDisplayName ?? "").slice(0, 200),
      text: text.slice(0, TEXT_MAX), commented_at,
    });
  }
  return { items, answered };
}

async function get(env, fetchImpl, path, params) {
  const key = env.KC_YOUTUBE_API_KEY.trim();
  try {
    // The key goes in a header so it never appears in a URL.
    return (await requestJson(fetchImpl, `${BASE}/${path}?${new URLSearchParams(params)}`, { label: API, secrets: [key], headers: { "X-Goog-Api-Key": key } })).json;
  } catch (error) {
    if (error instanceof ApiError && /API key/i.test(error.message)) error.auth = true;
    throw error;
  }
}

export async function read({ env, fetchImpl, now }) {
  const credentials = checkCredentials(env);
  if (!credentials.ok) return missing(credentials.note);
  const threads = [];
  let pageToken = "";
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await get(env, fetchImpl, "commentThreads", {
      part: "snippet,replies", allThreadsRelatedToChannelId: CHANNEL_ID, order: "time", maxResults: "100", textFormat: "plainText", ...(pageToken ? { pageToken } : {}) });
    const rows = result.items ?? [];
    threads.push(...rows);
    pageToken = result.nextPageToken ?? "";
    const oldest = toIso(rows.at(-1)?.snippet?.topLevelComment?.snippet?.publishedAt);
    if (!pageToken || !fresh(oldest, now)) break;
  }
  const first = parseThreads(threads, {}, now);
  const videoIds = [...new Set(first.items.map((item) => item.post_external_id).filter(Boolean))].slice(0, 50);
  const titles = {};
  if (videoIds.length) {
    const videos = await get(env, fetchImpl, "videos", { part: "snippet", id: videoIds.join(","), maxResults: "50" });
    for (const video of videos.items ?? []) titles[video.id] = String(video.snippet?.title ?? "");
  }
  return { connected: true, note: REPLY_NOTE, ...parseThreads(threads, titles, now), posts: videoIds.length };
}

/** An API key cannot write. Replies are posted by hand. */
export function canSend() {
  return false;
}
