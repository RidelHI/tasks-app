/**
 * Calendar dates (`YYYY-MM-DD`, no time or time zone) as the API stores due dates.
 *
 * Conversions use the local time zone on purpose: `toISOString()` would turn local midnight into
 * UTC and, east or west of Greenwich, move the date by one day.
 */

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The local calendar date of `date`. */
export function toCalendarDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local midnight of a calendar date. */
export function fromCalendarDate(value: string): Date {
  const match = CALENDAR_DATE.exec(value);
  if (!match) {
    throw new Error(`Not a calendar date: ${value}`);
  }
  const [, year, month, day] = match.map(Number);
  return new Date(year, month - 1, day);
}

/** Today's local calendar date. */
export function today(now: Date = new Date()): string {
  return toCalendarDate(now);
}
