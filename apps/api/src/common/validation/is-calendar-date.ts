import { buildMessage, isISO8601, ValidateBy, type ValidationOptions } from 'class-validator';

const CALENDAR_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date written as `YYYY-MM-DD`, without time (rejects `2026-02-30`). */
export function isCalendarDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    CALENDAR_DATE_FORMAT.test(value) &&
    isISO8601(value, { strict: true })
  );
}

export function IsCalendarDate(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCalendarDate',
      validator: {
        validate: (value) => isCalendarDate(value),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be a valid date in YYYY-MM-DD format`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
