import type { INestApplication, Type } from '@nestjs/common';
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

  const app = moduleRef.createNestApplication<INestApplication<App>>({ bufferLogs: true });
  configureApp(app);
  options.beforeInit?.(app);
  await app.init();

  return app;
}
