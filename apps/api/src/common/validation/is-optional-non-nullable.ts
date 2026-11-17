import { ValidateIf, type ValidationOptions } from 'class-validator';

/**
 * Like `@IsOptional()`, but only an absent value skips validation: `null` is still validated,
 * so the other validators reject it. For optional fields stored in a NOT NULL column.
 */
export function IsOptionalNonNullable(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateIf((_object, value) => value !== undefined, validationOptions);
}
