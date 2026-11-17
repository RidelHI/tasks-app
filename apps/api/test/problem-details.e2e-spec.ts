import {
  Body,
  Controller,
  Get,
  HttpCode,
  type INestApplication,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp } from './utils/create-test-app.js';

class ProbeBody {
  @IsString()
  @IsNotEmpty()
  name: string;
}

/** Test-only endpoints that fail in the ways the global error handling must cover. */
@Controller('problem-probe')
class ProblemProbeController {
  @Post()
  @HttpCode(200)
  create(@Body() body: ProbeBody) {
    return body;
  }

  @Get('bug')
  bug(): never {
    throw new Error('connection to db failed: password=hunter2');
  }

  @Get(':id')
  find(@Param('id', ParseUUIDPipe) id: string) {
    return { id };
  }
}

describe('Problem Details (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ProblemProbeController] });
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers unknown routes with a 404 problem carrying the request id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist?token=abc')
      .expect(404)
      .expect('Content-Type', /^application\/problem\+json/);

    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Cannot GET /api/v1/does-not-exist?token=abc',
      instance: '/api/v1/does-not-exist',
      requestId: response.headers['x-request-id'],
    });
  });

  it('lists every invalid field of a request body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/problem-probe')
      .send({ name: '', role: 'admin' })
      .expect(400)
      .expect('Content-Type', /^application\/problem\+json/);

    expect(response.body).toMatchObject({
      title: 'Bad Request',
      status: 400,
      detail: 'The request contains invalid fields.',
    });
    // The order of the entries carries no meaning.
    expect(response.body.errors).toHaveLength(2);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'name', messages: ['name should not be empty'] },
        { field: 'role', messages: ['property role should not exist'] },
      ]),
    );
  });

  it('rejects a malformed id before it reaches the database', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/problem-probe/not-a-uuid')
      .expect(400);

    expect(response.body).toMatchObject({
      status: 400,
      detail: 'Validation failed (uuid is expected)',
    });
  });

  it('hides the details of unexpected errors behind a generic 500', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/problem-probe/bug')
      .expect(500)
      .expect('Content-Type', /^application\/problem\+json/);

    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred.',
      instance: '/api/v1/problem-probe/bug',
      requestId: response.headers['x-request-id'],
    });
    expect(response.text).not.toContain('hunter2');
  });
});
