import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { EnvironmentVariables } from '../config/env.validation.js';

export const RATE_LIMIT_MESSAGE = 'Too many requests. Try again later.';

/**
 * Global rate limit per client IP (`RATE_LIMIT_*`). Over the limit, the client gets a 429
 * (rendered as Problem Details) with `Retry-After`. Counters live in memory, per instance.
 * Endpoints for infrastructure (health checks) opt out with `@SkipThrottle()`.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        throttlers: [
          {
            limit: config.get('RATE_LIMIT_REQUESTS', { infer: true }),
            ttl: seconds(config.get('RATE_LIMIT_WINDOW_SECONDS', { infer: true })),
          },
        ],
        errorMessage: RATE_LIMIT_MESSAGE,
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
