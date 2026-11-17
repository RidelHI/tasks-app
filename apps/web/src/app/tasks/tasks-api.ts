import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NewTask, Task, TaskChanges, TaskPage, TaskQuery } from './task';

/** Same origin as the app: the dev server proxies `/api`, and so does nginx in production. */
export const TASKS_URL = '/api/v1/tasks';

/** Query parameters of the task list; filters that are not set are left out. */
export function taskQueryParams(query: TaskQuery): Record<string, string | number> {
  return {
    ...(query.status && { status: query.status }),
    ...(query.assignee && { assignee: query.assignee }),
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Client of the tasks endpoints of the API. */
@Service()
export class TasksApi {
  private readonly http = inject(HttpClient);

  /**
   * The page of tasks that matches `query`, fetched again whenever `query` changes (a request in
   * flight is cancelled). Call it in an injection context, such as a component field initializer.
   */
  listResource(query: () => TaskQuery): HttpResourceRef<TaskPage | undefined> {
    return httpResource<TaskPage>(() => ({ url: TASKS_URL, params: taskQueryParams(query()) }));
  }

  create(task: NewTask): Promise<Task> {
    return firstValueFrom(this.http.post<Task>(TASKS_URL, task));
  }

  update(id: string, changes: TaskChanges): Promise<Task> {
    return firstValueFrom(this.http.patch<Task>(`${TASKS_URL}/${id}`, changes));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${TASKS_URL}/${id}`));
  }
}
