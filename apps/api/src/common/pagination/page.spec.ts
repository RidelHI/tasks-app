import { offsetOf, pageMeta } from './page.js';

describe('offsetOf', () => {
  it.each([
    [1, 20, 0],
    [2, 20, 20],
    [3, 5, 10],
  ])('skips the items before page %i of %i items: %i', (page, pageSize, offset) => {
    expect(offsetOf({ page, pageSize })).toBe(offset);
  });
});

describe('pageMeta', () => {
  it.each([
    [57, 3],
    [60, 3],
    [61, 4],
    [1, 1],
    [0, 0],
  ])('with %i items of 20 per page, counts %i pages', (totalItems, totalPages) => {
    expect(pageMeta({ page: 1, pageSize: 20 }, totalItems)).toEqual({
      page: 1,
      pageSize: 20,
      totalItems,
      totalPages,
    });
  });
});
