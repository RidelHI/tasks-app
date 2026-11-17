import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/env.validation.js';
import { buildDataSourceOptions } from './data-source-options.js';

/**
 * Entry point for the TypeORM CLI (migrations). It runs outside Nest, so it loads the local
 * .env itself (Node's native loader; variables already set in the environment win) and
 * validates it with the same rules as the app.
 */
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const env = validateEnv(process.env);

export default new DataSource({
  ...buildDataSourceOptions({
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  }),
  // The CLI is a human-facing tool: print readable SQL instead of the app's structured logs.
  logger: 'advanced-console',
});
