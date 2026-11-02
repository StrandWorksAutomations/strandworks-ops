export const MARKETING_TIMEZONE = "America/New_York";

export type MarketingAccount = {
  platform: string; handle: string; profile_url: string | null;
  connection_status: string; notes?: string;
};
export type MarketingBrand = {
  id: string; key: string; name: string; accounts: MarketingAccount[];
  queue_status: string;
};
export type MarketingProvider = {
  platform: string; status: string; detailed_status?: string;
  post_url?: string | null; publication_verified_independently?: boolean;
};
export type MarketingMedia = {
  url: string; type: string; alt?: string; thumbnail_url?: string | null;
};
export type MarketingPost = {
  id: string; brand_id: string; title?: string; text: string;
  first_comment_text?: string; scheduled_at_utc: string; timezone?: string;
  draft: boolean; isDraft?: boolean; media: MarketingMedia[];
  providers: MarketingProvider[]; source: string; source_checked_at_utc?: string;
};
export type MarketingSource = {
  name: string; checked_at_utc: string; scope: string;
  availability: string; notes?: string;
};
export type MarketingSnapshot = {
  schema_version: number; checked_at_utc: string; timezone: string;
  sources: MarketingSource[]; brands: MarketingBrand[]; posts: MarketingPost[];
  source_completeness?: { queue_local_date_start?: string; queue_local_date_end?: string };
};
export type PaidCampaign = {
  id: string; brand_id: string; title: string; status: string;
  delivery_verified: boolean; starts_at_utc: string; ends_at_utc: string;
  budget_usd: number; budget_type: string; placements: string[];
  poster_url?: string; source_url?: string; notes?: string;
};
export type MarketingPaidSnapshot = {
  checked_at_utc: string; source: string; campaigns: PaidCampaign[];
};
export type MarketingStatus = "draft" | "scheduled" | "published" | "attention";

/** Source drafts outrank pending delivery. A past pending slot is never proof of publication. */
export function postStatus(post: MarketingPost, now: Date): MarketingStatus {
  if (post.draft || post.isDraft) return "draft";
  const statuses = post.providers.map((p) => p.status.toUpperCase());
  if (!statuses.length || statuses.some((s) => /ERROR|FAILED|REJECTED/.test(s))) return "attention";
  if (statuses.every((s) => s === "PUBLISHED" || s === "POSTED")) return "published";
  if (statuses.some((s) => s === "PUBLISHED" || s === "POSTED")) return "attention";
  const date = Date.parse(post.scheduled_at_utc);
  if (Number.isFinite(date) && date > now.getTime() && statuses.every((s) => s === "PENDING" || s === "SCHEDULED")) return "scheduled";
  return "attention";
}

export function statusExplanation(post: MarketingPost, now: Date): string {
  const status = postStatus(post, now);
  if (status === "draft") return "Saved as a draft. It is not scheduled to publish.";
  if (status === "published") return "Metricool reports this post published. Open the platform link to check the live post.";
  if (status === "scheduled") return "Scheduled in the saved Metricool check. Publication has not happened yet.";
  if (post.providers.some((p) => /ERROR|FAILED|REJECTED/i.test(p.status))) return "A platform reported a delivery problem. Check the source before retrying.";
  if (post.providers.some((p) => /PUBLISHED|POSTED/i.test(p.status))) return "The platforms report different delivery states. Check each platform below.";
  return "The saved time has passed or delivery is unclear. Publication needs verification.";
}

export function ownerDay(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-CA", { timeZone: MARKETING_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function weekOf(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "Unknown date";
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export function sourceIsStale(checkedAt: string, now: Date): boolean {
  const at = Date.parse(checkedAt);
  return !Number.isFinite(at) || now.getTime() - at > 24 * 60 * 60 * 1000;
}

/** Only web links and the private page's own poster paths are renderable. */
export function safeMediaUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("/marketing/") && !raw.includes("..") && !raw.includes("\\")) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function strings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === "string");
}
function optionalText(value: Record<string, unknown>, key: string): boolean {
  return value[key] === undefined || value[key] === null || typeof value[key] === "string";
}
function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function parseMarketingSnapshot(raw: string | null): MarketingSnapshot | null {
  if (!raw) return null;
  try {
    const s: unknown = JSON.parse(raw);
    if (!record(s) || s.schema_version !== 1 || !validDate(s.checked_at_utc) || typeof s.timezone !== "string" || !Array.isArray(s.sources) || !s.sources.length || !Array.isArray(s.brands) || !Array.isArray(s.posts)) return null;
    if (!s.sources.every((v: unknown) => record(v) && strings(v, ["name", "scope", "availability"]) && validDate(v.checked_at_utc) && optionalText(v, "notes"))) return null;
    if (!s.brands.every((b: unknown) => record(b) && strings(b, ["id", "key", "name", "queue_status"]) && Array.isArray(b.accounts) && b.accounts.every((a: unknown) => record(a) && strings(a, ["platform", "handle", "connection_status"]) && optionalText(a, "profile_url")))) return null;
    if (!s.posts.every((p: unknown) => record(p) && strings(p, ["id", "brand_id", "text", "source"]) && validDate(p.scheduled_at_utc) && typeof p.draft === "boolean" && (p.isDraft === undefined || typeof p.isDraft === "boolean") && optionalText(p, "title") && optionalText(p, "first_comment_text") && optionalText(p, "source_checked_at_utc") && Array.isArray(p.media) && Array.isArray(p.providers)
      && p.media.every((m: unknown) => record(m) && strings(m, ["url", "type"]) && optionalText(m, "alt") && optionalText(m, "thumbnail_url"))
      && p.providers.every((v: unknown) => record(v) && strings(v, ["platform", "status"]) && optionalText(v, "detailed_status") && optionalText(v, "post_url")))) return null;
    if (s.source_completeness !== undefined && (!record(s.source_completeness) || !optionalText(s.source_completeness, "queue_local_date_start") || !optionalText(s.source_completeness, "queue_local_date_end"))) return null;
    return s as MarketingSnapshot;
  } catch { return null; }
}

export function parsePaidSnapshot(raw: string | null): MarketingPaidSnapshot | null {
  if (!raw) return null;
  try {
    const s: unknown = JSON.parse(raw);
    if (!record(s) || !validDate(s.checked_at_utc) || typeof s.source !== "string" || !Array.isArray(s.campaigns)) return null;
    if (!s.campaigns.every((c: unknown) => record(c) && strings(c, ["id", "brand_id", "title", "status", "budget_type"]) && validDate(c.starts_at_utc) && validDate(c.ends_at_utc) && typeof c.delivery_verified === "boolean" && typeof c.budget_usd === "number" && Number.isFinite(c.budget_usd) && c.budget_usd >= 0 && Array.isArray(c.placements) && c.placements.every((p: unknown) => typeof p === "string") && optionalText(c, "poster_url") && optionalText(c, "source_url") && optionalText(c, "notes"))) return null;
    return s as MarketingPaidSnapshot;
  } catch { return null; }
}
