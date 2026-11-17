import type { INestApplication, Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

interface TestAppOptions {
  /** Extra controllers, e.g. test-only probes for global behaviour. */
  controllers?: Type[];
  /** Runs after configureApp and before init (routes must be registered before init). */
  beforeInit?: (app: INestApplication<App>) => void;
}

/** Builds the full application with exactly the same configuration as production (main.ts). */
export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: options.controllers ?? [],
  }).compile();

  // Same platform as main.ts (Express), which configureApp relies on (e.g. `trust proxy`).
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
  configureApp(app);
  options.beforeInit?.(app);
  await app.init();

  return app;
}
