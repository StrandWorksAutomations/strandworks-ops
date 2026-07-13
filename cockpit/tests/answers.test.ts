import { describe, it, expect } from "vitest";
import {
  applyRuling,
  extractOptions,
  sanitizeAnswer,
  parseDecision,
} from "../src/lib/decisions";

const DECISION = `---
id: 2026-07-12-export-pipeline-order
filed: 2026-07-12
filed-by: orchestrator
question: In 3rdrider's export pipeline, what order do the two safety gates run?
ruling: PENDING
---

**Context:** two structural gates now exist.

**Options:**

- **A — verify first, then anonymize at the boundary** (provider verifies real values).
- **B — anonymize first, then verify** (provider verifies stripped records).
- **C — both enforced independently at the export boundary** (order internal).

Reply A / B / C (or REVISE with your own rule).
`;

describe("extractOptions", () => {
  it("finds lettered options in the decision body", () => {
    const d = parseDecision(DECISION, "x.md");
    expect(extractOptions(d.body)).toEqual(["A", "B", "C"]);
  });

  it("returns empty for bodies without lettered options", () => {
    expect(extractOptions("just prose\n- a bullet\n- **Bold** item")).toEqual([]);
  });
});

describe("sanitizeAnswer", () => {
  it("flattens newlines and strips control characters", () => {
    expect(sanitizeAnswer("A\nwith\r\nnewlines\tand \x07bell")).toBe(
      "A with newlines and bell",
    );
  });
  it("caps length at 300", () => {
    expect(sanitizeAnswer("x".repeat(400))).toHaveLength(300);
  });
  it("preserves spaces, dashes, and normal prose", () => {
    expect(sanitizeAnswer("B — but re-verify weekly")).toBe("B — but re-verify weekly");
  });
});

describe("applyRuling with answer", () => {
  it("writes the answer line into the frontmatter", () => {
    const out = applyRuling(DECISION, "APPROVE", "2026-07-13T00:00:00Z", "cockpit", "A");
    expect(out).toContain("ruling: APPROVE\nruled: 2026-07-13T00:00:00Z\nsource: cockpit\nanswer: A");
    // body preserved byte-for-byte
    expect(out).toContain("Reply A / B / C (or REVISE with your own rule).");
  });

  it("omits the answer line when no answer given", () => {
    const out = applyRuling(DECISION, "PARK", "2026-07-13T00:00:00Z");
    expect(out).not.toContain("answer:");
  });

  it("replaces a stale answer line on re-rule", () => {
    const once = applyRuling(DECISION, "APPROVE", "2026-07-13T00:00:00Z", "cockpit", "A");
    const twice = applyRuling(once, "REVISE", "2026-07-14T00:00:00Z", "cockpit", "C but audited");
    expect(twice.match(/answer:/g)).toHaveLength(1);
    expect(twice).toContain("answer: C but audited");
  });
});
