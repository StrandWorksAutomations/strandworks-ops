// TikTok: there is no public API that reads comments for a normal business account,
// so nothing is read here. The network is reported as not connected with the manual route.
import { missing } from "../lib/http.mjs";

export const network = "tiktok";
export const label = "TikTok";

export const SIGN_IN_NOTE = "TikTok has no public API for reading comments on a normal business account, so this inbox cannot show them. "
  + "Read and answer TikTok comments in the Metricool inbox (Metricool → Inbox → TikTok) or in the TikTok app.";

export function checkCredentials() {
  return { ok: false, note: SIGN_IN_NOTE };
}

export async function read() {
  return missing(SIGN_IN_NOTE);
}

export function canSend() {
  return false;
}
