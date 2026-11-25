import { describe, expect, it } from "vitest";
import { approvalLinkIssue, containsReplyLink, outgoingLink, shortenReplyLink, sourceIdForLink, toggleReplyLink } from "../src/lib/reply-link-editor";
import { DRAFT_MAX, pendingReplyEdit, type KcReplyAction } from "../src/lib/kc-replies";

const link = { label: "Travel opening", url: "https://kineticclinician.com/j/feed/employer/position123", share_url: "https://kineticclinician.com/r/91a723face" };
const guide = { label: "Guide", url: "https://kineticclinician.com/pay/guide" };
const add = (draft: string, group = true) => toggleReplyLink(draft, link, group, false);

describe("editing the outgoing reply", () => {
  it("round-trips the owner's exact text and a disclosure added by the editor", () => {
    const prose = "My wording.  \n\nExisting line.\n";
    const added = add(prose);
    expect(added.draft).toBe(prose + "\nI run Kinetic Clinician.\n" + link.share_url);
    const both = toggleReplyLink(added.draft, guide, true, added.autoDisclosure);
    const one = toggleReplyLink(both.draft, link, true, both.autoDisclosure);
    expect(one.draft).toContain("I run Kinetic Clinician.\n" + guide.url);
    expect(toggleReplyLink(one.draft, guide, true, one.autoDisclosure).draft).toBe(prose);
  });
  it("preserves existing or manually edited disclosures and text", () => {
    const owner = "I run Kinetic Clinician. Happy to help.";
    const added = add(owner);
    expect(added.autoDisclosure).toBe(false);
    expect(toggleReplyLink(added.draft + "\nPS check back.", link, true, false).draft).toBe(owner + "\nPS check back.");
    const changed = add("Hi").draft.replace("Clinician.", "Clinician and I’ll check in.");
    expect(toggleReplyLink(changed, link, true, true).draft).toBe("Hi\nI run Kinetic Clinician and I’ll check in.");
    expect(add("Hi", false).draft).toBe("Hi\n" + link.share_url);
  });
  it("finds both equivalent forms and removes duplicates, never URL prefixes", () => {
    const text = "One " + link.url + " and another " + link.share_url + ".\n" + link.url + "4";
    const result = toggleReplyLink(text, link, false, false).draft;
    expect(result).toBe("One and another.\n" + link.url + "4");
    expect(containsReplyLink(result, link)).toBe(false);
    expect(containsReplyLink(link.url.replace("https://", "www.") + "/?utm_source=owner", link)).toBe(true);
  });
  it("shortens complete URL tokens without rewriting prose, tracking or other destinations", () => {
    const tracked = link.url + "?utm_source=owner";
    const text = "The first (" + link.url + "), then " + tracked + ". Keep " + link.url + "#notes.";
    expect(shortenReplyLink(text, link)).toBe(text.replace("(" + link.url + ")", "(" + link.share_url + ")"));
    expect(shortenReplyLink(tracked, link)).toBe(tracked);
    expect(shortenReplyLink(tracked, { ...link, url: tracked })).toBe(link.share_url);
  });
  it("recognizes a legacy employer URL only for the confirmed job", () => {
    const employer = "https://employer.test/positions/cross-country-duluth";
    const upgraded = { ...link, original_url: employer, job: { source_id: "feed:employer:position123", title: "Travel", employer: "Cross Country", checked_at: "2026-11-22", source_url: employer } };
    expect(shortenReplyLink("Apply " + employer + ".", upgraded)).toBe("Apply " + link.share_url + ".");
    expect(containsReplyLink(employer, { ...upgraded, job: { ...upgraded.job, source_id: "different" } })).toBe(false);
  });
  it("uses only valid shorter first-party resolver addresses and enforces the edit limit", () => {
    for (const invalid of ["https://evil.test/r/91a723face", "https://kineticclinician.com/r/offer", "https://kineticclinician.com/r/91A723FACE", link.share_url + "?p=1"]) {
      expect(outgoingLink({ ...link, share_url: invalid })).toBe(link.url);
    }
    expect(outgoingLink({ ...guide, share_url: link.share_url })).toBe(guide.url);
    expect(add("x".repeat(DRAFT_MAX)).draft).toBe("x".repeat(DRAFT_MAX));
    expect(add("x".repeat(DRAFT_MAX)).error).toContain("4000");
  });
  it("checks approval separately from editing and requires disclosure for linked group replies", () => {
    expect(approvalLinkIssue("I can help, e.g. with pay.", "unknown")).toBeNull();
    expect(approvalLinkIssue(link.share_url, "unknown")).toContain("unconfirmed");
    expect(approvalLinkIssue(link.share_url, "prohibited")).toContain("prohibits");
    expect(approvalLinkIssue(link.share_url, "allowed")).toContain("I run Kinetic Clinician");
    expect(approvalLinkIssue(add("Look here").draft, "allowed")).toBeNull();
  });
  it("reads only the exact KC website job route", () => {
    expect(sourceIdForLink("https://www.kineticclinician.com/j/feed/my%20agency/123")).toBe("feed:my agency:123");
    for (const url of ["https://other.test/j/feed/a/b", guide.url, link.share_url, link.url + "/%00", "https://kineticclinician.com@other.test/j/feed/a/b"]) {
      expect(sourceIdForLink(url)).toBeNull();
    }
  });
  it("restores only a pending draft for the current revision", () => {
    const save: KcReplyAction = { id: 3, item_id: "1", action: "save", created_at: "", applied_at: null, result: null, draft: "Edited", base_revision: 2 };
    const actions = [{ ...save, applied_at: "yesterday" }, { ...save, base_revision: 1 }, save, { ...save, action: "approve" as const, draft: "Earlier" }];
    expect(pendingReplyEdit(actions, { id: "1", revision: 2 })).toEqual({ action: "save", draft: "Edited" });
    expect(pendingReplyEdit(actions, { id: "2", revision: 2 })).toBeNull();
  });
});
