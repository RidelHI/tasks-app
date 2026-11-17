import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';

@Module({
  // Terminus' own failure log is off: a failed readiness check is logged once, with its
  // reason, by the exception filter (see notReady).
  imports: [TerminusModule.forRoot({ logger: false })],
  controllers: [HealthController],
})
export class HealthModule {}
