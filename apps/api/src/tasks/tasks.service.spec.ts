import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './task.entity.js';
import type { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

const ID = '019a8f2e-4c1b-7d3e-9f0a-1b2c3d4e5f60';

function aTask(overrides: Partial<Task> = {}): Task {
  return Object.assign(new Task(), {
    id: ID,
    title: 'Ship v1',
    description: null,
    status: 'pending',
    assignee: null,
    dueDate: null,
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date('2026-11-01T10:00:00Z'),
    ...overrides,
  });
}

function setup() {
  const repository = {
    create: vi.fn<TasksRepository['create']>(),
    findById: vi.fn<TasksRepository['findById']>(),
    update: vi.fn<TasksRepository['update']>(),
    delete: vi.fn<TasksRepository['delete']>(),
  };
  const service = new TasksService(repository as unknown as TasksRepository);
  return { service, repository };
}

/** DTOs as the ValidationPipe hands them to the controller. */
const createDto = (body: object) => plainToInstance(CreateTaskDto, body);
const updateDto = (body: object) => plainToInstance(UpdateTaskDto, body);

describe('TasksService', () => {
  describe('create', () => {
    it('stores the task, with null optional fields and the default status', async () => {
      const { service, repository } = setup();
      const created = aTask();
      repository.create.mockResolvedValue(created);

      await expect(service.create(createDto({ title: 'Ship v1' }))).resolves.toBe(created);
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Ship v1',
        description: null,
        status: 'pending',
        assignee: null,
        dueDate: null,
      });
    });

    it('keeps the values it receives', async () => {
      const { service, repository } = setup();
      const data = {
        title: 'Ship v1',
        description: 'Everything in the backlog.',
        status: 'in_progress',
        assignee: 'Jane Doe',
        dueDate: '2026-12-01',
      } as const;
      repository.create.mockResolvedValue(aTask(data));

      await service.create(createDto(data));

      expect(repository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('findById', () => {
    it('returns the task', async () => {
      const { service, repository } = setup();
      const task = aTask();
      repository.findById.mockResolvedValue(task);

      await expect(service.findById(ID)).resolves.toBe(task);
    });

    it('fails with a 404 when the task does not exist', async () => {
      const { service, repository } = setup();
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(ID)).rejects.toThrow(
        new NotFoundException(`Task ${ID} was not found.`),
      );
    });
  });

  describe('update', () => {
    it('changes only the fields present in the request', async () => {
      const { service, repository } = setup();
      const updated = aTask({ status: 'done' });
      repository.update.mockResolvedValue(updated);

      await expect(service.update(ID, updateDto({ status: 'done', assignee: null }))).resolves.toBe(
        updated,
      );
      // Strict: the absent fields must not reach the repository, not even as `undefined`.
      expect(repository.update.mock.calls[0]).toStrictEqual([
        ID,
        { status: 'done', assignee: null },
      ]);
    });

    it('fails with a 404 when the task does not exist', async () => {
      const { service, repository } = setup();
      repository.update.mockResolvedValue(null);

      await expect(service.update(ID, updateDto({ status: 'done' }))).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deletes the task', async () => {
      const { service, repository } = setup();
      repository.delete.mockResolvedValue(true);

      await expect(service.delete(ID)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(ID);
    });

    it('fails with a 404 when the task does not exist', async () => {
      const { service, repository } = setup();
      repository.delete.mockResolvedValue(false);

      await expect(service.delete(ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
