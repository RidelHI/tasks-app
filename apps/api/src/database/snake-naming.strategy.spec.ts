import { SnakeNamingStrategy } from './snake-naming.strategy.js';

describe('SnakeNamingStrategy', () => {
  const strategy = new SnakeNamingStrategy();

  it('maps camelCase properties to snake_case columns', () => {
    expect(strategy.columnName('dueDate', undefined, [])).toBe('due_date');
    expect(strategy.columnName('createdAt', undefined, [])).toBe('created_at');
    expect(strategy.columnName('title', undefined, [])).toBe('title');
  });

  it('keeps names given explicitly in the decorator', () => {
    expect(strategy.columnName('dueDate', 'deadline', [])).toBe('deadline');
  });

  it('prefixes columns of embedded entities', () => {
    expect(strategy.columnName('postalCode', undefined, ['billingAddress'])).toBe(
      'billing_address_postal_code',
    );
  });

  it('names join columns in snake_case', () => {
    expect(strategy.joinColumnName('assignedUser', 'id')).toBe('assigned_user_id');
  });

  it('names join table columns in snake_case', () => {
    expect(strategy.joinTableColumnName('task', 'tagId')).toBe('task_tag_id');
    expect(strategy.joinTableColumnName('task', 'tags', 'id')).toBe('task_id');
    expect(strategy.joinTableInverseColumnName('tag', 'tasks', 'id')).toBe('tag_id');
  });

  it('keeps the default snake_case table names', () => {
    expect(strategy.tableName('TaskComment', undefined)).toBe('task_comment');
  });
});
