import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { HEALTH_URL_PREFIX } from '../health/health.constants.js';
import { REDACTED_LOG_PATHS } from './redact.js';
import { REQUEST_ID_HEADER, resolveRequestId } from './request-id.js';

/**
 * Structured logging with pino: JSON in production and test, human-readable in development.
 * Every HTTP request is logged once on completion, tagged with its request id, which is also
 * returned to the client in the X-Request-Id header.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          transport:
            config.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true, ignore: 'pid,hostname' } }
              : undefined,
          // Orchestrators probe health every few seconds: those requests would drown the rest.
          // A failed probe is still logged, by the exception filter.
          autoLogging: { ignore: (req) => req.url?.startsWith(HEALTH_URL_PREFIX) ?? false },
          genReqId: (req, res) => {
            const id = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
            res.setHeader(REQUEST_ID_HEADER, id);
            return id;
          },
          customLogLevel: (_req, res, error) => {
            if (error || res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
          },
          redact: REDACTED_LOG_PATHS,
        },
      }),
    }),
  ],
})
export class LoggingModule {}
