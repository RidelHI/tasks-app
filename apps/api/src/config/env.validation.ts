import { plainToInstance, Transform, type TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

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

/** Comma-separated list: "a, b,,c" becomes ["a", "b", "c"]; "" becomes []. */
function toList({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') return value;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/** An origin as browsers send it: scheme, host and optional port, without path or slash. */
const ORIGIN = /^https?:\/\/[a-z0-9.-]+(:\d{1,5})?$/i;

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

  /** Origins allowed to call the API from a browser (CORS). Empty: CORS disabled. */
  @Transform(toList)
  @IsArray()
  @Matches(ORIGIN, {
    each: true,
    message: 'each value in CORS_ORIGINS must be an origin like https://app.example.com',
  })
  CORS_ORIGINS: string[] = [];

  /** Requests each client (IP) may send per window before getting 429. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_REQUESTS: number = 100;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_WINDOW_SECONDS: number = 60;

  /**
   * Reverse proxies in front of the API whose X-Forwarded-For can be trusted to find the
   * client IP. 0: the header is ignored (any client could forge it to dodge the rate limit).
   */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  TRUST_PROXY_HOPS: number = 0;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 5432;

  // Credentials have no defaults on purpose: a missing value must stop the app, never fall
  // back to a hard-coded password.
  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;
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
