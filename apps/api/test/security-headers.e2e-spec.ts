import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { setupOpenApi } from '../src/openapi.js';
import { createTestApp } from './utils/create-test-app.js';

const API_CSP = "default-src 'none';frame-ancestors 'none'";

describe('Security headers (e2e)', () => {
  let app: INestApplication<App>;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp({ beforeInit: setupOpenApi });
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['a successful response', '/api/v1/tasks', 200],
    ['an error response', '/api/v1/does-not-exist', 404],
    ['the OpenAPI document', '/api/docs-json', 200],
  ])('protects %s with the strict API policy', async (_case, path, status) => {
    const response = await http().get(path).expect(status);

    expect(response.headers).toMatchObject({
      'content-security-policy': API_CSP,
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
      'strict-transport-security': expect.stringContaining('max-age='),
      'cross-origin-resource-policy': 'same-origin',
    });
  });

  it('does not reveal the framework', async () => {
    const response = await http().get('/api/v1/tasks').expect(200);

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('lets Swagger UI load its own scripts and styles, and nothing else', async () => {
    const response = await http().get('/api/docs').expect(200);

    const policy = response.headers['content-security-policy'];
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toBe(API_CSP);
  });
});
