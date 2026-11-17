import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError, SendHeld, toIso } from "../lib/http.mjs";
import * as facebook from "../readers/facebook.mjs";
import * as instagram from "../readers/instagram.mjs";
import * as youtube from "../readers/youtube.mjs";
import * as linkedin from "../readers/linkedin.mjs";
import * as tiktok from "../readers/tiktok.mjs";
import { READERS } from "../sync.mjs";
import { NOW, SECRET, mockFetch, noFetch } from "./helpers.mjs";

const PAGE = "1428142013710264";
const recent = "2026-11-16T09:30:00+0000";
const old = "2026-10-01T09:30:00+0000";

describe("every reader without its credential", () => {
  for (const reader of READERS) {
    it(`${reader.network} reports not connected with an owner step and makes no request`, async () => {
      const { fetchImpl, calls } = noFetch();
      const result = await reader.read({ env: {}, fetchImpl, now: NOW });
      assert.equal(result.connected, false);
      assert.ok(result.note.length > 40);
      assert.deepEqual(result.items, []);
      assert.equal(calls.length, 0);
    });
  }
  it("names the exact variable or route for each network", async () => {
    const note = async (reader) => (await reader.read({ env: {}, fetchImpl: noFetch().fetchImpl, now: NOW })).note;
    assert.match(await note(facebook), /KC_FB_PAGE_TOKEN/);
    assert.match(await note(instagram), /instagram_basic, instagram_manage_comments and pages_read_engagement/);
    assert.match(await note(youtube), /KC_YOUTUBE_API_KEY/);
    assert.match(await note(youtube), /OAuth/);
    assert.match(await note(linkedin), /KC_LINKEDIN_TOKEN/);
    assert.match(await note(linkedin), /Community Management API/);
    assert.match(await note(tiktok), /Metricool inbox/);
  });
  it("tiktok stays disconnected even when unrelated credentials exist, and cannot send", async () => {
    const { fetchImpl, calls } = noFetch();
    const result = await tiktok.read({ env: { KC_FB_PAGE_TOKEN: SECRET, KC_TIKTOK_TOKEN: SECRET }, fetchImpl, now: NOW });
    assert.equal(result.connected, false);
    assert.equal(calls.length, 0);
    assert.equal(tiktok.canSend(), false);
    assert.equal(tiktok.send, undefined);
  });
});

describe("facebook reader", () => {
  const post = { id: `${PAGE}_10`, message: "Night shift pay  across\nthree states", permalink_url: "https://www.facebook.com/1428142013710264/posts/10" };
  const comments = [
    { id: `${PAGE}_10_1`, message: " Is this for RNs too? ", created_time: recent, permalink_url: "https://www.facebook.com/1428142013710264/posts/10?comment_id=1", from: { id: "555", name: "Dana R" } },
    { id: `${PAGE}_10_2`, message: "Thanks for asking!", created_time: recent, from: { id: PAGE, name: "Kinetic Clinician" } },
    { id: `${PAGE}_10_3`, message: "Already handled", created_time: recent, from: { id: "556" }, comments: { data: [{ from: { id: "61595378964295" } }] } },
    { id: `${PAGE}_10_4`, message: "Old question", created_time: old, from: { id: "557" } },
    { id: `${PAGE}_10_5`, message: "   ", created_time: recent, from: { id: "558" } },
    { id: `${PAGE}_10_6`, message: "No author shown", created_time: recent },
  ];

  it("keeps fresh unanswered comments from other people and records answered ones", () => {
    const { items, answered } = facebook.parseComments(post, comments, NOW);
    assert.deepEqual(items.map((i) => i.external_id), [`${PAGE}_10_1`, `${PAGE}_10_6`]);
    assert.deepEqual(answered, [`${PAGE}_10_3`]);
    assert.deepEqual(items[0], {
      network: "facebook", external_id: `${PAGE}_10_1`, post_external_id: `${PAGE}_10`,
      post_url: "https://www.facebook.com/1428142013710264/posts/10?comment_id=1", post_excerpt: "Night shift pay across three states",
      author_name: "Dana R", text: "Is this for RNs too?", commented_at: "2026-11-16T09:30:00.000Z" });
    assert.equal(items[1].post_url, post.permalink_url);
    assert.equal(items[1].author_name, "");
  });

  it("reads Page posts then comments, following paging, with the token only in a header", async () => {
    const { fetchImpl, calls } = mockFetch([
      [`/${PAGE}/posts`, { data: [post] }],
      ["after=CURSOR", { data: [comments[5]] }],
      [`/${PAGE}_10/comments`, { data: [comments[0]], paging: { next: `https://graph.facebook.com/v25.0/${PAGE}_10/comments?after=CURSOR` } }],
    ]);
    const result = await facebook.read({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, now: NOW });
    assert.equal(result.connected, true);
    assert.equal(result.items.length, 2);
    assert.equal(calls.length, 3);
    assert.ok(calls.every((c) => c.url.startsWith("https://graph.facebook.com/v25.0/") && !c.url.includes(SECRET) && c.method === "GET"));
    assert.ok(calls.every((c) => c.headers.Authorization === `Bearer ${SECRET}`));
    assert.match(calls[1].url, /filter=toplevel/);
  });

  it("adds appsecret_proof only when the app secret is configured", async () => {
    const routes = [[`/${PAGE}/posts`, { data: [] }]];
    const plain = mockFetch(routes);
    await facebook.read({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl: plain.fetchImpl, now: NOW });
    assert.doesNotMatch(plain.calls[0].url, /appsecret_proof/);
    const proofed = mockFetch(routes);
    await facebook.read({ env: { KC_FB_PAGE_TOKEN: SECRET, KC_FB_APP_SECRET: "app-secret-value" }, fetchImpl: proofed.fetchImpl, now: NOW });
    assert.match(proofed.calls[0].url, /appsecret_proof=[0-9a-f]{64}/);
    assert.doesNotMatch(proofed.calls[0].url, /app-secret-value/);
  });

  it("refuses to follow a paging link to another host", async () => {
    const { fetchImpl, calls } = mockFetch([[`/${PAGE}/posts`, { data: [], paging: { next: "https://example.invalid/steal" } }]]);
    await assert.rejects(facebook.read({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, now: NOW }), ApiError);
    assert.equal(calls.length, 1);
  });

  it("marks an expired token as a sign-in problem without leaking it", async () => {
    const { fetchImpl } = mockFetch([[`/${PAGE}/posts`, { status: 400, body: { error: { code: 190, message: `Error validating access token ${SECRET}` } } }]]);
    await assert.rejects(facebook.read({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, now: NOW }), (error) => {
      assert.ok(error instanceof ApiError && error.auth);
      assert.ok(!error.message.includes(SECRET));
      assert.match(error.message, /code 190/);
      return true;
    });
  });

  const item = { external_id: `${PAGE}_10_1`, text: "Is this for RNs too?" };
  it("sends a reply only after the comment is confirmed unchanged and unanswered", async () => {
    const { fetchImpl, calls } = mockFetch([
      [`GET https://graph.facebook.com/v25.0/${PAGE}_10_1?`, { message: "Is this for RNs too?" }],
      [`POST https://graph.facebook.com/v25.0/${PAGE}_10_1/comments`, { id: `${PAGE}_10_99` }],
    ]);
    const sent = await facebook.send({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, item, text: "Yes, RN roles are included." });
    assert.deepEqual(sent, { id: `${PAGE}_10_99` });
    assert.equal(calls[1].body, "message=Yes%2C+RN+roles+are+included.");
  });
  it("holds the reply when the comment was edited or the Page already replied", async () => {
    const edited = mockFetch([[`/${PAGE}_10_1?`, { message: "Different text now" }]]);
    await assert.rejects(facebook.send({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl: edited.fetchImpl, item, text: "x" }), SendHeld);
    const replied = mockFetch([[`/${PAGE}_10_1?`, { message: item.text, comments: { data: [{ from: { id: PAGE } }] } }]]);
    await assert.rejects(facebook.send({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl: replied.fetchImpl, item, text: "x" }), SendHeld);
    assert.ok([...edited.calls, ...replied.calls].every((c) => c.method === "GET"));
  });
});

describe("instagram reader", () => {
  const media = { id: "1789", caption: "Weekly pay roundup", permalink: "https://www.instagram.com/p/ABC/", comments_count: 3 };
  const comments = [
    { id: "c1", text: "Where is this posted?", timestamp: recent, username: "nurse_kay" },
    { id: "c2", text: "We answer below", timestamp: recent, username: "KineticClinician" },
    { id: "c3", text: "Got an answer", timestamp: recent, username: "medic_j", replies: { data: [{ username: "kineticclinician" }] } },
    { id: "c4", text: "Too old", timestamp: old, username: "someone" },
  ];

  it("parses comments, skipping the account's own and already answered ones", () => {
    const { items, answered } = instagram.parseComments(media, comments, "kineticclinician", NOW);
    assert.deepEqual(items, [{ network: "instagram", external_id: "c1", post_external_id: "1789", post_url: "https://www.instagram.com/p/ABC/",
      post_excerpt: "Weekly pay roundup", author_name: "nurse_kay", text: "Where is this posted?", commented_at: "2026-11-16T09:30:00.000Z" }]);
    assert.deepEqual(answered, ["c3"]);
  });

  it("finds the linked business account and reads only media that has comments", async () => {
    const { fetchImpl, calls } = mockFetch([
      [`/${PAGE}?fields=instagram_business_account`, { instagram_business_account: { id: "1784", username: "kineticclinician" } }],
      ["/1784/media", { data: [media, { id: "1790", comments_count: 0 }] }],
      ["/1789/comments", { data: comments }],
    ]);
    const result = await instagram.read({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, now: NOW });
    assert.equal(result.connected, true);
    assert.equal(result.items.length, 1);
    assert.deepEqual(result.answered, ["c3"]);
    assert.equal(calls.length, 3);
    assert.ok(calls.every((c) => !c.url.includes(SECRET)));
  });

  it("reports not connected when no Instagram account is linked to the Page", async () => {
    const { fetchImpl } = mockFetch([[`/${PAGE}?`, { id: PAGE }]]);
    const result = await instagram.read({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, now: NOW });
    assert.equal(result.connected, false);
    assert.match(result.note, /link the Instagram account to the Page/);
  });

  it("treats a missing permission as a sign-in problem", async () => {
    const { fetchImpl } = mockFetch([[`/${PAGE}?`, { status: 403, body: { error: { code: 10, message: "(#10) Application does not have permission for this action" } } }]]);
    await assert.rejects(instagram.read({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, now: NOW }), (error) => error instanceof ApiError && error.auth);
  });

  it("replies through the comment's replies edge after checking the text", async () => {
    const { fetchImpl, calls } = mockFetch([["GET https://graph.facebook.com/v25.0/c1?", { text: "Where is this posted?" }], ["POST https://graph.facebook.com/v25.0/c1/replies", { id: "r9" }]]);
    assert.deepEqual(await instagram.send({ env: { KC_FB_PAGE_TOKEN: SECRET }, fetchImpl, item: { external_id: "c1", text: "Where is this posted?" }, text: "On the job board." }), { id: "r9" });
    assert.equal(calls[1].body, "message=On+the+job+board.");
  });
});

describe("youtube reader", () => {
  const thread = (id, patch = {}, replies) => ({
    snippet: { videoId: "dQw4w9WgXcQ", totalReplyCount: replies ? replies.length : 0,
      topLevelComment: { id, snippet: { textOriginal: "Great breakdown", textDisplay: "Great <b>breakdown</b>", authorDisplayName: "@viewer", authorChannelId: { value: "UCother" }, publishedAt: "2026-11-15T08:00:00Z", videoId: "dQw4w9WgXcQ", ...patch } } },
    ...(replies ? { replies: { comments: replies.map((value) => ({ snippet: { authorChannelId: { value } } })) } } : {}),
  });
  const threads = [
    thread("Ugx1"),
    thread("Ugx2", { authorChannelId: { value: youtube.CHANNEL_ID } }),
    thread("Ugx3", {}, [youtube.CHANNEL_ID]),
    thread("Ugx4", {}, ["UCsomeoneElse"]),
    thread("Ugx5", { publishedAt: "2026-09-01T08:00:00Z" }),
  ];

  it("parses threads into items with a link to the exact comment", () => {
    const { items, answered } = youtube.parseThreads(threads, { dQw4w9WgXcQ: "EMT pay explained" }, NOW);
    assert.deepEqual(items.map((i) => i.external_id), ["Ugx1", "Ugx4"]);
    assert.deepEqual(answered, ["Ugx3"]);
    assert.deepEqual(items[0], { network: "youtube", external_id: "Ugx1", post_external_id: "dQw4w9WgXcQ",
      post_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&lc=Ugx1", post_excerpt: "EMT pay explained", author_name: "@viewer",
      text: "Great breakdown", commented_at: "2026-11-15T08:00:00.000Z" });
  });

  it("reads the channel's threads and video titles with the key in a header, never the URL", async () => {
    const { fetchImpl, calls } = mockFetch([
      ["/youtube/v3/commentThreads", { items: threads }],
      ["/youtube/v3/videos", { items: [{ id: "dQw4w9WgXcQ", snippet: { title: "EMT pay explained" } }] }],
    ]);
    const result = await youtube.read({ env: { KC_YOUTUBE_API_KEY: SECRET }, fetchImpl, now: NOW });
    assert.equal(result.connected, true);
    assert.match(result.note, /OAuth/);
    assert.equal(result.items[0].post_excerpt, "EMT pay explained");
    assert.match(calls[0].url, /allThreadsRelatedToChannelId=UCiPtWhRgHcY0FWfUcnkUW2Q/);
    assert.ok(calls.every((c) => !c.url.includes(SECRET) && !c.url.includes("key=") && c.headers["X-Goog-Api-Key"] === SECRET));
    assert.equal(youtube.canSend({ KC_YOUTUBE_API_KEY: SECRET }), false);
    assert.equal(youtube.send, undefined);
  });

  it("follows nextPageToken while comments are still inside the window", async () => {
    let page = 0;
    const { fetchImpl, calls } = mockFetch([
      ["/youtube/v3/commentThreads", () => (page++ === 0 ? { items: [thread("UgxA")], nextPageToken: "P2" } : { items: [thread("UgxB", { publishedAt: "2026-09-01T08:00:00Z" })], nextPageToken: "P3" })],
      ["/youtube/v3/videos", { items: [] }],
    ]);
    const result = await youtube.read({ env: { KC_YOUTUBE_API_KEY: SECRET }, fetchImpl, now: NOW });
    assert.deepEqual(result.items.map((i) => i.external_id), ["UgxA"]);
    assert.equal(calls.filter((c) => c.url.includes("commentThreads")).length, 2);
    assert.match(calls[1].url, /pageToken=P2/);
  });

  it("treats an invalid key as a sign-in problem but not a quota error", async () => {
    const bad = mockFetch([["commentThreads", { status: 400, body: { error: { code: 400, message: "API key not valid. Please pass a valid API key.", errors: [{ reason: "badRequest" }] } } }]]);
    await assert.rejects(youtube.read({ env: { KC_YOUTUBE_API_KEY: SECRET }, fetchImpl: bad.fetchImpl, now: NOW }), (error) => error instanceof ApiError && error.auth);
    const quota = mockFetch([["commentThreads", { status: 403, body: { error: { code: 403, message: "Quota exceeded", errors: [{ reason: "quotaExceeded" }] } } }]]);
    await assert.rejects(youtube.read({ env: { KC_YOUTUBE_API_KEY: SECRET }, fetchImpl: quota.fetchImpl, now: NOW }), (error) => error instanceof ApiError && !error.auth);
  });
});

describe("linkedin reader", () => {
  const post = { id: "urn:li:share:7001", commentary: "Hiring update for paramedics", lastModifiedAt: NOW - 86400_000 };
  const comments = [
    { id: "6001", actor: "urn:li:person:abc", object: "urn:li:activity:9001", message: { text: "Is relocation covered?" }, created: { time: NOW - 3600_000 } },
    { id: "6002", actor: linkedin.ORGANIZATION_URN, object: "urn:li:activity:9001", message: { text: "From the page" }, created: { time: NOW - 3600_000 } },
    { id: "6003", actor: "urn:li:person:def", object: "urn:li:activity:9001", parentComment: "urn:li:comment:(urn:li:activity:9001,6001)", message: { text: "Nested" }, created: { time: NOW - 3600_000 } },
    { id: "6004", actor: "urn:li:person:ghi", object: "urn:li:activity:9001", message: { text: "Old" }, created: { time: NOW - 40 * 86400_000 } },
    { id: "6005", actor: "urn:li:person:jkl", object: "urn:li:activity:9001", commentUrn: "urn:li:comment:(urn:li:ugcPost:7002,6005)", message: { text: "Explicit urn" }, created: { time: NOW - 7200_000 } },
  ];

  it("parses top-level member comments and builds the comment URN", () => {
    const { items } = linkedin.parseComments(post, comments, NOW);
    assert.deepEqual(items.map((i) => i.external_id), ["urn:li:comment:(urn:li:activity:9001,6001)", "urn:li:comment:(urn:li:ugcPost:7002,6005)"]);
    assert.deepEqual(items[0], { network: "linkedin", external_id: "urn:li:comment:(urn:li:activity:9001,6001)", post_external_id: "urn:li:activity:9001",
      post_url: "https://www.linkedin.com/feed/update/urn:li:share:7001/", post_excerpt: "Hiring update for paramedics", author_name: "LinkedIn member",
      text: "Is relocation covered?", commented_at: new Date(NOW - 3600_000).toISOString() });
  });

  it("reads the organization's posts and their comments with versioned REST headers", async () => {
    const { fetchImpl, calls } = mockFetch([
      ["/rest/posts?q=author&author=urn%3Ali%3Aorganization%3A146763118", { elements: [post, { id: "urn:li:share:1", lastModifiedAt: NOW - 90 * 86400_000 }] }],
      ["/rest/socialActions/urn%3Ali%3Ashare%3A7001/comments", { elements: comments }],
    ]);
    const result = await linkedin.read({ env: { KC_LINKEDIN_TOKEN: SECRET }, fetchImpl, now: NOW });
    assert.equal(result.connected, true);
    assert.equal(result.items.length, 2);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.headers.Authorization, `Bearer ${SECRET}`);
      assert.match(call.headers["LinkedIn-Version"], /^\d{6}$/);
      assert.equal(call.headers["X-Restli-Protocol-Version"], "2.0.0");
      assert.ok(!call.url.includes(SECRET));
    }
  });

  it("treats a refused token as a sign-in problem", async () => {
    const { fetchImpl } = mockFetch([["/rest/posts", { status: 403, body: { status: 403, serviceErrorCode: 100, message: "Not enough permissions to access: posts.FINDER-author" } }]]);
    await assert.rejects(linkedin.read({ env: { KC_LINKEDIN_TOKEN: SECRET }, fetchImpl, now: NOW }), (error) => error instanceof ApiError && error.auth);
    assert.match(linkedin.REJECTED_NOTE, /Community Management API/);
  });

  it("replies as the organization, nested under the member's comment", async () => {
    const urn = "urn:li:comment:(urn:li:activity:9001,6001)";
    const { fetchImpl, calls } = mockFetch([["POST https://api.linkedin.com/rest/socialActions/", { status: 201, body: { id: "6100" } }]]);
    const sent = await linkedin.send({ env: { KC_LINKEDIN_TOKEN: SECRET }, fetchImpl, item: { external_id: urn, post_external_id: "urn:li:activity:9001" }, text: "Yes, it is." });
    assert.deepEqual(sent, { id: "6100" });
    assert.ok(calls[0].url.endsWith(`/socialActions/${encodeURIComponent(urn)}/comments`));
    assert.deepEqual(JSON.parse(calls[0].body), { actor: "urn:li:organization:146763118", object: "urn:li:activity:9001", parentComment: urn, message: { text: "Yes, it is." } });
  });
});

describe("shared helpers", () => {
  it("normalizes Graph, ISO and epoch times", () => {
    assert.equal(toIso("2026-11-16T09:30:00+0000"), "2026-11-16T09:30:00.000Z");
    assert.equal(toIso("2026-11-16T04:30:00-05:00"), "2026-11-16T09:30:00.000Z");
    assert.equal(toIso(1794907800000), new Date(1794907800000).toISOString());
    assert.equal(toIso("not a date"), null);
    assert.equal(toIso(undefined), null);
  });
});
