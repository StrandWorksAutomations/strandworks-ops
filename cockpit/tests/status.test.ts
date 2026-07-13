import { describe, it, expect } from "vitest";
import {
  parseReviewTags,
  openDecisions,
  inboxItems,
  buildFabricStatus,
} from "@/lib/status";

describe("parseReviewTags", () => {
  it("keeps only review/YYYY-MM-DD-* tags, newest first", () => {
    const tags = parseReviewTags([
      "review/2026-07-12-cockpit-slice-1",
      "v1.0.0",
      "review/2026-07-11-earlier",
      "release/2026-07-12",
      "review/2026-07-12-broker-slice-2",
    ]);
    expect(tags.map((t) => t.date)).toEqual(["2026-07-12", "2026-07-12", "2026-07-11"]);
    expect(tags[0].label).toMatch(/broker-slice-2|cockpit-slice-1/);
    expect(tags.map((t) => t.tag)).not.toContain("v1.0.0");
  });
});

describe("openDecisions", () => {
  const pending = [
    "---",
    "id: 2026-07-12-export-pipeline-order",
    "filed: 2026-07-12",
    "filed-by: orchestrator",
    "question: which order?",
    "ruling: PENDING",
    "---",
    "body",
  ].join("\n");
  const ruled = [
    "---",
    "id: 2026-07-12-done",
    "filed: 2026-07-11",
    "ruling: APPROVE",
    "ruled: 2026-07-12T00:00:00Z",
    "---",
  ].join("\n");

  it("returns only PENDING decisions, skipping README and unparseable files", () => {
    const open = openDecisions([
      { filename: "2026-07-12-export-pipeline-order.md", content: pending },
      { filename: "2026-07-12-done.md", content: ruled },
      { filename: "README.md", content: "# readme" },
      { filename: "garbage.md", content: "no frontmatter here" },
    ]);
    expect(open).toHaveLength(1);
    expect(open[0].id).toBe("2026-07-12-export-pipeline-order");
    expect(open[0].question).toBe("which order?");
  });
});

describe("inboxItems (never directive — filename signal only)", () => {
  it("parses date/topic from filenames, skips README, newest first", () => {
    const items = inboxItems([
      "2026-07-12-glm-coder-research.md",
      "README.md",
      "2026-07-11-older-note.md",
      "no-date-note.md",
    ]);
    expect(items.map((i) => i.filename)).not.toContain("README.md");
    expect(items[0].date).toBe("2026-07-12");
    expect(items[0].topic).toBe("glm-coder-research");
    // undated file still surfaces, sorted after dated ones
    expect(items.find((i) => i.filename === "no-date-note.md")?.date).toBe("");
  });

  it("carries no file CONTENT — only filename-derived metadata", () => {
    const items = inboxItems(["2026-07-12-topic.md"]);
    expect(Object.keys(items[0]).sort()).toEqual(["date", "filename", "topic"]);
  });
});

describe("buildFabricStatus", () => {
  it("assembles a read-only reflection of git + governance state", () => {
    const status = buildFabricStatus({
      tagLines: ["review/2026-07-12-cockpit-slice-1", "v0.0.1"],
      decisionFiles: [
        {
          filename: "2026-07-12-x.md",
          content: "---\nid: 2026-07-12-x\nfiled: 2026-07-12\nruling: PENDING\n---\n",
        },
      ],
      inboxFilenames: ["2026-07-12-idea.md", "README.md"],
      repos: [
        { repo: "strandworks-ops", lastCommit: "2026-07-13" },
        { repo: "haptic-mirror", lastCommit: null, note: "not reachable from cockpit token" },
      ],
      halted: false,
    });
    expect(status.reviewTags).toHaveLength(1);
    expect(status.openDecisions).toHaveLength(1);
    expect(status.inbox).toHaveLength(1);
    expect(status.repos).toHaveLength(2);
    expect(status.halted).toBe(false);
    // honest about unreachable repos — a null date, never fabricated
    expect(status.repos.find((r) => r.repo === "haptic-mirror")?.lastCommit).toBeNull();
  });

  it("propagates a HALTED marker", () => {
    const status = buildFabricStatus({
      tagLines: [],
      decisionFiles: [],
      inboxFilenames: [],
      repos: [],
      halted: true,
    });
    expect(status.halted).toBe(true);
  });
});
