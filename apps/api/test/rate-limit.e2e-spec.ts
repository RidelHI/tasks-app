import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { RATE_LIMIT_MESSAGE } from '../src/security/rate-limit.module.js';
import { createTestApp } from './utils/create-test-app.js';

/** Test-only endpoint with a tiny limit, so the global guard can be exceeded quickly. */
@Controller('rate-limit-probe')
@Throttle({ default: { limit: 2, ttl: 60_000 } })
class RateLimitProbeController {
  @Get()
  ping() {
    return { ok: true };
  }
}

const PROBE = '/api/v1/rate-limit-probe';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  const http = () => request(app.getHttpServer());

  // A new app per test: the counters live in its memory, so every test starts from zero.
  beforeEach(async () => {
    app = await createTestApp({ controllers: [RateLimitProbeController] });
  });

  afterEach(async () => {
    await app.close();
  });

  it('applies the configured global limit to every route', async () => {
    const response = await http().get('/api/v1/tasks').expect(200);

    // RATE_LIMIT_REQUESTS of the e2e environment (vitest.config.e2e.ts).
    expect(response.headers['x-ratelimit-limit']).toBe('10000');
  });

  it('allows requests up to the limit and reports the remaining quota', async () => {
    const first = await http().get(PROBE).expect(200);
    const second = await http().get(PROBE).expect(200);

    expect(first.headers['x-ratelimit-remaining']).toBe('1');
    expect(second.headers['x-ratelimit-remaining']).toBe('0');
  });

  it('answers 429 as a problem with Retry-After once the limit is exceeded', async () => {
    await http().get(PROBE).expect(200);
    await http().get(PROBE).expect(200);

    const response = await http()
      .get(PROBE)
      .expect(429)
      .expect('Content-Type', /^application\/problem\+json/);

    expect(response.body).toMatchObject({
      title: 'Too Many Requests',
      status: 429,
      detail: RATE_LIMIT_MESSAGE,
      instance: PROBE,
    });
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('does not let a forged X-Forwarded-For pass for a new client', async () => {
    await http().get(PROBE).set('X-Forwarded-For', '203.0.113.1').expect(200);
    await http().get(PROBE).set('X-Forwarded-For', '203.0.113.2').expect(200);

    await http().get(PROBE).set('X-Forwarded-For', '203.0.113.3').expect(429);
  });
});
