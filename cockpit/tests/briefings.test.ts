import { describe, expect, it } from "vitest";
import { groupByDate, parseBriefing } from "../src/lib/briefings";

const RAW = `---
date: 2026-08-30
time: 15:14
host: laptop
source: Tech Scout
title: Tech Scout — 2026-08-30
attachment: briefings/attachments/2026-08-30-151442-laptop-tech-scout.md
attachment_name: scout-2026-08-30.md
---

Tech Scout — 2026-08-30

Two verified open-weight drops.
`;

describe("briefings", () => {
  it("parses frontmatter + body", () => {
    const b = parseBriefing(RAW, "2026-08-30-151442-laptop-tech-scout.md");
    expect(b.slug).toBe("2026-08-30-151442-laptop-tech-scout");
    expect(b.date).toBe("2026-08-30");
    expect(b.time).toBe("15:14");
    expect(b.host).toBe("laptop");
    expect(b.source).toBe("Tech Scout");
    expect(b.title).toBe("Tech Scout — 2026-08-30");
    expect(b.attachment).toBe("briefings/attachments/2026-08-30-151442-laptop-tech-scout.md");
    expect(b.attachmentName).toBe("scout-2026-08-30.md");
    expect(b.body.startsWith("Tech Scout — 2026-08-30")).toBe(true);
    expect(b.body.endsWith("open-weight drops.")).toBe(true);
  });

  it("falls back to the filename when frontmatter is missing", () => {
    const b = parseBriefing("just text\nmore", "2026-08-29-070000-droplet-memory-garden.md");
    expect(b.date).toBe("2026-08-29");
    expect(b.time).toBe("07:00");
    expect(b.host).toBe("droplet");
    expect(b.source).toBe("memory-garden");
    expect(b.title).toBe("just text");
    expect(b.attachment).toBeUndefined();
  });

  it("groups by date preserving order", () => {
    const a = parseBriefing(RAW, "2026-08-30-151442-laptop-tech-scout.md");
    const b = parseBriefing(RAW.replace("time: 15:14", "time: 10:09"), "2026-08-30-100900-laptop-memory-garden.md");
    const c = parseBriefing(RAW.replace("date: 2026-08-30", "date: 2026-08-28"), "2026-08-28-144800-laptop-tech-scout.md");
    const g = groupByDate([a, c, b]); // b's local day is 08-30 even though it sorts after a 08-28 item
    expect(g.map((x) => x.date)).toEqual(["2026-08-30", "2026-08-28"]);
    expect(g[0].items.map((x) => x.slug)).toEqual([a.slug, b.slug]);
    expect(g[1].items.map((x) => x.slug)).toEqual([c.slug]);
  });
});
