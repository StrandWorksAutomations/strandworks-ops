import { describe, it, expect } from "vitest";
import { parseChecks, checksForProject, latestCheck, checkStatusClass } from "../src/lib/checks";
import { projectBySlug, extractSurfaces, type AttributedRow } from "../src/lib/projects";

const CSV = [
  "date,project,source,kind,status,summary,link",
  "2026-07-10,MedSim-Game,scout,check,ok,audit clean,",
  "2026-07-13,strandworks-ops,cockpit-session,progress,ok,redesign built,",
  "2026-07-12,medsim,persistent-ai,alert,warn,telemetry lag rising,_governance/reports/x.md",
].join("\n");

describe("parseChecks", () => {
  it("parses newest-first and tolerates a missing register", () => {
    const rows = parseChecks(CSV);
    expect(rows.map((r) => r.date)).toEqual(["2026-07-13", "2026-07-12", "2026-07-10"]);
    expect(parseChecks(null)).toEqual([]);
  });
});

describe("checksForProject / latestCheck", () => {
  it("matches project tokens against the project column", () => {
    const rows = parseChecks(CSV);
    const medsim = projectBySlug("medsim-game")!;
    const mine = checksForProject(rows, medsim);
    expect(mine).toHaveLength(2); // MedSim-Game + medsim
    expect(latestCheck(rows, medsim)?.status).toBe("warn");
    expect(latestCheck(rows, projectBySlug("chekov")!)).toBeUndefined();
  });
});

describe("checkStatusClass", () => {
  it("maps statuses to signal classes", () => {
    expect(checkStatusClass("ok")).toBe("good");
    expect(checkStatusClass("warn")).toBe("warn");
    expect(checkStatusClass("fail")).toBe("bad");
    expect(checkStatusClass("info")).toBe("");
  });
});

describe("extractSurfaces", () => {
  it("pulls URL-ish tokens from attributed service rows, deduped, no emails", () => {
    const rows: AttributedRow[] = [
      {
        scope: "dedicated",
        row: {
          service: "Vercel",
          what_it_runs: "cockpit (dashboard.strandautomationworks.com) + https://pocus-ultrasound.vercel.app/demo",
          notes: "contact admin@example.com; also dashboard.strandautomationworks.com",
        },
      },
    ];
    const s = extractSurfaces(rows);
    expect(s).toContain("dashboard.strandautomationworks.com");
    expect(s).toContain("pocus-ultrasound.vercel.app/demo");
    expect(s.filter((x) => x === "dashboard.strandautomationworks.com")).toHaveLength(1);
    expect(s.some((x) => x.includes("@"))).toBe(false);
  });
});
