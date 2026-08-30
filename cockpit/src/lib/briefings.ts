// Briefings feed — everything the agents used to push to Telegram (muted
// 2026-08-30) now lands as one file per message in briefings/, written by
// _ops/lib/post-briefing.sh from the laptop and the claude-ops droplet.
// Filename = <YYYY-MM-DD>-<HHMMSS>-<host>-<slug>.md, so a plain descending
// sort is newest-first. Frontmatter carries date/time/host/source/title and
// an optional attachment path under briefings/attachments/.
import { listRepoDir, readRepoFile } from "@/lib/repo";

export type Briefing = {
  slug: string; // filename without .md
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  host: string;
  source: string;
  title: string;
  attachment?: string; // repo-relative path
  attachmentName?: string;
  attachmentNote?: string;
  body: string; // markdown
};

const FM_RE = /^---\n([\s\S]*?)\n---\n?/;
const NAME_RE = /^(\d{4}-\d{2}-\d{2})-(\d{6})-([a-z0-9]+)-(.+)\.md$/;

export function parseBriefing(raw: string, filename: string): Briefing {
  const slug = filename.replace(/\.md$/, "");
  const fm: Record<string, string> = {};
  const m = raw.match(FM_RE);
  if (m) {
    for (const line of m[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  const nm = filename.match(NAME_RE);
  const body = (m ? raw.slice(m[0].length) : raw).trim();
  return {
    slug,
    date: fm.date ?? nm?.[1] ?? "",
    time: fm.time ?? (nm ? `${nm[2].slice(0, 2)}:${nm[2].slice(2, 4)}` : ""),
    host: fm.host ?? nm?.[3] ?? "",
    source: fm.source ?? nm?.[4] ?? "briefing",
    title: fm.title ?? body.split("\n")[0]?.slice(0, 120) ?? slug,
    attachment: fm.attachment || undefined,
    attachmentName: fm.attachment_name || undefined,
    attachmentNote: fm.attachment_note || undefined,
    body,
  };
}

// Newest first. Each briefing is one repo read; `limit` keeps the GitHub
// backend to a bounded number of calls per ISR window.
export async function listBriefings(limit = 60): Promise<Briefing[]> {
  const names = (await listRepoDir("briefings")).filter((f) => NAME_RE.test(f)).sort().reverse().slice(0, limit);
  const raws = await Promise.all(names.map((n) => readRepoFile(`briefings/${n}`)));
  return names.flatMap((n, i) => (raws[i] === null ? [] : [parseBriefing(raws[i] as string, n)]));
}

export async function readBriefing(slug: string): Promise<Briefing | null> {
  if (!/^[A-Za-z0-9._-]+$/.test(slug)) return null;
  const raw = await readRepoFile(`briefings/${slug}.md`);
  return raw === null ? null : parseBriefing(raw, `${slug}.md`);
}

export async function readAttachment(b: Briefing): Promise<string | null> {
  if (!b.attachment || !/^briefings\/attachments\/[A-Za-z0-9._-]+\.md$/.test(b.attachment)) return null;
  return readRepoFile(b.attachment);
}

export function groupByDate(list: Briefing[]): Array<{ date: string; items: Briefing[] }> {
  const out: Array<{ date: string; items: Briefing[] }> = [];
  for (const b of list) {
    const last = out[out.length - 1];
    if (last && last.date === b.date) last.items.push(b);
    else out.push({ date: b.date, items: [b] });
  }
  return out;
}
