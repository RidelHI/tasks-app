import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/create-test-app.js';

describe('Database connection (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('connects the app to the PostgreSQL 18 test database', async () => {
    const dataSource = app.get(DataSource);

    const [row] = await dataSource.query<{ database: string; version: string }[]>(
      'SELECT current_database() AS database, current_setting($1) AS version',
      ['server_version'],
    );

    expect(dataSource.isInitialized).toBe(true);
    expect(row).toEqual({ database: 'tasks_test', version: expect.stringMatching(/^18\./) });
  });

  it('keeps track of applied migrations', async () => {
    const dataSource = app.get(DataSource);

    const [row] = await dataSource.query<{ exists: boolean }[]>(
      "SELECT to_regclass('public.migrations') IS NOT NULL AS exists",
    );

    expect(row?.exists).toBe(true);
  });

  it('closes the connection when the app shuts down', async () => {
    const shortLived = await createTestApp();
    const dataSource = shortLived.get(DataSource);

    await shortLived.close();

    expect(dataSource.isInitialized).toBe(false);
  });
});
