import type { MigrationInterface } from 'typeorm';
import { CreateTasks1794912475625 } from './1794912475625-CreateTasks.js';
import { AddTaskListIndexes1794927291402 } from './1794927291402-AddTaskListIndexes.js';

/**
 * Every migration, in the order they were created. Register each new migration class here
 * after generating it (see AGENTS.md); TypeORM runs the pending ones by timestamp.
 */
export const MIGRATIONS: Array<new () => MigrationInterface> = [
  CreateTasks1794912475625,
  AddTaskListIndexes1794927291402,
];
