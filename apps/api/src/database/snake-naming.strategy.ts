import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils.js';

/**
 * Maps camelCase properties to snake_case identifiers (dueDate → due_date), the PostgreSQL
 * convention, so hand-written SQL never needs quoted identifiers. Names given explicitly in
 * decorators are kept as they are. Table names are already snake_case in the default strategy.
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy {
  override columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    return customName ?? snakeCase([...embeddedPrefixes, propertyName].join('_'));
  }

  override relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  override joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(`${tableName}_${columnName ?? propertyName}`);
  }
}
