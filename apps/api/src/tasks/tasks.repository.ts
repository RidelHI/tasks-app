import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, Raw, type Repository } from 'typeorm';
import { offsetOf, type Page, type PageRequest } from '../common/pagination/page.js';
import type { TaskStatus } from './task-status.js';
import { Task } from './task.entity.js';

/** Fields a client sets; the database generates the id and the timestamps. */
export type TaskData = Pick<Task, 'title' | 'description' | 'status' | 'assignee' | 'dueDate'>;

export interface TaskFilters {
  status?: TaskStatus;
  /** Whole name, compared ignoring case. */
  assignee?: string;
}

/** Data access for tasks. Keeps TypeORM out of the service and owns every query. */
@Injectable()
export class TasksRepository {
  constructor(@InjectRepository(Task) private readonly tasks: Repository<Task>) {}

  create(data: TaskData): Promise<Task> {
    return this.tasks.save(this.tasks.create(data));
  }

  findById(id: string): Promise<Task | null> {
    return this.tasks.findOneBy({ id });
  }

  /** One page of the matching tasks, newest first (`id` breaks ties, so pages are stable). */
  async findPage(filters: TaskFilters, request: PageRequest): Promise<Page<Task>> {
    const where: FindOptionsWhere<Task> = {};
    if (filters.status !== undefined) {
      where.status = filters.status;
    }
    if (filters.assignee !== undefined) {
      const { assignee } = filters;
      where.assignee = Raw((column) => `LOWER(${column}) = LOWER(:assignee)`, { assignee });
    }

    const [items, totalItems] = await this.tasks.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: offsetOf(request),
      take: request.pageSize,
    });
    return { items, totalItems };
  }

  /** Applies the changes (and refreshes `updatedAt`); `null` when the task does not exist. */
  async update(id: string, changes: Partial<TaskData>): Promise<Task | null> {
    if (Object.keys(changes).length > 0) {
      const { affected } = await this.tasks.update({ id }, changes);
      if (!affected) return null;
    }
    return this.findById(id);
  }

  /** `false` when the task does not exist. */
  async delete(id: string): Promise<boolean> {
    const { affected } = await this.tasks.delete({ id });
    return Boolean(affected);
  }
}
