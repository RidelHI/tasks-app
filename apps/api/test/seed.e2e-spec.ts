import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { seedDemoTasks } from '../src/database/seed/seed-demo-tasks.js';
import { createTestApp } from './utils/create-test-app.js';

const TASKS = '/api/v1/tasks';

interface TaskPage {
  items: { title: string; assignee: string | null; createdAt: string }[];
  totalItems: number;
  totalPages: number;
}

describe('Demo seed (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const list = async (query: Record<string, string | number> = {}): Promise<TaskPage> => {
    const response = await request(app.getHttpServer()).get(TASKS).query(query).expect(200);
    return response.body as TaskPage;
  };

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterEach(async () => {
    await dataSource.query('TRUNCATE TABLE tasks');
  });

  afterAll(async () => {
    await app.close();
  });

  it('fills an empty database with tasks the API lists newest first, in three pages', async () => {
    const now = new Date();

    expect(await seedDemoTasks(dataSource, now)).toBe(48);

    const firstPage = await list();
    expect(firstPage).toMatchObject({ totalItems: 48, totalPages: 3 });
    expect(firstPage.items[0]).toMatchObject({
      title: 'Plan the next sprint',
      createdAt: new Date(now.getTime() - 14 * 3_600_000).toISOString(),
    });
    expect((await list({ page: 3 })).items).toHaveLength(8);
  });

  it('gives the assignee filter something to find', async () => {
    await seedDemoTasks(dataSource);

    const page = await list({ assignee: 'ana lópez' });

    expect(page.totalItems).toBeGreaterThan(1);
    expect(page.items.every((task) => task.assignee === 'Ana López')).toBe(true);
  });

  it('leaves a database that already has tasks untouched', async () => {
    await request(app.getHttpServer()).post(TASKS).send({ title: 'My own task' }).expect(201);

    expect(await seedDemoTasks(dataSource)).toBe(0);
    expect(await list()).toMatchObject({ totalItems: 1, items: [{ title: 'My own task' }] });
  });

  it('does not insert the demo tasks twice', async () => {
    await seedDemoTasks(dataSource);

    expect(await seedDemoTasks(dataSource)).toBe(0);
    expect((await list()).totalItems).toBe(48);
  });
});
