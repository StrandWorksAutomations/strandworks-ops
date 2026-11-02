import { describe, expect, it } from "vitest";
import { ownerDay, parseMarketingSnapshot, parsePaidSnapshot, postStatus, safeMediaUrl, sourceIsStale, weekOf, type MarketingPost } from "../src/lib/marketing";
import fs from "node:fs";

const now = new Date("2026-11-02T16:00:00Z");
const post: MarketingPost = { id: "1", brand_id: "7530099", text: "Original caption", scheduled_at_utc: "2026-11-02T22:00:00Z", draft: false, media: [], providers: [{ platform: "facebook", status: "PENDING" }], source: "Metricool" };

describe("marketing source truth", () => {
  it("keeps a draft out of the scheduled queue even when a provider says PENDING", () => {
    expect(postStatus({ ...post, draft: true }, now)).toBe("draft");
    expect(postStatus({ ...post, isDraft: true }, now)).toBe("draft");
  });
  it("never infers publication from an elapsed pending slot", () => {
    expect(postStatus({ ...post, scheduled_at_utc: "2026-11-02T15:00:00Z" }, now)).toBe("attention");
    expect(postStatus(post, now)).toBe("scheduled");
  });
  it("requires every provider to report published and flags a mixed result", () => {
    expect(postStatus({ ...post, providers: [{ platform: "facebook", status: "PUBLISHED" }] }, now)).toBe("published");
    expect(postStatus({ ...post, providers: [{ platform: "facebook", status: "PUBLISHED" }, { platform: "instagram", status: "PENDING" }] }, now)).toBe("attention");
  });
  it("flags missing and failed providers without claiming a scheduled post", () => {
    expect(postStatus({ ...post, providers: [] }, now)).toBe("attention");
    expect(postStatus({ ...post, providers: [{ platform: "instagram", status: "FAILED" }] }, now)).toBe("attention");
  });
  it("groups UTC records by Eastern day and Monday week, including the DST boundary", () => {
    expect(ownerDay("2026-11-03T01:00:00Z")).toBe("2026-11-02");
    expect(weekOf("2026-11-08")).toBe("2026-11-02");
    expect(weekOf("2026-11-09")).toBe("2026-11-09");
  });
  it("labels missing or old checks as stale rather than current", () => {
    expect(sourceIsStale("invalid", now)).toBe(true);
    expect(sourceIsStale("2026-10-31T16:00:00Z", now)).toBe(true);
    expect(sourceIsStale("2026-11-02T15:46:18Z", now)).toBe(false);
  });
  it("accepts safe previews and rejects executable or credential-bearing URLs", () => {
    expect(safeMediaUrl("https://static.metricool.com/image.jpg")).toBe("https://static.metricool.com/image.jpg");
    expect(safeMediaUrl("/marketing/tenetrix.jpg")).toBe("/marketing/tenetrix.jpg");
    for (const url of ["javascript:alert(1)", "data:text/html,abc", "https://user:password@example.com/image.jpg", "/marketing/../inbox"]) expect(safeMediaUrl(url)).toBeUndefined();
  });
  it("treats missing or malformed snapshots as unavailable", () => {
    expect(parseMarketingSnapshot(null)).toBeNull();
    expect(parseMarketingSnapshot("{}")).toBeNull();
    expect(parseMarketingSnapshot("{bad JSON")).toBeNull();
  });
  it("loads the actual source snapshot but rejects corrupt render-essential fields", () => {
    const raw = fs.readFileSync("../registers/marketing-snapshot.json", "utf8");
    expect(parseMarketingSnapshot(raw)?.posts.length).toBeGreaterThan(0);
    const corruptions = [
      (s: any) => { s.posts[0].brand_id = {}; },
      (s: any) => { s.posts[0].scheduled_at_utc = "invalid"; },
      (s: any) => { s.posts[0].providers[0].platform = {}; },
      (s: any) => { s.posts[0].media[0].url = {}; },
      (s: any) => { s.brands[0].accounts[0].handle = {}; },
      (s: any) => { s.brands[0].accounts[0].connection_status = null; },
      (s: any) => { s.sources[0].scope = {}; },
      (s: any) => { s.sources[0].checked_at_utc = "invalid"; },
    ];
    for (const corrupt of corruptions) { const s = JSON.parse(raw); corrupt(s); expect(parseMarketingSnapshot(JSON.stringify(s))).toBeNull(); }
  });
  it("loads the actual paid receipt and refuses an invalid budget or placement payload", () => {
    const raw = fs.readFileSync("../registers/marketing-paid.json", "utf8");
    expect(parsePaidSnapshot(raw)?.campaigns[0].budget_usd).toBe(35);
    const s = JSON.parse(raw); s.campaigns[0].budget_usd = "35";
    expect(parsePaidSnapshot(JSON.stringify(s))).toBeNull();
    s.campaigns[0].budget_usd = 35; s.campaigns[0].placements = [{}];
    expect(parsePaidSnapshot(JSON.stringify(s))).toBeNull();
  });
});
