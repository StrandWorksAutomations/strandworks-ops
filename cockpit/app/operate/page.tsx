import "./operate.css";
import { getOperateSnapshot } from "@/lib/operate-data";
import { OperateClient } from "./OperateClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operate — Strandworks Cockpit" };

export default async function OperatePage() {
  const snapshot = await getOperateSnapshot();
  return <OperateClient initial={snapshot} />;
}
