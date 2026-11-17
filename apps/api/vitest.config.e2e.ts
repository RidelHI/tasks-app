import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Files share one database (and some revert migrations): run them one after another.
    fileParallelism: false,
    // One disposable PostgreSQL container per run (requires Docker).
    globalSetup: ['./test/setup/postgres.global-setup.ts'],
    setupFiles: ['reflect-metadata', './test/setup/database-env.ts'],
    // Silent logs keep the output readable; one allowed origin lets the CORS tests run.
    env: { LOG_LEVEL: 'silent', CORS_ORIGINS: 'http://localhost:4200' },
  },
});
