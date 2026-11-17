import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { toFieldErrors } from '../../common/errors/validation.exception.js';
import { CreateTaskDto } from './create-task.dto.js';
import { UpdateTaskDto } from './update-task.dto.js';

/** Transforms and validates a body like the global ValidationPipe does. */
async function check<T extends object>(dtoClass: new () => T, body: object) {
  const dto = plainToInstance(dtoClass, body);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, invalidFields: toFieldErrors(errors).map((error) => error.field) };
}

const title = 'Ship v1';

describe('CreateTaskDto', () => {
  it('accepts a complete task', async () => {
    const { invalidFields } = await check(CreateTaskDto, {
      title,
      description: 'Everything in the backlog.',
      status: 'in_progress',
      assignee: 'Jane Doe',
      dueDate: '2026-12-01',
    });

    expect(invalidFields).toEqual([]);
  });

  it('only requires the title', async () => {
    expect((await check(CreateTaskDto, { title })).invalidFields).toEqual([]);
  });

  it('accepts null for the optional fields', async () => {
    const body = { title, description: null, assignee: null, dueDate: null };

    expect((await check(CreateTaskDto, body)).invalidFields).toEqual([]);
  });

  it('accepts the maximum lengths', async () => {
    const body = {
      title: 't'.repeat(200),
      description: 'd'.repeat(2000),
      assignee: 'a'.repeat(100),
    };

    expect((await check(CreateTaskDto, body)).invalidFields).toEqual([]);
  });

  it('removes the whitespace around the title and the assignee', async () => {
    const { dto } = await check(CreateTaskDto, { title: '  Ship v1 ', assignee: ' Jane Doe  ' });

    expect(dto).toMatchObject({ title: 'Ship v1', assignee: 'Jane Doe' });
  });

  it.each([
    ['title', 'missing', {}],
    ['title', 'only whitespace', { title: '   ' }],
    ['title', 'too long', { title: 't'.repeat(201) }],
    ['title', 'not a string', { title: 42 }],
    ['description', 'too long', { title, description: 'd'.repeat(2001) }],
    ['status', 'unknown', { title, status: 'archived' }],
    ['status', 'null', { title, status: null }],
    ['assignee', 'only whitespace', { title, assignee: '  ' }],
    ['assignee', 'too long', { title, assignee: 'a'.repeat(101) }],
    ['dueDate', 'an impossible date', { title, dueDate: '2026-02-30' }],
    ['dueDate', 'a date with time', { title, dueDate: '2026-12-01T10:00:00Z' }],
    ['id', 'not accepted from clients', { title, id: '019a8f2e-4c1b-7d3e-9f0a-1b2c3d4e5f60' }],
  ])('rejects a %s that is %s', async (field, _reason, body) => {
    expect((await check(CreateTaskDto, body)).invalidFields).toEqual([field]);
  });
});

describe('UpdateTaskDto', () => {
  it('accepts an empty change', async () => {
    expect((await check(UpdateTaskDto, {})).invalidFields).toEqual([]);
  });

  it('accepts a single field', async () => {
    expect((await check(UpdateTaskDto, { status: 'done' })).invalidFields).toEqual([]);
  });

  it('accepts null to clear the optional fields', async () => {
    const body = { description: null, assignee: null, dueDate: null };

    expect((await check(UpdateTaskDto, body)).invalidFields).toEqual([]);
  });

  it.each(['title', 'status'])('rejects null for the required field %s', async (field) => {
    expect((await check(UpdateTaskDto, { [field]: null })).invalidFields).toEqual([field]);
  });

  it('validates the fields it receives like on creation', async () => {
    const { invalidFields } = await check(UpdateTaskDto, { title: '  ', dueDate: '2026-13-01' });

    expect(invalidFields).toEqual(['title', 'dueDate']);
  });
});
