import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/** One invalid input field and every rule it broke. Nested fields use dotted paths. */
export interface FieldError {
  field: string;
  messages: string[];
}

/**
 * 400 raised by the global ValidationPipe. Unlike Nest's default (a flat list of strings), it
 * keeps which field failed, so clients such as a form can point at it.
 */
export class ValidationException extends BadRequestException {
  constructor(readonly errors: FieldError[]) {
    super('The request contains invalid fields.');
  }

  static fromValidationErrors(errors: ValidationError[]): ValidationException {
    return new ValidationException(toFieldErrors(errors));
  }
}

/** Flattens class-validator's error tree into `{ field, messages }` entries. */
export function toFieldErrors(errors: ValidationError[], parentPath = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, messages: Object.values(error.constraints) }] : [];

    return [...own, ...toFieldErrors(error.children ?? [], field)];
  });
}
