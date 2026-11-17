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
    // Keep test output readable: the app's request logs are not part of the assertions.
    env: { LOG_LEVEL: 'silent' },
  },
});
