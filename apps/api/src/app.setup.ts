import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ProblemDetailsFilter } from './common/errors/problem-details.filter.js';
import { ValidationException } from './common/errors/validation.exception.js';

export const API_PREFIX = 'api';

/**
 * Application-level configuration shared by main.ts and the e2e tests, so the tests exercise
 * exactly what runs in production: logger, `/api/v1` routes, global input validation and
 * RFC 9457 error responses.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.useLogger(app.get(Logger));

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
