import { describe, it, expect } from "vitest";
import { applyProjectEdit, EditError } from "@/lib/project-edit";

const CSV = [
  "slug,name,role,tokens,tier,path,remote,last_commit,activity,domains,surfaces,supabase_ref,vercel_project,linear_project,notes",
  "chekov,Chekov,Inventory,chekov,tier-3,chekov,StrandWorksAutomations/chekov,2026-06-18,dormant,,,,,,",
  "drift,Drift,Organizer,drift,tier-2,Drift,StrandWorksAutomations/Drift,2026-08-29,active,,,,,,",
].join("\n");

describe("applyProjectEdit", () => {
  it("sets tier and leaves derived columns untouched", () => {
    const { csv, summary } = applyProjectEdit(CSV, { slug: "chekov", fields: { tier: "frozen" } });
    expect(summary).toBe("update chekov: tier");
    const row = csv.split("\n")[1];
    expect(row).toContain(",frozen,chekov,StrandWorksAutomations/chekov,2026-06-18,dormant,");
    expect(csv.split("\n")[2]).toContain("tier-2");
  });
  it("rejects unknown tiers, derived columns, unknown slugs, comma lists", () => {
    expect(() => applyProjectEdit(CSV, { slug: "chekov", fields: { tier: "tier-9" } })).toThrow(EditError);
    // @ts-expect-error derived column
    expect(() => applyProjectEdit(CSV, { slug: "chekov", fields: { last_commit: "2030-01-01" } })).toThrow(EditError);
    expect(() => applyProjectEdit(CSV, { slug: "nope", fields: { tier: "ops" } })).toThrow(EditError);
    expect(() => applyProjectEdit(CSV, { slug: "drift", fields: { surfaces: "a.com,b.com" } })).toThrow(EditError);
    expect(() => applyProjectEdit(CSV, { slug: "drift", fields: { supabase_ref: "short" } })).toThrow(EditError);
  });
  it("strips control characters and newlines from values", () => {
    const { csv } = applyProjectEdit(CSV, { slug: "drift", fields: { notes: "line1\nline2\t\x07x" } });
    expect(csv).toContain("line1 line2 x");
  });
});
