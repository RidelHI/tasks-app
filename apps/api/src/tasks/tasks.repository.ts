import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Task } from './task.entity.js';

/** Fields a client sets; the database generates the id and the timestamps. */
export type TaskData = Pick<Task, 'title' | 'description' | 'status' | 'assignee' | 'dueDate'>;

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
