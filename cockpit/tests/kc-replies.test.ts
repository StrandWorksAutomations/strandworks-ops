import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { KINETIC_PAGE_ID, facebookGroupId, filterGroups, groupFilterCounts, latestJoinLimit, pageAccessLabel, pageAccessReady, pendingDecision, replyGroupIds, replyPageAccess, resultLine, safeLinks, snoozedUntil, validateGroupJoined, validatePagePostAction, validateReplyAction, type KcGroup, type KcPageAccess, type KcReply } from "../src/lib/kc-replies";
import { JobLinks, ReplyCard } from "../app/replies/ReplyCard";
import { GroupsPanel } from "../app/replies/GroupsPanel";

const id = "0123456789abcdef01234567";
const readyAccess: KcPageAccess = { status: "ready", actor_id: KINETIC_PAGE_ID, checked_at: new Date().toISOString(), proof_url: "https://www.facebook.com/groups/1/posts/2/", composer_label: "Comment as Kinetic Clinician", note: "Comment box showed Kinetic Clinician." };

describe("full group inventory filters", () => {
  const group = (id: string, name: string, status: KcPageAccess["status"] = "unknown"): KcGroup => ({ id, name, meta: "Public group", lane: "ems", status: "joined", url: `https://www.facebook.com/groups/${id}/`,
    stats: { page_access: { ...readyAccess, status, proof_url: `https://www.facebook.com/groups/${id}/` } } });
  const inventory: KcGroup[] = [group("1", "EMS Jobs", "ready"), group("2", "Travel Nursing", "pending"), group("3", "Private Clinicians", "profile_only"), group("4", "Unavailable Group", "unavailable"),
    ...Array.from({ length: 152 }, (_, index) => group(String(index + 5), `Personal group ${index + 5}`))];

  it("keeps all 156 groups and counts unavailable and profile-only together", () => {
    expect(groupFilterCounts(inventory)).toEqual({ all: 156, ready: 1, pending: 1, unavailable: 2, unknown: 152 });
    expect(filterGroups(inventory, "all", "")).toHaveLength(156);
    expect(filterGroups(inventory, "unknown", "")).toHaveLength(152);
    expect(inventory).toHaveLength(156);
  });
  it("combines case-insensitive text search with the chosen Page access status", () => {
    expect(filterGroups(inventory, "all", " nursing TRAVEL ").map((g) => g.id)).toEqual(["2"]);
    expect(filterGroups(inventory, "ready", "nursing")).toEqual([]);
    expect(filterGroups(inventory, "pending", "nursing").map((g) => g.id)).toEqual(["2"]);
    const aliased = { ...inventory[0], stats: { ...inventory[0].stats, group_aliases: ["307401089297853"] } };
    expect(filterGroups([aliased], "all", "307401089297853")).toEqual([aliased]);
  });
  it("sorts usable and pending groups first without relabelling stale checks as usable", () => {
    const stale = { ...inventory[0], id: "999", stats: { page_access: { ...readyAccess, checked_at: "2020-01-01T00:00:00Z" } } };
    const rows = filterGroups([inventory[2], stale, inventory[1], inventory[0]], "all", "");
    expect(rows.slice(0, 2).map((g) => g.id)).toEqual(["1", "2"]);
    expect(groupFilterCounts([stale]).unknown).toBe(1);
  });
  it("defaults to usable groups and exposes search and the complete inventory count", () => {
    const html = renderToStaticMarkup(React.createElement(GroupsPanel, { groups: inventory }));
    expect(html).toContain('type="search"');
    expect(html).toContain("Can comment (1)");
    expect(html).toContain("Pending (1)");
    expect(html).toContain("Unavailable (2)");
    expect(html).toContain("Needs check (152)");
    expect(html).toContain("All (156)");
    expect(html).toContain("Showing 1 of 156 groups");
    expect(html).toContain("EMS Jobs");
    expect(html).not.toContain("Travel Nursing");
  });
});

describe("observed group join limits", () => {
  const now = Date.parse("2026-11-02T01:00:00Z");
  const event = { observed_at: "2026-11-02T00:54:28.205374+00:00", source_group_id: "860364397721438", source_url: "https://www.facebook.com/groups/860364397721438/", expires_at: null };
  const limited: KcGroup = { id: event.source_group_id, name: "Kentucky EMS", meta: "", lane: "ems", status: "joined", url: event.source_url, stats: { page_access: { ...readyAccess, status: "unavailable" }, last_join_limit: event } };
  it("finds the event in the full inventory even when the selected ready filter hides its group", () => {
    const usable: KcGroup = { ...limited, id: "1", name: "EMS Jobs", stats: { page_access: readyAccess } };
    const all = [usable, limited];
    expect(filterGroups(all, "ready", "").map((g) => g.id)).toEqual(["1"]);
    expect(latestJoinLimit(all, now)).toEqual(event);
  });
  it("selects the most recent observed event without inventing an expiry", () => {
    const older = { ...limited, stats: { last_join_limit: { ...event, observed_at: "2026-11-01T12:00:00Z" } } };
    expect(latestJoinLimit([limited, older], now)).toEqual(event);
    expect(latestJoinLimit([limited, older], now)?.expires_at).toBeNull();
  });
  it("does not keep showing stale, future, invalid, or unrelated observations", () => {
    for (const observed_at of ["2026-10-01T12:00:00Z", "2026-11-03T12:00:00Z", "invalid", "2026-11-02T00:54:28"]) {
      expect(latestJoinLimit([{ ...limited, stats: { last_join_limit: { ...event, observed_at } } }], now)).toBeNull();
    }
    expect(latestJoinLimit([{ ...limited, id: "other" }], now)).toBeNull();
    expect(latestJoinLimit([], now)).toBeNull();
  });
});

describe("Kinetic Clinician group access", () => {
  it("never treats personal membership, a pending request, or an unchecked Page as ready", () => {
    expect(pageAccessReady(undefined)).toBe(false);
    for (const status of ["unknown", "pending", "profile_only", "unavailable"] as const) {
      expect(pageAccessReady({ ...readyAccess, status })).toBe(false);
    }
    expect(pageAccessReady({ ...readyAccess, actor_id: "100028984382783" })).toBe(false);
    expect(pageAccessReady({ ...readyAccess, checked_at: null })).toBe(false);
    expect(pageAccessReady({ ...readyAccess, checked_at: "2020-01-01T00:00:00Z" })).toBe(false);
    expect(pageAccessReady({ ...readyAccess, composer_label: "Comment as Jonathan Bouren" })).toBe(false);
    expect(pageAccessReady({ ...readyAccess, proof_url: "https://example.com/groups/1/" })).toBe(false);
    expect(pageAccessReady(readyAccess, "other-group")).toBe(false);
    expect(pageAccessReady(readyAccess, "1")).toBe(true);
  });
  it("resolves the actual group, ignoring unknown or unrelated ready groups", () => {
    const reply = { source_kind: "public_group" as const, source_url: "https://www.facebook.com/groups/1/posts/2/" };
    const group = { id: "1", name: "EMS Jobs", meta: "", lane: "ems", status: "joined" as const, url: "https://www.facebook.com/groups/1/", stats: {} };
    expect(replyPageAccess(reply, [group])?.status).toBe("unknown");
    expect(replyPageAccess(reply, [{ ...group, stats: { page_access: readyAccess } }])).toEqual(readyAccess);
    expect(replyPageAccess(reply, [{ ...group, id: "2", stats: { page_access: readyAccess } }])?.status).toBe("unknown");
    expect(replyPageAccess({ ...reply, source_kind: "owned_page" }, [])).toBeNull();
    expect(facebookGroupId("https://facebook.com.evil.example/groups/1/posts/2/")).toBeNull();
    expect(pageAccessLabel({ ...readyAccess, status: "pending" })).toBe("Page approval pending");
  });
  it("matches numeric Facebook permalinks to a group's verified readable alias in either direction", () => {
    const group = { id: "Complexmedicine", name: "Complex medicine", meta: "", lane: "ems", status: "joined" as const, url: "https://www.facebook.com/groups/Complexmedicine/",
      stats: { group_aliases: ["307401089297853"], page_access: { ...readyAccess, proof_url: "https://www.facebook.com/groups/Complexmedicine/" } } };
    const reply = { source_kind: "public_group" as const, source_url: "https://www.facebook.com/groups/307401089297853/posts/123/" };
    const ids = replyGroupIds(reply, [group]);
    expect(ids).toEqual(["Complexmedicine", "307401089297853"]);
    expect(replyPageAccess(reply, [group])).toEqual(group.stats.page_access);
    expect(pageAccessReady(replyPageAccess(reply, [group]), facebookGroupId(reply.source_url), ids)).toBe(true);
    expect(pageAccessReady({ ...readyAccess, proof_url: reply.source_url }, group.id, group.stats.group_aliases)).toBe(true);
    expect(replyGroupIds({ source_url: "https://www.facebook.com/groups/999/posts/123/" }, [group])).toEqual([]);
    expect(pageAccessReady({ ...readyAccess, proof_url: "https://www.facebook.com/groups/999/" }, group.id, group.stats.group_aliases)).toBe(false);
  });
});

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
    expect(html).toContain("Page access needs checking");
    expect(html).toMatch(/disabled=""[^>]*>Approve, copy and open post/);
    const readyHtml = renderToStaticMarkup(React.createElement(ReplyCard, { reply, pageAccess: readyAccess, waiting: null, lastResult: null, received: "" }));
    expect(readyHtml).toContain("Kinetic Clinician can comment");
    expect(readyHtml).not.toMatch(/disabled=""[^>]*>Approve, copy and open post/);
  });
  it("lists saved group results and access without a redundant scan action", () => {
    const html = renderToStaticMarkup(React.createElement(GroupsPanel, { groups: [
      { id: "1", name: "EMS Jobs", meta: "", lane: "ems", status: "joined", url: "https://www.facebook.com/groups/1/", stats: { posted: 2, replies_back: 5, quiet: true } },
      { id: "2", name: "Travel CNAs", meta: "Public 215K", lane: "cna", status: "to_join", url: "https://www.facebook.com/groups/2/", stats: {} },
    ] }));
    expect(html).toContain("EMS Jobs");
    expect(html).toContain("paused");
    expect(html).toContain("All (2)");
    expect(html).not.toContain("Add to scan list");
    expect(html).toContain("Saved group");
    expect(html).toContain("Candidate group");
    expect(html).not.toContain("I joined it");
    expect(html).toContain("Page access needs checking");
    expect(html).toContain("0 groups checked for commenting as Kinetic Clinician");
  });
});
