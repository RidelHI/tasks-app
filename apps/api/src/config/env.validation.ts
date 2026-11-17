import { plainToInstance, Transform, type TransformFnParams, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, Max, Min, validateSync } from 'class-validator';

export const ENVIRONMENTS = ['development', 'production', 'test'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Strict boolean parsing: only "true" and "false" are converted, anything else is left as is
 * so @IsBoolean rejects it. (Boolean("false") would be true, a classic env-parsing bug.)
 */
function toBoolean({ value }: TransformFnParams): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/**
 * Single source of truth for the environment variables the API reads:
 * names, types, defaults and validation rules.
 */
export class EnvironmentVariables {
  @IsIn(ENVIRONMENTS)
  NODE_ENV: Environment = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsIn(LOG_LEVELS)
  LOG_LEVEL: LogLevel = 'info';

  @Transform(toBoolean)
  @IsBoolean()
  SWAGGER_ENABLED: boolean = true;
}

/**
 * Converts and validates the raw environment, where every value is a string.
 * Throws a single error listing every problem, so the app fails fast at startup.
 * Messages name the variable but never echo its value (it could be a secret).
 */
export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, raw);
  const errors = validateSync(env);

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .map((message) => `  - ${message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return env;
}
