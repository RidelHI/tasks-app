import type { MigrationInterface } from 'typeorm';

/**
 * Every migration, in the order they were created. Register each new migration class here
 * after generating it (see AGENTS.md); TypeORM runs the pending ones by timestamp.
 */
export const MIGRATIONS: Array<new () => MigrationInterface> = [];
