/**
 * Log fields replaced by "[Redacted]" because they may hold secrets or personal data.
 *
 * Logged errors are serialized with all their properties: TypeORM's `QueryFailedError` carries
 * the values of the failed query (`parameters`), and PostgreSQL's `detail` may repeat them
 * (e.g. "Failing row contains (...)"). The query text, error code and constraint stay visible.
 */
export const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'err.parameters',
  'err.detail',
  'err.driverError.detail',
];
