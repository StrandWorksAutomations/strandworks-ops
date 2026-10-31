import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { pendingDecision, resultLine, safeLinks, snoozedUntil, validateGroupJoined, validatePagePostAction, validateReplyAction, type KcReply } from "../src/lib/kc-replies";
import { JobLinks, ReplyCard } from "../app/replies/ReplyCard";
import { GroupsPanel } from "../app/replies/GroupsPanel";

const id = "0123456789abcdef01234567";

describe("kc reply actions", () => {
  it("needs a known reply, action and revision", () => {
    expect(validateReplyAction({ id, action: "dismiss", revision: 3 })).toEqual({ ok: true, value: { id, action: "dismiss", revision: 3 } });
    expect(validateReplyAction({ id: "x;drop", action: "dismiss", revision: 3 }).ok).toBe(false);
    expect(validateReplyAction({ id, action: "send", revision: 3 }).ok).toBe(false);
    expect(validateReplyAction({ id, action: "posted" }).ok).toBe(false);
    expect(validateReplyAction(null).ok).toBe(false);
  });
  it("approve and save carry a trimmed, bounded draft", () => {
    expect(validateReplyAction({ id, action: "approve", revision: 1, draft: "  Hi  " })).toEqual({ ok: true, value: { id, action: "approve", revision: 1, draft: "Hi" } });
    expect(validateReplyAction({ id, action: "save", revision: 1, draft: " " }).ok).toBe(false);
    expect(validateReplyAction({ id, action: "approve", revision: 1, draft: "x".repeat(4001) }).ok).toBe(false);
  });
});

describe("job links", () => {
  it("renders only https employer links, labelled as not part of the reply", () => {
    const html = renderToStaticMarkup(React.createElement(JobLinks, { reply: { job_links: [
      { label: "AMR: Paramedic, Santa Cruz, California, $39.04/hour", url: "https://careers.gmr.net/gmr/jobs/57492" },
      { label: "bad", url: "javascript:alert(1)" },
    ] } }));
    expect(html).toContain("https://careers.gmr.net/gmr/jobs/57492");
    expect(html).toContain("not part of the reply");
    expect(html).not.toContain("javascript:");
    expect(safeLinks("nope")).toEqual([]);
    expect(renderToStaticMarkup(React.createElement(JobLinks, { reply: { job_links: [] } }))).toBe("");
  });
});

describe("pending decisions", () => {
  const a = (action: "approve" | "dismiss" | "posted" | "save", applied_at: string | null = null, item_id = id) => ({ item_id, action, applied_at });
  it("a queued dismiss or posted closes the reply before the Mac applies it", () => {
    expect(pendingDecision([a("dismiss")], id)).toBe("closed");
    expect(pendingDecision([a("approve"), a("posted")], id)).toBe("closed");
    expect(pendingDecision([a("approve")], id)).toBe("approved");
  });
  it("ignores applied actions and other replies", () => {
    expect(pendingDecision([a("dismiss", "2026-10-30T00:00:00Z"), a("dismiss", null, "f".repeat(24))], id)).toBeNull();
    expect(pendingDecision([a("save")], id)).toBeNull();
  });
});

describe("dismiss reasons and snooze", () => {
  it("accepts only the listed reasons and snooze lengths", () => {
    expect(validateReplyAction({ id, action: "dismiss", revision: 1, reason: "Bad tone" })).toEqual({ ok: true, value: { id, action: "dismiss", revision: 1, reason: "Bad tone" } });
    expect(validateReplyAction({ id, action: "dismiss", revision: 1, reason: "<script>" }).ok).toBe(false);
    const now = Date.parse("2026-10-31T12:00:00Z");
    expect(validateReplyAction({ id, action: "snooze", revision: 1, hours: 24 }, now)).toEqual({ ok: true, value: { id, action: "snooze", revision: 1, snooze_until: "2026-11-01T12:00:00.000Z" } });
    expect(validateReplyAction({ id, action: "snooze", revision: 1, hours: 9999 }).ok).toBe(false);
  });
  it("a snooze hides the reply until it runs out, even before the Mac applies it", () => {
    const now = Date.parse("2026-10-31T12:00:00Z");
    const queued = [{ item_id: id, action: "snooze" as const, applied_at: null, snooze_until: "2026-11-01T12:00:00Z" }];
    expect(snoozedUntil({ id, snoozed_until: null }, queued, now)).toBe("2026-11-01T12:00:00Z");
    expect(snoozedUntil({ id, snoozed_until: "2026-10-30T00:00:00Z" }, [], now)).toBeNull();
    expect(pendingDecision(queued, id)).toBe("snoozed");
  });
});

describe("results, weekly post and groups", () => {
  it("summarizes what happened after posting", () => {
    expect(resultLine(null)).toBeNull();
    expect(resultLine({ checks: 1, checked_at: "", found: true, gone: false, reactions: 1, replies: 3 })).toBe("3 replies · 1 reaction");
    expect(resultLine({ checks: 1, checked_at: "", found: false, gone: true, reactions: 0, replies: 0 })).toBe("post removed");
  });
  it("validates weekly post and group actions", () => {
    expect(validatePagePostAction({ id: "2026-W44", action: "approve", draft: " New this week " })).toEqual({ ok: true, value: { id: "2026-W44", action: "approve", draft: "New this week" } });
    expect(validatePagePostAction({ id: "W44;drop", action: "posted" }).ok).toBe(false);
    expect(validatePagePostAction({ id: "2026-W44", action: "publish" }).ok).toBe(false);
    expect(validateGroupJoined({ group_id: "1247725929185948" }).ok).toBe(true);
    expect(validateGroupJoined({ group_id: "../x" }).ok).toBe(false);
  });
  it("cards show what the reply points to and mark follow-ups", () => {
    const reply: KcReply = { id, revision: 1, status: "needs_review", source_kind: "public_group", source_name: "G", source_url: "https://www.facebook.com/groups/1/posts/2/",
      title: "t", post_text: "What does AMR pay?", context: "Original post: x", topic: "offers", draft: "AMR lists $30/hour.", approved_draft: null, promotion: "unknown",
      job_links: [], evidence: [], delivery_state: null, created_at: null, synced_at: "", kind: "follow_up", snoozed_until: null, results: null, summary: "AMR: Paramedic, Columbus, OH" };
    const html = renderToStaticMarkup(React.createElement(ReplyCard, { reply, waiting: null, lastResult: null, received: "" }));
    expect(html).toContain("Points to");
    expect(html).toContain("AMR: Paramedic, Columbus, OH");
    expect(html).toContain("reply to your comment");
    expect(html).toContain("Snooze a day");
  });
  it("groups list joined stats and groups to join", () => {
    const html = renderToStaticMarkup(React.createElement(GroupsPanel, { groups: [
      { id: "1", name: "EMS Jobs", meta: "", lane: "ems", status: "joined", url: "https://www.facebook.com/groups/1/", stats: { posted: 2, replies_back: 5, quiet: true } },
      { id: "2", name: "Travel CNAs", meta: "Public 215K", lane: "cna", status: "to_join", url: "https://www.facebook.com/groups/2/", stats: {} },
    ] }));
    expect(html).toContain("EMS Jobs");
    expect(html).toContain("paused");
    expect(html).toContain("Groups to join (1)");
    expect(html).toContain("I joined it");
  });
});
