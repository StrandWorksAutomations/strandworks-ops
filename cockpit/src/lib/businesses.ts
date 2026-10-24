import { reviewEmails, type IntakeReview } from "./intake";
import type { DueItem } from "./due-items";
import type { ProjectDef } from "./projects";
import { buildTimelineUpcoming, isStalled, ownerDay, type OwnerLoopItem, type OwnerLoopEvent } from "./owner-loop";

export const BUSINESSES = [
  { key: "kinetic-clinician", name: "Kinetic Clinician", projects: ["highest-paying", "kinetic-clinician"], entities: ["kinetic clinician", "highest paying"] },
  { key: "kinetic-medic", name: "The Kinetic Medic", projects: ["the-kinetic-medic"], entities: ["kinetic medic"] },
  { key: "tenetrix", name: "Tenetrix", projects: ["BadgeMedia", "tenetrix-orchard", "SmartBadge", "tenetrix-insight"], entities: ["tenetrix", "badge media", "badgemedia", "smartbadge", "smart badge"] },
  { key: "strandworks", name: "Strandworks LLC", projects: ["strandworks-ops", "strand-automation-works-new", "strandworks-corporate", "portfolio"], entities: ["strandworks", "strandworks llc", "strand automation works", "strandworks automation works"] },
  { key: "strandworks-medical", name: "Strandworks Medical Resources", projects: ["contracting-startup", "wildfire"], entities: ["strandworks medical", "medical resources"] },
  { key: "sag", name: "Special Activities Group", projects: ["sag-international"], entities: ["special activities group", "sag", "sag international"] },
  { key: "ember-vellum", name: "Ember & Vellum", projects: ["ember-and-vellum"], entities: ["ember vellum", "ember and vellum"] },
  { key: "medsim", name: "MedSim", projects: ["MedSim-Game", "medsim-physio"], entities: ["medsim", "med sim"] },
  { key: "personal-career", name: "Personal career & licenses", projects: [], entities: ["personal career", "personal licenses", "jonathan bouren"] },
] as const;
export type BusinessKey = typeof BUSINESSES[number]["key"];

export function businessByKey(key: string) { return BUSINESSES.find((business) => business.key === key); }
export function businessName(key: string): string { return businessByKey(key)?.name ?? "Other"; }

function folder(path: string): string { return path.replace(/\/+$/, "").split("/").pop()?.toLowerCase() ?? ""; }
export function businessForProject(project: string) {
  return BUSINESSES.find((business) => business.projects.some((name) => name.toLowerCase() === folder(project)));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

// Choose the most specific alias first, so Medical never lands in the parent
// Strandworks company. Word boundaries keep e.g. SAG out of "message".
export function businessForEntity(entity: string) {
  const text = ` ${normalize(entity)} `;
  const aliases = BUSINESSES.flatMap((business) => business.entities.map((alias) => ({ business, alias: normalize(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);
  return aliases.find(({ alias }) => text.includes(` ${alias} `))?.business;
}

export function businessStatus(review: number, decisions: number, overdue: number, waiting: number) {
  if (review || decisions || overdue) return "Needs you";
  if (waiting) return "Waiting on agents";
  return "Quiet";
}

export function buildBusinessBoard(input: {
  emails: IntakeReview[]; latestEmail: { business: string; received_at: string }[];
  items: OwnerLoopItem[]; events: OwnerLoopEvent[]; dueItems: DueItem[]; projects: ProjectDef[];
}, now: Date) {
  const today = ownerDay(now.toISOString());
  const through = new Date(`${today}T12:00:00Z`);
  through.setUTCDate(through.getUTCDate() + 14);
  const endDay = through.toISOString().slice(0, 10);
  return BUSINESSES.map((business) => {
    const items = input.items.filter((item) => businessForProject(item.project)?.key === business.key);
    const emails = reviewEmails(input.emails.filter((item) => item.business === business.key));
    const decisions = items.filter((item) => item.kind === "decision" && item.status === "open")
      .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999") || a.created_at.localeCompare(b.created_at));
    const stalled = items.filter((item) => isStalled(item, now)).sort((a, b) => (a.ruled_at ?? "").localeCompare(b.ruled_at ?? ""));
    const waiting = items.filter((item) => item.status === "ruled" || item.status === "picked_up");
    const dates = buildTimelineUpcoming(
      items.filter((item) => item.kind === "deadline" || item.kind === "milestone"),
      input.dueItems.filter((item) => businessForEntity(item.entity)?.key === business.key), now,
    ).filter((entry) => (entry.source === "business" ? entry.dueAt.slice(0, 10) : ownerDay(entry.dueAt)) <= endDay);
    const activity = [
      ...input.events.filter((event) => businessForProject(event.item?.project ?? "")?.key === business.key).map((event) => event.at),
      ...input.latestEmail.filter((email) => email.business === business.key).map((email) => email.received_at),
      ...input.emails.filter((email) => email.business === business.key).map((email) => email.received_at),
      ...input.projects.filter((project) => businessForProject(project.path)?.key === business.key).map((project) => project.lastCommit),
    ].filter((iso) => Number.isFinite(Date.parse(iso)) && Date.parse(iso) <= now.getTime())
      .sort((a, b) => Date.parse(b) - Date.parse(a));
    return { business, emails, highPriority: emails.filter((email) => email.priority === "high").length,
      decisions, stalled, waiting, dates, lastActivity: activity[0] ?? null,
      status: businessStatus(emails.length, decisions.length, dates.filter((entry) => entry.overdue).length,
        stalled.length + items.filter((item) => item.status === "picked_up").length) };
  });
}
