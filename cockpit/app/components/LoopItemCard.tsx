import type { ReactNode } from "react";
import { itemHref, type OwnerLoopItem } from "@/lib/owner-loop";
import { explicitBriefSlug } from "@/lib/brief-links";
import { formatWhen, humanizeDates } from "@/lib/when";
import { SwipeCard } from "./SwipeCard";

const KIND_LABEL: Record<OwnerLoopItem["kind"], string> = { decision: "Decision", deadline: "Deadline", milestone: "Milestone", alert: "Alert" };

function excerpt(body: string | null, max = 170): string {
  const clean = humanizeDates((body ?? "").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim());
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// The one card for an owner-loop item, used on Decide, Timeline and the archive.
export function LoopItemCard({ item, now, age, badge, extra }: { item: OwnerLoopItem; now: Date; age?: string; badge?: ReactNode; extra?: ReactNode }) {
  const overdue = item.due_at ? new Date(item.due_at).getTime() < now.getTime() : false;
  const active = item.status !== "done" && item.status !== "dropped";
  return <SwipeCard refId={item.ref} href={itemHref(item.ref)} canArchive={!item.archived_at && !item.deleted_at}>
    <span className="loop-meta">
      <span className="chip">{item.project === "portfolio" ? "All projects" : item.project}</span>
      <span>{KIND_LABEL[item.kind]}</span>
      <span>{item.origin_agent ?? "agent"}</span>
      {age ? <span>{age}</span> : null}
      {item.saved_at ? <span className="badge brass">Saved</span> : null}
      {explicitBriefSlug(item) ? <span className="badge">Brief</span> : null}
      {item.repeat_count > 1 ? <span className="badge warn">asked {item.repeat_count}×</span> : null}
      {badge}
    </span>
    <span className="swipe-title">{humanizeDates(item.title)}</span>
    {item.due_at && active ? <span className={overdue ? "loop-due error-text" : "loop-due meta"}>{overdue ? "Overdue · was due " : "Due "}{formatWhen(item.due_at, now)}</span> : null}
    {item.ruling ? <span className="meta swipe-excerpt">You answered: {humanizeDates(item.ruling)}</span> : <span className="meta swipe-excerpt">{excerpt(item.body)}</span>}
    {extra}
  </SwipeCard>;
}
