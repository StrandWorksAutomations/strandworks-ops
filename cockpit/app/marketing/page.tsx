import { Chrome } from "../components/Chrome";
import { readRepoFile } from "@/lib/repo";
import { parseMarketingSnapshot, parsePaidSnapshot } from "@/lib/marketing";
import { MarketingView } from "./MarketingView";
import "./marketing.css";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [social, paid] = await Promise.all([
    readRepoFile("registers/marketing-snapshot.json").then(parseMarketingSnapshot).catch(() => null),
    readRepoFile("registers/marketing-paid.json").then(parsePaidSnapshot).catch(() => null),
  ]);
  return <Chrome title="Marketing" sub="Your posts, accounts and paid creative" active="/marketing">
    <MarketingView snapshot={social} paid={paid} nowIso={new Date().toISOString()} />
  </Chrome>;
}
