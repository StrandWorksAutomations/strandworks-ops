import { describe, expect, it } from "vitest";
import { formatDay, formatWhen, fromLocalInput, humanizeDates, toLocalInput } from "@/lib/when";

const NOW = new Date("2026-11-04T14:00:00Z");

describe("owner-facing dates", () => {
  it("reads like a person wrote it, in Eastern time", () => {
    expect(formatWhen("2026-11-02T23:00:00+00:00", NOW)).toBe("Mon, Nov 2, 6:00 PM ET");
    expect(formatDay("2026-11-04", NOW)).toBe("Wed, Nov 4");
    expect(formatWhen("2027-01-05T15:00:00Z", NOW)).toContain("2027");
    expect(formatWhen("nonsense", NOW)).toBe("date unknown");
  });

  it("rewrites raw timestamps in agent text and leaves links and slugs alone", () => {
    expect(humanizeDates("Review overdue since 2026-11-03T22:00:00+00:00.", NOW)).toBe("Review overdue since Tue, Nov 3, 5:00 PM ET.");
    expect(humanizeDates("Last cycle 2026-11-03T16:02:55.194Z ok", NOW)).toBe("Last cycle Tue, Nov 3, 11:02 AM ET ok");
    expect(humanizeDates("due 2026-11-04.", NOW)).toBe("due Wed, Nov 4.");
    const link = "/briefings/2026-11-02-073101-laptop-tenetrix and docs/plan-2026-11-02.md";
    expect(humanizeDates(link, NOW)).toBe(link);
  });

  it("round-trips the date picker across daylight saving", () => {
    expect(toLocalInput("2026-11-02T23:00:00Z")).toBe("2026-11-02T18:00");
    expect(fromLocalInput("2026-11-02T18:00")).toBe("2026-11-02T23:00:00.000Z");
    expect(fromLocalInput("2026-07-02T18:00")).toBe("2026-07-02T22:00:00.000Z");
    expect(fromLocalInput("soon")).toBeNull();
  });
});
