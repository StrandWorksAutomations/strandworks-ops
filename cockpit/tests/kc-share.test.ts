import { describe, expect, it } from "vitest";
import { groupIdFromUrl, validateDraftMark, validateGroupAdd, validateGroupPatch } from "../src/lib/kc-share";

describe("kc share validation", () => {
  it("accepts only Facebook group links", () => {
    expect(groupIdFromUrl("https://www.facebook.com/groups/1247725929185948/")).toBe("1247725929185948");
    expect(groupIdFromUrl("https://m.facebook.com/groups/eventmedicine?ref=share")).toBe("eventmedicine");
    expect(groupIdFromUrl("https://facebook.com/pages/x")).toBeNull();
    expect(groupIdFromUrl("javascript:alert(1)")).toBeNull();
  });
  it("requires professions when adding a group", () => {
    expect(validateGroupAdd({ url: "https://www.facebook.com/groups/123456/", name: "EMS Jobs", roles: [] }).ok).toBe(false);
    expect(validateGroupAdd({ url: "https://www.facebook.com/groups/123456/", name: "EMS Jobs", roles: ["nurse"] }).ok).toBe(false);
    const ok = validateGroupAdd({ url: "https://www.facebook.com/groups/123456/?x=1", name: "EMS Jobs", roles: ["emt"] });
    expect(ok.ok && ok.value.url).toBe("https://www.facebook.com/groups/123456/");
  });
  it("limits group patches to known fields and ranges", () => {
    expect(validateGroupPatch({ id: "123456", patch: {} }).ok).toBe(false);
    expect(validateGroupPatch({ id: "123456", patch: { weekly_cap: 9 } }).ok).toBe(false);
    expect(validateGroupPatch({ id: "123456", patch: { roles: ["rn", "x"] } }).ok).toBe(false);
    expect(validateGroupPatch({ id: "123456", patch: { allows_job_posts: "yes" } }).ok).toBe(false);
    const ok = validateGroupPatch({ id: "123456", patch: { regions: ["ky"], allows_job_posts: true, url: "evil" } });
    expect(ok.ok && ok.value.patch).toEqual({ regions: ["KY"], allows_job_posts: true });
  });
  it("marks drafts posted or skipped only", () => {
    const id = "6b1d2c3e-1111-4222-8333-944455556666";
    expect(validateDraftMark({ id, status: "posted" }).ok).toBe(true);
    expect(validateDraftMark({ id, status: "deleted" }).ok).toBe(false);
    expect(validateDraftMark({ id: "1;drop", status: "posted" }).ok).toBe(false);
  });
});
