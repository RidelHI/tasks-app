import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTaskDto } from '../../tasks/dto/create-task.dto.js';
import { TASK_STATUSES } from '../../tasks/task-status.js';
import { buildDemoTasks } from './demo-tasks.js';

// Local time on purpose: due dates follow the local calendar day.
const now = new Date(2026, 2, 1, 10, 30);
const today = '2026-03-01';
const tasks = buildDemoTasks(now);

describe('buildDemoTasks', () => {
  it('fills three pages of 20 tasks, the last one partly', () => {
    expect(tasks).toHaveLength(48);
  });

  it('gives every task a different title', () => {
    expect(new Set(tasks.map((task) => task.title)).size).toBe(tasks.length);
  });

  it('builds tasks the API would accept', async () => {
    for (const { title, description, status, assignee, dueDate } of tasks) {
      const dto = plainToInstance(CreateTaskDto, { title, description, status, assignee, dueDate });
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      expect(errors, title).toEqual([]);
    }
  });

  it('dates them newest first, every 14 hours back to four weeks ago', () => {
    const ages = tasks.map((task) => (now.getTime() - task.createdAt.getTime()) / 3_600_000);

    expect(ages).toEqual(tasks.map((_, index) => (index + 1) * 14));
    expect(tasks.every((task) => task.updatedAt === task.createdAt)).toBe(true);
  });

  it('counts the due dates from the local day it runs, across months', () => {
    const dueDates = tasks.map((task) => task.dueDate).filter((date) => date !== null);

    expect(dueDates).toContain(today);
    expect(dueDates).toContain('2026-02-27'); // two days before
    expect(dueDates).toContain('2026-03-31'); // thirty days after
    expect(dueDates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
  });

  it('moves the due dates with the day it runs', () => {
    const nextDay = buildDemoTasks(new Date(2026, 2, 2, 10, 30));

    expect(nextDay[0]?.dueDate).toBe('2026-03-08');
    expect(tasks[0]?.dueDate).toBe('2026-03-07');
  });

  it('covers what the list can show and filter', () => {
    const assignees = tasks.map((task) => task.assignee);
    const overdue = tasks.filter(
      (task) => task.dueDate !== null && task.dueDate < today && task.status !== 'done',
    );

    expect(new Set(tasks.map((task) => task.status))).toEqual(new Set(TASK_STATUSES));
    expect(new Set(assignees.filter((name) => name !== null)).size).toBe(6);
    expect(assignees.filter((name) => name === 'Ana López').length).toBeGreaterThan(1);
    expect(assignees).toContain(null);
    expect(tasks.some((task) => task.description === null)).toBe(true);
    expect(tasks.some((task) => task.dueDate === null)).toBe(true);
    expect(overdue.length).toBeGreaterThan(0);
  });
});
