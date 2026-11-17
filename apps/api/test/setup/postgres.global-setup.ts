import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

/** Connection details of the e2e database, shared with the test workers. */
export interface DatabaseConnection {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    database: DatabaseConnection;
  }
}

/** Same image as compose.yaml, so tests run against the same PostgreSQL as development. */
const POSTGRES_IMAGE = 'postgres:18-alpine';

/**
 * Starts one disposable PostgreSQL container per e2e run and hands its connection details to
 * the workers (see database-env.ts). Ryuk removes the container even if the run is aborted.
 */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase('tasks_test')
    .withUsername('tasks')
    .withPassword('tasks')
    .start();

  project.provide('database', {
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });

  return async () => {
    await container.stop();
  };
}
