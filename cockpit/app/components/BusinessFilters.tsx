import Link from "next/link";
import { BUSINESSES } from "@/lib/businesses";

export function BusinessFilters({ path, selected, businessHref }: {
  path: string;
  selected: string;
  businessHref?: (business: string) => string;
}) {
  const href = businessHref ?? ((business: string) => business ? `${path}?business=${business}` : path);
  return <nav className="chips timeline-filters" aria-label="Filter by business">
    <Link href={href("")} className={`chip${selected ? "" : " on"}`} aria-current={!selected ? "page" : undefined}>All businesses</Link>
    {BUSINESSES.map((business) => <Link key={business.key} href={href(business.key)}
      className={`chip${selected === business.key ? " on" : ""}`} aria-current={selected === business.key ? "page" : undefined}>{business.name}</Link>)}
  </nav>;
}
