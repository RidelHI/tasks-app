import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

/** Response headers that a script on an allowed origin may read (browsers hide the rest). */
export const CORS_EXPOSED_HEADERS = ['Location', 'X-Request-Id'];

/** How long browsers may cache a preflight response. */
const PREFLIGHT_MAX_AGE_SECONDS = 600;

/**
 * CORS for an allowlist of origins, never `*`; `undefined` (CORS disabled) when the list is
 * empty, the default: the web app is served from the API's origin (dev proxy, nginx).
 */
export function buildCorsOptions(origins: string[]): CorsOptions | undefined {
  if (origins.length === 0) return undefined;

  return {
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    exposedHeaders: CORS_EXPOSED_HEADERS,
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  };
}
