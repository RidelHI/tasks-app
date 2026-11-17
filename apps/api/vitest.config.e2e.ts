import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['reflect-metadata'],
    // Keep test output readable: the app's request logs are not part of the assertions.
    env: { LOG_LEVEL: 'silent' },
  },
});
