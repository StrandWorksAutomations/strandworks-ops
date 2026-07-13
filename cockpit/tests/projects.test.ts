import { describe, it, expect } from "vitest";
import {
  PROJECTS,
  projectBySlug,
  attributeRows,
  buildProjectFootprint,
  type ProjectDef,
  type RegisterInputs,
} from "@/lib/projects";

const HAPTIC = projectBySlug("haptic-mirror")!;
const MEDSIM = projectBySlug("medsim-game")!;
const OPS = projectBySlug("strandworks-ops")!;

describe("project registry", () => {
  it("has unique url-safe slugs and includes the portfolio + ops projects", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
    for (const s of ["3rdrider", "haptic-mirror", "medsim-game", "liaison-dashboard", "strandworks-ops"]) {
      expect(slugs).toContain(s);
    }
  });
  it("resolves by slug, undefined for unknown", () => {
    expect(projectBySlug("haptic-mirror")?.name).toBe("haptic-mirror");
    expect(projectBySlug("nope")).toBeUndefined();
  });
});

describe("attributeRows — register → project mapping", () => {
  const services = [
    "service,what_it_runs,project,environment,notes",
    "Supabase,haptic-mirror-mmo backend,haptic-mirror + liaison-dashboard,production,paused",
    "RunPod,blender migration pods,MedSim-Game + command-station,episodic,volumes bill",
    "GitHub,org repos,all,infrastructure,shared vcs",
    "Vercel,cockpit,strandworks-ops,production,passkey-gated",
  ].join("\n");

  it("attributes a row whose project column names the project (dedicated)", () => {
    const rows = attributeRows(services, HAPTIC, ["service", "what_it_runs", "project", "notes"], "project");
    const supa = rows.find((r) => r.row.service === "Supabase");
    expect(supa).toBeDefined();
    expect(supa!.scope).toBe("dedicated");
  });

  it("surfaces all-scope infra as SHARED on a project that isn't named", () => {
    const rows = attributeRows(services, HAPTIC, ["service", "what_it_runs", "project", "notes"], "project");
    const gh = rows.find((r) => r.row.service === "GitHub");
    expect(gh).toBeDefined();
    expect(gh!.scope).toBe("shared");
  });

  it("does NOT attribute a row that names only a different single project", () => {
    // RunPod is scoped to MedSim-Game + command-station — not haptic-mirror.
    const rows = attributeRows(services, HAPTIC, ["service", "what_it_runs", "project", "notes"], "project");
    expect(rows.find((r) => r.row.service === "RunPod")).toBeUndefined();
    // ...but it IS attributed to MedSim-Game as dedicated.
    const medsimRows = attributeRows(services, MEDSIM, ["service", "what_it_runs", "project", "notes"], "project");
    const rp = medsimRows.find((r) => r.row.service === "RunPod");
    expect(rp?.scope).toBe("dedicated");
  });

  it("attributes strandworks-ops-scoped rows as dedicated to ops", () => {
    const rows = attributeRows(services, OPS, ["service", "what_it_runs", "project", "notes"], "project");
    const v = rows.find((r) => r.row.service === "Vercel");
    expect(v?.scope).toBe("dedicated");
  });

  it("invents nothing — every attributed row is a verbatim register row", () => {
    const rows = attributeRows(services, MEDSIM, ["service", "what_it_runs", "project", "notes"], "project");
    for (const { row } of rows) {
      // every value must have come from the CSV; no synthetic keys added
      expect(Object.keys(row).sort()).toEqual(
        ["environment", "notes", "project", "service", "what_it_runs"].sort(),
      );
    }
  });
});

describe("buildProjectFootprint", () => {
  const inputs: RegisterInputs = {
    services: [
      "service,what_it_runs,project,environment,notes",
      "Supabase,haptic backend,haptic-mirror,production,paused",
      "GitHub,org repos,all,infrastructure,shared",
    ].join("\n"),
    assets: [
      "asset,type,location,size,hash,project,canonical,notes",
      "MedSim game assets,engine,repo,700MB,,MedSim-Game,yes,in git",
    ].join("\n"),
    access: [
      "system,account,machines_with_access,key_location,notes",
      "Supabase,,Mac browser,,haptic-mirror project db lives here",
    ].join("\n"),
    models: [
      "name,kind,where,cost_model,notes",
      "Haiku 4.5,frontier LLM (API),via Supabase Edge Function,usage,powers sim patient dialogue haptic-mirror",
    ].join("\n"),
    subscriptions: [
      "service,plan,cost_monthly_usd,billing_cadence,renewal_date,payment_last4,status,notes",
      "Supabase,Pro,67.18,monthly,2026-08-11,8774,active,haptic-mirror-mmo + liaison db",
      "ElevenLabs,,23.32,monthly,2026-08-08,8774,active,haptic voice AI",
      "Meshy,,,monthly,,8774,active-HIDDEN,haptic asset gen no cost recorded",
    ].join("\n"),
  };

  it("assembles a footprint with per-register attributed rows", () => {
    const fp = buildProjectFootprint(HAPTIC, inputs);
    expect(fp.infra.length).toBeGreaterThan(0); // Supabase dedicated + GitHub shared
    expect(fp.assets.length).toBe(0); // MedSim asset does not match haptic
    expect(fp.access.length).toBe(1);
    expect(fp.models.length).toBe(1);
    expect(fp.subscriptions.length).toBe(3);
  });

  it("splits dedicated vs shared spend — shared services are never double-counted", () => {
    const fp = buildProjectFootprint(HAPTIC, inputs);
    // Supabase names haptic-mirror AND liaison → SHARED ($67.18, reported
    // separately); ElevenLabs names only haptic → dedicated $23.32.
    expect(fp.spendMonthlyUsd).toBeCloseTo(23.32, 2);
    expect(fp.sharedMonthlyUsd).toBeCloseTo(67.18, 2);
    expect(fp.subscriptions.find((s) => s.row.service === "Supabase")?.scope).toBe("shared");
    expect(fp.subscriptions.find((s) => s.row.service === "ElevenLabs")?.scope).toBe("dedicated");
    expect(fp.spendHasUncosted).toBe(true); // Meshy: dedicated, no cost
  });

  it("the same shared row shows as shared on BOTH projects, dedicated on neither", () => {
    const liaison = projectBySlug("liaison-dashboard")!;
    const fpL = buildProjectFootprint(liaison, inputs);
    expect(fpL.subscriptions.find((s) => s.row.service === "Supabase")?.scope).toBe("shared");
    expect(fpL.sharedMonthlyUsd).toBeCloseTo(67.18, 2);
    expect(fpL.spendMonthlyUsd).toBe(0);
  });

  it("keeps blank blank — a project with no matches gets empty sections, no invented rows", () => {
    const lonely: ProjectDef = { slug: "ghost", name: "Ghost", role: "x", tokens: ["zzzznomatch"] };
    const fp = buildProjectFootprint(lonely, inputs);
    // only all-scope shared infra (GitHub) can attach; dedicated sections stay empty
    expect(fp.assets).toHaveLength(0);
    expect(fp.access).toHaveLength(0);
    expect(fp.subscriptions).toHaveLength(0);
    expect(fp.spendMonthlyUsd).toBe(0);
  });

  it("never renders a full card/account number in any attributed value", () => {
    const fp = buildProjectFootprint(HAPTIC, inputs);
    const all = [...fp.infra, ...fp.access, ...fp.subscriptions]
      .flatMap(({ row }) => Object.values(row))
      .join(" ");
    expect(all).not.toMatch(/\b\d{12,19}\b/);
  });

  it("tolerates missing registers (null input) without throwing", () => {
    const fp = buildProjectFootprint(HAPTIC, { services: null, subscriptions: null });
    expect(fp.infra).toHaveLength(0);
    expect(fp.subscriptions).toHaveLength(0);
    expect(fp.spendMonthlyUsd).toBe(0);
  });
});
