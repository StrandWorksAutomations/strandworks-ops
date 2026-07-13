import { describe, it, expect } from "vitest";
import { redactForDisplay } from "@/lib/redact";
import { buildProjectFootprint, projectBySlug, type RegisterInputs } from "@/lib/projects";

// redactForDisplay is DISPLAY HYGIENE, not a universal secret scanner. The real
// secret-floor guarantee is the source-side register-content scanner proposed in
// _governance/inbox/2026-07-13-register-secret-scanner.md. These tests prove the
// render-boundary hygiene: (a) it NEVER over-masks the identifiers the dashboard
// must show (SHAs, dashless UUIDs, env-var/bucket names, prices, dates, plans,
// last-4), and (b) it robustly truncates any long DIGIT run to last-4 and masks
// known key-prefix tokens.

const SECRET = "«redacted-secret»";

describe("redactForDisplay — NO over-mask (identifiers render IN FULL)", () => {
  const inFull: [string, string][] = [
    // 40-hex commit SHA — must survive; it is letter-bearing, digits-only rules skip it.
    ["a94a8fe5ccb19ba61c4c0873d391e987982fbbd3", "commit"],
    // dashless 32-char UUID (letter-bearing hex) — must survive. The structural
    // rule only fires on runs of >=10 consecutive DIGITS, and a hex UUID
    // interleaves letters, so it is never touched.
    ["f47ac10b58cc4372a5670e02b2c3d479", "run_id"],
    // env-var name — an access-register location, must show.
    ["GITHUB_TOKEN", "key_location"],
    // bucket / path token — a location, must show.
    ["strandworks-assets-prod", "bucket"],
    ["s3://strandworks-assets-prod/haptic/renders", "asset_location"],
    // price — must show.
    ["23.32", "cost_monthly_usd"],
    ["$23.32/mo", "cost"],
    // date — must show.
    ["2026-08-08", "renewal_date"],
    // plan name — must show.
    ["Pro", "plan"],
    // already-truncated last-4 — must show (only 4 digits, below the >=10 floor).
    ["8774", "payment_last4"],
    ["•••• 8774", "payment"],
    // more legitimate content that must never be mangled.
    ["~/.ssh/id_ed25519", "key_location"],
    ["Vercel env GITHUB_TOKEN", "key_location"],
    ["1Password: SW ops vault", "key_location"],
    ["https://dashboard.strandautomationworks.com", "url"],
    ["haptic-mirror-mmo + liaison db", "notes"],
    ["700MB", "size"],
    ["Mac browser", "machines_with_access"],
    ["production", "environment"],
    ["Supabase Edge Function", "where"],
  ];
  for (const [value, col] of inFull) {
    it(`renders ${JSON.stringify(value)} (${col}) IN FULL`, () => {
      expect(redactForDisplay(value, col)).toBe(value);
    });
  }
});

describe("redactForDisplay — long DIGIT runs truncate to last-4 (any separators)", () => {
  it("truncates a 16-digit card with spaces", () => {
    expect(redactForDisplay("4111 1111 1111 8774", "payment")).toBe("•••• 8774");
  });
  it("truncates a 16-digit card with dashes", () => {
    expect(redactForDisplay("4111-1111-1111-8774", "payment")).toBe("•••• 8774");
  });
  it("truncates a 16-digit card with dots", () => {
    expect(redactForDisplay("4111.1111.1111.8774", "payment")).toBe("•••• 8774");
  });
  it("truncates a 16-digit card with slashes", () => {
    expect(redactForDisplay("4111/1111/1111/8774", "payment")).toBe("•••• 8774");
  });
  it("truncates a 16-digit card with parens", () => {
    expect(redactForDisplay("(4111)(1111)(1111)(8774)", "payment")).toContain("•••• 8774");
  });
  it("truncates a 16-digit card with NO separators", () => {
    expect(redactForDisplay("4111111111118774", "notes")).toBe("•••• 8774");
  });
  it("truncates a card with NO word boundary (x...x)", () => {
    expect(redactForDisplay("x4111111111118774x", "notes")).toBe("x•••• 8774x");
  });
  it("truncates an 11-digit run", () => {
    expect(redactForDisplay("12345678901", "account")).toBe("•••• 8901");
  });
  it("truncates a 20-digit run", () => {
    expect(redactForDisplay("12345678901234567890", "account")).toBe("•••• 7890");
  });
  it("truncates a card embedded in prose, keeping the prose", () => {
    const out = redactForDisplay("card on file 4111111111118774 for renewals", "notes");
    expect(out).toBe("card on file •••• 8774 for renewals");
  });
  it("leaves a short digit run (<10) untouched", () => {
    expect(redactForDisplay("8774", "payment_last4")).toBe("8774");
    expect(redactForDisplay("123456789", "id")).toBe("123456789"); // exactly 9 digits
  });
});

describe("redactForDisplay — known key-prefix tokens are masked", () => {
  it("masks a GitHub token (ghp_)", () => {
    expect(redactForDisplay("ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "notes")).toBe(SECRET);
  });
  it("masks an OpenAI-style key (sk-)", () => {
    expect(redactForDisplay("sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab", "notes")).toBe(SECRET);
  });
  it("masks an Anthropic key (sk-ant-)", () => {
    expect(redactForDisplay("sk-ant-api03-abcDEF123456", "notes")).toBe(SECRET);
  });
  it("masks a JWT (eyJ)", () => {
    expect(redactForDisplay("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF123", "notes")).toBe(SECRET);
  });
  it("masks an AWS access key id (AKIA)", () => {
    expect(redactForDisplay("AKIAIOSFODNN7EXAMPLE", "notes")).toBe(SECRET);
  });
  it("masks a PEM private key block", () => {
    expect(redactForDisplay("-----BEGIN OPENSSH PRIVATE KEY-----", "notes")).toContain(SECRET);
  });
  it("masks a key-prefix token embedded in prose, keeping the prose", () => {
    const out = redactForDisplay("token committed by mistake ghp_ABCDEFGHIJ0123456789 oops", "notes");
    expect(out).toContain("token committed by mistake");
    expect(out).toContain("oops");
    expect(out).toContain(SECRET);
    expect(out).not.toContain("ghp_");
  });
});

// The render-path test: poisoned register rows through the same derivation +
// render extraction that app/projects/[slug]/page.tsx performs. Proves the
// hygiene fires on the actual path — while non-secret identifiers survive.
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

describe("poisoned register rows through the render path", () => {
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
      // JWT poison in a haptic-attributed sub; legit price/date/plan/last4 alongside
      "ElevenLabs,Pro,23.32,monthly,2026-08-08,8774,active,haptic voice AI token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF123 here",
    ].join("\n"),
  };

  const rendered = renderFootprintValues(poisoned, "haptic-mirror");

  it("renders NO full card/account number (long digit run)", () => {
    expect(rendered).not.toMatch(/(?:\d[ \-./()]*){10,}\d/);
  });
  it("keeps the card's last-4 as the only trace", () => {
    expect(rendered).toContain("•••• 8774");
  });
  it("renders NO ghp_ / sk- / eyJ prefixed material", () => {
    expect(rendered).not.toContain("ghp_");
    expect(rendered).not.toMatch(/\bsk-[A-Za-z0-9]/);
    expect(rendered).not.toContain("eyJ");
  });
  it("keeps legitimate identifiers around the poison IN FULL", () => {
    // Prose in the card-notes cell survives (only the digit run is truncated).
    expect(rendered).toContain("billed to card •••• 8774");
    // A location column value (Mac browser) is untouched.
    expect(rendered).toContain("Mac browser");
    // Non-secret scalars survive.
    expect(rendered).toContain("23.32");
    expect(rendered).toContain("2026-08-08");
    // Key-prefix tokens fired the mask.
    expect(rendered).toContain(SECRET);
  });
});
