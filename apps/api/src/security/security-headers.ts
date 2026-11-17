import helmet, { contentSecurityPolicy } from 'helmet';

/**
 * Security headers for every response (helmet): no MIME sniffing, no framing, no referrer, HSTS,
 * cross-origin isolation, and no `X-Powered-By`. API responses are JSON and never render
 * anything, so their Content Security Policy forbids everything (OWASP REST Security Cheat Sheet).
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    xFrameOptions: { action: 'deny' },
  });
}

/**
 * Swagger UI is an HTML page with its own scripts and styles: it gets helmet's default policy
 * (same-origin resources, inline styles) in place of the API's. Mount it on the docs path only.
 */
export function docsContentSecurityPolicy() {
  return contentSecurityPolicy();
}
