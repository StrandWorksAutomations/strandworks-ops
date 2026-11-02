import { createHash } from "node:crypto";
import type { VoiceMutation, VoicePostSource, VoiceStore } from "../src/lib/marketing-voice";
export const AT = "2026-11-02T17:00:00.000Z";
export const ORIGINAL = "Unlock the power of learning with our curated tools.";
export const HASH = createHash("sha256").update(ORIGINAL).digest("hex");
export const SOURCE: VoicePostSource = { brand_id: "7530099", post_id: "post-1", post_uuid: null, original_text: ORIGINAL, original_sha256: HASH };
export const FEEDBACK: VoiceMutation = { action: "save_feedback", expected_revision: 0, brand_id: SOURCE.brand_id, post_id: SOURCE.post_id,
  original_text: ORIGINAL, scope: "brand", flags: ["ai_sounding"], rewrite: "Review the anatomy and test what you remember.", note: "Use plain wording." };
export function emptyVoice(): VoiceStore {
  return { schema_version: 1, revision: 0, updated_at: AT, rules: [{ id: "plain-language", scope: "shared", brand_id: null,
    text: "Use plain, specific language.", active: true, created_at: AT, updated_at: AT }], feedback: [], history: [] };
}
export function postSnapshot() {
  return { schema_version: 1, checked_at_utc: AT, timezone: "America/New_York", sources: [{ name: "Metricool", checked_at_utc: AT, scope: "Test fixture", availability: "available" }],
    brands: [{ id: "7530099", key: "tenetrix", name: "Tenetrix Insight", accounts: [], queue_status: "checked" }], posts: [{ id: SOURCE.post_id, brand_id: SOURCE.brand_id, text: ORIGINAL,
      scheduled_at_utc: AT, draft: false, media: [], providers: [{ platform: "instagram", status: "PENDING" }], source: "Metricool" }] };
}
