import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination/page-query.dto.js';
import { trim } from '../../common/validation/trim.js';
import { TASK_STATUSES, type TaskStatus } from '../task-status.js';
import { TASK_ASSIGNEE_MAX_LENGTH } from '../task.constants.js';

/** Filters and page of `GET /tasks`. Filters combine with AND; results are newest first. */
export class ListTasksQueryDto extends PageQueryDto {
  /** Only tasks in this status. */
  @ApiProperty({ enum: TASK_STATUSES, required: false })
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  /**
   * Only tasks of this person: the whole name, ignoring case and surrounding whitespace.
   * @example 'Jane Doe'
   */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(TASK_ASSIGNEE_MAX_LENGTH)
  assignee?: string;
}
