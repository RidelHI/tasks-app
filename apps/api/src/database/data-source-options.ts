import type { DataSourceOptions } from 'typeorm';
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

/**
 * Single source of the connection options, used by the Nest app, the TypeORM CLI and the
 * e2e test setup, so they can never disagree.
 */
export function buildDataSourceOptions(settings: DatabaseSettings): DataSourceOptions {
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
    logger: new TypeOrmLogger(),
    logging: ['error', 'warn', 'migration'],
    maxQueryExecutionTime: SLOW_QUERY_THRESHOLD_MS,
  };
}
