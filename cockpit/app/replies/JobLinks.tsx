"use client";

import { useRef, useState } from "react";
import { safeLinks, type KcJobDetail, type KcJobLink, type KcReply } from "@/lib/kc-replies";
import { containsReplyLink, httpsUrl, shortenReplyLink, sourceIdForLink, toggleReplyLink } from "@/lib/reply-link-editor";

type DraftControls = { draft: string; onDraftChange: (draft: string) => void; disabled?: boolean; group?: boolean };
type JobState = { state: "current" | "closed" | "unavailable"; job?: KcJobDetail };

function displayDate(value?: string) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }) : "";
}

function Details({ job }: { job: KcJobDetail }) {
  const fields = [
    { label: "Employer", value: job.employer }, { label: "Location", value: job.location },
    { label: "Pay", value: job.pay }, { label: "Employment", value: job.employment_type }, ...(Array.isArray(job.details) ? job.details : []),
  ].filter(d => typeof d?.label === "string" && typeof d.value === "string" && d.value);
  const source = httpsUrl(job.source_url);
  return <>
    <strong>{job.title}</strong>
    <dl className="reply-job-facts">{fields.map((d, i) => <div key={i}><dt>{d.label}</dt><dd>{d.value}</dd></div>)}</dl>
    {source && <a href={source.href} target="_blank" rel="noopener noreferrer nofollow">Employer posting ↗</a>}
  </>;
}

function LinkRow({ link, controls, onToggle }: { link: KcJobLink; controls?: DraftControls; onToggle: (link: KcJobLink) => void }) {
  const sourceId = sourceIdForLink(link.url);
  const cached = sourceId && link.job?.source_id === sourceId && typeof link.job.title === "string" ? link.job : undefined;
  const [live, setLive] = useState<JobState | null>(null);
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const job = live?.job ?? cached;
  const state = live?.state ?? link.job_state;
  const closed = state === "closed";
  const included = !!controls && containsReplyLink(controls.draft, link);
  const shortened = included && controls ? shortenReplyLink(controls.draft, link) : null;
  async function load() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/replies/job?" + new URLSearchParams({ url: link.url }), { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json() as JobState;
      if (data.state !== "closed" && (data.state !== "current" || data.job?.source_id !== sourceId)) throw new Error();
      setLive(data);
    } catch { setLive({ state: "unavailable" }); }
    finally { pending.current = false; setLoading(false); }
  }
  const actionLabel = included ? "Remove" : "Add";
  const checked = live?.job?.checked_at ?? link.job_checked_at ?? (job?.snapshot_source === "match" ? undefined : job?.checked_at);
  const saved = job?.snapshot_source === "match" ? job.checked_at : !job && closed ? link.match_recorded_at : undefined;
  return <li>
    <div className="reply-link-line">
      {controls && <button type="button" className="reply-link-toggle" aria-pressed={included}
        aria-label={`${actionLabel} ${link.label} ${included ? "from" : "to"} reply`}
        title={included ? "Remove from reply" : "Add to reply"}
        disabled={controls.disabled} onClick={() => onToggle(link)}>{included ? "−" : "+"}</button>}
      <a href={link.url} target="_blank" rel="noopener noreferrer nofollow">{link.label} ↗</a>
      {controls && shortened !== null && shortened !== controls.draft && <button type="button" className="chip"
        disabled={controls.disabled} aria-label={`Shorten ${link.label} in reply`} onClick={() => controls.onDraftChange(shortened)}>Shorten</button>}
    </div>
    {sourceId && <details className="reply-job-detail" onToggle={e => {
      if (e.currentTarget.open && !live && !closed && (!cached || state === "unavailable")) void load();
    }}>
      <summary>Job details{closed ? " · closed" : ""}</summary>
      {loading && <p className="meta" role="status">Loading job details…</p>}
      {closed && <p className="meta">This job is no longer listed on Kinetic Clinician.</p>}
      {!loading && state === "unavailable" && <p className="meta">Current listing unavailable. <button type="button" className="chip" onClick={load}>Retry</button></p>}
      {saved && <p className="meta">Saved match{displayDate(saved) ? `, ${displayDate(saved)}` : ""}.</p>}
      {job && <Details job={job} />}
      {displayDate(checked) && <p className="meta">Last listing check {displayDate(checked)}.</p>}
    </details>}
  </li>;
}

export function JobLinks({ reply, controls }: { reply: Pick<KcReply, "job_links">; controls?: DraftControls }) {
  const autoDisclosure = useRef(false);
  const [status, setStatus] = useState("");
  const links = [...new Map(safeLinks(reply.job_links).filter(l => httpsUrl(l.url)).map(l => [l.url, l])).values()];
  if (!links.length) return null;
  function toggle(link: KcJobLink) {
    if (!controls || controls.disabled) return;
    const wasIncluded = containsReplyLink(controls.draft, link);
    const result = toggleReplyLink(controls.draft, link, !!controls.group, autoDisclosure.current);
    if (result.error) { setStatus(result.error); return; }
    setStatus(wasIncluded ? "Link removed from the reply." : result.autoDisclosure && !autoDisclosure.current ? "Link and Kinetic Clinician disclosure added to the reply." : "Link added to the reply.");
    autoDisclosure.current = result.autoDisclosure;
    controls.onDraftChange(result.draft);
  }
  return <div className="reply-jobs">
    <div className="meta">{controls ? "Links for this reply" : "Source links (not part of the reply)"}</div>
    <ul>{links.map(link => <LinkRow key={link.url} link={link} controls={controls} onToggle={toggle} />)}</ul>
    {status && <span className="meta" role="status">{status}</span>}
  </div>;
}
