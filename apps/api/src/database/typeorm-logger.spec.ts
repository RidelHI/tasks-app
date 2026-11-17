import { Logger } from '@nestjs/common';
import { TypeOrmLogger } from './typeorm-logger.js';

describe('TypeOrmLogger', () => {
  const logger = new TypeOrmLogger();
  const query = 'SELECT * FROM "task" WHERE "id" = $1';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs failed queries as errors, without their parameters', () => {
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    logger.logQueryError(new Error('connection reset'), query);

    expect(error).toHaveBeenCalledWith({ msg: 'Query failed', query, reason: 'connection reset' });
  });

  it('logs slow queries as warnings with their duration', () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    logger.logQuerySlow(742, query);

    expect(warn).toHaveBeenCalledWith({ msg: 'Slow query', query, durationMs: 742 });
  });

  it('logs migrations at info level', () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

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
    const spy = vi.spyOn(Logger.prototype, method).mockImplementation(() => undefined);

    logger.log(level, 'message');

    expect(spy).toHaveBeenCalledWith('message');
  });
});
