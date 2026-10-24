"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KC_EMPLOYMENT, KC_ROLES, KC_ROLE_LABEL, type KcDraft, type KcGroup } from "@/lib/kc-share";

async function send(url: string, method: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!res) return "Network error. Try again.";
  if (res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return (json as { error?: string }).error ?? "Could not save. Try again.";
}

// One draft: copy the text, open the group, paste and post by hand, then mark it.
export function DraftCard({ draft, group }: { draft: KcDraft; group: KcGroup | undefined }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
    } catch {
      setError("Copy failed. Select the text and copy it by hand.");
    }
  }

  async function mark(status: "posted" | "skipped") {
    setBusy(true);
    setError(await send("/api/share/draft", "POST", { id: draft.id, status, ...(status === "skipped" && reason.trim() ? { reason: reason.trim() } : {}) }));
    setBusy(false);
    router.refresh();
  }

  return (
    <article className="card share-card">
      <div className="loop-meta">
        <span className="chip">{group?.name ?? draft.group_id}</span>
        <span>{KC_ROLE_LABEL[draft.job_role] ?? draft.job_role}</span>
        {draft.pay_label ? <span className="mono">{draft.pay_label}</span> : null}
      </div>
      <pre className="share-body">{draft.body}</pre>
      <div className="confirm-row">
        <button className="token-btn approve" onClick={copy}>{copied ? "Copied" : "1 · Copy text"}</button>
        {group ? <a className="token-btn" href={group.url} target="_blank" rel="noreferrer">2 · Open group</a> : null}
        <button className="token-btn blessed" disabled={busy} onClick={() => mark("posted")}>3 · I posted it</button>
      </div>
      <p className="meta">Check the link preview loads before you post. <a href={draft.share_url} target="_blank" rel="noreferrer">Open the job page</a></p>
      {skipping ? (
        <div className="confirm-row">
          <input className="answer-input" maxLength={300} placeholder="Why skip? (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="token-btn halt" disabled={busy} onClick={() => mark("skipped")}>Skip</button>
          <button className="token-btn" onClick={() => setSkipping(false)}>cancel</button>
        </div>
      ) : (
        <button className="token-btn" onClick={() => setSkipping(true)}>Skip this one</button>
      )}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

// A group's posting rules. Drafts are only made after Jonathan confirms the
// group's own rules allow job posts, and only for the professions ticked here.
export function GroupCard({ group }: { group: KcGroup }) {
  const router = useRouter();
  const [roles, setRoles] = useState(group.roles);
  const [types, setTypes] = useState(group.employment_types);
  const [regions, setRegions] = useState(group.regions.join(", "));
  const [cap, setCap] = useState(group.weekly_cap);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function patch(p: Record<string, unknown>) {
    setBusy(true);
    setSaved(false);
    const err = await send("/api/share/group", "PATCH", { id: group.id, patch: p });
    setError(err);
    setSaved(!err);
    setBusy(false);
    router.refresh();
  }

  const status = group.allows_job_posts === true ? "Job posts allowed" : group.allows_job_posts === false ? "No job posts" : "Rules not checked";
  return (
    <article className="card share-group">
      <div className="loop-meta">
        <span className={`badge ${group.allows_job_posts === true ? "ok" : "warn"}`}>{status}</span>
        {group.rules_checked_on ? <span>checked {group.rules_checked_on}</span> : null}
        {!group.active ? <span className="badge">paused</span> : null}
      </div>
      <h3><a href={group.url} target="_blank" rel="noreferrer">{group.name}</a></h3>
      {group.rules_note ? <p className="meta">{group.rules_note}</p> : null}
      <p className="meta">Open the group, read its rules (About / Announcements), then answer:</p>
      <div className="confirm-row">
        <button className="token-btn approve" disabled={busy} onClick={() => patch({ allows_job_posts: true })}>Rules allow job posts</button>
        <button className="token-btn halt" disabled={busy} onClick={() => patch({ allows_job_posts: false })}>Not allowed</button>
      </div>
      <fieldset className="share-fieldset">
        <legend>Only post these professions</legend>
        {KC_ROLES.map((r) => (
          <label key={r} className="share-check"><input type="checkbox" checked={roles.includes(r)} onChange={() => setRoles(toggle(roles, r))} /> {KC_ROLE_LABEL[r]}</label>
        ))}
      </fieldset>
      <fieldset className="share-fieldset">
        <legend>Job types (none ticked = any)</legend>
        {KC_EMPLOYMENT.map((t) => (
          <label key={t} className="share-check"><input type="checkbox" checked={types.includes(t)} onChange={() => setTypes(toggle(types, t))} /> {t}</label>
        ))}
      </fieldset>
      <label className="loop-note" htmlFor={`${group.id}-regions`}>States (blank = any), e.g. KY, OH</label>
      <input id={`${group.id}-regions`} className="answer-input" value={regions} onChange={(e) => setRegions(e.target.value)} />
      <label className="loop-note" htmlFor={`${group.id}-cap`}>Most posts per week</label>
      <input id={`${group.id}-cap`} className="answer-input" type="number" min={0} max={7} value={cap} onChange={(e) => setCap(Number(e.target.value))} />
      <div className="confirm-row">
        <button className="token-btn" disabled={busy || roles.length === 0} onClick={() => patch({
          roles, employment_types: types, weekly_cap: cap,
          regions: regions.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
        })}>Save rules</button>
        <button className="token-btn" disabled={busy} onClick={() => patch({ active: !group.active })}>{group.active ? "Pause group" : "Resume group"}</button>
      </div>
      {saved ? <p className="ok-text" role="status">Saved.</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}

export function AddGroupForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    const err = await send("/api/share/group", "POST", { url, name, roles });
    setError(err);
    setBusy(false);
    if (!err) {
      setUrl(""); setName(""); setRoles([]);
      router.refresh();
    }
  }

  return (
    <article className="card share-group">
      <h3>Add a group</h3>
      <label className="loop-note" htmlFor="add-url">Group link</label>
      <input id="add-url" className="answer-input" placeholder="https://www.facebook.com/groups/…" value={url} onChange={(e) => setUrl(e.target.value)} />
      <label className="loop-note" htmlFor="add-name">Group name</label>
      <input id="add-name" className="answer-input" value={name} onChange={(e) => setName(e.target.value)} />
      <fieldset className="share-fieldset">
        <legend>Professions this group is for</legend>
        {KC_ROLES.map((r) => (
          <label key={r} className="share-check"><input type="checkbox" checked={roles.includes(r)} onChange={() => setRoles(toggle(roles, r))} /> {KC_ROLE_LABEL[r]}</label>
        ))}
      </fieldset>
      <button className="token-btn approve" disabled={busy || !url || !name || roles.length === 0} onClick={add}>Add group</button>
      <p className="meta">New groups start as “Rules not checked”; no drafts until you confirm.</p>
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </article>
  );
}
