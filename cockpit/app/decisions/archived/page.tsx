import Link from "next/link";
import { Chrome } from "../../components/Chrome";
import { LoopItemCard } from "../../components/LoopItemCard";
import { fetchArchivedItems } from "@/lib/owner-loop-data";

export const dynamic = "force-dynamic";

export default async function ArchivedPage() {
  const items = await fetchArchivedItems();
  const now = new Date();
  return <Chrome title="Archive" sub={items === null ? "Unavailable" : `${items.length} archived or deleted`} active="/decisions">
    <p className="meta"><Link href="/decisions">← Decide</Link> · Open any item to restore it.</p>
    {items === null ? <div className="card" role="status">The archive could not be loaded. Refresh to retry.</div> : null}
    {items?.length === 0 ? <div className="card"><div className="meta">Nothing archived.</div></div> : null}
    {items?.map((item) => <LoopItemCard key={item.id} item={item} now={now} badge={<span className="badge">{item.deleted_at ? "Deleted" : "Archived"}</span>} />)}
  </Chrome>;
}
