import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { API_PREFIX } from './app.constants.js';
import { ProblemDetailsFilter } from './common/errors/problem-details.filter.js';
import { ValidationException } from './common/errors/validation.exception.js';
import type { EnvironmentVariables } from './config/env.validation.js';
import { buildCorsOptions } from './security/cors.js';
import { securityHeaders } from './security/security-headers.js';

/**
 * Application-level configuration shared by main.ts and the e2e tests, so the tests exercise
 * exactly what runs in production: logger, security headers, `/api/v1` routes, global input
 * validation and RFC 9457 error responses.
 */
export function configureApp<T extends NestExpressApplication>(app: T): T {
  app.useLogger(app.get(Logger));

  // First middleware, so every response carries the headers (errors and 404s included).
  app.use(securityHeaders());

  const config = app.get(ConfigService<EnvironmentVariables, true>);

  // How many reverse proxies may set X-Forwarded-For: decides the client IP (`req.ip`) that the
  // rate limit counts. 0 ignores the header, which any client could forge.
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));

  const cors = buildCorsOptions(config.get('CORS_ORIGINS', { infer: true }));
  if (cors) {
    app.enableCors(cors);
  }

  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties without validation decorators and reject requests that send them.
      whitelist: true,
      forbidNonWhitelisted: true,
      // Hand handlers real DTO instances; conversions must be explicit (@Type, @Transform).
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      // Keep which field failed (Nest's default flattens everything into strings).
      exceptionFactory: (errors) => ValidationException.fromValidationErrors(errors),
    }),
  );

  app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));

  return app;
}
