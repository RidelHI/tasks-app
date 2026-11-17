import { Controller, Get, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp } from './utils/create-test-app.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Test-only endpoint that always succeeds. */
@Controller('ping')
class PingController {
  @Get()
  ping() {
    return { ok: true };
  }
}

describe('X-Request-Id (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [PingController] });
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates a request id when the client sends none', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/ping').expect(200);

    expect(response.headers['x-request-id']).toMatch(UUID_V4);
  });

  it('echoes a valid request id sent by the client', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/ping')
      .set('X-Request-Id', 'client-trace-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('client-trace-123');
  });

  it('replaces an unsafe request id sent by the client', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/ping')
      .set('X-Request-Id', 'not a safe id')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(UUID_V4);
  });

  it('includes the request id in error responses', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);

    expect(response.headers['x-request-id']).toMatch(UUID_V4);
  });
});
