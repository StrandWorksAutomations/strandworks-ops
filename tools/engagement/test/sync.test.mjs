import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_SENDS_PER_RUN, SENDING_MARK, parseArgs, planAction, run } from "../sync.mjs";
import { NOW, SECRET } from "./helpers.mjs";

const SB = "https://project.supabase.invalid";
const PAGE = "1428142013710264";
const BASE_ENV = { SUPABASE_URL: SB, SUPABASE_SERVICE_ROLE_KEY: "service-role-test-value" };

/** A tiny in-memory PostgREST covering the filters the sync job uses, plus scripted network routes. */
function world({ items = [], actions = [], sync = [], network = () => null } = {}) {
  const tables = { kc_engagement_items: items.map((r) => ({ ...r })), kc_engagement_actions: actions.map((r) => ({ ...r })), kc_engagement_sync: sync.map((r) => ({ ...r })) };
  const calls = [];
  const matches = (row, params) => [...params].every(([key, raw]) => {
    if (["select", "order", "limit", "on_conflict"].includes(key)) return true;
    const value = row[key];
    if (raw === "is.null") return value === null || value === undefined;
    if (raw === "not.is.null") return value !== null && value !== undefined;
    if (raw.startsWith("eq.")) return String(value) === raw.slice(3);
    if (raw.startsWith("lte.")) return value !== null && value !== undefined && String(value) <= raw.slice(4);
    if (raw.startsWith("in.(")) return raw.slice(4, -1).split(",").map((v) => v.replace(/^"|"$/g, "")).includes(String(value));
    throw new Error(`fake PostgREST: unsupported filter ${key}=${raw}`);
  });
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? "GET";
    calls.push({ url: String(input), method, headers: init.headers ?? {}, body: init.body });
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
    if (url.origin !== SB) {
      const reply = network(String(input), init, method);
      if (reply === null || reply === undefined) throw new Error(`unexpected network request in test: ${method} ${url.origin}${url.pathname}`);
      return json(reply.body ?? reply, reply.status ?? 200);
    }
    const rows = tables[url.pathname.split("/").pop()];
    if (method === "GET") {
      let found = rows.filter((row) => matches(row, url.searchParams));
      const order = url.searchParams.get("order");
      if (order) { const [column, direction] = order.split("."); found = [...found].sort((a, b) => (a[column] > b[column] ? 1 : a[column] < b[column] ? -1 : 0) * (direction === "desc" ? -1 : 1)); }
      return json(found.slice(0, Number(url.searchParams.get("limit") ?? 1000)));
    }
    if (method === "PATCH") {
      const hit = rows.filter((row) => matches(row, url.searchParams));
      for (const row of hit) Object.assign(row, JSON.parse(init.body));
      return json(hit);
    }
    if (method === "POST") {
      const keys = url.searchParams.get("on_conflict")?.split(",");
      for (const incoming of [].concat(JSON.parse(init.body))) {
        const existing = keys && rows.find((row) => keys.every((key) => row[key] === incoming[key]));
        if (existing) Object.assign(existing, incoming);
        else rows.push({ id: `00000000-0000-4000-8000-${String(rows.length + 1).padStart(12, "0")}`, status: "open", revision: 1, reply_draft: null, approved_reply: null, delivery_result: null, snoozed_until: null, ...incoming });
      }
      return json([]);
    }
    throw new Error(`fake PostgREST: unsupported method ${method}`);
  };
  return { tables, calls, fetchImpl, external: () => calls.filter((c) => !c.url.startsWith(SB)), writes: () => calls.filter((c) => c.method !== "GET") };
}

const quiet = () => {};
const item = (patch = {}) => ({ id: "11111111-1111-4111-8111-111111111111", network: "facebook", external_id: `${PAGE}_10_1`, post_external_id: `${PAGE}_10`, text: "Is this for RNs too?",
  status: "open", reply_draft: null, approved_reply: null, delivery_result: null, snoozed_until: null, revision: 1, updated_at: "2026-11-17T00:00:00.000Z", ...patch });
const action = (patch = {}) => ({ id: 1, item_id: item().id, action: "approve", draft: "Yes, RN roles are included.", snooze_until: null, base_revision: 1, applied_at: null, result: null, ...patch });

const fbPost = { id: `${PAGE}_10`, message: "Night shift pay", permalink_url: "https://www.facebook.com/1428142013710264/posts/10" };
const fbComment = { id: `${PAGE}_10_1`, message: "Is this for RNs too?", created_time: "2026-11-16T09:30:00+0000", from: { id: "555", name: "Dana R" } };
/** Graph API as the Facebook reader and sender see it. Instagram is reported as not linked. */
function graph({ comments = [fbComment], posted = [] } = {}) {
  return (url, init, method) => {
    if (!url.startsWith("https://graph.facebook.com/v25.0/")) return null;
    if (method === "POST") { posted.push({ url, body: init.body }); return { id: `${PAGE}_10_99` }; }
    if (url.includes(`/${PAGE}/posts`)) return { data: [fbPost] };
    if (url.includes(`/${PAGE}_10/comments`)) return { data: comments };
    if (url.includes(`/${PAGE}_10_1?`)) return { message: fbComment.message };
    if (url.includes(`/${PAGE}?`)) return { id: PAGE };
    return null;
  };
}

describe("arguments", () => {
  it("recognizes the two modes and rejects anything else without doing work", async () => {
    assert.deepEqual(parseArgs(["--dry-run", "--no-send"]), { dryRun: true, noSend: true, help: false, unknown: [] });
    const w = world();
    assert.equal((await run({ env: BASE_ENV, argv: ["--send-everything"], fetchImpl: w.fetchImpl, now: NOW, log: quiet })).exitCode, 2);
    assert.equal(w.calls.length, 0);
  });
});

describe("missing credentials", () => {
  it("records every network as not connected with an owner step and never throws", async () => {
    const w = world();
    const { exitCode, report } = await run({ env: BASE_ENV, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(exitCode, 0);
    assert.equal(w.external().length, 0);
    assert.deepEqual(w.tables.kc_engagement_sync.map((r) => r.network).sort(), ["facebook", "instagram", "linkedin", "tiktok", "youtube"]);
    for (const row of w.tables.kc_engagement_sync) {
      assert.equal(row.connected, false);
      assert.ok(row.note.length > 40);
      assert.equal(row.last_synced_at, undefined);
    }
    assert.match(w.tables.kc_engagement_sync.find((r) => r.network === "tiktok").note, /Metricool inbox/);
    assert.equal(report.networks.youtube.connected, false);
  });
  it("stops with a plain message when Supabase is not configured", async () => {
    const lines = [];
    const w = world();
    const { exitCode } = await run({ env: {}, fetchImpl: w.fetchImpl, now: NOW, log: (line) => lines.push(line) });
    assert.equal(exitCode, 1);
    assert.equal(w.calls.length, 0);
    assert.match(lines[0], /SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set/);
  });
});

describe("reading into the inbox", () => {
  it("upserts comments without touching the owner's decision columns", async () => {
    const w = world({ items: [item({ status: "approved", reply_draft: "kept", approved_reply: "kept", revision: 4, text: "older text" })], network: graph() });
    const { exitCode, report } = await run({ env: { ...BASE_ENV, KC_FB_PAGE_TOKEN: SECRET }, argv: ["--no-send"], fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(exitCode, 0);
    const [row] = w.tables.kc_engagement_items;
    assert.equal(w.tables.kc_engagement_items.length, 1);
    assert.deepEqual([row.status, row.reply_draft, row.approved_reply, row.revision, row.text, row.author_name], ["approved", "kept", "kept", 4, "Is this for RNs too?", "Dana R"]);
    assert.equal(report.networks.facebook.comments, 1);
    const fb = w.tables.kc_engagement_sync.find((r) => r.network === "facebook");
    assert.deepEqual([fb.connected, fb.last_synced_at, fb.last_error], [true, new Date(NOW).toISOString(), null]);
    assert.equal(w.tables.kc_engagement_sync.find((r) => r.network === "instagram").connected, false);
  });
  it("closes a live comment the Page has since answered on Facebook", async () => {
    const answered = { ...fbComment, comments: { data: [{ from: { id: PAGE } }] } };
    const w = world({ items: [item({ status: "approved", approved_reply: "x" })], network: graph({ comments: [answered] }) });
    await run({ env: { ...BASE_ENV, KC_FB_PAGE_TOKEN: SECRET }, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(w.tables.kc_engagement_items[0].status, "dismissed");
    assert.match(w.tables.kc_engagement_items[0].delivery_result, /Already answered/);
    assert.ok(w.external().every((c) => c.method === "GET"));
  });
  it("records a rejected token as not connected and keeps the error free of the token", async () => {
    const w = world({ network: (url) => (url.includes("graph.facebook.com") ? { status: 400, body: { error: { code: 190, message: `Bad token ${SECRET}` } } } : null) });
    const { exitCode } = await run({ env: { ...BASE_ENV, KC_FB_PAGE_TOKEN: SECRET }, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(exitCode, 0);
    const fb = w.tables.kc_engagement_sync.find((r) => r.network === "facebook");
    assert.equal(fb.connected, false);
    assert.match(fb.note, /Sign in again/);
    assert.ok(!JSON.stringify(w.tables).includes(SECRET));
  });
  it("wakes comments whose snooze has elapsed", async () => {
    const w = world({ items: [item({ status: "snoozed", snoozed_until: "2026-11-17T11:00:00.000Z" }), item({ id: "22222222-2222-4222-8222-222222222222", external_id: "x2", status: "snoozed", snoozed_until: "2026-11-18T11:00:00.000Z" })] });
    await run({ env: BASE_ENV, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.deepEqual(w.tables.kc_engagement_items.map((r) => r.status), ["open", "snoozed"]);
  });
});

describe("dry run", () => {
  it("reads and counts but writes nothing and sends nothing", async () => {
    const posted = [];
    const w = world({ items: [item({ status: "approved", approved_reply: action().draft, revision: 2 })], actions: [action({ applied_at: "2026-11-17T10:00:00Z" }), action({ id: 2, action: "dismiss", draft: null, base_revision: 2 })], network: graph({ posted }) });
    const before = JSON.stringify(w.tables);
    const lines = [];
    const { exitCode, report } = await run({ env: { ...BASE_ENV, KC_FB_PAGE_TOKEN: SECRET }, argv: ["--dry-run"], fetchImpl: w.fetchImpl, now: NOW, log: (line) => lines.push(line) });
    assert.equal(exitCode, 0);
    assert.equal(JSON.stringify(w.tables), before);
    assert.deepEqual(w.writes(), []);
    assert.deepEqual(posted, []);
    assert.deepEqual([report.mode, report.networks.facebook.comments, report.pending_actions, report.wrote, report.sent], ["dry-run", 1, 1, false, 0]);
    assert.ok(!lines.join("\n").includes(SECRET) && !lines.join("\n").includes(BASE_ENV.SUPABASE_SERVICE_ROLE_KEY));
  });
  it("still reads the networks when Supabase is not configured", async () => {
    const w = world({ network: graph() });
    const { exitCode, report } = await run({ env: { KC_FB_PAGE_TOKEN: SECRET }, argv: ["--dry-run"], fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(exitCode, 0);
    assert.equal(report.networks.facebook.comments, 1);
    assert.equal(report.pending_actions, null);
    assert.ok(w.calls.every((c) => !c.url.startsWith(SB) && c.method === "GET"));
  });
});

describe("owner actions", () => {
  it("plans each action and refuses stale, closed or empty ones", () => {
    assert.deepEqual(planAction(action(), item(), 1).patch, { status: "approved", reply_draft: action().draft, approved_reply: action().draft, delivery_result: null, snoozed_until: null });
    assert.deepEqual(planAction(action({ action: "save", draft: " Draft " }), item(), 1).patch, { reply_draft: "Draft" });
    assert.deepEqual(planAction(action({ action: "dismiss" }), item(), 1).patch, { status: "dismissed" });
    assert.deepEqual(planAction(action({ action: "snooze", snooze_until: "2026-11-18T12:00:00Z" }), item(), 1).patch, { status: "snoozed", snoozed_until: "2026-11-18T12:00:00Z" });
    assert.match(planAction(action(), undefined, undefined).skip, /no longer exists/);
    assert.match(planAction(action(), item({ status: "sent" }), 1).skip, /already sent/);
    assert.match(planAction(action({ base_revision: 1 }), item({ revision: 3 }), 3).skip, /changed after this decision/);
    assert.match(planAction(action({ draft: "  " }), item(), 1).skip, /empty/);
    assert.match(planAction(action(), item({ status: "approved", delivery_result: SENDING_MARK }), 1).skip, /interrupted/);
    // Two decisions made on the same loaded page (save, then approve) both apply in one run.
    assert.ok(planAction(action({ base_revision: 1 }), item({ revision: 2 }), 1).patch);
  });
  it("applies save, snooze and dismiss, bumps the revision and records each result", async () => {
    const second = item({ id: "22222222-2222-4222-8222-222222222222", external_id: "x2" });
    const third = item({ id: "33333333-3333-4333-8333-333333333333", external_id: "x3" });
    const w = world({ items: [item(), second, third], actions: [
      action({ id: 1, action: "save", draft: "Draft one" }),
      action({ id: 2, item_id: second.id, action: "snooze", draft: null, snooze_until: "2026-11-18T12:00:00.000Z" }),
      action({ id: 3, item_id: third.id, action: "dismiss", draft: null }),
      action({ id: 4, item_id: third.id, action: "approve", base_revision: 1 }),
    ] });
    const { report } = await run({ env: BASE_ENV, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    const [a, b, c] = w.tables.kc_engagement_items;
    assert.deepEqual([a.status, a.reply_draft, a.revision], ["open", "Draft one", 2]);
    assert.deepEqual([b.status, b.snoozed_until, b.revision], ["snoozed", "2026-11-18T12:00:00.000Z", 2]);
    assert.deepEqual([c.status, c.approved_reply, c.revision], ["dismissed", null, 2]);
    assert.deepEqual(w.tables.kc_engagement_actions.map((r) => r.result), ["Reply saved.", "Snoozed.", "Dismissed.", "Not applied: the comment is already dismissed."]);
    assert.ok(w.tables.kc_engagement_actions.every((r) => r.applied_at === new Date(NOW).toISOString()));
    assert.deepEqual(report.actions, { pending: 4, applied: 3 });
    assert.equal(w.external().length, 0);
  });
});

describe("sending", () => {
  const env = { ...BASE_ENV, KC_FB_PAGE_TOKEN: SECRET };
  it("sends a Facebook reply only after the owner's approve action, then marks it sent", async () => {
    const posted = [];
    const w = world({ items: [item()], actions: [action()], network: graph({ posted }) });
    const { report } = await run({ env, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(posted.length, 1);
    assert.ok(posted[0].url.endsWith(`/${PAGE}_10_1/comments`));
    assert.equal(posted[0].body, "message=Yes%2C+RN+roles+are+included.");
    const [row] = w.tables.kc_engagement_items;
    assert.deepEqual([row.status, row.approved_reply], ["sent", "Yes, RN roles are included."]);
    assert.match(row.delivery_result, /^Sent on Facebook at 2026-11-17T12:00:00.000Z \(reply /);
    assert.deepEqual(report.send, { sent: 1, failed: 0, by_hand: 0 });
  });
  it("never sends for open, saved, snoozed or dismissed comments", async () => {
    const posted = [];
    const ids = ["22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"];
    const w = world({ items: [item({ reply_draft: "A draft that was never approved" }), item({ id: ids[0], external_id: "x2", reply_draft: "d" }), item({ id: ids[1], external_id: "x3" })],
      actions: [action({ id: 1, action: "save" }), action({ id: 2, item_id: ids[0], action: "snooze", draft: null, snooze_until: "2026-11-19T00:00:00Z" }), action({ id: 3, item_id: ids[1], action: "dismiss", draft: null })],
      network: graph({ posted, comments: [] }) });
    const { report } = await run({ env, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.deepEqual(posted, []);
    assert.deepEqual(report.send, { sent: 0, failed: 0, by_hand: 0 });
  });
  it("refuses an approved row that has no matching owner approval", async () => {
    const posted = [];
    const tampered = item({ status: "approved", approved_reply: "Text nobody approved", revision: 2 });
    const w = world({ items: [tampered, item({ id: "22222222-2222-4222-8222-222222222222", external_id: "x2", status: "approved", approved_reply: "No action at all" })],
      actions: [action({ applied_at: "2026-11-17T10:00:00Z", result: "Approved." })], network: graph({ posted, comments: [] }) });
    const { report } = await run({ env, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.deepEqual(posted, []);
    assert.deepEqual(w.tables.kc_engagement_items.map((r) => r.status), ["failed", "failed"]);
    assert.match(w.tables.kc_engagement_items[0].delivery_result, /no matching owner approval/);
    assert.equal(report.send.failed, 2);
  });
  it("--no-send applies the approval but posts nothing; a later full run sends it", async () => {
    const posted = [];
    const w = world({ items: [item()], actions: [action()], network: graph({ posted }) });
    const first = await run({ env, argv: ["--no-send"], fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.deepEqual(posted, []);
    assert.equal(w.tables.kc_engagement_items[0].status, "approved");
    assert.deepEqual(first.report.send, { skipped: "--no-send" });
    await run({ env, fetchImpl: w.fetchImpl, now: NOW + 60_000, log: quiet });
    assert.equal(posted.length, 1);
    assert.equal(w.tables.kc_engagement_items[0].status, "sent");
  });
  it("holds the reply and reports why when the comment changed after approval", async () => {
    const posted = [];
    const base = graph({ posted });
    const w = world({ items: [item()], actions: [action()], network: (url, init, method) => (method === "GET" && url.includes(`/${PAGE}_10_1?`) ? { message: "Edited comment" } : base(url, init, method)) });
    await run({ env, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.deepEqual(posted, []);
    assert.equal(w.tables.kc_engagement_items[0].status, "failed");
    assert.match(w.tables.kc_engagement_items[0].delivery_result, /^Not sent: The comment changed since approval/);
  });
  it("marks an unclear send outcome as unknown instead of retrying", async () => {
    const base = graph();
    const w = world({ items: [item()], actions: [action()], network: (url, init, method) => (method === "POST" ? { status: 500, body: { error: { message: "Internal" } } } : base(url, init, method)) });
    await run({ env, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(w.tables.kc_engagement_items[0].status, "failed");
    assert.match(w.tables.kc_engagement_items[0].delivery_result, /^Send outcome unknown/);
    const posts = () => w.external().filter((c) => c.method === "POST").length;
    assert.equal(posts(), 1);
    await run({ env, fetchImpl: w.fetchImpl, now: NOW + 60_000, log: quiet });
    assert.equal(posts(), 1);
  });
  it("does not resend after an interrupted run left the sending mark", async () => {
    const posted = [];
    const w = world({ items: [item({ status: "approved", approved_reply: action().draft, delivery_result: SENDING_MARK, revision: 3 })],
      actions: [action({ applied_at: "2026-11-17T10:00:00Z" })], network: graph({ posted, comments: [] }) });
    await run({ env, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.deepEqual(posted, []);
    assert.equal(w.tables.kc_engagement_items[0].status, "failed");
    assert.match(w.tables.kc_engagement_items[0].delivery_result, /outcome is unknown/);
  });
  it("leaves approved YouTube and TikTok replies for the owner to post by hand", async () => {
    const yt = item({ network: "youtube", external_id: "Ugx1", status: "approved", approved_reply: action().draft, revision: 2 });
    const w = world({ items: [yt], actions: [action({ applied_at: "2026-11-17T10:00:00Z" })],
      network: (url) => (url.includes("youtube/v3") ? { items: [] } : null) });
    const { report } = await run({ env: { ...BASE_ENV, KC_YOUTUBE_API_KEY: SECRET }, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(w.tables.kc_engagement_items[0].status, "approved");
    assert.deepEqual(report.send, { sent: 0, failed: 0, by_hand: 1 });
    assert.ok(w.external().every((c) => c.method === "GET"));
  });
  it("does not send on LinkedIn without its token", async () => {
    const li = item({ network: "linkedin", external_id: "urn:li:comment:(urn:li:activity:9001,6001)", post_external_id: "urn:li:activity:9001", status: "approved", approved_reply: action().draft, revision: 2 });
    const w = world({ items: [li], actions: [action({ applied_at: "2026-11-17T10:00:00Z" })] });
    const { report } = await run({ env: BASE_ENV, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(w.external().length, 0);
    assert.equal(report.send.by_hand, 1);
  });
  it("sends at most the per-run limit", async () => {
    const posted = [];
    const many = Array.from({ length: MAX_SENDS_PER_RUN + 2 }, (_, n) => item({ id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`, external_id: `${PAGE}_10_1`, network: "facebook", status: "approved", approved_reply: action().draft, revision: 2, updated_at: `2026-11-17T00:00:0${n}.000Z` }));
    // Distinct rows share one mocked comment id here only to reuse the Graph mock.
    const w = world({ items: many, actions: many.map((row, n) => action({ id: n + 1, item_id: row.id, applied_at: "2026-11-17T10:00:00Z" })), network: graph({ posted, comments: [] }) });
    const { report } = await run({ env, fetchImpl: w.fetchImpl, now: NOW, log: quiet });
    assert.equal(posted.length, MAX_SENDS_PER_RUN);
    assert.equal(report.send.sent, MAX_SENDS_PER_RUN);
    assert.equal(w.tables.kc_engagement_items.filter((r) => r.status === "approved").length, 2);
  });
});
