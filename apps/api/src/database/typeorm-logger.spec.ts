import { Logger } from '@nestjs/common';
import type { LoggerOptions } from 'typeorm';
import { TypeOrmLogger } from './typeorm-logger.js';

const query = 'SELECT * FROM "task" WHERE "id" = $1';

function spyOn(method: 'debug' | 'log' | 'warn' | 'error') {
  return vi.spyOn(Logger.prototype, method).mockImplementation(() => undefined);
}

describe('TypeOrmLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('messages', () => {
    const logger = new TypeOrmLogger('all');

    it('logs queries at debug level, without their parameters', () => {
      const debug = spyOn('debug');

      logger.logQuery(query);

      expect(debug).toHaveBeenCalledWith({ msg: 'Query', query });
    });

    it('logs failed queries as errors, without their parameters', () => {
      const error = spyOn('error');

      logger.logQueryError(new Error('connection reset'), query);

      expect(error).toHaveBeenCalledWith({
        msg: 'Query failed',
        query,
        reason: 'connection reset',
      });
    });

    it('logs slow queries as warnings with their duration', () => {
      const warn = spyOn('warn');

      logger.logQuerySlow(742, query);

      expect(warn).toHaveBeenCalledWith({ msg: 'Slow query', query, durationMs: 742 });
    });

    it('logs migrations at info level', () => {
      const log = spyOn('log');

      logger.logMigration('Migration CreateTasks1700000000000 has been executed successfully.');

      expect(log).toHaveBeenCalledWith(
        'Migration CreateTasks1700000000000 has been executed successfully.',
      );
    });

    it.each([
      ['warn', 'warn'],
      ['info', 'log'],
      ['log', 'log'],
    ] as const)('maps TypeORM level %s to Logger.%s', (level, method) => {
      const spy = spyOn(method);

      logger.log(level, 'message');

      expect(spy).toHaveBeenCalledWith('message');
    });
  });

  describe('logging option (same rules as TypeORM)', () => {
    it.each<[LoggerOptions, boolean]>([
      [false, false],
      [true, true],
      ['all', true],
      [['query'], true],
      [['error', 'warn'], false],
    ])('with %j, logs queries: %s', (options, logged) => {
      const debug = spyOn('debug');

      new TypeOrmLogger(options).logQuery(query);

      expect(debug).toHaveBeenCalledTimes(logged ? 1 : 0);
    });

    it.each<[LoggerOptions, boolean]>([
      [false, false],
      [true, true],
      ['all', true],
      [['error'], true],
      [['query'], false],
    ])('with %j, logs failed queries: %s', (options, logged) => {
      const error = spyOn('error');

      new TypeOrmLogger(options).logQueryError('syntax error', query);

      expect(error).toHaveBeenCalledTimes(logged ? 1 : 0);
    });

    it.each<[LoggerOptions, boolean]>([
      [true, false],
      ['all', true],
      [['warn'], true],
      [['error'], false],
    ])('with %j, logs warnings: %s', (options, logged) => {
      const warn = spyOn('warn');

      new TypeOrmLogger(options).log('warn', 'message');

      expect(warn).toHaveBeenCalledTimes(logged ? 1 : 0);
    });

    it('logs schema builds only when enabled', () => {
      const debug = spyOn('debug');

      new TypeOrmLogger(true).logSchemaBuild('creating table');
      new TypeOrmLogger(['schema']).logSchemaBuild('creating table');

      expect(debug).toHaveBeenCalledTimes(1);
    });

    it('always logs slow queries and migrations, even with logging disabled', () => {
      const warn = spyOn('warn');
      const log = spyOn('log');
      const logger = new TypeOrmLogger(false);

      logger.logQuerySlow(742, query);
      logger.logMigration('Migration CreateTasks1700000000000 has been executed successfully.');

      expect(warn).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledTimes(1);
    });

    it('logs nothing else by default', () => {
      const spies = [spyOn('debug'), spyOn('log'), spyOn('warn'), spyOn('error')];
      const logger = new TypeOrmLogger();

      logger.logQuery(query);
      logger.logQueryError('syntax error', query);
      logger.logSchemaBuild('creating table');
      logger.log('info', 'message');

      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    });
  });
});
