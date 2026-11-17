import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

export const API_PREFIX = 'api';

/**
 * Application-level configuration shared by main.ts and the e2e tests, so the tests exercise
 * exactly what runs in production: logger, `/api/v1` routes and global input validation.
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
    }),
  );

  return app;
}
