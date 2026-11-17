import {
  type ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { PROBLEM_JSON_CONTENT_TYPE, ProblemDetailsFilter } from './problem-details.filter.js';
import { ValidationException } from './validation.exception.js';

interface FakeRequest {
  url?: string;
  originalUrl?: string;
  id?: string;
}

function setup(request: FakeRequest = { url: '/api/v1/tasks/42', id: 'req-1' }) {
  const response = {};
  const httpAdapter = { reply: vi.fn(), setHeader: vi.fn() };
  const filter = new ProblemDetailsFilter({ httpAdapter } as unknown as HttpAdapterHost);
  const host = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ArgumentsHost;
  const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

  const handle = (exception: unknown) => {
    filter.catch(exception, host);
    const [, body, status] = httpAdapter.reply.mock.calls[0] ?? [];
    return { body, status };
  };

  return { handle, httpAdapter, response, logError };
}

describe('ProblemDetailsFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an HttpException as RFC 9457 Problem Details', () => {
    const { handle } = setup();

    const { body, status } = handle(new NotFoundException('Task 42 was not found'));

    expect(status).toBe(404);
    expect(body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Task 42 was not found',
      instance: '/api/v1/tasks/42',
      requestId: 'req-1',
    });
  });

  it('answers with the application/problem+json media type', () => {
    const { handle, httpAdapter, response } = setup();

    handle(new NotFoundException());

    expect(httpAdapter.setHeader).toHaveBeenCalledWith(
      response,
      'Content-Type',
      PROBLEM_JSON_CONTENT_TYPE,
    );
  });

  it('leaves the query string out of the instance', () => {
    const { handle } = setup({ url: '/api/v1/tasks?assignee=jane@example.com', id: 'req-1' });

    expect(handle(new BadRequestException()).body.instance).toBe('/api/v1/tasks');
  });

  it('uses the full original URL when the router made `url` relative to its mount path', () => {
    const { handle } = setup({ url: '/v1/missing', originalUrl: '/api/v1/missing', id: 'req-1' });

    expect(handle(new NotFoundException()).body.instance).toBe('/api/v1/missing');
  });

  it('adds the field errors of a validation failure', () => {
    const { handle } = setup();
    const errors = [{ field: 'title', messages: ['title should not be empty'] }];

    const { body, status } = handle(new ValidationException(errors));

    expect(status).toBe(400);
    expect(body).toMatchObject({
      title: 'Bad Request',
      detail: 'The request contains invalid fields.',
      errors,
    });
  });

  it('joins the messages of an HttpException created with several', () => {
    const { handle } = setup();

    const { body } = handle(new BadRequestException(['first problem', 'second problem']));

    expect(body.detail).toBe('first problem; second problem');
  });

  it('does not log client errors again (pino-http already logs the request)', () => {
    const { handle, logError } = setup();

    handle(new NotFoundException());

    expect(logError).not.toHaveBeenCalled();
  });

  it('hides unexpected errors behind a generic 500 and logs them', () => {
    const { handle, logError } = setup();
    const bug = new Error('connection to db failed: password=hunter2');

    const { body, status } = handle(bug);

    expect(status).toBe(500);
    expect(body).toMatchObject({
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred.',
    });
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(logError).toHaveBeenCalledWith(bug);
  });

  it('keeps the message of server errors raised on purpose', () => {
    const { handle, logError } = setup();

    const { body, status } = handle(new ServiceUnavailableException('Database is unavailable'));

    expect(status).toBe(503);
    expect(body.detail).toBe('Database is unavailable');
    expect(logError).toHaveBeenCalled();
  });

  it('handles values thrown that are not errors', () => {
    const { handle, logError } = setup();

    const { body, status } = handle('boom');

    expect(status).toBe(500);
    expect(body.detail).toBe('An unexpected error occurred.');
    expect(logError).toHaveBeenCalledWith({ msg: 'Non-error thrown', thrown: 'boom' });
  });
});
