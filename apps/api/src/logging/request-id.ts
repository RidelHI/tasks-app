import { randomUUID } from 'node:crypto';

/** Header used to propagate the request id (Node exposes incoming headers in lowercase). */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Only short, URL-safe ids are trusted from clients. Anything else (spaces, line breaks,
 * oversized values) could forge log lines or bloat log storage, so it is replaced.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;

/** Reuses a safe incoming request id, or generates a new UUID. */
export function resolveRequestId(header: string | string[] | undefined): string {
  return typeof header === 'string' && SAFE_REQUEST_ID.test(header) ? header : randomUUID();
}
