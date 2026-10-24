import { describe, expect, it } from "vitest";
import { BUSINESSES, businessForProject, businessForEntity, businessStatus, buildBusinessBoard } from "../src/lib/businesses";
import { parseProjects } from "../src/lib/projects";
import { email, loopItem, dueItem, NOW } from "./inbox-fixtures";

const empty = { emails: [], latestEmail: [], items: [], events: [], dueItems: [], projects: [] };
describe("business source mapping", () => {
  it("keeps the nine businesses in the requested order", () => {
    expect(BUSINESSES.map((business) => business.key)).toEqual(["kinetic-clinician", "kinetic-medic", "tenetrix", "strandworks",
      "strandworks-medical", "sag", "ember-vellum", "medsim", "personal-career"]);
  });
  it.each([
    ["highest-paying", "kinetic-clinician"], ["kinetic-clinician", "kinetic-clinician"], ["the-kinetic-medic", "kinetic-medic"],
    ["BadgeMedia", "tenetrix"], ["tenetrix-orchard", "tenetrix"], ["SmartBadge", "tenetrix"], ["tenetrix-insight", "tenetrix"],
    ["strandworks-ops", "strandworks"], ["strand-automation-works-new", "strandworks"], ["strandworks-corporate", "strandworks"],
    ["portfolio", "strandworks"], ["contracting-startup", "strandworks-medical"], ["wildfire", "strandworks-medical"],
    ["sag-international", "sag"], ["ember-and-vellum", "ember-vellum"], ["MedSim-Game", "medsim"], ["medsim-physio", "medsim"],
  ])("maps project folder %s to %s", (folder, key) => {
    expect(businessForProject(folder)?.key).toBe(key);
    expect(businessForProject(`/Users/owner/PROJECTS/${folder}/`)?.key).toBe(key);
  });
  it.each([
    ["Kinetic Clinician LLC", "kinetic-clinician"], ["The Kinetic Medic", "kinetic-medic"], ["TENETRIX, LLC", "tenetrix"],
    ["BadgeMedia LLC", "tenetrix"], ["Smart Badge, LLC", "tenetrix"],
    ["Strandworks LLC", "strandworks"], ["Strand Automation Works, LLC", "strandworks"],
    ["Strandworks Medical Resources LLC", "strandworks-medical"], ["Medical Resources (Kentucky)", "strandworks-medical"],
    ["SAG International LLC", "sag"], ["Special Activities Group", "sag"], ["Ember & Vellum, LLC", "ember-vellum"],
    ["MedSim", "medsim"], ["Jonathan Bouren — paramedic", "personal-career"],
  ])("loosely matches entity %s without mixing businesses", (entity, key) => { expect(businessForEntity(entity)?.key).toBe(key); });
  it("leaves unrelated projects and partial word collisions unattributed", () => {
    expect(businessForProject("unrelated")).toBeUndefined();
    expect(businessForProject("personal-career")).toBeUndefined();
    expect(businessForEntity("message company")).toBeUndefined();
    expect(businessForEntity("StrandworksMedical")).toBeUndefined();
  });
});

describe("business status", () => {
  it.each([[1, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 2]])("needs the owner for reviews, decisions or overdue dates (%s,%s,%s,%s)", (a, b, c, d) => {
    expect(businessStatus(a, b, c, d)).toBe("Needs you");
  });
  it("waits for agents after a ruling and stays quiet with no actions", () => {
    expect(businessStatus(0, 0, 0, 2)).toBe("Waiting on agents");
    expect(businessStatus(0, 0, 0, 0)).toBe("Quiet");
  });
});

describe("business board aggregation", () => {
  it("counts reviews and high priority, names the top item and keeps medical separate", () => {
    const cards = buildBusinessBoard({ ...empty, emails: [email({ priority: "normal" }), email({ id: "high", priority: "high" }),
      email({ id: "medical", business: "strandworks-medical" }), email({ id: "closed", status: "done" })],
      items: [loopItem(), loopItem({ project: "contracting-startup" })] }, NOW);
    const company = cards.find((card) => card.business.key === "strandworks")!;
    expect(company.emails).toHaveLength(2);
    expect(company.highPriority).toBe(1);
    expect(company.emails[0].id).toBe("high");
    expect(company.decisions).toHaveLength(1);
    expect(company.status).toBe("Needs you");
    expect(cards.find((card) => card.business.key === "strandworks-medical")?.emails).toHaveLength(1);
  });
  it("counts only unclaimed rulings older than 24 hours as stalled", () => {
    const cards = buildBusinessBoard({ ...empty, items: [
      loopItem({ id: "stalled", status: "ruled", ruled_at: "2026-10-23T11:59:59Z" }),
      loopItem({ id: "boundary", status: "ruled", ruled_at: "2026-10-23T12:00:00Z" }),
      loopItem({ id: "picked", status: "picked_up", ruled_at: "2026-10-20T12:00:00Z" }),
      loopItem({ id: "done", status: "done", ruled_at: "2026-10-20T12:00:00Z" }),
    ] }, NOW).find((card) => card.business.key === "strandworks")!;
    expect(cards.stalled.map((item) => item.id)).toEqual(["stalled"]);
    expect(cards.waiting).toHaveLength(3);
    expect(cards.status).toBe("Waiting on agents");
  });
  it("uses the waiting status for stalled or picked-up work, with recent rulings still inside their pickup window", () => {
    const card = buildBusinessBoard({ ...empty, items: [loopItem({ status: "ruled", ruled_at: "2026-10-24T10:00:00Z" })] }, NOW)[3];
    expect(card.stalled).toHaveLength(0);
    expect(card.status).toBe("Quiet");
  });
  it("includes overdue and next-14-day dates using Eastern days and excludes closed or later dates", () => {
    const cards = buildBusinessBoard({ ...empty, items: [
      loopItem({ kind: "deadline", title: "Overdue", due_at: "2026-10-23T12:00:00Z" }),
      loopItem({ kind: "milestone", title: "Last day ET", due_at: "2026-11-08T04:59:59Z" }),
      loopItem({ kind: "deadline", title: "Outside ET", due_at: "2026-11-08T05:00:00Z" }),
      loopItem({ kind: "deadline", status: "done", due_at: "2026-10-25T12:00:00Z" }),
      loopItem({ kind: "decision", title: "Decision is counted separately", due_at: "2026-10-25T12:00:00Z" }),
    ], dueItems: [dueItem({ item: "Boundary", dueOn: "2026-11-07" }), dueItem({ item: "Later", dueOn: "2026-11-08" }),
      dueItem({ status: "completed" }), dueItem({ entity: "Strandworks Medical Resources LLC" })] }, NOW);
    const company = cards.find((card) => card.business.key === "strandworks")!;
    expect(company.dates.map((date) => date.title)).toEqual(["Overdue", "Boundary", "Last day ET"]);
    expect(cards.find((card) => card.business.key === "strandworks-medical")?.dates).toHaveLength(1);
    expect(company.status).toBe("Needs you");
  });
  it("does not mark a date-only obligation overdue until the next Eastern day", () => {
    const card = buildBusinessBoard({ ...empty, dueItems: [dueItem({ dueOn: "2026-10-24" })] }, NOW)[3];
    expect(card.dates[0].overdue).toBe(false);
    expect(card.status).toBe("Quiet");
  });
  it("uses projects.csv path rather than slug and picks the newest recorded activity", () => {
    const projects = parseProjects("slug,name,path,last_commit\nwrong-slug,Renamed,MedSim-Game,2026-10-23\nmedsim-physio,Unrelated,unrelated,2026-10-24");
    const medsim = buildBusinessBoard({ ...empty, projects, latestEmail: [{ business: "medsim", received_at: "2026-10-21T12:00:00Z" }],
      events: [{ id: "event", item_id: "x", at: "2026-10-23T20:00:00Z", actor: "claude", type: "done", note: null,
        item: { ref: "D-0001", title: "Done", project: "medsim-physio" } }] }, NOW)[7];
    expect(medsim.lastActivity).toBe("2026-10-23T20:00:00Z");
    expect(buildBusinessBoard({ ...empty, projects }, NOW)[7].lastActivity).toBe("2026-10-23");
  });
  it("allows old email activity, ignores invalid dates and leaves empty businesses quiet", () => {
    const cards = buildBusinessBoard({ ...empty, latestEmail: [{ business: "sag", received_at: "2026-08-01T12:00:00Z" },
      { business: "sag", received_at: "invalid" }] }, NOW);
    expect(cards[5].lastActivity).toBe("2026-08-01T12:00:00Z");
    expect(cards[8]).toMatchObject({ lastActivity: null, status: "Quiet", emails: [], decisions: [], dates: [] });
  });
});
