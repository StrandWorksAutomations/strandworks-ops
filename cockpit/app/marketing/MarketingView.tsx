"use client";

import { useState } from "react";
import { MARKETING_TIMEZONE, ownerDay, postStatus, safeMediaUrl, sourceIsStale, statusExplanation, weekOf,
  type MarketingSnapshot, type MarketingPaidSnapshot, type MarketingPost, type MarketingStatus, type PaidCampaign } from "@/lib/marketing";

const PLATFORMS: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn", bluesky: "Bluesky", threads: "Threads", twitter: "X" };
const STATUS: Record<MarketingStatus, string> = { draft: "Draft", scheduled: "Scheduled", published: "Published", attention: "Check status" };
const ORDER: MarketingStatus[] = ["scheduled", "published", "draft", "attention"];

function when(iso: string, options: Intl.DateTimeFormatOptions = {}): string {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date.toLocaleString("en-US", { timeZone: MARKETING_TIMEZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", ...options }) + " ET" : "Date not available";
}
function dayLabel(day: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" }) : day;
}
function platform(name: string) { return PLATFORMS[name.toLowerCase()] ?? name; }

function PostCard({ post, now }: { post: MarketingPost; now: Date }) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const status = postStatus(post, now);
  const media = post.media[0];
  const thumbnail = safeMediaUrl(media?.thumbnail_url) ?? (media?.type !== "video" ? safeMediaUrl(media?.url) : undefined);
  const heading = post.title || post.text.split("\n")[0] || "Untitled post";
  return <article className={`marketing-post marketing-post-${status}`}>
    <button className="marketing-preview" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? "Close" : "Open"} post: ${heading}`}>
      {thumbnail && !imageFailed ? <img src={thumbnail} alt={media?.alt || heading} loading="lazy" onError={() => setImageFailed(true)} /> : <span className="marketing-no-preview">{imageFailed ? "Preview unavailable" : "No preview supplied"}</span>}
      {media?.type === "video" ? <span className="marketing-media-type">Video</span> : post.media.length > 1 ? <span className="marketing-media-type">{post.media.length} images</span> : null}
    </button>
    <div className="marketing-post-info">
      <span className={`marketing-status ${status}`}>{STATUS[status]}</span>
      <p className="marketing-time">{when(post.scheduled_at_utc)}</p>
      <h3>{heading}</h3>
      <p className="marketing-platforms">{post.providers.map((p) => platform(p.platform)).join(" / ")}</p>
      <button className="marketing-detail-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Close details" : "Caption and details"}</button>
    </div>
    {open ? <div className="marketing-post-details">
      <p className="marketing-explanation">{statusExplanation(post, now)}</p>
      <div className="marketing-full-media">
        {post.media.map((m, i) => { const url = safeMediaUrl(m.url); return !url ? null : m.type === "video" ? <video key={i} src={url} poster={safeMediaUrl(m.thumbnail_url)} controls playsInline preload="metadata" /> : <img key={i} src={url} alt={m.alt || `Post image ${i + 1}`} loading="lazy" />; })}
      </div>
      <p className="marketing-caption">{post.text}</p>
      {post.first_comment_text ? <details><summary>First comment</summary><p className="marketing-caption">{post.first_comment_text}</p></details> : null}
      <ul className="marketing-provider-list">{post.providers.map((p) => <li key={p.platform}>
        <span><strong>{platform(p.platform)}</strong><small>{post.draft || post.isDraft ? "Draft" : p.detailed_status || p.status}</small></span>
        {safeMediaUrl(p.post_url) ? <a href={safeMediaUrl(p.post_url)} target="_blank" rel="noreferrer">Open post</a> : null}
      </li>)}</ul>
      <p className="marketing-source-note">Metricool checked {when(post.source_checked_at_utc || "")}</p>
    </div> : null}
  </article>;
}

function PaidCard({ campaign, checkedAt }: { campaign: PaidCampaign; checkedAt: string }) {
  const poster = safeMediaUrl(campaign.poster_url);
  return <article className="marketing-paid-card">
    {poster ? <img className="marketing-paid-poster" src={poster} alt={`Approved creative for ${campaign.title}`} /> : null}
    <div className="marketing-paid-info">
      <div className="marketing-paid-topline"><span className="marketing-status paid">{campaign.status.replaceAll("_", " ").toLowerCase()}</span><span>Paid video</span></div>
      <h3>{campaign.title}</h3>
      <p className="marketing-paid-budget"><strong>${campaign.budget_usd} {campaign.budget_type === "lifetime" ? "total cap" : campaign.budget_type}</strong><span>{campaign.placements.length} placements</span></p>
      <p className="marketing-source-note">Meta Ads Manager checked {when(checkedAt)}</p>
      <details className="marketing-paid-details"><summary>Campaign details</summary>
        <p>{when(campaign.starts_at_utc)} to {when(campaign.ends_at_utc)}</p>
        <p className="marketing-platforms">{campaign.placements.join(", ")}</p>
        <p className="marketing-explanation">{campaign.delivery_verified ? "Delivery verified at the source check." : "Schedule published. Actual delivery has not been verified."}</p>
        {campaign.notes ? <p className="marketing-explanation">{campaign.notes}</p> : null}
        <a className="marketing-external" href={safeMediaUrl(campaign.source_url) || "https://adsmanager.facebook.com/"} target="_blank" rel="noreferrer">Open Ads Manager</a>
      </details>
    </div>
  </article>;
}

function SourceDetails({ snapshot }: { snapshot: MarketingSnapshot }) {
  return <details className="marketing-source-details"><summary>Source checks</summary><p>This is a saved source check. It does not update automatically or change any posting queue.</p><p>Only the brands returned by Metricool are included. Created accounts outside Metricool have not been inventoried. Published means Metricool reported publication; the public pages have not been independently checked.</p>{snapshot.sources.map((source) => <div key={source.name}><h3>{source.name}</h3><p>Checked {when(source.checked_at_utc)}</p><p>{source.scope}</p><p>{source.notes}</p></div>)}</details>;
}

export function MarketingView({ snapshot, paid, nowIso }: { snapshot: MarketingSnapshot | null; paid: MarketingPaidSnapshot | null; nowIso: string }) {
  const now = new Date(nowIso);
  const [brandId, setBrandId] = useState("7530099");
  const [filter, setFilter] = useState<MarketingStatus | "all">("all");
  const [view, setView] = useState<"week" | "gallery">("gallery");
  const brand = snapshot?.brands.find((b) => b.id === brandId);
  const posts = (snapshot?.posts || []).filter((p) => p.brand_id === brandId).sort((a, b) => a.scheduled_at_utc.localeCompare(b.scheduled_at_utc));
  const visible = posts.filter((p) => filter === "all" || postStatus(p, now) === filter);
  const groups = new Map<string, MarketingPost[]>();
  for (const post of visible) { const day = ownerDay(post.scheduled_at_utc); groups.set(day, [...(groups.get(day) || []), post]); }
  const campaigns = (paid?.campaigns || []).filter((c) => c.brand_id === brandId);
  const queueChecked = brand?.queue_status === "checked";
  const postsCheckedAt = snapshot?.sources.find((s) => s.name.includes("getScheduledPosts"))?.checked_at_utc || snapshot?.checked_at_utc;
  const accountAttention = brand?.accounts.some((a) => a.connection_status.includes("attention") || (a.platform === "tiktok" && a.handle === "adminlwcbg5"));

  return <div className="marketing-view">
    {!snapshot ? <section className="marketing-unavailable" role="status"><h2>Social overview unavailable</h2><p>The saved source check could not be loaded. No empty queue or publication status is assumed.</p></section> : <>
      <div className="marketing-toolbar">
        <label className="marketing-brand-select">Brand<select aria-label="Choose a brand" value={brandId} onChange={(event) => { setBrandId(event.target.value); setFilter("all"); }}>{[...snapshot.brands].sort((a, b) => Number(b.id === "7530099") - Number(a.id === "7530099")).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <div className={`marketing-source-compact ${postsCheckedAt && sourceIsStale(postsCheckedAt, now) ? "stale" : ""}`}><p>Saved check {when(postsCheckedAt || snapshot.checked_at_utc)}{postsCheckedAt && sourceIsStale(postsCheckedAt, now) ? " (over 24h old)" : ""}</p><p>No automatic updates. All times Eastern.</p><SourceDetails snapshot={snapshot} /></div>
      </div>
      <details className="marketing-accounts" aria-label="Connected accounts"><summary><span>{brand?.accounts.length || 0} accounts linked in Metricool</span>{accountAttention ? <strong>TikTok needs attention</strong> : <span>{queueChecked ? "Account details" : "Queues not checked"}</span>}</summary>
        <div className="marketing-section-heading"><h2>{brand?.name || "Accounts"}</h2><span className="marketing-source-note">Accounts checked {when(snapshot.checked_at_utc)}</span></div>
        <div className="marketing-account-strip">{brand?.accounts.map((a) => <div key={a.platform} className={`marketing-account ${a.connection_status.includes("attention") || (a.platform === "tiktok" && a.handle === "adminlwcbg5") ? "needs-attention" : ""}`}>
          <strong>{platform(a.platform)}</strong><span>{/^\d+$|^urn:|^UC/.test(a.handle) ? "Listed in Metricool" : `@${a.handle}`}</span>
          <small>{a.connection_status.includes("attention") || (a.platform === "tiktok" && a.handle === "adminlwcbg5") ? "Needs attention: profile handle" : "Connected in Metricool"}</small>
          <small className="marketing-account-queue">{!queueChecked ? "Queue not checked" : (() => { const count = posts.filter((p) => p.providers.some((v) => v.platform === a.platform) && postStatus(p, now) === "scheduled").length; return count ? `${count} scheduled in checked dates` : "No upcoming records in checked dates"; })()}</small>
          {safeMediaUrl(a.profile_url) ? <a href={safeMediaUrl(a.profile_url)} target="_blank" rel="noreferrer">Open profile</a> : null}
        </div>)}</div>
        <p className="marketing-source-note">Connections are reported by Metricool; account access and public activity are separate checks.</p>
      </details>
      {campaigns.length ? <section className="marketing-paid" aria-label="Paid campaigns">{campaigns.map((campaign) => <PaidCard key={campaign.id} campaign={campaign} checkedAt={paid!.checked_at_utc} />)}</section> : null}
      {!queueChecked ? <section className="marketing-unavailable"><h2>Posts not checked yet</h2><p>These accounts are connected. Their queues and recent public activity are not included in this source check.</p></section> : <>
        <section className="marketing-board" aria-label="Organic posts">
          <div className="marketing-section-heading"><h2>Social posts</h2><div className="marketing-view-switch" aria-label="Post layout"><button aria-pressed={view === "gallery"} onClick={() => setView("gallery")}>Gallery</button><button aria-pressed={view === "week"} onClick={() => setView("week")}>By week</button></div></div>
          <div className="marketing-status-filters" aria-label="Filter post status"><button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All <span>{posts.length}</span></button>{ORDER.map((status) => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status === "attention" ? "Needs attention" : STATUS[status]} <span>{posts.filter((p) => postStatus(p, now) === status).length}</span></button>)}</div>
          {visible.length === 0 ? <p className="marketing-empty">No records with this status in the checked date range.</p> : view === "gallery" ? <div className="marketing-post-grid">{visible.map((post) => <PostCard key={post.id} post={post} now={now} />)}</div> : Array.from(groups).map(([day, items], i, entries) => <section className="marketing-day" key={day}>
            {i === 0 || weekOf(entries[i - 1][0]) !== weekOf(day) ? <h3 className="marketing-week">Week of {dayLabel(weekOf(day)).replace("Monday, ", "")}</h3> : null}
            <h4 className="marketing-day-heading">{dayLabel(day)} <span>{items.length} post{items.length === 1 ? "" : "s"}</span></h4>
            <div className="marketing-post-grid">{items.map((post) => <PostCard key={post.id} post={post} now={now} />)}</div>
          </section>)}
          <p className="marketing-source-note">Checked range: {snapshot.source_completeness?.queue_local_date_start} to {snapshot.source_completeness?.queue_local_date_end}. Other dates have not been checked.</p>
        </section>
      </>}
    </>}
    {!paid ? <p className="marketing-empty">Updated paid campaign source check is not available yet.</p> : null}
  </div>;
}
