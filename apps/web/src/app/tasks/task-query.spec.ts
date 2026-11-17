import { parseTaskQuery, toUrlParams } from './task-query';

describe('parseTaskQuery', () => {
  it('defaults to the first page of 20 without filters', () => {
    expect(parseTaskQuery({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('reads valid filters and pagination', () => {
    expect(
      parseTaskQuery({ status: 'in_progress', assignee: '  Jane Doe ', page: '3', pageSize: '50' }),
    ).toEqual({ status: 'in_progress', assignee: 'Jane Doe', page: 3, pageSize: 50 });
  });

  it.each([
    ['an unknown status', { status: 'archived' }],
    ['a blank assignee', { assignee: '   ' }],
    ['an assignee longer than 100 characters', { assignee: 'x'.repeat(101) }],
  ])('ignores %s', (_, params) => {
    expect(parseTaskQuery(params)).toEqual({ page: 1, pageSize: 20 });
  });

  it.each(['0', '-1', '1.5', 'two', '1e3', '1000001', ''])(
    'falls back to page 1 for page=%j',
    (page) => {
      expect(parseTaskQuery({ page }).page).toBe(1);
    },
  );

  it.each(['0', '101', 'all'])('falls back to 20 items for pageSize=%j', (pageSize) => {
    expect(parseTaskQuery({ pageSize }).pageSize).toBe(20);
  });
});

describe('toUrlParams', () => {
  it('drops the defaults and the filters that are not set', () => {
    expect(toUrlParams({ page: 1, pageSize: 20 })).toEqual({
      status: null,
      assignee: null,
      page: null,
      pageSize: null,
    });
  });

  it('keeps everything else', () => {
    expect(toUrlParams({ status: 'done', assignee: 'Jane Doe', page: 2, pageSize: 50 })).toEqual({
      status: 'done',
      assignee: 'Jane Doe',
      page: 2,
      pageSize: 50,
    });
  });
});
