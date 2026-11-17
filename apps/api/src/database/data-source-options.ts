import type { DataSourceOptions, LoggerOptions } from 'typeorm';
import { ENTITIES } from './entities.js';
import { MIGRATIONS } from './migrations/index.js';
import { SnakeNamingStrategy } from './snake-naming.strategy.js';
import { TypeOrmLogger } from './typeorm-logger.js';

export interface DatabaseSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/** Queries slower than this are logged as warnings. */
const SLOW_QUERY_THRESHOLD_MS = 500;

/** Failed queries, warnings and migrations (slow queries are always logged). */
const DEFAULT_LOGGING: LoggerOptions = ['error', 'warn', 'migration'];

/**
 * Single source of the connection options, used by the Nest app, the TypeORM CLI and the
 * e2e test setup, so they can never disagree. `logging` follows TypeORM's `logging` option;
 * `false` silences everything but slow queries and migrations.
 */
export function buildDataSourceOptions(
  settings: DatabaseSettings,
  logging: LoggerOptions = DEFAULT_LOGGING,
): DataSourceOptions {
  return {
    type: 'postgres',
    ...settings,
    entities: ENTITIES,
    migrations: MIGRATIONS,
    namingStrategy: new SnakeNamingStrategy(),
    // The schema changes only through reviewed migrations, run as an explicit deployment step
    // (never at app startup, where several replicas would race to migrate).
    synchronize: false,
    migrationsRun: false,
    // TypeORM filters by `logging` only in its built-in loggers: ours gets the same value.
    logger: new TypeOrmLogger(logging),
    logging,
    maxQueryExecutionTime: SLOW_QUERY_THRESHOLD_MS,
  };
}
