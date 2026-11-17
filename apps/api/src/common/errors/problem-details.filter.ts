import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { type IncomingMessage, STATUS_CODES } from 'node:http';
import { type FieldError, ValidationException } from './validation.exception.js';

/** Error body defined by RFC 9457 (Problem Details for HTTP APIs), plus two extensions. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  /** Extension: the request id, also sent in the X-Request-Id header. */
  requestId?: string;
  /** Extension: invalid fields, only for validation errors. */
  errors?: FieldError[];
}

export const PROBLEM_JSON_CONTENT_TYPE = 'application/problem+json';

const UNEXPECTED_ERROR_DETAIL = 'An unexpected error occurred.';

/**
 * `id` is set by pino-http. `originalUrl` is set by Express: inside a router mounted on a path
 * (e.g. the global prefix), `url` is relative to that path, while `originalUrl` is complete.
 */
type HttpRequest = IncomingMessage & { id?: string; originalUrl?: string };

/**
 * Renders every exception as RFC 9457 Problem Details. HttpExceptions are thrown on purpose
 * with client-safe messages, so their message becomes the `detail`; anything else is a bug: the
 * client gets a generic 500 and the real error (with its stack) only goes to the logs.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequest>();
    const response: unknown = http.getResponse();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // 4xx are already logged by pino-http with the request; only server errors need the stack.
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error
          ? exception
          : { msg: 'Non-error thrown', thrown: String(exception) },
      );
    }

    const problem: ProblemDetails = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Error',
      status,
      detail: exception instanceof HttpException ? detailOf(exception) : UNEXPECTED_ERROR_DETAIL,
      // Path only: the query string may contain personal data.
      instance: (request.originalUrl ?? request.url ?? '').split('?')[0] ?? '',
      requestId: request.id,
      errors: exception instanceof ValidationException ? exception.errors : undefined,
    };

    httpAdapter.setHeader(response, 'Content-Type', PROBLEM_JSON_CONTENT_TYPE);
    httpAdapter.reply(response, problem, status);
  }
}

/** The message an HttpException was created with (string, or Nest's `{ message }` body). */
function detailOf(exception: HttpException): string {
  const body = exception.getResponse();
  if (typeof body === 'string') return body;

  const message = (body as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : exception.message;
}
