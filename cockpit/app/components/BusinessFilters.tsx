import Link from "next/link";
import { BUSINESSES } from "@/lib/businesses";

export function BusinessFilters({ path, selected }: { path: string; selected: string }) {
  return <nav className="chips timeline-filters" aria-label="Filter by business">
    <Link href={path} className={`chip${selected ? "" : " on"}`} aria-current={!selected ? "page" : undefined}>All businesses</Link>
    {BUSINESSES.map((business) => <Link key={business.key} href={`${path}?business=${business.key}`}
      className={`chip${selected === business.key ? " on" : ""}`} aria-current={selected === business.key ? "page" : undefined}>{business.name}</Link>)}
  </nav>;
}
