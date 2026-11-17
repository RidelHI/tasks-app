import { Injectable, NotFoundException } from '@nestjs/common';
import type { Page } from '../common/pagination/page.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';
import { DEFAULT_TASK_STATUS } from './task-status.js';
import type { Task } from './task.entity.js';
import { type TaskData, TasksRepository } from './tasks.repository.js';

@Injectable()
export class TasksService {
  constructor(private readonly tasks: TasksRepository) {}

  create(dto: CreateTaskDto): Promise<Task> {
    return this.tasks.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? DEFAULT_TASK_STATUS,
      assignee: dto.assignee ?? null,
      dueDate: dto.dueDate ?? null,
    });
  }

  list(query: ListTasksQueryDto): Promise<Page<Task>> {
    const { status, assignee, page, pageSize } = query;
    return this.tasks.findPage({ status, assignee }, { page, pageSize });
  }

  async findById(id: string): Promise<Task> {
    return (await this.tasks.findById(id)) ?? notFound(id);
  }

  /** Changes only the fields present in the request; `null` clears an optional field. */
  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    return (await this.tasks.update(id, presentFields(dto))) ?? notFound(id);
  }

  async delete(id: string): Promise<void> {
    if (!(await this.tasks.delete(id))) notFound(id);
  }
}

function notFound(id: string): never {
  throw new NotFoundException(`Task ${id} was not found.`);
}

/** The fields the client sent: DTO instances also carry the absent ones as `undefined`. */
function presentFields(dto: UpdateTaskDto): Partial<TaskData> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  ) as Partial<TaskData>;
}
