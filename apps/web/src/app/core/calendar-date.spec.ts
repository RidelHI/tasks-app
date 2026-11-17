import { fromCalendarDate, toCalendarDate, today } from './calendar-date';

describe('calendar dates', () => {
  it.each([
    [new Date(2026, 0, 1, 0, 0), '2026-01-01'],
    // Late in the evening and early in the morning: UTC would already be on another day.
    [new Date(2026, 11, 31, 23, 59), '2026-12-31'],
    [new Date(2026, 2, 9, 0, 30), '2026-03-09'],
  ])('formats %s as the local date %s', (date, expected) => {
    expect(toCalendarDate(date)).toBe(expected);
  });

  it('parses a calendar date as local midnight', () => {
    const date = fromCalendarDate('2026-02-28');

    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 1, 28, 0,
    ]);
  });

  it('round-trips between both formats', () => {
    expect(toCalendarDate(fromCalendarDate('2026-07-04'))).toBe('2026-07-04');
  });

  it.each(['2026-7-4', '04/07/2026', '2026-07-04T00:00:00Z', ''])(
    'rejects %j, which is not a calendar date',
    (value) => {
      expect(() => fromCalendarDate(value)).toThrow('Not a calendar date');
    },
  );

  it("gives today's local date", () => {
    expect(today(new Date(2026, 10, 17, 23, 45))).toBe('2026-11-17');
  });
});
