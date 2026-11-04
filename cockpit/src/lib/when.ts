// Every date the owner reads goes through here: "Mon, Nov 2, 6:00 PM ET".
import { OWNER_TIME_ZONE } from "./owner-loop";

function parts(date: Date, now: Date, withWeekday: boolean, withTime: boolean, timeZone: string): string {
  const sameYear = date.getUTCFullYear() === now.getUTCFullYear();
  const text = new Intl.DateTimeFormat("en-US", {
    ...(withWeekday ? { weekday: "short" as const } : {}),
    month: "short", day: "numeric",
    ...(sameYear ? {} : { year: "numeric" as const }),
    ...(withTime ? { hour: "numeric" as const, minute: "2-digit" as const } : {}),
    timeZone,
  }).format(date);
  return withTime ? `${text} ET` : text;
}

export function formatWhen(iso: string | number, now = new Date()): string {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? parts(date, now, true, true, OWNER_TIME_ZONE) : "date unknown";
}

// A calendar day with no time, such as a business due date.
export function formatDay(day: string, now = new Date()): string {
  const date = new Date(`${day.slice(0, 10)}T12:00:00Z`);
  return Number.isFinite(date.getTime()) ? parts(date, now, true, false, "UTC") : "date unknown";
}

export function formatShortDay(day: string, now = new Date()): string {
  const date = new Date(`${day.slice(0, 10)}T12:00:00Z`);
  return Number.isFinite(date.getTime()) ? parts(date, now, false, false, "UTC") : "";
}

const ISO_TIME = /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)/g;
// Bare dates only: anything joined to a path or slug stays as it is.
const ISO_DAY = /(?<![\w/.-])\d{4}-\d{2}-\d{2}(?![\w/-])/g;

// Agent-written text often carries raw timestamps. Rewrites them for reading.
export function humanizeDates(text: string, now = new Date()): string {
  return text
    .replace(ISO_TIME, (match) => {
      const date = new Date(match.replace(" ", "T"));
      return Number.isFinite(date.getTime()) ? formatWhen(date.getTime(), now) : match;
    })
    .replace(ISO_DAY, (match) => {
      const label = formatDay(match, now);
      return label === "date unknown" ? match : label;
    });
}

// Value for <input type="datetime-local"> in the owner's time zone.
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const get = (type: string, list: Intl.DateTimeFormatPart[]) => list.find((part) => part.type === type)?.value ?? "";
  const list = new Intl.DateTimeFormat("en-CA", {
    timeZone: OWNER_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return `${get("year", list)}-${get("month", list)}-${get("day", list)}T${get("hour", list)}:${get("minute", list)}`;
}

// The inverse: a typed Eastern wall-clock time to an instant, DST included.
export function fromLocalInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const guess = new Date(`${value}:00Z`);
  const shown = toLocalInput(guess.toISOString());
  const offset = guess.getTime() - new Date(`${shown}:00Z`).getTime();
  return new Date(guess.getTime() + offset).toISOString();
}
