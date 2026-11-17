import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

/** An invalid field of a 400 response. Nested fields use dotted paths. */
export interface FieldError {
  field: string;
  messages: string[];
}

/** RFC 9457 Problem Details, the body of every API error (`application/problem+json`). */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  requestId?: string;
  /** Only for validation errors (400). */
  errors?: FieldError[];
}

function isProblemDetails(body: unknown): body is ProblemDetails {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as ProblemDetails).status === 'number' &&
    typeof (body as ProblemDetails).title === 'string'
  );
}

/** The Problem Details of a failed API call, if its response carries one. */
export function problemOf(error: unknown): ProblemDetails | undefined {
  return error instanceof HttpErrorResponse && isProblemDetails(error.error)
    ? error.error
    : undefined;
}

/** Whether `error` is an API response with the given status. */
export function hasStatus(error: unknown, status: number): boolean {
  return error instanceof HttpErrorResponse && error.status === status;
}

/** A message that tells the user why a request failed and what to do about it. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Try again.';
  }
  if (error.status === 0) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  if (hasStatus(error, HttpStatusCode.TooManyRequests)) {
    const seconds = Number(error.headers.get('Retry-After'));
    return Number.isInteger(seconds) && seconds > 0
      ? `Too many requests. Try again in ${seconds} seconds.`
      : 'Too many requests. Try again later.';
  }
  if (error.status >= 500) {
    // Server errors stay generic: the details are in the API logs, under the request id.
    return 'Something went wrong on our side. Try again in a moment.';
  }
  return problemOf(error)?.detail ?? 'The request could not be completed. Try again.';
}
