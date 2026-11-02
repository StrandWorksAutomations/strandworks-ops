import { describe, expect, it } from "vitest";
import { applyVoiceMutation, compileVoicePrompt, parseVoiceMutation, parseVoiceStore } from "../src/lib/marketing-voice";
import { AT, emptyVoice, FEEDBACK, ORIGINAL, SOURCE } from "./marketing-voice-fixtures";
const context = { at: AT, newId: "feedback-1", brandIds: [SOURCE.brand_id], source: SOURCE };

describe("owner writing voice", () => {
  it("stores the owner correction with immutable provenance and an audit revision", () => {
    const initial = emptyVoice();
    const changed = applyVoiceMutation(initial, parseVoiceMutation(FEEDBACK), context);
    expect(initial.revision).toBe(0);
    expect(changed.revision).toBe(1);
    expect(changed.feedback[0]).toMatchObject({ original_text: ORIGINAL, original_sha256: SOURCE.original_sha256, brand_id: SOURCE.brand_id, post_uuid: null, rewrite: FEEDBACK.rewrite });
    expect(changed.history[0]).toMatchObject({ revision: 1, actor: "owner", source: "cockpit", action: "save_feedback", scope: "brand" });
    expect(parseVoiceStore(JSON.stringify(changed))).toEqual(changed);
  });
  it("rejects stale saves rather than overwriting newer guidance", () => {
    const changed = applyVoiceMutation(emptyVoice(), parseVoiceMutation(FEEDBACK), context);
    expect(() => applyVoiceMutation(changed, parseVoiceMutation(FEEDBACK), context)).toThrow(/changed/);
  });
  it("does not permit an edit to replace a captured original", () => {
    const changed = applyVoiceMutation(emptyVoice(), parseVoiceMutation(FEEDBACK), context);
    const edit = parseVoiceMutation({ ...FEEDBACK, id: "feedback-1", expected_revision: 1, original_text: "A different source" });
    expect(() => applyVoiceMutation(changed, edit, context)).toThrow(/source post changed/);
  });
  it("requires explicit shared scope and keeps the source brand on shared feedback", () => {
    expect(() => parseVoiceMutation({ ...FEEDBACK, scope: "shared" })).toThrow(/all brands explicitly/);
    const changed = applyVoiceMutation(emptyVoice(), parseVoiceMutation({ ...FEEDBACK, scope: "shared", shared_confirmed: true }), context);
    expect(changed.feedback[0]).toMatchObject({ scope: "shared", brand_id: SOURCE.brand_id });
    expect(() => applyVoiceMutation(changed, { action: "set_feedback_active", id: "feedback-1", expected_revision: 1, active: false }, context)).toThrow(/all brands explicitly/);
  });
  it("keeps positive examples explicit, separate from criticism and unchanged defaults", () => {
    expect(() => parseVoiceMutation({ ...FEEDBACK, flags: ["ai_sounding", "keep_style"] })).toThrow(/cannot be combined/);
    expect(() => parseVoiceMutation({ ...FEEDBACK, rewrite: ORIGINAL })).toThrow(/Change the wording/);
    const keep = parseVoiceMutation({ ...FEEDBACK, flags: ["keep_style"], rewrite: ORIGINAL });
    const changed = applyVoiceMutation(emptyVoice(), keep, context);
    expect(compileVoicePrompt(changed, SOURCE.brand_id)).toContain(`Owner marked this wording as a style example: ${JSON.stringify(ORIGINAL)}`);
  });
  it("rejects spoofed system fields, oversized text and unsupported flags", () => {
    for (const bad of [
      { ...FEEDBACK, original_sha256: "a".repeat(64) },
      { ...FEEDBACK, active: false },
      { ...FEEDBACK, flags: ["publish_now"] },
      { ...FEEDBACK, note: "x".repeat(4001) },
      { ...FEEDBACK, rewrite: "bad\u0000text" },
    ]) expect(() => parseVoiceMutation(bad)).toThrow();
  });
  it("edits and deactivates rules while preserving their creation history", () => {
    const edited = applyVoiceMutation(emptyVoice(), parseVoiceMutation({ action: "save_rule", id: "plain-language", expected_revision: 0,
      scope: "shared", shared_confirmed: true, brand_id: null, text: "Use specific verbs." }), { ...context, at: "2026-11-03T17:00:00Z" });
    expect(edited.rules[0].created_at).toBe(AT);
    const disabled = applyVoiceMutation(edited, parseVoiceMutation({ action: "set_rule_active", id: "plain-language", expected_revision: 1, active: false, shared_confirmed: true }), context);
    expect(disabled.rules[0].active).toBe(false);
    expect(compileVoicePrompt(disabled, SOURCE.brand_id)).not.toContain("Use specific verbs.");
  });
  it("compiles only active matching guidance, with facts and publication rights kept separate", () => {
    const changed = applyVoiceMutation(emptyVoice(), parseVoiceMutation(FEEDBACK), context);
    const prompt = compileVoicePrompt(changed, SOURCE.brand_id);
    expect(prompt).toContain("Owner's preferred wording:");
    expect(prompt).not.toContain("Owner marked this wording as a style example");
    expect(prompt).toContain("not evidence for medical or product facts");
    expect(compileVoicePrompt(changed, "other-brand")).not.toContain(ORIGINAL);
    changed.feedback[0].active = false;
    expect(compileVoicePrompt(changed, SOURCE.brand_id)).not.toContain(ORIGINAL);
  });
  it("puts a recently edited old correction back into the bounded writer packet", () => {
    const changed = applyVoiceMutation(emptyVoice(), parseVoiceMutation(FEEDBACK), context);
    const base = changed.feedback[0];
    changed.feedback = Array.from({ length: 31 }, (_, i) => ({ ...base, id: `entry-${i}`, note: `note-${i}`, updated_at: new Date(Date.UTC(2026, 10, 3 + i)).toISOString() }));
    changed.feedback[0].updated_at = "2027-01-01T00:00:00Z";
    const prompt = compileVoicePrompt(changed, SOURCE.brand_id);
    expect(prompt).toContain('"note-0"');
    expect(prompt).not.toContain('"note-1"');
  });
  it("returns unavailable for corrupted schema instead of assuming an empty voice", () => {
    for (const raw of [null, "{}", "{bad", JSON.stringify({ ...emptyVoice(), revision: -1 }), JSON.stringify({ ...emptyVoice(), rules: [{ text: "broken" }] })]) expect(parseVoiceStore(raw)).toBeNull();
  });
});
