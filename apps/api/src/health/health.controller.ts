import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiProblem } from '../common/errors/api-problem.decorator.js';
import { HealthCheckResponseDto } from './health-check-response.dto.js';
import { HEALTH_PATH } from './health.constants.js';
import { notReady } from './not-ready.js';

/** The database must answer the readiness ping within this time. */
const DATABASE_PING_TIMEOUT_MS = 1500;

/** No response caching; documented here (terminus would document the 503 its own way). */
const HEALTH_CHECK_OPTIONS = { noCache: true, swaggerDocumentation: false };

/**
 * Probes for orchestrators (Docker, Kubernetes). Infrastructure, not part of the versioned API:
 * served at `/api/health/*`, without rate limit.
 */
@ApiTags('health')
@SkipThrottle()
@Controller({ path: HEALTH_PATH, version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
  ) {}

  /**
   * Liveness: the process responds. It checks no dependency on purpose: restarting the API
   * would not fix a database outage, and every replica would enter a restart loop.
   */
  @Get('live')
  @ApiOkResponse({ type: HealthCheckResponseDto })
  @HealthCheck(HEALTH_CHECK_OPTIONS)
  live(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  /** Readiness: the instance can serve requests, so its dependencies (the database) answer. */
  @Get('ready')
  @ApiOkResponse({ type: HealthCheckResponseDto })
  @HealthCheck(HEALTH_CHECK_OPTIONS)
  @ApiProblem(503, 'A dependency is unavailable: stop routing requests to this instance.')
  async ready(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () => this.database.pingCheck('database', { timeout: DATABASE_PING_TIMEOUT_MS }),
      ]);
    } catch (error) {
      throw notReady(error);
    }
  }
}
