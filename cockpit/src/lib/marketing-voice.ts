/** Owner-authored editorial guidance. This is a correction record, not model training. */
export const VOICE_FLAGS = ["ai_sounding", "too_salesy", "too_wordy", "keep_style"] as const;
export type VoiceFlag = typeof VOICE_FLAGS[number];
export type VoiceScope = "brand" | "shared";
export type VoiceRule = {
  id: string; scope: VoiceScope; brand_id: string | null; text: string; active: boolean;
  created_at: string; updated_at: string;
};
export type VoiceFeedback = {
  id: string; brand_id: string; post_id: string; post_uuid: string | null;
  original_text: string; original_sha256: string; scope: VoiceScope;
  flags: VoiceFlag[]; rewrite: string; note: string; active: boolean;
  created_at: string; updated_at: string;
};
export type VoiceEvent = {
  revision: number; at: string; actor: "owner"; source: "cockpit";
  action: VoiceAction; entity: "rule" | "feedback"; entity_id: string;
  scope: VoiceScope; brand_id: string | null;
};
export type VoiceStore = {
  schema_version: 1; revision: number; updated_at: string;
  rules: VoiceRule[]; feedback: VoiceFeedback[]; history: VoiceEvent[];
};
export type VoiceAction = "save_feedback" | "save_rule" | "set_feedback_active" | "set_rule_active";
export type VoiceMutation = {
  expected_revision: number; action: VoiceAction; id?: string;
  scope?: VoiceScope; brand_id?: string | null; post_id?: string; post_uuid?: string | null;
  original_text?: string; rewrite?: string; note?: string; flags?: VoiceFlag[];
  text?: string; active?: boolean; shared_confirmed?: boolean;
};
export type VoicePostSource = {
  brand_id: string; post_id: string; post_uuid: string | null;
  original_text: string; original_sha256: string;
};

export class VoiceError extends Error {
  constructor(message: string, public status = 422, public code = "invalid_voice_input") { super(message); }
}
const ID = /^[A-Za-z0-9_-]{1,100}$/;
const HASH = /^[a-f0-9]{64}$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const ACTIONS: VoiceAction[] = ["save_feedback", "save_rule", "set_feedback_active", "set_rule_active"];
const iso = (s: unknown): s is string => typeof s === "string" && Number.isFinite(Date.parse(s));
const record = (s: unknown): s is Record<string, unknown> => !!s && typeof s === "object" && !Array.isArray(s);
const id = (s: unknown): s is string => typeof s === "string" && ID.test(s);
const scope = (s: unknown): s is VoiceScope => s === "brand" || s === "shared";
function text(s: unknown, limit: number, empty = false): s is string {
  return typeof s === "string" && s.length <= limit && !CONTROL.test(s) && (empty || !!s.trim());
}
function validFlags(s: unknown): s is VoiceFlag[] {
  return Array.isArray(s) && s.length <= VOICE_FLAGS.length && new Set(s).size === s.length &&
    s.every((f) => VOICE_FLAGS.includes(f)) && !(s.includes("keep_style") && s.length > 1);
}

/** Reject an unreadable source instead of replacing it with an empty guide. */
export function parseVoiceStore(raw: string | null): VoiceStore | null {
  if (!raw) return null;
  try {
    const s: unknown = JSON.parse(raw);
    if (!record(s) || s.schema_version !== 1 || !Number.isInteger(s.revision) || (s.revision as number) < 0 || !iso(s.updated_at) ||
      !Array.isArray(s.rules) || !Array.isArray(s.feedback) || !Array.isArray(s.history)) return null;
    if (!s.rules.every((r) => record(r) && id(r.id) && scope(r.scope) &&
      (r.scope === "shared" ? r.brand_id === null : id(r.brand_id)) && text(r.text, 2000) && typeof r.active === "boolean" && iso(r.created_at) && iso(r.updated_at))) return null;
    if (!s.feedback.every((f) => record(f) && id(f.id) && id(f.brand_id) && id(f.post_id) &&
      (f.post_uuid === null || (typeof f.post_uuid === "string" && f.post_uuid.length > 0 && f.post_uuid.length <= 100 && !CONTROL.test(f.post_uuid))) &&
      text(f.original_text, 12000) && typeof f.original_sha256 === "string" && HASH.test(f.original_sha256) && scope(f.scope) &&
      validFlags(f.flags) && text(f.rewrite, 12000, true) && text(f.note, 4000, true) &&
      (f.flags.length > 0 || !!f.rewrite.trim() || !!f.note.trim()) && typeof f.active === "boolean" && iso(f.created_at) && iso(f.updated_at))) return null;
    if (!s.history.every((e) => record(e) && Number.isInteger(e.revision) && (e.revision as number) > 0 && (e.revision as number) <= (s.revision as number) &&
      iso(e.at) && e.actor === "owner" && e.source === "cockpit" && ACTIONS.includes(e.action as VoiceAction) &&
      (e.entity === "rule" || e.entity === "feedback") && id(e.entity_id) && scope(e.scope) && (e.brand_id === null || id(e.brand_id)))) return null;
    const ids = [...s.rules, ...s.feedback].map((e) => (e as { id: string }).id);
    if (new Set(ids).size !== ids.length) return null;
    return s as VoiceStore;
  } catch { return null; }
}

export function parseVoiceMutation(raw: unknown): VoiceMutation {
  if (!record(raw)) throw new VoiceError("Voice feedback must be an object.");
  if (!Number.isInteger(raw.expected_revision) || (raw.expected_revision as number) < 0) throw new VoiceError("Reload the current voice guide before saving.");
  if (!ACTIONS.includes(raw.action as VoiceAction)) throw new VoiceError("Choose a supported voice action.");
  const action = raw.action as VoiceAction;
  const allowed = new Set(["expected_revision", "action", "id", ...(action === "save_feedback" ?
    ["scope", "brand_id", "post_id", "post_uuid", "original_text", "rewrite", "note", "flags", "shared_confirmed"] : action === "save_rule" ?
      ["scope", "brand_id", "text", "shared_confirmed"] : ["active", "shared_confirmed"])]);
  if (Object.keys(raw).some((k) => !allowed.has(k))) throw new VoiceError("The request contains unsupported fields.");
  if (raw.id !== undefined && !id(raw.id)) throw new VoiceError("The saved feedback identifier is invalid.");
  if (raw.shared_confirmed !== undefined && typeof raw.shared_confirmed !== "boolean") throw new VoiceError("Choose whether this guidance applies to all brands.");
  if (action === "set_feedback_active" || action === "set_rule_active") {
    if (!id(raw.id) || typeof raw.active !== "boolean") throw new VoiceError("Choose a saved item and its active state.");
    return raw as VoiceMutation;
  }
  const targetScope = raw.scope ?? "brand";
  if (!scope(targetScope)) throw new VoiceError("Choose this brand or all brands.");
  if (targetScope === "shared" && raw.shared_confirmed !== true) throw new VoiceError("Select all brands explicitly before saving shared guidance.");
  if (action === "save_rule") {
    if (targetScope === "shared" ? raw.brand_id !== null && raw.brand_id !== undefined : !id(raw.brand_id)) throw new VoiceError("Choose the brand for this writing rule.");
    if (!text(raw.text, 2000)) throw new VoiceError("Enter a writing rule of 1-2000 characters.");
    return { ...raw, scope: targetScope, brand_id: targetScope === "shared" ? null : raw.brand_id } as VoiceMutation;
  }
  if (!id(raw.brand_id) || !id(raw.post_id) || !text(raw.original_text, 12000)) throw new VoiceError("The source post is missing or invalid. Reload the post and try again.");
  if (raw.post_uuid !== undefined && raw.post_uuid !== null && !(typeof raw.post_uuid === "string" && raw.post_uuid.length > 0 && raw.post_uuid.length <= 100 && !CONTROL.test(raw.post_uuid))) throw new VoiceError("The source post UUID is invalid.");
  const flags = raw.flags ?? [];
  if (!validFlags(flags)) throw new VoiceError("Keep this style cannot be combined with criticism flags.");
  const rewrite = raw.rewrite ?? "";
  const note = raw.note ?? "";
  if (!text(rewrite, 12000, true) || !text(note, 4000, true)) throw new VoiceError("Keep the rewrite within 12000 characters and the note within 4000 characters.");
  if (rewrite.trim() && rewrite.trim() === (raw.original_text as string).trim() && !flags.includes("keep_style")) throw new VoiceError("Change the wording or leave the rewrite blank. Use Keep this style to approve the original.");
  if (!flags.length && !rewrite.trim() && !note.trim()) throw new VoiceError("Choose a flag, add a note, or write your preferred wording.");
  return { ...raw, scope: targetScope, flags, rewrite, note } as VoiceMutation;
}

/** Pure change application. Storage rechecks the revision atomically before committing. */
export function applyVoiceMutation(
  store: VoiceStore, input: VoiceMutation,
  context: { at: string; newId: string; brandIds: string[]; source?: VoicePostSource }
): VoiceStore {
  if (input.expected_revision !== store.revision) throw new VoiceError("The voice guide changed. Reload the latest version before saving.", 409, "revision_conflict");
  const next: VoiceStore = JSON.parse(JSON.stringify(store));
  const targetIsRule = input.action === "save_rule" || input.action === "set_rule_active";
  const list = targetIsRule ? next.rules : next.feedback;
  const previous = input.id ? list.find((r) => r.id === input.id) : undefined;
  if (input.id && !previous) throw new VoiceError("That saved voice item was not found.", 404, "voice_item_not_found");
  const targetScope = input.scope ?? previous?.scope ?? "brand";
  if (targetScope === "shared" && input.shared_confirmed !== true) throw new VoiceError("Select all brands explicitly before changing shared guidance.");
  const itemId = previous?.id ?? context.newId;
  let entityBrand: string | null;
  if (input.action === "set_feedback_active" || input.action === "set_rule_active") {
    previous!.active = input.active!;
    previous!.updated_at = context.at;
    entityBrand = previous!.brand_id;
  } else if (input.action === "save_rule") {
    entityBrand = targetScope === "shared" ? null : input.brand_id!;
    if (entityBrand && !context.brandIds.includes(entityBrand)) throw new VoiceError("That brand is not included in the current account check.");
    const rule: VoiceRule = { id: itemId, scope: targetScope, brand_id: entityBrand, text: input.text!, active: previous?.active ?? true,
      created_at: previous?.created_at ?? context.at, updated_at: context.at };
    if (previous) next.rules[next.rules.findIndex((r) => r.id === itemId)] = rule;
    else next.rules.push(rule);
  } else {
    const old = previous as VoiceFeedback | undefined;
    const source = old ?? context.source;
    if (!source) throw new VoiceError("The source post is unavailable. Reload the Marketing view.", 409, "source_changed");
    if (input.brand_id !== source.brand_id || input.post_id !== source.post_id || input.original_text !== source.original_text ||
      (input.post_uuid != null && input.post_uuid !== source.post_uuid)) throw new VoiceError("The source post changed. Reload it before adding feedback.", 409, "source_changed");
    entityBrand = source.brand_id;
    const feedback: VoiceFeedback = { id: itemId, brand_id: entityBrand, post_id: source.post_id, post_uuid: source.post_uuid,
      original_text: source.original_text, original_sha256: source.original_sha256, scope: targetScope,
      flags: input.flags ?? [], rewrite: input.rewrite ?? "", note: input.note ?? "", active: old?.active ?? true,
      created_at: old?.created_at ?? context.at, updated_at: context.at };
    if (old) next.feedback[next.feedback.findIndex((f) => f.id === itemId)] = feedback;
    else next.feedback.push(feedback);
  }
  next.revision++;
  next.updated_at = context.at;
  next.history.push({ revision: next.revision, at: context.at, actor: "owner", source: "cockpit", action: input.action,
    entity: targetIsRule ? "rule" : "feedback", entity_id: itemId, scope: targetScope, brand_id: entityBrand });
  return next;
}

/** Bounded writer packet: inactive preferences and unapproved original captions are excluded. */
export function compileVoicePrompt(store: VoiceStore, brandId: string): string {
  const rules = store.rules.filter((r) => r.active && (r.scope === "shared" || r.brand_id === brandId));
  const feedback = store.feedback.filter((f) => f.active && (f.scope === "shared" || f.brand_id === brandId))
    .sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(-30);
  const lines = [`Writing voice for brand ${brandId}`, `Owner guidance revision ${store.revision}; updated ${store.updated_at}.`,
    "These are wording preferences, not evidence for medical or product facts. Verify claims independently. Publication permissions and posting queues do not change.", "", "Writing rules:"];
  for (const r of rules) lines.push(`- [${r.scope}] ${r.text}`);
  if (!rules.length) lines.push("No active writing rules recorded for this brand.");
  lines.push("", "Owner corrections and examples:");
  for (const f of feedback) {
    lines.push(`Source brand ${f.brand_id}, post ${f.post_id}${f.post_uuid ? `, UUID ${f.post_uuid}` : ""}; original SHA256 ${f.original_sha256}.`);
    if (f.flags.includes("keep_style")) lines.push(`Owner marked this wording as a style example: ${JSON.stringify(f.rewrite.trim() ? f.rewrite : f.original_text)}`);
    else {
      if (f.flags.length) lines.push(`Owner flagged ${f.flags.join(", ")}: ${JSON.stringify(f.original_text)}`);
      if (f.rewrite.trim()) lines.push(`Owner's preferred wording: ${JSON.stringify(f.rewrite)}`);
    }
    if (f.note.trim()) lines.push(`Owner's note: ${JSON.stringify(f.note)}`);
    lines.push("");
  }
  if (!feedback.length) lines.push("No active owner corrections recorded for this brand.");
  return lines.join("\n");
}
