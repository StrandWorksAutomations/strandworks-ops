// Connects an owner-loop item to the longer briefs. An attached slug or a link
// in the body is certain. A filename match is only offered as "possibly related".
import { listRepoDir } from "./repo";
import { readBriefing, type Briefing } from "./briefings";
import type { OwnerLoopItem } from "./owner-loop";

const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "your", "have", "what", "will", "when", "should", "review", "draft", "check", "project", "portfolio", "kinetic", "medic", "clinician", "dashboard", "update", "report"]);

export function explicitBriefSlug(item: Pick<OwnerLoopItem, "brief_slug" | "body">): string | null {
  if (item.brief_slug) return item.brief_slug;
  const match = item.body?.match(/(?:\/briefings\/|briefings\/)(\d{4}-\d{2}-\d{2}-\d{6}-[A-Za-z0-9._-]+?)(?:\.md)?(?=[\s)"'\]]|$)/);
  return match ? match[1] : null;
}

export function matchBriefNames(item: Pick<OwnerLoopItem, "title" | "project">, names: string[], limit = 3): string[] {
  const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3 && !STOP.has(word));
  const wanted = new Set(words(`${item.title} ${item.project}`));
  return names.map((name) => {
    const slug = name.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-\d{6}-[a-z0-9]+-/, "");
    return { name: name.replace(/\.md$/, ""), score: new Set(words(slug).filter((word) => wanted.has(word))).size };
  }).filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score || b.name.localeCompare(a.name))
    .slice(0, limit).map((entry) => entry.name);
}

export async function linkedBriefs(item: OwnerLoopItem): Promise<{ attached: Briefing | null; related: Briefing[] }> {
  const slug = explicitBriefSlug(item);
  const attached = slug ? await readBriefing(slug).catch(() => null) : null;
  const names = await listRepoDir("briefings").catch(() => [] as string[]);
  const matches = matchBriefNames(item, names.filter((name) => name.endsWith(".md") && name !== "README.md")).filter((name) => name !== slug);
  const related = (await Promise.all(matches.map((name) => readBriefing(name).catch(() => null)))).filter((brief): brief is Briefing => brief !== null);
  return { attached, related };
}
