import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { notReady } from './not-ready.js';

/** What terminus throws when a check fails: a 503 whose body is the health result. */
function terminusFailure(error: Record<string, unknown>) {
  return new ServiceUnavailableException({ status: 'error', info: {}, error, details: error });
}

describe('notReady', () => {
  const databaseDown = {
    database: { status: 'down', message: 'connect ECONNREFUSED 10.0.0.5:5432' },
  };

  it('answers 503 naming the failed checks', () => {
    const exception = notReady(terminusFailure(databaseDown));

    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.message).toBe('The service is not ready: database unavailable.');
  });

  it('keeps the internal reason out of the response and in the cause, for the logs', () => {
    const exception = notReady(terminusFailure(databaseDown));

    expect(JSON.stringify(exception.getResponse())).not.toContain('10.0.0.5');
    expect(exception.cause).toBeInstanceOf(Error);
    expect((exception.cause as Error).message).toContain('connect ECONNREFUSED 10.0.0.5:5432');
  });

  it('lists every failed check', () => {
    const exception = notReady(
      terminusFailure({ database: { status: 'down' }, cache: { status: 'down' } }),
    );

    expect(exception.message).toBe('The service is not ready: database, cache unavailable.');
  });

  it('still answers 503 for an unexpected failure', () => {
    const exception = notReady(new Error('boom'));

    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.message).toBe('The service is not ready.');
    expect((exception.cause as Error).message).toContain('boom');
  });
});
