/**
 * Pure CSV value normalization shared by the client (preview + import payload) and the middleware
 * (dedup on import). Dates normalize to `YYYY-MM-DD`, times to `HH:MM:SS` (24h).
 */
import { DateFormat } from "./csvFormats.js";

/** What a CSV cell (or a whole column) looks like. */
export const ValueType = {
  Empty: "empty",
  DateTime: "datetime",
  Date: "date",
  Time: "time",
  Number: "number",
  Text: "text",
} as const;
export type ValueType = typeof ValueType[keyof typeof ValueType];

const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
const TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*([ap]m)?$/i;
const DATETIME = /^(\S+)(?:T|\s+)(.+?)(?:Z|[+-]\d{2}:?\d{2})?$/;
const NUMBER = /^\(?-?\$?-?\(?[\d,]*\.?\d+\)?$/;

function isDate(value: string): boolean {
  return ISO_DATE.test(value) || SLASH_DATE.test(value);
}

function isTime(value: string): boolean {
  return TIME.test(value);
}

function isDateTime(value: string): boolean {
  const match = DATETIME.exec(value);
  return match !== null && isDate(match[1]) && isTime(match[2]);
}

/** Classify a single cell. */
export function inferValueType(raw: string): ValueType {
  const value = raw.trim();
  if (value === "") return ValueType.Empty;
  if (isDate(value)) return ValueType.Date;
  if (isTime(value)) return ValueType.Time;
  if (isDateTime(value)) return ValueType.DateTime;
  if (NUMBER.test(value) && parseAmount(value) !== null) return ValueType.Number;
  return ValueType.Text;
}

/**
 * Classify a column from sample cells: the single type every non-empty sample shares, else `text`
 * (a mixed column), or `empty` when every sample is blank.
 */
export function inferColumnType(samples: string[]): ValueType {
  const types = new Set(samples.map(inferValueType).filter(t => t !== ValueType.Empty));
  if (types.size === 0) return ValueType.Empty;
  if (types.size === 1) return [...types][0];
  return ValueType.Text;
}

/** Pick the date layout that fits every sample (ISO, else US unless a day > 12 forces EU). */
export function detectDateFormat(samples: string[]): DateFormat {
  const dates = samples
    .map(s => s.trim())
    .map(s => DATETIME.exec(s)?.[1] ?? s)
    .filter(isDate);
  if (dates.length > 0 && dates.every(d => ISO_DATE.test(d))) return DateFormat.Iso;
  const firstPartOver12 = dates.some((d) => {
    const match = SLASH_DATE.exec(d);
    return match !== null && Number(match[1]) > 12;
  });
  return firstPartOver12 ? DateFormat.EU : DateFormat.US;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function validYmd(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Normalize a date cell to `YYYY-MM-DD`, or null when it doesn't parse in `format`. */
export function normalizeDate(raw: string, format: DateFormat): string | null {
  const value = raw.trim();
  const iso = ISO_DATE.exec(value);
  if (iso) return validYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const slash = SLASH_DATE.exec(value);
  if (!slash) return null;
  const year = slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3]);
  const [month, day] = format === DateFormat.EU
    ? [Number(slash[2]), Number(slash[1])]
    : [Number(slash[1]), Number(slash[2])];
  return validYmd(year, month, day);
}

/** Normalize a time cell (`4:14 PM`, `09:41:07`, `16:14`) to `HH:MM:SS`, or null. */
export function normalizeTime(raw: string): string | null {
  const match = TIME.exec(raw.trim());
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  const meridiem = match[4]?.toLowerCase();
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "pm" && hours !== 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
  }
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Split a datetime cell into a normalized date and time (either may be null if unparseable). */
export function splitDateTime(raw: string, format: DateFormat): { date: string | null;
  time: string | null; } {
  const value = raw.trim();
  const match = DATETIME.exec(value);
  if (!match) {
    return {
      date: normalizeDate(value, format),
      time: null,
    };
  }
  return {
    date: normalizeDate(match[1], format),
    time: normalizeTime(match[2]),
  };
}

/** Parse a money cell (`-7.86`, `$1,000.00`, `(5.00)`) to a number, or null. */
export function parseAmount(raw: string): number | null {
  let value = raw.trim().replace(/[$,\s]/g, "");
  let negative = false;
  if (value.startsWith("(") && value.endsWith(")")) {
    negative = true;
    value = value.slice(1, -1);
  }
  if (value === "" || !/^-?\d*\.?\d+$/.test(value)) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return negative ? -amount : amount;
}

/** The fields that identify an already-imported transaction within one account. */
export interface DedupFields {
  date: string;
  time: string | null;
  name: string;
  total: number;
}

/**
 * The key two rows of the same account share when they're the same transaction. Counted (not
 * set-compared) on import, so genuine same-day repeats survive while re-imported overlap is skipped.
 */
export function dedupKey(row: DedupFields): string {
  return [row.date, row.time ?? "", row.name.trim(), row.total.toFixed(2)].join("\u0000");
}
