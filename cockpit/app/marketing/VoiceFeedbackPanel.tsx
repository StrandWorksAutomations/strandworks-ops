"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { MarketingBrand, MarketingPost } from "@/lib/marketing";
import type { VoiceFeedback, VoiceFlag, VoiceMutation, VoiceScope, VoiceStore } from "@/lib/marketing-voice";

const FLAGS: { value: VoiceFlag; label: string }[] = [
  { value: "ai_sounding", label: "AI-sounding" },
  { value: "too_salesy", label: "Too salesy" },
  { value: "too_wordy", label: "Too wordy" },
  { value: "keep_style", label: "Keep this style" },
];
type FeedbackDraft = {
  id?: string; brand_id: string; post_id: string; original_text: string;
  scope: VoiceScope; flags: VoiceFlag[]; rewrite: string; note: string;
};
type RuleDraft = { id?: string; scope: VoiceScope; text: string };
type VoiceReply = { ok?: boolean; store?: VoiceStore; error?: string; code?: string; mode?: string };
type Tab = "correction" | "examples" | "rules";

function newDraft(post: MarketingPost): FeedbackDraft {
  return { brand_id: post.brand_id, post_id: post.id, original_text: post.text, scope: "brand", flags: [], rewrite: "", note: "" };
}
function savedDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";
}
function messageFor(status: number, reply: VoiceReply): string {
  if (status === 401) return "Your dashboard session ended. Sign in again, then reload the saved guidance. Your edits remain here.";
  if (status === 409) return reply.error || "The writing guidance changed elsewhere. Reload it before saving. Your edits remain here.";
  return reply.error || "The writing guidance could not be saved. Your edits remain here.";
}
function sameFeedback(item: VoiceFeedback, draft: FeedbackDraft): boolean {
  return item.active && item.brand_id === draft.brand_id && item.post_id === draft.post_id && item.scope === draft.scope &&
    item.original_text === draft.original_text && item.rewrite === draft.rewrite && item.note === draft.note &&
    [...item.flags].sort().join(",") === [...draft.flags].sort().join(",");
}
function feedbackKey(viewBrandId: string, draft: FeedbackDraft): string {
  return `${viewBrandId}:${draft.brand_id}:${draft.post_id}`;
}

export function VoiceFeedbackPanel({ open, brandId, brands, post, onClose }: {
  open: boolean; brandId: string; brands: MarketingBrand[]; post: MarketingPost | null; onClose: () => void;
}) {
  const [store, setStore] = useState<VoiceStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mustReload, setMustReload] = useState(false);
  const [tab, setTab] = useState<Tab>("examples");
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft>({ scope: "brand", text: "" });
  const [draftBrandId, setDraftBrandId] = useState(brandId);
  const [showInactive, setShowInactive] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const ruleEditorRef = useRef<HTMLFormElement>(null);
  const lastTarget = useRef("");
  const feedbackCache = useRef(new Map<string, FeedbackDraft>());
  const ruleCache = useRef(new Map<string, RuleDraft>());
  const latestDrafts = useRef({ brandId: draftBrandId, feedback: feedbackDraft, rule: ruleDraft });
  useEffect(() => { latestDrafts.current = { brandId: draftBrandId, feedback: feedbackDraft, rule: ruleDraft }; }, [draftBrandId, feedbackDraft, ruleDraft]);
  const brandName = brands.find((brand) => brand.id === brandId)?.name || "This brand";
  const nameFor = (id: string) => brands.find((brand) => brand.id === id)?.name || "Source brand";

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/marketing/voice?brand_id=${encodeURIComponent(brandId)}`, { cache: "no-store", credentials: "same-origin", signal });
      const reply = await response.json() as VoiceReply;
      if (signal?.aborted) return;
      if (!response.ok || !reply.ok || !reply.store) throw new Error(messageFor(response.status, reply));
      setStore(reply.store); setMustReload(false);
      // A lost network response must not turn an already-saved correction into a duplicate.
      setFeedbackDraft((draft) => {
        if (!draft || draft.id) return draft;
        const existing = reply.store!.feedback.find((item) => sameFeedback(item, draft));
        return existing ? { ...draft, id: existing.id } : draft;
      });
      const draftContext = latestDrafts.current;
      if (draftContext.brandId === brandId && !draftContext.rule.id && draftContext.rule.text.trim()) {
        const pendingRule = draftContext.rule;
        const existing = reply.store.rules.find((item) => item.active && item.scope === pendingRule.scope &&
          item.brand_id === (pendingRule.scope === "shared" ? null : brandId) && item.text === pendingRule.text);
        if (existing) {
          setRuleDraft((current) => !current.id && current.scope === pendingRule.scope && current.text === pendingRule.text ? { ...current, id: existing.id } : current);
          setMessage("This writing rule is already saved. Further changes will update it.");
        }
      }
    } catch (reason) {
      if (signal?.aborted) return;
      setStore(null); setError(reason instanceof Error ? reason.message : "Writing guidance is unavailable. Your edits remain here.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [brandId]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const target = `${brandId}:${post?.id || "guide"}`;
    if (target !== lastTarget.current) {
      if (feedbackDraft) feedbackCache.current.set(feedbackKey(draftBrandId, feedbackDraft), feedbackDraft);
      ruleCache.current.set(draftBrandId, ruleDraft);
      if (post) {
        const fresh = newDraft(post);
        setFeedbackDraft(feedbackCache.current.get(feedbackKey(brandId, fresh)) || fresh);
        setTab("correction");
      } else { setFeedbackDraft(null); setTab("examples"); }
      setDraftBrandId(brandId);
      setError(""); setMessage(""); setRuleDraft(ruleCache.current.get(brandId) || { scope: "brand", text: "" });
      lastTarget.current = target;
    } else if (post) {
      setFeedbackDraft((draft) => draft || newDraft(post));
      setTab("correction");
    }
    // Drafts are captured only when the owner changes brand/source, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, brandId, post]);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),summary,[tabindex='0']");
      const focusable = Array.from(items || []).filter((item) => item.getClientRects().length > 0);
      if (!focusable.length) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === focusable[0] || document.activeElement === panelRef.current)) {
        event.preventDefault(); focusable.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault(); focusable[0].focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = oldOverflow; before?.focus(); };
  }, [open, onClose, saving]);

  function changeTab(next: Tab) {
    setTab(next);
    requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0 }));
  }

  async function mutate(change: Omit<VoiceMutation, "expected_revision">): Promise<boolean> {
    if (!store || saving || loading || mustReload) return false;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/marketing/voice?brand_id=${encodeURIComponent(brandId)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ ...change, expected_revision: store.revision }),
      });
      const reply = await response.json() as VoiceReply;
      if (!response.ok || !reply.ok || !reply.store) {
        if (response.status === 409 || response.status === 401 || response.status >= 500) setMustReload(true);
        throw new Error(messageFor(response.status, reply));
      }
      setStore(reply.store);
      setMessage(reply.mode === "dry-run" ? "Saved in this preview only." : "Saved for future drafts.");
      return true;
    } catch (reason) {
      if (reason instanceof TypeError || reason instanceof SyntaxError) setMustReload(true);
      setError(reason instanceof Error ? reason.message : "The save could not be confirmed. Your edits remain here.");
      return false;
    } finally { setSaving(false); }
  }

  function toggleFlag(flag: VoiceFlag) {
    setFeedbackDraft((draft) => {
      if (!draft) return draft;
      if (draft.flags.includes(flag)) return { ...draft, flags: draft.flags.filter((value) => value !== flag) };
      return { ...draft, flags: flag === "keep_style" ? [flag] : [...draft.flags.filter((value) => value !== "keep_style"), flag] };
    });
  }
  async function saveFeedback(event: FormEvent) {
    event.preventDefault();
    if (!feedbackDraft || draftBrandId !== brandId) return;
    if (!feedbackDraft.flags.length && !feedbackDraft.note.trim() && !feedbackDraft.rewrite.trim()) {
      setError("Choose a flag, add a note, or write how you would say it."); return;
    }
    if (feedbackDraft.rewrite.trim() && feedbackDraft.rewrite.trim() === feedbackDraft.original_text.trim() && !feedbackDraft.flags.includes("keep_style")) {
      setError("Change the copied wording, or clear the rewrite. Choose Keep this style only if you want the original used as a good example."); return;
    }
    const saved = await mutate({ action: "save_feedback", ...feedbackDraft, shared_confirmed: feedbackDraft.scope === "shared" });
    if (saved) { feedbackCache.current.delete(feedbackKey(draftBrandId, feedbackDraft)); setFeedbackDraft(null); changeTab("examples"); }
  }
  async function saveRule(event: FormEvent) {
    event.preventDefault();
    if (draftBrandId !== brandId) return;
    if (!ruleDraft.text.trim()) { setError("Enter one writing rule."); return; }
    const saved = await mutate({ action: "save_rule", ...ruleDraft, brand_id: ruleDraft.scope === "shared" ? null : brandId, shared_confirmed: ruleDraft.scope === "shared" });
    if (saved) { ruleCache.current.delete(brandId); setRuleDraft({ scope: "brand", text: "" }); }
  }
  function editFeedback(item: VoiceFeedback) {
    if (feedbackDraft) feedbackCache.current.set(feedbackKey(draftBrandId, feedbackDraft), feedbackDraft);
    setFeedbackDraft({ id: item.id, brand_id: item.brand_id, post_id: item.post_id, original_text: item.original_text, scope: item.scope, flags: [...item.flags], rewrite: item.rewrite, note: item.note });
    changeTab("correction"); setError(""); setMessage("");
  }

  if (!open) return null;
  const contextReady = draftBrandId === brandId;
  const usable = !!store && contextReady && !saving && !loading && !mustReload;
  const relevant = (item: { scope: VoiceScope; brand_id: string | null }) => item.scope === "shared" || item.brand_id === brandId;
  const examples = (store?.feedback || []).filter(relevant).filter((item) => showInactive || item.active).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const rules = (store?.rules || []).filter(relevant).filter((item) => showInactive || item.active);
  const hasInactive = [...(store?.rules || []), ...(store?.feedback || [])].some((item) => relevant(item) && !item.active);

  return <div className="voice-backdrop">
    <section className="voice-panel" role="dialog" aria-modal="true" aria-labelledby="voice-panel-title" tabIndex={-1} ref={panelRef}>
      <header className="voice-panel-header"><div><h2 id="voice-panel-title">Writing voice</h2><p>{brandName}</p></div><button type="button" className="voice-close" onClick={onClose} disabled={saving} aria-label="Close writing voice">Close</button></header>
      <div className="voice-panel-body" ref={bodyRef}>
        <p className="voice-purpose">Save corrections for future drafts. Scheduled and published posts stay unchanged.</p>
        <div className="voice-tabs" role="tablist" aria-label="Writing voice sections">
          {contextReady && feedbackDraft ? <button type="button" role="tab" aria-selected={tab === "correction"} onClick={() => changeTab("correction")}>This wording</button> : null}
          <button type="button" role="tab" aria-selected={tab === "examples"} onClick={() => changeTab("examples")}>Saved examples</button>
          <button type="button" role="tab" aria-selected={tab === "rules"} onClick={() => changeTab("rules")}>Writing rules</button>
        </div>
        {loading ? <p role="status" className="voice-notice">Loading saved guidance…</p> : null}
        {error ? <div className="voice-error" role="alert"><p>{error}</p><button type="button" onClick={() => void load()} disabled={saving || loading}>Reload saved guidance</button></div> : null}
        {message ? <p className="voice-success" role="status">{message}</p> : null}

        {tab === "correction" && contextReady && feedbackDraft ? <form className="voice-editor" onSubmit={saveFeedback}>
          <div className="voice-editor-heading"><h3>{feedbackDraft.id ? "Edit saved feedback" : "Improve this wording"}</h3><span>{nameFor(feedbackDraft.brand_id)}</span></div>
          <details className="voice-original"><summary>Original caption</summary><p>{feedbackDraft.original_text}</p></details>
          <fieldset className="voice-flag-fieldset"><legend>What should change?</legend><div className="voice-flags">{FLAGS.map((flag) => <button type="button" key={flag.value} aria-pressed={feedbackDraft.flags.includes(flag.value)} onClick={() => toggleFlag(flag.value)} disabled={saving}>{flag.label}</button>)}</div></fieldset>
          <label className="voice-field">{feedbackDraft.flags.includes("keep_style") ? "What should stay?" : "What sounds off?"} <span>Optional</span><textarea rows={2} maxLength={4000} value={feedbackDraft.note} onChange={(event) => setFeedbackDraft({ ...feedbackDraft, note: event.target.value })} disabled={saving} placeholder={feedbackDraft.flags.includes("keep_style") ? "What makes this sound right?" : "A phrase to avoid, or what you want changed."} /></label>
          <label className="voice-field">How I’d say it <span>Optional preferred wording</span><textarea rows={5} maxLength={12000} value={feedbackDraft.rewrite} onChange={(event) => setFeedbackDraft({ ...feedbackDraft, rewrite: event.target.value })} disabled={saving} placeholder="Write it in your own words." /></label>
          {!feedbackDraft.rewrite.trim() ? <button type="button" className="voice-text-button" onClick={() => setFeedbackDraft({ ...feedbackDraft, rewrite: feedbackDraft.original_text })} disabled={saving}>Copy caption to edit</button> : null}
          <label className="voice-field voice-scope">Use this feedback for<select value={feedbackDraft.scope} onChange={(event) => setFeedbackDraft({ ...feedbackDraft, scope: event.target.value as VoiceScope })} disabled={saving}><option value="brand">{nameFor(feedbackDraft.brand_id)} only</option><option value="shared">All brands</option></select></label>
          {feedbackDraft.scope === "shared" ? <p className="voice-scope-note">This example will guide writing across all brands.</p> : null}
          <div className="voice-form-actions"><button type="submit" className="voice-primary" disabled={!usable}>{saving ? "Saving…" : "Save feedback"}</button><button type="button" onClick={() => { feedbackCache.current.delete(feedbackKey(draftBrandId, feedbackDraft)); setFeedbackDraft(null); changeTab("examples"); }} disabled={saving}>Cancel correction</button></div>
        </form> : null}

        {tab === "examples" ? <div className="voice-examples">
          <div className="voice-section-heading"><h3>Saved examples</h3>{post ? <button type="button" className="voice-text-button" onClick={() => { setFeedbackDraft(newDraft(post)); changeTab("correction"); setMessage(""); }}>Add a correction for this post</button> : null}</div>
          {store && !examples.length ? <p className="voice-empty">{store.feedback.some(relevant) ? "No examples in use. Show stopped items to restore one." : "No examples saved here yet. Open a post and choose Improve wording."}</p> : null}
          {examples.map((item) => <details className={`voice-example ${item.active ? "" : "inactive"}`} key={item.id}>
            <summary><span className="voice-example-scope">{item.scope === "shared" ? "All brands" : nameFor(item.brand_id)}{!item.active ? " / Not in use" : ""}</span><span className="voice-example-title">{item.rewrite || item.note || (item.flags.includes("keep_style") ? item.original_text : "Wording to avoid")}</span><span className="voice-example-flags">{item.flags.map((flag) => FLAGS.find((f) => f.value === flag)?.label).join(" / ")}</span></summary>
            <div className="voice-example-content"><div className="voice-before-after"><div><h4>Original</h4><p>{item.original_text}</p></div>{item.rewrite ? <div><h4>Preferred wording</h4><p>{item.rewrite}</p></div> : null}</div>
              {item.note ? <p className="voice-example-note">{item.note}</p> : null}<p className="voice-saved-date">Saved {savedDate(item.updated_at)}</p>
              <div className="voice-form-actions"><button type="button" onClick={() => editFeedback(item)} disabled={!usable}>Edit feedback</button><button type="button" onClick={() => void mutate({ action: "set_feedback_active", id: item.id, active: !item.active, shared_confirmed: item.scope === "shared" })} disabled={!usable}>{item.active ? "Stop using this example" : "Restore example"}</button></div>
            </div>
          </details>)}
        </div> : null}

        {tab === "rules" && contextReady ? <div className="voice-rules">
          <h3>Writing rules</h3><p className="voice-help">Shared rules apply to all brands. Add brand-specific direction below.</p>
          <ul className="voice-rule-list">{rules.map((rule) => <li key={rule.id} className={rule.active ? "" : "inactive"}><span className="voice-example-scope">{rule.scope === "shared" ? "All brands" : brandName}{!rule.active ? " / Not in use" : ""}</span><p>{rule.text}</p><div className="voice-rule-actions"><button type="button" className="voice-text-button" onClick={() => { setRuleDraft({ id: rule.id, scope: rule.scope, text: rule.text }); setMessage(""); requestAnimationFrame(() => { ruleEditorRef.current?.scrollIntoView({ block: "start" }); ruleEditorRef.current?.querySelector("textarea")?.focus(); }); }} disabled={!usable}>Edit rule</button><button type="button" className="voice-text-button" onClick={() => void mutate({ action: "set_rule_active", id: rule.id, active: !rule.active, shared_confirmed: rule.scope === "shared" })} disabled={!usable}>{rule.active ? "Stop using this rule" : "Restore rule"}</button></div></li>)}</ul>
          {store && !rules.length ? <p className="voice-empty">No writing rules saved for this view.</p> : null}
          <form className="voice-editor voice-rule-editor" onSubmit={saveRule} ref={ruleEditorRef}><label className="voice-field">{ruleDraft.id ? "Edit writing rule" : "Add one writing rule"}<textarea rows={3} maxLength={2000} value={ruleDraft.text} onChange={(event) => { setRuleDraft({ ...ruleDraft, text: event.target.value }); setMessage(""); }} disabled={saving} placeholder="For example: say what the feature does, then stop." /></label>
            <label className="voice-field voice-scope">Use this rule for<select value={ruleDraft.scope} onChange={(event) => setRuleDraft({ ...ruleDraft, scope: event.target.value as VoiceScope })} disabled={saving}><option value="brand">{brandName} only</option><option value="shared">All brands</option></select></label>
            <div className="voice-form-actions"><button type="submit" className="voice-primary" disabled={!usable}>{saving ? "Saving…" : "Save rule"}</button>{ruleDraft.id ? <button type="button" onClick={() => setRuleDraft({ scope: "brand", text: "" })} disabled={saving}>Cancel rule edit</button> : null}</div>
          </form>
        </div> : null}

        {store && tab !== "correction" && hasInactive ? <label className="voice-show-inactive"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Show stopped examples and rules</label> : null}
        {store ? <p className="voice-updated">Guidance revision {store.revision}. Last saved {savedDate(store.updated_at)}</p> : null}
      </div>
    </section>
  </div>;
}
