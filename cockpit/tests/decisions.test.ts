import { describe, it, expect } from "vitest";
import {
  parseDecision,
  applyRuling,
  isPending,
  isOwnerToken,
  OWNER_TOKENS,
} from "@/lib/decisions";

const SAMPLE = `---
id: 2026-07-12-push-medsim-game-governance
filed: 2026-07-12
filed-by: orchestrator (VAIO session)
question: Push MedSim-Game's 7 local governance commits to GitHub?
ruling: PENDING
---

**Context:** \`~/work/MedSim-Game\` sits 7 commits ahead of origin/main.

**Options:** APPROVE (push to origin/main) / PARK (stay local).
`;

describe("parseDecision", () => {
  it("parses frontmatter fields and body", () => {
    const d = parseDecision(SAMPLE, "2026-07-12-push-medsim-game-governance.md");
    expect(d.id).toBe("2026-07-12-push-medsim-game-governance");
    expect(d.filed).toBe("2026-07-12");
    expect(d.filedBy).toBe("orchestrator (VAIO session)");
    expect(d.question).toContain("Push MedSim-Game's 7 local governance commits");
    expect(d.ruling).toBe("PENDING");
    expect(d.body).toContain("**Context:**");
    expect(d.body).toContain("**Options:**");
    expect(isPending(d)).toBe(true);
  });

  it("keeps colons inside values intact", () => {
    const raw = `---\nid: x\nquestion: Push: yes or no?\nruling: PENDING\n---\nbody`;
    const d = parseDecision(raw, "x.md");
    expect(d.question).toBe("Push: yes or no?");
  });

  it("throws on a file with no frontmatter", () => {
    expect(() => parseDecision("just text", "bad.md")).toThrow(/frontmatter/);
  });

  it("throws when id is missing", () => {
    expect(() => parseDecision("---\nfiled: 2026-01-01\n---\nbody", "noid.md")).toThrow(/id/);
  });

  it("treats non-PENDING rulings as not pending", () => {
    const ruled = SAMPLE.replace("ruling: PENDING", "ruling: APPROVE");
    expect(isPending(parseDecision(ruled, "x.md"))).toBe(false);
  });
});

describe("applyRuling", () => {
  it("writes ruling, ruled timestamp, and source: cockpit", () => {
    const out = applyRuling(SAMPLE, "APPROVE", "2026-07-12T18:00:00.000Z");
    expect(out).toContain("ruling: APPROVE");
    expect(out).toContain("ruled: 2026-07-12T18:00:00.000Z");
    expect(out).toContain("source: cockpit");
    expect(out).not.toContain("PENDING");
  });

  it("preserves every other frontmatter field and the body byte-for-byte", () => {
    const out = applyRuling(SAMPLE, "PARK", "2026-07-12T18:00:00.000Z");
    const d = parseDecision(out, "x.md");
    expect(d.id).toBe("2026-07-12-push-medsim-game-governance");
    expect(d.filed).toBe("2026-07-12");
    expect(d.filedBy).toBe("orchestrator (VAIO session)");
    const originalBody = SAMPLE.slice(SAMPLE.indexOf("---\n\n") + 5);
    expect(out.endsWith(originalBody)).toBe(true);
  });

  it("round-trips: applied ruling parses back correctly", () => {
    const out = applyRuling(SAMPLE, "HALT", "2026-07-12T18:00:00.000Z");
    const d = parseDecision(out, "x.md");
    expect(d.ruling).toBe("HALT");
    expect(d.ruled).toBe("2026-07-12T18:00:00.000Z");
    expect(d.source).toBe("cockpit");
    expect(isPending(d)).toBe(false);
  });

  it("replaces an existing ruled/source instead of duplicating them", () => {
    const once = applyRuling(SAMPLE, "PARK", "2026-07-12T18:00:00.000Z");
    const twice = applyRuling(once, "APPROVE", "2026-07-13T09:00:00.000Z");
    expect(twice.match(/^ruled:/gm)).toHaveLength(1);
    expect(twice.match(/^source:/gm)).toHaveLength(1);
    expect(parseDecision(twice, "x.md").ruling).toBe("APPROVE");
  });

  it("throws on a file with no frontmatter", () => {
    expect(() => applyRuling("no frontmatter", "APPROVE", "2026-07-12T18:00:00.000Z")).toThrow();
  });
});

describe("owner tokens", () => {
  it("accepts exactly the six canon tokens", () => {
    expect(OWNER_TOKENS).toEqual(["APPROVE", "REVISE", "PARK", "BLESSED", "HALT", "CLEAR"]);
    for (const t of OWNER_TOKENS) expect(isOwnerToken(t)).toBe(true);
    expect(isOwnerToken("approve")).toBe(false);
    expect(isOwnerToken("YES")).toBe(false);
    expect(isOwnerToken("PENDING")).toBe(false);
  });
});
