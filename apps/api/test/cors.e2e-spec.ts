import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp } from './utils/create-test-app.js';

/** Allowed through CORS_ORIGINS in vitest.config.e2e.ts. */
const ALLOWED_ORIGIN = 'http://localhost:4200';

describe('CORS (e2e)', () => {
  let app: INestApplication<App>;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers the preflight of an allowed origin', async () => {
    const response = await http()
      .options('/api/v1/tasks/019a8f2e-4c1b-7d3e-9f0a-1b2c3d4e5f60')
      .set('Origin', ALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204);

    expect(response.headers).toMatchObject({
      'access-control-allow-origin': ALLOWED_ORIGIN,
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '600',
    });
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('lets an allowed origin read the response and the headers it needs', async () => {
    const response = await http().get('/api/v1/tasks').set('Origin', ALLOWED_ORIGIN).expect(200);

    expect(response.headers).toMatchObject({
      'access-control-allow-origin': ALLOWED_ORIGIN,
      'access-control-expose-headers': 'Location,X-Request-Id',
      vary: expect.stringContaining('Origin'),
    });
  });

  it('gives other origins no CORS permission', async () => {
    const response = await http()
      .get('/api/v1/tasks')
      .set('Origin', 'https://evil.example.com')
      .expect(200);

    // The browser enforces CORS: without this header it hides the response from the page.
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
