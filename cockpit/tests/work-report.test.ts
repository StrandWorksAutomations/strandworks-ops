import { describe, expect, it } from "vitest";
import { agentName, isRawData, ownerReport } from "../src/lib/work-report";

const base = { agent: "codex", result: "Added the operator link to the homepage.", validation: "41 tests passed.", remaining: "",
  next_action: "Repeat on the live site.", evidence: [] as unknown[] };

describe("owner reading of a work report", () => {
  it("leads with the plain account and keeps checks as technical detail", () => {
    const view = ownerReport(base);
    expect(view.who).toBe("Codex");
    expect(view.plain).toEqual([{ label: "What was done", text: base.result }, { label: "What happens next", text: base.next_action }]);
    expect(view.technical).toEqual([{ label: "How it was checked", text: "41 tests passed.", raw: false }]);
  });
  it("never shows machine data as the summary", () => {
    const view = ownerReport({ ...base, agent: "system", validation: '{"adapters": {"linear": {"error": null}}}', remaining: '[{"id": 1}]' });
    expect(view.who).toBe("Automatic daily check");
    expect(view.plain.map((section) => section.label)).toEqual(["What was done", "What happens next"]);
    expect(view.technical.map((section) => [section.label, section.raw])).toEqual([["How it was checked", true], ["Remaining-work data", true]]);
    expect(isRawData("Reviewed [all] 70 issues")).toBe(false);
    expect(isRawData('{"truncated": "yes')).toBe(true);
  });
  it("separates results the owner can open from code links, and drops unsafe links", () => {
    const view = ownerReport({ ...base, evidence: [
      "https://highest-paying-abc-strandworks.vercel.app/news/", "https://github.com/StrandWorksAutomations/highest-paying/commit/abc",
      "https://kineticclinician.com/guides/protocol-compare/", "https://dashboard.strandautomationworks.com/focus",
      "http://insecure.example.com", "javascript:alert(1)", "https://github.com/StrandWorksAutomations/highest-paying/commit/abc",
    ] });
    expect(view.results.map((link) => link.label)).toEqual(["Preview of the result", "kineticclinician.com/guides/protocol-compare", "Dashboard: focus"]);
    expect(view.code).toEqual([{ label: "Code change on GitHub", url: "https://github.com/StrandWorksAutomations/highest-paying/commit/abc" }]);
    expect(agentName("gemini")).toBe("gemini");
  });
});
