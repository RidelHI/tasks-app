import type { TransformFnParams } from 'class-transformer';

/** `@Transform(trim)`: removes surrounding whitespace from strings; other values pass through. */
export function trim({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
