import 'reflect-metadata';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import type { TestProject } from 'vitest/node';
import {
  buildDataSourceOptions,
  type DatabaseSettings,
} from '../../src/database/data-source-options.js';

declare module 'vitest' {
  export interface ProvidedContext {
    database: DatabaseSettings;
  }
}

/** Same image as compose.yaml, so tests run against the same PostgreSQL as development. */
const POSTGRES_IMAGE = 'postgres:18-alpine';

/**
 * Starts one disposable PostgreSQL container per e2e run, applies the migrations once and
 * hands the connection details to the workers (see database-env.ts). Ryuk removes the
 * container even if the run is aborted.
 */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase('tasks_test')
    .withUsername('tasks')
    .withPassword('tasks')
    .start();

  const settings: DatabaseSettings = {
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  };

  await runMigrations(settings);
  project.provide('database', settings);

  return async () => {
    await container.stop();
  };
}

/** Builds the schema exactly as production does: through the registered migrations. */
async function runMigrations(settings: DatabaseSettings): Promise<void> {
  const dataSource = new DataSource({ ...buildDataSourceOptions(settings), logging: false });
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}
