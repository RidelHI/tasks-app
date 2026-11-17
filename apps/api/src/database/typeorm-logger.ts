import { Logger } from '@nestjs/common';
import type { Logger as TypeOrmLoggerContract } from 'typeorm';

/**
 * Routes TypeORM's logs through Nest's Logger (pino), so they are structured JSON and carry the
 * request id like the rest of the app. Query parameters are never logged: they may hold
 * personal data or secrets.
 */
export class TypeOrmLogger implements TypeOrmLoggerContract {
  private readonly logger = new Logger('TypeORM');

  logQuery(query: string): void {
    this.logger.debug({ msg: 'Query', query });
  }

  logQueryError(error: string | Error, query: string): void {
    const reason = error instanceof Error ? error.message : error;
    this.logger.error({ msg: 'Query failed', query, reason });
  }

  logQuerySlow(time: number, query: string): void {
    this.logger.warn({ msg: 'Slow query', query, durationMs: time });
  }

  logSchemaBuild(message: string): void {
    this.logger.debug(message);
  }

  logMigration(message: string): void {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown): void {
    if (level === 'warn') {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }
}
