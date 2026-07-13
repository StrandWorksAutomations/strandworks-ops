import { describe, it, expect } from "vitest";
import {
  parseScouts,
  scoutForTokens,
  reportDate,
  freshness,
  freshnessBadge,
  extractFlagSummary,
} from "../src/lib/scouts";

const MD = `# STRANDWORKS — OPERATIONS DASHBOARD

Generated 2026-07-12 by generate.py — edit registers/, never this file.

## Money

stuff

## Governance scouts (per repo)

| repo | latest_audit | latest_drift |
|---|---|---|
| 3rdrider | audit-2026-07-10.md | drift-2026-07-11.md |
| MedSim-Game | audit-2026-07-11.md | never |
| strandworks-ops | never | never |

## Models & compute

| name |
|---|
`;

describe("parseScouts", () => {
  it("reads the generation stamp and the scout table", () => {
    const v = parseScouts(MD);
    expect(v.generated).toBe("2026-07-12");
    expect(v.rows).toHaveLength(3);
    expect(v.rows[0]).toEqual({
      repo: "3rdrider",
      latestAudit: "audit-2026-07-10.md",
      latestDrift: "drift-2026-07-11.md",
    });
    expect(v.rows[2].latestAudit).toBe("never");
  });

  it("handles a dashboard with no scouts section, and a missing dashboard", () => {
    expect(parseScouts("# nothing here")).toEqual({ generated: null, rows: [] });
    expect(parseScouts(null)).toEqual({ generated: null, rows: [] });
  });
});

describe("scoutForTokens", () => {
  it("matches repos to project tokens in either direction", () => {
    const v = parseScouts(MD);
    expect(scoutForTokens(v, ["medsim-game", "medsim"])?.repo).toBe("MedSim-Game");
    expect(scoutForTokens(v, ["3rdrider", "3rd rider"])?.repo).toBe("3rdrider");
    expect(scoutForTokens(v, ["chekov"])).toBeUndefined();
  });
});

describe("reportDate", () => {
  it("lifts the date from a report filename or scout cell", () => {
    expect(reportDate("drift-2026-07-11.md")).toBe("2026-07-11");
    expect(reportDate("audit-2026-07-10.md")).toBe("2026-07-10");
    expect(reportDate("never")).toBeNull();
    expect(reportDate("")).toBeNull();
    expect(reportDate(null)).toBeNull();
  });
});

describe("freshness", () => {
  const today = "2026-07-13";
  it("colors by age: ≤2 fresh, ≤7 aging, else stale, and never for absent", () => {
    expect(freshness("drift-2026-07-13.md", today)).toBe("fresh"); // 0 days
    expect(freshness("drift-2026-07-11.md", today)).toBe("fresh"); // 2 days
    expect(freshness("drift-2026-07-10.md", today)).toBe("aging"); // 3 days
    expect(freshness("drift-2026-07-06.md", today)).toBe("aging"); // 7 days
    expect(freshness("drift-2026-07-05.md", today)).toBe("stale"); // 8 days
    expect(freshness("never", today)).toBe("never");
    expect(freshness("", today)).toBe("never");
  });
  it("treats a future date as never (no negative-age fresh)", () => {
    expect(freshness("drift-2026-07-20.md", today)).toBe("never");
  });
  it("maps freshness to the badge signal class", () => {
    expect(freshnessBadge("fresh")).toBe("good");
    expect(freshnessBadge("aging")).toBe("warn");
    expect(freshnessBadge("stale")).toBe("bad");
    expect(freshnessBadge("never")).toBe("bad");
  });
});

describe("extractFlagSummary", () => {
  it("prefers an explicit 'FLAG summary' heading and reads to the next peer heading", () => {
    const md = `# Drift Check 2026-07-13

## Daily checks

All PASS.

## FLAG summary

- FLAG: SPEC.md changed with no intake-log row (commit abc123).
- FLAG: stray planning doc at docs/plan.md.

## Appendix

ignore me`;
    const s = extractFlagSummary(md);
    expect(s.found).toBe(true);
    expect(s.heading).toBe("FLAG summary");
    expect(s.body).toContain("SPEC.md changed");
    expect(s.body).toContain("stray planning doc");
    expect(s.body).not.toContain("ignore me");
  });

  it("falls back to any heading mentioning flags", () => {
    const md = `## Flags requiring change\n\n- one thing\n`;
    const s = extractFlagSummary(md);
    expect(s.found).toBe(true);
    expect(s.body).toContain("one thing");
  });

  it("reports honestly when there is no flag section or no content", () => {
    expect(extractFlagSummary("# report\n\nno issues").found).toBe(false);
    expect(extractFlagSummary(null).found).toBe(false);
    expect(extractFlagSummary("").found).toBe(false);
  });
});
