import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import type { HealthCheckResult } from '@nestjs/terminus';

/**
 * Turns a failed readiness check into a 503 with a client-safe detail: it names the failed
 * checks but never their messages (hosts, ports, driver errors), as the endpoint is public.
 * The full reason travels as the `cause`, which only reaches the logs.
 */
export function notReady(error: unknown): ServiceUnavailableException {
  const failed = failedChecks(error);
  const names = Object.keys(failed);
  const detail =
    names.length > 0
      ? `The service is not ready: ${names.join(', ')} unavailable.`
      : 'The service is not ready.';
  const reason = names.length > 0 ? JSON.stringify(failed) : String(error);

  return new ServiceUnavailableException(detail, {
    cause: new Error(`Readiness check failed: ${reason}`),
  });
}

/** Terminus reports failed checks in the `error` map of the result it throws as a 503. */
function failedChecks(error: unknown): NonNullable<HealthCheckResult['error']> {
  if (!(error instanceof HttpException)) return {};
  const result = error.getResponse() as Partial<HealthCheckResult>;
  return result.error ?? {};
}
