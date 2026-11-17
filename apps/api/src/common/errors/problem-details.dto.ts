import type { ProblemDetails } from './problem-details.filter.js';
import type { FieldError } from './validation.exception.js';

/** OpenAPI schema of an invalid field (see `ValidationException`). */
export class FieldErrorDto implements FieldError {
  /** @example 'title' */
  field: string;

  /** @example ['title should not be empty'] */
  messages: string[];
}

/** OpenAPI schema of the RFC 9457 error body rendered by `ProblemDetailsFilter`. */
export class ProblemDetailsDto implements ProblemDetails {
  /** @example 'about:blank' */
  type: string;

  /** @example 'Bad Request' */
  title: string;

  /** @example 400 */
  status: number;

  /** @example 'The request contains invalid fields.' */
  detail: string;

  /** Path of the request, without the query string. @example '/api/v1/tasks' */
  instance: string;

  /** Same value as the X-Request-Id response header. */
  requestId?: string;

  /** Only for validation errors (400). */
  errors?: FieldErrorDto[];
}
