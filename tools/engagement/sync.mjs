#!/usr/bin/env node
// Kinetic Clinician engagement sync: read comments from every connected network into
// Supabase (kc_engagement_items), apply the owner's queued decisions
// (kc_engagement_actions), and send approved replies where the saved sign-in allows.
//
//   node tools/engagement/sync.mjs              read, apply decisions, send approved replies
//   node tools/engagement/sync.mjs --no-send    read and apply decisions; send nothing
//   node tools/engagement/sync.mjs --dry-run    read and print counts; write nothing, send nothing
//
// A reply is only ever sent for a comment the owner approved in the dashboard. No reply
// text is generated here. See README.md for the environment variables.
import { pathToFileURL } from "node:url";
import { ApiError, SendHeld } from "./lib/http.mjs";
import { createDb, supabaseCredentials } from "./lib/supabase.mjs";
import * as facebook from "./readers/facebook.mjs";
import * as instagram from "./readers/instagram.mjs";
import * as youtube from "./readers/youtube.mjs";
import * as linkedin from "./readers/linkedin.mjs";
import * as tiktok from "./readers/tiktok.mjs";

export const READERS = [facebook, instagram, youtube, linkedin, tiktok];
export const MAX_SENDS_PER_RUN = 5;
/** Written to delivery_result just before a send, so an interrupted run is never retried blindly. */
export const SENDING_MARK = "sending";
const LIVE = "status=in.(open,approved,snoozed,failed)";
const ITEM_FIELDS = "id,network,external_id,post_external_id,text,status,reply_draft,approved_reply,delivery_result,revision";

export function parseArgs(argv) {
  const known = new Set(["--dry-run", "--no-send", "--help"]);
  const unknown = argv.filter((arg) => !known.has(arg));
  return { dryRun: argv.includes("--dry-run"), noSend: argv.includes("--no-send"), help: argv.includes("--help"), unknown };
}

function short(text) {
  return String(text ?? "").slice(0, 900);
}

/** Read one network. Never throws: a missing credential or a failed call becomes a status row. */
export async function readNetwork(reader, { env, fetchImpl, now }) {
  try {
    const result = await reader.read({ env, fetchImpl, now });
    return { network: reader.network, connected: !!result.connected, note: result.note ?? null, error: null, items: result.items ?? [], answered: result.answered ?? [], posts: result.posts ?? 0 };
  } catch (error) {
    const auth = error instanceof ApiError && error.auth;
    return { network: reader.network, connected: !auth, note: auth ? reader.REJECTED_NOTE ?? null : null,
      error: short(error instanceof ApiError ? error.message : `${reader.label} read failed: ${error?.name ?? "error"}`), items: [], answered: [], posts: 0 };
  }
}

function inList(values) {
  return `in.(${values.map((value) => `"${String(value).replace(/["\\]/g, "\\$&")}"`).join(",")})`;
}

async function storeRead(db, read, nowIso) {
  for (let i = 0; i < read.items.length; i += 100) {
    await db.upsert("kc_engagement_items", read.items.slice(i, i + 100).map((item) => ({ ...item, synced_at: nowIso })), "network,external_id");
  }
  let closed = 0;
  for (let i = 0; i < read.answered.length; i += 50) {
    const rows = await db.patch("kc_engagement_items", `network=eq.${read.network}&${LIVE}&external_id=${encodeURIComponent(inList(read.answered.slice(i, i + 50)))}`,
      { status: "dismissed", delivery_result: "Already answered on the network.", updated_at: nowIso });
    closed += rows.length;
  }
  const succeeded = read.connected && !read.error;
  await db.upsert("kc_engagement_sync", [{ network: read.network, connected: read.connected, last_error: read.error, note: read.note, ...(succeeded ? { last_synced_at: nowIso } : {}) }], "network");
  return closed;
}

/** The item change for one owner action, or a reason it cannot be applied. Pure. */
export function planAction(action, item, startRevision) {
  if (!item) return { skip: "The comment no longer exists." };
  if (item.status === "sent" || item.status === "dismissed") return { skip: `Not applied: the comment is already ${item.status}.` };
  if (action.base_revision !== item.revision && action.base_revision !== startRevision) return { skip: "Not applied: the comment changed after this decision was made. Review it again." };
  const draft = String(action.draft ?? "").trim();
  if (item.delivery_result === SENDING_MARK && action.action === "approve") return { skip: "Not applied: an earlier send of this reply was interrupted. Check the network, then approve again." };
  if (action.action === "save") return draft ? { patch: { reply_draft: draft }, result: "Reply saved." } : { skip: "Not applied: the reply was empty." };
  if (action.action === "approve") {
    return draft ? { patch: { status: "approved", reply_draft: draft, approved_reply: draft, delivery_result: null, snoozed_until: null }, result: "Approved." }
      : { skip: "Not applied: the reply was empty." };
  }
  if (action.action === "dismiss") return { patch: { status: "dismissed" }, result: "Dismissed." };
  if (action.action === "snooze") {
    return action.snooze_until ? { patch: { status: "snoozed", snoozed_until: action.snooze_until }, result: "Snoozed." } : { skip: "Not applied: no snooze time." };
  }
  return { skip: "Not applied: unknown action." };
}

async function applyActions(db, nowIso) {
  const actions = await db.select("kc_engagement_actions", "select=id,item_id,action,draft,snooze_until,base_revision&applied_at=is.null&order=id.asc&limit=200");
  const started = new Map();
  let applied = 0;
  for (const action of actions) {
    const [item] = await db.select("kc_engagement_items", `select=${ITEM_FIELDS}&id=eq.${action.item_id}&limit=1`);
    if (item && !started.has(item.id)) started.set(item.id, item.revision);
    const plan = planAction(action, item, started.get(action.item_id));
    let result = plan.skip;
    if (plan.patch) {
      const rows = await db.patch("kc_engagement_items", `id=eq.${item.id}&revision=eq.${item.revision}`, { ...plan.patch, revision: item.revision + 1, updated_at: nowIso });
      result = rows.length ? plan.result : "Not applied: the comment changed during the sync. Review it again.";
      if (rows.length) applied += 1;
    }
    await db.patch("kc_engagement_actions", `id=eq.${action.id}&applied_at=is.null`, { applied_at: nowIso, result: short(result) });
  }
  return { pending: actions.length, applied };
}

async function finish(db, item, revision, patch, nowIso) {
  await db.patch("kc_engagement_items", `id=eq.${item.id}&revision=eq.${revision}`, { ...patch, delivery_result: short(patch.delivery_result), revision: revision + 1, updated_at: nowIso });
}

/** Send owner-approved replies, one at a time, on networks whose sign-in allows it. */
async function sendApproved(db, { env, fetchImpl, nowIso }) {
  const approved = await db.select("kc_engagement_items", `select=${ITEM_FIELDS}&status=eq.approved&order=updated_at.asc&limit=50`);
  const out = { sent: 0, failed: 0, by_hand: 0 };
  for (const item of approved) {
    if (out.sent >= MAX_SENDS_PER_RUN) break;
    const reader = READERS.find((r) => r.network === item.network);
    if (!reader?.send || !reader.canSend(env)) { out.by_hand += 1; continue; }
    const reply = String(item.approved_reply ?? "").trim();
    if (item.delivery_result === SENDING_MARK) {
      await finish(db, item, item.revision, { status: "failed", delivery_result: `An earlier send was interrupted and its outcome is unknown. Check ${reader.label} before approving again.` }, nowIso);
      out.failed += 1;
      continue;
    }
    // The hard rule: nothing is sent unless the owner's own approve action carries exactly this text.
    const [approval] = await db.select("kc_engagement_actions", `select=id,draft&item_id=eq.${item.id}&action=eq.approve&applied_at=not.is.null&order=id.desc&limit=1`);
    if (!reply || !approval || String(approval.draft ?? "").trim() !== reply) {
      await finish(db, item, item.revision, { status: "failed", delivery_result: "Not sent: no matching owner approval was found for this reply. Approve it again." }, nowIso);
      out.failed += 1;
      continue;
    }
    const claimed = await db.patch("kc_engagement_items", `id=eq.${item.id}&status=eq.approved&revision=eq.${item.revision}`, { delivery_result: SENDING_MARK, revision: item.revision + 1, updated_at: nowIso });
    if (!claimed.length) continue;
    const revision = item.revision + 1;
    try {
      const sent = await reader.send({ env, fetchImpl, item, text: reply });
      await finish(db, item, revision, { status: "sent", delivery_result: `Sent on ${reader.label} at ${nowIso}${sent.id ? ` (reply ${sent.id})` : ""}.` }, nowIso);
      out.sent += 1;
    } catch (error) {
      const message = error instanceof SendHeld ? `Not sent: ${error.message}`
        : error instanceof ApiError ? (error.uncertain ? `Send outcome unknown (${error.message}). Check ${reader.label} before approving again.` : `Not sent: ${error.message}`)
          : `Send outcome unknown (${error?.name ?? "error"}). Check ${reader.label} before approving again.`;
      await finish(db, item, revision, { status: "failed", delivery_result: message }, nowIso);
      out.failed += 1;
    }
  }
  return out;
}

export async function run({ env = process.env, argv = [], fetchImpl = fetch, now = Date.now(), log = console.log } = {}) {
  const args = parseArgs(argv);
  if (args.help || args.unknown.length) {
    log("Usage: node tools/engagement/sync.mjs [--dry-run] [--no-send]");
    return { exitCode: args.unknown.length ? 2 : 0 };
  }
  const nowIso = new Date(now).toISOString();
  const credentials = supabaseCredentials(env);
  if (!credentials && !args.dryRun) {
    log(JSON.stringify({ error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Nothing was read or written. Use --dry-run to read the networks without Supabase." }));
    return { exitCode: 1 };
  }
  const db = credentials ? createDb(credentials, fetchImpl) : null;
  const report = { mode: args.dryRun ? "dry-run" : args.noSend ? "no-send" : "full", at: nowIso, networks: {} };
  try {
    for (const reader of READERS) {
      const read = await readNetwork(reader, { env, fetchImpl, now });
      const closed = args.dryRun ? 0 : await storeRead(db, read, nowIso);
      report.networks[read.network] = { connected: read.connected, posts: read.posts, comments: read.items.length, already_answered: read.answered.length,
        ...(args.dryRun ? {} : { closed_as_answered: closed }), ...(read.error ? { error: read.error } : {}), ...(read.connected ? {} : { note: read.note }) };
    }
    if (args.dryRun) {
      report.pending_actions = db ? (await db.select("kc_engagement_actions", "select=id&applied_at=is.null&limit=200")).length : null;
      report.wrote = false;
      report.sent = 0;
    } else {
      report.woken = (await db.patch("kc_engagement_items", `status=eq.snoozed&snoozed_until=lte.${encodeURIComponent(nowIso)}`, { status: "open", snoozed_until: null, updated_at: nowIso })).length;
      report.actions = await applyActions(db, nowIso);
      report.send = args.noSend ? { skipped: "--no-send" } : await sendApproved(db, { env, fetchImpl, nowIso });
    }
  } catch (error) {
    // Supabase failures land here; network reader failures are already recorded per network.
    report.error = short(error?.message ?? "sync failed");
    log(JSON.stringify(report, null, 1));
    return { exitCode: 1, report };
  }
  log(JSON.stringify(report, null, 1));
  return { exitCode: 0, report };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run({ argv: process.argv.slice(2) }).then(({ exitCode }) => { process.exitCode = exitCode; });
}
