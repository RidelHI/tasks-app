import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import type { TaskResponseDto } from '../src/tasks/dto/task-response.dto.js';
import { createTestApp } from './utils/create-test-app.js';
import { UUID_V7 } from './utils/uuid.js';

const TASKS = '/api/v1/tasks';

/** A task as it travels in JSON (dates as ISO strings). */
type TaskBody = Omit<TaskResponseDto, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;

  const http = () => request(app.getHttpServer());

  const createTask = async (body: object = { title: 'Ship v1' }): Promise<TaskBody> => {
    const response = await http().post(TASKS).send(body).expect(201);
    return response.body as TaskBody;
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.get(DataSource).query('TRUNCATE TABLE tasks');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/tasks', () => {
    it('creates a task and points to it in the Location header', async () => {
      const response = await http()
        .post(TASKS)
        .send({
          title: '  Ship v1 ',
          description: 'Everything in the backlog.',
          assignee: 'Jane Doe',
          dueDate: '2026-12-01',
        })
        .expect(201)
        .expect('Content-Type', /^application\/json/);

      const task = response.body as TaskBody;
      expect(task).toEqual({
        id: expect.stringMatching(UUID_V7),
        title: 'Ship v1',
        description: 'Everything in the backlog.',
        status: 'pending',
        assignee: 'Jane Doe',
        dueDate: '2026-12-01',
        createdAt: expect.any(String),
        updatedAt: task.createdAt,
      });
      expect(new Date(task.createdAt).toISOString()).toBe(task.createdAt);
      expect(response.headers.location).toBe(`${TASKS}/${task.id}`);
    });

    it('fills the optional fields with null', async () => {
      const task = await createTask({ title: 'Ship v1', status: 'in_progress' });

      expect(task).toMatchObject({
        status: 'in_progress',
        description: null,
        assignee: null,
        dueDate: null,
      });
    });

    it('answers invalid fields with a 400 problem that lists them', async () => {
      const response = await http()
        .post(TASKS)
        .send({ title: ' ', status: 'archived', dueDate: '2026-02-30', id: randomUUID() })
        .expect(400)
        .expect('Content-Type', /^application\/problem\+json/);

      expect(response.body).toMatchObject({
        status: 400,
        detail: 'The request contains invalid fields.',
        instance: TASKS,
      });
      const fields = (response.body as { errors: { field: string }[] }).errors.map((e) => e.field);
      expect(fields.sort()).toEqual(['dueDate', 'id', 'status', 'title']);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('returns the task', async () => {
      const task = await createTask({ title: 'Ship v1', assignee: 'Jane Doe' });

      const response = await http().get(`${TASKS}/${task.id}`).expect(200);

      expect(response.body).toEqual(task);
    });

    it('answers 404 for a task that does not exist', async () => {
      const id = randomUUID();

      const response = await http()
        .get(`${TASKS}/${id}`)
        .expect(404)
        .expect('Content-Type', /^application\/problem\+json/);

      expect(response.body).toMatchObject({ status: 404, detail: `Task ${id} was not found.` });
    });

    it('answers 400 for an id that is not a UUID', async () => {
      await http().get(`${TASKS}/42`).expect(400);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('changes only the fields sent and refreshes updatedAt', async () => {
      const task = await createTask({
        title: 'Ship v1',
        assignee: 'Jane Doe',
        dueDate: '2026-12-01',
      });

      const response = await http()
        .patch(`${TASKS}/${task.id}`)
        .send({ status: 'in_progress' })
        .expect(200);

      const updated = response.body as TaskBody;
      expect(updated).toEqual({ ...task, status: 'in_progress', updatedAt: expect.any(String) });
      expect(Date.parse(updated.updatedAt)).toBeGreaterThan(Date.parse(task.updatedAt));
    });

    it('clears the optional fields sent as null', async () => {
      const task = await createTask({
        title: 'Ship v1',
        description: 'Everything in the backlog.',
        assignee: 'Jane Doe',
        dueDate: '2026-12-01',
      });

      const response = await http()
        .patch(`${TASKS}/${task.id}`)
        .send({ description: null, assignee: null, dueDate: null })
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Ship v1',
        description: null,
        assignee: null,
        dueDate: null,
      });
    });

    it('keeps the task as it is for an empty change', async () => {
      const task = await createTask();

      const response = await http().patch(`${TASKS}/${task.id}`).send({}).expect(200);

      expect(response.body).toEqual(task);
    });

    it.each(['title', 'status'])(
      'rejects null for %s and leaves the task unchanged',
      async (field) => {
        const task = await createTask();

        const response = await http()
          .patch(`${TASKS}/${task.id}`)
          .send({ [field]: null })
          .expect(400);

        expect(response.body).toMatchObject({ errors: [expect.objectContaining({ field })] });
        await http().get(`${TASKS}/${task.id}`).expect(200, task);
      },
    );

    it('answers 404 for a task that does not exist', async () => {
      await http().patch(`${TASKS}/${randomUUID()}`).send({ status: 'done' }).expect(404);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('deletes the task', async () => {
      const task = await createTask();

      const response = await http().delete(`${TASKS}/${task.id}`).expect(204);

      expect(response.text).toBe('');
      await http().get(`${TASKS}/${task.id}`).expect(404);
    });

    it('answers 404 for a task that does not exist', async () => {
      await http().delete(`${TASKS}/${randomUUID()}`).expect(404);
    });
  });
});
