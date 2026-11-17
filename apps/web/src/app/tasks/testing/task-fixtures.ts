import { Task, TaskPage } from '../task';

let sequence = 0;

/** A task as the API returns it, with the given fields overridden. */
export function aTask(fields: Partial<Task> = {}): Task {
  sequence += 1;
  return {
    id: `019a0000-0000-7000-8000-${String(sequence).padStart(12, '0')}`,
    title: `Task ${sequence}`,
    description: null,
    status: 'pending',
    assignee: null,
    dueDate: null,
    createdAt: '2026-11-17T10:00:00.000Z',
    updatedAt: '2026-11-17T10:00:00.000Z',
    ...fields,
  };
}

/** A page of the task list. By default, the only page and with every item on it. */
export function aPage(items: Task[], fields: Partial<TaskPage> = {}): TaskPage {
  return {
    items,
    page: 1,
    pageSize: 20,
    totalItems: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    ...fields,
  };
}

/** Body of an API error, as `ProblemDetailsFilter` renders it. */
export function aProblem(status: number, title: string, detail: string) {
  return { type: 'about:blank', title, status, detail, instance: '/api/v1/tasks' };
}
