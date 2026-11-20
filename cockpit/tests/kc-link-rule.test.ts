import { describe, expect, it } from "vitest";
import { groupLinkCounts, linkPolicy, replyLinkRule, type KcGroup } from "@/lib/kc-replies";

const group = (id: string, stats: KcGroup["stats"]): KcGroup => ({ id, name: `g${id}`, meta: "", lane: "ems", status: "joined", url: `https://www.facebook.com/groups/${id}/`, stats });
const groups = [
  group("1", { promotion: "allowed", rule_note: "Rules allow job posts and links.", rules_checked_on: "2026-11-19" }),
  group("2", { promotion: "prohibited", rule_note: "Rule 4: No promotions or spam." }),
  group("3", {}),
];
const reply = (id: string, kind: "public_group" | "owned_page" = "public_group", promotion = "unknown") =>
  ({ source_kind: kind, source_url: `https://www.facebook.com/groups/${id}/posts/9/`, promotion });

describe("link rule shown on a reply", () => {
  it("follows the rules of the group the reply goes to", () => {
    expect(replyLinkRule(reply("1"), groups)).toEqual({ policy: "allowed", note: "Rules allow job posts and links.", checked: "2026-11-19" });
    expect(replyLinkRule(reply("2"), groups).policy).toBe("prohibited");
    expect(replyLinkRule(reply("3"), groups).policy).toBe("unknown");
  });
  it("falls back to the reply's own rule for a group that is not listed, and allows links on the Page itself", () => {
    expect(replyLinkRule(reply("404", "public_group", "prohibited"), groups).policy).toBe("prohibited");
    expect(replyLinkRule(reply("404"), groups).policy).toBe("unknown");
    expect(replyLinkRule(reply("1", "owned_page"), groups).policy).toBe("allowed");
  });
  it("treats anything unrecognised as unknown and counts groups by rule", () => {
    expect(linkPolicy("maybe")).toBe("unknown");
    expect(linkPolicy(null)).toBe("unknown");
    expect(groupLinkCounts(groups)).toEqual({ allowed: 1, prohibited: 1, unknown: 1 });
  });
});
