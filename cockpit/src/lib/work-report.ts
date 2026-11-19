// Owner-facing reading of an agent work report: plain outcome first, with
// test output, raw data and code links kept apart as technical detail.
import { safeEvidence, type WorkReport } from "./portfolio";

export type ReportLink = { label: string; url: string };
export type OwnerReport = {
  who: string;
  plain: { label: string; text: string }[];
  results: ReportLink[];
  technical: { label: string; text: string; raw: boolean }[];
  code: ReportLink[];
};

const AGENT_NAMES: Record<string, string> = { codex: "Codex", claude: "Claude", system: "Automatic daily check" };
export function agentName(agent: string): string {
  return AGENT_NAMES[agent.toLowerCase()] ?? agent;
}

// Machine output (JSON) is never the plain-language account of the work.
export function isRawData(text: string): boolean {
  const trimmed = text.trim();
  if (!/^[[{]/.test(trimmed)) return false;
  try { JSON.parse(trimmed); return true; } catch { return /^[[{]\s*"/.test(trimmed); }
}

function describeLink(url: string): { label: string; code: boolean } {
  const { hostname, pathname } = new URL(url);
  if (hostname === "github.com" || hostname.endsWith(".github.com")) return { label: "Code change on GitHub", code: true };
  if (hostname === "linear.app") return { label: "Linear issue", code: true };
  if (hostname === "dashboard.strandautomationworks.com") return { label: `Dashboard${pathname.length > 1 ? `: ${pathname.slice(1).split("/")[0]}` : ""}`, code: false };
  if (hostname.endsWith(".vercel.app")) return { label: "Preview of the result", code: false };
  return { label: hostname.replace(/^www\./, "") + (pathname.length > 1 ? pathname.replace(/\/$/, "") : ""), code: false };
}

export function ownerReport(report: Pick<WorkReport, "agent" | "result" | "validation" | "remaining" | "next_action" | "evidence">): OwnerReport {
  const plain: OwnerReport["plain"] = [];
  const technical: OwnerReport["technical"] = [];
  const place = (plainLabel: string, technicalLabel: string, text: string | null | undefined) => {
    if (!text?.trim()) return;
    if (isRawData(text)) technical.push({ label: technicalLabel, text, raw: true });
    else plain.push({ label: plainLabel, text });
  };
  place("What was done", "Result data", report.result);
  place("What happens next", "Next-step data", report.next_action);
  place("Still open", "Remaining-work data", report.remaining);
  if (report.validation?.trim()) technical.unshift({ label: "How it was checked", text: report.validation, raw: isRawData(report.validation) });

  const results: ReportLink[] = [];
  const code: ReportLink[] = [];
  const seen = new Set<string>();
  for (const entry of (report.evidence ?? []).map(safeEvidence)) {
    if (!entry || seen.has(entry.url)) continue;
    seen.add(entry.url);
    const described = describeLink(entry.url);
    (described.code ? code : results).push({ label: described.label, url: entry.url });
  }
  return { who: agentName(report.agent), plain, results, technical, code };
}
