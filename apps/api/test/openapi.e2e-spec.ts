import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { setupOpenApi } from '../src/openapi.js';
import { createTestApp } from './utils/create-test-app.js';

describe('OpenAPI (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ beforeInit: setupOpenApi });
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the OpenAPI document', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);

    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info).toMatchObject({ title: 'Tasks API', version: '1.0' });
  });

  it('serves Swagger UI', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs').expect(200);

    expect(response.headers['content-type']).toContain('text/html');
  });
});
