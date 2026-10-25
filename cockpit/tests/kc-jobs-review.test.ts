import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { postedSharePath, reviewErrorMessage, shortPay, validateReview, type KcSubmission } from "../src/lib/kc-jobs-review";
import { JobPreview } from "../app/jobs-review/ReviewCard";

const id = "6b1d2c3e-1111-4222-8333-944455556666";
const sub: KcSubmission = {
  id, created_at: "2026-10-25T12:00:00Z", status: "pending", title: "Flight Paramedic", role: "paramedic", roles: ["paramedic"],
  employer: "Bluegrass Air Medical", location: "Lexington, KY", region: "KY", employment_type: "Full-time",
  salary: { min: 28, max: 34, period: "hour" }, apply_url: "https://bluegrass.applytojob.com/apply/1", description: "24/48 rotation.",
  recruiter_name: "Pat Doe", work_email: "pat@bluegrassair.org", agency_name: "Bluegrass Air Medical", flags: [],
  reviewed_at: null, reject_reason: null, posted_job_id: null,
};

describe("kc job review validation", () => {
  it("approves by id only", () => {
    expect(validateReview({ id, action: "approve", reason: "ignored" })).toEqual({ ok: true, value: { id, action: "approve" } });
    expect(validateReview({ id: "1;drop", action: "approve" }).ok).toBe(false);
    expect(validateReview({ id, action: "publish" }).ok).toBe(false);
    expect(validateReview(null).ok).toBe(false);
  });
  it("rejects need a reason under 500 characters", () => {
    expect(validateReview({ id, action: "reject" }).ok).toBe(false);
    expect(validateReview({ id, action: "reject", reason: "   " }).ok).toBe(false);
    expect(validateReview({ id, action: "reject", reason: "x".repeat(501) }).ok).toBe(false);
    expect(validateReview({ id, action: "reject", reason: " No pay range. " })).toEqual({ ok: true, value: { id, action: "reject", reason: "No pay range." } });
  });
  it("formats pay and share paths like the KC board", () => {
    expect(shortPay({ min: 28, max: 34, period: "hour" })).toBe("$28–34/hr");
    expect(shortPay({ min: 2400, max: 2400, period: "week" })).toBe("$2,400/wk");
    expect(postedSharePath("e93e884f")).toBe("/j/posted/kc/e93e884f/");
    expect(postedSharePath("../x")).toBeNull();
    expect(postedSharePath(null)).toBeNull();
  });
  it("maps RPC errors to plain messages", () => {
    expect(reviewErrorMessage("supabase rpc failed (400): kc: that job link is already posted")).toMatch(/already on the site/);
    expect(reviewErrorMessage("kc: submission is not pending")).toMatch(/Already reviewed/);
    expect(reviewErrorMessage("boom")).toMatch(/Could not save/);
  });
  it("shows the KC card count only when given", async () => {
    const { BusinessBoard } = await import("../app/components/BusinessBoard");
    const { buildBusinessBoard } = await import("../src/lib/businesses");
    const now = new Date("2026-10-25T12:00:00Z");
    const cards = buildBusinessBoard({ emails: [], latestEmail: [], items: [], events: [], dueItems: [], projects: [] }, now);
    const available = { intake: true, loop: true, events: true, dates: true, projects: true };
    expect(renderToStaticMarkup(React.createElement(BusinessBoard, { cards, available, now }))).not.toContain("Recruiter jobs");
    const html = renderToStaticMarkup(React.createElement(BusinessBoard, { cards, available, now, jobsPending: 3 }));
    expect(html.match(/Recruiter jobs to review/g)?.length).toBe(1);
    expect(html).toContain('href="/jobs-review"');
  });
  it("previews the job with pay, employer, location and apply link", () => {
    const html = renderToStaticMarkup(React.createElement(JobPreview, { s: sub }));
    expect(html).toContain("$28–34/hr");
    expect(html).toContain("Bluegrass Air Medical · Lexington, KY");
    expect(html).toContain('href="https://bluegrass.applytojob.com/apply/1"');
    expect(html).toContain("Paramedic");
  });
});
