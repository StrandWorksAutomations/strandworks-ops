import { describe, it, expect } from "vitest";
import { sanitizeInsert, sanitizePatch, BusinessEditError } from "../src/lib/business-edit";
import { TABLES, statusClass, daysUntil } from "../src/lib/business";

const ENTITY = "11111111-2222-4333-8444-555555555555";

describe("sanitizePatch", () => {
  it("coerces types and drops empties to null", () => {
    const { spec, patch } = sanitizePatch("licenses", { fee_usd: "250", expires_on: "", status: "active", notes: " x " });
    expect(spec.slug).toBe("licenses");
    expect(patch).toEqual({ fee_usd: 250, expires_on: null, status: "active", notes: "x" });
  });
  it("rejects columns off the allow-list", () => {
    expect(() => sanitizePatch("licenses", { entity_id: ENTITY })).toThrow(BusinessEditError);
    expect(() => sanitizePatch("licenses", { id: ENTITY })).toThrow(/not editable/);
  });
  it("rejects unknown tables, bad enums, bad dates, empty patches", () => {
    expect(() => sanitizePatch("qa_answers", { x: 1 })).toThrow(/unknown table/);
    expect(() => sanitizePatch("licenses", { status: "bogus" })).toThrow(/not one of/);
    expect(() => sanitizePatch("licenses", { expires_on: "9/1/2026" })).toThrow(/YYYY-MM-DD/);
    expect(() => sanitizePatch("licenses", {})).toThrow(/empty/);
  });
  it("handles booleans on contacts", () => {
    expect(sanitizePatch("contacts", { is_active: "false" }).patch).toEqual({ is_active: false });
    expect(sanitizePatch("contacts", { is_active: true }).patch).toEqual({ is_active: true });
  });
});

describe("sanitizeInsert", () => {
  it("requires the parent FK and required fields", () => {
    expect(() => sanitizeInsert("contacts", { category: "medical_director" })).toThrow(/entity_id/);
    expect(() => sanitizeInsert("contacts", { entity_id: ENTITY })).toThrow(/Category is required/);
    const { row } = sanitizeInsert("contacts", { entity_id: ENTITY, category: "medical_director", organization: "Dr X", email: "" });
    expect(row).toEqual({ entity_id: ENTITY, category: "medical_director", organization: "Dr X" });
  });
  it("refuses tables that are not insertable here", () => {
    expect(() => sanitizeInsert("entities", { name: "New LLC" })).toThrow(/does not accept/);
  });
  it("credentials hang off a person", () => {
    expect(() => sanitizeInsert("credentials", { type: "Paramedic", entity_id: ENTITY })).toThrow(/person_id/);
    const { row } = sanitizeInsert("credentials", { type: "Paramedic", person_id: ENTITY, expires_on: "2027-01-31" });
    expect(row).toEqual({ type: "Paramedic", person_id: ENTITY, expires_on: "2027-01-31" });
  });
});

describe("table specs", () => {
  it("every table has a unique slug and its own view", () => {
    const slugs = new Set(TABLES.map((t) => t.slug));
    expect(slugs.size).toBe(TABLES.length);
    for (const t of TABLES) {
      expect(t.view.startsWith("v_admin_")).toBe(true);
      expect(t.fields.some((f) => f.key === t.titleField) || t.titleField === "organization").toBe(true);
    }
  });
  it("status and day helpers", () => {
    expect(statusClass("active")).toBe("good");
    expect(statusClass("expired")).toBe("bad");
    expect(statusClass("planned")).toBe("warn");
    expect(statusClass("parked")).toBe("");
    expect(daysUntil("2026-09-11", "2026-09-01")).toBe(10);
    expect(daysUntil("2026-08-30T00:00:00Z", "2026-09-01")).toBe(-2);
    expect(daysUntil(null, "2026-09-01")).toBeNull();
  });
});
