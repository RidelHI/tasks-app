import { HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { errorMessage, hasStatus, ProblemDetails, problemOf } from './problem-details';

const validationProblem: ProblemDetails = {
  type: 'about:blank',
  title: 'Bad Request',
  status: 400,
  detail: 'The request contains invalid fields.',
  instance: '/api/v1/tasks',
  requestId: 'req-1',
  errors: [{ field: 'title', messages: ['title should not be empty'] }],
};

function failure(status: number, body: unknown = null, headers?: Record<string, string>) {
  return new HttpErrorResponse({ status, error: body, headers: new HttpHeaders(headers) });
}

describe('problemOf', () => {
  it('returns the Problem Details body of an API error', () => {
    expect(problemOf(failure(400, validationProblem))).toEqual(validationProblem);
  });

  it.each([
    ['a body that is not Problem Details', failure(502, '<html>Bad Gateway</html>')],
    ['a network failure', failure(0)],
    ['an error that is not an HTTP response', new Error('boom')],
  ])('returns undefined for %s', (_, error) => {
    expect(problemOf(error)).toBeUndefined();
  });
});

describe('hasStatus', () => {
  it('checks the status of an API error', () => {
    expect(hasStatus(failure(404), HttpStatusCode.NotFound)).toBe(true);
    expect(hasStatus(failure(400), HttpStatusCode.NotFound)).toBe(false);
    expect(hasStatus(new Error('boom'), HttpStatusCode.NotFound)).toBe(false);
  });
});

describe('errorMessage', () => {
  it('uses the detail of a client error', () => {
    expect(errorMessage(failure(400, validationProblem))).toBe(
      'The request contains invalid fields.',
    );
  });

  it('explains a network failure', () => {
    expect(errorMessage(failure(0))).toBe(
      'Could not reach the server. Check your connection and try again.',
    );
  });

  it('says when to retry after a rate limit', () => {
    expect(errorMessage(failure(429, null, { 'Retry-After': '42' }))).toBe(
      'Too many requests. Try again in 42 seconds.',
    );
    expect(errorMessage(failure(429))).toBe('Too many requests. Try again later.');
  });

  it('keeps server errors generic', () => {
    const problem = { ...validationProblem, status: 503, title: 'Service Unavailable' };

    expect(errorMessage(failure(503, { ...problem, detail: 'database unavailable' }))).toBe(
      'Something went wrong on our side. Try again in a moment.',
    );
  });

  it('has a fallback for anything else', () => {
    expect(errorMessage(failure(409))).toBe('The request could not be completed. Try again.');
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong. Try again.');
  });
});
