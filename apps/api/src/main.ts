import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { EnvironmentVariables } from './config/env.validation.js';
import { setupOpenApi } from './openapi.js';

async function bootstrap() {
  // Buffer Nest's startup logs until pino is in place (configureApp), so they are structured too.
  const app = configureApp(await NestFactory.create(AppModule, { bufferLogs: true }));
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    setupOpenApi(app);
  }

  // On SIGTERM/SIGINT, run the shutdown lifecycle hooks (e.g. close DB connections) before exiting.
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
