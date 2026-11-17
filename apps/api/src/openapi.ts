import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { docsContentSecurityPolicy } from './security/security-headers.js';

/** Swagger UI path; the JSON document is served at `${OPENAPI_PATH}-json`. */
export const OPENAPI_PATH = 'api/docs';

/** Serves the OpenAPI document and Swagger UI. Must run before the app is initialized. */
export function setupOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Tasks API')
    .setDescription(
      'REST API to create, list (with filters and pagination), update and delete tasks.',
    )
    .setVersion('1.0')
    .build();

  // Swagger UI needs scripts and styles, which the API's Content Security Policy forbids.
  app.use(`/${OPENAPI_PATH}`, docsContentSecurityPolicy());
  SwaggerModule.setup(OPENAPI_PATH, app, () => SwaggerModule.createDocument(app, config));
}
