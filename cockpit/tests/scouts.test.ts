import { describe, it, expect } from "vitest";
import { parseScouts, scoutForTokens } from "../src/lib/scouts";

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
