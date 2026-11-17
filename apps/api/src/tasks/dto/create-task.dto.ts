import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsCalendarDate } from '../../common/validation/is-calendar-date.js';
import { IsOptionalNonNullable } from '../../common/validation/is-optional-non-nullable.js';
import { trim } from '../../common/validation/trim.js';
import { TASK_STATUSES, type TaskStatus } from '../task-status.js';
import {
  TASK_ASSIGNEE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from '../task.constants.js';

export class CreateTaskDto {
  /**
   * What has to be done. Surrounding whitespace is removed.
   * @example 'Prepare the sprint demo'
   */
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(TASK_TITLE_MAX_LENGTH)
  title: string;

  /**
   * Optional details.
   * @example 'Show the new filters and the pagination.'
   */
  @IsOptional()
  @IsString()
  @MaxLength(TASK_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  /** A new task without status starts as `pending`. */
  @ApiProperty({ enum: TASK_STATUSES, required: false })
  @IsOptionalNonNullable()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  /**
   * Name of the person responsible. Surrounding whitespace is removed.
   * @example 'Jane Doe'
   */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(TASK_ASSIGNEE_MAX_LENGTH)
  assignee?: string | null;

  /** Calendar date (`YYYY-MM-DD`, no time). Past dates are allowed. */
  @ApiProperty({ type: String, format: 'date', example: '2026-12-01', required: false })
  @IsOptional()
  @IsCalendarDate()
  dueDate?: string | null;
}
