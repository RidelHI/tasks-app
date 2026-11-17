import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('X-Request-Id (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates a request id when the client sends none', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers['x-request-id']).toMatch(UUID_V4);
  });

  it('echoes a valid request id sent by the client', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'client-trace-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('client-trace-123');
  });

  it('replaces an unsafe request id sent by the client', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'not a safe id')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(UUID_V4);
  });

  it('includes the request id in error responses', async () => {
    const response = await request(app.getHttpServer()).get('/does-not-exist').expect(404);

    expect(response.headers['x-request-id']).toMatch(UUID_V4);
  });
});
