import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);
const rest = vi.hoisted(() => ({ sbSelect: vi.fn(), sbInsert: vi.fn(), sbUpdate: vi.fn(), supabaseConfigured: vi.fn(() => true) }));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/supabase-rest", () => rest);
vi.mock("../app/components/Chrome", () => ({ Chrome: ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => React.createElement("main", null, React.createElement("h1", null, title), React.createElement("p", null, sub), children) }));
import { NETWORKS, REPLY_MAX, bucketOf, filterByNetwork, networkCounts, parseNetworkFilter, pendingDecision, safeUrl, sendsAutomatically, snoozedUntil, sortNewestFirst, syncStrip, validateEngagementAction, waitingLabel, EngagementConflictError, type EngagementAction, type EngagementItem, type EngagementSync } from "../src/lib/kc-engagement";
import { fetchEngagement, queueEngagementAction } from "../src/lib/kc-engagement-data";
import { EngagementCard } from "../app/engagement/EngagementCard";
import EngagementPage from "../app/engagement/page";
import { TABS } from "../app/components/tabs";

const id = "11111111-1111-4111-8111-111111111111";
const id2 = "22222222-2222-4222-8222-222222222222";
const NOW = Date.parse("2026-11-17T12:00:00Z");

const item = (patch: Partial<EngagementItem> = {}): EngagementItem => ({
  id, network: "facebook", external_id: "1_2", post_url: "https://www.facebook.com/1/posts/2?comment_id=3", post_excerpt: "Night shift pay", author_name: "Dana R",
  text: "Is this for RNs too?", commented_at: "2026-11-16T09:30:00Z", status: "open", reply_draft: null, approved_reply: null, snoozed_until: null,
  delivery_result: null, synced_at: "2026-11-17T11:00:00Z", created_at: "2026-11-16T10:00:00Z", updated_at: "2026-11-16T10:00:00Z", revision: 1, ...patch });
const act = (patch: Partial<EngagementAction> = {}): EngagementAction => ({
  id: 1, item_id: id, action: "approve", draft: "Yes.", snooze_until: null, base_revision: 1, created_at: "2026-11-17T11:30:00Z", applied_at: null, result: null, ...patch });
const connected = (network: EngagementSync["network"], patch: Partial<EngagementSync> = {}): EngagementSync => ({ network, connected: true, last_synced_at: "2026-11-17T11:00:00Z", last_error: null, note: null, ...patch });

beforeEach(() => vi.clearAllMocks());

describe("action validation", () => {
  it("accepts each action with what it needs", () => {
    expect(validateEngagementAction({ id, action: "dismiss", revision: 2 })).toEqual({ ok: true, value: { id, action: "dismiss", revision: 2 } });
    expect(validateEngagementAction({ id, action: "save", revision: 1, draft: "  Thanks for asking.  " })).toEqual({ ok: true, value: { id, action: "save", revision: 1, draft: "Thanks for asking." } });
    expect(validateEngagementAction({ id, action: "approve", revision: 1, draft: "Yes." })).toEqual({ ok: true, value: { id, action: "approve", revision: 1, draft: "Yes." } });
    expect(validateEngagementAction({ id, action: "snooze", revision: 1, hours: 24 }, NOW)).toEqual({ ok: true, value: { id, action: "snooze", revision: 1, snooze_until: "2026-11-18T12:00:00.000Z" } });
  });
  it("rejects malformed input before anything is queued", () => {
    expect(validateEngagementAction(null).ok).toBe(false);
    expect(validateEngagementAction({ id: "1; drop table", action: "dismiss", revision: 1 })).toEqual({ ok: false, error: "Unknown comment." });
    expect(validateEngagementAction({ id: `${id}&status=eq.sent`, action: "dismiss", revision: 1 }).ok).toBe(false);
    expect(validateEngagementAction({ id, action: "send", revision: 1 })).toEqual({ ok: false, error: "Unknown action." });
    expect(validateEngagementAction({ id, action: "posted", revision: 1 }).ok).toBe(false);
    expect(validateEngagementAction({ id, action: "dismiss" })).toEqual({ ok: false, error: "Missing revision; refresh the page." });
    expect(validateEngagementAction({ id, action: "dismiss", revision: 0 }).ok).toBe(false);
    expect(validateEngagementAction({ id, action: "dismiss", revision: "1" }).ok).toBe(false);
    expect(validateEngagementAction({ id, action: "approve", revision: 1, draft: "   " })).toEqual({ ok: false, error: "The reply is empty." });
    expect(validateEngagementAction({ id, action: "approve", revision: 1 }).ok).toBe(false);
    expect(validateEngagementAction({ id, action: "save", revision: 1, draft: "x".repeat(REPLY_MAX + 1) }).ok).toBe(false);
    expect(validateEngagementAction({ id, action: "save", revision: 1, draft: "x".repeat(REPLY_MAX) }).ok).toBe(true);
    expect(validateEngagementAction({ id, action: "snooze", revision: 1, hours: 9999 })).toEqual({ ok: false, error: "Unknown snooze length." });
    expect(validateEngagementAction({ id, action: "snooze", revision: 1, snooze_until: "2099-01-01T00:00:00Z" }).ok).toBe(false);
  });
  it("ignores a draft sent with dismiss or snooze", () => {
    const parsed = validateEngagementAction({ id, action: "dismiss", revision: 1, draft: "should not be stored" });
    expect(parsed.ok && "draft" in parsed.value).toBe(false);
  });
});

describe("pending decisions", () => {
  it("reports the owner's unapplied decision, with dismiss winning", () => {
    expect(pendingDecision([], id)).toBeNull();
    expect(pendingDecision([act({ action: "save" })], id)).toBeNull();
    expect(pendingDecision([act()], id)).toBe("approved");
    expect(pendingDecision([act(), act({ id: 2, action: "snooze" })], id)).toBe("snoozed");
    expect(pendingDecision([act(), act({ id: 2, action: "snooze" }), act({ id: 3, action: "dismiss" })], id)).toBe("dismissed");
    expect(pendingDecision([act({ applied_at: "2026-11-17T11:45:00Z" })], id)).toBeNull();
    expect(pendingDecision([act({ item_id: id2 })], id)).toBeNull();
  });
  it("lists queued actions oldest first", () => {
    expect(waitingLabel([act({ id: 5 }), act({ id: 2, action: "save" }), act({ id: 9, applied_at: "2026-11-17T11:45:00Z", action: "dismiss" })], id)).toBe("save edit, approve");
    expect(waitingLabel([], id)).toBeNull();
  });
  it("reads a snooze from the row or a queued action, only while it is in the future", () => {
    expect(snoozedUntil(item({ status: "snoozed", snoozed_until: "2026-11-18T00:00:00Z" }), [], NOW)).toBe("2026-11-18T00:00:00Z");
    expect(snoozedUntil(item({ status: "snoozed", snoozed_until: "2026-11-17T00:00:00Z" }), [], NOW)).toBeNull();
    expect(snoozedUntil(item({ status: "open", snoozed_until: "2026-11-18T00:00:00Z" }), [], NOW)).toBeNull();
    expect(snoozedUntil(item(), [act({ action: "snooze", snooze_until: "2026-11-19T00:00:00Z" })], NOW)).toBe("2026-11-19T00:00:00Z");
  });
  it("places each comment in one bucket", () => {
    expect(bucketOf(item(), [], NOW)).toBe("open");
    expect(bucketOf(item({ status: "failed" }), [], NOW)).toBe("open");
    expect(bucketOf(item({ status: "approved" }), [], NOW)).toBe("approved");
    expect(bucketOf(item(), [act()], NOW)).toBe("approved");
    expect(bucketOf(item({ status: "snoozed", snoozed_until: "2026-11-18T00:00:00Z" }), [], NOW)).toBe("snoozed");
    expect(bucketOf(item({ status: "snoozed", snoozed_until: "2026-11-17T00:00:00Z" }), [], NOW)).toBe("open");
    expect(bucketOf(item(), [act({ action: "snooze", snooze_until: "2026-11-19T00:00:00Z" })], NOW)).toBe("snoozed");
    expect(bucketOf(item(), [act({ action: "dismiss" })], NOW)).toBe("done");
    expect(bucketOf(item({ status: "sent" }), [], NOW)).toBe("done");
    expect(bucketOf(item({ status: "dismissed" }), [act()], NOW)).toBe("done");
  });
});

describe("sorting and network filter", () => {
  const rows = [
    item({ id: "a", network: "youtube", commented_at: "2026-11-10T00:00:00Z" }),
    item({ id: "b", network: "facebook", commented_at: "2026-11-16T00:00:00Z" }),
    item({ id: "c", network: "instagram", commented_at: null, created_at: "2026-11-12T00:00:00Z" }),
    item({ id: "d", network: "facebook", commented_at: "2026-11-16T00:00:00Z" }),
    item({ id: "e", network: "linkedin", commented_at: "garbage", created_at: "2026-11-01T00:00:00Z" }),
  ];
  it("sorts newest first across networks without changing the input", () => {
    expect(sortNewestFirst(rows).map((r) => r.id)).toEqual(["b", "d", "c", "a", "e"]);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("filters by network and treats anything unknown as all", () => {
    expect(filterByNetwork(rows, "facebook").map((r) => r.id)).toEqual(["b", "d"]);
    expect(filterByNetwork(rows, "tiktok")).toEqual([]);
    expect(filterByNetwork(rows, "all")).toHaveLength(5);
    expect(parseNetworkFilter("youtube")).toBe("youtube");
    expect(parseNetworkFilter("myspace")).toBe("all");
    expect(parseNetworkFilter(["facebook", "youtube"])).toBe("all");
    expect(parseNetworkFilter(undefined)).toBe("all");
  });
  it("counts per network", () => {
    expect(networkCounts(rows)).toEqual({ all: 5, facebook: 2, instagram: 1, youtube: 1, linkedin: 1, tiktok: 0 });
  });
  it("renders only https links", () => {
    expect(safeUrl("https://www.youtube.com/watch?v=abc&lc=1")).toBe("https://www.youtube.com/watch?v=abc&lc=1");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("http://example.com")).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});

describe("network status strip", () => {
  it("always lists all five networks in a fixed order", () => {
    const strip = syncStrip([]);
    expect(strip.map((s) => s.network)).toEqual([...NETWORKS]);
    expect(strip.every((s) => s.state === "never" && s.detail.includes("Run the engagement sync job"))).toBe(true);
  });
  it("shows the owner's next step for a network that is not connected", () => {
    const strip = syncStrip([connected("facebook"), { network: "tiktok", connected: false, last_synced_at: null, last_error: null, note: "Use the Metricool inbox." },
      { network: "linkedin", connected: false, last_synced_at: "2026-11-01T00:00:00Z", last_error: "LinkedIn API 401", note: " " }]);
    expect(strip.find((s) => s.network === "facebook")).toMatchObject({ state: "connected", last_synced_at: "2026-11-17T11:00:00Z", detail: "" });
    expect(strip.find((s) => s.network === "tiktok")).toMatchObject({ state: "not_connected", detail: "Use the Metricool inbox." });
    expect(strip.find((s) => s.network === "linkedin")).toMatchObject({ state: "not_connected", detail: "LinkedIn API 401", last_synced_at: "2026-11-01T00:00:00Z" });
    expect(strip.find((s) => s.network === "youtube")?.state).toBe("never");
  });
  it("keeps a connected network connected but shows a failed read", () => {
    expect(syncStrip([connected("youtube", { last_error: "YouTube Data API 403: Quota exceeded", note: "Reading only." })])[2].detail).toBe("Last read failed: YouTube Data API 403: Quota exceeded Reading only.");
  });
  it("only connected Facebook, Instagram and LinkedIn send automatically", () => {
    const sync = [connected("facebook"), connected("youtube"), connected("tiktok"), connected("linkedin", { connected: false })];
    expect(sendsAutomatically("facebook", sync)).toBe(true);
    expect(sendsAutomatically("instagram", sync)).toBe(false);
    expect(sendsAutomatically("linkedin", sync)).toBe(false);
    expect(sendsAutomatically("youtube", sync)).toBe(false);
    expect(sendsAutomatically("tiktok", sync)).toBe(false);
  });
});

describe("queueing an action on the server", () => {
  const approve = { id, action: "approve" as const, revision: 3, draft: "Yes." };
  it("inserts one queue row and never updates the comment", async () => {
    rest.sbSelect.mockResolvedValueOnce([{ id, status: "open", revision: 3 }]);
    await queueEngagementAction(approve);
    expect(rest.sbInsert).toHaveBeenCalledTimes(1);
    expect(rest.sbInsert).toHaveBeenCalledWith("kc_engagement_actions", { item_id: id, action: "approve", base_revision: 3, draft: "Yes.", snooze_until: null });
    expect(rest.sbUpdate).not.toHaveBeenCalled();
  });
  it("queues a snooze with its time and no draft", async () => {
    rest.sbSelect.mockResolvedValueOnce([{ id, status: "failed", revision: 1 }]);
    await queueEngagementAction({ id, action: "snooze", revision: 1, snooze_until: "2026-11-18T12:00:00.000Z" });
    expect(rest.sbInsert).toHaveBeenCalledWith("kc_engagement_actions", { item_id: id, action: "snooze", base_revision: 1, draft: null, snooze_until: "2026-11-18T12:00:00.000Z" });
  });
  it.each([
    ["a missing comment", []],
    ["a sent comment", [{ id, status: "sent", revision: 3 }]],
    ["a dismissed comment", [{ id, status: "dismissed", revision: 3 }]],
    ["a changed revision", [{ id, status: "open", revision: 4 }]],
  ])("refuses %s without queueing", async (_label, rows) => {
    rest.sbSelect.mockResolvedValueOnce(rows);
    await expect(queueEngagementAction(approve)).rejects.toBeInstanceOf(EngagementConflictError);
    expect(rest.sbInsert).not.toHaveBeenCalled();
  });
  it("returns null rather than an empty inbox when Supabase is unavailable", async () => {
    rest.supabaseConfigured.mockReturnValueOnce(false);
    expect(await fetchEngagement()).toBeNull();
    rest.sbSelect.mockRejectedValue(new Error("down"));
    expect(await fetchEngagement()).toBeNull();
    rest.sbSelect.mockReset();
  });
  it("reads live comments, recent closed ones, queued actions and network status", async () => {
    rest.sbSelect.mockResolvedValue([]);
    expect(await fetchEngagement()).toEqual({ items: [], done: [], actions: [], sync: [] });
    expect(rest.sbSelect.mock.calls.map((c) => c[0])).toEqual(["kc_engagement_items", "kc_engagement_items", "kc_engagement_actions", "kc_engagement_sync"]);
    expect(rest.sbSelect.mock.calls[0][1]).toContain("status=in.(open,approved,snoozed,failed)");
    rest.sbSelect.mockReset();
  });
});

describe("comment card", () => {
  const render = (props: Partial<React.ComponentProps<typeof EngagementCard>> = {}) =>
    renderToStaticMarkup(React.createElement(EngagementCard, { item: item(), autoSend: true, waiting: null, lastResult: null, received: "Nov 16, 4:30 AM ET", ...props }));
  it("shows the comment, its network, a reply box and the three decisions", () => {
    const html = render();
    expect(html).toContain("Is this for RNs too?");
    expect(html).toContain("Facebook");
    expect(html).toContain("Dana R");
    expect(html).toContain("<textarea");
    expect(html).toContain(">Approve</button>");
    expect(html).toContain(">Dismiss</button>");
    expect(html).toContain("Snooze a day");
    expect(html).toContain("Snooze 3 days");
    expect(html).toContain('href="https://www.facebook.com/1/posts/2?comment_id=3"');
  });
  it("cannot approve an empty reply", () => {
    expect(render()).toMatch(/<button class="token-btn approve" disabled="">Approve<\/button>/);
    expect(render({ item: item({ reply_draft: "Yes, RN roles too." }) })).toMatch(/<button class="token-btn approve">Approve<\/button>/);
  });
  it("says who posts an approved reply", () => {
    expect(render({ item: item({ status: "approved", approved_reply: "Yes." }) })).toContain("Sends on Facebook on the next sync run.");
    expect(render({ item: item({ network: "youtube", status: "approved", approved_reply: "Yes." }), autoSend: false })).toContain("Post this reply by hand on YouTube, then dismiss.");
  });
  it("shows why a send failed and escapes comment text", () => {
    const html = render({ item: item({ status: "failed", delivery_result: "Not sent: The comment changed since approval; review it again.", text: "<script>alert(1)</script>", post_url: "javascript:alert(1)" }) });
    expect(html).toContain("send failed");
    expect(html).toContain("The comment changed since approval");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });
});

describe("engagement page", () => {
  const page = async (network?: string, data = {
    items: [item(), item({ id: id2, network: "youtube", author_name: "@viewer", text: "Great breakdown", commented_at: "2026-11-17T08:00:00Z", post_url: "https://www.youtube.com/watch?v=abc&lc=1" })],
    done: [item({ id: "33333333-3333-4333-8333-333333333333", status: "sent", author_name: "Sent Person", delivery_result: "Sent on Facebook." })],
    actions: [] as EngagementAction[],
    sync: [connected("facebook"), connected("youtube", { note: "Reading only: replying on YouTube needs an OAuth sign-in." }), { network: "tiktok" as const, connected: false, last_synced_at: null, last_error: null, note: "Use the Metricool inbox." }],
  }) => {
    rest.sbSelect.mockResolvedValueOnce(data.items).mockResolvedValueOnce(data.done).mockResolvedValueOnce(data.actions).mockResolvedValueOnce(data.sync);
    return renderToStaticMarkup(await EngagementPage({ searchParams: Promise.resolve(network ? { network } : {}) }));
  };
  it("lists waiting comments from every network newest first with a status strip", async () => {
    const html = await page();
    expect(html.indexOf("Great breakdown")).toBeGreaterThan(-1);
    expect(html.indexOf("Great breakdown")).toBeLessThan(html.indexOf("Is this for RNs too?"));
    expect(html).toContain("2 comments waiting · 2 of 5 networks connected");
    expect(html).toContain("All (2)");
    expect(html).toContain("YouTube (1)");
    expect(html).toContain("TikTok (0)");
    expect(html).toContain("Not connected: Use the Metricool inbox.");
    expect(html).toContain("Not connected: Not checked yet. Run the engagement sync job.");
    expect(html).toContain("last synced Nov 17");
    expect(html).toContain("Sent Person");
  });
  it("filters by network from the address", async () => {
    const html = await page("youtube");
    expect(html).toContain("Great breakdown");
    expect(html).not.toContain("Is this for RNs too?");
    expect(html).not.toContain("Sent Person");
    expect(html).toContain('aria-current="page" href="/engagement?network=youtube"');
    expect(await page("tiktok")).toContain("No comments waiting on TikTok.");
  });
  it("moves a comment out of the waiting list as soon as a dismiss or snooze is queued", async () => {
    const base = { done: [], sync: [], items: [item(), item({ id: id2, text: "Second comment" })] };
    const html = await page(undefined, { ...base, actions: [act({ action: "dismiss" }), act({ id: 2, item_id: id2, action: "snooze", snooze_until: "2099-01-01T00:00:00Z" })] });
    expect(html).toContain("0 comments waiting");
    expect(html).toContain("Snoozed (1)");
    expect(html).not.toContain("<textarea");
  });
  it("says so when the inbox cannot be loaded", async () => {
    rest.supabaseConfigured.mockReturnValueOnce(false);
    const html = renderToStaticMarkup(await EngagementPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Comments could not be loaded");
  });
});

describe("navigation", () => {
  it("lists Engagement next to Replies and keeps Replies", () => {
    const hrefs = TABS.map((t) => t.href);
    expect(hrefs.indexOf("/engagement")).toBe(hrefs.indexOf("/replies") + 1);
    expect(TABS.find((t) => t.href === "/engagement")?.label).toBe("Engagement");
  });
});
