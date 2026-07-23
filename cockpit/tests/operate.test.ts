import { describe, it, expect } from "vitest";
import {
  feedCategory,
  feedSeverity,
  feedToEvent,
  parseOptions,
  normalizeTier,
  questionRaisedEvent,
  answerToEvent,
  mergeRiver,
  bandOf,
  groupIntoBands,
  sortPending,
  deriveAgentPresence,
  serviceSeverity,
  computeRunwayMonths,
  validateAnswerInput,
  ageLabel,
  excerpt,
  type FeedRow,
  type QuestionRow,
  type AnswerRow,
} from "@/lib/operate";

const NOW = Date.parse("2026-07-23T18:00:00.000Z");
const minsAgo = (m: number) => new Date(NOW - m * 60000).toISOString();

function feed(partial: Partial<FeedRow>): FeedRow {
  return {
    id: "f1",
    kind: "daily-brief",
    lane: "ops",
    importance: 3,
    agent: "claude",
    title: "Daily brief",
    body_md: null,
    created_at: minsAgo(2),
    ...partial,
  };
}

function question(partial: Partial<QuestionRow>): QuestionRow {
  return {
    question_id: "q1",
    title: "Approve the upgrade?",
    body: "body",
    tier: "normal",
    agent: "claude",
    status: "pending",
    options: null,
    asker_session: "claude-cli",
    created_at: minsAgo(30),
    ...partial,
  };
}

describe("feed category + severity mapping", () => {
  it("routes scout kinds to the scout category", () => {
    expect(feedCategory("tech-scout", "Tech Scout Report")).toBe("scout");
    expect(feedCategory("claude-scout", "Capability scout")).toBe("scout");
  });

  it("detects deploys from kind or title keywords", () => {
    expect(feedCategory("custom", "Vercel deploy succeeded")).toBe("deploy");
    expect(feedCategory("daily-brief", "morning summary")).toBe("agent");
  });

  it("encodes severity: errors crit, scouts info, high importance warn, low quiet", () => {
    expect(feedSeverity("custom", 3, "Vercel deploy FAILED")).toBe("crit");
    expect(feedSeverity("tech-scout", 3, "Tech Scout")).toBe("info");
    expect(feedSeverity("automation-health", 4, "health")).toBe("warn");
    expect(feedSeverity("custom", 1, "heartbeat")).toBe("quiet");
    expect(feedSeverity("custom", 3, "normal note")).toBe("info");
  });

  it("attaches a detail card only for warn/crit rows with a body", () => {
    const warnEv = feedToEvent(feed({ importance: 4, body_md: "something worth reading" }));
    expect(warnEv.detail).toBeDefined();
    const routineEv = feedToEvent(feed({ importance: 3, body_md: "routine" }));
    expect(routineEv.detail).toBeUndefined();
  });
});

describe("excerpt", () => {
  it("strips frontmatter and markdown, truncating with an ellipsis", () => {
    const md = "---\nname: x\n---\n# Heading\n\n**bold** body text here";
    const out = excerpt(md, 40);
    expect(out.startsWith("Heading")).toBe(true);
    expect(out).not.toContain("**");
    expect(out).not.toContain("---");
  });
});

describe("parseOptions", () => {
  it("keeps well-formed {label,value} pairs and coerces numeric values", () => {
    expect(parseOptions([{ label: "Yes", value: "y" }, { label: "No", value: 2 }])).toEqual([
      { label: "Yes", value: "y" },
      { label: "No", value: "2" },
    ]);
  });
  it("returns [] for null or malformed input", () => {
    expect(parseOptions(null)).toEqual([]);
    expect(parseOptions([{ nope: 1 }])).toEqual([]);
  });
});

describe("normalizeTier", () => {
  it("passes urgent/fyi through and defaults everything else to normal", () => {
    expect(normalizeTier("urgent")).toBe("urgent");
    expect(normalizeTier("fyi")).toBe("fyi");
    expect(normalizeTier("weird")).toBe("normal");
  });
});

describe("river event construction", () => {
  it("raised decisions are warn, answered decisions are ok", () => {
    expect(questionRaisedEvent(question({})).severity).toBe("warn");
    const a: AnswerRow = {
      question_id: "q1",
      answer_value: "approve",
      free_text: null,
      answered_at: minsAgo(1),
      title: "Approve the upgrade?",
      agent: "claude",
    };
    const ev = answerToEvent(a);
    expect(ev.severity).toBe("ok");
    expect(ev.msg).toContain("approve");
  });
});

describe("mergeRiver", () => {
  it("merges all sources and sorts newest-first, capping length", () => {
    const feeds = [feed({ id: "a", created_at: minsAgo(50) }), feed({ id: "b", created_at: minsAgo(2) })];
    const pend = [question({ question_id: "q9", created_at: minsAgo(20) })];
    const answers: AnswerRow[] = [
      { question_id: "q8", answer_value: "x", free_text: null, answered_at: minsAgo(1), title: "t", agent: "claude" },
    ];
    const merged = mergeRiver(feeds, pend, answers, 3);
    expect(merged).toHaveLength(3);
    // newest first: answer(1m) > feed b(2m) > pend(20m) ... feed a(50m) dropped by cap
    expect(merged[0].id).toBe("q-answered:q8:" + answers[0].answered_at);
    expect(merged[1].id).toBe("feed:b");
    expect(merged.some((e) => e.id === "feed:a")).toBe(false);
  });
});

describe("time bands", () => {
  it("classifies by recency", () => {
    expect(bandOf(minsAgo(2), NOW)).toBe("now");
    expect(bandOf(minsAgo(30), NOW)).toBe("hour");
    expect(bandOf(minsAgo(300), NOW)).toBe("today");
    expect(bandOf(new Date(NOW - 3 * 86400000).toISOString(), NOW)).toBe("earlier");
  });

  it("always emits the now band, and skips empty later bands", () => {
    const evs = mergeRiver([feed({ id: "old", created_at: new Date(NOW - 3 * 86400000).toISOString() })], [], []);
    const bands = groupIntoBands(evs, NOW);
    expect(bands[0].key).toBe("now");
    expect(bands.map((b) => b.key)).toContain("earlier");
    expect(bands.map((b) => b.key)).not.toContain("hour");
  });
});

describe("sortPending", () => {
  it("orders urgent > normal > fyi, then oldest-first within a tier", () => {
    const qs = [
      question({ question_id: "fyi-new", tier: "fyi", created_at: minsAgo(5) }),
      question({ question_id: "urgent", tier: "urgent", created_at: minsAgo(1) }),
      question({ question_id: "normal-old", tier: "normal", created_at: minsAgo(100) }),
      question({ question_id: "normal-new", tier: "normal", created_at: minsAgo(10) }),
    ];
    const sorted = sortPending(qs, NOW).map((d) => d.questionId);
    expect(sorted).toEqual(["urgent", "normal-old", "normal-new", "fyi-new"]);
  });

  it("parses options into the dock model", () => {
    const [d] = sortPending([question({ options: [{ label: "Approve", value: "ok" }] })], NOW);
    expect(d.options).toEqual([{ label: "Approve", value: "ok" }]);
  });
});

describe("deriveAgentPresence", () => {
  it("marks recent agents active and stale agents idle, roster always present", () => {
    const feeds = [
      feed({ agent: "claude", created_at: minsAgo(2), title: "committing" }),
      feed({ agent: "codex", created_at: minsAgo(90), title: "old run" }),
    ];
    const presence = deriveAgentPresence(feeds, [], NOW);
    const byAgent = Object.fromEntries(presence.map((p) => [p.agent, p]));
    expect(byAgent.claude.active).toBe(true);
    expect(byAgent.claude.detail).toBe("committing");
    expect(byAgent.codex.active).toBe(false);
    expect(byAgent.codex.status).toMatch(/IDLE/);
    // antigravity never appeared but is in the roster
    expect(byAgent.antigravity.status).toBe("OFFLINE");
    // active sorts before inactive
    expect(presence[0].active).toBe(true);
  });
});

describe("serviceSeverity", () => {
  it("maps environment words to severities", () => {
    expect(serviceSeverity("production")).toBe("ok");
    expect(serviceSeverity("paused")).toBe("quiet");
    expect(serviceSeverity("degraded")).toBe("warn");
    expect(serviceSeverity("episodic")).toBe("info");
  });
});

describe("computeRunwayMonths", () => {
  it("floors reserve / burn, and returns null when either is missing", () => {
    expect(computeRunwayMonths(10000, 1920)).toBe(5);
    expect(computeRunwayMonths(null, 1920)).toBeNull();
    expect(computeRunwayMonths(10000, 0)).toBeNull();
  });
});

describe("validateAnswerInput", () => {
  it("accepts a valid option answer", () => {
    const r = validateAnswerInput({ questionId: "social-scrape-1a1d", answerValue: "login" });
    expect(r.ok).toBe(true);
  });
  it("accepts free text only", () => {
    const r = validateAnswerInput({ questionId: "q1", freeText: "do it" });
    expect(r).toMatchObject({ ok: true, value: { freeText: "do it" } });
  });
  it("rejects a missing/invalid questionId", () => {
    expect(validateAnswerInput({ answerValue: "x" }).ok).toBe(false);
    expect(validateAnswerInput({ questionId: "bad id!", answerValue: "x" }).ok).toBe(false);
  });
  it("rejects when neither answerValue nor freeText is present", () => {
    const r = validateAnswerInput({ questionId: "q1" });
    expect(r.ok).toBe(false);
  });
  it("rejects over-long fields and non-string bodies", () => {
    expect(validateAnswerInput({ questionId: "q1", answerValue: "x".repeat(500) }).ok).toBe(false);
    expect(validateAnswerInput("nope").ok).toBe(false);
  });
});

describe("ageLabel", () => {
  it("renders human-friendly ages", () => {
    expect(ageLabel(minsAgo(0.1), NOW)).toBe("just now");
    expect(ageLabel(minsAgo(5), NOW)).toBe("5m");
    expect(ageLabel(minsAgo(120), NOW)).toBe("2h");
    expect(ageLabel(new Date(NOW - 2 * 86400000).toISOString(), NOW)).toBe("2d");
  });
});
