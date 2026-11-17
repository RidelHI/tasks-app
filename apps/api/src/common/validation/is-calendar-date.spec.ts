import { isCalendarDate } from './is-calendar-date.js';

describe('isCalendarDate', () => {
  it.each(['2026-12-01', '2028-02-29', '1999-01-31'])('accepts %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each([
    ['an impossible day', '2026-02-30'],
    ['February 29 of a common year', '2026-02-29'],
    ['an impossible month', '2026-13-01'],
    ['a date with time', '2026-12-01T10:00:00Z'],
    ['a date without zero padding', '2026-1-5'],
    ['another format', '01/12/2026'],
    ['an empty string', ''],
    ['a number', 20261201],
    ['null', null],
  ])('rejects %s', (_case, value) => {
    expect(isCalendarDate(value)).toBe(false);
  });
});
