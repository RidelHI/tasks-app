import { inject } from 'vitest';

/**
 * Runs in every test worker before the test files: exposes the e2e database started by the
 * global setup through the same DB_* variables the application reads in any environment.
 */
const database = inject('database');

process.env.DB_HOST = database.host;
process.env.DB_PORT = String(database.port);
process.env.DB_USERNAME = database.username;
process.env.DB_PASSWORD = database.password;
process.env.DB_NAME = database.database;
