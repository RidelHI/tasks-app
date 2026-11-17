import { ApiProperty } from '@nestjs/swagger';
import { TASK_STATUSES, type TaskStatus } from '../task-status.js';
import type { Task } from '../task.entity.js';

export class TaskResponseDto {
  /** @example '019a8f2e-4c1b-7d3e-9f0a-1b2c3d4e5f60' */
  @ApiProperty({ format: 'uuid' })
  id: string;

  /** @example 'Prepare the sprint demo' */
  title: string;

  /** @example 'Show the new filters and the pagination.' */
  description: string | null;

  @ApiProperty({ enum: TASK_STATUSES })
  status: TaskStatus;

  /** @example 'Jane Doe' */
  assignee: string | null;

  @ApiProperty({ type: String, format: 'date', example: '2026-12-01', nullable: true })
  dueDate: string | null;

  createdAt: Date;

  updatedAt: Date;

  static fromEntity(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignee: task.assignee,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
