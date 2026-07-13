import { describe, it, expect } from "vitest";
import { redactForDisplay } from "@/lib/redact";
import { buildProjectFootprint, projectBySlug, type RegisterInputs } from "@/lib/projects";

// These tests feed POISONED register rows — real card numbers and raw key
// material — through the ACTUAL render/derivation path (redactForDisplay, and
// the same value-extraction the /projects/[slug] view does) and assert the
// output is MASKED. They run regex assertions on the RENDERED output, not on
// clean fixtures, proving the guard strips what convention alone would leak.

const SECRET = "«redacted-secret»";

describe("redactForDisplay — card / account numbers", () => {
  it("masks a full 16-digit card to last-4", () => {
    const out = redactForDisplay("4111111111118774", "notes");
    expect(out).not.toContain("41111111");
    expect(out).toMatch(/•••• 8774/);
  });

  it("masks a spaced/dashed card number to last-4", () => {
    expect(redactForDisplay("4111 1111 1111 8774", "payment")).toMatch(/•••• 8774/);
    expect(redactForDisplay("4111-1111-1111-8774", "payment")).toMatch(/•••• 8774/);
  });

  it("masks a card embedded in prose but keeps the prose", () => {
    const out = redactForDisplay("card on file 4111111111118774 for renewals", "notes");
    expect(out).toContain("card on file");
    expect(out).toContain("for renewals");
    expect(out).not.toMatch(/\d{12,19}/);
    expect(out).toMatch(/•••• 8774/);
  });

  it("masks a bare account number (12-19 digits)", () => {
    expect(redactForDisplay("000123456789012", "account")).toMatch(/••••/);
    expect(redactForDisplay("000123456789012", "account")).not.toMatch(/\b\d{12,19}\b/);
  });
});

describe("redactForDisplay — key / credential material", () => {
  it("masks a GitHub token (ghp_)", () => {
    expect(redactForDisplay("ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "notes")).toBe(SECRET);
  });
  it("masks an OpenAI-style key (sk-)", () => {
    expect(redactForDisplay("sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab", "notes")).toBe(SECRET);
  });
  it("masks a JWT (eyJ)", () => {
    expect(
      redactForDisplay("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF123", "notes"),
    ).toBe(SECRET);
  });
  it("masks an AWS access key id (AKIA)", () => {
    expect(redactForDisplay("AKIAIOSFODNN7EXAMPLE", "notes")).toBe(SECRET);
  });
  it("masks a PEM private key block", () => {
    expect(redactForDisplay("-----BEGIN OPENSSH PRIVATE KEY-----", "notes")).toBe(SECRET);
  });
  it("masks a 40-char hex string (raw key / hash-shaped secret)", () => {
    const hex = "a".repeat(20) + "0".repeat(20); // 40 hex chars
    expect(redactForDisplay(hex, "notes")).toContain(SECRET);
    expect(redactForDisplay(hex, "notes")).not.toContain(hex);
  });
  it("masks a long high-entropy mixed token with no known prefix", () => {
    const raw = "Xa9Kd2Lm8Qp3Rt7Vz1Bw6Nc4"; // 25 chars, mixed
    expect(redactForDisplay(raw, "notes")).toContain(SECRET);
  });
});

describe("redactForDisplay — key_location column semantics", () => {
  it("passes a real filesystem location untouched", () => {
    expect(redactForDisplay("~/.ssh/id_ed25519", "key_location")).toBe("~/.ssh/id_ed25519");
  });
  it("passes an env-var reference location untouched", () => {
    expect(redactForDisplay("Vercel env GITHUB_TOKEN", "key_location")).toBe("Vercel env GITHUB_TOKEN");
    expect(redactForDisplay("1Password: SW ops vault", "key_location")).toBe("1Password: SW ops vault");
  });
  it("MASKS a raw key value dropped into key_location", () => {
    expect(redactForDisplay("ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "key_location")).toBe(SECRET);
    expect(redactForDisplay("Xa9Kd2Lm8Qp3Rt7Vz1Bw6Nc4Ef", "key_location")).toBe(SECRET);
  });
});

describe("redactForDisplay — does NOT mangle legitimate content", () => {
  const clean: [string, string][] = [
    ["2026-08-11", "renewal_date"],
    ["67.18", "cost_monthly_usd"],
    ["$23.32/mo", "cost"],
    ["8774", "payment_last4"],
    ["•••• 8774", "payment"],
    ["~/.ssh/id_ed25519", "key_location"],
    ["Vercel env GITHUB_TOKEN", "key_location"],
    ["https://dashboard.strandautomationworks.com", "url"],
    ["Pro", "plan"],
    ["active-HIDDEN", "status"],
    ["haptic-mirror-mmo + liaison db", "notes"],
    ["700MB", "size"],
    ["Mac browser", "machines_with_access"],
    ["production", "environment"],
    ["Supabase Edge Function", "where"],
  ];
  for (const [value, col] of clean) {
    it(`leaves ${JSON.stringify(value)} (${col}) unchanged`, () => {
      expect(redactForDisplay(value, col)).toBe(value);
    });
  }
});

// The real test: poisoned register rows through the derivation + render path.
// We mirror exactly what app/projects/[slug]/page.tsx renders: for each
// attributed row it emits every non-empty field value as `redactForDisplay(v, k)`.
function renderFootprintValues(inputs: RegisterInputs, slug: string): string {
  const proj = projectBySlug(slug)!;
  const fp = buildProjectFootprint(proj, inputs);
  const sections = [fp.infra, fp.assets, fp.access, fp.models, fp.subscriptions];
  const out: string[] = [];
  for (const section of sections) {
    for (const { row } of section) {
      for (const [k, v] of Object.entries(row)) {
        if (v === "") continue;
        out.push(redactForDisplay(v, k));
      }
    }
  }
  return out.join("\n");
}

describe("poisoned register rows through the render path are MASKED", () => {
  const poisoned: RegisterInputs = {
    services: [
      "service,what_it_runs,project,environment,notes",
      // full 16-digit card dropped into a notes cell
      "Supabase,haptic backend,haptic-mirror,production,billed to card 4111111111118774",
    ].join("\n"),
    access: [
      "system,account,machines_with_access,key_location,notes",
      // raw ghp_ token in key_location (should be a LOCATION), sk- token in notes
      "GitHub,,Mac browser,ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,haptic token sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab leaked here",
    ].join("\n"),
    subscriptions: [
      "service,plan,cost_monthly_usd,billing_cadence,renewal_date,payment_last4,status,notes",
      // 40-char hex + JWT poison in a haptic-attributed sub
      "ElevenLabs,Pro,23.32,monthly,2026-08-08,8774,active,haptic voice AI token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF123 hash aaaaaaaaaaaaaaaaaaaa00000000000000000000",
    ].join("\n"),
  };

  const rendered = renderFootprintValues(poisoned, "haptic-mirror");

  it("renders NO full card/account number (12-19 digit run)", () => {
    expect(rendered).not.toMatch(/(?:\d[ -]?){12,19}/);
  });
  it("keeps the card's last-4 as the only trace", () => {
    expect(rendered).toMatch(/•••• 8774/);
  });
  it("renders NO ghp_ / sk- / eyJ / AKIA prefixed material", () => {
    expect(rendered).not.toMatch(/ghp_[A-Za-z0-9]/);
    expect(rendered).not.toMatch(/\bsk-[A-Za-z0-9]/);
    expect(rendered).not.toMatch(/eyJ[A-Za-z0-9]/);
    expect(rendered).not.toMatch(/AKIA[A-Z0-9]/);
  });
  it("renders NO 40-char hex secret", () => {
    expect(rendered).not.toMatch(/[0-9a-f]{40}/);
  });
  it("still renders legitimate content around the poison", () => {
    // Prose in the card-notes cell survives (only the digit run is masked).
    expect(rendered).toContain("billed to card •••• 8774");
    // A location column value (Mac browser) is untouched.
    expect(rendered).toContain("Mac browser");
    // Non-secret scalars survive.
    expect(rendered).toContain("23.32");
    expect(rendered).toContain("2026-08-08");
    // A cell carrying a JWT/hex prefix is masked WHOLE (conservative) — proof
    // the guard fired, not just absence of the token.
    expect(rendered).toContain(SECRET);
  });
});
