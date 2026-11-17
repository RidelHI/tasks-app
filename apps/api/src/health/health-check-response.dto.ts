import { ApiProperty } from '@nestjs/swagger';

const UP = { database: { status: 'up' } };

/** OpenAPI schema of a successful health check (terminus' result format). */
export class HealthCheckResponseDto {
  /** @example 'ok' */
  status: string;

  /** Checks that passed. */
  @ApiProperty({ type: 'object', additionalProperties: true, example: UP })
  info: Record<string, unknown>;

  /** Checks that failed (empty when the check succeeds). */
  @ApiProperty({ type: 'object', additionalProperties: true, example: {} })
  error: Record<string, unknown>;

  /** Every check, passed or failed. */
  @ApiProperty({ type: 'object', additionalProperties: true, example: UP })
  details: Record<string, unknown>;
}
