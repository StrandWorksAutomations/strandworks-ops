import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { safeLinks, validateReplyAction } from "../src/lib/kc-replies";
import { JobLinks } from "../app/replies/ReplyCard";

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
