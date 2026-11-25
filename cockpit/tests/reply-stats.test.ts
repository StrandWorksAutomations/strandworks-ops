import { expect, it } from "vitest";
import { countReplies, readPageviews, replyCsv, replyRange, total, type OutcomeFact, type EngagementFact } from "../src/lib/reply-stats";

const ledger = (over: Partial<OutcomeFact>): OutcomeFact => ({ item_id: "A", platform: "facebook", source_kind: "public_group",
  posted_at: "2026-11-24T02:32:00Z", source_url: "https://www.facebook.com/groups/111/posts/222", ...over });
const sent = (over: Partial<EngagementFact>): EngagementFact => ({ id: "1", network: "facebook", external_id: "12_345",
  post_external_id: "100_12", post_url: "https://www.facebook.com/100/posts/12?comment_id=345", status: "sent",
  delivery_result: "Sent on Facebook at 2026-11-24T04:30:00.000Z (reply 333).", ...over });

it("joins the Page worker's canonical comment_id to the Engagement Graph ID and fills an unknown date", () => {
  const page = ledger({ source_kind: "owned_page", source_url: "https://www.facebook.com/100/posts/12?comment_id=345", posted_at: null });
  const result = countReplies([ledger({}), page], [sent({ post_url: "https://www.facebook.com/100/posts/12" }),
    sent({ id: "2", external_id: "100_12_999", post_url: null })]);
  expect(result.dated["2026-11-23"]).toEqual({ facebook_group: 1, facebook_page: 2 });
  expect(result.undated).toEqual({});
  expect(result.ambiguous).toBe(0);
});

it("retains known ledger dates, skips ambiguous Page overlaps, and counts only confirmed engagement replies", () => {
  const result = countReplies([
    ledger({ source_kind: "owned_page", source_url: "https://www.facebook.com/100/posts/12?comment_id=345", posted_at: "2026-11-20T10:00:00Z" }),
    ledger({ source_kind: "owned_page", source_url: "https://www.facebook.com/100/posts/130", posted_at: null }),
  ], [sent({}), sent({ id: "3", external_id: "130_456", post_url: "https://www.facebook.com/100/posts/130", post_external_id: "100_130" }),
    sent({ network: "instagram", status: "dismissed", delivery_result: "Already answered on the network." }),
    sent({ network: "linkedin", status: "sent", delivery_result: null }),
    sent({ network: "youtube", status: "approved" }),
    sent({ network: "youtube", status: "dismissed", delivery_result: "Dismissed." })]);
  expect(result.dated).toEqual({ "2026-11-20": { facebook_page: 1 } });
  expect(result.undated).toEqual({ facebook_page: 1, instagram: 1, linkedin: 1 });
  expect(result.ambiguous).toBe(1);
});

it("exports Eastern days and distinguishes zero pageviews from dates without coverage", () => {
  const counts = countReplies([ledger({}), ledger({ source_kind: "owner_supplied", posted_at: null })],
    [sent({ network: "instagram", delivery_result: "Sent on Instagram at 2026-11-24T06:30:00.000Z." })]);
  const views = readPageviews(JSON.stringify({ project: "highest-paying", environment: "production", metric: "vercel.analytics_pageview.count",
    aggregation: "sum", timezone: "America/New_York", days: { "2026-11-22": 5, "2026-11-23": 0, "bad": 1, "2026-11-24": -1 } }));
  const range = replyRange(counts, views, "2026-11-23", "2026-11-24");
  expect(total(counts.undated)).toBe(1);
  expect(range.answered).toBe(2);
  expect(range.days.map(d => [d.day, d.answered, d.pageviews])).toEqual([["2026-11-23", 1, 0], ["2026-11-24", 1, null]]);
  expect(replyCsv(range.days, ["facebook_group","instagram"]).split("\r\n")).toEqual([
    "Date (Eastern),Answered,Facebook groups,Instagram,Website pageviews,Website job clicks", "2026-11-23,1,1,0,0,", "2026-11-24,1,0,1,,", "",
  ]);
  expect(readPageviews("not JSON")).toEqual({});
  expect(replyRange(counts, views, "2026-11-25", "2026-11-25").days[0]).toMatchObject({ day: "2026-11-25", answered: 0, pageviews: null });
});

it("keeps live job clicks distinct from pageviews and preserves gaps before and between click records", () => {
  const counts = countReplies([], []);
  const range = replyRange(counts, { "2026-11-20": 40, "2026-11-21": 0 }, "2026-11-19", "2026-11-24",
    { "2026-11-21": 2, "2026-11-24": 4 });
  expect(range.days.map(d => [d.day, d.pageviews, d.jobClicks])).toEqual([
    ["2026-11-20", 40, null], ["2026-11-21", 0, 2], ["2026-11-22", null, null],
    ["2026-11-23", null, null], ["2026-11-24", null, 4],
  ]);
  expect(replyCsv(range.days, [])).toContain("2026-11-24,0,,4\r\n");
  expect(replyRange(counts, {}, "2026-11-19", "2026-11-24", { "2026-11-24": 4 }).days).toHaveLength(1);
});
