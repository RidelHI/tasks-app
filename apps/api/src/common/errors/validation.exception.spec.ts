import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { toFieldErrors, ValidationException } from './validation.exception.js';

function validationError(fields: Partial<ValidationError>): ValidationError {
  return Object.assign(new ValidationError(), fields);
}

describe('toFieldErrors', () => {
  it('maps each invalid field to its messages', () => {
    const errors = [
      validationError({
        property: 'title',
        constraints: {
          isNotEmpty: 'title should not be empty',
          maxLength: 'title must be shorter than or equal to 120 characters',
        },
      }),
      validationError({
        property: 'role',
        constraints: { whitelistValidation: 'property role should not exist' },
      }),
    ];

    expect(toFieldErrors(errors)).toEqual([
      {
        field: 'title',
        messages: [
          'title should not be empty',
          'title must be shorter than or equal to 120 characters',
        ],
      },
      { field: 'role', messages: ['property role should not exist'] },
    ]);
  });

  it('uses dotted paths for nested fields and skips parents without own errors', () => {
    const errors = [
      validationError({
        property: 'address',
        children: [
          validationError({
            property: 'street',
            constraints: { isString: 'street must be a string' },
          }),
        ],
      }),
    ];

    expect(toFieldErrors(errors)).toEqual([
      { field: 'address.street', messages: ['street must be a string'] },
    ]);
  });

  it('returns no entries when there are no errors', () => {
    expect(toFieldErrors([])).toEqual([]);
  });
});

describe('ValidationException', () => {
  it('is a 400 that carries the field errors', () => {
    const exception = ValidationException.fromValidationErrors([
      validationError({ property: 'title', constraints: { isString: 'title must be a string' } }),
    ]);

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toBe('The request contains invalid fields.');
    expect(exception.errors).toEqual([{ field: 'title', messages: ['title must be a string'] }]);
  });
});
