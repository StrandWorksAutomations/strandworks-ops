import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ReplyStats } from "../app/replies/ReplyStats";
import { editedReply, postedReplyConfirmation, reasonsInRange } from "../src/lib/reply-feedback";
import { addDays } from "../src/lib/money";
import { sbSelect } from "../src/lib/supabase-rest";

vi.mock("@/lib/supabase-rest", () => ({ sbSelect: vi.fn() }));
vi.mock("@/lib/repo", () => ({ readRepoFile: vi.fn().mockResolvedValue(null) }));
vi.stubGlobal("React", React);

it("treats empty originals, equivalent line endings and whitespace-only changes consistently with statistics", () => {
  expect(editedReply(" \t", "Actual")).toBe(false);
  expect(editedReply("One\r\nTwo  ", " One\nTwo")).toBe(false);
  expect(editedReply("One  Two", "One Two")).toBe(true);
  expect(editedReply("Draft", "Actual")).toBe(true);
});

it("confirms the posting, the saved correction or an eligible voice example", () => {
  expect(postedReplyConfirmation(false, false, null)).toBe("Reply marked as posted.");
  expect(postedReplyConfirmation(true, false, "job_details")).toBe("Posted wording saved. Correction reason saved.");
  expect(postedReplyConfirmation(false, true, "voice")).toBe("Reply marked as posted. Voice example saved.");
  expect(postedReplyConfirmation(true, true, null)).toBe("Posted wording saved. Voice example saved.");
});

it("counts labeled and unlabeled edited replies only within the selected dates and orders recurring reasons first", () => {
  const days = [
    { day: "2026-11-23", reason: "job_match", count: 3 }, { day: "2026-11-24", reason: "voice", count: 3 },
    { day: "2026-11-24", reason: "unlabeled", count: 2 }, { day: "2026-11-25", reason: "job_match", count: 1 },
    { day: "2026-11-25", reason: "voice", count: 1 },
  ];
  expect(reasonsInRange(days, "2026-11-24", "2026-11-25")).toEqual({ total: 7, unlabeled: 2, reasons: [["voice",4],["job_match",1]] });
});

it("paginates all reasons on the same day and displays independent unavailability", async () => {
  const rows = Array.from({ length: 499 }, (_, i) => ({ day: addDays("2025-01-01", i), reason: "job_match", count: 1 }));
  rows.push({ day: "2026-11-24", reason: "job_details", count: 1 });
  vi.mocked(sbSelect).mockImplementation(async (table, query) => {
    if (table === "kc_fb_dismissal_reason_days") throw new Error("unavailable");
    if (table !== "kc_fb_reply_correction_reason_days") return [];
    const filter = new URLSearchParams(query).get("or");
    if (filter) {
      expect(filter).toBe("(day.gt.2026-11-24,and(day.eq.2026-11-24,reason.gt.job_details))");
      return [{ day: "2026-11-24", reason: "unlabeled", count: 1 }];
    }
    return rows;
  });
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-25T14:00:00Z"));
  try {
    const html = renderToStaticMarkup(await ReplyStats());
    expect(html).toContain("1 of 2 edited posted replies labeled");
    expect(html).toContain("Incorrect job details or pay");
    expect(html).toContain("Dismissal reasons are unavailable");
  } finally { vi.useRealTimers(); }
});
