// Operate — the live operations page (STR-686). Server component: fetches the
// first snapshot with the service key (never exposed to the client) and hands
// it to the client island, which then polls /api/operate/feed for updates.
import "./operate.css";
import { getOperateSnapshot } from "@/lib/operate-data";
import { OperateClient } from "./OperateClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operate — Strandworks Cockpit" };

export default async function OperatePage() {
  const snapshot = await getOperateSnapshot();
  return <OperateClient initial={snapshot} />;
}
