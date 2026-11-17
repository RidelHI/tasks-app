import {
  Body,
  Controller,
  Get,
  HttpCode,
  type INestApplication,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp } from './utils/create-test-app.js';

class ProbeQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;
}

class ProbeBody {
  @IsString()
  name: string;
}

/** Test-only controller to observe the global configuration applied by configureApp. */
@Controller('probe')
class ProbeController {
  @Get()
  read(@Query() query: ProbeQuery) {
    return { page: query.page, pageType: typeof query.page };
  }

  @Post()
  @HttpCode(200)
  write(@Body() body: ProbeBody) {
    return { receivedDto: body instanceof ProbeBody, body };
  }
}

describe('Application setup (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ProbeController] });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('routing', () => {
    it('serves routes under /api/v1', async () => {
      await request(app.getHttpServer()).get('/api/v1/probe?page=1').expect(200);
    });

    it.each(['/probe?page=1', '/api/probe?page=1', '/v1/probe?page=1'])(
      'does not serve %s',
      async (path) => {
        await request(app.getHttpServer()).get(path).expect(404);
      },
    );
  });

  describe('validation', () => {
    it('converts query strings explicitly marked with @Type', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/probe?page=2').expect(200);

      expect(response.body).toEqual({ page: 2, pageType: 'number' });
    });

    it('rejects an invalid query with 400', async () => {
      await request(app.getHttpServer()).get('/api/v1/probe?page=abc').expect(400);
    });

    it('hands the handler a DTO instance', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/probe')
        .send({ name: 'task' })
        .expect(200);

      expect(response.body).toEqual({ receivedDto: true, body: { name: 'task' } });
    });

    it('rejects properties that are not part of the DTO with 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/probe')
        .send({ name: 'task', role: 'admin' })
        .expect(400);

      expect(JSON.stringify(response.body)).toContain('property role should not exist');
    });
  });
});
