import { NETWORK_LABEL, type EngagementNetwork } from "./kc-engagement";
import { ownerDay } from "./owner-loop";
import { addDays } from "./money";

export const CHANNELS = ["facebook_group", "facebook_page", "facebook_other", "instagram", "youtube", "linkedin", "tiktok"] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABEL: Record<Channel, string> = {
  facebook_group: "Facebook groups", facebook_page: "Facebook Page", facebook_other: "Facebook (unspecified)",
  instagram: NETWORK_LABEL.instagram, youtube: NETWORK_LABEL.youtube, linkedin: NETWORK_LABEL.linkedin, tiktok: NETWORK_LABEL.tiktok,
};
type Counts = Partial<Record<Channel, number>>;
export type OutcomeFact = { item_id: string; platform: string; source_kind: string; source_url: string; posted_at: string | null };
export type EngagementFact = { id: string; network: EngagementNetwork; external_id: string; post_external_id: string | null; post_url: string | null; status: string; delivery_result: string | null };
export type ReplyCounts = { dated: Record<string, Counts>; undated: Counts; ambiguous: number };

function pageTarget(raw: string | null): { post?: string; comment?: string } {
  try {
    const url = new URL(raw ?? "");
    if (url.protocol !== "https:" || !["facebook.com", "www.facebook.com", "m.facebook.com"].includes(url.hostname)) return {};
    const post = /^\/[\w.-]+\/posts\/([a-z0-9]+)\/?$/i.exec(url.pathname)?.[1] ??
      (/^\/(?:permalink|story)\.php$/.test(url.pathname) ? url.searchParams.get("story_fbid") : null);
    if (!post) return {};
    const comments = url.searchParams.getAll(url.searchParams.has("reply_comment_id") ? "reply_comment_id" : "comment_id");
    return { post, comment: comments.length === 1 && /^\d+$/.test(comments[0]) ? comments[0] : undefined };
  } catch { return {}; }
}

export function countReplies(ledger: OutcomeFact[], engagement: EngagementFact[]): ReplyCounts {
  const dated: Record<string, Counts> = {};
  const undated: Counts = {};
  let ambiguous = 0;
  type PageAnswer = { post?: string; instant: string | null };
  const knownPages = new Map<string, PageAnswer>();
  const unknownPagePosts = new Set<string>();
  function record(channel: Channel, instant: string | null) {
    const day = instant && Number.isFinite(Date.parse(instant)) ? ownerDay(instant) : null;
    const counts = day ? (dated[day] ??= {}) : undated;
    counts[channel] = (counts[channel] ?? 0) + 1;
  }
  for (const row of ledger) {
    if (row.platform !== "facebook") continue;
    const channel = row.source_kind === "owned_page" ? "facebook_page" : row.source_kind === "public_group" ? "facebook_group" : "facebook_other";
    if (channel === "facebook_page") {
      const target = pageTarget(row.source_url);
      if (target.comment) {
        const prior = knownPages.get(target.comment);
        knownPages.set(target.comment, { post: target.post, instant: prior?.instant ?? row.posted_at });
        continue;
      }
      unknownPagePosts.add(target.post ?? "");
    }
    record(channel, row.posted_at);
  }
  // The Page worker builds comment_id from the last numeric component of the
  // Graph comment ID. The Engagement reader stores that original Graph ID.
  for (const row of engagement) {
    let instant: string | null = null;
    if (row.status === "sent") {
      const receipt = /^Sent on .+? at (\d{4}-\d{2}-\d{2}T[\d:.]+Z)(?:[ .]|$)/.exec(row.delivery_result ?? "");
      instant = receipt?.[1] ?? null;
    } else if (row.status !== "dismissed" || row.delivery_result !== "Already answered on the network.") {
      continue;
    }
    if (row.network !== "facebook") {
      record(row.network, instant);
      continue;
    }
    const target = pageTarget(row.post_url);
    const comment = /^(?:\d+_)*\d+$/.test(row.external_id) ? row.external_id.split("_").at(-1) : target.comment;
    const graphPost = row.post_external_id?.split("_").at(-1);
    if (!comment || (target.comment && comment !== target.comment)) { ambiguous++; continue; }
    const prior = knownPages.get(comment);
    if (prior) {
      if (prior.post && target.post && prior.post !== target.post && prior.post !== graphPost) { ambiguous++; continue; }
      // A dated send receipt can supply the day for a legacy undated answer.
      prior.instant ??= instant;
    } else if (unknownPagePosts.has("") || unknownPagePosts.has(target.post ?? "") || unknownPagePosts.has(graphPost ?? "")) {
      ambiguous++;
    } else {
      knownPages.set(comment, { post: target.post ?? graphPost, instant });
    }
  }
  for (const page of knownPages.values()) record("facebook_page", page.instant);
  return { dated, undated, ambiguous };
}

export type Pageviews = Record<string, number>;
export type JobClickDay = { day: string; job_clicks: number };
export type DraftEditDay = { day: string; as_drafted: number; edited: number; missing: number };

export function weeklyDraftEdits(days: DraftEditDay[], start: string, end: string) {
  const weeks = new Map<string, DraftEditDay>();
  const totals = { as_drafted: 0, edited: 0, missing: 0 };
  let undated = 0;
  for (const row of days) {
    if (row.day === "undated") { undated += row.as_drafted + row.edited + row.missing; continue; }
    if (row.day < start || row.day > end) continue;
    const weekday = new Date(row.day + "T12:00:00Z").getUTCDay();
    const monday = addDays(row.day, -((weekday + 6) % 7));
    const week = weeks.get(monday) ?? { day: monday, as_drafted: 0, edited: 0, missing: 0 };
    for (const key of ["as_drafted", "edited", "missing"] as const) {
      week[key] += row[key];
      totals[key] += row[key];
    }
    weeks.set(monday, week);
  }
  return { totals, weeks: Array.from(weeks.values()).sort((a, b) => b.day.localeCompare(a.day)), undated };
}
export function readPageviews(raw: string | null): Pageviews {
  if (!raw) return {};
  try {
    const snapshot = JSON.parse(raw);
    if (snapshot.project !== "highest-paying" || snapshot.environment !== "production" ||
        snapshot.metric !== "vercel.analytics_pageview.count" || snapshot.aggregation !== "sum" ||
        snapshot.timezone !== "America/New_York" || !snapshot.days || typeof snapshot.days !== "object") return {};
    return Object.fromEntries(Object.entries(snapshot.days).filter(([day, n]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(day) && typeof n === "number" && Number.isSafeInteger(n) && n >= 0)) as Pageviews;
  } catch { return {}; }
}

export function total(counts: Counts): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

export function replyRange(counts: ReplyCounts, views: Pageviews, start: string, end: string, clicks: Record<string, number> = {}) {
  const totals: Counts = {};
  const days: { day: string; channels: Counts; answered: number; pageviews: number | null; jobClicks: number | null }[] = [];
  const firstKnown = [...Object.keys(counts.dated), ...Object.keys(views), ...Object.keys(clicks)].sort()[0];
  // A zero means no recorded answers that day. Earlier than the oldest source
  // record, there is no historical coverage to export.
  if (firstKnown) {
    for (let day = start > firstKnown ? start : firstKnown; day <= end; day = addDays(day, 1)) {
      const channels = counts.dated[day] ?? {};
      for (const key of CHANNELS) totals[key] = (totals[key] ?? 0) + (channels[key] ?? 0);
      days.push({ day, channels, answered: total(channels), pageviews: views[day] ?? null, jobClicks: clicks[day] ?? null });
      if (day === end) break;
    }
  }
  return { days, totals, answered: total(totals) };
}

export function replyCsv(days: ReturnType<typeof replyRange>["days"], channels: readonly Channel[] = CHANNELS): string {
  const rows = days.map((d) => [d.day, d.answered, ...channels.map((c) => d.channels[c] ?? 0), d.pageviews ?? "", d.jobClicks ?? ""]);
  return [["Date (Eastern)", "Answered", ...channels.map((c) => CHANNEL_LABEL[c]), "Website pageviews", "Website job clicks"], ...rows]
    .map((row) => row.join(",")).join("\r\n") + "\r\n";
}
