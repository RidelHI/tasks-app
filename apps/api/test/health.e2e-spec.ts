import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/create-test-app.js';

describe('Health checks (e2e)', () => {
  describe('with the database available', () => {
    let app: INestApplication<App>;

    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
      app = await createTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('reports the process alive', async () => {
      const response = await http().get('/api/health/live').expect(200);

      expect(response.body).toEqual({ status: 'ok', info: {}, error: {}, details: {} });
    });

    it('reports the instance ready when the database answers', async () => {
      const response = await http().get('/api/health/ready').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
      });
    });

    it.each(['live', 'ready'])('is never cached nor rate limited (%s)', async (probe) => {
      const response = await http().get(`/api/health/${probe}`).expect(200);

      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['x-ratelimit-limit']).toBeUndefined();
    });

    it('is not part of the versioned API', async () => {
      await http().get('/api/v1/health/live').expect(404);
    });
  });

  describe('with the database down', () => {
    let app: INestApplication<App>;

    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
      app = await createTestApp();
      // Closing the pool makes every query fail, as if the database were unreachable.
      await app.get(DataSource).destroy();
    });

    afterAll(async () => {
      await app.close();
    });

    it('answers readiness with a 503 problem that names the failed check only', async () => {
      const response = await http()
        .get('/api/health/ready')
        .expect(503)
        .expect('Content-Type', /^application\/problem\+json/);

      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Service Unavailable',
        status: 503,
        detail: 'The service is not ready: database unavailable.',
        instance: '/api/health/ready',
        requestId: response.headers['x-request-id'],
      });
    });

    it('still reports the process alive, so the orchestrator does not restart it', async () => {
      await http().get('/api/health/live').expect(200);
    });
  });
});
