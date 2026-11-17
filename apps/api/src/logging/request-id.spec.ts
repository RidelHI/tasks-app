import { resolveRequestId } from './request-id.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('resolveRequestId', () => {
  it('reuses a valid incoming id', () => {
    expect(resolveRequestId('order-42_ABC')).toBe('order-42_ABC');
  });

  it('accepts an id of exactly 128 characters', () => {
    const id = 'a'.repeat(128);

    expect(resolveRequestId(id)).toBe(id);
  });

  it('generates a UUID when no id is sent', () => {
    expect(resolveRequestId(undefined)).toMatch(UUID_V4);
  });

  it.each<[string, string | string[]]>([
    ['contains spaces', 'abc 123'],
    ['contains a line break', 'abc\n{"level":"info","msg":"forged"}'],
    ['is empty', ''],
    ['is longer than 128 characters', 'a'.repeat(129)],
    ['is sent as several values', ['abc', 'def']],
  ])('generates a new id when the incoming one %s', (_case, header) => {
    const id = resolveRequestId(header);

    expect(id).not.toEqual(header);
    expect(id).toMatch(UUID_V4);
  });

  it('generates a different id for each request', () => {
    expect(resolveRequestId(undefined)).not.toBe(resolveRequestId(undefined));
  });
});
