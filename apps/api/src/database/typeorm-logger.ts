import { Logger } from '@nestjs/common';
import type { LoggerOptions, LogLevel, Logger as TypeOrmLoggerContract } from 'typeorm';

/**
 * Routes TypeORM's logs through Nest's Logger (pino), so they are structured JSON and carry the
 * request id like the rest of the app. Query parameters are never logged: they may hold
 * personal data or secrets.
 *
 * TypeORM applies its `logging` option only inside its built-in loggers, so this one receives
 * the same value and filters with the same rules. Slow queries and migrations are always logged.
 */
export class TypeOrmLogger implements TypeOrmLoggerContract {
  private readonly logger = new Logger('TypeORM');

  constructor(private readonly options: LoggerOptions = false) {}

  logQuery(query: string): void {
    if (!this.isEnabled('query')) return;
    this.logger.debug({ msg: 'Query', query });
  }

  logQueryError(error: string | Error, query: string): void {
    if (!this.isEnabled('error')) return;
    const reason = error instanceof Error ? error.message : error;
    this.logger.error({ msg: 'Query failed', query, reason });
  }

  logQuerySlow(time: number, query: string): void {
    this.logger.warn({ msg: 'Slow query', query, durationMs: time });
  }

  logSchemaBuild(message: string): void {
    if (!this.isEnabled('schema')) return;
    this.logger.debug(message);
  }

  logMigration(message: string): void {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown): void {
    if (!this.isEnabled(level)) return;
    if (level === 'warn') {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }

  /** TypeORM's rules: `true` enables queries and errors, `'all'` everything, an array its levels. */
  private isEnabled(level: Exclude<LogLevel, 'migration'>): boolean {
    if (this.options === 'all') return true;
    if (this.options === true) return level === 'query' || level === 'error';
    return Array.isArray(this.options) && this.options.includes(level);
  }
}
