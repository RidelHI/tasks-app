import { Writable } from 'node:stream';
import pino from 'pino';
import { QueryFailedError } from 'typeorm';
import { REDACTED_LOG_PATHS } from './redact.js';

/** A real pino logger with the app's redaction, writing its JSON lines into memory. */
function createLogger() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  const logger = pino({ redact: REDACTED_LOG_PATHS }, destination);
  const lastEntry = () => JSON.parse(lines.at(-1) ?? '{}') as Record<string, unknown>;
  return { logger, lastEntry, output: () => lines.join('') };
}

/** What pg raises for a NOT NULL violation, wrapped by TypeORM as it reaches the app. */
function failedInsert(): QueryFailedError {
  const driverError = Object.assign(new Error('null value in column "title" violates not-null'), {
    code: '23502',
    column: 'title',
    detail: 'Failing row contains (jane.doe@example.com, secret note).',
  });
  return new QueryFailedError(
    'INSERT INTO "tasks"("title", "assignee") VALUES ($1, $2)',
    [null, 'jane.doe@example.com'],
    driverError,
  );
}

describe('REDACTED_LOG_PATHS', () => {
  it('keeps the values of a failed query out of the logs', () => {
    const { logger, output } = createLogger();

    logger.error({ err: failedInsert() });

    expect(output()).not.toContain('jane.doe@example.com');
    expect(output()).not.toContain('secret note');
  });

  it('keeps what is needed to debug a failed query', () => {
    const { logger, lastEntry } = createLogger();

    logger.error({ err: failedInsert() });

    expect(lastEntry().err).toMatchObject({
      type: 'QueryFailedError',
      query: 'INSERT INTO "tasks"("title", "assignee") VALUES ($1, $2)',
      code: '23502',
      column: 'title',
      parameters: '[Redacted]',
      detail: '[Redacted]',
      driverError: { detail: '[Redacted]' },
    });
  });

  it('hides credentials in request and response headers', () => {
    const { logger, lastEntry } = createLogger();

    logger.info({
      req: {
        headers: { authorization: 'Bearer abc', cookie: 'sid=1', accept: 'application/json' },
      },
      res: { headers: { 'set-cookie': 'sid=2' } },
    });

    expect(lastEntry()).toMatchObject({
      req: {
        headers: { authorization: '[Redacted]', cookie: '[Redacted]', accept: 'application/json' },
      },
      res: { headers: { 'set-cookie': '[Redacted]' } },
    });
  });
});
