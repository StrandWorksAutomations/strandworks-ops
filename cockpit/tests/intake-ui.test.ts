import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { email, NOW } from "./inbox-fixtures";
import { buildBusinessBoard } from "../src/lib/businesses";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { InboxCard } from "../app/inbox/InboxCard";
import { BusinessBoard } from "../app/components/BusinessBoard";

describe("inbox and business board rendering", () => {
  it("escapes email content in every field, including body and draft", () => {
    const attack = '<script>alert("mail")</script><img src=x onerror=alert(1)>';
    const html = renderToStaticMarkup(React.createElement(InboxCard, { item: email({
      subject: attack, from_name: attack, from_addr: attack, body_text: attack,
      summary: attack, action_needed: attack, draft_reply: attack, reply_error: attack, reply_status: "failed",
    }) }));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).toContain("Original email");
    expect(html).toContain("Approve &amp; send");
    // A confirmation is required before the final send control is rendered.
    expect(html).not.toContain("Confirm send");
  });
  it("offers only archive/keep actions when there is no draft", () => {
    const html = renderToStaticMarkup(React.createElement(InboxCard, { item: email({ draft_reply: null }) }));
    expect(html).not.toContain("textarea");
    expect(html).not.toContain("Approve &amp; send");
    expect(html).not.toContain("Save draft");
    expect(html).toContain("Done (archive)");
    expect(html).toContain("Dismiss (archive)");
    expect(html).toContain("Keep in inbox");
  });
  it.each(["approved", "sent"] as const)("does not offer duplicate approval for %s replies", (reply_status) => {
    const html = renderToStaticMarkup(React.createElement(InboxCard, { item: email({ reply_status }) }));
    expect(html).not.toContain("Approve &amp; send");
    expect(html).toContain("disabled");
  });
  it("never labels missing sources quiet or displays their counts as zero", () => {
    const cards = buildBusinessBoard({ emails: [], latestEmail: [], items: [], events: [], dueItems: [], projects: [] }, NOW);
    const html = renderToStaticMarkup(React.createElement(BusinessBoard, { cards, now: NOW,
      available: { intake: false, loop: false, events: false, dates: false, projects: false } }));
    expect(html).toContain("Status unavailable");
    expect(html).not.toContain(">Quiet<");
    expect(html).toContain("Counts and activity below are incomplete");
    expect(html).toContain("Updated Oct 24, 2026, 8:00 AM ET");
  });
  it("links counts and top items to their matching business views", () => {
    const cards = buildBusinessBoard({ emails: [email({ priority: "high" })], latestEmail: [], items: [], events: [], dueItems: [], projects: [] }, NOW);
    const html = renderToStaticMarkup(React.createElement(BusinessBoard, { cards, now: NOW,
      available: { intake: true, loop: true, events: true, dates: true, projects: true } }));
    expect(html).toContain('href="/inbox?business=strandworks"');
    expect(html).toContain('href="/decisions?business=strandworks"');
    expect(html).toContain('href="/timeline?business=strandworks&amp;days=14"');
    expect(html).toContain("1 high");
    expect(html).toContain("Review the agreement");
  });
});
