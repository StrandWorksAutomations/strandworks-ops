"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Browser-safe public DTOs: do not import the server ledger into this bundle.
export type InboxAnswer = {
  responseId: string; ref: string; title: string; optionKey: string | null;
  optionLabel: string | null; text: string | null; createdAt: string;
};
export type InboxBatch = {
  id: string; project: string; responseIds: string[]; createdAt: string;
  status: "pending" | "claimed" | "launched" | "completed" | "needs_attention" | "failed" | "ambiguous" | "blocked";
  claimedAt: string | null; finishedAt: string | null; threadId: string | null; note: string | null;
  usage?: { input_tokens: number; cached_input_tokens: number; output_tokens: number } | null;
};
export type ManualInboxData = { projects: { project: string; answers: InboxAnswer[] }[]; batches: InboxBatch[] };
export type BatchSelection = { project: string | null; responseIds: string[] };
const EMPTY_SELECTION: BatchSelection = { project: null, responseIds: [] };

export function toggleBatchAnswer(selection: BatchSelection, project: string, responseId: string): BatchSelection {
  if (selection.project === project && selection.responseIds.includes(responseId)) {
    const responseIds = selection.responseIds.filter(id => id !== responseId);
    return { project: responseIds.length ? project : null, responseIds };
  }
  if ((selection.project !== null && selection.project !== project) || selection.responseIds.length >= 3) return selection;
  return { project, responseIds: [...selection.responseIds, responseId] };
}

function keepEligibleSelection(selection: BatchSelection, data: ManualInboxData): BatchSelection {
  const answers = data.projects.find(group => group.project === selection.project)?.answers ?? [];
  const responseIds = selection.responseIds.filter(id => answers.some(answer => answer.responseId === id));
  return { project: responseIds.length ? selection.project : null, responseIds };
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function date(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function nullableText(value: unknown): boolean { return value === null || typeof value === "string"; }
function nullableDate(value: unknown): boolean { return value === null || date(value); }
function validBatch(value: unknown): value is InboxBatch {
  if (!record(value) || typeof value.id !== "string" || typeof value.project !== "string"
    || !Array.isArray(value.responseIds) || !value.responseIds.every(id => typeof id === "string")
    || !date(value.createdAt) || !["pending", "claimed", "launched", "completed", "needs_attention", "failed", "ambiguous", "blocked"].includes(String(value.status))
    || !nullableDate(value.claimedAt) || !nullableDate(value.finishedAt) || !nullableText(value.threadId) || !nullableText(value.note)) return false;
  return value.usage === undefined || value.usage === null || (record(value.usage)
    && [value.usage.input_tokens, value.usage.cached_input_tokens, value.usage.output_tokens].every(count => Number.isSafeInteger(count) && Number(count) >= 0));
}
function validAnswer(value: unknown): value is InboxAnswer {
  return record(value) && typeof value.responseId === "string" && typeof value.ref === "string" && typeof value.title === "string"
    && nullableText(value.optionKey) && nullableText(value.optionLabel) && nullableText(value.text) && date(value.createdAt);
}

export async function fetchManualInbox(signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<ManualInboxData> {
  const response = await fetchImpl("/api/loop/batches", { method: "GET", cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok) throw new Error(response.status === 401 ? "Sign in again to load your agent inbox." : "Agent inbox unavailable. Refresh to try again.");
  const data: unknown = await response.json();
  if (!record(data) || !Array.isArray(data.projects) || !data.projects.every(group => record(group) && typeof group.project === "string"
    && Array.isArray(group.answers) && group.answers.every(validAnswer)) || !Array.isArray(data.batches) || !data.batches.every(validBatch)) {
    throw new Error("Agent inbox returned incomplete data. Refresh to try again.");
  }
  return data as ManualInboxData;
}

export async function launchManualBatch(selection: BatchSelection, signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<InboxBatch> {
  if (!selection.project || selection.responseIds.length < 1 || selection.responseIds.length > 3 || new Set(selection.responseIds).size !== selection.responseIds.length) {
    throw new Error("Choose one to three answers from one project.");
  }
  const response = await fetchImpl("/api/loop/batches", {
    method: "POST", cache: "no-store", credentials: "same-origin", signal,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project: selection.project, responseIds: selection.responseIds }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Sign in again, then refresh before launching.");
    if (response.status === 409) throw new Error("An answer changed or was already chosen. Refresh before launching again.");
    throw new Error("Could not confirm the launch. Refresh batches before trying again.");
  }
  const data: unknown = await response.json();
  if (!record(data) || !validBatch(data.batch) || data.batch.project !== selection.project
    || data.batch.responseIds.length !== selection.responseIds.length || !data.batch.responseIds.every(id => selection.responseIds.includes(id))) {
    throw new Error("Could not confirm the launch. Refresh batches before trying again.");
  }
  return data.batch;
}

export function batchPresentation(status: InboxBatch["status"]): { label: string; detail: string; tone: string } {
  switch (status) {
    case "pending": return { label: "Queued", detail: "Waiting for this PC to start a fresh Codex chat.", tone: "queued" };
    case "claimed": return { label: "Running", detail: "This PC is preparing the Codex launch. Work is not confirmed complete.", tone: "running" };
    case "launched": return { label: "Running", detail: "A fresh Codex chat started. Waiting for a recorded completion.", tone: "running" };
    case "completed": return { label: "Completed", detail: "Completion was explicitly recorded.", tone: "completed" };
    default: return { label: "Needs attention", detail: "Review the recorded details before starting another batch.", tone: "attention" };
  }
}

function savedTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(value)) + " ET";
}

function BatchActivity({ batches }: { batches: InboxBatch[] }) {
  return <section className="manual-batch-activity" aria-labelledby="batch-activity-title">
    <div className="section-head"><h2 id="batch-activity-title">Batch activity</h2><span className="meta">Recorded status</span></div>
    <p className="meta">A launch is the start of work. Only an explicit completion report marks a batch completed.</p>
    {!batches.length ? <p className="card meta">No batches launched yet. Your first batch will appear here after you choose answers and launch it.</p> : <ul className="manual-batch-list">
      {batches.map(batch => {
        const presentation = batchPresentation(batch.status);
        return <li className={`card manual-batch-job manual-batch-${presentation.tone}`} key={batch.id}>
          <div className="manual-batch-job-heading"><h3>{batch.project}</h3><span className="manual-batch-status">{presentation.label}</span></div>
          <p className="meta">{batch.responseIds.length} {batch.responseIds.length === 1 ? "answer" : "answers"} · Requested <time dateTime={batch.createdAt}>{savedTime(batch.createdAt)}</time></p>
          <p>{presentation.detail}</p>
          {batch.note ? <p className="manual-batch-note">{batch.note}</p> : null}
          {batch.threadId ? <p className="meta">Codex chat recorded · <span className="mono">{batch.threadId}</span></p> : null}
          {batch.usage ? <dl className="manual-batch-usage" aria-label="Recorded token usage">
            <div><dt>Input tokens</dt><dd>{batch.usage.input_tokens.toLocaleString("en-US")}</dd></div>
            <div><dt>Cached input tokens</dt><dd>{batch.usage.cached_input_tokens.toLocaleString("en-US")}</dd></div>
            <div><dt>Output tokens</dt><dd>{batch.usage.output_tokens.toLocaleString("en-US")}</dd></div>
          </dl> : <p className="meta">Token usage has not been recorded.</p>}
        </li>;
      })}
    </ul>}
  </section>;
}

export function ManualBatchInbox({ initialData }: { initialData?: ManualInboxData }) {
  const [data, setData] = useState<ManualInboxData | null>(initialData ?? null);
  const [selection, setSelection] = useState<BatchSelection>(EMPTY_SELECTION);
  const [loading, setLoading] = useState(!initialData);
  const [launching, setLaunching] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mustRefresh, setMustRefresh] = useState(false);
  const launchInFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let active = true;
    setLoading(true);
    void fetchManualInbox(controller.signal).then(next => {
      if (!active) return;
      setData(next);
      setSelection(current => keepEligibleSelection(current, next));
      setMustRefresh(false);
      setError("");
    }).catch(cause => {
      if (active) setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "Agent inbox took too long to load. Refresh to try again.");
    }).finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [refreshVersion]);

  async function launch() {
    if (launchInFlight.current || !data || loading || mustRefresh || !selection.responseIds.length) return;
    launchInFlight.current = true;
    setLaunching(true); setError(""); setNotice("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const batch = await launchManualBatch(selection, controller.signal);
      setData(current => current ? {
        projects: current.projects.map(group => ({ ...group, answers: group.answers.filter(answer => !batch.responseIds.includes(answer.responseId)) })).filter(group => group.answers.length),
        batches: [batch, ...current.batches.filter(existing => existing.id !== batch.id)],
      } : current);
      setSelection(EMPTY_SELECTION);
      setNotice(`Batch recorded for ${batch.project}. ${batchPresentation(batch.status).detail}`);
    } catch (cause) {
      setMustRefresh(true);
      setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "Could not confirm the launch. Refresh batches before trying again.");
    } finally {
      clearTimeout(timeout); launchInFlight.current = false; setLaunching(false);
    }
  }

  const selectedCount = selection.responseIds.length;
  const groups = data?.projects.filter(group => group.answers.length) ?? [];
  return <div className="manual-batch-inbox">
    <div className="card manual-batch-intro">
      <h2>You choose when work starts</h2>
      <p>Answers stay saved until you choose them. Select up to 3 answers from one project, then launch them with Codex.</p>
      <p className="meta">Each batch starts a fresh Codex chat with limited context for that project. It does not resume an old chat. No model calls happen automatically.</p>
    </div>
    <div className="section-head manual-batch-refresh">
      <h2 id="saved-answers-title">Saved answers</h2>
      <button type="button" className="header-button" disabled={loading || launching} onClick={() => setRefreshVersion(version => version + 1)}>{loading ? "Refreshing…" : "Refresh"}</button>
    </div>
    <p className="meta">Refresh reads saved answers and batch status. It does not call a model.</p>
    {error ? <p className="card error-text" role="alert">{error}{data ? " Previously loaded answers and statuses may be out of date." : ""}</p> : null}
    {notice ? <p className="card manual-batch-notice" role="status">{notice}</p> : null}
    {!data && loading ? <p className="card meta" role="status">Loading your saved answers…</p> : null}
    {data ? <>
      <section aria-labelledby="saved-answers-title" aria-busy={loading}>
        {!groups.length ? <div className="card manual-batch-empty"><h3>Nothing waiting to launch</h3><p>Your eligible project answers will appear here after you save them in the dashboard. They will wait for you to choose a batch.</p><Link href="/decisions">Open Decide →</Link></div> : <>
          <p id="batch-selection-help" className="meta">Choose up to 3 answers from one project. Clear your selection to switch projects.</p>
          {groups.map(group => <fieldset className="manual-batch-project" key={group.project} disabled={launching || loading || mustRefresh} aria-describedby="batch-selection-help">
            <legend>{group.project} <span className="meta">{group.answers.length} saved</span></legend>
            <ul className="manual-batch-list">{group.answers.map(answer => {
              const checked = selection.project === group.project && selection.responseIds.includes(answer.responseId);
              const blocked = !checked && ((selection.project !== null && selection.project !== group.project) || selectedCount >= 3);
              return <li className={`card manual-batch-answer${checked ? " manual-batch-selected" : ""}`} key={answer.responseId}>
                <div className="manual-batch-answer-heading">
                  <label className="manual-batch-checkbox"><input type="checkbox" checked={checked} disabled={blocked}
                    onChange={() => setSelection(current => toggleBatchAnswer(current, group.project, answer.responseId))} />
                    <span>Select answer for {answer.ref}</span></label>
                  <Link href={`/item/${encodeURIComponent(answer.ref)}`}>{answer.ref} →</Link>
                </div>
                <h3>{answer.title}</h3>
                <p className="meta">Saved <time dateTime={answer.createdAt}>{savedTime(answer.createdAt)}</time></p>
                {answer.optionKey !== null || answer.optionLabel !== null ? <div className="manual-batch-owner-answer"><span className="meta">Your selected option</span><p>{answer.optionKey !== null ? <strong>{answer.optionKey}{answer.optionLabel !== null ? " · " : ""}</strong> : null}{answer.optionLabel}</p></div> : null}
                {answer.text !== null ? <div className="manual-batch-owner-answer"><span className="meta">Your exact answer</span><p>{answer.text}</p></div> : <p className="meta">No written message; your selected option is shown above.</p>}
              </li>;
            })}</ul>
          </fieldset>)}
          <div className="card manual-batch-launch">
            <p role="status" aria-live="polite">{selectedCount ? `${selectedCount} of 3 selected · ${selection.project}` : "No answers selected"}</p>
            <div className="manual-batch-launch-actions">
              <button type="button" className="header-button manual-batch-launch-button" disabled={!selectedCount || launching || loading || mustRefresh} onClick={() => { void launch(); }}>
                {launching ? "Recording launch…" : `Launch ${selectedCount} ${selectedCount === 1 ? "answer" : "answers"} with Codex`}
              </button>
              <button type="button" className="header-button" disabled={!selectedCount || launching} onClick={() => setSelection(EMPTY_SELECTION)}>Clear selection</button>
            </div>
            <p className="meta">Each launched task can spend Codex tokens.</p>
            <p className="meta">Only these selected answers will be sent. Other saved answers keep waiting.</p>
          </div>
        </>}
      </section>
      <BatchActivity batches={data.batches} />
    </> : null}
  </div>;
}
