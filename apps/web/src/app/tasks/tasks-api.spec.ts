import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Task, TaskPage, TaskQuery } from './task';
import { TasksApi, taskQueryParams } from './tasks-api';

const task: Task = {
  id: '019a0000-0000-7000-8000-000000000001',
  title: 'Write the README',
  description: null,
  status: 'pending',
  assignee: 'Jane Doe',
  dueDate: '2026-12-01',
  createdAt: '2026-11-17T10:00:00.000Z',
  updatedAt: '2026-11-17T10:00:00.000Z',
};

const page = (items: Task[]): TaskPage => ({
  items,
  page: 1,
  pageSize: 20,
  totalItems: items.length,
  totalPages: 1,
});

describe('taskQueryParams', () => {
  it('sends the page and only the filters that are set', () => {
    expect(taskQueryParams({ page: 2, pageSize: 50 })).toEqual({ page: 2, pageSize: 50 });
    expect(
      taskQueryParams({ status: 'done', assignee: 'Jane Doe', page: 1, pageSize: 20 }),
    ).toEqual({ status: 'done', assignee: 'Jane Doe', page: 1, pageSize: 20 });
  });
});

describe('TasksApi', () => {
  let api: TasksApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TasksApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists tasks and fetches again when the query changes', async () => {
    const query = signal<TaskQuery>({ page: 1, pageSize: 20 });
    const tasks = TestBed.runInInjectionContext(() => api.listResource(query));

    TestBed.tick();
    http.expectOne('/api/v1/tasks?page=1&pageSize=20').flush(page([task]));
    await expect.poll(() => tasks.hasValue()).toBe(true);
    expect(tasks.value()?.items).toEqual([task]);

    query.set({ status: 'done', page: 1, pageSize: 20 });
    TestBed.tick();
    http.expectOne('/api/v1/tasks?status=done&page=1&pageSize=20').flush(page([]));
    await expect.poll(() => tasks.value()?.items).toEqual([]);
  });

  it('creates a task', async () => {
    const created = api.create({ title: 'Write the README', assignee: 'Jane Doe' });

    const request = http.expectOne('/api/v1/tasks');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Write the README', assignee: 'Jane Doe' });
    request.flush(task);

    await expect(created).resolves.toEqual(task);
  });

  it('sends only the changes when updating a task', async () => {
    const updated = api.update(task.id, { status: 'done', dueDate: null });

    const request = http.expectOne(`/api/v1/tasks/${task.id}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'done', dueDate: null });
    request.flush({ ...task, status: 'done', dueDate: null });

    await expect(updated).resolves.toMatchObject({ status: 'done', dueDate: null });
  });

  it('deletes a task', async () => {
    const deleted = api.delete(task.id);

    const request = http.expectOne(`/api/v1/tasks/${task.id}`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(deleted).resolves.toBeUndefined();
  });

  it('rejects with the API error', async () => {
    const updated = api.update(task.id, { title: 'Renamed' });

    http
      .expectOne(`/api/v1/tasks/${task.id}`)
      .flush(
        { type: 'about:blank', title: 'Not Found', status: 404 },
        { status: 404, statusText: 'Not Found' },
      );

    await expect(updated).rejects.toMatchObject({ status: 404 });
  });
});
